import Class from "../instructor/models/Class.js";
import mongoose from "mongoose";

// ============= CREATE CLASS =============
export const createClass = async (req, res) => {
  try {
    const { className, description, category, maxStudents, startDate, endDate, autoApproveStudents, allowLateSubmissions } = req.body;
    const instructorId = req.userId; // From auth middleware

    console.log("=== CREATE CLASS ===");
    console.log("Instructor ID:", instructorId);
    console.log("Body:", req.body);

    // Validate required fields
    if (!className || !className.trim()) {
      return res.status(400).json({
        success: false,
        message: "Class name is required",
      });
    }

    // Create new class
    const newClass = new Class({
      className: className.trim(),
      description: description || "",
      category: category || "Core Java",
      instructorId: new mongoose.Types.ObjectId(instructorId),
      maxStudents: maxStudents ? parseInt(maxStudents, 10) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      autoApproveStudents: autoApproveStudents || false,
      allowLateSubmissions: allowLateSubmissions !== false, // default true
      students: [],
      isActive: true,
    });

    const savedClass = await newClass.save();

    console.log("Class created successfully:", savedClass);

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: savedClass,
    });
  } catch (error) {
    console.error("Error creating class:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating class",
      error: error.message,
    });
  }
};

// ============= GET ALL CLASSES (Instructor-specific) =============
export const getInstructorClasses = async (req, res) => {
  try {
    const instructorId = req.userId; // From auth middleware

    console.log("=== GET INSTRUCTOR CLASSES ===");
    console.log("Instructor ID:", instructorId);

    const classes = await Class.find({
      instructorId: new mongoose.Types.ObjectId(instructorId),
    })
      .populate("instructorId", "name email")
      .populate("students", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: classes,
      count: classes.length,
    });
  } catch (error) {
    console.error("Error fetching instructor classes:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching classes",
      error: error.message,
    });
  }
};

// ============= GET SINGLE CLASS =============
export const getClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const instructorId = req.userId;

    // Validate classId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID format",
      });
    }

    const classData = await Class.findById(classId)
      .populate("instructorId", "name email")
      .populate("students", "name email");

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Verify instructor ownership
    if (classData.instructorId._id.toString() !== instructorId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this class",
      });
    }

    res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    console.error("Error fetching class:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching class",
      error: error.message,
    });
  }
};

// ============= UPDATE CLASS =============
export const updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const instructorId = req.userId;
    const { className, description, category, maxStudents, startDate, endDate, autoApproveStudents, allowLateSubmissions } = req.body;

    // Validate classId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID format",
      });
    }

    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Verify instructor ownership
    if (classData.instructorId.toString() !== instructorId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this class",
      });
    }

    // Update fields
    if (className) classData.className = className.trim();
    if (description !== undefined) classData.description = description;
    if (category) classData.category = category;
    if (maxStudents !== undefined) classData.maxStudents = maxStudents ? parseInt(maxStudents, 10) : null;
    if (startDate !== undefined) classData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) classData.endDate = endDate ? new Date(endDate) : null;
    if (autoApproveStudents !== undefined) classData.autoApproveStudents = autoApproveStudents;
    if (allowLateSubmissions !== undefined) classData.allowLateSubmissions = allowLateSubmissions;

    const updatedClass = await classData.save();

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: updatedClass,
    });
  } catch (error) {
    console.error("Error updating class:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }
    res.status(500).json({
      success: false,
      message: "Error updating class",
      error: error.message,
    });
  }
};

// ============= DELETE CLASS =============
export const deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const instructorId = req.userId;

    // Validate classId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID format",
      });
    }

    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Verify instructor ownership
    if (classData.instructorId.toString() !== instructorId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this class",
      });
    }

    await Class.findByIdAndDelete(classId);

    res.status(200).json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting class",
      error: error.message,
    });
  }
};
