import mongoose from "mongoose";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import Class from "../instructor/models/Class.js";
import ClassAssignment from "../instructor/models/ClassAssignment.js";
import User from "../models/User.js";
import ClassAssignmentSubmission from "../models/ClassAssignmentSubmission.js";
import { broadcastToUser } from "../websocket/codeRunner.js";
import { analyzeComplexity } from "../utils/complexityAnalyzer.js";

function sanitizeMcqsForStudent(mcqs = []) {
  return mcqs.map((q, index) => ({
    id: q.id || String(index + 1),
    question: q.question,
    options: q.options,
  }));
}

function sanitizeCodingTasksForStudent(tasks = []) {
  return tasks.map((t) => ({
    id: t.id,
    problemStatement: t.problemStatement,
    inputFormat: t.inputFormat,
    outputFormat: t.outputFormat,
    sampleTestCases: t.sampleTestCases,
    expectedConcepts: t.expectedConcepts,
  }));
}

function normalizeSelectedOption(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return ["A", "B", "C", "D"].includes(normalized) ? normalized : "";
}

function normalizeCodingSubmissions(raw = []) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => ({
    taskId: String(item?.taskId || item?.id || index + 1),
    codeSnippet: String(item?.codeSnippet || item?.code || ""),
    testCasesPassed: Number(item?.testCasesPassed || 0),
    totalTestCases: Number(item?.totalTestCases || 0),
    aiCodeAnalysis: {
      logic: String(item?.aiCodeAnalysis?.logic || ""),
      quality: String(item?.aiCodeAnalysis?.quality || ""),
      structure: String(item?.aiCodeAnalysis?.structure || ""),
      score: Number(item?.aiCodeAnalysis?.score || 0),
    },
    complexityAnalysis: {
      timeComplexity: String(item?.complexityAnalysis?.timeComplexity || ""),
      spaceComplexity: String(item?.complexityAnalysis?.spaceComplexity || ""),
    },
  }));
}

