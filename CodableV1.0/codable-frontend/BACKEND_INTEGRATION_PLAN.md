# Backend Integration Plan for Mentor Module

## Overview
Convert the static mentor dashboard from mock data to dynamic, database-driven system with real-time updates.

---

## Phase 1: Database Schema Design

### New Collections/Tables Required:

#### 1. **Class/Classroom**
```
- id (UUID)
- mentorId (UUID)
- name (string)
- description (string)
- joinCode (string - unique)
- createdAt (timestamp)
- updatedAt (timestamp)
- isActive (boolean)
- maxStudents (number, optional)
```

#### 2. **ClassEnrollment** (Many-to-Many)
```
- id (UUID)
- classId (UUID)
- studentId (UUID)
- enrolledAt (timestamp)
- role (string: "student" | "TA")
- status (string: "active" | "dropped")
```

#### 3. **Assignment**
```
- id (UUID)
- classId (UUID)
- mentorId (UUID)
- topic (string)
- description (string)
- rubric (string, optional)
- deadline (timestamp)
- createdAt (timestamp)
- updatedAt (timestamp)
- status (string: "active" | "completed" | "archived")
- totalPoints (number)
- weighting (number: 0-1)
```

#### 4. **Submission**
```
- id (UUID)
- assignmentId (UUID)
- studentId (UUID)
- classId (UUID)
- code (string/text)
- output (string/text)
- score (number)
- feedback (string)
- submittedAt (timestamp)
- status (string: "submitted" | "graded" | "reviewed")
- complexity (object: {lines, functions, loops})
```

#### 5. **StudentProgress**
```
- id (UUID)
- studentId (UUID)
- classId (UUID)
- assignmentId (UUID)
- submissionCount (number)
- score (number)
- completionPercentage (number)
- lastSubmittedAt (timestamp)
- status (string: "in_progress" | "completed")
```

#### 6. **SkillAssessment**
```
- id (UUID)
- studentId (UUID)
- classId (UUID)
- skillName (string)
- score (number 0-100)
- assessedAt (timestamp)
- source (string: "assignment" | "quiz" | "manual")
```

---

## Phase 2: API Endpoints

### Base URL: `/api/mentor` (or `/api/instructor`)

#### Dashboard Endpoints:
```
GET  /dashboard/stats              → {Overall Avg Score, Top Performers, Active Learners, Improvement Rate}
GET  /dashboard/performance-trend   → Array of weekly performance data
GET  /dashboard/classes-overview    → List of classes with student counts
```

#### Class Management:
```
GET    /classes                     → List all mentor's classes
POST   /classes                     → Create new class
GET    /classes/:classId            → Get class details
PUT    /classes/:classId            → Update class
DELETE /classes/:classId            → Delete class
POST   /classes/:classId/join-code  → Regenerate join code
GET    /classes/:classId/students   → List enrolled students
GET    /classes/:classId/assignments → List class assignments
```

#### Assignment Management:
```
GET    /assignments                 → List all assignments for mentor
POST   /assignments                 → Create new assignment
GET    /assignments/:assignmentId   → Get assignment details
PUT    /assignments/:assignmentId   → Update assignment
DELETE /assignments/:assignmentId   → Delete assignment
GET    /assignments/:assignmentId/submissions → Get submissions for assignment
GET    /assignments/:assignmentId/submissions/:submissionId → Get single submission
```

#### Student Performance:
```
GET  /classes/:classId/students/:studentId    → Student profile & progress
GET  /reports/class-performance                → Performance stats by class
GET  /reports/skill-distribution               → Radar chart data
GET  /reports/top-performers                   → List of top students
GET  /reports/student-categories               → Performance categories (Excellent/Good/Needs Support)
```

---

## Phase 3: Frontend API Service Layer

Create new service files in `src/services/`:

### `mentorApi.js`
```javascript
// Dashboard
export const fetchDashboardStats = () => GET(/mentor/dashboard/stats)
export const fetchPerformanceTrend = () => GET(/mentor/dashboard/performance-trend)

// Classes
export const fetchClasses = () => GET(/mentor/classes)
export const createClass = (data) => POST(/mentor/classes, data)
export const fetchClassDetail = (classId) => GET(/mentor/classes/${classId})
export const updateClass = (classId, data) => PUT(/mentor/classes/${classId}, data)
export const deleteClass = (classId) => DELETE(/mentor/classes/${classId})
export const regenerateJoinCode = (classId) => POST(/mentor/classes/${classId}/join-code)
export const fetchClassStudents = (classId) => GET(/mentor/classes/${classId}/students)

// Assignments
export const fetchAssignments = () => GET(/mentor/assignments)
export const createAssignment = (data) => POST(/mentor/assignments, data)
export const fetchAssignmentSubmissions = (assignmentId) => GET(/mentor/assignments/${assignmentId}/submissions)
export const deleteAssignment = (assignmentId) => DELETE(/mentor/assignments/${assignmentId})

// Reports
export const fetchClassPerformance = () => GET(/mentor/reports/class-performance)
export const fetchSkillDistribution = () => GET(/mentor/reports/skill-distribution)
export const fetchTopPerformers = () => GET(/mentor/reports/top-performers)
export const fetchStudentCategories = () => GET(/mentor/reports/student-categories)
```

