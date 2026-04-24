import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// Test data
let instructorToken = '';
let studentToken = '';
let student2Token = '';
let classId = '';
let joinCode = '';

const instructorData = {
  name: 'Dr. Emily Rodriguez',
  email: 'emily.rodriguez@test.com',
  password: 'Test123!@#',
  role: 'instructor'
};

const studentData = {
  name: 'John Doe',
  email: 'john.doe@test.com',
  password: 'Test123!@#',
  role: 'student'
};

const studentData2 = {
  name: 'Jane Smith',
  email: 'jane.smith@test.com',
  password: 'Test123!@#',
  role: 'student'
};

// Helper function to log results
function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status} | ${testName}`);
  if (details) console.log(`   ${details}`);
}

// Helper function to create or login user
async function createOrLoginUser(userData) {
  try {
    // Try to create user
    const createRes = await axios.post(`${BASE_URL}/auth/signup`, userData);
    return createRes.data.token;
  } catch (error) {
    // If user already exists, try to login
    if (error.response?.data?.message === "User already exists.") {
      try {
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
          email: userData.email,
          password: userData.password
        });
        return loginRes.data.token;
      } catch (loginError) {
        throw loginError;
      }
    }
    throw error;
  }
}

// ========================
// SETUP: Create Users
// ========================
async function setupUsers() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         SETTING UP TEST USERS         ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    // Create or login instructor
    instructorToken = await createOrLoginUser(instructorData);
    logTest('Instructor Account Ready', !!instructorToken, `Token obtained: ${instructorToken.substring(0, 20)}...`);

    // Create or login student 1
    studentToken = await createOrLoginUser(studentData);
    logTest('Student 1 Account Ready', !!studentToken, `Token obtained: ${studentToken.substring(0, 20)}...`);

    // Create or login student 2
    student2Token = await createOrLoginUser(studentData2);
    logTest('Student 2 Account Ready', !!student2Token);

  } catch (error) {
    console.error('Setup error:', error.response?.data || error.message);
    process.exit(1);
  }
}

// ========================
// TEST 1: Create Class
// ========================
async function testCreateClass() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    TEST 1: INSTRUCTOR CREATE CLASS    ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    const classData = {
      className: `React Fundamentals ${Date.now()}`,
      description: 'Master the fundamentals of React',
      category: 'Core Java',
      maxStudents: 50,
      autoApproveStudents: false,
      allowLateSubmissions: true
    };

    const res = await axios.post(`${BASE_URL}/api/classes`, classData, {
      headers: { Authorization: `Bearer ${instructorToken}` }
    });

    classId = res.data.data._id;
    joinCode = res.data.data.joinCode;

    logTest('Create Class', res.status === 201, `Class ID: ${classId}, Join Code: ${joinCode}`);
  } catch (error) {
    logTest('Create Class', false, error.response?.data?.message || error.message);
  }
}

// ========================
// TEST 2: Student Join Class
// ========================
async function testStudentJoinClass() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      TEST 2: STUDENT JOIN CLASS      ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    const res = await axios.post(`${BASE_URL}/api/student-class/join`, 
      { joinCode },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );

    console.log('Join response status:', res.status);
    console.log('Join response data:', JSON.stringify(res.data, null, 2));
    
    requestId = res.data.data.requestId;
    console.log('RequestId captured:', requestId);
    
    logTest('Student Join with Valid Code', res.status === 201, `Request ID: ${requestId}, Status: ${res.data.data.status}`);
  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
    logTest('Student Join with Valid Code', false, error.response?.data?.message || error.message);
  }
}

// ========================
// TEST 3: Get Pending Requests (Instructor)
// ========================
async function testGetPendingRequests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    TEST 3: GET PENDING REQUESTS      ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    const res = await axios.get(`${BASE_URL}/api/instructor/class-requests/pending`, 
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );

    const requests = res.data.data;
    logTest('Get Pending Requests', res.status === 200, `Found ${requests.length} pending request(s)`);
    
    if (requests.length > 0) {
      console.log(`   Student: ${requests[0].studentName} (${requests[0].studentEmail})`);
      console.log(`   Class: ${requests[0].className}`);
    }
  } catch (error) {
    logTest('Get Pending Requests', false, error.response?.data?.message || error.message);
  }
}

// ========================
// TEST 4: Approve Request
// ========================
async function testApproveRequest() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      TEST 4: APPROVE REQUEST        ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    if (!requestId) {
      logTest('Approve Request', false, 'RequestId is not set. Join test may have failed.');
      return;
    }
    
    console.log('Using requestId:', requestId);
    
    const res = await axios.put(`${BASE_URL}/api/instructor/class-requests/${requestId}/approve`,
      { notes: 'Welcome to the class!' },
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );

    logTest('Approve Request', res.status === 200, `Student approved: ${res.data.data.studentName}`);
  } catch (error) {
    logTest('Approve Request', false, error.response?.data?.message || error.message);
  }
}

// ========================
// TEST 5: Get Student Classes
// ========================
async function testGetStudentClasses() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    TEST 5: GET STUDENT CLASSES      ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    const res = await axios.get(`${BASE_URL}/api/student-class/classes`,
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );

    const classes = res.data.data;
    logTest('Get Student Classes', res.status === 200, `Enrolled in ${classes.length} class(es)`);
    
    if (classes.length > 0) {
      console.log(`   Class: ${classes[0].className}`);
      console.log(`   Instructor: ${classes[0].instructorName}`);
      console.log(`   Enrolled Students: ${classes[0].enrolledStudents}`);
    }
  } catch (error) {
    logTest('Get Student Classes', false, error.response?.data?.message || error.message);
  }
}

// ========================
// TEST 6: Get Class Requests (Student)
// ========================
async function testGetClassRequests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   TEST 6: GET CLASS REQUESTS        ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    const res = await axios.get(`${BASE_URL}/api/student-class/requests?status=approved`,
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );

    const requests = res.data.data;
    logTest('Get Approved Requests', res.status === 200, `Found ${requests.length} approved request(s)`);
    
    if (requests.length > 0) {
      console.log(`   Class: ${requests[0].className}`);
      console.log(`   Instructor: ${requests[0].instructor}`);
      console.log(`   Approved At: ${requests[0].respondedAt}`);
    }
  } catch (error) {
    logTest('Get Approved Requests', false, error.response?.data?.message || error.message);
  }
}

// ========================
// TEST 7: Get Class Details
// ========================
async function testGetClassDetails() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    TEST 7: GET CLASS DETAILS        ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    const res = await axios.get(`${BASE_URL}/api/student-class/classes/${classId}`,
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );

    const classDetails = res.data.data;
    logTest('Get Class Details', res.status === 200);
    console.log(`   Class: ${classDetails.className}`);
    console.log(`   Category: ${classDetails.category}`);
    console.log(`   Enrolled Students: ${classDetails.enrolledStudents}`);
  } catch (error) {
    logTest('Get Class Details', false, error.response?.data?.message || error.message);
  }
}

// ========================
// TEST 8: Duplicate Join (Should Fail)
// ========================
async function testDuplicateJoin() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    TEST 8: DUPLICATE JOIN (FAIL)    ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    await axios.post(`${BASE_URL}/api/student-class/join`, 
      { joinCode },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    
    logTest('Duplicate Join Should Fail', false, 'Should have returned 409 error');
  } catch (error) {
    const passed = error.response?.status === 409;
    logTest('Duplicate Join Should Fail', passed, error.response?.data?.message);
  }
}

// ========================
// TEST 9: Invalid Join Code
// ========================
async function testInvalidJoinCode() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    TEST 9: INVALID JOIN CODE        ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    await axios.post(`${BASE_URL}/api/student-class/join`, 
      { joinCode: 'INVALID123' },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    
    logTest('Invalid Join Code Should Fail', false, 'Should have returned 404 error');
  } catch (error) {
    const passed = error.response?.status === 404;
    logTest('Invalid Join Code Should Fail', passed, error.response?.data?.message);
  }
}

// ========================
// TEST 10: Reject Request
// ========================
async function testRejectRequest() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    TEST 10: REJECT REQUEST         ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    // Create new join request to reject
    await axios.post(`${BASE_URL}/api/student-class/join`, 
      { joinCode },
      { headers: { Authorization: `Bearer ${student2Token}` } }
    );
    
    // Get the new request ID
    const getReqRes = await axios.get(`${BASE_URL}/api/instructor/class-requests/pending`, 
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
    
    const pendingRequests = getReqRes.data.data;
    const newRequest = pendingRequests.find(r => r.studentEmail === studentData2.email);
    
    if (newRequest) {
      const rejectRes = await axios.put(`${BASE_URL}/api/instructor/class-requests/${newRequest.id}/reject`,
        { notes: 'Application not accepted at this time' },
        { headers: { Authorization: `Bearer ${instructorToken}` } }
      );
      
      logTest('Reject Request', rejectRes.status === 200, `Student: ${rejectRes.data.data.studentName}`);
    }
  } catch (error) {
    logTest('Reject Request', false, error.response?.data?.message || error.message);
  }
}

// ========================
// AUTO-APPROVE TEST
// ========================
async function testAutoApproveClass() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   TEST 11: AUTO-APPROVE CLASS      ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    const autoApproveClass = {
      className: 'Advanced Java - Auto Approve',
      description: 'This class auto-approves students',
      category: 'Advanced Java',
      autoApproveStudents: true
    };

    const createRes = await axios.post(`${BASE_URL}/api/classes`, autoApproveClass, {
      headers: { Authorization: `Bearer ${instructorToken}` }
    });

    const autoApproveJoinCode = createRes.data.data.joinCode;

    // New student joins the auto-approve class
    const joinRes = await axios.post(`${BASE_URL}/api/student-class/join`, 
      { joinCode: autoApproveJoinCode },
      { headers: { Authorization: `Bearer ${student2Token}` } }
    );

    logTest('Auto-Approve Class', joinRes.status === 200, `Status: ${joinRes.data.data.message}`);
  } catch (error) {
    logTest('Auto-Approve Class', false, error.response?.data?.message || error.message);
  }
}

// ========================
// MAIN TEST RUNNER
// ========================
async function runTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     CLASSROOM BACKEND TEST SUITE     ║');
  console.log('║            Starting Tests            ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    await setupUsers();
    await testCreateClass();
    await testStudentJoinClass();
    await testGetPendingRequests();
    await testApproveRequest();
    await testGetStudentClasses();
    await testGetClassRequests();
    await testGetClassDetails();
    await testDuplicateJoin();
    await testInvalidJoinCode();
    await testRejectRequest();
    await testAutoApproveClass();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║           ALL TESTS COMPLETED         ║');
    console.log('╚════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

// Run tests
runTests();
