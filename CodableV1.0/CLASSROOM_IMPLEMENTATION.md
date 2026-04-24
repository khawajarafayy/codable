# Classroom Module - Frontend Implementation Complete

## Summary of Changes

### 1. Folder Structure Migration ✅
- **Old**: `codable-frontend/src/pages/Classroom/`
- **New**: `codable-frontend/src/pages/Student/Classroom/`
- The Classroom module is now properly nested under the Student section

### 2. Files Created

#### `Classroom.jsx` - Student Classroom Dashboard
- **Purpose**: Main dashboard where students can:
  - View all joined classes
  - Join new classes using join codes
  - See pending class approval requests
  - Real-time updates via WebSocket for class approvals/rejections

**Key Features**:
- Dynamic class loading from backend
- Join class functionality with validation
- WebSocket integration for real-time notifications
- Pending approval status tracking
- Progress tracking per class

**Dependencies**:
- React hooks (useState, useEffect)
- react-router-dom for navigation
- lucide-react icons

#### `ClassroomDetails.jsx` - Class Details & Assignments Page
- **Purpose**: Detailed view for each class showing:
  - Class information and instructor details
  - All assignments with statuses
  - Progress statistics
  - Grade tracking
  - Assignment submission

**Key Features**:
- Dynamic assignment fetching
- Assignment submission functionality
- Grade display and progress tracking
- Status management (pending, submitted, graded)
- Overdue assignment detection
- Performance metrics visualization

### 3. Routing Updates ✅
Updated `App.jsx`:
- Changed import from `ClassroomComingSoon` to new components
- Updated `/classroom` route to use dynamic `Classroom` component
- Added new `/classroom/:classId` route for `ClassroomDetails`

## Backend Endpoints Required

### For Classroom.jsx

#### 1. **Get Student's Joined Classes**
```
GET /api/student/classes
Headers: Authorization: Bearer <token>
Response: { data: Array<Class> }
```

**Class Object Structure**:
```json
{
  "id": "uuid",
  "classId": "class-123",
  "className": "React Fundamentals",
  "instructorName": "Dr. Emily Rodriguez",
  "instructorId": "instructor-123",
  "joinCode": "REACT2024",
  "description": "Master React...",
  "assignments": 8,
  "completed": 6,
  "progress": 75
}
```

#### 2. **Get Pending Class Join Requests**
```
GET /api/student/class-requests?status=pending
Headers: Authorization: Bearer <token>
Response: { data: Array<ClassRequest> }
```

**ClassRequest Object Structure**:
```json
{
  "id": "request-123",
  "classId": "class-456",
  "className": "Advanced TypeScript",
  "instructor": "Dr. Sarah Johnson",
  "instructorId": "instructor-456",
  "requestedAt": "2026-04-23",
  "status": "pending"
}
```

#### 3. **Submit Class Join Request**
```
POST /api/student/join-class
Headers: 
  - Authorization: Bearer <token>
  - Content-Type: application/json
Body: {
  "joinCode": "REACT2024"
}
Response: { 
  classRequestId: "request-123",
  classId: "class-123",
  className: "React Fundamentals",
  instructorName: "Dr. Emily Rodriguez",
  message: "Request sent successfully"
}
```

### For ClassroomDetails.jsx

#### 4. **Get Class Details (Student View)**
```
GET /api/classes/:classId/student
Headers: Authorization: Bearer <token>
Response: { data: ClassDetails }
```

**ClassDetails Object Structure**:
```json
{
  "id": "class-123",
  "classId": "class-123",
  "className": "React Fundamentals",
  "instructorName": "Dr. Emily Rodriguez",
  "instructorId": "instructor-123",
  "joinCode": "REACT2024",
  "description": "Master the fundamentals of React...",
  "createdAt": "2026-03-01",
  "enrolledStudents": 45
}
```

#### 5. **Get Class Assignments**
```
GET /api/classes/:classId/assignments
Headers: Authorization: Bearer <token>
Response: { data: Array<Assignment> }
```

**Assignment Object Structure**:
```json
{
  "id": "assignment-1",
  "title": "Build a Todo App",
  "description": "Create a fully functional todo application with CRUD operations",
  "deadline": "2026-04-30",
  "status": "pending|submitted|graded",
  "points": 100,
  "submitted": false,
  "submittedAt": "2026-04-29",
  "grade": 85
}
```

