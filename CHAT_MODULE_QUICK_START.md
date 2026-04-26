# Chat Module - Quick Start Guide

## Prerequisites
- Node.js and npm installed
- Backend server running on port 3000 (or configured port)
- Frontend running on port 5173
- MongoDB connected and running
- User authenticated with valid JWT token

## Starting the Chat Module

### Step 1: Start the Backend Server

```bash
cd codable-backend
npm install  # If not done already (Socket.IO should be installed)
npm run dev
```

Expected output:
```
✓ Server running at http://localhost:3000
✓ Chat socket initialized on /chat namespace
```

### Step 2: Start the Frontend Development Server

```bash
cd codable-frontend
npm run dev
```

Expected output:
```
✓ ROLLDOWN-VITE ready in XXXms
  ➜ Local: http://localhost:5173/
```

## Testing the Chat Module

### Test Case 1: Instructor Using Chat

1. **Login as Instructor**
   - Go to http://localhost:5173/
   - Login with instructor credentials

2. **Navigate to Class**
   - Click "Classes" in mentor dashboard
   - Select a class

3. **Open Chat Tab**
   - Click the "Chat" tab at the top
   - You should see the chat interface load

4. **Send a Message**
   - Type a message: "Hello, this is a test message"
   - Press Enter or click Send button
   - Message should appear immediately in chat

5. **Edit a Message**
   - Hover over your message
   - Click the edit icon (pencil)
   - Modify the text
   - Click the checkmark to save
   - Message should show "(edited)" label

6. **Delete a Message**
   - Hover over your message
   - Click the delete icon (trash)
   - Confirm deletion
   - Message should disappear from chat

### Test Case 2: Student Using Chat

1. **Login as Student**
   - Go to http://localhost:5173/
   - Login with student credentials

2. **Navigate to Class**
   - Click "My Classes" 
   - Select a class

3. **Open Chat Tab**
   - Click the "Chat" tab
   - View all class messages

4. **Send a Message**
   - Type a question: "Can you explain this topic?"
   - Press Enter
   - Message appears for all participants

### Test Case 3: Real-Time Updates

1. **Open Two Browser Windows**
   - Window 1: Login as Instructor
   - Window 2: Login as Student
   - Both navigate to the same class

2. **Send Message from Window 1**
   - In instructor window, send a message
   - Message should appear instantly in student window

3. **Verify Real-Time Delivery**
   - Send multiple messages from both windows
   - Each should appear immediately in the other window

### Test Case 4: Typing Indicators

1. **Open Two Browser Windows**
   - Both logged in to same class chat

2. **Start Typing**
   - In window 1, start typing a message
   - In window 2, you should see "User is typing..." indicator
   - Stop typing
   - Indicator should disappear after 3 seconds

### Test Case 5: Message History

1. **Load Chat**
   - Open chat and see previous messages
   - Scroll up to load more messages (pagination)
   - Old messages load correctly

2. **Close and Reopen**
   - Close the chat
   - Navigate away from class
   - Return to class
   - Previous messages still visible

## Debugging Tips

### Check Socket Connection

Open browser console and run:
```javascript
// Check if Socket.IO is connected
console.log(socket?.connected)  // Should be true
```

### View Network Activity

1. Open DevTools (F12)
2. Go to Network tab
3. Filter for "WS" (WebSocket)
4. You should see `/chat` connection
5. Monitor messages tab for real-time events

### Check Backend Logs

Watch terminal for backend server:
```
✅ User connected to chat: userId (socketId)
💬 Message from userName in class classId
✅ userName joined class classId
```

## Common Issues & Solutions

### Issue: Chat not connecting
- Check backend is running on correct port
- Verify VITE_API_URL environment variable
- Check browser console for errors
- Try hard refresh (Ctrl+Shift+R)

### Issue: Messages not sending
- Ensure you're logged in with valid token
- Check that you're a member of the class
- Look for error toast notifications
- Check network tab for failed requests

### Issue: Messages not appearing in real-time
- Verify Socket.IO connection is active
- Check that socket.io-client is installed
- Restart both frontend and backend
- Clear browser cache

### Issue: Can't send messages
- Verify user role (instructor/student)
- Check class membership
- Ensure message is not empty
- Look for validation error messages

## Testing with Multiple Users

### Setup Multiple Test Accounts

1. Create test instructor account
2. Create 2-3 test student accounts
3. Have instructor create a test class
4. Have students join using class code
5. Open multiple browser tabs/windows
6. Log in as different users in each window

### Simulate Real Classroom

1. Open 4+ browser windows
2. Log as instructor + students
3. Have students send questions
4. Instructor replies in real-time
5. Observe typing indicators
6. Test message editing/deletion

## Performance Testing

### Test with Many Messages

1. Send 100+ messages rapidly
2. Chat should remain responsive
3. Scroll performance should be smooth
4. No memory leaks in DevTools

### Test Connection Stability

1. Send messages continuously
2. Open DevTools Network tab
3. Throttle connection (slow 3G)
4. Messages should still send/receive
5. Reconnection should be automatic

## API Testing with Curl

### Get Chat History
```bash
curl -X GET http://localhost:3000/api/chat/classId \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Send Message
```bash
curl -X POST http://localhost:3000/api/chat/classId \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'
```

### Edit Message
```bash
curl -X PATCH http://localhost:3000/api/chat/classId/messages/messageId \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Updated message"}'
```

### Delete Message
```bash
curl -X DELETE http://localhost:3000/api/chat/classId/messages/messageId \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Next Steps

1. ✅ Test chat functionality thoroughly
2. ✅ Verify real-time updates work
3. ✅ Check permission/security
4. ✅ Test with multiple users
5. ✅ Monitor performance
6. ✅ Deploy to production
7. ✅ Gather user feedback
8. ✅ Implement enhancements

## Support

If you encounter issues:
1. Check CHAT_MODULE_DOCUMENTATION.md for detailed info
2. Review console and server logs
3. Check network tab in DevTools
4. Verify all prerequisites are met
5. Try restarting both servers
6. Clear browser cache and localStorage

Happy chatting! 🚀
