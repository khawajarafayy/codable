# Chat Module - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CODABLE CHAT SYSTEM                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐         ┌──────────────────────────────┐
│      FRONTEND (React)        │         │    BACKEND (Express.js)      │
│  ┌────────────────────────┐  │         │  ┌────────────────────────┐ │
│  │  ClassDetail.jsx       │  │◄────────┤  │  Server.js             │ │
│  │  - Overview Tab        │  │  REST   │  │  - Express Setup       │ │
│  │  - Chat Tab            │  │  API    │  │  - Route Configuration │ │
│  │  - ChatSection Component   │  │         │  │                        │ │
│  └────────────────────────┘  │         │  └────────────────────────┘ │
│           │                   │         │                              │
│           ├─────────────────┐ │         │  ┌────────────────────────┐ │
│           │ ChatSection.jsx  │ │         │  │  chatSocket.js         │ │
│           │ - Message List   │ │         │  │  - Socket.IO Setup     │ │
│           │ - Input Field    │ │         │  │  - Event Handlers      │ │
│           │ - Send Button    │ │         │  │  - User Tracking       │ │
│           │ - Edit/Delete    │ │         │  │                        │ │
│           └─────────────────┘ │         │  └────────────────────────┘ │
│           │                   │         │           │                  │
│           ├──────────────────┐│         │  ┌────────────────────────┐ │
│           │ Socket.IO Client │ │         │  │  chatController.js     │ │
│           │ - Connect        │ │         │  │  - getChatHistory()    │ │
│           │ - Listen Events  │ │         │  │  - createMessage()     │ │
│           │ - Emit Events    │ │         │  │  - editMessage()       │ │
│           └─────────────────┘ │         │  │  - deleteMessage()     │ │
│                               │         │  └────────────────────────┘ │
└──────────────────────────────┘         │           │                  │
          │                              │  ┌────────────────────────┐ │
          │                              │  │  chatRoutes.js         │ │
          │                              │  │  - GET /api/chat/...   │ │
          │                              │  │  - POST /api/chat/...  │ │
          │                              │  │  - PATCH /api/chat/... │ │
          │                              │  │  - DELETE /api/chat/.. │ │
          │                              │  └────────────────────────┘ │
          │                              │           │                  │
          └──────────────────────────────┼───────────┘                  │
                    HTTP + WebSocket     │                              │
                                         │           │                  │
                                         │  ┌────────────────────────┐ │
                                         │  │  ChatMessage Model     │ │
                                         │  │  - classId             │ │
                                         │  │  - senderId            │ │
                                         │  │  - message             │ │
                                         │  │  - timestamps          │ │
                                         │  └────────────────────────┘ │
                                         │           │                  │
                                         └───────────┼──────────────────┘
                                                     │
                                         ┌───────────▼──────────────────┐
                                         │    MONGODB DATABASE          │
                                         │  ┌────────────────────────┐ │
                                         │  │  ChatMessage Collection│ │
                                         │  │  - Indexed by classId  │ │
                                         │  │  - Indexed by senderId │ │
                                         │  └────────────────────────┘ │
                                         └────────────────────────────────┘
```

---

## Message Flow Diagram

### Sending a Message

```
┌──────────────────────────────────────────────────────────────────────┐
│                      MESSAGE SENDING FLOW                            │
└──────────────────────────────────────────────────────────────────────┘

User Types Message
        │
        ▼
┌─────────────────────┐
│ ChatSection.jsx     │
│ handleSendMessage() │
        │
        ├─── REST API POST ──────────────────┐
        │                                     │
        │                            ┌────────▼────────┐
        │                            │ chatController  │
        │                            │ createMessage() │
        │                            └────────┬────────┘
        │                                     │
        │                            ┌────────▼────────┐
        │                            │ Validate & Save │
        │                            │ to MongoDB      │
        │                            └────────┬────────┘
        │                                     │
        └────── Socket.IO Emit ──────────────┘
                   sendMessage
                        │
                        ▼
            ┌─────────────────────────────┐
            │ chatSocket.js               │
            │ Handle sendMessage Event    │
            └──────────┬──────────────────┘
                       │
                       ├─── Broadcast to Class ─────┐
                       │                            │
                       ▼                            ▼
            All Connected Clients      messageReceived Event
                       │                            │
                       └─── Update State ──────────┘
                       
            Message appears in chat for all users
