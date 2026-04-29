# Codable Assignment Validation Pipeline
## Instructor Guide

---

## Overview

The Codable assignment system now includes a **robust validation pipeline** that ensures all coding assignments have validated test cases and reference solutions. This guarantees:

- ✅ Test cases actually work against a correct solution
- ✅ Consistent output comparison for student evaluations
- ✅ Automatic test case generation for manual assignments
- ✅ Enforcement of minimum test case counts
- ✅ Three-attempt retry mechanism for failed generations

---

## Quick Start

### Creating an AI-Generated Assignment

1. Click **"Create Assignment"** → Select **"Coding Assignment"**
2. Choose **"AI Generated"** mode
3. Select chapters/topics from the curriculum
4. Set difficulty level (L/M/H)
5. Add optional instructions for the AI
6. Click **"Generate"** 
7. Assignments are automatically validated before saving ✓

### Creating a Manual Assignment

1. Click **"Create Assignment"** → Select **"Coding Assignment"**
2. Choose **"Manual Assignment"** mode
3. For each task:
   - Write the problem statement
   - Add input format (optional)
   - Add output format (optional)
   - **Click "Generate Test Cases"** to auto-generate via AI
4. Review generated test cases
5. Click **"Save Assignment"**
6. All test cases are validated before persistence ✓

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                          │
│                  Instructor creates                         │
│                 assignment & inputs                         │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         v                               v
   ┌──────────────┐             ┌──────────────┐
   │ AI-Generated │             │ Manual Entry │
   │  (Groq/      │             │  + Generate  │
   │ Mistral)     │             │  Test Cases  │
   └──────┬───────┘             └──────┬───────┘
          │                            │
          └────────────┬───────────────┘
                       │
                       v
        ┌──────────────────────────┐
        │  Python RAG Service      │
        │ (api.py endpoints)       │
        │                          │
        │ /api/generate-coding... │
        │ /api/generate-test-cases│
        └──────────┬───────────────┘
                   │
                   v
    ┌────────────────────────────────────┐
    │  Validate Test Cases Against       │
    │  Reference Solution                │
    │  (Python subprocess: javac/java)   │
    └──────────┬─────────────────────────┘
               │
    ┌──────────┴─────────────────┐
    │                            │
    YES (All passed)    NO (Retry 3x)
    │                            │
    v                            v
 Return valid         Retry with new
 task with            generation
 ref solution         (3 attempts max)
 + test cases
    │                            │
    └────────────┬───────────────┘
                 │
                 v
      ┌──────────────────────┐
      │  Node.js Backend     │
      │ (assignmentController)
      │                      │
      │ validate all tasks   │
      │ before DB save       │
      └──────────┬───────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    YES (Valid)    NO (Error to UI)
    │                         │
    v                         v
 Save to               Show error,
 MongoDB              retry or fix
 ✓ Validated          inputs
    │
    v
┌─────────────────────────────────────┐
│  Database: ClassAssignment          │
│  • codingTasks[]                    │
│  • Each task has:                   │
│    - referenceSolution              │
│    - sampleTestCases                │
│    - hiddenTestCases (hidden)       │
│    - constraints                    │
│    - expectedConcepts               │
└─────────────────────────────────────┘
```

---

## Key Components

### 1. **Reference Solutions**

Every generated coding task includes a **reference solution** - a correct Java implementation that passes all test cases.

**For Students**: Reference solutions are **never exposed**. They're used only for:
- Validating test cases during generation
- Evaluating student submissions

**For Instructors**: Reference solutions are stored for:
- Quality assurance (can review later)
- Rerunning validations if needed
- Understanding edge cases in test cases

### 2. **Test Case Categories**

Each task has two types of test cases:

| Type | Minimum | Visibility | Usage |
|------|---------|------------|-------|
| **Sample** | 2 cases | Shown to students | Learning/practice |
| **Hidden** | 5 cases | Not shown to students | Evaluation scoring |

**Edge Cases**: Generated test cases automatically include:
- Boundary values (0, negative numbers)
- Empty/minimal inputs
- Large values
- Special characters (where relevant)

### 3. **Validation Pipeline**

Every assignment goes through multiple validation checkpoints:

#### Checkpoint 1: RAG Service Validation (Python)
```
For each generated coding task:
✓ Reference solution exists (non-empty string)
✓ Compiles without errors
✓ Runs successfully against all test cases
✓ Minimum test case counts: 2 sample, 5 hidden
✓ All outputs match expected values
```

#### Checkpoint 2: Backend Validation (Node.js)
```
For each task being saved:
✓ Problem statement non-empty
✓ Reference solution non-empty
✓ At least 1 sample test case
✓ At least 3 hidden test cases (enforced in schema)
✓ All test case inputs/outputs are strings
```

#### Checkpoint 3: Retry Mechanism
```
If validation fails:
  Attempt 1 → Generate new test cases → Validate
  Attempt 2 → Generate new test cases → Validate
  Attempt 3 → Generate new test cases → Validate
  
  If still failing after 3 attempts:
    ✗ Block assignment save
    ✗ Show error message to instructor
    ✗ Suggest adjusting problem statement
