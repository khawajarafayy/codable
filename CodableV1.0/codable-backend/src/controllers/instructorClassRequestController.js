import Class from "../instructor/models/Class.js";
import ClassRequest from "../instructor/models/ClassRequest.js";
import userModel from "../models/User.js";
import mongoose from "mongoose";
import { broadcastToUser } from "../websocket/codeRunner.js";

// ============= GET PENDING REQUESTS =============
export const getPendingRequests = async (req, res) => {
  try {
    const instructorId = req.userId;

    console.log("=== GET PENDING REQUESTS ===");
    console.log("Instructor ID:", instructorId);

    // Get all pending requests for this instructor's classes
    const requests = await ClassRequest.find({
      instructorId: new mongoose.Types.ObjectId(instructorId),
      status: "pending",
    })
      .populate("studentId", "name email")
      .populate("classId", "className joinCode")
      .sort({ requestedAt: -1 });

    const formattedRequests = requests.map((req) => ({
      id: req._id,
      requestId: req._id,
      studentId: req.studentId._id,
      studentName: req.studentId.name,
      studentEmail: req.studentId.email,
      classId: req.classId._id,
      className: req.classId.className,
      joinCode: req.classId.joinCode,
      requestedAt: req.requestedAt,
      status: req.status,
    }));

    res.status(200).json({
      success: true,
      data: formattedRequests,
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending requests",
      error: error.message,
    });
  }
};

// ============= GET ALL REQUESTS FOR A CLASS =============
export const getClassRequests = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { classId } = req.params;
    const { status } = req.query;

    console.log("=== GET CLASS REQUESTS ===");
    console.log("Instructor ID:", instructorId);
    console.log("Class ID:", classId);

    // Verify instructor owns the class
    const classDoc = await Class.findOne({
      _id: new mongoose.Types.ObjectId(classId),
      instructorId: new mongoose.Types.ObjectId(instructorId),
    });

    if (!classDoc) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view requests for this class",
      });
    }

    // Build filter
    const filter = {
      classId: new mongoose.Types.ObjectId(classId),
      instructorId: new mongoose.Types.ObjectId(instructorId),
    };

    if (status) {
      filter.status = status;
    }

    const requests = await ClassRequest.find(filter)
      .populate("studentId", "name email")
      .sort({ requestedAt: -1 });

    const formattedRequests = requests.map((req) => ({
      id: req._id,
      requestId: req._id,
      studentId: req.studentId._id,
      studentName: req.studentId.name,
      studentEmail: req.studentId.email,
      classId: req.classId,
      className: classDoc.className,
      requestedAt: req.requestedAt,
      respondedAt: req.respondedAt,
      status: req.status,
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

// ============= APPROVE REQUEST =============
export const approveRequest = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { requestId } = req.params;
    const { notes } = req.body;

    console.log("=== APPROVE REQUEST ===");
    console.log("Instructor ID:", instructorId);
    console.log("Request ID:", requestId);

    // Get request
    const classRequest = await ClassRequest.findById(requestId)
      .populate("studentId", "name email")
      .populate("classId")
      .populate("instructorId");

    if (!classRequest) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Verify instructor owns the request
    if (classRequest.instructorId._id.toString() !== instructorId) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to approve this request",
      });
    }

    // Verify request is pending
    if (classRequest.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: `Request is already ${classRequest.status}`,
      });
    }

    // Add student to class
    const classDoc = await Class.findById(classRequest.classId._id);
    if (!classDoc.students.includes(classRequest.studentId._id)) {
      classDoc.students.push(classRequest.studentId._id);
      await classDoc.save();
    }

    // Update request status
    classRequest.status = "approved";
    classRequest.respondedAt = new Date();
    if (notes) {
      classRequest.instructorNotes = notes;
    }
    await classRequest.save();

    // Broadcast WebSocket notification to student
    broadcastToUser(classRequest.studentId._id.toString(), {
      type: "CLASS_APPROVED",
      classRequestId: classRequest._id,
      classId: classRequest.classId._id,
      classData: {
        id: classDoc._id,
        classId: classDoc._id,
        className: classDoc.className,
        instructorName: classRequest.instructorId.name,
        joinCode: classDoc.joinCode,
        enrolledStudents: classDoc.students.length,
      },
    });

    res.status(200).json({
      success: true,
      message: "Student approved successfully",
      data: {
        requestId: classRequest._id,
        studentName: classRequest.studentId.name,
        className: classRequest.classId.className,
        status: "approved",
      },
    });
  } catch (error) {
    console.error("Error approving request:", error);
    res.status(500).json({
      success: false,
      message: "Error approving request",
      error: error.message,
    });
  }
};

// ============= REJECT REQUEST =============
export const rejectRequest = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { requestId } = req.params;
    const { notes } = req.body;

    console.log("=== REJECT REQUEST ===");
    console.log("Instructor ID:", instructorId);
    console.log("Request ID:", requestId);

    // Get request
    const classRequest = await ClassRequest.findById(requestId)
      .populate("studentId", "name email")
      .populate("classId")
      .populate("instructorId");

    if (!classRequest) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Verify instructor owns the request
    if (classRequest.instructorId._id.toString() !== instructorId) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to reject this request",
      });
    }

    // Verify request is pending
    if (classRequest.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: `Request is already ${classRequest.status}`,
      });
    }

    // Update request status
    classRequest.status = "rejected";
    classRequest.respondedAt = new Date();
    if (notes) {
      classRequest.instructorNotes = notes;
    }
    await classRequest.save();

    // Broadcast WebSocket notification to student
    broadcastToUser(classRequest.studentId._id.toString(), {
      type: "CLASS_REJECTED",
      classRequestId: classRequest._id,
      classId: classRequest.classId._id,
      className: classRequest.classId.className,
      notes: notes || "Your request to join this class was rejected",
    });

    res.status(200).json({
      success: true,
      message: "Student request rejected",
      data: {
        requestId: classRequest._id,
        studentName: classRequest.studentId.name,
        className: classRequest.classId.className,
        status: "rejected",
      },
    });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting request",
      error: error.message,
    });
  }
};
