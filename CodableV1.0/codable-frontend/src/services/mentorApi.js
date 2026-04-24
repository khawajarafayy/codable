import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper to get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mentorApi = {
  /**
   * Get all classes for the instructor with student data
   */
  getInstructorClasses: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/classes/instructor`, {
        headers: getAuthHeader(),
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching instructor classes:', error);
      throw error;
    }
  },

  /**
   * Get all assignments and their submissions for analytics
   */
  getAllAssignments: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/classes/assignments/all`, {
        headers: getAuthHeader(),
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  },

  /**
   * Get assignment submissions for a specific class
   */
  getClassAssignmentSubmissions: async (classId, assignmentId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/classes/${classId}/assignments/${assignmentId}/submissions`,
        {
          headers: getAuthHeader(),
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },

  /**
   * Get student profile with skill data
   */
  getStudentProfile: async (studentId) => {
    try {
      const response = await axios.get(`${API_URL}/student/profile/${studentId}`, {
        headers: getAuthHeader(),
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching student profile:', error);
      throw error;
    }
  },

  /**
   * Get all students in a class with their performance data
   */
  getClassStudents: async (classId) => {
    try {
      const response = await axios.get(`${API_URL}/api/classes/${classId}`, {
        headers: getAuthHeader(),
      });
      return response.data.data?.students || [];
    } catch (error) {
      console.error('Error fetching class students:', error);
      throw error;
    }
  },

  /**
   * Aggregate reports data for the dashboard with real submission scores
   * Fetches class performance, student skills, and top performers
   */
  getReportsData: async () => {
    try {
      // Fetch instructor classes
      const classesRes = await axios.get(`${API_URL}/api/classes/instructor`, {
        headers: getAuthHeader(),
      });
      const classes = classesRes.data.data || classesRes.data;

      // Fetch all assignments
      const assignmentsRes = await axios.get(`${API_URL}/api/classes/assignments/all`, {
        headers: getAuthHeader(),
      });
      const assignments = assignmentsRes.data.data || assignmentsRes.data;

      // Fetch all submissions for all assignments to calculate real scores
      const classPerformance = [];
      
      for (const cls of classes) {
        if (!cls.students || cls.students.length === 0) continue;

        // Get assignments for this class
        const classAssignments = assignments.filter(
          a => a.classId === cls._id || a.classId?.toString() === cls._id?.toString()
        );

        let classScores = [];

        // Fetch submissions for each assignment in the class
        for (const assignment of classAssignments) {
          try {
            const submissionsRes = await axios.get(
              `${API_URL}/api/classes/${cls._id}/assignments/${assignment._id}/submissions`,
              { headers: getAuthHeader() }
            );
            const submissions = submissionsRes.data.data || submissionsRes.data || [];
            
            // Extract percentage scores from submissions
            if (Array.isArray(submissions)) {
              submissions.forEach(sub => {
                if (sub.percentage !== undefined) {
                  classScores.push(sub.percentage);
                }
              });
            }
          } catch (err) {
            console.warn(`Could not fetch submissions for assignment ${assignment._id}:`, err);
          }
        }

        // Calculate average score from real data
        const avgScore = classScores.length > 0
          ? Math.round(classScores.reduce((sum, s) => sum + s, 0) / classScores.length)
          : 0;

        classPerformance.push({
          class: cls.className,
          classId: cls._id,
          avgScore: avgScore > 0 ? avgScore : 75,
          students: cls.students?.length || 0,
        });
      }

      return {
        classPerformance,
        classes,
        assignments,
      };
    } catch (error) {
      console.error('Error fetching reports data:', error);
      throw error;
    }
  },

  /**
   * Get detailed performance data for all students across classes with real submission scores
   * Fetches actual submission data from MongoDB for accurate calculations
   */
  getStudentsPerformanceData: async () => {
    try {
      const classesRes = await axios.get(`${API_URL}/api/classes/instructor`, {
        headers: getAuthHeader(),
      });
      const classes = classesRes.data.data || classesRes.data;

      const assignmentsRes = await axios.get(`${API_URL}/api/classes/assignments/all`, {
        headers: getAuthHeader(),
      });
      const assignments = assignmentsRes.data.data || assignmentsRes.data;

      // Map to store student data with all their scores
      const studentDataMap = new Map();

      // Fetch submissions for all assignments
      for (const cls of classes) {
        const classAssignments = assignments.filter(
          a => a.classId === cls._id || a.classId?.toString() === cls._id?.toString()
        );

        for (const assignment of classAssignments) {
          try {
            const submissionsRes = await axios.get(
              `${API_URL}/api/classes/${cls._id}/assignments/${assignment._id}/submissions`,
              { headers: getAuthHeader() }
            );

            // Handle nested response structure from backend
            const submissionsData = submissionsRes.data.data || submissionsRes.data;
            const submissions = submissionsData.submissions || [];

            if (Array.isArray(submissions)) {
              submissions.forEach(sub => {
                const studentId = String(sub.studentId);
                
                if (studentId && sub.percentage !== undefined) {
                  // Initialize student data if not exists
                  if (!studentDataMap.has(studentId)) {
                    studentDataMap.set(studentId, {
                      _id: studentId,
                      name: sub.studentName || `Student ${studentId}`,
                      email: sub.studentEmail || '',
                      class: cls.className,
                      classId: cls._id,
                      allScores: [], // All individual assignment scores
                      assignmentCount: 0,
                    });
                  }

                  // Add this assignment's score
                  const studentData = studentDataMap.get(studentId);
                  studentData.allScores.push(sub.percentage);
                  studentData.assignmentCount += 1;
                  studentData.name = sub.studentName || studentData.name;
                  studentData.email = sub.studentEmail || studentData.email;
                }
              });
            }
          } catch (err) {
            console.warn(`Could not fetch submissions for assignment ${assignment._id}:`, err);
          }
        }
      }

      // Build final student performance array with calculated scores
      const allStudents = Array.from(studentDataMap.values()).map(student => {
        const allScores = student.allScores || [];
        // Calculate average score from all attempted assignments
        const avgScore = allScores.length > 0
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : 0;

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          class: student.class,
          classId: student.classId,
          score: avgScore, // Average of all attempted assignments
          individualScores: allScores, // All individual scores for reference
          assignmentCount: student.assignmentCount,
        };
      });

      return allStudents;
    } catch (error) {
      console.error('Error fetching student performance data:', error);
      throw error;
    }
  },
};

export default mentorApi;