```

### Real-Time Message Reception

```
┌──────────────────────────────────────────────────────────────────────┐
│                  REAL-TIME MESSAGE RECEPTION                         │
└──────────────────────────────────────────────────────────────────────┘

Another User Sends Message
        │
        ▼
    Backend Server
    (Socket.IO)
        │
        ├─── Verify User Access
        ├─── Save to Database
        └─── Broadcast Event
        
            io.to(classId).emit('messageReceived', {...})
        
        │
        ▼
    Connected Socket.IO Clients
        │
        ├──► User's Socket
        │       │
        │       ▼
        │   messageReceived Event
        │   Listener
        │       │
        │       ▼
        │   Update React State
        │       │
        │       ▼
        │   Re-render Message List
        │       │
        │       ▼
        │   Auto-scroll to Bottom
        │
        └──► Other Users' Sockets
                (Same flow...)

Message appears instantly for all users
```

---

## User Access Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    USER ACCESS VERIFICATION                          │
└──────────────────────────────────────────────────────────────────────┘

User Joins Class Chat
        │
        ▼
┌──────────────────────┐
│ Socket.IO Auth Mw.   │
│ Verify JWT Token     │
└──────┬───────────────┘
       │
       ├─ Invalid? ──► Close Connection ──X
       │
       └─ Valid ──┐
                  │
                  ▼
         ┌────────────────────┐
         │ Store User Info:   │
         │ - userId           │
         │ - userName         │
         │ - userEmail        │
         │ - userRole         │
         └────────┬───────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ joinClass Event    │
         │ Check Membership:  │
         │ - Instructor?      │
         │ - Enrolled Student?│
         └────────┬───────────┘
                  │
                  ├─ Not Member? ──► Deny Access ──X
                  │
                  └─ Member ──┐
                              │
                              ▼
                     ┌────────────────────┐
                     │ socket.join(id)    │
                     │ Add to Class Room  │
                     └────────┬───────────┘
                              │
                              ▼
                     ┌────────────────────┐
                     │ Fetch Chat History │
                     │ Load Previous Msgs │
                     └────────┬───────────┘
                              │
                              ▼
                     User Ready to Chat ✓
```

---

## Permission Check Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│               MESSAGE PERMISSION VERIFICATION                        │
└──────────────────────────────────────────────────────────────────────┘

User Requests Action (Edit/Delete)
        │
        ▼
┌──────────────────────────────┐
│ Check User Authentication    │
│ Valid JWT Token?             │
└──────┬───────────────────────┘
       │
       ├─ No ──► Error: Unauthorized ──X
       │
       └─ Yes ──┐
                │
                ▼
       ┌────────────────────────┐
       │ Fetch Message Record   │
       │ From Database          │
       └────────┬───────────────┘
               │
               ├─ Not Found ──► Error: Message Not Found ──X
               │
               └─ Found ──┐
                          │
                          ▼
                 ┌──────────────────────────┐
                 │ Check Permissions:       │
                 │                          │
                 │ Is Edit/Delete Request? │
                 └──┬───────────┬───────────┘
                    │           │
          Edit?─────┘           └─────Delete?
            │                         │
            ▼                         ▼
    ┌────────────────────┐  ┌────────────────────┐
    │ Is Message Owner?  │  │ Is Owner OR        │
    │                    │  │ Instructor?        │
    └─┬──────────┬───────┘  └─┬──────────┬───────┘
      │          │            │          │
     Yes        No           Yes        No
      │          │            │          │
      ▼          ▼            ▼          ▼
    ✓Allow     ✗Deny       ✓Allow     ✗Deny
    Update    Access      Delete      Access
      │          │            │          │
      └──────┬───┴────────┬───┴──────────┘
             │            │
             ▼            ▼
       Success Response  Error Response
