import Admin from "../models/Admin.js";
import userModel from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import UserProgress from "../models/UserProgress.js";
import ClassAssignmentSubmission from "../models/ClassAssignmentSubmission.js";
import ClassRequest from "../instructor/models/ClassRequest.js";
import mongoose from "mongoose";

// POST /api/admin/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const ok = await admin.comparePassword(password);
    if (!ok) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = admin.generateToken();
    res.status(200).json({ success: true, token, user: { _id: admin._id, name: admin.name, email: admin.email, role: 'admin' } });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/metrics
export const metrics = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalStudents, activeStudents, totalInstructors, totalUsers, newUsersThisMonth] = await Promise.all([
      userModel.countDocuments({ role: 'student' }),
      StudentProfile.countDocuments({ 'behaviorMetrics.lastActiveDate': { $gte: sevenDaysAgo } }),
      userModel.countDocuments({ role: 'instructor' }),
      userModel.countDocuments({}),
      userModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    // Active instructors (distinct instructorIds with submissions in last 7 days)
    const activeInstructorIds = await ClassAssignmentSubmission.distinct('instructorId', { submittedAt: { $gte: sevenDaysAgo } });

    // Total classes (distinct classId in submissions)
    const totalClasses = (await ClassAssignmentSubmission.distinct('classId')).length;

    // Enrollment distribution (students who appear in submissions vs total students)
    const enrolledStudentIds = await ClassAssignmentSubmission.distinct('studentId');
    const enrolledCount = enrolledStudentIds.length;

    // Top instructors by unique student count
    const topInstructorAgg = await ClassAssignmentSubmission.aggregate([
      { $group: { _id: "$instructorId", students: { $addToSet: "$studentId" } } },
      { $project: { count: { $size: "$students" } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: '$user.name', students: '$count' } }
    ]);

    // Difficult topics: aggregate from student profiles topicMastery low mastery
    const difficultTopicsAgg = await StudentProfile.aggregate([
      { $unwind: '$topicMastery' },
      { $group: { _id: '$topicMastery.topicName', avgMastery: { $avg: '$topicMastery.masteryScore' } } },
      { $sort: { avgMastery: 1 } },
      { $limit: 5 },
      { $project: { topic: '$_id', difficulty: { $multiply: [ { $subtract: [1, '$avgMastery'] }, 100 ] }, _id: 0 } }
    ]).catch(() => []);

    // Students per instructor distribution
    const perInstructor = await ClassAssignmentSubmission.aggregate([
      { $group: { _id: '$instructorId', students: { $addToSet: '$studentId' } } },
      { $project: { count: { $size: '$students' } } }
    ]);

    const buckets = { '0-10': 0, '11-20': 0, '21-30': 0, '31-40': 0, '41+': 0 };
    let minStudents = Infinity, maxStudents = 0, totalStudentInstructor = 0;
    
    perInstructor.forEach(p => {
      const c = p.count || 0;
      if (c > 0) {
        minStudents = Math.min(minStudents, c);
        maxStudents = Math.max(maxStudents, c);
        totalStudentInstructor += c;
      }
      if (c <= 10) buckets['0-10']++;
      else if (c <= 20) buckets['11-20']++;
      else if (c <= 30) buckets['21-30']++;
      else if (c <= 40) buckets['31-40']++;
      else buckets['41+']++;
    });

    const avgStudentsPerInstructor = perInstructor.length > 0 ? Math.round((totalStudentInstructor / perInstructor.length) * 10) / 10 : 0;
    minStudents = minStudents === Infinity ? 0 : minStudents;

    const studentsPerInstructorData = Object.keys(buckets).map(k => ({ range: k, count: buckets[k] }));

    // Association metrics
    const totalAssociated = enrolledCount; // Students who have at least one instructor
    const instructorsWithStudents = perInstructor.filter(p => p.count > 0).length;
    const instructorCoverage = totalInstructors > 0 ? Math.round((instructorsWithStudents / totalInstructors) * 100 * 10) / 10 : 0;

    const response = {
      kpiData: {
        totalStudents,
        activeStudents,
        totalInstructors,
        totalClasses,
        newUsersThisMonth
      },
      learningModuleData: {
        coursesStarted: await UserProgress.countDocuments({ $or: [{ 'stats.totalTopicsCompleted': { $gt: 0 } }, { 'stats.totalChaptersCompleted': { $gt: 0 } }] }),
        coursesCompleted: await UserProgress.countDocuments({ 'stats.totalChaptersCompleted': { $gte: 12 } }),
        avgProgress: Math.round((await UserProgress.aggregate([{ $group: { _id: null, avg: { $avg: '$stats.totalChaptersCompleted' } } }])).map(r=>r.avg || 0)[0] / 12 * 100) || 0,
        dropOffRate: Math.round((1 - (activeStudents / Math.max(totalStudents,1))) * 100 * 10) / 10,
        avgTimePerStudent: `${Math.round((await UserProgress.aggregate([{ $group: { _id: null, avgTime: { $avg: '$stats.totalTimeSpent' } } }])).map(r=>r.avgTime || 0)[0] / 3600) || 0}h`
      },
      classroomModuleData: {
        enrolled: enrolledCount,
        notEnrolled: Math.max(0, totalStudents - enrolledCount),
        assignmentCompletionRate: Math.round((await ClassAssignmentSubmission.countDocuments({ status: 'accepted' }) / Math.max(await ClassAssignmentSubmission.countDocuments({}),1)) * 100) || 0,
        avgAssignmentsPerStudent: Math.round((await ClassAssignmentSubmission.countDocuments({})) / Math.max(totalStudents,1) * 10) / 10,
        pendingRequests: await ClassRequest.countDocuments({ status: 'pending' })
      },
      difficultTopics: difficultTopicsAgg,
      topInstructors: topInstructorAgg,
      instructorStats: {
        withClasses: perInstructor.filter(p => p.count > 0).length,
        withoutClasses: Math.max(0, totalInstructors - perInstructor.filter(p => p.count > 0).length),
        avgStudentsPerInstructor: Math.round((perInstructor.reduce((s,p)=>s+(p.count||0),0) / Math.max(perInstructor.length,1)) * 10) / 10,
        pendingApprovals: await ClassRequest.countDocuments({ status: 'pending' }),
        activityLast7Days: activeInstructorIds.length
      },
      associationMetrics: {
        totalAssociated,
        instructorCoverage,
        minStudentsPerInstructor: minStudents,
        avgStudentsPerInstructor,
        maxStudentsPerInstructor: maxStudents
      },
      studentsPerInstructorData,
      enrollmentDistribution: [
        { name: 'Enrolled', value: enrolledCount, color: '#3b82f6' },
        { name: 'Not Enrolled', value: Math.max(0, totalStudents - enrolledCount), color: '#6b7280' }
      ]
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error("Admin metrics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/students
export const getStudents = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all students
    const students = await userModel.find({ role: 'student' }).select('_id name email createdAt');
    const studentIds = students.map(s => s._id);

    // Fetch profiles for all students
    const profiles = await StudentProfile.find({ userId: { $in: studentIds } });
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId.toString()] = p; });

    // Fetch assignment counts per student
    const assignmentCounts = await ClassAssignmentSubmission.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: { _id: '$studentId', count: { $sum: 1 } } }
    ]);
    const assignmentMap = {};
    assignmentCounts.forEach(a => { assignmentMap[a._id.toString()] = a.count; });

    // Fetch class enrollments per student (from submissions)
    const classEnrollments = await ClassAssignmentSubmission.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: { _id: '$studentId', classes: { $addToSet: '$classId' } } },
      { $project: { _id: 1, classCount: { $size: '$classes' } } }
    ]);
    const classMap = {};
    classEnrollments.forEach(c => { classMap[c._id.toString()] = c.classCount; });

    // Get progress data for learning module
    const progressData = await UserProgress.find({ userId: { $in: studentIds } });
    const progressMap = {};
    progressData.forEach(p => { progressMap[p.userId.toString()] = p; });

    // Build student list
    const studentList = students.map(student => {
      const profile = profileMap[student._id.toString()] || {};
      const progress = progressMap[student._id.toString()] || {};
      const lastActive = profile.behaviorMetrics?.lastActiveDate || student.createdAt;
      const coursesCompleted = progress.stats?.totalChaptersCompleted || 0;
      const assignmentsCompleted = assignmentMap[student._id.toString()] || 0;
      const enrolledClasses = classMap[student._id.toString()] || 0;
      
      // Calculate learning progress
      const maxChapters = 12;
      const learningProgress = Math.round((coursesCompleted / maxChapters) * 100);
      
      // Determine if at risk (low activity or progress)
      const daysInactive = (now - lastActive) / (1000 * 60 * 60 * 24);
      const isAtRisk = learningProgress < 50 || daysInactive > 7;
      
      // Determine status
      const status = daysInactive <= 7 ? 'active' : 'inactive';
      
      // Format last active
      let lastActiveStr = 'Never';
      if (lastActive) {
        const diffMs = now - lastActive;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (diffDays > 0) lastActiveStr = diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
        else if (diffHours > 0) lastActiveStr = diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
        else lastActiveStr = 'Just now';
      }

      return {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        status,
        learningProgress: Math.max(0, Math.min(100, learningProgress)),
        coursesCompleted,
        enrolledClasses,
        assignmentsCompleted,
        lastActive: lastActiveStr,
        isAtRisk
      };
    });

    res.status(200).json({ success: true, data: studentList });
  } catch (error) {
    console.error("Admin get students error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/instructors
export const getInstructors = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all instructors
    const instructors = await userModel.find({ role: 'instructor' }).select('_id name email createdAt');

    // Fetch classes for each instructor
    const instructorIds = instructors.map(i => i._id);
    const classData = await mongoose.connection.collection('classes').find({ instructorId: { $in: instructorIds } }).toArray();
    const classMap = {};
    const classIdsByInstructor = {};
    classData.forEach(c => {
      if (!classIdsByInstructor[c.instructorId.toString()]) classIdsByInstructor[c.instructorId.toString()] = [];
      classIdsByInstructor[c.instructorId.toString()].push(c._id);
      classMap[c._id.toString()] = c;
    });

    // Fetch all assignment submissions and calc stats
    const allSubmissions = await ClassAssignmentSubmission.find({ instructorId: { $in: instructorIds } });
    const submissionMap = {};
    const avgPerfMap = {};
    const lastActiveMap = {};
    const studentCountMap = {};

    allSubmissions.forEach(sub => {
      const instructorIdStr = sub.instructorId.toString();
      if (!submissionMap[instructorIdStr]) submissionMap[instructorIdStr] = [];
      submissionMap[instructorIdStr].push(sub);

      // Track last active
      if (!lastActiveMap[instructorIdStr] || sub.submittedAt > lastActiveMap[instructorIdStr]) {
        lastActiveMap[instructorIdStr] = sub.submittedAt;
      }

      // Track unique students
      if (!studentCountMap[instructorIdStr]) studentCountMap[instructorIdStr] = new Set();
      studentCountMap[instructorIdStr].add(sub.studentId.toString());
    });

    // Calculate average performance for each instructor
    instructorIds.forEach(iId => {
      const iIdStr = iId.toString();
      const subs = submissionMap[iIdStr] || [];
      if (subs.length > 0) {
        const avgPerf = Math.round(subs.reduce((sum, s) => sum + (s.percentage || 0), 0) / subs.length);
        avgPerfMap[iIdStr] = avgPerf;
      }
    });

    // Build instructor list
    const instructorList = instructors.map(instructor => {
      const iIdStr = instructor._id.toString();
      const classesCreated = classIdsByInstructor[iIdStr]?.length || 0;
      const totalStudents = studentCountMap[iIdStr]?.size || 0;
      const avgPerformance = avgPerfMap[iIdStr] || 0;
      const lastActive = lastActiveMap[iIdStr] || instructor.createdAt;
      const daysInactive = (now - lastActive) / (1000 * 60 * 60 * 24);
      const status = daysInactive <= 7 ? 'active' : 'inactive';

      // Format last active
      let lastActiveStr = 'Never';
      if (lastActive) {
        const diffMs = now - lastActive;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (diffDays > 0) lastActiveStr = diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
        else if (diffHours > 0) lastActiveStr = diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
        else lastActiveStr = 'Just now';
      }

      // Determine engagement level
      let engagementLevel = 'low';
      if (classesCreated >= 5 && avgPerformance >= 80) engagementLevel = 'high';
      else if (classesCreated >= 3 || avgPerformance >= 70) engagementLevel = 'medium';

      return {
        id: instructor._id.toString(),
        name: instructor.name,
        email: instructor.email,
        classesCreated,
        totalStudents,
        avgPerformance,
        lastActive: lastActiveStr,
        status,
        engagementLevel
      };
    });

    res.status(200).json({ success: true, data: instructorList });
  } catch (error) {
    console.error("Admin get instructors error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export default { login, metrics, getStudents, getInstructors };
