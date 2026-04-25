import Class from "../instructor/models/Class.js";
import ClassRequest from "../instructor/models/ClassRequest.js";
import userModel from "../models/User.js";
import mongoose from "mongoose";
import ClassAssignment from "../instructor/models/ClassAssignment.js";
import ClassAssignmentSubmission from "../models/ClassAssignmentSubmission.js";

// ============= JOIN CLASS =============
export const joinClass = async (req, res) => {
  try {
    const { joinCode } = req.body;
    const studentId = req.userId;

    console.log("=== JOIN CLASS ===");
    console.log("Student ID:", studentId);
    console.log("Join Code:", joinCode);

    // Validate join code
    if (!joinCode || !joinCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Join code is required",
      });
    }

    // Find class by join code
    const classDoc = await Class.findOne({
      joinCode: joinCode.toUpperCase().trim(),
    }).populate("instructorId", "name email");

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Invalid join code. Class not found",
      });
    }

    // Check if student already enrolled
    if (classDoc.students.includes(studentId)) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this class",
      });
    }

    // Check for existing pending request
    const existingRequest = await ClassRequest.findOne({
      studentId: new mongoose.Types.ObjectId(studentId),
      classId: classDoc._id,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending request for this class",
      });
    }

    // If auto-approve is enabled, directly enroll the student
    if (classDoc.autoApproveStudents) {
      classDoc.students.push(new mongoose.Types.ObjectId(studentId));
      await classDoc.save();

      // Create approved request record
      const classRequest = new ClassRequest({
        studentId: new mongoose.Types.ObjectId(studentId),
        classId: classDoc._id,
        instructorId: classDoc.instructorId._id,
        status: "approved",
        respondedAt: new Date(),
      });
      await classRequest.save();

      return res.status(200).json({
        success: true,
        message: "Automatically approved and enrolled in class",
        data: {
          classId: classDoc._id,
          className: classDoc.className,
          instructorName: classDoc.instructorId.name,
          joinCode: classDoc.joinCode,
        },
      });
    }

    // Create pending request
    const classRequest = new ClassRequest({
      studentId: new mongoose.Types.ObjectId(studentId),
      classId: classDoc._id,
      instructorId: classDoc.instructorId._id,
      status: "pending",
    });

    await classRequest.save();

    res.status(201).json({
      success: true,
      message: "Join request sent successfully",
      data: {
        requestId: classRequest._id,
        classId: classDoc._id,
        className: classDoc.className,
        instructorName: classDoc.instructorId.name,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Error joining class:", error);
    res.status(500).json({
      success: false,
      message: "Error joining class",
      error: error.message,
    });
  }
};

// ============= GET STUDENT CLASSES =============
export const getStudentClasses = async (req, res) => {
  try {
    const studentId = req.userId;

    console.log("=== GET STUDENT CLASSES ===");
    console.log("Student ID:", studentId);

    const classes = await Class.find({
      students: new mongoose.Types.ObjectId(studentId),
    })
      .populate("instructorId", "name email")
      .sort({ createdAt: -1 });

    const classIds = classes.map(c => c._id);

    // Get all published assignments for these classes
    const assignmentsAggr = await ClassAssignment.aggregate([
      { $match: { classId: { $in: classIds }, status: "published" } },
      { $group: { _id: "$classId", count: { $sum: 1 } } }
    ]);
    const assignmentCounts = Object.fromEntries(assignmentsAggr.map(a => [String(a._id), a.count]));

    // Get all submissions for this student for these classes
    const submissionsAggr = await ClassAssignmentSubmission.aggregate([
      { $match: { classId: { $in: classIds }, studentId: new mongoose.Types.ObjectId(studentId) } },
      { $group: { _id: "$classId", count: { $sum: 1 } } }
    ]);
    const submissionCounts = Object.fromEntries(submissionsAggr.map(s => [String(s._id), s.count]));

    // Format response with progress info
    const formattedClasses = classes.map((classDoc) => {
      const classIdStr = String(classDoc._id);
      const totalAssignments = assignmentCounts[classIdStr] || 0;
      const completed = submissionCounts[classIdStr] || 0;
      const progress = totalAssignments > 0 ? Math.round((completed / totalAssignments) * 100) : 0;

      return {
        id: classDoc._id,
        classId: classDoc._id,
        className: classDoc.className,
        instructorName: classDoc.instructorId.name,
        instructorId: classDoc.instructorId._id,
        instructorEmail: classDoc.instructorId.email,
        joinCode: classDoc.joinCode,
        description: classDoc.description,
        category: classDoc.category,
        createdAt: classDoc.createdAt,
        startDate: classDoc.startDate,
        endDate: classDoc.endDate,
        enrolledStudents: classDoc.students.length,
        assignments: totalAssignments,
        completed: completed,
        progress: progress,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedClasses,
    });
  } catch (error) {
    console.error("Error fetching student classes:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching classes",
      error: error.message,
    });
  }
};

// ============= GET CLASS REQUESTS (Pending) =============
export const getClassRequests = async (req, res) => {
  try {
    const studentId = req.userId;
    const { status = "pending" } = req.query;

    console.log("=== GET CLASS REQUESTS ===");
    console.log("Student ID:", studentId);
    console.log("Status:", status);

    const requests = await ClassRequest.find({
      studentId: new mongoose.Types.ObjectId(studentId),
      status: status,
    })
      .populate("classId", "className instructorId joinCode")
      .populate("instructorId", "name email")
      .sort({ requestedAt: -1 });

    const formattedRequests = requests.map((req) => ({
      id: req._id,
      requestId: req._id,
      classId: req.classId._id,
      className: req.classId.className,
      instructor: req.instructorId.name,
      instructorId: req.instructorId._id,
      joinCode: req.classId.joinCode,
      status: req.status,
      requestedAt: req.requestedAt,
      respondedAt: req.respondedAt,
      notes: req.instructorNotes,
    }));

    res.status(200).json({
      success: true,
      data: formattedRequests,
    });
  } catch (error) {
    console.error("Error fetching class requests:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching class requests",
      error: error.message,
    });
  }
};

// ============= GET CLASS DETAILS (Student View) =============
export const getClassDetails = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.userId;

    console.log("=== GET CLASS DETAILS (Student View) ===");
    console.log("Class ID:", classId);
    console.log("Student ID:", studentId);

    const classDoc = await Class.findById(classId)
      .populate("instructorId", "name email")
      .populate("students", "name email");

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Check if student is enrolled
    if (!classDoc.students.some((s) => s._id.toString() === studentId)) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this class",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: classDoc._id,
        className: classDoc.className,
        description: classDoc.description,
        category: classDoc.category,
        instructorName: classDoc.instructorId.name,
        instructorId: classDoc.instructorId._id,
        instructorEmail: classDoc.instructorId.email,
        joinCode: classDoc.joinCode,
        startDate: classDoc.startDate,
        endDate: classDoc.endDate,
        enrolledStudents: classDoc.students.length,
        createdAt: classDoc.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching class details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching class details",
      error: error.message,
    });
  }
};
