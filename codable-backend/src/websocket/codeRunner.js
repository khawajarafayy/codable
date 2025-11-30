import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '../temp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export function startWebSocketServer(server) {
  const wss = new WebSocketServer({ server, path: '/ws/code' });

  wss.on('connection', (ws) => {
    let javaProcess = null;
    let userTempDir = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'run') {
          // Create unique temp directory for this user's session
          userTempDir = path.join(TEMP_DIR, `session_${Date.now()}`);
          fs.mkdirSync(userTempDir, { recursive: true });

          const tempFile = path.join(userTempDir, 'Main.java');

          // Write code to Main.java
          fs.writeFileSync(tempFile, data.code);

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

            // Run Java (Main class in userTempDir)
            javaProcess = spawn('java', ['-cp', userTempDir, 'Main']);

            javaProcess.stdout.on('data', (output) => {
              ws.send(JSON.stringify({ type: 'output', data: output.toString() }));
            });

            javaProcess.stderr.on('data', (err) => {
              ws.send(JSON.stringify({ type: 'error', data: err.toString() }));
            });

            javaProcess.on('close', (exitCode) => {
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
    }
  });

  console.log('WebSocket server started on /ws/code');
}