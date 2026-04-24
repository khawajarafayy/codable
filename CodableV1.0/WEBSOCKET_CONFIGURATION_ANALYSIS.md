# Backend Server Configuration - WebSocket Analysis & Fixes

## ✅ VERIFICATION: WebSocket Configuration is Correct

### Current Architecture:

```
┌─────────────────────────────────────────┐
│      Express App (Express.js)           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Single HTTP Server (http.createServer)│
│   PORT: 3000                            │
└─────────────────────────────────────────┘
                    ↓
        ┌───────────┴────────────┐
        ↓                        ↓
┌──────────────────┐  ┌─────────────────────┐
│ WebSocket Server │  │ WebSocket Server    │
│ Path: /ws/code   │  │ Path: /ws/notifications│
│ (Code Execution) │  │ (Classroom Events)  │
└──────────────────┘  └─────────────────────┘
```

### Key Points:

✅ **Single HTTP Server**: Only ONE `http.createServer(app)` instance
✅ **Only ONE listen() call**: Single `server.listen(PORT)` 
✅ **Multiple WebSocket paths**: Two WebSocket servers attached to same server with different paths
✅ **Proper attachment**: Both use `{ server, path: "/ws/..." }` pattern

---

## 🔍 Code Analysis

### server.js (Lines 75-105):
```javascript
const app = express();
const server = http.createServer(app);  // ← SINGLE server instance

// Routes...
app.use("/auth", authRoute);
app.use("/api/student-class", studentClassRoutes);
// ... more routes

startWebSocketServer(server);  // ← Pass server to WebSocket setup

connectDB().then(() => {
  server.listen(PORT, () => {  // ← ONLY ONE listen() call
    console.log(`Server running at http://localhost:${PORT}`);
  }).on('error', (err) => {
    // Error handling...
  });
});
```

### websocket/codeRunner.js (Lines 69-72):
```javascript
export function startWebSocketServer(server) {
  const wss = new WebSocketServer({ server, path: '/ws/code' });
  const notificationWss = new WebSocketServer({ server, path: '/ws/notifications' });
  
  // Both WebSocket servers attached to SAME server instance
  // Different paths prevent conflicts
}
```

---

## 🐛 Issues Fixed

### 1. **Mongoose Import Bug** ❌→✅
**Before:**
```javascript
import { mongoose } from "mongoose";  // ❌ Named import (wrong)
```

**After:**
```javascript
import mongoose from "mongoose";      // ✅ Default import (correct)
```

### 2. **Missing Error Handler** ❌→✅
**Before:**
```javascript
server.listen(PORT, () => 
  console.log(`Server running at http://localhost:${PORT}`)
);
// ❌ No error handling - silent failure if EADDRINUSE occurs
```

**After:**
```javascript
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ ERROR: Port ${PORT} is already in use!`);
    console.error(`To fix this, run: taskkill /F /IM node.exe`);
    process.exit(1);
  }
});
// ✅ Detects and reports EADDRINUSE gracefully
```

### 3. **No DB Error Handling** ❌→✅
**Before:**
```javascript
connectDB().then(() => {
  server.listen(PORT, ...);
});
// ❌ No .catch() - errors silently ignored
```

**After:**
```javascript
connectDB().then(() => {
  server.listen(PORT, ...);
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
// ✅ Properly catches and reports database errors
```

---

## 🚀 Port Usage Summary

| Port | Service | Path | Status |
|------|---------|------|--------|
| 3000 | HTTP Server | / | ✅ Main server |
| 3000 | WebSocket - Code | /ws/code | ✅ Attached to HTTP server |
| 3000 | WebSocket - Notifications | /ws/notifications | ✅ Attached to HTTP server |

**No conflicts**: All services share the single port 3000 through the single HTTP server instance.

---

## 🛠️ How to Verify

### Test 1: Check server starts without EADDRINUSE
```bash
cd codable-backend
npm start
# Should show: "Server running at http://localhost:3000"
```

### Test 2: Test WebSocket connections
```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Test code execution WebSocket
curl "http://localhost:3000/ws/code"

# Terminal 3: Test notifications WebSocket
curl "http://localhost:3000/ws/notifications?token=..."
```

### Test 3: If still getting EADDRINUSE
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill all Node processes
taskkill /F /IM node.exe

# Try again
npm start
```

---

## ✅ Conclusion

**WebSocket Configuration: ✅ CORRECT**
- Single HTTP server instance
- Two WebSocket endpoints on different paths
- No port conflicts by design

**Fixes Applied:**
1. ✅ Fixed mongoose import (was using named import)
2. ✅ Added EADDRINUSE error detection and messaging
3. ✅ Added database connection error handling

The EADDRINUSE error is caused by **leftover Node processes from previous test runs**, not a configuration issue. The new error handler will catch and report this clearly.