```

---

## Manual Assignment Flow (New)

### Step 1: Enter Problem Statement

```
Problem: "Write a program that reads an integer N and prints the first N numbers in the Fibonacci sequence"
Input Format: "Single integer N (1-10)"
Output Format: "N space-separated numbers"
```

### Step 2: Generate Test Cases

**Button**: "Generate Test Cases" → AI generates:

```json
{
  "sampleTestCases": [
    { "input": "1", "output": "0" },
    { "input": "5", "output": "0 1 1 2 3" }
  ],
  "hiddenTestCases": [
    { "input": "2", "output": "0 1" },
    { "input": "3", "output": "0 1 1" },
    { "input": "4", "output": "0 1 1 2" },
    { "input": "6", "output": "0 1 1 2 3 5" },
    { "input": "10", "output": "0 1 1 2 3 5 8 13 21 34" }
  ],
  "referenceSolution": "public class Main { ... }",
  "constraints": ["N between 1 and 10", "Fibonacci sequence starts at 0"]
}
```

### Step 3: Validation Happens Automatically

- ✓ Reference solution compiles
- ✓ All test cases pass
- ✓ Minimum counts met
- ✓ Ready for students

### Step 4: Save Assignment

Test cases are stored **encrypted** in MongoDB with reference solution.

---

## Output Comparison (Normalization)

Student submissions are evaluated using **normalized output comparison**:

### What Gets Normalized?

```
✓ Extra whitespace (trimmed)
✓ Line ending differences (\n vs \r\n vs \r)
✓ Trailing spaces
✓ Case (lowercased for text)
✓ Unicode normalization
```

### Examples

```
Expected: "8"
Student:  "8\n"
Match: ✓ YES (normalized to "8")

Expected: "Hello World"
Student:  "  hello world  "
Match: ✓ YES (normalized to "hello world")

Expected: "3"
Student:  "Four"
Match: ✗ NO (different content)
```

---

## Error Handling

### Common Issues & Resolution

| Issue | Cause | Fix |
|-------|-------|-----|
| **"Test case generation failed"** | Reference solution doesn't compile | Retry generation or reword problem |
| **"Failed to generate test cases after 3 attempts"** | Problem statement too vague | Make problem more specific with examples |
| **"At least 5 hidden test cases required"** | Generation produced fewer cases | Adjust problem scope (too simple) |
| **"Reference solution missing"** | Technical error in AI provider | Check RAG service logs |

---

## Monitoring & Reporting

### Instructor Dashboard

After assignment is published, track:

- **Pass Rate**: % of students passing all test cases
- **Time Spent**: Average time per task
- **Common Failures**: Which test cases are failing most
- **Complexity**: What students are implementing

### Example Report

```
Fibonacci Assignment - Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task 1: Fibonacci Sequence
├─ Students: 28/30 (93%)
├─ Avg Time: 12 min
├─ Difficulty: Medium
├─ Most Failed: Sample case 2 (n=5)
└─ Common Issue: Off-by-one in loop

Test Case Performance:
├─ n=1: ✓ 30/30 (100%)
├─ n=5: ✓ 28/30 (93%)  ← Slightly harder
├─ n=10: ✓ 27/30 (90%)
└─ Hidden cases (avg): ✓ 88%
```

---

## Best Practices for Instructors

### 1. Be Specific in Problem Statements

❌ **Vague**: "Write a program that processes numbers"
✅ **Specific**: "Read 5 integers, print their sum and average"

### 2. Provide Input/Output Formats

❌ **Unclear**: Input: "numbers"
✅ **Clear**: Input: "5 space-separated integers on one line"

### 3. Review Generated Test Cases

After generation, review:
- Do they match your problem intent?
- Are edge cases covered?
- Is the reference solution correct?

### 4. Set Realistic Difficulty

- **L (Easy)**: Basic loops, conditionals
- **M (Medium)**: Arrays, methods, nested logic
- **H (Hard)**: Complex algorithms, edge cases

### 5. Group Related Tasks

Create multi-part assignments with related concepts to help students build understanding progressively.

---

## Technical Details

### Files Modified

| File | Changes |
|------|---------|
| `api.py` | Added test case generation & validation |
| `assignmentController.js` | Added validation before save |
| `ClassAssignment.js` | Schema now includes `referenceSolution` & `constraints` |
| `javaAssignmentValidation.js` | Core validation utility |
| `Assignments.jsx` | Manual generation UI |

### API Endpoints

#### Generate Test Cases (Manual)
```
POST /api/generate-test-cases
Content-Type: application/json

{
  "problemStatement": "...",
  "inputFormat": "...",
  "outputFormat": "...",
  "constraints": ["..."],
  "expectedConcepts": ["..."],
  "difficulty": "M"
}

Response:
{
  "success": true,
  "data": {
    "sampleTestCases": [...],
    "hiddenTestCases": [...],
    "referenceSolution": "public class Main { ... }",
    ...
  }
}
```

#### Generate Coding Assignment (AI)
```
POST /api/generate-coding-assignment
(existing endpoint - now with validation)
```

---

## FAQ

**Q: Can students see the reference solution?**
A: No. Reference solutions are never exposed to students. They're only used for validation and evaluation.

**Q: What if a student's output has extra spaces?**
A: The system normalizes whitespace, so extra spaces won't cause failures.

**Q: Can I manually create test cases instead of generating them?**
A: Yes, but generation is recommended. Manual entry still goes through the same validation.

**Q: What happens if test case generation fails?**
A: The system retries up to 3 times automatically. If all attempts fail, you'll see an error and can try modifying the problem statement.

**Q: Are hidden test cases really hidden from students?**
A: Yes, students only see sample test cases. Hidden test cases are used only when evaluating their final submission.

---

## Support

For issues with:
- **Test case generation**: Check RAG service logs (`rag-main/rag/`)
- **Assignment saving**: Check backend logs (`codable-backend/`)
- **Student evaluation**: Review test case formats (must be valid JSON)

---

**Version**: 1.0
**Last Updated**: 2025-04-29
**System**: Codable V1.0 with Validation Pipeline
