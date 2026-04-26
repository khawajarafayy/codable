# Chat Module Implementation - Complete Guide

## Overview
A comprehensive real-time classroom chat module has been implemented for the Codable platform, enabling instructors and students to communicate within their classes. The implementation uses Socket.IO for real-time messaging and MongoDB for message persistence.

---

## Architecture

### Technology Stack
- **Backend:** Node.js/Express, Socket.IO, MongoDB
- **Frontend:** React, Socket.IO Client, Tailwind CSS
- **Real-time Communication:** Socket.IO with WebSocket support
- **Database:** MongoDB (ChatMessage model)

### Key Components

#### Backend Components

1. **ChatMessage Model** (`src/models/ChatMessage.js`)
   - Stores all chat messages with metadata
   - Fields: classId, senderId, senderName, senderEmail, senderRole, message, isEdited, editedAt
   - Indexed on classId and createdAt for efficient queries

2. **Chat Controller** (`src/controllers/chatController.js`)
   - `getChatHistory`: Fetches paginated chat history for a class
   - `createChatMessage`: Saves new messages to database
   - `editChatMessage`: Allows users to edit their messages
   - `deleteChatMessage`: Deletes messages (sender or instructor only)

3. **Chat Routes** (`src/routes/chatRoutes.js`)
   - REST API endpoints for CRUD operations
   - `GET /api/chat/:classId` - Fetch message history
   - `POST /api/chat/:classId` - Send new message
   - `PATCH /api/chat/:classId/messages/:messageId` - Edit message
   - `DELETE /api/chat/:classId/messages/:messageId` - Delete message

4. **Socket.IO Chat Handler** (`src/websocket/chatSocket.js`)
   - Manages real-time WebSocket connections
   - Events:
     - `joinClass` - User joins a classroom chat room
     - `sendMessage` - Broadcast messages to all users in class
     - `editMessage` - Real-time message edit updates
     - `deleteMessage` - Real-time message deletion
     - `typing` - Typing indicator
     - `stopTyping` - Stop typing indicator
     - `disconnect` - Handle user disconnect

#### Frontend Components

1. **ChatSection Component** (`src/components/Chat/ChatSection.jsx`)
   - Reusable chat UI component
   - Features:
     - Real-time message display with sender information
     - Message sending with Enter key support
     - Edit and delete functionality for own messages
     - Typing indicators showing who's typing
     - Automatic scroll to latest message
     - Date separators between message groups
     - User role badges (Instructor/Student)
     - Online user count
     - Load previous messages on mount
     - Error handling and retry logic

2. **Instructor ClassDetail Integration** (`src/pages/Mentor/MentorLandingDB/components/ClassDetail.jsx`)
   - Added "Overview" and "Chat" tabs
   - Chat tab displays ChatSection for the specific class
   - Maintains all existing functionality (assignments, students, etc.)

3. **Student ClassroomDetails Integration** (`src/pages/Student/Classroom/ClassroomDetails.jsx`)
   - Added "Assignments" and "Chat" tabs
   - Chat tab displays ChatSection for the specific class
   - Maintains all existing functionality (assignments, submissions, etc.)

---

## Installation & Setup

### Backend Setup

1. **Socket.IO Installation**
   ```bash
   cd codable-backend
   npm install socket.io
   ```

2. **Server Configuration**
   - Added Socket.IO initialization in `src/server.js`
   - Chat routes registered at `/api/chat`
   - Chat socket handler initialized on server startup

### Frontend Setup

1. **Socket.IO Client Installation**
   ```bash
   cd codable-frontend
   npm install socket.io-client
   npm install react-markdown remark-gfm  # Already installed from earlier
   ```

---

## Usage Guide

### For Instructors

1. **Navigate to Class Detail**
   - Go to Classes → Select a Class
   - Click the "Chat" tab in the class detail view

2. **Send Messages**
   - Type a message in the input field
   - Press Enter or click the Send button
   - Message appears immediately for all class participants

3. **Manage Messages**
   - Click the edit icon to modify your message
   - Click the delete icon to remove your message
   - Admins can delete any message

