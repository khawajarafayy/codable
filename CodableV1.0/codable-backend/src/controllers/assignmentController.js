import mongoose from "mongoose";
import Class from "../instructor/models/Class.js";
import ClassAssignment from "../instructor/models/ClassAssignment.js";
import User from "../models/User.js";
import ClassAssignmentSubmission from "../models/ClassAssignmentSubmission.js";
import { broadcastToUser } from "../websocket/codeRunner.js";

function sanitizeMcqsForStudent(mcqs = []) {
  return mcqs.map((q, index) => ({
    id: q.id || String(index + 1),
    question: q.question,
    options: q.options,
  }));
}

function normalizeSelectedOption(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return ["A", "B", "C", "D"].includes(normalized) ? normalized : "";
}

/** All assignments across classes owned by this instructor */
export const listAllAssignmentsForInstructor = async (req, res) => {
  try {
    const instructorId = req.userId;
    const classes = await Class.find({
      instructorId: new mongoose.Types.ObjectId(instructorId),
    }).select("_id className");
    const ids = classes.map((c) => c._id);
    if (ids.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }
    const rows = await ClassAssignment.find({ classId: { $in: ids } })
      .sort({ updatedAt: -1 })
      .lean();

    const assignmentIds = rows.map((r) => r._id);
    const submissionStats = assignmentIds.length
      ? await ClassAssignmentSubmission.aggregate([
          {
            $match: {
              assignmentId: { $in: assignmentIds },
            },
          },
          {
            $group: {
              _id: "$assignmentId",
              submissions: { $sum: 1 },
              averageScore: { $avg: "$percentage" },
              lastSubmittedAt: { $max: "$submittedAt" },
            },
          },
        ])
      : [];

    const statsByAssignmentId = Object.fromEntries(
      submissionStats.map((s) => [String(s._id), s])
    );

    const nameById = Object.fromEntries(classes.map((c) => [String(c._id), c.className]));
    const enriched = rows.map((r) => ({
      ...r,
      className: nameById[String(r.classId)] || "",
      submissions: statsByAssignmentId[String(r._id)]?.submissions || 0,
      averageScore: Math.round((statsByAssignmentId[String(r._id)]?.averageScore || 0) * 100) / 100,
      lastSubmittedAt: statsByAssignmentId[String(r._id)]?.lastSubmittedAt || null,
    }));
    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error("listAllAssignmentsForInstructor:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

async function assertInstructorOwnsClass(classId, instructorId) {
  const cls = await Class.findOne({
    _id: new mongoose.Types.ObjectId(classId),
    instructorId: new mongoose.Types.ObjectId(instructorId),
  });
  return cls;
}

/** Instructor: list all assignments for a class (draft + published) */
export const listAssignmentsForClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const instructorId = req.userId;

    const cls = await assertInstructorOwnsClass(classId, instructorId);
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const rows = await ClassAssignment.find({ classId: cls._id })
      .sort({ createdAt: -1 })
      .lean();

    const assignmentIds = rows.map((r) => r._id);
    const submissionStats = assignmentIds.length
      ? await ClassAssignmentSubmission.aggregate([
          { $match: { assignmentId: { $in: assignmentIds } } },
          {
            $group: {
              _id: "$assignmentId",
              submissions: { $sum: 1 },
              averageScore: { $avg: "$percentage" },
            },
          },
        ])
      : [];

    const statsById = Object.fromEntries(submissionStats.map((s) => [String(s._id), s]));
    const enriched = rows.map((r) => ({
      ...r,
      submissions: statsById[String(r._id)]?.submissions || 0,
      averageScore:
        Math.round((statsById[String(r._id)]?.averageScore || 0) * 100) / 100,
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error("listAssignmentsForClass:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Instructor: create assignment (usually draft after RAG) */
export const createAssignment = async (req, res) => {
  try {
    const { classId } = req.params;
    const instructorId = req.userId;
    const {
      title,
      description = "",
      deadline,
      status = "draft",
      difficulty = "M",
      chapterIds = [],
      topics = [],
      mcqs = [],
      points,
      ragMeta,
    } = req.body || {};

    const cls = await assertInstructorOwnsClass(classId, instructorId);
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: "title is required" });
    }
    if (!deadline) {
      return res.status(400).json({ success: false, message: "deadline is required" });
    }

    const st = status === "published" ? "published" : "draft";
    const doc = await ClassAssignment.create({
      classId: cls._id,
      instructorId: new mongoose.Types.ObjectId(instructorId),
      title: String(title).trim(),
      description: String(description || "").slice(0, 2000),
      deadline: new Date(deadline),
      status: st,
      difficulty: ["L", "M", "H"].includes(difficulty) ? difficulty : "M",
      chapterIds: Array.isArray(chapterIds) ? chapterIds.map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n)) : [],
      topics: Array.isArray(topics) ? topics.map(String) : [],
      mcqs: Array.isArray(mcqs) ? mcqs : [],
      points: typeof points === "number" ? points : undefined,
      ragMeta: ragMeta ?? null,
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error("createAssignment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Instructor: update (e.g. publish draft) or edit fields */
export const updateAssignment = async (req, res) => {
  try {
    const { classId, assignmentId } = req.params;
    const instructorId = req.userId;

    const cls = await assertInstructorOwnsClass(classId, instructorId);
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const doc = await ClassAssignment.findOne({
      _id: new mongoose.Types.ObjectId(assignmentId),
      classId: cls._id,
      instructorId: new mongoose.Types.ObjectId(instructorId),
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    const b = req.body;
    if (b.title !== undefined) doc.title = String(b.title).trim().slice(0, 500);
    if (b.description !== undefined) doc.description = String(b.description || "").slice(0, 2000);
    if (b.deadline !== undefined) doc.deadline = new Date(b.deadline);
    if (b.status !== undefined) doc.status = b.status === "published" ? "published" : "draft";
    if (b.difficulty !== undefined && ["L", "M", "H"].includes(b.difficulty)) doc.difficulty = b.difficulty;
    if (b.chapterIds !== undefined) {
      doc.chapterIds = Array.isArray(b.chapterIds)
        ? b.chapterIds.map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n))
        : [];
    }
    if (b.topics !== undefined) doc.topics = Array.isArray(b.topics) ? b.topics.map(String) : [];
    if (b.mcqs !== undefined) doc.mcqs = Array.isArray(b.mcqs) ? b.mcqs : [];
    if (b.points !== undefined) doc.points = Number(b.points) || doc.mcqs?.length || 0;
    if (b.ragMeta !== undefined) doc.ragMeta = b.ragMeta;

    await doc.save();
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error("updateAssignment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Instructor: delete assignment */
export const deleteAssignment = async (req, res) => {
  try {
    const { classId, assignmentId } = req.params;
    const instructorId = req.userId;

    const cls = await assertInstructorOwnsClass(classId, instructorId);
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const result = await ClassAssignment.deleteOne({
      _id: new mongoose.Types.ObjectId(assignmentId),
      classId: cls._id,
      instructorId: new mongoose.Types.ObjectId(instructorId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    return res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("deleteAssignment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Student: published assignments for enrolled class */
export const listPublishedAssignmentsForStudent = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.userId;

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const enrolled = classDoc.students.some((id) => id.toString() === studentId);
    if (!enrolled) {
      return res.status(403).json({ success: false, message: "You are not enrolled in this class" });
    }

    const rows = await ClassAssignment.find({
      classId: classDoc._id,
      status: "published",
    })
      .sort({ deadline: 1 })
      .select("-ragMeta")
      .lean();

    const assignmentIds = rows.map((r) => r._id);
    const existingSubmissions = assignmentIds.length
      ? await ClassAssignmentSubmission.find({
          assignmentId: { $in: assignmentIds },
          studentId: new mongoose.Types.ObjectId(studentId),
        })
          .select("assignmentId score totalQuestions percentage submittedAt")
          .lean()
      : [];
    const submissionByAssignmentId = Object.fromEntries(
      existingSubmissions.map((s) => [String(s.assignmentId), s])
    );

    const safeRows = rows.map((row) => {
      const submission = submissionByAssignmentId[String(row._id)];
      return {
        ...row,
        mcqs: sanitizeMcqsForStudent(row.mcqs),
        hasSubmitted: Boolean(submission),
        submissionSummary: submission
          ? {
              score: submission.score,
              totalQuestions: submission.totalQuestions,
              percentage: submission.percentage,
              submittedAt: submission.submittedAt,
            }
          : null,
      };
    });

    return res.status(200).json({ success: true, data: safeRows });
  } catch (error) {
    console.error("listPublishedAssignmentsForStudent:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Student: get single published assignment for attempting */
export const getPublishedAssignmentForStudent = async (req, res) => {
  try {
    const { classId, assignmentId } = req.params;
    const studentId = req.userId;

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const enrolled = classDoc.students.some((id) => id.toString() === studentId);
    if (!enrolled) {
      return res.status(403).json({ success: false, message: "You are not enrolled in this class" });
    }

    const assignment = await ClassAssignment.findOne({
      _id: new mongoose.Types.ObjectId(assignmentId),
      classId: classDoc._id,
      status: "published",
    })
      .select("-ragMeta")
      .lean();

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    const submission = await ClassAssignmentSubmission.findOne({
      assignmentId: assignment._id,
      studentId: new mongoose.Types.ObjectId(studentId),
    })
      .select("score totalQuestions percentage submittedAt")
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        ...assignment,
        mcqs: sanitizeMcqsForStudent(assignment.mcqs),
        hasSubmitted: Boolean(submission),
        submissionSummary: submission || null,
      },
    });
  } catch (error) {
    console.error("getPublishedAssignmentForStudent:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Student: submit assignment answers */
export const submitAssignmentForStudent = async (req, res) => {
  try {
    const { classId, assignmentId } = req.params;
    const studentId = req.userId;
    const { answers } = req.body || {};

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ success: false, message: "answers object is required" });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const enrolled = classDoc.students.some((id) => id.toString() === studentId);
    if (!enrolled) {
      return res.status(403).json({ success: false, message: "You are not enrolled in this class" });
    }

    const assignment = await ClassAssignment.findOne({
      _id: new mongoose.Types.ObjectId(assignmentId),
      classId: classDoc._id,
      status: "published",
    }).lean();

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    if (!Array.isArray(assignment.mcqs) || assignment.mcqs.length === 0) {
      return res.status(400).json({ success: false, message: "This assignment has no MCQs to submit" });
    }

    const existingSubmission = await ClassAssignmentSubmission.findOne({
      assignmentId: assignment._id,
      studentId: new mongoose.Types.ObjectId(studentId),
    }).lean();
    if (existingSubmission) {
      return res.status(409).json({ success: false, message: "Assignment already submitted" });
    }

    const attempts = assignment.mcqs.map((question, index) => {
      const selectedOption = normalizeSelectedOption(
        answers[index] ?? answers[String(index)] ?? answers[question.id]
      );
      const correctOption = normalizeSelectedOption(question.correct);
      const isCorrect = selectedOption !== "" && selectedOption === correctOption;
      return {
        questionIndex: index,
        questionId: question.id || String(index + 1),
        selectedOption,
        correctOption,
        isCorrect,
      };
    });

    const score = attempts.filter((a) => a.isCorrect).length;
    const totalQuestions = assignment.mcqs.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 10000) / 100 : 0;

    const submission = await ClassAssignmentSubmission.create({
      classId: classDoc._id,
      assignmentId: assignment._id,
      instructorId: assignment.instructorId,
      studentId: new mongoose.Types.ObjectId(studentId),
      answers: attempts,
      score,
      totalQuestions,
      percentage,
      submittedAt: new Date(),
    });

    const student = await User.findById(studentId).select("name email").lean();
    broadcastToUser(String(assignment.instructorId), {
      type: "assignment_submission",
      data: {
        classId: String(classDoc._id),
        className: classDoc.className,
        assignmentId: String(assignment._id),
        assignmentTitle: assignment.title,
        studentId,
        studentName: student?.name || "Student",
        score,
        totalQuestions,
        percentage,
        submittedAt: submission.submittedAt,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Assignment submitted successfully",
      data: {
        assignmentId: String(assignment._id),
        score,
        totalQuestions,
        percentage,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error) {
    console.error("submitAssignmentForStudent:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Instructor: get per-student report for assignment submissions */
export const getAssignmentSubmissionsForInstructor = async (req, res) => {
  try {
    const { classId, assignmentId } = req.params;
    const instructorId = req.userId;

    const cls = await assertInstructorOwnsClass(classId, instructorId);
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const assignment = await ClassAssignment.findOne({
      _id: new mongoose.Types.ObjectId(assignmentId),
      classId: cls._id,
      instructorId: new mongoose.Types.ObjectId(instructorId),
    })
      .select("title status deadline mcqs points")
      .lean();

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    const submissions = await ClassAssignmentSubmission.find({
      assignmentId: assignment._id,
      classId: cls._id,
    })
      .populate("studentId", "name email")
      .sort({ submittedAt: -1 })
      .lean();

    const totalStudents = Array.isArray(cls.students) ? cls.students.length : 0;
    const submittedCount = submissions.length;
    const avgPercentage =
      submittedCount > 0
        ? Math.round(
            (submissions.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0) / submittedCount) * 100
          ) / 100
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        assignment: {
          id: String(assignment._id),
          title: assignment.title,
          status: assignment.status,
          deadline: assignment.deadline,
          totalQuestions: assignment.mcqs?.length || 0,
          points: assignment.points || assignment.mcqs?.length || 0,
        },
        summary: {
          totalStudents,
          submittedCount,
          pendingCount: Math.max(totalStudents - submittedCount, 0),
          avgPercentage,
        },
        submissions: submissions.map((s) => ({
          id: String(s._id),
          studentId: String(s.studentId?._id || ""),
          studentName: s.studentId?.name || "Unknown Student",
          studentEmail: s.studentId?.email || "",
          score: s.score,
          totalQuestions: s.totalQuestions,
          percentage: s.percentage,
          submittedAt: s.submittedAt,
          answers: (s.answers || []).map((a) => ({
            questionIndex: a.questionIndex,
            questionId: a.questionId,
            selectedOption: a.selectedOption,
            correctOption: a.correctOption,
            isCorrect: a.isCorrect,
          })),
        })),
      },
    });
  } catch (error) {
    console.error("getAssignmentSubmissionsForInstructor:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