#### 6. **Submit Assignment**
```
POST /api/assignments/:assignmentId/submit
Headers:
  - Authorization: Bearer <token>
  - Content-Type: application/json
Body: {
  "submittedAt": "2026-04-29T10:30:00Z"
}
Response: {
  success: true,
  message: "Assignment submitted successfully",
  submittedAt: "2026-04-29T10:30:00Z"
}
```

## WebSocket Implementation

### WebSocket Endpoint
```
WS /ws?token=<jwt_token>
```

### Supported Message Types

#### CLASS_APPROVED
Sent when instructor approves a student's join request
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

#### CLASS_REJECTED
Sent when instructor rejects a student's join request
```json
{
  "type": "CLASS_REJECTED",
  "classRequestId": "request-123",
  "classId": "class-123",
  "className": "Advanced TypeScript"
}
```

#### ASSIGNMENT_GRADED (Future)
Could be used to notify students when assignments are graded
```json
{
  "type": "ASSIGNMENT_GRADED",
  "assignmentId": "assignment-1",
  "grade": 85,
  "feedback": "Great work!"
}
```

## Implementation Notes

### Frontend Features Implemented
✅ Dynamic class loading  
✅ Join class with code validation  
✅ Real-time notifications via WebSocket  
✅ Assignment status tracking  
✅ Grade display  
✅ Progress visualization  
✅ Responsive UI  
✅ Error handling  

### Backend Features Needed
⚠️ Student class endpoints  
⚠️ Class join request system  
⚠️ Assignment management for students  
⚠️ WebSocket server for real-time updates  
⚠️ Instructor approval workflow  
⚠️ Class join code validation  

## API Error Responses

All endpoints should handle these error cases:

### 401 Unauthorized
```json
{
  "message": "Please log in first",
  "status": 401
}
```

### 403 Forbidden
```json
{
  "message": "You don't have permission to access this class",
  "status": 403
}
```

### 404 Not Found
```json
{
  "message": "Class/Assignment not found",
  "status": 404
}
```

### 400 Bad Request
```json
{
  "message": "Invalid join code or code not found",
  "status": 400
}
```

## Database Schema Recommendations

### Classes Table
- id (UUID)
- instructor_id (FK)
- class_name (String)
- description (Text)
- join_code (String, Unique)
- created_at (DateTime)
- updated_at (DateTime)

### Class Requests Table
- id (UUID)
- student_id (FK)
- class_id (FK)
- status (enum: pending, approved, rejected)
- requested_at (DateTime)
- approved_at (DateTime, nullable)
- rejection_reason (Text, nullable)

### Class Enrollments Table
- id (UUID)
- student_id (FK)
- class_id (FK)
- enrolled_at (DateTime)
- status (enum: active, dropped)

### Assignments Table
- id (UUID)
- class_id (FK)
- title (String)
- description (Text)
- deadline (DateTime)
- points (Integer)
- created_at (DateTime)

### Student Assignments Table
- id (UUID)
- student_id (FK)
- assignment_id (FK)
- status (enum: pending, submitted, graded)
- submitted_at (DateTime, nullable)
- grade (Integer, nullable)
- feedback (Text, nullable)

## Next Steps

1. **Backend Development**:
   - Implement the 6 required API endpoints
   - Set up WebSocket server
   - Create database schema
   - Add authentication checks
   - Implement approval workflow

2. **Testing**:
   - Test all endpoints with various scenarios
   - Test WebSocket connections and messages
   - Test error handling
   - Performance testing with multiple students

3. **Frontend Enhancements** (Optional):
   - Add assignment submission file upload
   - Add chat/discussion feature per class
   - Add class calendar/schedule
   - Add assignment deadline notifications
   - Add grade notifications

## Connection Strategy: WebSocket vs REST Polling

### Chosen: WebSocket (Implemented) ✅
**Why**:
- Real-time updates for class approvals/rejections
- Low latency notifications
- Reduced server load compared to polling
- Better user experience
- More scalable for many concurrent users

**Alternative**: REST Polling (Not implemented)
- Pros: Simpler to implement
- Cons: Higher latency, higher server load

## File Locations
- Frontend Components: `codable-frontend/src/pages/Student/Classroom/`
  - `Classroom.jsx` - Dashboard
  - `ClassroomDetails.jsx` - Class Detail View
- Routes: Updated in `codable-frontend/src/App.jsx`
