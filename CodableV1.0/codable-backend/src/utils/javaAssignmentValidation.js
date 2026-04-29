import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";

export function normalizeOutput(output) {
  if (typeof output !== "string") {
    return "";
  }

  return output
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function detectJavaClassName(codeSnippet) {
  const classNameMatch = String(codeSnippet || "").match(/public\s+class\s+(\w+)/);
  return classNameMatch ? classNameMatch[1] : "Main";
}

export async function runJavaCodeAgainstInput(codeSnippet, input = "", timeoutMs = 8000) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codable-assignment-"));
  const className = detectJavaClassName(codeSnippet);
  const sourceFile = path.join(tempDir, `${className}.java`);

  try {
    await fs.writeFile(sourceFile, String(codeSnippet || ""), "utf8");

    const compileExit = await new Promise((resolve) => {
      const javac = spawn("javac", [sourceFile], { cwd: tempDir });
      let stderr = "";
      javac.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      javac.on("close", (code) => resolve({ code, stderr }));
      javac.on("error", (error) => resolve({ code: -1, stderr: String(error?.message || error) }));
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

      proc.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      proc.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      proc.on("close", (code) => {
        clearTimeout(timer);
        resolve({
          success: code === 0 && !killed,
          output: stdout || "",
          error: killed ? "Execution timed out" : (stderr || "").trim(),
        });
      });
      proc.on("error", (error) => {
        clearTimeout(timer);
        resolve({ success: false, output: "", error: String(error?.message || error) });
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

export async function validateTestCases(referenceSolution, testCases = [], options = {}) {
  const cases = Array.isArray(testCases) ? testCases : [];
  const timeoutMs = Number(options?.timeoutMs || 8000);

  if (!String(referenceSolution || "").trim()) {
    return {
      valid: false,
      passed: 0,
      total: cases.length,
      failures: [
        {
          index: -1,
          input: "",
          expected: "",
          actual: "",
          error: "Missing reference solution",
        },
      ],
    };
  }

  if (cases.length === 0) {
    return {
      valid: false,
      passed: 0,
      total: 0,
      failures: [
        {
          index: -1,
          input: "",
          expected: "",
          actual: "",
          error: "No test cases provided",
        },
      ],
    };
  }

  const failures = [];
  let passed = 0;

  for (const [index, testCase] of cases.entries()) {
    const input = String(testCase?.input ?? "");
    const expected = String(testCase?.output ?? "");
    const execution = await runJavaCodeAgainstInput(referenceSolution, input, timeoutMs);

    if (!execution.success) {
      failures.push({
        index,
        input,
        expected,
        actual: execution.output || "",
        error: execution.error || "Execution failed",
      });
      continue;
    }

    const normalizedExpected = normalizeOutput(expected);
    const normalizedActual = normalizeOutput(execution.output || "");

    if (normalizedExpected !== normalizedActual) {
      failures.push({
        index,
        input,
        expected,
        actual: execution.output || "",
        normalizedExpected,
        normalizedActual,
        error: "Output mismatch",
      });
      continue;
    }

    passed += 1;
  }

  return {
    valid: failures.length === 0,
    passed,
    total: cases.length,
    failures,
  };
}

export function normalizeTestCaseList(testCases = []) {
  if (!Array.isArray(testCases)) {
    return [];
  }

  return testCases.map((tc) => ({
    input: String(tc?.input ?? "").trim(),
    output: String(tc?.output ?? "").trim(),
  }));
}