4. **View Chat History**
   - All messages from the class are automatically loaded
   - Messages are grouped by date
   - Scroll up to load more messages

### For Students

1. **Navigate to Class**
   - Go to Classroom → Select a Class
   - Click the "Chat" tab in the classroom view

2. **Communicate**
   - Send messages to ask questions or discuss course material
   - View instructor and peer responses in real-time
   - Edit or delete your own messages

3. **Interact with Instructor**
   - Ask questions directly in chat
   - Receive immediate feedback
   - Collaborate with classmates

---

## Key Features

### Real-Time Communication
- Instant message delivery using WebSocket
- Typing indicators showing active participants
- Online user count display
- Automatic connection management

### Message Management
- **Create**: Send new messages instantly
- **Edit**: Modify your own messages (marked as edited)
- **Delete**: Remove messages (sender or instructor)
- **View**: Full chat history with pagination

### User Experience
- Clean, modern UI with dark theme
- Automatic scroll to latest messages
- Date separators for message organization
- User avatars with role indicators
- Responsive design for all devices

### Security & Permissions
- JWT token authentication for all users
- Class-based access control
- Verify user membership before allowing chat access
- Only senders can edit/delete their messages
- Instructors can manage all messages in their classes

### Data Persistence
- All messages stored in MongoDB
- Indexed for fast queries
- Timestamp tracking for all messages
- Edit and deletion history

---

## Database Schema

### ChatMessage Collection

```javascript
{
  _id: ObjectId,
  classId: ObjectId,              // Reference to Class
  senderId: ObjectId,              // Reference to User
  senderName: String,              // User's full name
  senderEmail: String,             // User's email
  senderRole: String,              // "instructor" or "student"
  message: String,                 // Message content
  isEdited: Boolean,               // Whether message was edited
  editedAt: Date,                  // When message was last edited
  createdAt: Date,                 // Message creation time (auto)
  updatedAt: Date                  // Last update time (auto)
}
```

### Indexes
- `{ classId: 1, createdAt: -1 }` - For fetching messages in a class
- `{ classId: 1, senderId: 1 }` - For user-specific queries

---

## Socket.IO Events Reference

### Client → Server Events

1. **joinClass**
   ```javascript
   socket.emit('joinClass', { classId: '...' })
   ```

2. **sendMessage**
   ```javascript
   socket.emit('sendMessage', {
     classId: '...',
     message: 'Hello everyone!'
   })
   ```

3. **editMessage**
   ```javascript
   socket.emit('editMessage', {
     classId: '...',
     messageId: '...',
     message: 'Updated message'
   })
   ```

4. **deleteMessage**
   ```javascript
   socket.emit('deleteMessage', {
     classId: '...',
     messageId: '...'
   })
   ```

5. **typing**
   ```javascript
   socket.emit('typing', { classId: '...' })
   ```

6. **stopTyping**
   ```javascript
   socket.emit('stopTyping', { classId: '...' })
   ```

### Server → Client Events

1. **messageReceived**
   ```javascript
   socket.on('messageReceived', (message) => {
     // { id, senderId, senderName, message, createdAt, ... }
   })
   ```

2. **messageEdited**
   ```javascript
   socket.on('messageEdited', (data) => {
     // { id, message, isEdited, editedAt }
   })
   ```

3. **messageDeleted**
   ```javascript
   socket.on('messageDeleted', (data) => {
     // { messageId, classId }
   })
   ```

4. **userTyping**
   ```javascript
   socket.on('userTyping', (data) => {
     // { userId, userName, classId }
   })
   ```

5. **userJoined**
   ```javascript
   socket.on('userJoined', (data) => {
     // { userId, userName, classId, role }
   })
   ```

6. **userLeft**
   ```javascript
   socket.on('userLeft', (data) => {
     // { userId, userName, classId }
   })
   ```

---

## File Structure

