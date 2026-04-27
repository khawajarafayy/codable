import { WebSocketServer } from 'ws';
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { analyzeComplexity } from '../utils/complexityAnalyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '../temp');
const RUNNER_DEBUG_LOGS = process.env.CODE_RUNNER_DEBUG === 'true';

// Map to store user connections: userId -> Set of WebSocket connections
const userConnections = new Map();

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Broadcast a message to a specific user's all WebSocket connections
 * @param {string} userId - The user ID to broadcast to
 * @param {Object} message - The message object to send
 */
export function broadcastToUser(userId, message) {
  const userSockets = userConnections.get(userId);
  if (userSockets) {
    userSockets.forEach((ws) => {
      if (ws.readyState === 1) { // 1 = OPEN
        ws.send(JSON.stringify(message));
      }
    });
  }
}

/**
 * Get memory usage of process (cross-platform)
 */
function getProcessMemory(pid) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      // Windows: Use WMIC or tasklist
      exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, (err, stdout) => {
        if (err) {
          console.log('Memory monitoring error:', err.message);
          return resolve(0);
        }
        // Parse CSV output: "Image Name","PID","Session Name","Session#","Mem Usage"
        // Example: "java.exe","12345","Console","1","50,240 K"
        const match = stdout.match(/"[^"]+","[^"]+","[^"]+","[^"]+","([0-9,]+)\s*K"/);
        if (match) {
          const memoryKB = parseInt(match[1].replace(/,/g, ''));
          resolve(memoryKB);
        } else {
          resolve(0);
        }
      });
    } else {
      // Linux/Mac: Use ps
      exec(`ps -o rss= -p ${pid}`, (err, stdout) => {
        if (err) return resolve(0);
        resolve(parseInt(stdout.trim()) || 0);
      });
    }
  });
}