async function runJavaCodeAgainstInput(codeSnippet, input = "", timeoutMs = 8000) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codable-assignment-"));
  const classNameMatch = String(codeSnippet || "").match(/public\s+class\s+(\w+)/);
  const className = classNameMatch ? classNameMatch[1] : "Main";
  const sourceFile = path.join(tempDir, `${className}.java`);
  try {
    await fs.writeFile(sourceFile, String(codeSnippet || ""), "utf8");

    const compileExit = await new Promise((resolve) => {
      const javac = spawn("javac", [sourceFile], { cwd: tempDir });
      let stderr = "";
      javac.stderr.on("data", (d) => {
        stderr += d.toString();
      });
      javac.on("close", (code) => resolve({ code, stderr }));
      javac.on("error", (err) => resolve({ code: -1, stderr: String(err?.message || err) }));
    });

    if (compileExit.code !== 0) {
      return { success: false, output: "", error: compileExit.stderr || "Compilation failed" };
    }

    const runResult = await new Promise((resolve) => {
      const proc = spawn("java", ["-cp", tempDir, className], { cwd: tempDir });
      let stdout = "";
      let stderr = "";
      let killed = false;
      const timer = setTimeout(() => {
        killed = true;
        proc.kill("SIGKILL");
      }, timeoutMs);

      proc.stdout.on("data", (d) => {
        stdout += d.toString();
      });
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });
      proc.on("close", (code) => {
        clearTimeout(timer);
        resolve({
          success: code === 0 && !killed,
          output: (stdout || "").trim(),
          error: killed ? "Execution timed out" : (stderr || "").trim(),
        });
      });
      proc.on("error", (err) => {
        clearTimeout(timer);
        resolve({ success: false, output: "", error: String(err?.message || err) });
      });

      if (input) {
        proc.stdin.write(String(input));
      }
      proc.stdin.end();
    });

    return runResult;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function evaluateCodingTaskSubmission(task, submission) {
  const hiddenCases = Array.isArray(task?.hiddenTestCases) ? task.hiddenTestCases : [];
  const sampleCases = Array.isArray(task?.sampleTestCases) ? task.sampleTestCases : [];
  const allCases = hiddenCases.length > 0 ? hiddenCases : sampleCases;

  if (!submission?.codeSnippet || allCases.length === 0) {
    return {
      passed: 0,
      total: allCases.length,
      scoreOutOfTen: 0,
      executionNotes: "No runnable code or no test cases",
    };
  }

  let passed = 0;
  for (const tc of allCases) {
    let run = await runJavaCodeAgainstInput(submission.codeSnippet, tc?.input || "");
    const expected = String(tc?.output || "").trim();
    let actual = String(run?.output || "").trim();
    
    // We want to pass the test if the output matches the expected output,
    // ignoring any prompts like "Enter name:"
    let aLower = actual.toLowerCase().replace(/\s+/g, "");
    let eLower = expected.toLowerCase().replace(/\s+/g, "");

    let isCorrect = false;

    // Check match
    const checkMatch = (actLines, expLines, actLower, expLower) => {
      if (actLower === expLower || actLower.includes(expLower)) return true;
      if (expLines.length > 0) {
        let matchCount = 0;
        for (const eLine of expLines) {
           for (const aLine of actLines) {
              if (aLine === eLine) {
                 matchCount++;
                 break;
              } else if (eLine.includes(':') && aLine.includes(':')) {
                 if (eLine.split(':')[0].trim().toLowerCase() === aLine.split(':')[0].trim().toLowerCase()) {
                    matchCount++;
                    break;
                 }
              } else if (eLine.includes('=') && aLine.includes('=')) {
                 if (eLine.split('=')[0].trim().toLowerCase() === aLine.split('=')[0].trim().toLowerCase()) {
                    matchCount++;
                    break;
                 }
              }
           }
        }
        if (matchCount === expLines.length) return true;
      }
      return false;
    };

    let actualLines = actual.split('\n').map(l => l.trim()).filter(Boolean);
    const expectedLines = expected.split('\n').map(l => l.trim()).filter(Boolean);

    isCorrect = checkMatch(actualLines, expectedLines, aLower, eLower);

    // Fallback: If the student code threw an exception (e.g. NoSuchElementException)
    // or failed to match because they used input.nextLine() instead of input.next()
    // for space-separated inputs, we try replacing spaces with newlines.
    if (!isCorrect && String(tc?.input || "").includes(" ")) {
       const splitInput = String(tc?.input || "").replace(/ /g, '\n');
       const fallbackRun = await runJavaCodeAgainstInput(submission.codeSnippet, splitInput);
       const fbActual = String(fallbackRun?.output || "").trim();
       const fbALower = fbActual.toLowerCase().replace(/\s+/g, "");
       const fbActualLines = fbActual.split('\n').map(l => l.trim()).filter(Boolean);
       if (checkMatch(fbActualLines, expectedLines, fbALower, eLower)) {
           isCorrect = true;
           run = fallbackRun;
       }
    }

    if (isCorrect) {
      passed += 1;
    }
  }

  const scoreOutOfTen = allCases.length > 0 ? Math.round((passed / allCases.length) * 1000) / 100 : 0;
  return { passed, total: allCases.length, scoreOutOfTen, executionNotes: "" };
}

