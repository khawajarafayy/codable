import { runJavaCodeAgainstInput, normalizeOutput } from "./javaAssignmentValidation.js";
import { analyzeComplexity } from "./complexityAnalyzer.js";

function clamp0to100(score) {
  const n = Number(score || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n * 100) / 100));
}

/**
 * Normalize test cases from RAG / frontend (supports `output` or `expectedOutput`).
 */
export function normalizeChapterTestCases(question = {}) {
  const combined = [
    ...(Array.isArray(question.testCases) ? question.testCases : []),
    ...(Array.isArray(question.hiddenTestCases) ? question.hiddenTestCases : []),
  ];

  const mapped = combined.map((tc) => ({
    input: String(tc?.input ?? "").trim(),
    output: String(tc?.expectedOutput ?? tc?.output ?? "").trim(),
  }));

  const seen = new Set();
  const unique = [];
  for (const tc of mapped) {
    const key = `${tc.input}\n---\n${tc.output}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(tc);
  }
  return unique;
}

export function inferChapterTaskType(question = {}) {
  if (question.taskType === "logic-based" || question.taskType === "input-output") {
    return question.taskType;
  }
  const cases = normalizeChapterTestCases(question);
  if (cases.length === 0) return "logic-based";
  const hasStdin = cases.some((c) => c.input.length > 0);
  const prompt = String(question.description || question.title || "").toLowerCase();
  const stdinSignal =
    hasStdin ||
    /\bstdin|scanner|read\s+input|readline|nextint|nextline|for each test\b/.test(prompt);
  if (stdinSignal) return "input-output";
  if (cases.every((c) => !c.input && c.output)) return "input-output";
  return "logic-based";
}

function evaluateCodeQualityHeuristic(codeSnippet, taskType) {
  const code = String(codeSnippet || "");
  const compact = code.replace(/\s+/g, " ").trim();
  if (!compact) {
    return {
      score: 0,
      logic: "No code submitted.",
      quality: "Submission is empty.",
      structure: "Expected Java class and method structure was not found.",
    };
  }

  const hasClass = /class\s+\w+/.test(code);
  const hasMethod = /(public|private|protected)?\s*(static\s+)?\w+\s+\w+\s*\([^)]*\)\s*\{/.test(code);
  const hasLoop = /\b(for|while|do)\b/.test(code);
  const hasCondition = /\bif\s*\(/.test(code);
  const hasOopConstruct = /\b(class|interface|extends|implements|new)\b/.test(code);
  const lines = code.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
  const type = taskType === "logic-based" ? "logic-based" : "input-output";

  let score = 0;
  if (hasClass) score += 2.5;
  if (hasMethod) score += 2.5;
  if (hasLoop || hasCondition) score += 2;
  if (lines >= 8) score += 1.5;
  if (type === "logic-based" && hasOopConstruct) score += 1.5;

  return {
    score: clamp0to100((score / 10) * 100),
    logic:
      hasLoop || hasCondition || hasOopConstruct
        ? "Contains meaningful logic constructs."
        : "Logic appears minimal; add clearer computational structure.",
    quality:
      lines >= 8
        ? "Code has reasonable structure and readability."
        : "Code is short; consider improving clarity and decomposition.",
    structure:
      hasClass && hasMethod
        ? "Core Java structure detected (class and method blocks)."
        : "Expected class/method structure is incomplete.",
  };
}

function evaluateTaskLogicHeuristic(task, codeSnippet) {
  const prompt = String(task?.description || task?.title || "").toLowerCase();
  const code = String(codeSnippet || "");
  const compact = code.replace(/\s+/g, " ").trim();
  if (!compact) {
    return {
      score: 0,
      logic: "No solution logic found because the submission is empty.",
      quality: "Provide a complete solution with clear implementation steps.",
      structure: "Expected Java class and method blocks are missing.",
    };
  }

  const hasLoop = /\b(for|while|do)\b/.test(code);
  const hasArithmetic = /[+\-*/%]/.test(code);
  const printsConstant = /System\.out\.println\s*\(\s*["']?\d+["']?\s*\)/.test(code);
  const hasScanner = /\bScanner\b/.test(code);
  const hasClass = /\bclass\s+\w+/.test(code);
  const hasMain = /\bpublic\s+static\s+void\s+main\s*\(/.test(code);

  let semanticScore = 6;
  let semanticNote = "Solution intent looks partially aligned with the prompt.";
  if (prompt.includes("sum") && prompt.includes("first") && prompt.includes("ten")) {
    const hasSumVariable = /\b(sum|total)\b/i.test(code);
    const hasTenBound = /\b<=?\s*10\b|\b10\b/.test(code);
    if (hasLoop && hasArithmetic && (hasSumVariable || hasTenBound)) {
      semanticScore = 9;
      semanticNote = "Code appears to compute the required sum using program logic.";
    } else if (printsConstant) {
      semanticScore = 3;
      semanticNote = "Code prints a hardcoded answer instead of computing the sum.";
    } else {
      semanticScore = 5;
      semanticNote = "Code does not clearly show the expected summation logic.";
    }
  }

  let structureScore = 0;
  if (hasClass) structureScore += 2;
  if (hasMain) structureScore += 2;
  if (hasLoop) structureScore += 2;
  if (hasArithmetic) structureScore += 2;
  if (!hasScanner) structureScore += 1;
  const raw = semanticScore * 0.7 + structureScore * 0.3;
  const maxRaw = 9 * 0.7 + 9 * 0.3;
  const score = clamp0to100(maxRaw > 0 ? (raw / maxRaw) * 100 : 0);

  return {
    score,
    logic: semanticNote,
    quality: printsConstant
      ? "Avoid hardcoded outputs; implement the logic so similar prompts can be solved correctly."
      : "Code quality is acceptable; improve naming and decomposition for better readability.",
    structure: hasClass && hasMain
      ? "Java class and main method structure are present."
      : "Java entry-point structure is incomplete.",
  };
}

function normalizeLabelToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractLabelPrefix(line) {
  const raw = String(line || "").trim();
  if (!raw) return "";
  const colonIdx = raw.indexOf(":");
  if (colonIdx <= 0) return "";
  return normalizeLabelToken(raw.slice(0, colonIdx));
}

function isPersonalProfilePrompt(question = {}, expected = "") {
  const prompt = String(question.description || question.title || "").toLowerCase();
  const combined = `${prompt}\n${String(expected || "").toLowerCase()}`;
  return /\b(name|favou?rite|language|goal|about yourself|yourself|your)\b/.test(combined);
}

function compareExpectedOutputFlexible(expectedOutput, actualOutput, question = {}) {
  const expected = normalizeOutput(expectedOutput || "");
  const actual = normalizeOutput(actualOutput || "");
  if (actual === expected) return true;

  // For "print your details" style tasks, validate required labels but allow custom values.
  if (!isPersonalProfilePrompt(question, expected)) return false;

  const expectedLines = String(expected || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const actualLines = String(actual || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const expectedLabels = expectedLines.map(extractLabelPrefix).filter(Boolean);
  if (!expectedLabels.length) return false;

  const actualLabelsWithValues = actualLines
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx <= 0) return null;
      return {
        label: normalizeLabelToken(line.slice(0, idx)),
        value: line.slice(idx + 1).trim(),
      };
    })
    .filter(Boolean);

  if (!actualLabelsWithValues.length) return false;

  return expectedLabels.every((label) =>
    actualLabelsWithValues.some((entry) => entry.label === label && entry.value.length > 0),
  );
}

function computePatternCoverage(question = {}, code = "") {
  const source = String(code || "").toLowerCase();
  const mustContain = Array.isArray(question.mustContain) ? question.mustContain : [];
  const mustNotContain = Array.isArray(question.mustNotContain) ? question.mustNotContain : [];
  const requiredMatched = mustContain.filter((pattern) =>
    source.includes(String(pattern || "").toLowerCase()),
  ).length;
  const forbiddenMatched = mustNotContain.filter((pattern) =>
    source.includes(String(pattern || "").toLowerCase()),
  ).length;
  return {
    requiredTotal: mustContain.length,
    requiredMatched,
    requiredRatio: mustContain.length > 0 ? requiredMatched / mustContain.length : 0,
    forbiddenMatched,
  };
}

/**
 * Run chapter practice evaluation: test cases only on submit (server-side).
 * @param {string} code - Student Java source
 * @param {object} question - Question payload from RAG
 * @returns {Promise<object>}
 */
export async function evaluateChapterPracticeSubmission(code, question = {}) {
  const taskType = inferChapterTaskType(question);
  const testCases = normalizeChapterTestCases(question);
  const complexity = analyzeComplexity(String(code || ""));
  const quality = evaluateCodeQualityHeuristic(code, taskType);
  const logicHeuristic = evaluateTaskLogicHeuristic(question, code);

  const feedback = [];
  const suggestions = [];

  // If no formal test cases exist but expected output is provided, execute once on submit
  // and apply flexible output matching for profile-like print tasks.
  if (testCases.length === 0 && String(question.expectedOutput || "").trim()) {
    const timeoutMs = 8000;
    const run = await runJavaCodeAgainstInput(code, "", timeoutMs);
    const expected = String(question.expectedOutput || "");
    const actual = String(run?.output || "");
    const outputMatched = run?.success && compareExpectedOutputFlexible(expected, actual, question);
    const combined = clamp0to100(
      (outputMatched ? 75 : 0) + (quality.score / 100) * 15 + (logicHeuristic.score / 100) * 10,
    );
    const isCorrect = Boolean(outputMatched);

    if (isCorrect) {
      feedback.push("Expected output requirements were satisfied.");
    } else {
      feedback.push("Output did not satisfy expected requirements.");
      suggestions.push("Match the required output labels and format shown in the prompt/examples.");
    }
    suggestions.push(quality.quality);

    return {
      isCorrect,
      score: combined,
      taskType: taskType === "logic-based" ? "input-output" : taskType,
      testCasesPassed: outputMatched ? 1 : 0,
      testCasesTotal: 1,
      testCaseResults: [
        {
          index: 0,
          input: "",
          expectedOutput: expected,
          actualOutput: actual.trim(),
          passed: outputMatched,
          error: run?.error || "",
        },
      ],
      quality,
      logic: logicHeuristic,
      complexity,
      feedback,
      suggestions,
    };
  }

  if (taskType === "logic-based" || testCases.length === 0) {
    const prompt = String(question?.description || question?.title || "").toLowerCase();
    const patternCoverage = computePatternCoverage(question, code);
    const likelyPrintTask =
      /\b(print|display|output|println|write a java program.*print)\b/.test(prompt) ||
      /\bname|favou?rite|language|goal\b/.test(prompt);
    const strongPatternPass =
      patternCoverage.requiredTotal > 0 &&
      patternCoverage.requiredRatio >= 0.99 &&
      patternCoverage.forbiddenMatched === 0;

    if (likelyPrintTask && strongPatternPass) {
      feedback.push("Submission satisfies required output-oriented patterns for this practice task.");
      suggestions.push("Great work. Consider adding brief comments or cleaner decomposition as tasks grow.");
      return {
        isCorrect: true,
        score: 100,
        taskType,
        testCasesPassed: 0,
        testCasesTotal: 0,
        testCaseResults: [],
        quality,
        logic: logicHeuristic,
        complexity,
        feedback,
        suggestions,
      };
    }

    const combined = clamp0to100(quality.score * 0.45 + logicHeuristic.score * 0.55);
    const isCorrect = combined >= 70 && quality.score >= 40;
    if (isCorrect) {
      feedback.push("Your solution meets the chapter practice criteria for structure and logic.");
    } else {
      feedback.push(logicHeuristic.logic);
      feedback.push(quality.structure);
      suggestions.push(quality.quality);
    }
    return {
      isCorrect,
      score: combined,
      taskType,
      testCasesPassed: 0,
      testCasesTotal: 0,
      testCaseResults: [],
      quality,
      logic: logicHeuristic,
      complexity,
      feedback,
      suggestions,
    };
  }

  let passed = 0;
  const testCaseResults = [];
  const timeoutMs = 8000;

  for (let idx = 0; idx < testCases.length; idx += 1) {
    const tc = testCases[idx];
    const run = await runJavaCodeAgainstInput(code, tc.input || "", timeoutMs);
    const expected = String(tc.output || "");
    const actual = String(run?.output || "");
    const ok = run?.success && compareExpectedOutputFlexible(expected, actual, question);

    if (ok) passed += 1;

    testCaseResults.push({
      index: idx,
      input: tc.input,
      expectedOutput: tc.output,
      actualOutput: actual.trim(),
      passed: ok,
      error: run?.error || (!ok && !run?.success ? "Execution failed" : ""),
    });
  }

  const passRatio = testCases.length > 0 ? passed / testCases.length : 0;
  const executionPart = passRatio * 70;
  const qualityPart = (quality.score / 100) * 20;
  const logicPart = (logicHeuristic.score / 100) * 10;
  const combined = clamp0to100(executionPart + qualityPart + logicPart);
  const isCorrect = passRatio === 1 && testCases.length > 0;

  if (!isCorrect) {
    feedback.push(`Passed ${passed} of ${testCases.length} official test cases.`);
    if (passed < testCases.length) {
      suggestions.push("Review failing cases: check edge inputs, formatting, and trailing newlines in output.");
    }
  } else {
    feedback.push("All test cases passed.");
  }
  suggestions.push(quality.quality);

  return {
    isCorrect,
    score: combined,
    taskType,
    testCasesPassed: passed,
    testCasesTotal: testCases.length,
    testCaseResults,
    quality,
    logic: logicHeuristic,
    complexity,
    feedback,
    suggestions,
  };
}
