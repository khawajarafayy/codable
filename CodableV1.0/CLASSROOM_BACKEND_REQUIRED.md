# Classroom Module - Backend Integration Issues & Solutions

## Issues Fixed ✅

### 1. **UI Spacing Issue - FIXED**
**Problem**: Content was stuck to the walls with no padding or margins.

**Solution**: 
- Added proper wrapper container with background gradient: `bg-gradient-to-br from-[#0A1428] via-[#0F1B2D] to-[#040B1D]`
- Added content padding: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
- Responsive breakpoints for different screen sizes
- Applied to both `Classroom.jsx` and `ClassroomDetails.jsx`

---

## Current Issues ⚠️

### 2. **Join Class Endpoint Not Implemented - NEEDS BACKEND**
**Error**: "Cannot connect to server" or "Backend endpoint not yet implemented"

**Why it happens**:
- Frontend tries to call `POST /api/student/join-class` 
- This endpoint doesn't exist on the backend yet
- Backend only has instructor class endpoints, not student endpoints

**Error Messages Implemented**:
- ✅ If endpoint returns 404: Shows "Backend endpoint not yet implemented"
- ✅ If server returns 500: Shows "Server error. Make sure backend is running"
- ✅ If connection fails: Shows server URL to check
- ✅ If response invalid: Shows user-friendly error

---

## Backend Implementation Required

### Critical Endpoints Needed

#### 1. **POST /api/student/join-class**
Submit a class join request using join code

```
POST /api/student/join-class
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "joinCode": "REACT2024"
}

Response (200 OK):
{
  "success": true,
  "classRequestId": "req-123",
  "classId": "class-123",
  "className": "React Fundamentals",
  "instructorName": "Dr. Emily Rodriguez",
  "message": "Request sent successfully"
}

Error Responses:
- 400: { "message": "Invalid join code" }
- 404: { "message": "Join code not found" }
- 409: { "message": "Already enrolled in this class" }
```

#### 2. **GET /api/student/classes**
Fetch all classes the student has joined

```
GET /api/student/classes
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "id": "enrollment-1",
      "classId": "class-123",
      "className": "React Fundamentals",
      "instructorName": "Dr. Emily Rodriguez",
      "instructorId": "inst-123",
      "joinCode": "REACT2024",
      "description": "Master React...",
      "assignments": 8,
      "completed": 6,
      "progress": 75
    }
  ]
}
```

#### 3. **GET /api/student/class-requests?status=pending**
Fetch pending class join requests

```
GET /api/student/class-requests?status=pending
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "id": "request-123",
      "classId": "class-456",
      "className": "Advanced TypeScript",
      "instructor": "Dr. Sarah Johnson",
      "instructorId": "inst-456",
      "requestedAt": "2026-04-23",
      "status": "pending"
    }
  ]
}
```

#### 4. **GET /api/classes/:classId/student**
Fetch class details (student view)

```
GET /api/classes/class-123/student
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "class-123",
    "classId": "class-123",
    "className": "React Fundamentals",
    "instructorName": "Dr. Emily Rodriguez",
    "instructorId": "inst-123",
    "joinCode": "REACT2024",
    "description": "Master the fundamentals...",
    "createdAt": "2026-03-01",
    "enrolledStudents": 45
  }
}
```

#### 5. **GET /api/classes/:classId/assignments**
Fetch assignments for a class

```
GET /api/classes/class-123/assignments
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "id": "assignment-1",
      "title": "Build a Todo App",
      "description": "Create a fully functional...",
      "deadline": "2026-04-30",
      "status": "pending",
      "points": 100,
      "submitted": false,
      "submittedAt": null,
      "grade": null
    }
  ]
}
```

#### 6. **POST /api/assignments/:assignmentId/submit**
Submit an assignment

```
POST /api/assignments/assignment-1/submit
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "submittedAt": "2026-04-29T10:30:00Z"
}

Response (200 OK):
{
  "success": true,
  "message": "Assignment submitted successfully",
  "submittedAt": "2026-04-29T10:30:00Z"
}
```

---

## WebSocket for Real-Time Updates

### Connection Setup
```javascript
WS ws://localhost:3000/ws?token=<jwt_token>
```

### Messages to Handle

**CLASS_APPROVED** - When instructor approves join request
```json
{
  "type": "CLASS_APPROVED",
  "classRequestId": "request-123",
  "classId": "class-123",
  "classData": {
    "id": "class-123",
    "classId": "class-123",
    "className": "React Fundamentals",
    "instructorName": "Dr. Emily Rodriguez",
    "assignments": 8,
    "completed": 0,
    "progress": 0
  }
}
```

**CLASS_REJECTED** - When instructor rejects join request
```json
{
  "type": "CLASS_REJECTED",
  "classRequestId": "request-123",
  "classId": "class-123",
  "className": "Advanced TypeScript"
}
```

---

## Files to Update on Backend

### 1. Routes
Create `codable-backend/src/routes/studentClassRoutes.js`:
```javascript
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import * as studentClassController from "../controllers/studentClassController.js";

const router = express.Router();

// All routes require student authentication
router.use(authMiddleware.authorize(["student"]));

router.post("/join-class", studentClassController.joinClass);
router.get("/classes", studentClassController.getStudentClasses);
router.get("/class-requests", studentClassController.getClassRequests);

export default router;
```

### 2. Controller
Create `codable-backend/src/controllers/studentClassController.js`:
- `joinClass()` - Process join code and create request
- `getStudentClasses()` - Get enrolled classes
- `getClassRequests()` - Get pending requests
- Include join code validation logic

### 3. Models
Update existing models or create:
- **ClassRequest** - Track join requests (pending, approved, rejected)
- **ClassEnrollment** - Track student enrollment

### 4. WebSocket Handler
Set up WebSocket listener for:
- Broadcasting approval/rejection messages
- Implement in `codable-backend/src/websocket/codeRunner.js` or new file

---

## Integration Checklist

- [ ] Create `studentClassRoutes.js`
- [ ] Create `studentClassController.js` with join-class logic
- [ ] Implement ClassRequest model schema
- [ ] Add join code validation
- [ ] Create class enrollment logic
- [ ] Set up WebSocket message handlers
- [ ] Test all 6 endpoints
- [ ] Test WebSocket notifications
- [ ] Test error responses
- [ ] Deploy backend

---

## Testing the Frontend

Once backend is ready, test with:

**Test Case 1: Successful Join**
- Input join code: "REACT2024"
- Expected: Success message + added to pending requests

**Test Case 2: Invalid Join Code**
- Input join code: "INVALID"
- Expected: Error message "Invalid join code"

**Test Case 3: Already Enrolled**
- Input join code: Already joined class
- Expected: Error message "Already enrolled"

**Test Case 4: WebSocket Approval**
- Join a class
- Have instructor approve
- Expected: Real-time notification + class appears in "My Classes"

---

## Current Frontend Status

✅ **Completed**:
- UI layout with proper spacing
- Join class form with validation
- Error handling with specific messages
- Pending requests display
- Joined classes listing
- Class detail view
- Assignment tracking
- WebSocket integration setup

⚠️ **Waiting for Backend**:
- Student class endpoints
- Join code validation
- Class enrollment logic
- WebSocket server implementation

---

## Quick Start When Backend is Ready

1. Implement the 6 API endpoints above
2. Add database models (ClassRequest, ClassEnrollment)
3. Set up WebSocket handlers
4. Frontend will automatically work once endpoints are available
5. No frontend code changes needed