export function startWebSocketServer(server) {
  // Keep compiler websocket on a dedicated endpoint.
  // "/ws/code" is kept as a legacy alias for existing clients.
  const codePaths = new Set(['/ws/compiler', '/ws/code']);
  const notificationPath = '/ws/notifications';

  // Use explicit upgrade routing to avoid protocol/path collisions.
  const wss = new WebSocketServer({ noServer: true });
  const notificationWss = new WebSocketServer({ noServer: true });

  notificationWss.on('connection', (ws, req) => {
    try {
      // Extract token from query params or Authorization header
      const url = new URL(req.url, `http://${req.headers.host}`);
      let token = url.searchParams.get('token');

      if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        ws.close(4001, 'Token required');
        return;
      }

      // Verify token and extract user ID
      let userId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (error) {
        ws.close(4003, 'Invalid token');
        return;
      }

      console.log(`✅ User ${userId} connected to notifications`);

      // Add user to the connections map
      if (!userConnections.has(userId)) {
        userConnections.set(userId, new Set());
      }
      userConnections.get(userId).add(ws);

      // Handle user disconnect
      ws.on('close', () => {
        console.log(`❌ User ${userId} disconnected from notifications`);
        const userSockets = userConnections.get(userId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) {
            userConnections.delete(userId);
          }
        }
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });
    } catch (error) {
      console.error('Error in notification WebSocket connection:', error);
      ws.close(4000, 'Server error');
    }
  });

  wss.on('connection', (ws) => {
    let javaProcess = null;
    let userTempDir = null;
    let executionStartTime = null;
    let memoryMonitorInterval = null;
    let peakMemory = 0;
    let pendingInputs = [];

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'run') {
          pendingInputs = [];

          // Create unique temp directory for this user's session
          userTempDir = path.join(TEMP_DIR, `session_${Date.now()}`);
          fs.mkdirSync(userTempDir, { recursive: true });

          // Extract the public class name from the code (default to Main if not found)
          const classNameMatch = data.code.match(/public\s+class\s+(\w+)/);
          const className = classNameMatch ? classNameMatch[1] : 'Main';
          
          const tempFile = path.join(userTempDir, `${className}.java`);

          // Write code to the Java file with extracted class name
          fs.writeFileSync(tempFile, data.code);

          if (RUNNER_DEBUG_LOGS) {
            console.log('\n=== CODE ANALYSIS START ===');
            console.log('Code length:', data.code.length);
            console.log('Code preview:', data.code.substring(0, 200));
          }

          // Analyze complexity before running
          const complexityAnalysis = analyzeComplexity(data.code);
          if (RUNNER_DEBUG_LOGS) {
            console.log('📊 Complexity Analysis Result:', complexityAnalysis);
          }
          
          ws.send(JSON.stringify({ 
            type: 'complexity', 
            data: complexityAnalysis 
          }));
          if (RUNNER_DEBUG_LOGS) {
            console.log('✅ Sent complexity message to frontend');
          }

          // Compile Java
          const javac = spawn('javac', [tempFile]);

          let compileError = '';
          javac.stderr.on('data', (err) => {
            compileError += err.toString();
          });

          javac.on('close', (code) => {
            if (code !== 0) {
              ws.send(JSON.stringify({ type: 'error', data: compileError }));
              ws.send(JSON.stringify({ type: 'exit', code }));
              cleanup();
              return;
            }

            // Start execution timer
            executionStartTime = process.hrtime.bigint();
            peakMemory = 0;

            // Run Java (using the extracted class name)
            javaProcess = spawn('java', ['-cp', userTempDir, className]);
            if (RUNNER_DEBUG_LOGS) {
              console.log('\n🚀 Java process started with PID:', javaProcess.pid, 'Class:', className);
            }

            // If frontend sent input before java process was ready, flush now.
            if (Array.isArray(pendingInputs) && pendingInputs.length > 0) {
              pendingInputs.forEach((chunk) => {
                javaProcess.stdin.write(chunk);
              });
              pendingInputs = [];
            }

            // Support non-interactive runs by accepting "input" in the run payload.
            if (typeof data.input === 'string' && data.input.length > 0) {
              javaProcess.stdin.write(data.input.endsWith('\n') ? data.input : `${data.input}\n`);
            }

            // Monitor memory usage in the background with low overhead.
            memoryMonitorInterval = setInterval(async () => {
              if (javaProcess && javaProcess.pid) {
                const currentMemory = await getProcessMemory(javaProcess.pid);
                if (currentMemory > 0) {
                  peakMemory = Math.max(peakMemory, currentMemory);
                  if (RUNNER_DEBUG_LOGS) {
                    console.log('💾 Memory sample:', currentMemory, 'KB, Peak:', peakMemory, 'KB');
                  }
                }
              }
            }, 250);

            javaProcess.stdout.on('data', (output) => {
              ws.send(JSON.stringify({ type: 'output', data: output.toString() }));
            });

            javaProcess.stderr.on('data', (err) => {
              ws.send(JSON.stringify({ type: 'error', data: err.toString() }));
            });

            javaProcess.on('close', (exitCode) => {
              // Stop memory monitoring
              if (memoryMonitorInterval) {
                clearInterval(memoryMonitorInterval);
              }

              // Calculate execution time
              const executionEndTime = process.hrtime.bigint();
              const start = typeof executionStartTime === 'bigint' ? executionStartTime : executionEndTime;
              const executionTimeNs = executionEndTime - start;
              const executionTimeMs = Number(executionTimeNs) / 1_000_000;

              if (RUNNER_DEBUG_LOGS) {
                console.log('\n=== EXECUTION METRICS ===');
                console.log('Execution time:', executionTimeMs.toFixed(2), 'ms');
                console.log('Peak memory:', peakMemory, 'KB');
                console.log('Time complexity:', complexityAnalysis.timeComplexity);
                console.log('Space complexity:', complexityAnalysis.spaceComplexity);
              }

              // Send metrics
              const metricsData = {
                execution_time_ms: executionTimeMs.toFixed(2),
                execution_time_formatted: formatExecutionTime(executionTimeMs),
                peak_memory_kb: peakMemory,
                peak_memory_formatted: formatMemory(peakMemory),
                time_complexity: complexityAnalysis.timeComplexity,
                space_complexity: complexityAnalysis.spaceComplexity
              };
              
              if (RUNNER_DEBUG_LOGS) {
                console.log('📤 Sending metrics:', metricsData);
              }
              ws.send(JSON.stringify({ 
                type: 'metrics', 
                data: metricsData
              }));

              ws.send(JSON.stringify({ type: 'exit', code: exitCode }));
              cleanup();
            });
          });
        }

        if (data.type === 'input' && javaProcess) {
          javaProcess.stdin.write(data.data + '\n');
        } else if (data.type === 'input' && !javaProcess) {
          // Queue input until compiler + java process are ready.
          pendingInputs.push((data.data || '') + '\n');
        }

        if (data.type === 'stop' && javaProcess) {
          javaProcess.kill();
          cleanup();
        }
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', data: err.message }));
      }
    });

    ws.on('close', cleanup);

    function cleanup() {
      if (memoryMonitorInterval) {
        clearInterval(memoryMonitorInterval);
        memoryMonitorInterval = null;
      }
      if (javaProcess) {
        javaProcess.kill();
        javaProcess = null;
      }
      if (userTempDir && fs.existsSync(userTempDir)) {
        // Clean up temp directory
        fs.readdirSync(userTempDir).forEach(file => {
          fs.unlinkSync(path.join(userTempDir, file));
        });
        fs.rmdirSync(userTempDir);
      }
      executionStartTime = null;
      peakMemory = 0;
      pendingInputs = [];
    }

    function formatExecutionTime(ms) {
      if (ms < 1) {
        return `${(ms * 1000).toFixed(2)}μs`;
      } else if (ms < 1000) {
        return `${ms.toFixed(2)}ms`;
      } else {
        return `${(ms / 1000).toFixed(2)}s`;
      }
    }

    function formatMemory(kb) {
      if (kb < 1024) {
        return `${kb.toFixed(0)}KB`;
      } else {
        return `${(kb / 1024).toFixed(2)}MB`;
      }
    }
  });

  server.on('upgrade', (req, socket, head) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;

      if (codePaths.has(pathname)) {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
        return;
      }

      if (pathname === notificationPath) {
        notificationWss.handleUpgrade(req, socket, head, (ws) => {
          notificationWss.emit('connection', ws, req);
        });
        return;
      }

      socket.destroy();
    } catch (error) {
      console.error('Upgrade routing error:', error);
      socket.destroy();
    }
  });

  console.log('WebSocket server started on /ws/compiler (legacy alias: /ws/code)');
}