```

---

## Socket.IO Event Sequence Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│              SOCKET.IO EVENT SEQUENCE - TYPICAL FLOW                 │
└──────────────────────────────────────────────────────────────────────┘

Instructor                           Server                         Students
    │                                   │                               │
    ├─ Connect + Auth ───────────────►  │                               │
    │                                   │ ◄─── Connect + Auth ──────────┤
    │                                   │                               │
    ├─ joinClass ────────────────────►  ├─ joinClass ───────────────────►
    │  {classId}                        │  {classId}                    │
    │                                   │ ◄─ joinClass ───────────────┤
    │                                   │     {classId}                 │
    │                                   │                               │
    ├─ typing ───────────────────────►  ├─ userTyping ──────────────────►
    │                                   │                               │
    ├─ sendMessage ──────────────────►  ├─ messageReceived ─────────────►
    │  {message}      (REST + Socket)   │  {message}                    │
    │  ◄─ Response ────────────────────│                               │
    │                                   │ ◄─ sendMessage ──────────────┤
    │                                   │    {message}                  │
    │  ◄─ messageReceived ────────────│ ├─ messageReceived ─────────────►
    │     {message}                     │    {message}                  │
    │                                   │                               │
    ├─ stopTyping ──────────────────►  ├─ userStoppedTyping ───────────►
    │                                   │                               │
    ├─ editMessage ─────────────────►  ├─ messageEdited ──────────────────►
    │  {messageId, newText}             │  {messageId, newText}         │
    │  ◄─ Response ────────────────────│                               │
    │  ◄─ messageEdited ──────────────│                               │
    │     {messageId, newText}          │                               │
    │                                   │                               │
    ├─ deleteMessage ───────────────►  ├─ messageDeleted ──────────────►
    │  {messageId}                      │  {messageId}                  │
    │  ◄─ Response ────────────────────│                               │
    │  ◄─ messageDeleted ────────────│                               │
    │     {messageId}                   │                               │
    │                                   │                               │
    ├─ (Connection closes)             │ ◄─ (Connection closes) ───────┤
    │                                   │                               │
    ├─ userLeft ───────────────────────┼─ userLeft ────────────────────►
    │                                   │                               │
```

---

## Data Model Relationships

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DATA MODEL RELATIONSHIPS                          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│      User        │
├──────────────────┤
│ _id              │
│ name             │
│ email            │
│ role             │
└────────┬─────────┘
         │
         │ 1:Many
         │ (senderId)
         │
         ▼
┌──────────────────┐
│  ChatMessage     │
├──────────────────┤
│ _id              │
│ classId ───┐    │
│ senderId   │    │
│ senderName │    │
│ senderEmail │   │
│ senderRole │    │
│ message    │    │
│ isEdited   │    │
│ editedAt   │    │
│ createdAt  │    │
│ updatedAt  │    │
└───────────┐─────┘
            │
            │ Many:1
            │ (classId)
            │
            ▼
         ┌──────────────────┐
         │     Class        │
         ├──────────────────┤
         │ _id              │
         │ className        │
         │ instructorId     │
         │ students[]       │
         │ category         │
         │ joinCode         │
         │ createdAt        │
         └──────────────────┘
```

---

## Message Lifecycle

```
┌──────────────────────────────────────────────────────────────────────┐
│                    MESSAGE LIFECYCLE STATES                          │
└──────────────────────────────────────────────────────────────────────┘

                            CREATED
                              │
                              │ User sends message
                              ▼
                    ┌──────────────────┐
                    │  Saved to DB     │
                    │  isEdited: false │
                    │  editedAt: null  │
                    └────────┬─────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
                 EDITED            DELETED
                    │                 │
            ┌─────────────────┐  ┌──────────────────┐
            │ isEdited: true  │  │ Removed from DB  │
            │ editedAt: date  │  │ Not visible      │
            │ message: new    │  │ to users         │
            └────────┬────────┘  └──────────────────┘
                     │
                     ▼
            ┌──────────────────┐
            │ Multiple Edits   │
            │ editedAt updated │
            └────────┬─────────┘
                     │
                     ▼
                  ARCHIVED
                  (In DB but
                   marked deleted)

Timeline: Created → Used → Edited → Deleted
          ◄────────────────────────────────►
                Message Lifecycle