async function requestAiCodeAnalysis(task, codeSnippet) {
  const ragBase = (process.env.RAG_API_URL || process.env.RAG_API_BASE || "http://localhost:5001").replace(/\/$/, "");
  try {
    const response = await fetch(`${ragBase}/api/analyze-code-assignment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemStatement: task?.problemStatement || "",
        inputFormat: task?.inputFormat || "",
        outputFormat: task?.outputFormat || "",
        expectedConcepts: task?.expectedConcepts || [],
        codeSnippet: codeSnippet || "",
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || `AI analysis failed (${response.status})`);
    }
    return payload.analysis || {};
  } catch {
    return {
      logic: "AI analysis unavailable; fallback used.",
      quality: "Code quality could not be fully evaluated automatically.",
      structure: "Structure assessment unavailable from analyzer.",
      score: 0,
    };
  }
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
      assignmentType = "mcq",
      codingTasks = [],
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
      assignmentType: ["mcq", "coding"].includes(assignmentType) ? assignmentType : "mcq",
      mcqs: Array.isArray(mcqs) ? mcqs : [],
      codingTasks: Array.isArray(codingTasks) ? codingTasks : [],
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
    if (b.assignmentType !== undefined) doc.assignmentType = ["mcq", "coding"].includes(b.assignmentType) ? b.assignmentType : "mcq";
    if (b.mcqs !== undefined) doc.mcqs = Array.isArray(b.mcqs) ? b.mcqs : [];
    if (b.codingTasks !== undefined) doc.codingTasks = Array.isArray(b.codingTasks) ? b.codingTasks : [];
    if (b.points !== undefined) doc.points = Number(b.points) || (doc.assignmentType === 'mcq' ? doc.mcqs?.length : doc.codingTasks?.length * 10) || 0;
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
        assignmentType: row.assignmentType || "mcq",
        mcqs: row.assignmentType === "mcq" ? sanitizeMcqsForStudent(row.mcqs) : [],
        codingTasks: row.assignmentType === "coding" ? sanitizeCodingTasksForStudent(row.codingTasks) : [],
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
        assignmentType: assignment.assignmentType || "mcq",
        mcqs: assignment.assignmentType === "mcq" ? sanitizeMcqsForStudent(assignment.mcqs) : [],
        codingTasks: assignment.assignmentType === "coding" ? sanitizeCodingTasksForStudent(assignment.codingTasks) : [],
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

    const isCoding = assignment.assignmentType === "coding";

    if (!isCoding && (!answers || typeof answers !== "object")) {
      return res.status(400).json({ success: false, message: "answers object is required" });
    }

    if (!isCoding && (!Array.isArray(assignment.mcqs) || assignment.mcqs.length === 0)) {
      return res.status(400).json({ success: false, message: "This assignment has no MCQs to submit" });
    }

    if (isCoding && (!Array.isArray(assignment.codingTasks) || assignment.codingTasks.length === 0)) {
      return res.status(400).json({ success: false, message: "This assignment has no coding tasks" });
    }

    // Allow multiple attempts for coding tasks by checking existing submission differently
    let existingSubmission = await ClassAssignmentSubmission.findOne({
      assignmentId: assignment._id,
      studentId: new mongoose.Types.ObjectId(studentId),
    });

    if (existingSubmission && !isCoding) {
      return res.status(409).json({ success: false, message: "Assignment already submitted" });
    }

    let score = 0;
    let totalQuestions = 0;
    let percentage = 0;
    let attempts = [];
    let codingSubmissions = [];

    if (!isCoding) {
      attempts = assignment.mcqs.map((question, index) => {
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

      score = attempts.filter((a) => a.isCorrect).length;
      totalQuestions = assignment.mcqs.length;
      percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 10000) / 100 : 0;
    } else {
      const submittedByTaskId = Object.fromEntries(
        normalizeCodingSubmissions(req.body.codingSubmissions || []).map((s) => [String(s.taskId), s])
      );
      codingSubmissions = [];
      totalQuestions = assignment.codingTasks.length;

      for (const task of assignment.codingTasks) {
        const taskId = String(task.id || "");
        const submitted = submittedByTaskId[taskId] || {
          taskId,
          codeSnippet: "",
          testCasesPassed: 0,
          totalTestCases: 0,
          aiCodeAnalysis: {},
          complexityAnalysis: {},
        };
        const execution = await evaluateCodingTaskSubmission(task, submitted);
        const aiAnalysis = await requestAiCodeAnalysis(task, submitted.codeSnippet);
        const complexity = analyzeComplexity(submitted.codeSnippet || "");

        const taskScore = Number(aiAnalysis?.score || execution.scoreOutOfTen || 0);
        score += taskScore;
        codingSubmissions.push({
          ...submitted,
          testCasesPassed: execution.passed,
          totalTestCases: execution.total,
          aiCodeAnalysis: {
            logic: String(aiAnalysis?.logic || ""),
            quality: String(aiAnalysis?.quality || ""),
            structure: String(aiAnalysis?.structure || ""),
            score: taskScore,
          },
          complexityAnalysis: {
            timeComplexity: String(
              aiAnalysis?.complexityAnalysis?.timeComplexity || complexity?.timeComplexity || ""
            ),
            spaceComplexity: String(
              aiAnalysis?.complexityAnalysis?.spaceComplexity || complexity?.spaceComplexity || ""
            ),
          },
        });
      }

      const maxPossibleScore = totalQuestions * 10;
      percentage = maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 10000) / 100 : 0;
    }

    let submission;
    if (existingSubmission && isCoding) {
      // Update existing coding submission attempt
      existingSubmission.codingSubmissions = codingSubmissions;
      existingSubmission.score = score;
      existingSubmission.percentage = percentage;
      existingSubmission.attemptCount = (existingSubmission.attemptCount || 1) + 1;
      existingSubmission.submittedAt = new Date();
      if (req.body.timeTaken) {
        existingSubmission.timeTaken = req.body.timeTaken;
      }
      await existingSubmission.save();
      submission = existingSubmission;
    } else {
      // Create new submission
      submission = await ClassAssignmentSubmission.create({
        classId: classDoc._id,
        assignmentId: assignment._id,
        instructorId: assignment.instructorId,
        studentId: new mongoose.Types.ObjectId(studentId),
        assignmentType: assignment.assignmentType,
        answers: attempts,
        codingSubmissions: codingSubmissions,
        score,
        totalQuestions,
        percentage,
        timeTaken: req.body.timeTaken || 0,
        submittedAt: new Date(),
      });
    }

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
      .select("title status deadline assignmentType mcqs codingTasks points")
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

    const codingAttempts = submissions.reduce((sum, s) => sum + (Number(s.attemptCount) || 1), 0);
    const codingTaskStats = submissions.flatMap((s) => s.codingSubmissions || []);
    const avgTestCasesPassed =
      codingTaskStats.length > 0
        ? Math.round(
            (codingTaskStats.reduce((sum, cs) => {
              const total = Number(cs.totalTestCases) || 0;
              const passed = Number(cs.testCasesPassed) || 0;
              return sum + (total > 0 ? (passed / total) * 100 : 0);
            }, 0) /
              codingTaskStats.length) *
              100
          ) / 100
        : 0;
    const commonMistakes = codingTaskStats
      .map((cs) => cs?.aiCodeAnalysis?.logic)
      .filter((x) => x && typeof x === "string")
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        assignment: {
          id: String(assignment._id),
          title: assignment.title,
          status: assignment.status,
          deadline: assignment.deadline,
          assignmentType: assignment.assignmentType || "mcq",
          totalQuestions: assignment.assignmentType === 'coding' ? (assignment.codingTasks?.length || 0) : (assignment.mcqs?.length || 0),
          points: assignment.points || (assignment.assignmentType === 'coding' ? (assignment.codingTasks?.length || 0) * 10 : (assignment.mcqs?.length || 0)),
        },
        summary: {
          totalStudents,
          submittedCount,
          pendingCount: Math.max(totalStudents - submittedCount, 0),
          avgPercentage,
          coding: {
            averageTestCasesPassedPercent: avgTestCasesPassed,
            averageAttempts: submittedCount > 0 ? Math.round((codingAttempts / submittedCount) * 100) / 100 : 0,
            commonMistakes,
          },
        },
        submissions: submissions.map((s) => ({
          id: String(s._id),
          studentId: String(s.studentId?._id || ""),
          studentName: s.studentId?.name || "Unknown Student",
          studentEmail: s.studentId?.email || "",
          assignmentType: s.assignmentType || "mcq",
          score: s.score,
          totalQuestions: s.totalQuestions,
          percentage: s.percentage,
          attemptCount: s.attemptCount || 1,
          timeTaken: s.timeTaken || 0,
          submittedAt: s.submittedAt,
          status: s.status || "pending",
          answers: (s.answers || []).map((a) => ({
            questionIndex: a.questionIndex,
            questionId: a.questionId,
            selectedOption: a.selectedOption,
            correctOption: a.correctOption,
            isCorrect: a.isCorrect,
          })),
          codingSubmissions: (s.codingSubmissions || []).map((cs) => ({
            taskId: cs.taskId,
            codeSnippet: cs.codeSnippet,
            testCasesPassed: cs.testCasesPassed,
            totalTestCases: cs.totalTestCases,
            aiCodeAnalysis: cs.aiCodeAnalysis,
            complexityAnalysis: cs.complexityAnalysis
          })),
        })),
      },
    });
  } catch (error) {
    console.error("getAssignmentSubmissionsForInstructor:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Instructor: accept assignment submission */
export const acceptSubmission = async (req, res) => {
  try {
    const { classId, assignmentId, submissionId } = req.params;
    const instructorId = req.userId;

    const cls = await assertInstructorOwnsClass(classId, instructorId);
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const submission = await ClassAssignmentSubmission.findOne({
      _id: new mongoose.Types.ObjectId(submissionId),
      classId: cls._id,
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    submission.status = "accepted";
    await submission.save();

    return res.status(200).json({ success: true, data: submission });
  } catch (error) {
    console.error("acceptSubmission:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
