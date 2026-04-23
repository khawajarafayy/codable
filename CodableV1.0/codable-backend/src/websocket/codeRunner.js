import { WebSocketServer } from 'ws';
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeComplexity } from '../utils/complexityAnalyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '../temp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
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
          console.log(`📊 Memory for PID ${pid}: ${memoryKB} KB`);
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
  const wss = new WebSocketServer({ server, path: '/ws/code' });

  wss.on('connection', (ws) => {
    let javaProcess = null;
    let userTempDir = null;
    let executionStartTime = null;
    let memoryMonitorInterval = null;
    let peakMemory = 0;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'run') {
          // Create unique temp directory for this user's session
          userTempDir = path.join(TEMP_DIR, `session_${Date.now()}`);
          fs.mkdirSync(userTempDir, { recursive: true });

          // Extract the public class name from the code (default to Main if not found)
          const classNameMatch = data.code.match(/public\s+class\s+(\w+)/);
          const className = classNameMatch ? classNameMatch[1] : 'Main';
          
          const tempFile = path.join(userTempDir, `${className}.java`);

          // Write code to the Java file with extracted class name
          fs.writeFileSync(tempFile, data.code);

          console.log('\n=== CODE ANALYSIS START ===');
          console.log('Code length:', data.code.length);
          console.log('Code preview:', data.code.substring(0, 200));

          // Analyze complexity before running
          const complexityAnalysis = analyzeComplexity(data.code);
          console.log('📊 Complexity Analysis Result:', complexityAnalysis);
          
          ws.send(JSON.stringify({ 
            type: 'complexity', 
            data: complexityAnalysis 
          }));
          console.log('✅ Sent complexity message to frontend');

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
            console.log('\n🚀 Java process started with PID:', javaProcess.pid, 'Class:', className);

            // Monitor memory usage every 50ms
            memoryMonitorInterval = setInterval(async () => {
              if (javaProcess && javaProcess.pid) {
                const currentMemory = await getProcessMemory(javaProcess.pid);
                if (currentMemory > 0) {
                  peakMemory = Math.max(peakMemory, currentMemory);
                  console.log('💾 Memory sample:', currentMemory, 'KB, Peak:', peakMemory, 'KB');
                }
              }
            }, 50);

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
              const executionTimeNs = executionEndTime - executionStartTime;
              const executionTimeMs = Number(executionTimeNs) / 1_000_000;

              console.log('\n=== EXECUTION METRICS ===');
              console.log('Execution time:', executionTimeMs.toFixed(2), 'ms');
              console.log('Peak memory:', peakMemory, 'KB');
              console.log('Time complexity:', complexityAnalysis.timeComplexity);
              console.log('Space complexity:', complexityAnalysis.spaceComplexity);

              // Send metrics
              const metricsData = {
                execution_time_ms: executionTimeMs.toFixed(2),
                execution_time_formatted: formatExecutionTime(executionTimeMs),
                peak_memory_kb: peakMemory,
                peak_memory_formatted: formatMemory(peakMemory),
                time_complexity: complexityAnalysis.timeComplexity,
                space_complexity: complexityAnalysis.spaceComplexity
              };
              
              console.log('📤 Sending metrics:', metricsData);
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

  console.log('WebSocket server started on /ws/code');
}