```

---

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                   COMPONENT INTERACTION FLOW                         │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ClassDetail Component                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │               Tab Navigation                             │ │
│  │  [Overview] [Chat]                                       │ │
│  └─────┬───────────────┬─────────────────────────────────────┘ │
│        │               │                                        │
│        ▼               ▼                                        │
│  ┌────────────┐  ┌──────────────────────────────────────────┐ │
│  │ Overview   │  │ ChatSection Component                    │ │
│  │ - Stats    │  │ ┌──────────────────────────────────────┐│ │
│  │ - Students │  │ │ Header (Class Name, Online Count)   ││ │
│  │ - Assign.. │  │ ├──────────────────────────────────────┤│ │
│  │            │  │ │ Message List                         ││ │
│  │            │  │ │ - Message Items                      ││ │
│  │            │  │ │ - Date Separators                    ││ │
│  │            │  │ │ - Typing Indicators                  ││ │
│  │            │  │ ├──────────────────────────────────────┤│ │
│  │            │  │ │ Message Input                        ││ │
│  │            │  │ │ - Text Field                         ││ │
│  │            │  │ │ - Send Button                        ││ │
│  │            │  │ └──────────────────────────────────────┘│ │
│  │            │  │         │                                │ │
│  │            │  │         ├─► Socket.IO Client            │ │
│  │            │  │         │   - Connect/Join              │ │
│  │            │  │         │   - Listen Events             │ │
│  │            │  │         │   - Emit Events               │ │
│  │            │  │         │   - Disconnect               │ │
│  │            │  │         │                                │ │
│  │            │  │         ├─► REST API                    │ │
│  │            │  │             - Fetch History            │ │
│  │            │  │             - Create/Edit/Delete       │ │
│  │            │  └──────────────────────────────────────────┘ │
│  └────────────┘                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Request/Response Cycle

```
┌──────────────────────────────────────────────────────────────────────┐
│           COMPLETE REQUEST/RESPONSE CYCLE FOR MESSAGE                │
└──────────────────────────────────────────────────────────────────────┘

CLIENT SIDE                         NETWORK                  SERVER SIDE
    │                                  │                          │
    ├─ User sends message             │                          │
    │                                  │                          │
    ├─ Validate input                 │                          │
    │  (not empty)                    │                          │
    │                                  │                          │
    ├─ Emit Socket.IO                 │                          │
    │  "sendMessage"                  │                          │
    │  └─────────────────────────────►│                          │
    │                                  ├─ Route to Handler       │
    │                                  │                          │
    ├─ POST /api/chat/:classId        │ ┌──────────────────────┐ │
    │  (REST for persistence)         │ │ chatSocket Handler   │ │
    │  └─────────────────────────────►├─►                      │ │
    │                                  │ │ - Auth Verify        │ │
    │                                  │ │ - Access Check       │ │
    │                                  │ │ - Validation         │ │
    │                                  │ │                      │ │
    │                                  │ ├─► SaveMsg to DB     │ │
    │                                  │ │                      │ │
    │                                  │ ├─► Broadcast         │ │
    │                                  │ └──────────────────────┘ │
    │                                  │                          │
    ◄──────── messageReceived ─────────┤                          │
    │  {updatedMessage}               ◄──────────────────────────┤
    │                                  │                          │
    ├─ Update React State             │                          │
    │  (add to messages array)         │                          │
    │                                  │                          │
    ◄──── REST API Response ──────────┤                          │
    │  {success: true}                │ (comes after Socket)    │
    │                                  │                          │
    ├─ Clear input field              │                          │
    │                                  │                          │
    ├─ Re-render component            │                          │
    │                                  │                          │
    ├─ Auto-scroll to bottom          │                          │
    │                                  │                          │
    └─ Message visible to user ✓      │                          │
```

---

## Scale & Load Handling

```
┌──────────────────────────────────────────────────────────────────────┐
│              HANDLING MULTIPLE CLASSES & USERS                       │
└──────────────────────────────────────────────────────────────────────┘

                    Connection Pool
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
    Class A           Class B           Class C
    Room              Room              Room
        │                 │                 │
    ┌───┼──┐          ┌───┼──┐         ┌───┼──┐
    │   │  │          │   │  │         │   │  │
    ▼   ▼  ▼          ▼   ▼  ▼         ▼   ▼  ▼
   User1 U2 U3      User4 U5 U6      User7 U8 U9
    
Each room (class):
- Isolated socket connections
- Dedicated message broadcast
- Independent event handling

Database Index Strategy:
- Partition by classId
- Query optimization per class
- Scalable to 1000+ classes
```

This architecture enables scalable, real-time communication for multiple classes with hundreds of concurrent users!