```
Backend:
├── src/
│   ├── models/
│   │   └── ChatMessage.js
│   ├── controllers/
│   │   └── chatController.js
│   ├── routes/
│   │   └── chatRoutes.js
│   ├── websocket/
│   │   ├── codeRunner.js (existing)
│   │   └── chatSocket.js (new)
│   └── server.js (updated)

Frontend:
├── src/
│   ├── components/
│   │   └── Chat/
│   │       └── ChatSection.jsx
│   └── pages/
│       ├── Mentor/MentorLandingDB/components/
│       │   └── ClassDetail.jsx (updated)
│       └── Student/Classroom/
│           └── ClassroomDetails.jsx (updated)
```

---

## API Documentation

### REST Endpoints

#### Get Chat History
```
GET /api/chat/:classId
Query Parameters:
  - limit: number (default: 50)
  - skip: number (default: 0)

Response:
{
  success: true,
  data: [...messages],
  pagination: { total, returned, skip, limit }
}
```

#### Send Message
```
POST /api/chat/:classId
Body:
{
  message: "Your message"
}

Response:
{
  success: true,
  data: {...messageData}
}
```

#### Edit Message
```
PATCH /api/chat/:classId/messages/:messageId
Body:
{
  message: "Updated message"
}

Response:
{
  success: true,
  data: {...updatedMessage}
}
```

#### Delete Message
```
DELETE /api/chat/:classId/messages/:messageId

Response:
{
  success: true,
  message: "Message deleted successfully"
}
```

---

## Troubleshooting

### Connection Issues

**Problem:** Chat not connecting or messages not appearing
- Solution: Check that Socket.IO server is running on correct URL
- Verify `VITE_API_URL` environment variable matches backend URL
- Check browser console for connection errors

### Authentication Issues

**Problem:** "Authentication failed" error
- Solution: Ensure JWT token is properly stored in localStorage
- Check token validity and expiration
- Re-login if token expired

### Message Not Sending

**Problem:** Message sent but not appearing
- Solution: Check network tab for failed requests
- Verify class membership
- Check browser console for errors

### Real-Time Updates Not Working

**Problem:** Messages from other users not appearing
- Solution: Verify Socket.IO namespace is `/chat`
- Check that user joined the correct class room
- Restart Socket.IO connection

---

## Security Considerations

1. **Authentication**: All users must be authenticated with valid JWT tokens
2. **Authorization**: Users can only access classes they're enrolled in
3. **Message Ownership**: Users can only edit/delete their own messages
4. **Instructor Privileges**: Instructors can delete any message in their class
5. **Data Validation**: All input is trimmed and validated
6. **CORS**: Configured to allow frontend origin only

---

## Performance Optimization

1. **Indexing**: ChatMessage collection indexed on classId for fast queries
2. **Pagination**: Chat history loaded with pagination (default 50 messages)
3. **Connection Pooling**: Socket.IO handles connection reuse
4. **Message Batching**: Real-time updates broadcast efficiently
5. **Lazy Loading**: Messages load on demand when user scrolls

---

## Future Enhancements

1. **Message Reactions**: Add emoji reactions to messages
2. **File Sharing**: Enable image/document uploads in chat
3. **Message Search**: Full-text search across chat messages
4. **Direct Messages**: Private 1-on-1 conversations
5. **Message Threads**: Nested reply conversations
6. **Read Receipts**: Show who has read messages
7. **Message Pinning**: Pin important messages to top
8. **Chat Moderation**: Tools for filtering/monitoring chat
9. **Message History Export**: Download chat transcripts
10. **Voice/Video Chat**: Integrated video conferencing

---

## Deployment Notes

1. **Environment Variables**
   - Ensure `FRONTEND_ORIGIN` is set correctly on backend
   - Ensure `VITE_API_URL` points to correct backend URL

2. **CORS Configuration**
   - Socket.IO CORS already configured in chatSocket.js
   - Matches `FRONTEND_ORIGIN` setting

3. **Database**
   - Ensure MongoDB collections are created
   - Indexes are created automatically on first message

4. **SSL/TLS**
   - Use secure WebSocket (wss://) in production
   - Socket.IO automatically handles this

---

## Support & Maintenance

For issues or questions:
1. Check browser console for client-side errors
2. Check server logs for backend errors
3. Verify MongoDB connectivity
4. Ensure all dependencies are installed
5. Clear browser cache if experiencing issues
