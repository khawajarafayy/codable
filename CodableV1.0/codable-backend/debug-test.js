import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function debug() {
  try {
    // 1. Create instructor
    const instructorRes = await axios.post(`${BASE_URL}/auth/signup`, {
      name: 'Debug Instructor',
      email: `debug-instructor-${Date.now()}@test.com`,
      password: 'Test123!@#',
      role: 'instructor'
    });
    const instructorToken = instructorRes.data.token;
    console.log('✅ Instructor created');

    // 2. Create student
    const studentRes = await axios.post(`${BASE_URL}/auth/signup`, {
      name: 'Debug Student',
      email: `debug-student-${Date.now()}@test.com`,
      password: 'Test123!@#',
      role: 'student'
    });
    const studentToken = studentRes.data.token;
    console.log('✅ Student created');

    // 3. Create class
    const classRes = await axios.post(`${BASE_URL}/api/classes`, {
      className: `Debug Class ${Date.now()}`,
      description: 'Debug test',
      category: 'Core Java',
      autoApproveStudents: false
    }, {
      headers: { Authorization: `Bearer ${instructorToken}` }
    });
    const joinCode = classRes.data.data.joinCode;
    const classId = classRes.data.data._id;
    console.log(`✅ Class created: ${joinCode}`);

    // 4. Student joins class
    console.log('\n--- Student Join Request ---');
    const joinRes = await axios.post(`${BASE_URL}/api/student-class/join`, 
      { joinCode },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    
    console.log('Status:', joinRes.status);
    console.log('Response:', JSON.stringify(joinRes.data, null, 2));
    
    const requestId = joinRes.data.data.requestId;
    console.log(`✅ Join request created: ${requestId}`);

    // 5. Get pending requests
    console.log('\n--- Get Pending Requests ---');
    const pendingRes = await axios.get(`${BASE_URL}/api/instructor/class-requests/pending`, 
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
    console.log('Pending requests:', JSON.stringify(pendingRes.data, null, 2));

    // 6. Approve request
    console.log('\n--- Approve Request ---');
    const approveRes = await axios.put(`${BASE_URL}/api/instructor/class-requests/${requestId}/approve`,
      { notes: 'Approved!' },
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
    console.log('Approve response:', JSON.stringify(approveRes.data, null, 2));

    // 7. Get student classes
    console.log('\n--- Get Student Classes ---');
    const classesRes = await axios.get(`${BASE_URL}/api/student-class/classes`,
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log('Student classes:', JSON.stringify(classesRes.data, null, 2));

    // 8. Get class details
    console.log('\n--- Get Class Details ---');
    const detailsRes = await axios.get(`${BASE_URL}/api/student-class/classes/${classId}`,
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log('Class details:', JSON.stringify(detailsRes.data, null, 2));

    console.log('\n✅ All debug tests passed!');
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

debug();