---

## Phase 4: Component Refactoring Plan

### Dashboard.jsx
- Replace mock `statsCards` with API call: `fetchDashboardStats()`
- Replace mock `performanceTrend` with: `fetchPerformanceTrend()`
- Replace mock `classOverview` with: `fetchClasses().slice(0, 6)`

### Classes.jsx
- Load classes from `fetchClasses()`
- Create class via `createAssignment()`
- Delete class via `deleteClass()`
- Auto-fetch on component mount with `useEffect`

### Assignments.jsx
- Load assignments from `fetchAssignments()`
- Create assignment via `createAssignment()`
- Delete assignment via `deleteAssignment()`
- Real-time submission count updates

### ClassDetail.jsx
- Load class data via `fetchClassDetail(classId)`
- Load students via `fetchClassStudents(classId)`
- Load class assignments via `GET /classes/:classId/assignments`
- Regenerate join code via `regenerateJoinCode(classId)`
- Delete class via `deleteClass(classId)`

### Reports.jsx
- Load stats via `fetchDashboardStats()`
- Load class performance via `fetchClassPerformance()`
- Load skill distribution via `fetchSkillDistribution()`
- Load top performers via `fetchTopPerformers()`
- Load student categories via `fetchStudentCategories()`

---

## Phase 5: State Management Strategy

### Option A: Context API (Lightweight)
```javascript
// MentorContext.jsx
- classes: []
- assignments: []
- classDetail: {}
- students: []
- loading: false
- error: null
```

### Option B: Redux (Complex, Future)
- For later when analytics and real-time updates needed

### Option C: React Query (Recommended)
```javascript
// Hooks for automatic caching, refetching, error handling
useQuery(['classes'], fetchClasses)
useQuery(['classDetail', classId], () => fetchClassDetail(classId))
useMutation('createClass', createClass)
```

---

## Phase 6: Implementation Steps

### Week 1: Backend
1. Create MongoDB collections/schema
2. Build CRUD endpoints for Classes, Assignments, Submissions
3. Build aggregation endpoints for Reports
4. Set up proper error handling & validation

### Week 2: Frontend Setup
1. Create `mentorApi.js` service file
2. Update `apiClient.js` with mentor base path
3. Create `MentorContext.jsx` or React Query setup

### Week 3: Component Integration (Bottom-Up)
1. Update Classes.jsx → API calls
2. Update Assignments.jsx → API calls
3. Update ClassDetail.jsx → API calls

### Week 4: Dashboard & Reports
1. Update Dashboard.jsx → Real data
2. Update Reports.jsx → Real data
3. Testing & debugging

---

## Phase 7: Key Backend Endpoints Details

### GET /mentor/classes
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid1",
      "name": "React Fundamentals",
      "description": "...",
      "joinCode": "RF-ABC123",
      "studentCount": 45,
      "assignmentCount": 8,
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

### GET /mentor/reports/top-performers
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "studentId": "uuid",
      "name": "Sarah Chen",
      "email": "sarah@email.com",
      "class": "Web Dev",
      "score": 98,
      "assignments": 12,
      "rank": 1
    }
  ]
}
```

### POST /mentor/classes
**Request:**
```json
{
  "name": "Advanced Python",
  "description": "Deep dive into Python",
  "maxStudents": 50
}
```
**Response:** Returns created class with auto-generated joinCode

---

## Phase 8: Real-Time Features (Future)

### WebSocket Integration for:
- Live assignment submissions count update
- Real-time student performance tracking
- Instant notifications for new submissions

---

## Performance Optimization

1. **Pagination**: Classes & Assignments list endpoints should support pagination
2. **Caching**: Use React Query or similar for automatic cache management
3. **Lazy Loading**: Load reports data on demand
4. **Aggregation**: Pre-calculate dashboard stats on backend monthly

---

## Security Considerations

1. Mentor can only access their own classes
2. Verify mentorId in JWT token before returning data
3. Students can only submit to assigned classes
4. Rate limiting on API endpoints
5. Input validation for all submissions
