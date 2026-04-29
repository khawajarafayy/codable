"""
Flask API for RAG-based Learning Content
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import re
import subprocess
import tempfile
import json

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from vector import get_relevant_context, load_existing_vector_store
from question_generator import QuestionGenerator
from config import GROQ_API_KEY, MISTRAL_API_KEY
from error_analyzer import ErrorAnalyzer
from decision_router import AdaptiveRouter
from remediation_generator import RemediationGenerator

app = Flask(__name__)
CORS(
    app,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
)

# Initialize question generator
question_gen = QuestionGenerator()

# Initialize adaptive learning components
error_analyzer = ErrorAnalyzer()
adaptive_router = AdaptiveRouter()
remediation_gen = RemediationGenerator()

# Initialize vector store at startup
print("🔄 Loading vector store...")
try:
    load_existing_vector_store()
    print("✅ Vector store loaded successfully")
except Exception as e:
    print(f"⚠️ Warning: Could not load vector store: {e}")

# Directory for pre-generated content
GENERATED_CONTENT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_content")


def get_pregenerated_content(topic_id):
    """Load pre-generated content for a topic (instant!)"""
    import json
    filepath = os.path.join(GENERATED_CONTENT_DIR, f"topic_{topic_id}.json")
    
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = json.load(f)
                print(f"   ⚡ Loaded pre-generated content instantly!")
                return content
        except Exception as e:
            print(f"   ⚠️ Error loading pre-generated content: {e}")
    
    return None


def normalize_output(text):
    if not isinstance(text, str):
        return ""
    return " ".join(
        line.strip()
        for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
        if line.strip()
    ).strip()


def strip_prompts_from_output(output):
    """Remove common prompt patterns that shouldn't be in test output"""
    if not isinstance(output, str):
        return ""
    
    # Remove common prompt patterns
    text = output
    # Common prompt prefixes to remove
    prompts = [
        r"Enter\s+.*?:\s*",
        r"Please\s+.*?:\s*",
        r"Input\s+.*?:\s*",
        r"Enter an? .*?:\s*",
        r"Type\s+.*?:\s*",
        r"\(e\.g\.,.*?\):\s*",
    ]
    
    for prompt in prompts:
        text = re.sub(prompt, "", text, flags=re.IGNORECASE)
    
    return text.strip()


def _normalize_test_cases(test_cases):
    normalized = []
    for test_case in test_cases or []:
        normalized.append({
            "input": str((test_case or {}).get("input", "")),
            "output": str((test_case or {}).get("output", "")),
        })
    return normalized


def _normalize_coding_task(task, fallback_id):
    task = task or {}
    question = str(task.get("question") or task.get("problemStatement") or "").strip()
    constraints = task.get("constraints") or []
    if isinstance(constraints, str):
        constraints = [constraints]
    return {
        "id": str(task.get("id") or fallback_id),
        "question": question,
        "problemStatement": question,
        "constraints": [str(item).strip() for item in constraints if str(item).strip()],
        "inputFormat": str(task.get("inputFormat") or "").strip(),
        "outputFormat": str(task.get("outputFormat") or "").strip(),
        "referenceSolution": str(task.get("referenceSolution") or "").strip(),
        "sampleTestCases": _normalize_test_cases(task.get("sampleTestCases") or []),
        "hiddenTestCases": _normalize_test_cases(task.get("hiddenTestCases") or []),
        "expectedConcepts": [str(item).strip() for item in (task.get("expectedConcepts") or []) if str(item).strip()],
    }


def _run_java_code_against_input(code_snippet, input_text="", timeout_seconds=8):
    temp_dir = tempfile.mkdtemp(prefix="codable-testcase-")
    class_match = re.search(r"public\s+class\s+(\w+)", str(code_snippet or ""))
    class_name = class_match.group(1) if class_match else "Main"
    source_file = os.path.join(temp_dir, f"{class_name}.java")

    try:
        with open(source_file, "w", encoding="utf-8") as handle:
            handle.write(str(code_snippet or ""))

        compile_result = subprocess.run(
            ["javac", source_file],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )
        if compile_result.returncode != 0:
            return {"success": False, "output": "", "error": compile_result.stderr or "Compilation failed"}

        run_result = subprocess.run(
            ["java", "-cp", temp_dir, class_name],
            cwd=temp_dir,
            input=str(input_text or ""),
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )
        return {
            "success": run_result.returncode == 0,
            "output": (run_result.stdout or "").strip(),
            "error": (run_result.stderr or "").strip(),
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "output": "", "error": "Execution timed out"}
    except Exception as error:
        return {"success": False, "output": "", "error": str(error)}
    finally:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)


def validate_test_cases(reference_solution, test_cases, timeout_seconds=8):
    normalized_reference = str(reference_solution or "").strip()
    normalized_cases = _normalize_test_cases(test_cases)

    if not normalized_reference:
        return {"valid": False, "passed": 0, "total": len(normalized_cases), "failures": [{"index": -1, "error": "Reference solution is required"}], "error": "Reference solution is required"}

    if not normalized_cases:
        return {"valid": False, "passed": 0, "total": 0, "failures": [{"index": -1, "error": "At least one test case is required"}], "error": "At least one test case is required"}

    failures = []
    passed = 0
    for index, test_case in enumerate(normalized_cases):
        run_result = _run_java_code_against_input(normalized_reference, test_case["input"], timeout_seconds=timeout_seconds)
        if not run_result["success"]:
            failures.append({"index": index, "input": test_case["input"], "expected": test_case["output"], "actual": run_result.get("output", ""), "error": run_result.get("error", "Execution failed")})
            continue

        expected = normalize_output(test_case["output"])
        actual = normalize_output(run_result.get("output", ""))
        
        # Also try comparing with prompts stripped (more lenient)
        expected_no_prompts = strip_prompts_from_output(expected)
        actual_no_prompts = strip_prompts_from_output(actual)
        
        # Pass if either strict or lenient comparison matches
        if expected != actual and expected_no_prompts != actual_no_prompts:
            failures.append({"index": index, "input": test_case["input"], "expected": test_case["output"], "actual": run_result.get("output", ""), "normalizedExpected": expected, "normalizedActual": actual, "error": "Output mismatch"})
            continue

        passed += 1

    return {"valid": len(failures) == 0, "passed": passed, "total": len(normalized_cases), "failures": failures, "error": "" if not failures else "One or more test cases failed validation"}


def validate_generated_coding_tasks(tasks, min_sample_cases=2, min_hidden_cases=5, timeout_seconds=8):
    normalized_tasks = []
    for index, task in enumerate(tasks or []):
        normalized_task = _normalize_coding_task(task, index + 1)
        print(f"🔍 Validating Task {index + 1}...")
        if not normalized_task["referenceSolution"]:
            print(f"❌ Task {index + 1}: Missing reference solution")
            return {"valid": False, "tasks": [], "error": f"Task {index + 1} is missing a reference solution"}
        if len(normalized_task["sampleTestCases"]) < min_sample_cases:
            print(f"❌ Task {index + 1}: Not enough sample test cases (found {len(normalized_task['sampleTestCases'])}, need {min_sample_cases})")
            return {"valid": False, "tasks": [], "error": f"Task {index + 1} must include at least {min_sample_cases} sample test cases"}
        if len(normalized_task["hiddenTestCases"]) < min_hidden_cases:
            print(f"❌ Task {index + 1}: Not enough hidden test cases (found {len(normalized_task['hiddenTestCases'])}, need {min_hidden_cases})")
            return {"valid": False, "tasks": [], "error": f"Task {index + 1} must include at least {min_hidden_cases} hidden test cases"}

        combined_cases = normalized_task["sampleTestCases"] + normalized_task["hiddenTestCases"]
        print(f"   Running validation on {len(combined_cases)} test cases (reference solution length: {len(normalized_task['referenceSolution'])} chars)...")
        validation = validate_test_cases(normalized_task["referenceSolution"], combined_cases, timeout_seconds=timeout_seconds)
        
        if not validation["valid"]:
            # Extract detailed failure info
            failures = validation.get("failures", [])
            print(f"   ❌ Validation failed! {len(failures)} test cases failed:")
            
            failure_details = []
            for failure in failures:
                if failure.get("error"):
                    print(f"      • Test {failure.get('index', '?')}: {failure.get('error')}")
                    print(f"        Input: {failure.get('input', '')[:100]}")
                    print(f"        Expected: {failure.get('expected', '')[:100]}")
                    print(f"        Got: {failure.get('actual', '')[:100]}")
                    failure_details.append(
                        f"Test case {failure.get('index', '?')}: {failure.get('error')} "
                        f"(input: {failure.get('input', '')[:50]}..., expected: {failure.get('expected', '')[:50]}..., got: {failure.get('actual', '')[:50]}...)"
                    )
            
            detailed_error = f"Task {index + 1} failed validation:\n" + "\n".join(failure_details[:3])  # Show first 3 failures
            return {
                "valid": False,
                "tasks": [],
                "error": detailed_error,
                "failureCount": len(failures),
                "details": validation,
            }
        
        print(f"   ✅ Task {index + 1} validation passed!")

        normalized_tasks.append(normalized_task)

    print(f"✅ All {len(normalized_tasks)} tasks validated successfully!")
    return {"valid": True, "tasks": normalized_tasks, "error": ""}


# Chapter subtopics structure - Detailed topic definitions
CHAPTER_TOPICS = {
    1: {
        "title": "Introduction to Computers, Programs, and Java",
        "topics": [
            {
                "id": "1-1",
                "title": "Introduction",
                "description": "Overview of the chapter and what you will learn",
                "keywords": ["introduction", "overview", "objectives", "learn"],
                "query": "Introduction to computers programs and Java chapter overview objectives",
                "concept_tags": ["chapter-overview", "learning-objectives"]
            },
            {
                "id": "1-2", 
                "title": "What is a Computer?",
                "description": "Understanding computer hardware and components",
                "keywords": ["computer", "hardware", "CPU", "memory", "storage", "devices", "components"],
                "query": "What is a computer hardware CPU memory storage input output devices components",
                "concept_tags": ["hardware-components", "cpu", "memory-ram", "storage", "io-devices"]
            },
            {
                "id": "1-3",
                "title": "Programming Languages",
                "description": "Machine language, assembly language, and high-level languages",
                "keywords": ["programming language", "machine language", "assembly", "high-level", "compiler", "interpreter"],
                "query": "Programming languages machine language assembly language high-level languages compiler interpreter",
                "concept_tags": ["machine-language", "assembly-language", "high-level-language", "compiler", "interpreter"]
            },
            {
                "id": "1-4",
                "title": "Operating Systems",
                "description": "Role of operating systems in managing computer resources",
                "keywords": ["operating system", "OS", "Windows", "Linux", "Mac", "manage", "resources"],
                "query": "Operating systems manage hardware software resources Windows Linux Mac",
                "concept_tags": ["operating-system", "resource-management", "os-types"]
            },
            {
                "id": "1-5",
                "title": "Java, the World Wide Web, and Beyond",
                "description": "History of Java and its role in modern computing",
                "keywords": ["Java", "history", "Sun Microsystems", "James Gosling", "web", "internet", "applet"],
                "query": "Java history World Wide Web Sun Microsystems James Gosling internet programming",
                "concept_tags": ["java-history", "platform-independence", "jvm-concept"]
            },
            {
                "id": "1-6",
                "title": "The Java Language Specification, API, JDK, and IDE",
                "description": "Java tools and development environment",
                "keywords": ["JDK", "API", "IDE", "specification", "Java SE", "development", "tools"],
                "query": "Java JDK API IDE specification development kit environment tools Eclipse NetBeans",
                "concept_tags": ["jdk", "java-api", "ide-tools", "java-specification"]
            },
            {
                "id": "1-7",
                "title": "A Simple Java Program",
                "description": "Writing and understanding your first Java program",
                "keywords": ["program", "Hello World", "main", "class", "public", "static", "void", "System.out"],
                "query": "Simple Java program Hello World main method class public static void println",
                "concept_tags": ["main-method", "class-structure", "println", "hello-world"]
            },
            {
                "id": "1-8",
                "title": "Creating, Compiling, and Executing a Java Program",
                "description": "Steps to write, compile, and run Java programs",
                "keywords": ["compile", "execute", "run", "javac", "java", "bytecode", "JVM"],
                "query": "Create compile execute Java program javac bytecode JVM virtual machine",
                "concept_tags": ["compile-javac", "bytecode", "jvm-execution", "program-lifecycle"]
            },
            {
                "id": "1-9",
                "title": "Programming Style and Documentation",
                "description": "Best practices for writing clean and documented code",
                "keywords": ["style", "documentation", "comments", "naming", "conventions", "readable"],
                "query": "Java programming style documentation comments naming conventions readable code",
                "concept_tags": ["code-comments", "naming-conventions", "code-style", "documentation"]
            },
            {
                "id": "1-10",
                "title": "Programming Errors",
                "description": "Types of errors: syntax, runtime, and logic errors",
                "keywords": ["error", "syntax", "runtime", "logic", "bug", "debug", "exception"],
                "query": "Programming errors syntax errors runtime errors logic errors debugging",
                "concept_tags": ["syntax-errors", "runtime-errors", "logic-errors", "debugging-basics"]
            }
        ]
    },
    2: {
        "title": "Elementary Programming",
        "topics": [
            {
                "id": "2-1",
                "title": "Introduction to Elementary Programming",
                "description": "Overview of elementary programming concepts",
                "keywords": ["introduction", "elementary", "programming", "basics"],
                "query": "Elementary programming introduction basics fundamentals Java",
                "concept_tags": ["elementary-intro", "programming-basics"]
            },
            {
                "id": "2-2",
                "title": "Writing a Simple Program",
                "description": "Creating basic Java programs step by step",
                "keywords": ["simple", "program", "basic", "write", "create"],
                "query": "Writing simple Java program step by step basic compute area",
                "concept_tags": ["simple-program", "basic-computation", "program-structure"]
            },
            {
                "id": "2-3",
                "title": "Reading Input from the Console",
                "description": "Using Scanner class to read user input",
                "keywords": ["input", "Scanner", "console", "read", "keyboard", "nextInt", "nextDouble"],
                "query": "Java Scanner class read input console keyboard nextInt nextDouble nextLine",
                "concept_tags": ["scanner-class", "console-input", "nextInt", "nextDouble", "nextLine"]
            },
            {
                "id": "2-4",
                "title": "Identifiers",
                "description": "Rules for naming variables, methods, and classes",
                "keywords": ["identifier", "name", "variable", "naming", "rules", "convention"],
                "query": "Java identifiers naming rules variables methods classes conventions",
                "concept_tags": ["identifier-rules", "valid-identifiers", "naming-rules"]
            },
            {
                "id": "2-5",
                "title": "Variables",
                "description": "Declaring and using variables to store data",
                "keywords": ["variable", "declare", "assign", "store", "data", "value"],
                "query": "Java variables declare assign store data values declaration",
                "concept_tags": ["variable-declaration", "variable-assignment", "data-storage"]
            },
            {
                "id": "2-6",
                "title": "Assignment Statements and Assignment Expressions",
                "description": "Assigning values to variables",
                "keywords": ["assignment", "statement", "expression", "equals", "="],
                "query": "Java assignment statements expressions assign values variables equals",
                "concept_tags": ["assignment-statement", "assignment-expression", "equals-operator"]
            },
            {
                "id": "2-7",
                "title": "Named Constants",
                "description": "Using final keyword for constants",
                "keywords": ["constant", "final", "named", "unchanging", "PI"],
                "query": "Java named constants final keyword unchanging values PI",
                "concept_tags": ["final-keyword", "named-constants", "immutable-values"]
            },
            {
                "id": "2-8",
                "title": "Naming Conventions",
                "description": "Standard conventions for naming in Java",
                "keywords": ["naming", "convention", "camelCase", "standard", "style"],
                "query": "Java naming conventions camelCase style standards variables classes methods",
                "concept_tags": ["camelCase", "naming-convention", "PascalCase", "code-standards"]
            },
            {
                "id": "2-9",
                "title": "Numeric Data Types and Operations",
                "description": "Working with int, double, and other numeric types",
                "keywords": ["numeric", "int", "double", "float", "long", "byte", "short", "arithmetic"],
                "query": "Java numeric data types int double float long byte short arithmetic operations",
                "concept_tags": ["int-type", "double-type", "arithmetic-operators", "numeric-types"]
            },
            {
                "id": "2-10",
                "title": "Numeric Literals",
                "description": "How to write numeric values in code",
                "keywords": ["literal", "number", "integer", "decimal", "scientific"],
                "query": "Java numeric literals integer decimal floating-point scientific notation",
                "concept_tags": ["integer-literals", "floating-point-literals", "scientific-notation"]
            },
            {
                "id": "2-11",
                "title": "Evaluating Expressions and Operator Precedence",
                "description": "Order of operations in expressions",
                "keywords": ["expression", "precedence", "order", "operations", "evaluate"],
                "query": "Java expression evaluation operator precedence order of operations arithmetic",
                "concept_tags": ["operator-precedence", "expression-evaluation", "order-of-operations"]
            },
            {
                "id": "2-12",
                "title": "Augmented Assignment Operators",
                "description": "Shorthand operators like +=, -=, *=",
                "keywords": ["augmented", "+=", "-=", "*=", "/=", "shorthand"],
                "query": "Java augmented assignment operators += -= *= /= shorthand compound",
                "concept_tags": ["augmented-assignment", "compound-operators", "shorthand-operators"]
            },
            {
                "id": "2-13",
                "title": "Increment and Decrement Operators",
                "description": "Using ++ and -- operators",
                "keywords": ["increment", "decrement", "++", "--", "prefix", "postfix"],
                "query": "Java increment decrement operators ++ -- prefix postfix",
                "concept_tags": ["increment-operator", "decrement-operator", "prefix-postfix"]
            },
            {
                "id": "2-14",
                "title": "Type Casting",
                "description": "Converting between data types",
                "keywords": ["casting", "convert", "type", "implicit", "explicit"],
                "query": "Java type casting convert data types implicit explicit widening narrowing",
                "concept_tags": ["type-casting", "widening", "narrowing", "implicit-explicit-cast"]
            },
            {
                "id": "2-15",
                "title": "Software Development Process",
                "description": "Steps in developing software programs",
                "keywords": ["development", "process", "requirements", "design", "implement", "test"],
                "query": "Software development process requirements analysis design implementation testing",
                "concept_tags": ["sdlc", "requirements-analysis", "design-implement-test"]
            },
            {
                "id": "2-16",
                "title": "Common Errors in Elementary Programming",
                "description": "Common mistakes in elementary programming",
                "keywords": ["errors", "mistakes", "common", "avoid", "pitfalls"],
                "query": "Common Java programming errors mistakes beginners avoid elementary",
                "concept_tags": ["common-mistakes", "beginner-errors", "debugging-elementary"]
            }
        ]
    },
    3: {
        "title": "Selections",
        "topics": [
            {
                "id": "3-1",
                "title": "Introduction to Selections",
                "description": "Overview of selection statements",
                "keywords": ["selection", "introduction", "decision", "control"],
                "query": "Java selections introduction decision making control flow statements",
                "concept_tags": ["selection-intro", "decision-making", "control-flow"]
            },
            {
                "id": "3-2",
                "title": "boolean Data Type",
                "description": "Understanding true/false values",
                "keywords": ["boolean", "true", "false", "logical"],
                "query": "Java boolean data type true false logical values comparison",
                "concept_tags": ["boolean-type", "true-false", "comparison-operators"]
            },
            {
                "id": "3-3",
                "title": "if Statements",
                "description": "Making decisions with if statements",
                "keywords": ["if", "condition", "statement", "decision"],
                "query": "Java if statement condition decision making one-way selection",
                "concept_tags": ["if-statement", "condition-check", "one-way-selection"]
            },
            {
                "id": "3-4",
                "title": "Two-Way if-else Statements",
                "description": "Choosing between two alternatives",
                "keywords": ["if", "else", "two-way", "alternative"],
                "query": "Java if else statement two-way selection alternative paths",
                "concept_tags": ["if-else", "two-way-selection", "alternative-paths"]
            },
            {
                "id": "3-5",
                "title": "Nested if and Multi-Way if-else Statements",
                "description": "Complex decision making with nested conditions",
                "keywords": ["nested", "if", "else if", "multi-way"],
                "query": "Java nested if else if multi-way selection statements complex conditions",
                "concept_tags": ["nested-if", "else-if-chain", "multi-way-selection", "condition-order"]
            },
            {
                "id": "3-6",
                "title": "Common Errors in Selection Statements",
                "description": "Avoiding mistakes with if statements",
                "keywords": ["errors", "mistakes", "common", "if", "selection"],
                "query": "Common errors mistakes Java if else selection statements dangling else",
                "concept_tags": ["selection-errors", "dangling-else", "common-if-mistakes"]
            },
            {
                "id": "3-7",
                "title": "Generating Random Numbers",
                "description": "Using Math.random() for random values",
                "keywords": ["random", "Math.random", "generate", "number"],
                "query": "Java generate random numbers Math.random Random class",
                "concept_tags": ["math-random", "random-numbers", "Random-class"]
            },
            {
                "id": "3-8",
                "title": "Logical Operators",
                "description": "Using AND, OR, and NOT operators",
                "keywords": ["logical", "AND", "OR", "NOT", "&&", "||", "!"],
                "query": "Java logical operators AND OR NOT && || ! boolean expressions",
                "concept_tags": ["logical-AND", "logical-OR", "logical-NOT", "boolean-expressions"]
            },
            {
                "id": "3-9",
                "title": "switch Statements",
                "description": "Multi-way branching with switch",
                "keywords": ["switch", "case", "break", "default", "branch"],
                "query": "Java switch statement case break default multi-way branching",
                "concept_tags": ["switch-statement", "case-break", "default-branch"]
            },
            {
                "id": "3-10",
                "title": "Conditional Expressions",
                "description": "Ternary operator for compact conditions",
                "keywords": ["conditional", "ternary", "?:", "expression"],
                "query": "Java conditional expression ternary operator ?: shorthand if else",
                "concept_tags": ["ternary-operator", "conditional-expression", "shorthand-if"]
            },
            {
                "id": "3-11",
                "title": "Operator Precedence and Associativity",
                "description": "Order of evaluation for operators",
                "keywords": ["precedence", "associativity", "order", "evaluate"],
                "query": "Java operator precedence associativity evaluation order rules",
                "concept_tags": ["precedence-rules", "associativity", "evaluation-order"]
            }
        ]
    },
    4: {
        "title": "Mathematical Functions, Characters, and Strings",
        "topics": [
            {
                "id": "4-1",
                "title": "Introduction",
                "description": "Overview of math, characters, and strings",
                "keywords": ["introduction", "math", "characters", "strings"],
                "query": "Java mathematical functions characters strings introduction overview",
                "concept_tags": ["math-functions-intro", "char-string-intro"]
            },
            {
                "id": "4-2",
                "title": "Common Mathematical Functions",
                "description": "Using Math class methods",
                "keywords": ["Math", "abs", "sqrt", "pow", "max", "min", "round"],
                "query": "Java Math class functions abs sqrt pow max min round ceil floor log exp",
                "concept_tags": ["Math-class", "abs-sqrt-pow", "max-min-round", "math-methods"]
            },
            {
                "id": "4-3",
                "title": "Character Data Type and Operations",
                "description": "Working with char type",
                "keywords": ["char", "character", "ASCII", "Unicode"],
                "query": "Java char character data type ASCII Unicode encoding operations",
                "concept_tags": ["char-type", "ascii", "unicode", "character-operations"]
            },
            {
                "id": "4-4",
                "title": "The String Type",
                "description": "Creating and using String objects",
                "keywords": ["String", "text", "create", "object", "immutable"],
                "query": "Java String type create text objects immutable methods length charAt",
                "concept_tags": ["String-class", "string-immutable", "string-methods", "length-charAt"]
            },
            {
                "id": "4-5",
                "title": "Formatting Console Output",
                "description": "Using printf for formatted output",
                "keywords": ["printf", "format", "output", "console", "%d", "%f", "%s"],
                "query": "Java printf format console output %d %f %s formatting specifiers",
                "concept_tags": ["printf", "format-specifiers", "formatted-output"]
            }
        ]
    },
    5: {
        "title": "Loops",
        "topics": [
            {
                "id": "5-1",
                "title": "Introduction to Loops",
                "description": "Overview of loop structures",
                "keywords": ["loops", "introduction", "iteration", "repeat"],
                "query": "Java loops introduction iteration repeat control structures",
                "concept_tags": ["loops-intro", "iteration-concept", "repetition"]
            },
            {
                "id": "5-2",
                "title": "The while Loop",
                "description": "Repeating code with while",
                "keywords": ["while", "loop", "condition", "repeat"],
                "query": "Java while loop condition repeat iteration loop-continuation-condition",
                "concept_tags": ["while-loop", "loop-condition", "loop-body", "infinite-loop"]
            },
            {
                "id": "5-3",
                "title": "The do-while Loop",
                "description": "Loop that executes at least once",
                "keywords": ["do", "while", "loop", "execute", "once"],
                "query": "Java do while loop execute at least once post-test loop",
                "concept_tags": ["do-while-loop", "post-test", "execute-once"]
            },
            {
                "id": "5-4",
                "title": "The for Loop",
                "description": "Counter-controlled loops",
                "keywords": ["for", "loop", "counter", "controlled", "iteration"],
                "query": "Java for loop counter controlled iteration initial-action loop-continuation increment",
                "concept_tags": ["for-loop", "counter-variable", "loop-control", "initialization-condition-update"]
            },
            {
                "id": "5-5",
                "title": "Which Loop to Use?",
                "description": "Choosing the right loop type",
                "keywords": ["loop", "choose", "when", "while", "for", "do-while"],
                "query": "Java which loop to use when while for do-while comparison guidelines",
                "concept_tags": ["loop-selection", "while-vs-for", "loop-comparison"]
            },
            {
                "id": "5-6",
                "title": "Nested Loops",
                "description": "Loops inside loops",
                "keywords": ["nested", "loop", "inside", "inner", "outer"],
                "query": "Java nested loops inner outer loop multiplication table pattern",
                "concept_tags": ["nested-loops", "inner-outer-loop", "loop-patterns"]
            },
            {
                "id": "5-7",
                "title": "Minimizing Numeric Errors",
                "description": "Avoiding floating-point issues in loops",
                "keywords": ["numeric", "errors", "floating-point", "precision"],
                "query": "Java minimizing numeric errors floating-point precision loops accumulated",
                "concept_tags": ["floating-point-errors", "numeric-precision", "accumulated-errors"]
            },
            {
                "id": "5-8",
                "title": "Keywords break and continue",
                "description": "Controlling loop execution",
                "keywords": ["break", "continue", "exit", "skip", "loop"],
                "query": "Java break continue keywords exit loop skip iteration terminate",
                "concept_tags": ["break-keyword", "continue-keyword", "loop-exit", "skip-iteration"]
            }
        ]
    },
    6: {
        "title": "Methods",
        "topics": [
            {
                "id": "6-1",
                "title": "Introduction to Methods",
                "description": "Overview of methods in Java",
                "keywords": ["methods", "introduction", "functions", "procedures"],
                "query": "Java methods introduction functions procedures modular programming",
                "concept_tags": ["methods-intro", "modular-programming", "code-reuse"]
            },
            {
                "id": "6-2",
                "title": "Defining a Method",
                "description": "How to create methods",
                "keywords": ["define", "method", "create", "signature", "body"],
                "query": "Java defining methods create method signature header body return type parameters",
                "concept_tags": ["method-definition", "method-signature", "return-type", "parameters"]
            },
            {
                "id": "6-3",
                "title": "Calling a Method",
                "description": "How to invoke methods",
                "keywords": ["call", "invoke", "method", "execute"],
                "query": "Java calling methods invoke execute method call arguments",
                "concept_tags": ["method-call", "method-invocation", "passing-arguments"]
            },
            {
                "id": "6-4",
                "title": "void vs. Value-Returning Methods",
                "description": "Methods with and without return values",
                "keywords": ["void", "return", "value", "method"],
                "query": "Java void return value methods returning values return statement",
                "concept_tags": ["void-method", "return-value", "return-statement"]
            },
            {
                "id": "6-5",
                "title": "Passing Arguments by Values",
                "description": "How arguments are passed to methods",
                "keywords": ["arguments", "parameters", "pass", "value", "copy"],
                "query": "Java passing arguments by value parameters method pass-by-value copy",
                "concept_tags": ["pass-by-value", "argument-passing", "value-copy"]
            },
            {
                "id": "6-6",
                "title": "Modularizing Code",
                "description": "Breaking code into reusable methods",
                "keywords": ["modular", "reusable", "organize", "methods"],
                "query": "Java modularizing code reusable methods organize stepwise refinement",
                "concept_tags": ["code-modularization", "stepwise-refinement", "reusable-methods"]
            },
            {
                "id": "6-7",
                "title": "Overloading Methods",
                "description": "Multiple methods with same name",
                "keywords": ["overload", "same name", "different parameters"],
                "query": "Java method overloading same name different parameters signature ambiguous",
                "concept_tags": ["method-overloading", "overloaded-methods", "parameter-signature"]
            },
            {
                "id": "6-8",
                "title": "The Scope of Variables",
                "description": "Where variables can be accessed",
                "keywords": ["scope", "local", "variable", "access", "block"],
                "query": "Java variable scope local variables access block method lifetime",
                "concept_tags": ["variable-scope", "local-variables", "block-scope", "lifetime"]
            }
        ]
    },
    7: {
        "title": "Single-Dimensional Arrays",
        "topics": [
            {
                "id": "7-1",
                "title": "Introduction to Arrays",
                "description": "Overview of arrays",
                "keywords": ["array", "introduction", "collection", "elements"],
                "query": "Java arrays introduction collection elements single-dimensional store",
                "concept_tags": ["arrays-intro", "collection-concept", "indexed-storage"]
            },
            {
                "id": "7-2",
                "title": "Array Basics",
                "description": "Creating and using arrays",
                "keywords": ["array", "create", "declare", "index", "element"],
                "query": "Java array basics create declare index element access new size length",
                "concept_tags": ["array-declaration", "array-indexing", "array-length", "new-keyword"]
            },
            {
                "id": "7-3",
                "title": "Copying Arrays",
                "description": "How to copy array contents",
                "keywords": ["copy", "array", "clone", "arraycopy"],
                "query": "Java copying arrays clone arraycopy System.arraycopy reference vs copy",
                "concept_tags": ["array-copy", "arraycopy-method", "reference-vs-value"]
            },
            {
                "id": "7-4",
                "title": "Passing Arrays to Methods",
                "description": "Using arrays as method parameters",
                "keywords": ["array", "method", "pass", "parameter", "reference"],
                "query": "Java passing arrays to methods parameter reference call by reference",
                "concept_tags": ["array-parameter", "pass-array-to-method", "reference-passing"]
            },
            {
                "id": "7-5",
                "title": "Returning an Array from a Method",
                "description": "Methods that return arrays",
                "keywords": ["return", "array", "method"],
                "query": "Java returning array from method return type array reverse",
                "concept_tags": ["return-array", "array-return-type", "method-returns-array"]
            },
            {
                "id": "7-6",
                "title": "Searching Arrays",
                "description": "Finding elements in arrays",
                "keywords": ["search", "find", "linear", "binary", "array"],
                "query": "Java searching arrays linear search binary search find element index",
                "concept_tags": ["linear-search", "binary-search", "array-search"]
            },
            {
                "id": "7-7",
                "title": "Sorting Arrays",
                "description": "Arranging array elements in order",
                "keywords": ["sort", "array", "order", "selection", "insertion"],
                "query": "Java sorting arrays selection sort insertion sort Arrays.sort ascending",
                "concept_tags": ["selection-sort", "insertion-sort", "Arrays-sort", "sorting-algorithms"]
            },
            {
                "id": "7-8",
                "title": "The Arrays Class",
                "description": "Utility methods for arrays",
                "keywords": ["Arrays", "class", "utility", "sort", "fill", "toString"],
                "query": "Java Arrays class utility methods sort fill toString binarySearch equals",
                "concept_tags": ["Arrays-class", "utility-methods", "fill-toString", "binarySearch"]
            }
        ]
    },
    8: {
        "title": "Multidimensional Arrays",
        "topics": [
            {
                "id": "8-1",
                "title": "Introduction to Multidimensional Arrays",
                "description": "Overview of multidimensional arrays",
                "keywords": ["multidimensional", "array", "2D", "matrix"],
                "query": "Java multidimensional arrays introduction 2D two-dimensional matrix table",
                "concept_tags": ["multidimensional-intro", "2D-arrays", "matrix-concept"]
            },
            {
                "id": "8-2",
                "title": "Two-Dimensional Array Basics",
                "description": "Creating and using 2D arrays",
                "keywords": ["2D", "array", "row", "column", "matrix"],
                "query": "Java two-dimensional 2D array basics row column matrix declare create",
                "concept_tags": ["2D-declaration", "row-column", "2D-indexing"]
            },
            {
                "id": "8-3",
                "title": "Processing Two-Dimensional Arrays",
                "description": "Working with 2D array elements",
                "keywords": ["process", "2D", "array", "nested", "loop"],
                "query": "Java processing two-dimensional arrays nested loops row column traverse",
                "concept_tags": ["2D-traversal", "nested-loop-2D", "row-column-processing"]
            },
            {
                "id": "8-4",
                "title": "Passing Two-Dimensional Arrays to Methods",
                "description": "Using 2D arrays as parameters",
                "keywords": ["pass", "2D", "array", "method", "parameter"],
                "query": "Java passing two-dimensional arrays to methods parameter 2D",
                "concept_tags": ["2D-array-parameter", "pass-2D-to-method"]
            },
            {
                "id": "8-5",
                "title": "Ragged Arrays",
                "description": "Arrays with varying row lengths",
                "keywords": ["ragged", "array", "varying", "length", "rows"],
                "query": "Java ragged arrays varying row lengths irregular jagged",
                "concept_tags": ["ragged-arrays", "jagged-arrays", "varying-row-lengths"]
            }
        ]
    },
    9: {
        "title": "Objects and Classes",
        "topics": [
            {
                "id": "9-1",
                "title": "Introduction to Objects and Classes",
                "description": "Overview of object-oriented programming",
                "keywords": ["objects", "classes", "OOP", "introduction"],
                "query": "Java objects classes OOP object-oriented programming introduction concepts",
                "concept_tags": ["oop-intro", "objects-concept", "classes-concept"]
            },
            {
                "id": "9-2",
                "title": "Defining Classes for Objects",
                "description": "How to create class definitions",
                "keywords": ["class", "define", "object", "blueprint"],
                "query": "Java defining classes for objects blueprint template data fields methods",
                "concept_tags": ["class-definition", "data-fields", "class-blueprint"]
            },
            {
                "id": "9-3",
                "title": "Constructors",
                "description": "Initializing objects with constructors",
                "keywords": ["constructor", "initialize", "new", "create", "object"],
                "query": "Java constructors initialize objects new keyword no-arg default",
                "concept_tags": ["constructors", "new-keyword", "no-arg-constructor", "default-constructor"]
            },
            {
                "id": "9-4",
                "title": "Accessing Objects via Reference Variables",
                "description": "How reference variables work",
                "keywords": ["reference", "variable", "object", "access", "dot"],
                "query": "Java reference variables access objects dot operator instance member",
                "concept_tags": ["reference-variables", "dot-operator", "instance-members"]
            },
            {
                "id": "9-5",
                "title": "Using Classes from the Java Library",
                "description": "Working with built-in Java classes",
                "keywords": ["library", "Java", "class", "Date", "Random", "import"],
                "query": "Java library classes Date Random Point import API built-in",
                "concept_tags": ["java-library", "Date-class", "import-statement", "built-in-classes"]
            },
            {
                "id": "9-6",
                "title": "Static Variables, Constants, and Methods",
                "description": "Class-level members with static",
                "keywords": ["static", "class", "variable", "method", "constant"],
                "query": "Java static variables constants methods class-level shared instance vs static",
                "concept_tags": ["static-keyword", "class-variables", "static-methods", "instance-vs-static"]
            },
            {
                "id": "9-7",
                "title": "Visibility Modifiers",
                "description": "public, private, and access control",
                "keywords": ["visibility", "public", "private", "protected", "access"],
                "query": "Java visibility modifiers public private protected access control encapsulation",
                "concept_tags": ["public-modifier", "private-modifier", "access-control"]
            },
            {
                "id": "9-8",
                "title": "Data Field Encapsulation",
                "description": "Hiding data with getters and setters",
                "keywords": ["encapsulation", "getter", "setter", "private", "data"],
                "query": "Java encapsulation getter setter methods private data fields accessor mutator",
                "concept_tags": ["encapsulation", "getters-setters", "data-hiding", "accessor-mutator"]
            },
            {
                "id": "9-9",
                "title": "Passing Objects to Methods",
                "description": "How objects are passed to methods",
                "keywords": ["pass", "object", "method", "reference"],
                "query": "Java passing objects to methods reference parameter object state",
                "concept_tags": ["pass-object-to-method", "object-reference", "object-state"]
            }
        ]
    },
    10: {
        "title": "Object-Oriented Thinking",
        "topics": [
            {
                "id": "10-1",
                "title": "Introduction to Object-Oriented Thinking",
                "description": "Thinking in objects",
                "keywords": ["object-oriented", "thinking", "design", "OOP"],
                "query": "Java object-oriented thinking design OOP introduction procedural vs OO",
                "concept_tags": ["oo-thinking", "procedural-vs-oop", "oo-design"]
            },
            {
                "id": "10-2",
                "title": "Class Abstraction and Encapsulation",
                "description": "Hiding implementation details",
                "keywords": ["abstraction", "encapsulation", "hide", "implementation"],
                "query": "Java class abstraction encapsulation hiding implementation class contract",
                "concept_tags": ["class-abstraction", "implementation-hiding", "class-contract"]
            },
            {
                "id": "10-3",
                "title": "Thinking in Objects",
                "description": "Designing with objects in mind",
                "keywords": ["thinking", "objects", "design", "modeling"],
                "query": "Java thinking in objects design modeling real-world class design",
                "concept_tags": ["object-modeling", "real-world-design", "class-design"]
            },
            {
                "id": "10-4",
                "title": "Class Relationships",
                "description": "Association, aggregation, and composition",
                "keywords": ["relationship", "association", "aggregation", "composition"],
                "query": "Java class relationships association aggregation composition has-a owns",
                "concept_tags": ["association", "aggregation", "composition", "has-a-relationship"]
            },
            {
                "id": "10-5",
                "title": "Wrapper Classes for Primitive Types",
                "description": "Wrapper classes for primitives",
                "keywords": ["wrapper", "Integer", "Double", "primitive", "object"],
                "query": "Java wrapper classes Integer Double Character primitive values objects boxing",
                "concept_tags": ["wrapper-classes", "autoboxing", "Integer-Double", "primitive-to-object"]
            },
            {
                "id": "10-6",
                "title": "The BigInteger and BigDecimal Classes",
                "description": "Working with large numbers",
                "keywords": ["BigInteger", "BigDecimal", "large", "numbers", "precision"],
                "query": "Java BigInteger BigDecimal large numbers arbitrary precision arithmetic",
                "concept_tags": ["BigInteger", "BigDecimal", "arbitrary-precision"]
            },
            {
                "id": "10-7",
                "title": "The String Class Methods",
                "description": "String methods and operations",
                "keywords": ["String", "methods", "substring", "length", "charAt"],
                "query": "Java String class methods substring length charAt indexOf compareTo replace",
                "concept_tags": ["String-methods", "substring", "indexOf", "compareTo"]
            },
            {
                "id": "10-8",
                "title": "The StringBuilder and StringBuffer Classes",
                "description": "Mutable string operations",
                "keywords": ["StringBuilder", "StringBuffer", "mutable", "append"],
                "query": "Java StringBuilder StringBuffer mutable strings append insert delete reverse",
                "concept_tags": ["StringBuilder", "StringBuffer", "mutable-strings", "append-insert"]
            }
        ]
    }
}


def clean_content(text):
    """Clean raw text from PDF extraction"""
    if not text:
        return ""
    
    # Remove page numbers
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*Page\s*\d+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\s+Chapter\s+\d+', '', text, flags=re.MULTILINE)
    text = re.sub(r'Chapter\s+\d+\s+\d+\s*$', '', text, flags=re.MULTILINE)
    
    # Remove section numbering at start of lines
    text = re.sub(r'^\s*\d+\.\d+(\.\d+)*\s*', '', text, flags=re.MULTILINE)
    
    # Remove excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    
    # Remove PDF artifacts
    text = re.sub(r'^\s*[-•]\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*M\d+_\w+\.qxd.*$', '', text, flags=re.MULTILINE)
    
    # Remove incomplete figure/table references
    text = re.sub(r'Figure\s*\d+\.\d+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*VideoNote\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*Note\s*$', '', text, flags=re.MULTILINE)
    
    return text.strip()


def format_topic_content(raw_content, topic_info):
    """Format raw RAG content into structured learning material using AI"""
    
    cleaned = clean_content(raw_content)
    
    # Check if we have meaningful content
    if not cleaned or len(cleaned) < 100:
        return generate_fallback_content(topic_info)
    
    # Try AI-powered formatting first
    try:
        sections = format_content_with_ai(cleaned, topic_info)
        if sections and len(sections) > 0:
            return sections
    except Exception as e:
        print(f"⚠️ AI formatting failed, using fallback: {e}")
    
    # Fallback to basic formatting if AI fails
    return format_content_basic(cleaned, topic_info)


def get_topic_constraints(topic_id, topic_title):
    """Get what concepts are allowed and NOT allowed for each topic"""
    
    # Define concept progression - what's allowed at each stage
    constraints = {
        # Chapter 1 - Introduction
        "1-1": {
            "allowed": ["overview", "objectives", "what you will learn"],
            "not_allowed": ["Scanner", "user input", "if-else", "loops", "arrays", "methods", "variables"],
            "focus": "Just introduce what computers and programming are about"
        },
        "1-2": {
            "allowed": ["hardware", "CPU", "memory", "storage", "input/output devices"],
            "not_allowed": ["Scanner", "user input", "if-else", "loops", "arrays", "methods", "Java code"],
            "focus": "Explain computer hardware components only"
        },
        "1-3": {
            "allowed": ["programming languages", "machine language", "assembly", "high-level", "compiler", "interpreter"],
            "not_allowed": ["Scanner", "user input", "if-else", "loops", "arrays", "methods"],
            "focus": "Explain types of programming languages"
        },
        "1-4": {
            "allowed": ["operating system", "Windows", "Linux", "Mac", "resource management"],
            "not_allowed": ["Scanner", "user input", "if-else", "loops", "arrays", "methods", "Java code"],
            "focus": "Explain operating systems"
        },
        "1-5": {
            "allowed": ["Java history", "Sun Microsystems", "James Gosling", "web", "platform independence"],
            "not_allowed": ["Scanner", "user input", "if-else", "loops", "arrays", "methods"],
            "focus": "Java history and evolution"
        },
        "1-6": {
            "allowed": ["JDK", "API", "IDE", "Eclipse", "NetBeans", "development tools"],
            "not_allowed": ["Scanner", "user input", "if-else", "loops", "arrays"],
            "focus": "Java development tools and environment"
        },
        "1-7": {
            "allowed": ["Hello World", "class", "main method", "public static void main", "System.out.println", "print statement"],
            "not_allowed": ["Scanner", "user input", "if-else", "loops", "arrays", "multiple methods", "variables beyond simple strings"],
            "focus": "ONLY basic Hello World program with print statements. NO user input!"
        },
        "1-8": {
            "allowed": ["compile", "javac", "java command", "bytecode", "JVM", "run program"],
            "not_allowed": ["Scanner", "user input", "if-else", "loops", "arrays"],
            "focus": "How to compile and run Java programs"
        },
        "1-9": {
            "allowed": ["comments", "naming conventions", "indentation", "documentation", "code style"],
            "not_allowed": ["Scanner", "user input", "if-else", "loops", "arrays"],
            "focus": "Programming style and documentation"
        },
        "1-10": {
            "allowed": ["syntax errors", "runtime errors", "logic errors", "debugging", "error messages"],
            "not_allowed": ["Scanner", "user input", "if-else", "loops", "arrays"],
            "focus": "Types of programming errors"
        },
        # Chapter 2 - Elementary Programming
        "2-1": {
            "allowed": ["elementary programming", "basics", "introduction"],
            "not_allowed": ["if-else", "loops", "arrays", "methods"],
            "focus": "Introduction to elementary programming"
        },
        "2-2": {
            "allowed": ["simple program", "compute area", "basic calculation", "System.out.println"],
            "not_allowed": ["Scanner", "user input", "if-else", "loops", "arrays", "methods"],
            "focus": "Writing simple programs with basic calculations"
        },
        "2-3": {
            "allowed": ["Scanner", "user input", "console input", "nextInt", "nextDouble", "nextLine", "keyboard input"],
            "not_allowed": ["if-else", "loops", "arrays", "methods"],
            "focus": "Reading user input with Scanner"
        },
        "2-4": {
            "allowed": ["identifiers", "naming rules", "valid names", "invalid names"],
            "not_allowed": ["if-else", "loops", "arrays", "methods"],
            "focus": "Rules for naming identifiers"
        },
        "2-5": {
            "allowed": ["variables", "declare", "assign", "int", "double", "data types"],
            "not_allowed": ["if-else", "loops", "arrays", "methods"],
            "focus": "Declaring and using variables"
        },
        "2-6": {
            "allowed": ["assignment statement", "assignment expression", "=", "assign values"],
            "not_allowed": ["if-else", "loops", "arrays", "methods"],
            "focus": "Assignment statements"
        },
        "2-7": {
            "allowed": ["final", "constant", "named constant", "PI", "unchanging value"],
            "not_allowed": ["if-else", "loops", "arrays", "methods"],
            "focus": "Named constants with final keyword"
        },
        "2-8": {
            "allowed": ["camelCase", "naming convention", "class names", "variable names", "method names"],
            "not_allowed": ["if-else", "loops", "arrays"],
            "focus": "Java naming conventions"
        },
        "2-9": {
            "allowed": ["int", "double", "float", "long", "byte", "short", "arithmetic", "+", "-", "*", "/", "%"],
            "not_allowed": ["if-else", "loops", "arrays"],
            "focus": "Numeric data types and arithmetic operations"
        },
        "2-10": {
            "allowed": ["literal", "integer literal", "decimal", "floating-point", "scientific notation"],
            "not_allowed": ["if-else", "loops", "arrays"],
            "focus": "How to write numeric literals"
        },
        "2-11": {
            "allowed": ["expression", "operator precedence", "order of operations", "parentheses"],
            "not_allowed": ["if-else", "loops", "arrays"],
            "focus": "Expression evaluation and precedence"
        },
        "2-12": {
            "allowed": ["+=", "-=", "*=", "/=", "%=", "augmented assignment", "shorthand"],
            "not_allowed": ["if-else", "loops", "arrays"],
            "focus": "Augmented assignment operators"
        },
        "2-13": {
            "allowed": ["++", "--", "increment", "decrement", "prefix", "postfix"],
            "not_allowed": ["if-else", "loops", "arrays"],
            "focus": "Increment and decrement operators"
        },
        "2-14": {
            "allowed": ["type casting", "widening", "narrowing", "(int)", "(double)", "convert"],
            "not_allowed": ["if-else", "loops", "arrays"],
            "focus": "Type casting and conversion"
        },
        # Chapter 3 - Selections
        "3-1": {
            "allowed": ["selection", "decision", "control flow", "introduction"],
            "not_allowed": ["loops", "arrays", "methods"],
            "focus": "Introduction to selection statements"
        },
        "3-2": {
            "allowed": ["boolean", "true", "false", "comparison", "==", "!=", "<", ">", "<=", ">="],
            "not_allowed": ["loops", "arrays", "methods"],
            "focus": "Boolean data type and comparisons"
        },
        "3-3": {
            "allowed": ["if", "if statement", "condition", "one-way selection"],
            "not_allowed": ["loops", "arrays", "methods", "else if"],
            "focus": "Simple if statements"
        },
        "3-4": {
            "allowed": ["if", "else", "if-else", "two-way selection", "alternative"],
            "not_allowed": ["loops", "arrays", "else if chain"],
            "focus": "if-else statements"
        },
        "3-5": {
            "allowed": ["nested if", "else if", "multi-way", "multiple conditions"],
            "not_allowed": ["loops", "arrays"],
            "focus": "Nested and multi-way if-else"
        },
        # Chapter 5 - Loops
        "5-1": {
            "allowed": ["loops", "iteration", "repeat", "introduction"],
            "not_allowed": ["arrays", "methods"],
            "focus": "Introduction to loops"
        },
        "5-2": {
            "allowed": ["while", "while loop", "condition", "iteration"],
            "not_allowed": ["arrays", "for loop", "do-while"],
            "focus": "while loop"
        },
        "5-3": {
            "allowed": ["do-while", "do while loop", "execute once"],
            "not_allowed": ["arrays", "for loop"],
            "focus": "do-while loop"
        },
        "5-4": {
            "allowed": ["for", "for loop", "counter", "initialization", "increment"],
            "not_allowed": ["arrays"],
            "focus": "for loop"
        },
    }
    
    # Default constraints for topics not explicitly defined
    default = {
        "allowed": ["concepts from this topic only"],
        "not_allowed": ["concepts from future chapters"],
        "focus": f"Stay focused on {topic_title}"
    }
    
    return constraints.get(topic_id, default)


def get_topic_metadata(topic_id):
    """Get difficulty, estimated time, and next topic for a given topic"""
    # Parse chapter and topic number
    parts = topic_id.split('-')
    chapter = int(parts[0]) if parts else 1
    topic_num = int(parts[1]) if len(parts) > 1 else 1
    
    # Difficulty based on chapter progression
    if chapter <= 2:
        difficulty = "Beginner"
    elif chapter <= 5:
        difficulty = "Intermediate"
    elif chapter <= 8:
        difficulty = "Advanced"
    else:
        difficulty = "Expert"
    
    # Estimated time (5-15 mins based on complexity)
    base_time = 5 + (chapter - 1) + (topic_num % 3)
    estimated_time = f"{min(base_time, 15)} min"
    
    # Calculate next topic
    next_topic_id = None
    if topic_id in CHAPTER_TOPICS.get(chapter, {}).get('topics', []):
        topics = CHAPTER_TOPICS[chapter]['topics']
        for i, t in enumerate(topics):
            if t['id'] == topic_id and i + 1 < len(topics):
                next_topic_id = topics[i + 1]['id']
                break
        if not next_topic_id and chapter + 1 in CHAPTER_TOPICS:
            next_topics = CHAPTER_TOPICS[chapter + 1].get('topics', [])
            if next_topics:
                next_topic_id = next_topics[0]['id']
    
    return {
        "difficulty": difficulty,
        "estimatedTime": estimated_time,
        "nextTopicId": next_topic_id
    }


def format_content_with_ai(raw_content, topic_info):
    """Use Mistral AI to organize and structure the raw book content into attractive learning material"""
    from mistralai import Mistral
    import json
    
    # Initialize Mistral client
    client = Mistral(api_key=MISTRAL_API_KEY)
    
    # Get topic constraints
    topic_id = topic_info.get('id', '')
    topic_title = topic_info.get('title', 'Unknown Topic')
    constraints = get_topic_constraints(topic_id, topic_title)
    
    allowed_concepts = ', '.join(constraints['allowed'])
    not_allowed_concepts = ', '.join(constraints['not_allowed'])
    topic_focus = constraints['focus']
    
    # Get metadata
    metadata = get_topic_metadata(topic_id)
    
    prompt = f"""You are a friendly programming tutor creating bite-sized learning content.

📚 TOPIC: {topic_title}
📝 DESCRIPTION: {topic_info.get('description', '')}
🎯 TOPIC ID: {topic_id}

⚠️ TOPIC RESTRICTIONS:
✅ ALLOWED: {allowed_concepts}
❌ NOT ALLOWED (taught later): {not_allowed_concepts}
🎯 FOCUS: {topic_focus}

RAW TEXTBOOK CONTENT:
---
{raw_content[:6000]}
---

✍️ WRITING STYLE RULES (VERY IMPORTANT):
• Maximum 2-3 lines per paragraph
• Use bullet points frequently
• Include simple examples and analogies
• Friendly, conversational tone
• NO long academic explanations
• Talk like a helpful friend teaching

📋 OUTPUT FORMAT - Return ONLY this JSON array:
[
  {{
    "title": "🎯 What You'll Learn",
    "content": "Short intro (2-3 lines max).\n\n• Bullet point 1\n• Bullet point 2\n• Bullet point 3",
    "type": "introduction"
  }},
  {{
    "title": "💡 Concept Explanation",
    "content": "Explain using a real-world analogy first.\n\nThen 2-3 short paragraphs with bullet points. Keep it simple!",
    "type": "explanation"
  }},
  {{
    "title": "📊 Visual Simulation",
    "content": "Step-by-step visualization of how {topic_title} works:",
    "type": "visual",
    "steps": [
      {{"step": 1, "title": "Step Title", "description": "What happens", "code": "relevant code snippet"}},
      {{"step": 2, "title": "Step Title", "description": "What happens next", "code": "next code snippet"}},
      {{"step": 3, "title": "Step Title", "description": "Final result", "code": "final code"}}
    ]
  }},
  {{
    "title": "⚡ Key Points",
    "content": "",
    "type": "keypoints",
    "points": [
      "✓ Key point 1 - keep it short",
      "✓ Key point 2 - one line each",
      "✓ Key point 3 - easy to scan",
      "✓ Key point 4 - memorable tips",
      "✓ Key point 5 - practical advice"
    ]
  }},
  {{
    "title": "🔥 Tips & Mistakes",
    "content": "",
    "type": "tips",
    "sidebar": true,
    "dos": [
      "Short tip 1",
      "Short tip 2",
      "Short tip 3"
    ],
    "donts": [
      "Common mistake 1",
      "Common mistake 2",
      "Common mistake 3"
    ],
    "protip": "One golden tip for {topic_title}"
  }},
  {{
    "title": "🌍 Real World Use",
    "content": "Where is {topic_title} used in real apps?",
    "type": "realworld",
    "examples": [
      {{"app": "Example App/Use", "how": "How it uses this concept"}},
      {{"app": "Another Example", "how": "How it applies here"}}
    ]
  }},
  {{
    "title": "🧪 Practice Problem",
    "content": "Try this challenge:",
    "type": "practice",
    "problem": {{
      "description": "Clear problem statement (2-3 lines)",
      "starterCode": "// Starter code here",
      "hints": ["Hint 1", "Hint 2"],
      "solution": "// Complete solution code",
      "explanation": "Brief explanation of solution (2-3 lines)"
    }}
  }},
  {{
    "title": "📝 Summary",
    "content": "",
    "type": "summary",
    "points": [
      "📌 Main takeaway in one line",
      "📌 Most important rule",
      "📌 What to practice",
      "📌 Ready for next topic!"
    ]
  }}
]

🚨 RULES:
1. ONLY use allowed concepts for topic {topic_id}
2. Keep paragraphs SHORT (2-3 lines max)
3. Use bullet points everywhere
4. Include analogies and examples
5. Friendly tone - like a tutor talking
6. Output ONLY valid JSON

Generate content now:"""

    try:
        print(f"   🤖 Sending to Mistral AI for content organization...")
        
        # Call Mistral API
        chat_response = client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=8192
        )
        
        response_text = chat_response.choices[0].message.content.strip()
        
        # Remove markdown code block wrapper if present
        response_text = re.sub(r'^```json\s*\n?', '', response_text)
        response_text = re.sub(r'^```\s*\n?', '', response_text)
        response_text = re.sub(r'\n?\s*```$', '', response_text)
        
        # Extract JSON from response
        json_match = re.search(r'\[[\s\S]*\]', response_text)
        if json_match:
            json_str = json_match.group()
            
            # Fix control characters in JSON - robust approach
            def fix_json_control_chars(s):
                """Escape control characters inside JSON string values"""
                result = []
                in_string = False
                i = 0
                while i < len(s):
                    char = s[i]
                    
                    # Track if we're inside a JSON string
                    if char == '"':
                        # Check if this quote is escaped
                        num_backslashes = 0
                        j = i - 1
                        while j >= 0 and s[j] == '\\':
                            num_backslashes += 1
                            j -= 1
                        # Quote is escaped if preceded by odd number of backslashes
                        if num_backslashes % 2 == 0:
                            in_string = not in_string
                        result.append(char)
                    elif in_string and ord(char) < 32:
                        # Control character inside string - escape it
                        if char == '\n':
                            result.append('\\n')
                        elif char == '\r':
                            result.append('\\r')
                        elif char == '\t':
                            result.append('\\t')
                        else:
                            # Other control chars - use unicode escape
                            result.append(f'\\u{ord(char):04x}')
                    else:
                        result.append(char)
                    i += 1
                return ''.join(result)
            
            # Apply the fix
            fixed_json = fix_json_control_chars(json_str)
            
            try:
                sections = json.loads(fixed_json)
            except json.JSONDecodeError as e:
                print(f"   ⚠️ JSON parse failed after fix: {e}")
                print(f"   Response preview: {fixed_json[:800]}...")
                return None
            
            # Validate sections
            if isinstance(sections, list) and len(sections) >= 3:
                validated_sections = []
                for section in sections:
                    if isinstance(section, dict) and 'title' in section and 'type' in section:
                        # Ensure content exists and clean it
                        if 'content' not in section:
                            section['content'] = ''
                        else:
                            # Clean any remaining artifacts from content
                            section['content'] = clean_ai_content(section['content'])
                        
                        # Clean examples if present
                        if 'examples' in section and isinstance(section['examples'], list):
                            section['examples'] = [ex for ex in section['examples'] if ex and len(ex.strip()) > 10]
                        
                        # Clean points if present
                        if 'points' in section and isinstance(section['points'], list):
                            section['points'] = [p for p in section['points'] if p and len(p.strip()) > 5]
                        
                        validated_sections.append(section)
                
                if len(validated_sections) >= 3:
                    print(f"   ✅ Mistral AI generated {len(validated_sections)} engaging sections")
                    return validated_sections
        
        print(f"   ⚠️ AI response parsing failed - no valid JSON found")
        print(f"   Response preview: {response_text[:500]}...")
        return None
        
    except Exception as e:
        print(f"   ⚠️ Mistral AI formatting error: {e}")
        import traceback
        traceback.print_exc()
        return None


def clean_ai_content(text):
    """Clean any remaining artifacts from AI-generated content"""
    if not text:
        return ""
    
    # Remove common PDF artifacts that might slip through
    artifacts = [
        r'LISTING\s+\d+\.\d+',
        r'VideoNote',
        r'Figure\s+\d+\.\d+',
        r'line\s+numbers?\s+are\s+for\s+reference',
        r'Note\s+that\s+the\s+line\s+numbers',
        r'don\'t\s+type\s+line\s+numbers',
        r'^\s*\d+\s+Chapter\s+\d+',
        r'M\d+_\w+\.qxd',
    ]
    
    for pattern in artifacts:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    # Clean up extra whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    
    return text.strip()


def format_content_basic(cleaned, topic_info):
    """Enhanced fallback formatting without AI - produces clean, organized content"""
    
    # Deep clean the content first
    cleaned = deep_clean_content(cleaned)
    
    # Extract code examples before splitting
    code_examples = extract_code_examples_enhanced(cleaned)
    
    # Remove code blocks from text for cleaner paragraphs
    text_only = re.sub(r'public\s+(?:class|static|void|interface)[^}]+\}', '', cleaned, flags=re.DOTALL)
    text_only = re.sub(r'System\.out\.print(?:ln)?\s*\([^)]+\)\s*;', '', text_only)
    
    # Extract meaningful sentences
    sentences = extract_clean_sentences(text_only, topic_info)
    
    if not sentences:
        return generate_fallback_content(topic_info)
    
    topic_title = topic_info.get('title', 'the Topic')
    topic_id = topic_info.get('id', '1-1')
    metadata = get_topic_metadata(topic_id)
    sections = []
    
    # 🎯 What You'll Learn - Introduction
    intro_sentences = sentences[:3]
    intro_bullets = '\n'.join([f"• {s}" for s in intro_sentences]) if intro_sentences else f"• Learn about {topic_title}"
    sections.append({
        "title": "🎯 What You'll Learn",
        "content": f"Hey! 👋 Let's explore **{topic_title}**.\n\n{intro_bullets}",
        "type": "introduction"
    })
    
    # 💡 Concept Explanation
    if len(sentences) > 3:
        concept_sentences = sentences[3:8]
        # Format as short paragraphs with bullets
        concept_content = f"Think of **{topic_title}** as a building block for your programs.\n\n"
        concept_content += '\n'.join([f"• {s}" for s in concept_sentences[:3]])
        if len(concept_sentences) > 3:
            concept_content += f"\n\n{' '.join(concept_sentences[3:5])}"
        sections.append({
            "title": "💡 Concept Explanation",
            "content": concept_content,
            "type": "explanation"
        })
    
    # 📊 Visual Simulation
    sections.append({
        "title": "📊 Visual Simulation",
        "content": f"Here's how {topic_title} works step by step:",
        "type": "visual",
        "steps": [
            {"step": 1, "title": "Setup", "description": "Start with basic structure", "code": code_examples[0] if code_examples else "// Start here"},
            {"step": 2, "title": "Execute", "description": "Code runs line by line", "code": "// Processing..."},
            {"step": 3, "title": "Result", "description": "See the output", "code": "// Output appears!"}
        ]
    })
    
    # ⚡ Key Points
    key_points = generate_key_points(sentences, topic_info)
    sections.append({
        "title": "⚡ Key Points",
        "content": "",
        "type": "keypoints",
        "points": [f"✓ {p}" for p in key_points] if key_points else [
            f"✓ {topic_title} is essential for Java",
            "✓ Practice with examples",
            "✓ Build on these basics",
            "✓ Used in real applications"
        ]
    })
    
    # 🔥 Tips & Mistakes (sidebar)
    sections.append({
        "title": "🔥 Tips & Mistakes",
        "content": "",
        "type": "tips",
        "sidebar": True,
        "dos": [
            "Read code carefully",
            "Test small changes",
            "Understand before moving on"
        ],
        "donts": [
            "Skip fundamentals",
            "Copy without understanding",
            "Rush through errors"
        ],
        "protip": "Small steps lead to big progress! 🚀"
    })
    
    # 🌍 Real World Use
    sections.append({
        "title": "🌍 Real World Use",
        "content": f"Where is {topic_title} used?",
        "type": "realworld",
        "examples": [
            {"app": "Apps & Software", "how": "Building features users interact with"},
            {"app": "Backend Systems", "how": "Processing and managing data"}
        ]
    })
    
    # 🧪 Practice Problem
    sections.append({
        "title": "🧪 Practice Problem",
        "content": "Try this challenge:",
        "type": "practice",
        "problem": {
            "description": f"Use {topic_title} to create your own example. Modify the code below!",
            "starterCode": code_examples[0] if code_examples else f"// Practice {topic_title}\npublic class Practice {{\n    public static void main(String[] args) {{\n        // Your code here\n    }}\n}}",
            "hints": ["Start simple", "Test after each change"],
            "solution": code_examples[0] if code_examples else "// Your solution will vary!",
            "explanation": "The goal is understanding, not perfection. Keep experimenting!"
        }
    })
    
    # 📝 Summary
    sections.append({
        "title": "📝 Summary",
        "content": "",
        "type": "summary",
        "points": [
            f"📌 Learned: {topic_title}",
            f"📌 Key skill: {topic_info.get('description', 'Core concept')}",
            "📌 Next: Practice and move forward!",
            "📌 You're making progress! 🎉"
        ]
    })
    
    return sections


def deep_clean_content(text):
    """Aggressively clean PDF artifacts and messy formatting"""
    if not text:
        return ""
    
    # Remove all the PDF/book artifacts
    patterns_to_remove = [
        r'LISTING\s+\d+\.\d+\s*\w*\.java',  # LISTING 1.1 Welcome.java
        r'LISTING\s+\d+\.\d+',
        r'VideoNote[^\n]*',
        r'Figure\s+\d+\.\d+[^\n]*',
        r'Note\s+that\s+the\s+line\s+numbers[^.]*\.',
        r'don\'t\s+type\s+line\s+numbers[^.]*\.',
        r'line\s+numbers?\s+are\s+for\s+reference[^.]*\.',
        r'^\s*\d+\s+Chapter\s+\d+[^\n]*',
        r'Chapter\s+\d+\s+\d+\s*$',
        r'M\d+_\w+\.qxd[^\n]*',
        r'^\s*\d+\s*$',  # Standalone numbers (page numbers)
        r'^\s*Page\s*\d+\s*$',
        r'^\d+\s+\d+\s+',  # Line numbers at start
        r'display\s+message\s*\n',
        r'main\s+method\s*\n',
        r'class\s+\d+\s+',
        r'Your\s+ﬁrst\s+Java\s+program',
        r'line\s+numbers\s*\n',
        r'console\s+input[^\n]*console\s+output',
        r'\(§\d+\.\d+\)',  # Section references like (§1.5)
        r'■\s*',  # Bullet points from PDF
        r'e\.g\.,\s*javac\s+\w+\.java',
        r'e\.g\.,\s*java\s+\w+',
        r'Stored\s+on\s+the\s+disk',
        r'Saved\s+on\s+the\s+disk',
        r'Source\s+code\s+\(developed\s+by\s+the\s+programmer\)',
        r'Bytecode\s+\(generated[^)]+\)',
        r'Method\s+\w+\([^)]*\)\s*\d+\s+\w+',  # Method signatures with numbers
        r'0\s+aload_0',  # Bytecode
        r'getstatic\s+#\d+',
        r'ldc\s+#\d+',
        r'invokevirtual\s+#\d+',
        r'\d+\s+return',
        r'Run\s+Bytecode',
        r'Compile\s+Source\s+Code',
        r'Create/Modify\s+Source\s+Code',
        r'If\s+compile\s+errors\s+occur',
        r'is\s+displayed\s+on\s+the\s+console',
    ]
    
    for pattern in patterns_to_remove:
        text = re.sub(pattern, '', text, flags=re.MULTILINE | re.IGNORECASE)
    
    # Clean up excessive whitespace and newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r'^\s+', '', text, flags=re.MULTILINE)
    
    # Remove lines that are too short (likely artifacts)
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if len(line) > 15 or (len(line) > 0 and line.endswith(('.', ':', ')'))):
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)


def extract_clean_sentences(text, topic_info):
    """Extract clean, meaningful sentences from text"""
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    clean_sentences = []
    for sentence in sentences:
        sentence = sentence.strip()
        
        # Skip if too short or too long
        if len(sentence) < 30 or len(sentence) > 400:
            continue
        
        # Skip if contains artifacts
        skip_patterns = [
            r'^\d+\s+\d+',
            r'aload|getstatic|ldc|invokevirtual',
            r'M\d+_',
            r'\.qxd',
            r'press\s+ctrl',
        ]
        skip = False
        for pattern in skip_patterns:
            if re.search(pattern, sentence, re.IGNORECASE):
                skip = True
                break
        
        if skip:
            continue
        
        # Clean the sentence
        sentence = re.sub(r'\s+', ' ', sentence)
        sentence = sentence.strip()
        
        if sentence and sentence not in clean_sentences:
            clean_sentences.append(sentence)
    
    return clean_sentences


def create_clean_paragraph(sentences):
    """Create a clean paragraph from sentences"""
    if not sentences:
        return ""
    
    # Join sentences with proper spacing
    paragraph = ' '.join(sentences)
    
    # Ensure proper capitalization and punctuation
    paragraph = paragraph.strip()
    if paragraph and not paragraph.endswith('.'):
        paragraph += '.'
    
    return paragraph


def extract_code_examples_enhanced(text):
    """Extract and clean Java code examples"""
    code_examples = []
    
    # Pattern for complete class definitions
    class_pattern = r'(public\s+class\s+\w+\s*\{[^}]+(?:\{[^}]*\}[^}]*)*\})'
    matches = re.findall(class_pattern, text, re.DOTALL)
    
    for match in matches:
        # Clean the code
        code = clean_code_example(match)
        if code and len(code) > 30 and code not in code_examples:
            code_examples.append(code)
    
    # If no complete class found, try to extract simpler examples
    if not code_examples:
        simple_patterns = [
            r'(System\.out\.println\s*\([^)]+\)\s*;)',
            r'((?:int|double|String|boolean)\s+\w+\s*=\s*[^;]+;)',
        ]
        for pattern in simple_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                code = match.strip()
                if code and code not in code_examples:
                    code_examples.append(code)
    
    return code_examples[:3]


def clean_code_example(code):
    """Clean a Java code example"""
    if not code:
        return ""
    
    # Remove line numbers at start of lines
    code = re.sub(r'^\s*\d+\s+', '', code, flags=re.MULTILINE)
    
    # Remove comments about line numbers
    code = re.sub(r'//.*line\s+number.*$', '', code, flags=re.MULTILINE | re.IGNORECASE)
    code = re.sub(r'//.*display\s+message.*$', '', code, flags=re.MULTILINE | re.IGNORECASE)
    
    # Clean up whitespace
    lines = code.split('\n')
    cleaned_lines = [line.rstrip() for line in lines if line.strip()]
    
    return '\n'.join(cleaned_lines)


def generate_key_points(sentences, topic_info):
    """Generate key points from sentences"""
    keywords = topic_info.get('keywords', [])
    title = topic_info.get('title', '').lower()
    
    key_points = []
    
    for sentence in sentences:
        if len(key_points) >= 5:
            break
        
        sentence_lower = sentence.lower()
        
        # Check if sentence contains keywords or topic-related terms
        is_relevant = False
        for keyword in keywords + [title]:
            if keyword.lower() in sentence_lower:
                is_relevant = True
                break
        
        # Also include sentences with key learning indicators
        learning_indicators = ['important', 'must', 'note that', 'remember', 'key', 'essential', 'always', 'never']
        for indicator in learning_indicators:
            if indicator in sentence_lower:
                is_relevant = True
                break
        
        if is_relevant and 30 < len(sentence) < 200:
            # Clean and add
            point = sentence.strip()
            if not point.endswith('.'):
                point += '.'
            if point not in key_points:
                key_points.append(point)
    
    # If not enough points, add generic ones based on topic
    if len(key_points) < 3:
        topic_title = topic_info.get('title', 'this topic')
        default_points = [
            f"Understanding {topic_title} is fundamental for Java programming.",
            "Practice writing code to reinforce these concepts.",
            "Pay attention to syntax and common patterns."
        ]
        for point in default_points:
            if len(key_points) < 5 and point not in key_points:
                key_points.append(point)
    
    return key_points[:5]


def extract_code_examples(text):
    """Extract Java code examples from text"""
    code_examples = []
    
    patterns = [
        r'(public\s+(?:class|static|void)[^{]*\{(?:[^{}]|\{[^{}]*\})*\})',
        r'(System\.out\.print(?:ln)?\s*\([^)]+\)\s*;)',
        r'((?:int|double|String|boolean|char|float|long)\s+\w+\s*=\s*[^;]+;)',
        r'(for\s*\([^)]+\)\s*\{(?:[^{}]|\{[^{}]*\})*\})',
        r'(while\s*\([^)]+\)\s*\{(?:[^{}]|\{[^{}]*\})*\})',
        r'(if\s*\([^)]+\)\s*\{(?:[^{}]|\{[^{}]*\})*\})',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.MULTILINE | re.DOTALL)
        for match in matches:
            cleaned_code = match.strip()
            if cleaned_code and len(cleaned_code) > 15 and cleaned_code not in code_examples:
                code_examples.append(cleaned_code)
    
    return code_examples[:3]


def extract_key_points(text, keywords):
    """Extract key points based on keywords"""
    points = []
    sentences = re.split(r'[.!?]+', text)
    
    for sentence in sentences:
        sentence = sentence.strip()
        if 40 < len(sentence) < 250:
            for keyword in keywords:
                if keyword.lower() in sentence.lower():
                    clean_sentence = re.sub(r'^\s*[-•]\s*', '', sentence)
                    if clean_sentence and clean_sentence not in points:
                        points.append(clean_sentence.strip())
                        break
    
    return points[:5]


def get_topic_code_example(topic_id, topic_title):
    """Get appropriate code examples for each topic"""
    
    code_examples = {
        # Chapter 1 - Introduction
        "1-1": [
            "// Welcome to Java Programming!\n// This course will teach you to write programs\n\npublic class Welcome {\n    public static void main(String[] args) {\n        System.out.println(\"Welcome to Java!\");\n        System.out.println(\"Let's start learning!\");\n    }\n}"
        ],
        "1-2": [
            "// Understanding Computer Hardware\n// CPU, Memory, Storage, I/O Devices\n\n// The CPU processes instructions\n// Memory (RAM) stores data temporarily\n// Storage (HDD/SSD) stores data permanently\n// Input: Keyboard, Mouse | Output: Monitor"
        ],
        "1-3": [
            "// Types of Programming Languages\n\n// Machine Language: 10110000 01100001\n// Assembly: MOV AL, 61h\n// High-Level (Java):\n\npublic class HighLevel {\n    public static void main(String[] args) {\n        System.out.println(\"Much easier!\");\n    }\n}"
        ],
        "1-4": [
            "// Operating Systems\n// Windows, macOS, Linux\n\n// The OS manages:\n// - Hardware resources\n// - Running programs\n// - File system\n// - User interface"
        ],
        "1-5": [
            "// Java History\n// Created by James Gosling at Sun Microsystems (1995)\n// \"Write Once, Run Anywhere\"\n\n// Java runs on JVM (Java Virtual Machine)\n// Platform independent - works on Windows, Mac, Linux"
        ],
        "1-6": [
            "// Java Development Kit (JDK)\n// Contains: compiler (javac), JVM, libraries\n\n// IDEs for Java:\n// - Eclipse\n// - IntelliJ IDEA\n// - NetBeans\n// - VS Code with Java extensions"
        ],
        "1-7": [
            "// Your First Java Program!\npublic class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}",
            "// Print multiple lines\npublic class Welcome {\n    public static void main(String[] args) {\n        System.out.println(\"Welcome to Java!\");\n        System.out.println(\"Programming is fun!\");\n    }\n}"
        ],
        "1-8": [
            "// How to compile and run:\n// 1. Save as HelloWorld.java\n// 2. Open terminal\n// 3. javac HelloWorld.java  (compile)\n// 4. java HelloWorld  (run)\n\npublic class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println(\"Compiled!\");\n    }\n}"
        ],
        "1-9": [
            "// Good Programming Style\n\n// Use comments to explain code\n// This is a single-line comment\n\n/* This is a\n   multi-line comment */\n\n/** This is JavaDoc\n *  for documentation */\n\npublic class GoodStyle {\n    public static void main(String[] args) {\n        // Use meaningful names\n        System.out.println(\"Clean code!\");\n    }\n}"
        ],
        "1-10": [
            "// Types of Errors\n\n// 1. Syntax Error (compile-time)\n// System.out.println(\"Missing semicolon\")\n\n// 2. Runtime Error\n// int result = 10 / 0;  // Division by zero!\n\n// 3. Logic Error\n// int sum = a - b;  // Should be a + b"
        ],
        # Chapter 2 - Elementary Programming
        "2-1": [
            "// Elementary Programming\n// Learning variables, data types, and operators\n\npublic class Elementary {\n    public static void main(String[] args) {\n        int number = 10;\n        System.out.println(\"Number: \" + number);\n    }\n}"
        ],
        "2-2": [
            "// Computing Area of a Circle\npublic class ComputeArea {\n    public static void main(String[] args) {\n        double radius = 5.0;\n        double area = radius * radius * 3.14159;\n        System.out.println(\"Area: \" + area);\n    }\n}"
        ],
        "2-3": [
            "// Reading Input from User\nimport java.util.Scanner;\n\npublic class UserInput {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n        \n        System.out.print(\"Enter your name: \");\n        String name = input.nextLine();\n        \n        System.out.println(\"Hello, \" + name);\n    }\n}"
        ],
        "2-4": [
            "// Valid Identifiers in Java\n\n// Valid names:\nint age = 25;\nint myAge = 25;\nint _count = 10;\nint $price = 100;\n\n// Invalid names:\n// int 2fast = 10;  // Can't start with number\n// int my-var = 5;  // No hyphens allowed"
        ],
        "2-5": [
            "// Declaring Variables\npublic class Variables {\n    public static void main(String[] args) {\n        int age = 25;\n        double price = 19.99;\n        String name = \"Java\";\n        boolean isActive = true;\n        \n        System.out.println(\"Age: \" + age);\n        System.out.println(\"Price: $\" + price);\n    }\n}"
        ],
        "2-6": [
            "// Assignment Statements\npublic class Assignment {\n    public static void main(String[] args) {\n        int x = 10;        // Assign 10 to x\n        x = x + 5;         // Add 5 to x\n        System.out.println(x);  // 15\n        \n        int y = x = 20;    // Chain assignment\n        System.out.println(y);  // 20\n    }\n}"
        ],
        "2-7": [
            "// Named Constants\npublic class Constants {\n    public static void main(String[] args) {\n        final double PI = 3.14159;\n        final int MAX_SIZE = 100;\n        \n        double area = PI * 5 * 5;\n        System.out.println(\"Area: \" + area);\n        \n        // PI = 3.14;  // Error! Cannot change\n    }\n}"
        ],
        "2-8": [
            "// Naming Conventions\n\n// Variables: camelCase\nint studentAge = 20;\nString firstName = \"John\";\n\n// Constants: UPPER_SNAKE_CASE\nfinal double TAX_RATE = 0.08;\n\n// Classes: PascalCase\n// public class MyClassName {}"
        ],
        "2-9": [
            "// Numeric Operations\npublic class NumericOps {\n    public static void main(String[] args) {\n        int a = 10, b = 3;\n        \n        System.out.println(\"Add: \" + (a + b));      // 13\n        System.out.println(\"Subtract: \" + (a - b)); // 7\n        System.out.println(\"Multiply: \" + (a * b)); // 30\n        System.out.println(\"Divide: \" + (a / b));   // 3\n        System.out.println(\"Remainder: \" + (a % b)); // 1\n    }\n}"
        ],
        "2-10": [
            "// Numeric Literals\npublic class Literals {\n    public static void main(String[] args) {\n        int decimal = 42;       // Decimal\n        int binary = 0b101010;  // Binary (0b prefix)\n        int hex = 0x2A;         // Hexadecimal (0x)\n        \n        double d1 = 3.14;\n        double d2 = 3.14e2;     // Scientific: 314.0\n        float f = 3.14f;        // Float needs 'f'\n    }\n}"
        ],
        "2-11": [
            "// Expression Evaluation\npublic class Expressions {\n    public static void main(String[] args) {\n        // Order: () > * / % > + -\n        int result = 10 + 5 * 2;  // 20, not 30\n        int grouped = (10 + 5) * 2;  // 30\n        \n        System.out.println(result);\n        System.out.println(grouped);\n    }\n}"
        ],
        "2-12": [
            "// Augmented Assignment\npublic class AugmentedOps {\n    public static void main(String[] args) {\n        int x = 10;\n        \n        x += 5;  // x = x + 5 = 15\n        x -= 3;  // x = x - 3 = 12\n        x *= 2;  // x = x * 2 = 24\n        x /= 4;  // x = x / 4 = 6\n        x %= 4;  // x = x % 4 = 2\n        \n        System.out.println(x);  // 2\n    }\n}"
        ],
        "2-13": [
            "// Increment and Decrement\npublic class IncDec {\n    public static void main(String[] args) {\n        int x = 5;\n        \n        System.out.println(x++);  // 5, then x becomes 6\n        System.out.println(++x);  // 7 (increment first)\n        System.out.println(x--);  // 7, then x becomes 6\n        System.out.println(--x);  // 5 (decrement first)\n    }\n}"
        ],
        "2-14": [
            "// Type Casting\npublic class Casting {\n    public static void main(String[] args) {\n        // Widening (automatic)\n        int i = 100;\n        double d = i;  // int to double\n        \n        // Narrowing (explicit)\n        double pi = 3.14159;\n        int rounded = (int) pi;  // 3\n        \n        System.out.println(d);       // 100.0\n        System.out.println(rounded); // 3\n    }\n}"
        ],
        # Chapter 3 - Selections
        "3-1": [
            "// Selection Statements\n// Make decisions in your code\n\npublic class Selection {\n    public static void main(String[] args) {\n        int score = 85;\n        \n        if (score >= 60) {\n            System.out.println(\"You passed!\");\n        }\n    }\n}"
        ],
        "3-2": [
            "// Boolean Data Type\npublic class BooleanDemo {\n    public static void main(String[] args) {\n        boolean isJavaFun = true;\n        boolean isFishTasty = false;\n        \n        int x = 10, y = 5;\n        boolean result = x > y;  // true\n        \n        System.out.println(result);  // true\n    }\n}"
        ],
        "3-3": [
            "// Simple if Statement\npublic class IfStatement {\n    public static void main(String[] args) {\n        int score = 85;\n        \n        if (score >= 60) {\n            System.out.println(\"You passed!\");\n            System.out.println(\"Congratulations!\");\n        }\n    }\n}"
        ],
        "3-4": [
            "// if-else Statement\npublic class IfElse {\n    public static void main(String[] args) {\n        int score = 55;\n        \n        if (score >= 60) {\n            System.out.println(\"You passed!\");\n        } else {\n            System.out.println(\"You failed.\");\n            System.out.println(\"Try again!\");\n        }\n    }\n}"
        ],
        "3-5": [
            "// Nested if and else-if\npublic class NestedIf {\n    public static void main(String[] args) {\n        int score = 85;\n        \n        if (score >= 90) {\n            System.out.println(\"Grade: A\");\n        } else if (score >= 80) {\n            System.out.println(\"Grade: B\");\n        } else if (score >= 70) {\n            System.out.println(\"Grade: C\");\n        } else {\n            System.out.println(\"Grade: F\");\n        }\n    }\n}"
        ],
        # Chapter 5 - Loops
        "5-1": [
            "// Introduction to Loops\n// Repeat code multiple times\n\npublic class LoopIntro {\n    public static void main(String[] args) {\n        // Print 5 times\n        for (int i = 1; i <= 5; i++) {\n            System.out.println(\"Hello!\");\n        }\n    }\n}"
        ],
        "5-2": [
            "// while Loop\npublic class WhileLoop {\n    public static void main(String[] args) {\n        int count = 1;\n        \n        while (count <= 5) {\n            System.out.println(\"Count: \" + count);\n            count++;\n        }\n    }\n}"
        ],
        "5-3": [
            "// do-while Loop\npublic class DoWhileLoop {\n    public static void main(String[] args) {\n        int count = 1;\n        \n        do {\n            System.out.println(\"Count: \" + count);\n            count++;\n        } while (count <= 5);\n        \n        // Executes at least once!\n    }\n}"
        ],
        "5-4": [
            "// for Loop\npublic class ForLoop {\n    public static void main(String[] args) {\n        // for (init; condition; update)\n        for (int i = 1; i <= 5; i++) {\n            System.out.println(\"i = \" + i);\n        }\n        \n        // Count down\n        for (int j = 5; j >= 1; j--) {\n            System.out.println(\"j = \" + j);\n        }\n    }\n}"
        ],
        # Chapter 7 - Arrays
        "7-1": [
            "// Introduction to Arrays\n// Store multiple values of same type\n\npublic class ArrayIntro {\n    public static void main(String[] args) {\n        // Array declaration and initialization\n        int[] numbers = {10, 20, 30, 40, 50};\n        \n        System.out.println(numbers[0]);  // 10\n        System.out.println(numbers.length);  // 5\n    }\n}"
        ],
        "7-2": [
            "// Array Basics\npublic class ArrayBasics {\n    public static void main(String[] args) {\n        // Create array\n        int[] nums = new int[5];\n        nums[0] = 10;\n        nums[1] = 20;\n        \n        // Or initialize directly\n        String[] names = {\"Alice\", \"Bob\", \"Charlie\"};\n        \n        // Loop through array\n        for (int i = 0; i < names.length; i++) {\n            System.out.println(names[i]);\n        }\n    }\n}"
        ],
    }
    
    # Return specific examples or generate generic one
    if topic_id in code_examples:
        return code_examples[topic_id]
    else:
        return [
            f"// Example for {topic_title}\npublic class Example {{\n    public static void main(String[] args) {{\n        // Your code here\n        System.out.println(\"Learning {topic_title}\");\n    }}\n}}"
        ]


def generate_fallback_content(topic_info):
    """Generate attractive fallback content when RAG doesn't return relevant results"""
    topic_title = topic_info.get('title', 'this topic')
    description = topic_info.get('description', 'Key programming concepts')
    topic_id = topic_info.get('id', '1-1')
    
    # Get appropriate code examples
    code_examples = get_topic_code_example(topic_id, topic_title)
    metadata = get_topic_metadata(topic_id)
    
    return [
        {
            "title": "🎯 What You'll Learn",
            "content": f"Hey there! 👋 Ready to learn **{topic_title}**?\n\nHere's what we'll cover:\n\n• {description}\n• Why this matters for your coding journey\n• Hands-on examples you can try",
            "type": "introduction"
        },
        {
            "title": "💡 Concept Explanation",
            "content": f"Think of **{topic_title}** like building blocks. 🧱\n\nEvery great program starts with small, simple pieces. This is one of those essential pieces!\n\n• Start simple, then build up\n• Practice makes it click\n• Don't worry if it takes time - totally normal!",
            "type": "explanation"
        },
        {
            "title": "📊 Visual Simulation",
            "content": f"Let's see how {topic_title} works step by step:",
            "type": "visual",
            "steps": [
                {"step": 1, "title": "Start Here", "description": "Begin with the basic structure", "code": code_examples[0] if code_examples else "// Your code starts here"},
                {"step": 2, "title": "Add Logic", "description": "Build on the foundation", "code": "// Add your logic"},
                {"step": 3, "title": "See Results", "description": "Run and observe output", "code": "// Check the output!"}
            ]
        },
        {
            "title": "⚡ Key Points",
            "content": "",
            "type": "keypoints", 
            "points": [
                f"✓ {description}",
                "✓ Foundation for advanced topics",
                "✓ Practice by writing code yourself",
                "✓ Used frequently in real programs",
                "✓ Understanding this = easier future topics"
            ]
        },
        {
            "title": "🔥 Tips & Mistakes",
            "content": "",
            "type": "tips",
            "sidebar": True,
            "dos": [
                "Read code carefully first",
                "Modify examples to learn",
                "Focus on understanding"
            ],
            "donts": [
                "Skip the basics",
                "Copy-paste blindly",
                "Give up on errors"
            ],
            "protip": "Break big problems into tiny steps. Master each before moving on! 💪"
        },
        {
            "title": "🌍 Real World Use",
            "content": f"Where do we use {topic_title} in real life?",
            "type": "realworld",
            "examples": [
                {"app": "Mobile Apps", "how": "Building user interfaces and handling data"},
                {"app": "Web Services", "how": "Processing requests and managing information"}
            ]
        },
        {
            "title": "🧪 Practice Problem",
            "content": "Try this challenge:",
            "type": "practice",
            "problem": {
                "description": f"Create a simple program using {topic_title}. Start with the example code and modify it!",
                "starterCode": code_examples[0] if code_examples else f"// Practice {topic_title} here",
                "hints": ["Start with the basic structure", "Run your code after each change"],
                "solution": code_examples[0] if code_examples else "// Solution will vary based on your approach",
                "explanation": "The key is understanding the pattern. Try variations to solidify learning!"
            }
        },
        {
            "title": "📝 Summary",
            "content": "",
            "type": "summary",
            "points": [
                f"📌 {topic_title} - {description}",
                "📌 Master basics before advancing",
                "📌 Practice with the examples",
                "📌 Builds foundation for what's next!"
            ]
        }
    ]


@app.route('/api/chapters', methods=['GET'])
def get_chapters():
    """Get all available chapters"""
    try:
        chapters = []
        for chapter_id, chapter_data in CHAPTER_TOPICS.items():
            chapters.append({
                'id': chapter_id,
                'title': chapter_data['title'],
                'topic_count': len(chapter_data['topics']),
                'description': f"Learn about {chapter_data['title'].lower()}"
            })
        
        return jsonify({
            'success': True,
            'chapters': sorted(chapters, key=lambda x: x['id'])
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/chapter/<chapter_id>/topics', methods=['GET'])
def get_chapter_topics_api(chapter_id):
    """Get all topics for a specific chapter"""
    try:
        chapter_id = int(chapter_id)
        print(f"\n📚 Getting topics for Chapter {chapter_id}")
        
        if chapter_id not in CHAPTER_TOPICS:
            print(f"❌ Chapter {chapter_id} not found")
            return jsonify({
                'success': False,
                'error': f'Chapter {chapter_id} not found'
            }), 404
        
        chapter_data = CHAPTER_TOPICS[chapter_id]
        topics = []
        
        for i, topic in enumerate(chapter_data['topics']):
            topics.append({
                'id': topic['id'],
                'title': topic['title'],
                'description': topic['description'],
                'order': i + 1,
                'duration': '10-15 mins'
            })
        
        print(f"✅ Returning {len(topics)} topics for Chapter {chapter_id}: {chapter_data['title']}")
        
        return jsonify({
            'success': True,
            'chapter_title': chapter_data['title'],
            'topics': topics
        })
    except Exception as e:
        print(f"❌ Error getting topics: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/topic/<topic_id>/content', methods=['GET'])
def get_topic_content(topic_id):
    """Get learning content for a specific topic"""
    try:
        print(f"\n📖 Getting content for topic: {topic_id}")
        
        # Parse topic ID (format: "1-2" means chapter 1, topic 2)
        parts = topic_id.split('-')
        if len(parts) != 2:
            return jsonify({'success': False, 'error': 'Invalid topic ID format'}), 400
        
        chapter_id = int(parts[0])
        topic_num = int(parts[1])
        
        print(f"   Chapter: {chapter_id}, Topic: {topic_num}")
        
        if chapter_id not in CHAPTER_TOPICS:
            return jsonify({'success': False, 'error': 'Chapter not found'}), 404
        
        chapter_data = CHAPTER_TOPICS[chapter_id]
        
        # Find the topic
        topic_info = None
        for topic in chapter_data['topics']:
            if topic['id'] == topic_id:
                topic_info = topic
                break
        
        if not topic_info:
            return jsonify({'success': False, 'error': 'Topic not found'}), 404
        
        # Get topic metadata (difficulty, time, next topic)
        metadata = get_topic_metadata(topic_id)
        
        # ========================================
        # STEP 1: Try to load pre-generated content (INSTANT!)
        # ========================================
        pregenerated = get_pregenerated_content(topic_id)
        if pregenerated:
            # Add metadata to pregenerated content
            pregenerated['metadata'] = metadata
            # Inject concept_tags into questions for adaptive learning
            concept_tags = topic_info.get('concept_tags', [])
            if 'questions' in pregenerated and concept_tags:
                for q in pregenerated['questions']:
                    if 'concept_tags' not in q:
                        q['concept_tags'] = concept_tags
            return jsonify({
                'success': True,
                **pregenerated
            })
        
        # ========================================
        # STEP 2: If no pre-generated content, generate on-the-fly
        # ========================================
        print(f"   ⚠️ No pre-generated content found, generating on-the-fly...")
        
        # Query RAG for specific topic content
        query = topic_info.get('query', topic_info['title'])
        print(f"   Query: {query}")
        
        # Get content from RAG (returns list of document contents)
        raw_docs = get_relevant_context(query, k=10)
        
        # Join all documents into a single string
        raw_context = '\n\n'.join(raw_docs) if raw_docs else ''
        
        print(f"   RAW docs count: {len(raw_docs)}")
        print(f"   RAW context length: {len(raw_context)}")
        if raw_context:
            print(f"   First 200 chars: {raw_context[:200]}...")
        
        # Format the content
        sections = format_topic_content(raw_context, topic_info)
        
        print(f"   Generated {len(sections)} sections")
        
        response_data = {
            'topic': {
                'id': topic_id,
                'title': topic_info['title'],
                'description': topic_info['description'],
                'chapter_id': chapter_id,
                'chapter_title': chapter_data['title']
            },
            'metadata': metadata,
            'sections': sections,
            'total_pages': len(sections)
        }
        
        # Auto-cache for next time
        try:
            import json
            os.makedirs(GENERATED_CONTENT_DIR, exist_ok=True)
            filepath = os.path.join(GENERATED_CONTENT_DIR, f"topic_{topic_id}.json")
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(response_data, f, ensure_ascii=False, indent=2)
            print(f"   💾 Auto-cached for future requests")
        except Exception as e:
            print(f"   ⚠️ Could not auto-cache: {e}")
        
        return jsonify({
            'success': True,
            **response_data
        })
        
    except Exception as e:
        print(f"❌ Error getting topic content: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/topic/<topic_id>/questions', methods=['GET'])
def get_topic_questions(topic_id):
    """Generate practice questions for a topic"""
    try:
        parts = topic_id.split('-')
        if len(parts) != 2:
            return jsonify({'success': False, 'error': 'Invalid topic ID format'}), 400
        
        chapter_id = int(parts[0])
        
        if chapter_id not in CHAPTER_TOPICS:
            return jsonify({'success': False, 'error': 'Chapter not found'}), 404
        
        topic_info = None
        for topic in CHAPTER_TOPICS[chapter_id]['topics']:
            if topic['id'] == topic_id:
                topic_info = topic
                break
        
        if not topic_info:
            return jsonify({'success': False, 'error': 'Topic not found'}), 404
        
        difficulty = request.args.get('difficulty', 'medium')
        num_questions = int(request.args.get('num', 3))
        
        questions = question_gen.generate_questions(
            topic=topic_info['title'],
            difficulty=difficulty,
            num_questions=num_questions
        )
        
        return jsonify({
            'success': True,
            'topic': topic_info['title'],
            'questions': questions
        })
        
    except Exception as e:
        print(f"❌ Error generating questions: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/topic/<topic_id>/practice-questions', methods=['GET'])
def get_practice_questions(topic_id):
    """Generate structured practice questions for coding exercises"""
    try:
        parts = topic_id.split('-')
        if len(parts) != 2:
            return jsonify({'success': False, 'error': 'Invalid topic ID format'}), 400
        
        chapter_id = int(parts[0])
        
        if chapter_id not in CHAPTER_TOPICS:
            return jsonify({'success': False, 'error': 'Chapter not found'}), 404
        
        topic_info = None
        for topic in CHAPTER_TOPICS[chapter_id]['topics']:
            if topic['id'] == topic_id:
                topic_info = topic
                break
        
        if not topic_info:
            return jsonify({'success': False, 'error': 'Topic not found'}), 404
        
        difficulty = request.args.get('difficulty', 'easy')
        num_questions = int(request.args.get('num', 3))
        
        # Generate structured coding questions
        questions = generate_coding_questions(
            topic_info=topic_info,
            difficulty=difficulty,
            num_questions=num_questions
        )
        
        return jsonify({
            'success': True,
            'topic_id': topic_id,
            'topic_title': topic_info['title'],
            'difficulty': difficulty,
            'questions': questions
        })
        
    except Exception as e:
        print(f"❌ Error generating practice questions: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


def generate_coding_questions(topic_info, difficulty, num_questions):
    """Generate structured coding questions with test cases"""
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    import json
    
    model = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=GROQ_API_KEY,
        temperature=0.3,
        max_tokens=4096
    )
    
    # Get relevant content for context
    relevant_content = get_relevant_context(topic_info['query'], k=3)
    book_context = '\n\n'.join(relevant_content) if relevant_content else ''
    
    prompt_template = """
You are an expert Java programming instructor creating coding practice questions.

TOPIC: {topic_title}
TOPIC DESCRIPTION: {topic_description}
TOPIC KEYWORDS: {topic_keywords}
DIFFICULTY: {difficulty}
NUMBER OF QUESTIONS: {num_questions}

RELEVANT BOOK CONTENT:
{book_context}

CRITICAL TOPIC CONSTRAINTS - READ CAREFULLY:
- Questions MUST ONLY test concepts from "{topic_title}"
- DO NOT include concepts from OTHER topics like:
  * If topic is "Hello World/Simple Program": DO NOT use if-else, loops, arrays, methods, Scanner input
  * If topic is "Variables": DO NOT use if-else, loops, complex expressions
  * If topic is "If-Else": You CAN use variables but focus on conditionals
  * If topic is "Loops": You CAN use variables and conditionals but focus on loops
- Questions should be completable using ONLY the concepts taught in this specific topic
- The complexity should match what a student learning THIS topic would know

Generate {num_questions} Java coding practice questions as a JSON array. Each question must have this EXACT structure:

[
  {{
    "id": 1,
    "title": "Question title that clearly relates to {topic_title}",
    "difficulty": "{difficulty}",
    "description": "Detailed description focusing ONLY on {topic_title} concepts",
    "constraints": ["constraint 1", "constraint 2"],
    "examples": [
      {{"input": "example input or setup", "output": "expected output"}}
    ],
    "hints": ["hint 1 related to {topic_title}", "hint 2"],
    "starterCode": "public class Solution {{\\n    public static void main(String[] args) {{\\n        // Write your code here to practice {topic_title}\\n    }}\\n}}",
    "expectedOutput": "The EXACT expected console output (what System.out.println will produce)",
    "testCases": [
      {{"input": "", "expectedOutput": "exact output 1"}},
      {{"input": "", "expectedOutput": "exact output 2"}}
    ],
    "solutionKeywords": ["keyword specific to the solution"],
    "mustContain": ["required code pattern for this topic"],
    "mustNotContain": ["concepts NOT covered in this topic yet"]
  }}
]

DIFFICULTY GUIDELINES for "{topic_title}":
- Easy: Very basic application of {topic_title} concepts only
- Medium: Standard application with minor variations
- Hard: Complex application but still ONLY using {topic_title} concepts

IMPORTANT RULES:
1. Return ONLY valid JSON array, absolutely no other text before or after
2. Each question MUST be solvable using ONLY {topic_title} concepts
3. expectedOutput must be EXACT text that will appear in console (including spaces, newlines)
4. mustContain should verify the student used the correct approach for this topic
5. mustNotContain should list concepts the student shouldn't need for this topic
6. For simple topics like "Hello World", keep it simple - just print statements!

Generate the questions now:
"""
    
    prompt = ChatPromptTemplate.from_template(prompt_template)
    chain = prompt | model
    
    # Get keywords if available
    topic_keywords = ', '.join(topic_info.get('keywords', [])) if topic_info.get('keywords') else topic_info['title']
    
    result = chain.invoke({
        "topic_title": topic_info['title'],
        "topic_description": topic_info['description'],
        "topic_keywords": topic_keywords,
        "difficulty": difficulty,
        "num_questions": num_questions,
        "book_context": book_context[:2000]
    })
    
    # Parse the JSON response
    response_text = result.content.strip()
    
    # Try to extract JSON from the response
    try:
        # Remove markdown code blocks if present
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
        
        questions = json.loads(response_text)
        return questions
    except json.JSONDecodeError:
        # Fallback: try to find JSON array in response
        import re
        json_match = re.search(r'\[[\s\S]*\]', response_text)
        if json_match:
            try:
                questions = json.loads(json_match.group())
                return questions
            except:
                pass
        
        # Return fallback questions
        return get_fallback_practice_questions(topic_info, difficulty, num_questions)


def get_fallback_practice_questions(topic_info, difficulty, num_questions):
    """Fallback questions when AI generation fails"""
    return [
        {
            "id": 1,
            "title": f"Practice {topic_info['title']}",
            "difficulty": difficulty,
            "description": f"Write a Java program demonstrating your understanding of {topic_info['title']}.",
            "constraints": [
                "Your code must compile without errors",
                "Use proper Java syntax",
                "Include comments explaining your code"
            ],
            "examples": [
                {"input": "N/A", "output": "Your output here"}
            ],
            "hints": [
                f"Review the concepts of {topic_info['title']}",
                "Start with the basic structure",
                "Test your code step by step"
            ],
            "starterCode": "public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n        \n    }\n}",
            "expectedOutput": "",
            "testCases": [],
            "solutionKeywords": [],
            "mustContain": ["public class", "public static void main"],
            "mustNotContain": []
        }
    ]


def load_chapter_practice_questions(chapter_id):
    """Load pre-generated chapter practice questions from file"""
    import json
    filepath = os.path.join(GENERATED_CONTENT_DIR, f"chapter_{chapter_id}_practice.json")
    
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"⚡ Loaded pre-generated chapter {chapter_id} practice questions instantly!")
                return data.get('questions', [])
        except Exception as e:
            print(f"⚠️ Error loading chapter practice questions: {e}")
    
    return None


@app.route('/api/chapter/<int:chapter_id>/practice-questions', methods=['GET'])
def get_chapter_practice_questions(chapter_id):
    """Get practice questions covering all topics in a chapter (loads from pre-generated files)"""
    try:
        if chapter_id not in CHAPTER_TOPICS:
            return jsonify({'success': False, 'error': 'Chapter not found'}), 404
        
        chapter_data = CHAPTER_TOPICS[chapter_id]
        
        # First try to load pre-generated questions
        questions = load_chapter_practice_questions(chapter_id)
        
        if questions and len(questions) > 0:
            return jsonify({
                'success': True,
                'chapter_id': chapter_id,
                'chapter_title': chapter_data['title'],
                'difficulty': 'mixed',
                'questions': questions,
                'source': 'pre-generated'
            })
        
        # Fallback to generating on-the-fly if file doesn't exist
        print(f"⚠️ No pre-generated questions for chapter {chapter_id}, generating on-the-fly...")
        topics = chapter_data['topics']
        difficulty = request.args.get('difficulty', 'medium')
        num_questions = int(request.args.get('num', 5))
        
        questions = generate_chapter_practice_questions(
            chapter_id=chapter_id,
            chapter_title=chapter_data['title'],
            topics=topics,
            difficulty=difficulty,
            num_questions=num_questions
        )
        
        return jsonify({
            'success': True,
            'chapter_id': chapter_id,
            'chapter_title': chapter_data['title'],
            'difficulty': difficulty,
            'questions': questions,
            'source': 'generated'
        })
        
    except Exception as e:
        print(f"❌ Error getting chapter practice questions: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


def generate_chapter_practice_questions(chapter_id, chapter_title, topics, difficulty, num_questions):
    """Generate practice questions covering all topics in a chapter"""
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    import json
    
    model = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=GROQ_API_KEY,
        temperature=0.3,
        max_tokens=8192
    )
    
    topics_summary = '\n'.join([f"- {t['title']}: {t['description']}" for t in topics])
    all_keywords = []
    for topic in topics:
        all_keywords.extend(topic.get('keywords', []))
    keywords_str = ', '.join(list(set(all_keywords))[:30])
    
    relevant_content = get_relevant_context(f"{chapter_title} {keywords_str}", k=5)
    book_context = '\n\n'.join(relevant_content) if relevant_content else ''
    
    prompt_template = """You are an expert Java instructor creating chapter practice questions.

CHAPTER: {chapter_title}
TOPICS COVERED:
{topics_summary}

KEY CONCEPTS: {keywords}
DIFFICULTY: {difficulty}

RELEVANT CONTENT:
{book_context}

Generate exactly {num_questions} Java coding practice questions as a JSON array. Each question should test different concepts from the chapter.

[
  {{
    "id": 1,
    "title": "Clear descriptive title",
    "topic": "Topic this tests",
    "difficulty": "{difficulty}",
    "description": "Detailed description of what to code",
    "constraints": ["constraint 1", "constraint 2"],
    "examples": [{{"input": "example", "output": "expected output"}}],
    "hints": ["helpful hint 1", "helpful hint 2"],
    "starterCode": "public class Solution {{\\n    public static void main(String[] args) {{\\n        // Your code here\\n    }}\\n}}",
    "expectedOutput": "Exact expected output",
    "testCases": [{{"input": "", "expectedOutput": "output"}}],
    "solutionKeywords": ["keyword"],
    "mustContain": ["public class"],
    "mustNotContain": []
  }}
]

DIFFICULTY GUIDELINES:
- Easy: Basic syntax, simple print statements, variable declarations
- Medium: Conditionals, simple loops, basic calculations
- Hard: Nested structures, complex logic, multiple concepts

Return ONLY valid JSON array, no other text."""
    
    prompt = ChatPromptTemplate.from_template(prompt_template)
    chain = prompt | model
    
    result = chain.invoke({
        "chapter_title": chapter_title,
        "topics_summary": topics_summary,
        "keywords": keywords_str,
        "difficulty": difficulty,
        "num_questions": num_questions,
        "book_context": book_context[:3000]
    })
    
    response_text = result.content.strip()
    
    try:
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
        return json.loads(response_text.strip())
    except:
        import re
        json_match = re.search(r'\[[\s\S]*\]', response_text)
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        # Fallback questions
        return [{
            "id": i + 1,
            "title": f"Practice: {topics[i % len(topics)]['title']}",
            "topic": topics[i % len(topics)]['title'],
            "difficulty": difficulty,
            "description": f"Write a Java program demonstrating {topics[i % len(topics)]['title']}. {topics[i % len(topics)]['description']}",
            "constraints": ["Your code must compile without errors"],
            "examples": [{"input": "", "output": "Your output"}],
            "hints": [f"Review {topics[i % len(topics)]['title']}"],
            "starterCode": "public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}",
            "expectedOutput": "",
            "testCases": [],
            "solutionKeywords": topics[i % len(topics)].get('keywords', [])[:3],
            "mustContain": ["public class"],
            "mustNotContain": []
        } for i in range(num_questions)]


def compare_outputs(expected, actual):
    """
    Compare expected and actual outputs with flexible matching.
    Returns (is_match: bool, similarity: float)
    """
    if not expected:
        return (bool(actual and 'error' not in actual.lower()), 1.0 if actual else 0.0)
    
    if not actual:
        return (False, 0.0)
    
    # Normalize both outputs
    def normalize(text):
        # Remove leading/trailing whitespace from each line
        lines = [line.strip() for line in text.strip().split('\n')]
        # Remove empty lines
        lines = [line for line in lines if line]
        return '\n'.join(lines).lower()
    
    norm_expected = normalize(expected)
    norm_actual = normalize(actual)
    
    # Exact match
    if norm_expected == norm_actual:
        return (True, 1.0)
    
    # Check if expected is contained in actual (for extra output like prompts)
    if norm_expected in norm_actual:
        return (True, 0.95)
    
    # Check if actual is contained in expected
    if norm_actual in norm_expected:
        return (True, 0.9)
    
    # Check word-by-word similarity
    expected_words = set(norm_expected.split())
    actual_words = set(norm_actual.split())
    
    if not expected_words:
        return (False, 0.0)
    
    common_words = expected_words.intersection(actual_words)
    similarity = len(common_words) / len(expected_words)
    
    # Consider it a match if very high similarity
    is_match = similarity >= 0.9
    
    return (is_match, similarity)


@app.route('/api/validate-solution', methods=['POST'])
def validate_solution():
    """Validate a student's code solution against expected output"""
    try:
        data = request.json
        code = data.get('code', '')
        question = data.get('question', {})
        actual_output = data.get('actualOutput', '')
        
        expected_output = question.get('expectedOutput', '')
        must_contain = question.get('mustContain', [])
        must_not_contain = question.get('mustNotContain', [])
        solution_keywords = question.get('solutionKeywords', [])
        
        validation_result = {
            'isCorrect': False,
            'score': 0,
            'feedback': [],
            'suggestions': []
        }
        
        # Check mustContain patterns
        must_contain_score = 0
        for pattern in must_contain:
            if pattern.lower() in code.lower():
                must_contain_score += 1
            else:
                validation_result['feedback'].append(f"Missing required pattern: {pattern}")
        
        if must_contain:
            must_contain_percentage = (must_contain_score / len(must_contain)) * 100
        else:
            must_contain_percentage = 100
        
        # Check mustNotContain patterns
        has_forbidden = False
        for pattern in must_not_contain:
            if pattern.lower() in code.lower():
                has_forbidden = True
                validation_result['feedback'].append(f"Contains forbidden pattern: {pattern}")
        
        # Check output match with improved comparison
        output_match = False
        output_similarity = 0
        if expected_output:
            output_match, output_similarity = compare_outputs(expected_output, actual_output)
            if not output_match and output_similarity > 0.7:
                validation_result['suggestions'].append(
                    f"Output is close but not exact. Check spacing, punctuation, and capitalization."
                )
        else:
            # If no expected output, just check if code ran successfully
            output_match = len(actual_output) > 0 and 'error' not in actual_output.lower()
            output_similarity = 1.0 if output_match else 0
        
        # Check solution keywords
        keyword_score = 0
        for keyword in solution_keywords:
            if keyword.lower() in code.lower():
                keyword_score += 1
        
        if solution_keywords:
            keyword_percentage = (keyword_score / len(solution_keywords)) * 100
        else:
            keyword_percentage = 100
        
        # Calculate overall score
        score = 0
        if output_match:
            score += 50
        score += (must_contain_percentage * 0.3)
        score += (keyword_percentage * 0.2)
        if not has_forbidden:
            score += 10
        
        validation_result['score'] = min(100, int(score))
        validation_result['isCorrect'] = score >= 70 and output_match and not has_forbidden
        
        if validation_result['isCorrect']:
            validation_result['feedback'].append("Great job! Your solution is correct!")
        else:
            if not output_match:
                validation_result['suggestions'].append("Check your output - it doesn't match the expected result")
            if must_contain_percentage < 100:
                validation_result['suggestions'].append("Make sure you're using the required code patterns")
        
        return jsonify({
            'success': True,
            'validation': validation_result
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/search', methods=['POST'])
def search_content():
    """Search across all content"""
    try:
        data = request.json
        query = data.get('query', '')
        
        if not query:
            return jsonify({'success': False, 'error': 'Query is required'}), 400
        
        raw_docs = get_relevant_context(query, k=10)
        results = '\n\n'.join(raw_docs) if raw_docs else ''
        cleaned_results = clean_content(results)
        
        return jsonify({
            'success': True,
            'query': query,
            'results': cleaned_results
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'chapters_loaded': len(CHAPTER_TOPICS),
        'total_topics': sum(len(c['topics']) for c in CHAPTER_TOPICS.values())
    })


@app.route('/api/admin/content-status', methods=['GET'])
def admin_content_status():
    """Check status of pre-generated content"""
    import json
    try:
        if not os.path.exists(GENERATED_CONTENT_DIR):
            return jsonify({
                'success': True,
                'status': 'not_generated',
                'generated_count': 0,
                'total_topics': sum(len(c['topics']) for c in CHAPTER_TOPICS.values())
            })
        
        # Count generated files
        generated_files = [f for f in os.listdir(GENERATED_CONTENT_DIR) 
                         if f.startswith('topic_') and f.endswith('.json')]
        
        # Load metadata if exists
        metadata_file = os.path.join(GENERATED_CONTENT_DIR, '_metadata.json')
        metadata = {}
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
        
        total_topics = sum(len(c['topics']) for c in CHAPTER_TOPICS.values())
        
        return jsonify({
            'success': True,
            'status': 'complete' if len(generated_files) >= total_topics else 'partial',
            'generated_count': len(generated_files),
            'total_topics': total_topics,
            'generated_at': metadata.get('generated_at'),
            'missing_topics': [
                topic['id'] 
                for chapter in CHAPTER_TOPICS.values() 
                for topic in chapter['topics'] 
                if f"topic_{topic['id']}.json" not in generated_files
            ][:20]  # Limit to first 20 missing
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/regenerate-topic', methods=['POST'])
def admin_regenerate_topic():
    """Admin endpoint to regenerate a specific topic"""
    try:
        data = request.json or {}
        topic_id = data.get('topic_id')
        
        if not topic_id:
            return jsonify({'success': False, 'error': 'topic_id is required'}), 400
        
        # Delete existing file
        filepath = os.path.join(GENERATED_CONTENT_DIR, f"topic_{topic_id}.json")
        if os.path.exists(filepath):
            os.remove(filepath)
            
        return jsonify({
            'success': True,
            'message': f'Topic {topic_id} cache cleared. Next request will regenerate it.'
        })
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============ ADAPTIVE LEARNING ENDPOINTS ============

def _find_topic_info(topic_id):
    """Helper to find topic info from CHAPTER_TOPICS by topic_id."""
    for chapter in CHAPTER_TOPICS.values():
        for topic in chapter["topics"]:
            if topic["id"] == topic_id:
                return topic
    return None


@app.route('/api/quiz/evaluate', methods=['POST'])
def evaluate_quiz():
    """
    Evaluate quiz results, analyze errors, and decide: advance or remediate.
    
    Expects JSON body:
    {
        "topic_id": "3-5",
        "responses": [
            {
                "question_text": "...",
                "user_answer": "answer text or option text",
                "correct_answer": "correct option text",
                "is_correct": true/false,
                "concept_tags": ["tag1", "tag2"]
            }
        ],
        "user_concept_mastery": { "concept-tag": 0.5, ... },
        "attempt_number": 1
    }
    """
    try:
        data = request.json or {}
        topic_id = data.get('topic_id')
        responses = data.get('responses', [])
        user_concept_mastery = data.get('user_concept_mastery', {})
        attempt_number = data.get('attempt_number', 1)

        if not topic_id or not responses:
            return jsonify({'success': False, 'error': 'topic_id and responses are required'}), 400

        topic_info = _find_topic_info(topic_id)
        topic_title = topic_info.get('title', 'Unknown Topic') if topic_info else 'Unknown Topic'

        # 1. Analyze errors on incorrect answers
        analyzed_responses = error_analyzer.analyze_batch(responses, topic_title)

        # 2. Run decision router
        decision = adaptive_router.evaluate_quiz_result(
            user_concept_mastery=user_concept_mastery,
            topic_id=topic_id,
            quiz_responses=analyzed_responses,
            attempt_number=attempt_number
        )

        return jsonify({
            'success': True,
            'action': decision['action'],
            'topic_id': decision['topic_id'],
            'next_topic_id': decision.get('next_topic_id'),
            'score': decision.get('score', 0),
            'updated_masteries': decision.get('updated_masteries', {}),
            'weak_concepts': decision.get('weak_concepts', []),
            'remediation_plan': decision.get('remediation_plan'),
            'analyzed_responses': analyzed_responses
        })

    except Exception as e:
        print(f"⚠️ Quiz evaluation error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/remediation/content', methods=['POST'])
def get_remediation_content():
    """
    Generate targeted remedial learning content.
    
    Expects JSON body:
    {
        "topic_id": "3-5",
        "weak_concepts": [{"concept": "if-else", "mastery": 0.3, ...}],
        "mistake_details": [{"concept": "...", "user_said": "...", ...}],
        "attempt_number": 2,
        "concept_masteries": {"tag": 0.5, ...}
    }
    """
    try:
        data = request.json or {}
        topic_id = data.get('topic_id')
        weak_concepts = data.get('weak_concepts', [])
        mistake_details = data.get('mistake_details', [])
        attempt_number = data.get('attempt_number', 2)
        concept_masteries = data.get('concept_masteries', {})

        if not topic_id:
            return jsonify({'success': False, 'error': 'topic_id is required'}), 400

        topic_info = _find_topic_info(topic_id) or {"id": topic_id, "title": f"Topic {topic_id}"}

        result = remediation_gen.generate_remedial_content(
            topic_info=topic_info,
            weak_concepts=weak_concepts,
            mistake_details=mistake_details,
            attempt_number=attempt_number,
            concept_masteries=concept_masteries
        )

        return jsonify({
            'success': result.get('success', False),
            'topic_id': topic_id,
            'content': result.get('content', {}),
            'error': result.get('error')
        })

    except Exception as e:
        print(f"⚠️ Remediation content error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/remediation/questions', methods=['POST'])
def get_remediation_questions():
    """
    Generate targeted remedial questions based on remediation content.
    
    Expects JSON body:
    {
        "topic_id": "3-5",
        "weak_concepts": [{"concept": "if-else", ...}],
        "mistake_details": [{"concept": "...", ...}],
        "remediation_content": {"whatWentWrong": "...", "conceptExplanation": "...", ...},
        "num_questions": 2
    }
    """
    try:
        data = request.json or {}
        topic_id = data.get('topic_id')
        weak_concepts = data.get('weak_concepts', [])
        mistake_details = data.get('mistake_details', [])
        remediation_content = data.get('remediation_content', None)
        num_questions = data.get('num_questions', 2)

        if not topic_id:
            return jsonify({'success': False, 'error': 'topic_id is required'}), 400

        topic_info = _find_topic_info(topic_id) or {"id": topic_id, "title": f"Topic {topic_id}"}

        result = remediation_gen.generate_remedial_questions(
            topic_info=topic_info,
            weak_concepts=weak_concepts,
            mistake_details=mistake_details,
            remediation_content=remediation_content,
            num_questions=num_questions
        )

        return jsonify({
            'success': result.get('success', False),
            'topic_id': topic_id,
            'questions': result.get('questions', []),
            'error': result.get('error')
        })

    except Exception as e:
        print(f"⚠️ Remediation questions error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


def _difficulty_lmh_to_prompt(difficulty: str) -> str:
    d = (difficulty or "M").upper()
    if d == "L":
        return "LOW (L): recall and basic definitions; straightforward wording."
    if d == "H":
        return "HIGH (H): subtle distinctions, edge cases, or combining multiple ideas from the chapters."
    return "MEDIUM (M): typical exam-level understanding; some reasoning required."


def _fallback_instructor_mcqs(chapter_titles, difficulty: str, num_questions: int):
    """Deterministic MCQs when no LLM is available or all providers fail."""
    out = []
    letters = ["A", "B", "C", "D"]
    for i in range(num_questions):
        ch = chapter_titles[i % len(chapter_titles)] if chapter_titles else "Java"
        correct = letters[i % 4]
        out.append({
            "id": f"mcq-fb-{i + 1}",
            "question": f"[{difficulty}] Which best reflects a core idea from \"{ch}\"?",
            "options": {
                "A": "A concept unrelated to this chapter.",
                "B": "A plausible idea aligned with typical Java curriculum for this chapter.",
                "C": "Java bytecode is always executed directly by the physical CPU with no VM.",
                "D": "All Java types are primitives; there are no reference types.",
            },
            "correct": correct,
        })
    return out


def _parse_instructor_mcq_json(response_text, num_questions, _json):
    """Parse LLM output into normalized mcqs list, or None if invalid."""
    if not response_text or not str(response_text).strip():
        return None
    try:
        rt = str(response_text).strip()
        if rt.startswith("```"):
            parts = rt.split("```")
            rt = parts[1] if len(parts) > 1 else rt
            if rt.startswith("json"):
                rt = rt[4:]
        rt = rt.strip()
        parsed = _json.loads(rt)
        mcqs = parsed.get("mcqs") or []
        normalized = []
        for i, q in enumerate(mcqs[:num_questions]):
            opts = q.get("options") or {}
            normalized.append({
                "id": str(q.get("id", i + 1)),
                "question": str(q.get("question", "")),
                "options": {
                    "A": str(opts.get("A", "")),
                    "B": str(opts.get("B", "")),
                    "C": str(opts.get("C", "")),
                    "D": str(opts.get("D", "")),
                },
                "correct": q.get("correct", "A") if q.get("correct") in ("A", "B", "C", "D") else "A",
            })
        return normalized if normalized else None
    except Exception as e:
        print(f"⚠️ Instructor MCQ JSON parse failed: {e}")
        return None


def generate_instructor_mcq_assignment(chapter_ids, difficulty, num_questions):
    """
    RAG + LLM: vector context from CHAPTER_TOPICS, then MCQs via Groq and/or Mistral
    (whichever works — Groq first, then Mistral on failure or bad JSON).
    """
    import json as _json

    chapters_resolved = []
    for cid in chapter_ids:
        try:
            cid = int(cid)
        except (TypeError, ValueError):
            continue
        if cid not in CHAPTER_TOPICS:
            continue
        chapters_resolved.append((cid, CHAPTER_TOPICS[cid]))

    if not chapters_resolved:
        return None, "No valid chapter_ids"

    titles = [c[1]["title"] for c in chapters_resolved]
    all_keywords = []
    topic_lines = []
    for cid, ch in chapters_resolved:
        for t in ch.get("topics", []):
            topic_lines.append(f"- {t.get('id', '')} {t.get('title', '')}: {t.get('description', '')}")
            all_keywords.extend(t.get("keywords", []))
    keywords_str = ", ".join(list(set(all_keywords))[:40])
    combined_query = " ".join(titles) + " " + keywords_str

    raw_docs = get_relevant_context(combined_query, k=8)
    book_context = "\n\n".join(raw_docs) if raw_docs else ""

    diff_prompt = _difficulty_lmh_to_prompt(difficulty)

    if not GROQ_API_KEY and not MISTRAL_API_KEY:
        print("⚠️ No GROQ_API_KEY or MISTRAL_API_KEY — using fallback MCQs for instructor assignment")
        return {
            "mcqs": _fallback_instructor_mcqs(titles, difficulty, num_questions),
            "meta": {"source": "fallback-local", "retrieved_chars": len(book_context)},
        }, None

    from langchain_core.prompts import ChatPromptTemplate

    prompt_template = """You are an expert Java instructor. Create EXACTLY {num_questions} multiple-choice questions.

CHAPTERS (student curriculum): {chapter_titles}
DIFFICULTY: {diff_prompt}

TOPIC OUTLINE:
{topic_outline}

RELEVANT BOOK EXCERPTS (RAG context — stay faithful to these ideas):
{book_context}

RULES:
- ONLY multiple choice: exactly 4 options labeled A, B, C, D.
- One correct letter per question: "correct" must be "A", "B", "C", or "D".
- Questions must be appropriate for the listed chapters only.
- Return ONLY valid JSON (no markdown), shape:
{{"mcqs":[{{"id":"1","question":"...","options":{{"A":"...","B":"...","C":"...","D":"..."}},"correct":"A"}}]}}
"""

    prompt = ChatPromptTemplate.from_template(prompt_template)
    invoke_args = {
        "num_questions": num_questions,
        "chapter_titles": ", ".join(titles),
        "diff_prompt": diff_prompt,
        "topic_outline": "\n".join(topic_lines[:80]),
        "book_context": book_context[:6000],
    }

    providers_tried = []

    if GROQ_API_KEY:
        try:
            from langchain_groq import ChatGroq
            groq_model = ChatGroq(
                model="llama-3.3-70b-versatile",
                groq_api_key=GROQ_API_KEY,
                temperature=0.25,
                max_tokens=8192,
            )
            result = (prompt | groq_model).invoke(invoke_args)
            text = (result.content or "").strip()
            providers_tried.append("groq")
            normalized = _parse_instructor_mcq_json(text, num_questions, _json)
            if normalized:
                return {
                    "mcqs": normalized,
                    "meta": {"source": "groq-rag", "retrieved_chars": len(book_context), "providers": providers_tried},
                }, None
            print("⚠️ Groq returned empty or unparseable MCQ JSON; trying Mistral if configured")
        except Exception as e:
            print(f"⚠️ Groq instructor MCQ failed: {e}")
            providers_tried.append("groq:error")

    if MISTRAL_API_KEY:
        try:
            from langchain_mistralai import ChatMistralAI
            mistral_model = ChatMistralAI(
                model="mistral-small-latest",
                mistral_api_key=MISTRAL_API_KEY,
                temperature=0.2,
                max_tokens=8192,
            )
            result = (prompt | mistral_model).invoke(invoke_args)
            text = (result.content or "").strip()
            providers_tried.append("mistral")
            normalized = _parse_instructor_mcq_json(text, num_questions, _json)
            if normalized:
                return {
                    "mcqs": normalized,
                    "meta": {"source": "mistral-rag", "retrieved_chars": len(book_context), "providers": providers_tried},
                }, None
            print("⚠️ Mistral returned empty or unparseable MCQ JSON")
        except Exception as e:
            print(f"⚠️ Mistral instructor MCQ failed: {e}")
            providers_tried.append("mistral:error")

    return {
        "mcqs": _fallback_instructor_mcqs(titles, difficulty, num_questions),
        "meta": {
            "source": "fallback-local",
            "retrieved_chars": len(book_context),
            "providers": providers_tried,
        },
    }, None


def _parse_coding_assignment_json(response_text, num_tasks, _json):
    try:
        text = str(response_text or "").strip()
        if text.startswith("```"):
            parts = text.split("```")
            text = parts[1] if len(parts) > 1 else text
            if text.startswith("json"):
                text = text[4:]
        parsed = _json.loads(text.strip())
        tasks = parsed.get("codingTasks") or parsed.get("tasks") or []
        normalized = []
        for i, task in enumerate(tasks[:num_tasks]):
            normalized.append(_normalize_coding_task(task, i + 1))
        return normalized if normalized else None
    except Exception as e:
        print(f"⚠️ Coding assignment JSON parse failed: {e}")
        return None


def _fallback_coding_tasks(topics, difficulty, num_tasks):
    diff_label = {"L": "easy", "M": "medium", "H": "hard"}.get(difficulty, "medium")
    topic_str = ", ".join(topics[:3]) if topics else "Java programming"
    tasks = []
    for i in range(num_tasks):
        idx = i + 1
        tasks.append({
            "id": str(idx),
            "problemStatement": f"[{diff_label}] Task {idx}: Solve a Java problem related to {topic_str}.",
            "inputFormat": "Read input from standard input (stdin) exactly as specified in the problem.",
            "outputFormat": "Print only the required result to standard output (stdout).",
            "sampleTestCases": [{"input": "5\n", "output": "5"}],
            "hiddenTestCases": [{"input": "10\n", "output": "10"}],
            "expectedConcepts": ["input parsing", "control flow", "problem solving"],
        })
    return tasks


def generate_instructor_coding_assignment(num_tasks, difficulty, topics, instructions):
    import json as _json
    num_tasks = max(1, min(10, int(num_tasks or 3)))
    difficulty = (difficulty or "M").upper()
    if difficulty not in ("L", "M", "H"):
        difficulty = "M"
    topics = [str(t).strip() for t in (topics or []) if str(t).strip()]

    combined_query = " ".join(topics) if topics else "java coding tasks"
    raw_docs = get_relevant_context(combined_query, k=8)
    book_context = "\n\n".join(raw_docs) if raw_docs else ""
    diff_prompt = _difficulty_lmh_to_prompt(difficulty)
    instructions = str(instructions or "").strip()

    if not GROQ_API_KEY and not MISTRAL_API_KEY:
        return None, "No AI provider configured for coding assignment generation"

    from langchain_core.prompts import ChatPromptTemplate
    prompt_template = """You are an expert Java instructor. Create EXACTLY {num_tasks} coding tasks.

TOPICS: {topics}
DIFFICULTY: {difficulty_prompt}
ADDITIONAL INSTRUCTIONS: {instructions}

RELEVANT BOOK EXCERPTS (RAG context):
{book_context}

⚠️ CRITICAL RULES - MUST FOLLOW EXACTLY - NO EXCEPTIONS:

1. Each task must include: question, constraints, problemStatement, inputFormat, outputFormat, referenceSolution, sampleTestCases, hiddenTestCases, expectedConcepts.

2. THE REFERENCE SOLUTION:
   - MUST be valid, deterministic Java code
   - MUST ONLY read input and produce output (nothing else)
   - MUST NOT have ANY prompts, print statements before reading input, or user messages
   - MUST NOT have: System.out.println("Enter..."), System.out.println("Please..."), or any prompts
   - Example WRONG: System.out.println("Enter amount: "); int x = sc.nextInt();
   - Example RIGHT: int x = sc.nextInt(); System.out.println(result);
   - NO println() calls except for the final result output
   - Input via Scanner, Output via println (results only)

3. Test Cases:
   - For each test case, determine ONLY the console output (not prompts)
   - Example: If reference reads 11.56, output should be "numberOfOneDollars: 11..." NOT "Enter amount: numberOfOneDollars: 11..."
   - Test ONLY the computed results, never include prompt text

4. NEVER include in referenceSolution:
   - System.currentTimeMillis(), Random, Math.random(), System.nanoTime()
   - Any println() that prints a prompt/message (only print results)
   - Any System.out.println() before reading input
   - Non-deterministic operations

5. Pure functions only: input → computation → output (same input = same output)

6. Each task: AT LEAST 2 sample test cases + 5 hidden test cases (7+ total)

7. Include edge cases: 0, empty input, negative numbers, maximum constraint values

8. VERIFY BEFORE FINALIZING:
   - [ ] Reference solution has NO prompt println() statements
   - [ ] Reference solution ONLY outputs results
   - [ ] I traced through EACH test case and confirmed output matches
   - [ ] Test outputs do NOT include prompts, only computed results
   - [ ] No dynamic/random functions used

Return ONLY valid JSON (no markdown), exactly in this shape:
{{
  "codingTasks": [
    {{
      "id": "1",
      "question": "...",
      "constraints": ["..."],
      "problemStatement": "...",
      "inputFormat": "...",
      "outputFormat": "...",
      "referenceSolution": "public class Main {{ ... }}",
      "sampleTestCases": [{{"input":"...", "output":"..."}}],
      "hiddenTestCases": [{{"input":"...", "output":"..."}}],
      "expectedConcepts": ["...", "..."]
    }}
  ]
}}
"""
    prompt = ChatPromptTemplate.from_template(prompt_template)
    invoke_args = {
        "num_tasks": num_tasks,
        "topics": ", ".join(topics) if topics else "Core Java",
        "difficulty_prompt": diff_prompt,
        "instructions": instructions or "None",
        "book_context": book_context[:7000],
    }
    providers = []
    last_error = None

    for attempt in range(3):
        if GROQ_API_KEY:
            try:
                from langchain_groq import ChatGroq
                model = ChatGroq(
                    model="llama-3.3-70b-versatile",
                    groq_api_key=GROQ_API_KEY,
                    temperature=0.25,
                    max_tokens=8192,
                )
                result = (prompt | model).invoke(invoke_args)
                parsed = _parse_coding_assignment_json(result.content, num_tasks, _json)
                providers.append("groq")
                if parsed:
                    # Development mode: skip validation if requested
                    if os.getenv("SKIP_ASSIGNMENT_VALIDATION") == "true":
                        print(f"⚠️ DEVELOPMENT MODE: Skipping validation (SKIP_ASSIGNMENT_VALIDATION=true)")
                        return {
                            "codingTasks": parsed,
                            "meta": {"source": "groq-rag", "providers": providers, "attempts": attempt + 1, "validationSkipped": True},
                        }, None
                    
                    validation = validate_generated_coding_tasks(parsed)
                    if validation["valid"]:
                        return {
                            "codingTasks": validation["tasks"],
                            "meta": {"source": "groq-rag", "providers": providers, "attempts": attempt + 1},
                        }, None
                    last_error = validation.get("error")
            except Exception as e:
                print(f"⚠️ Groq coding assignment failed: {e}")
                providers.append("groq:error")
                last_error = str(e)

        if MISTRAL_API_KEY:
            try:
                from langchain_mistralai import ChatMistralAI
                model = ChatMistralAI(
                    model="mistral-small-latest",
                    mistral_api_key=MISTRAL_API_KEY,
                    temperature=0.2,
                    max_tokens=8192,
                )
                result = (prompt | model).invoke(invoke_args)
                parsed = _parse_coding_assignment_json(result.content, num_tasks, _json)
                providers.append("mistral")
                if parsed:
                    # Development mode: skip validation if requested
                    if os.getenv("SKIP_ASSIGNMENT_VALIDATION") == "true":
                        print(f"⚠️ DEVELOPMENT MODE: Skipping validation (SKIP_ASSIGNMENT_VALIDATION=true)")
                        return {
                            "codingTasks": parsed,
                            "meta": {"source": "mistral-rag", "providers": providers, "attempts": attempt + 1, "validationSkipped": True},
                        }, None
                    
                    validation = validate_generated_coding_tasks(parsed)
                    if validation["valid"]:
                        return {
                            "codingTasks": validation["tasks"],
                            "meta": {"source": "mistral-rag", "providers": providers, "attempts": attempt + 1},
                        }, None
                    last_error = validation.get("error")
            except Exception as e:
                print(f"⚠️ Mistral coding assignment failed: {e}")
                providers.append("mistral:error")
                last_error = str(e)

    return None, last_error or "Failed to generate validated coding assignment"


@app.route('/api/generate-mcq-assignment', methods=['POST'])
def generate_mcq_assignment():
    """
    Instructor workflow: MCQs only, backed by RAG (vector store) + Groq and/or Mistral.

    JSON body:
      chapter_ids: list[int]  — ids from GET /api/chapters (same as CHAPTER_TOPICS keys)
      difficulty: "L" | "M" | "H"
      num_questions: int (1–50)
    """
    try:
        data = request.json or {}
        chapter_ids = data.get("chapter_ids") or data.get("chapters")
        difficulty = (data.get("difficulty") or "M").upper()
        if difficulty not in ("L", "M", "H"):
            difficulty = "M"
        num_questions = int(data.get("num_questions") or data.get("num") or 5)
        num_questions = max(1, min(50, num_questions))

        if not chapter_ids or not isinstance(chapter_ids, list):
            return jsonify({"success": False, "error": "chapter_ids must be a non-empty list"}), 400

        payload, err = generate_instructor_mcq_assignment(chapter_ids, difficulty, num_questions)
        if err:
            return jsonify({"success": False, "error": err}), 400

        titles = []
        for cid in chapter_ids:
            try:
                cid = int(cid)
            except (TypeError, ValueError):
                continue
            if cid in CHAPTER_TOPICS:
                titles.append(CHAPTER_TOPICS[cid]["title"])

        return jsonify({
            "success": True,
            "chapter_titles": titles,
            "difficulty": difficulty,
            "num_questions": num_questions,
            "mcqs": payload["mcqs"],
            "meta": payload.get("meta", {}),
        })
    except Exception as e:
        print(f"❌ generate_mcq_assignment: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/generate-coding-assignment', methods=['POST'])
def generate_coding_assignment():
    try:
        data = request.json or {}
        num_tasks = int(data.get("num_tasks") or data.get("num") or 3)
        difficulty = (data.get("difficulty") or "M").upper()
        topics = data.get("topics") or []
        instructions = data.get("instructions") or ""

        if not isinstance(topics, list):
            return jsonify({"success": False, "error": "topics must be an array"}), 400

        payload, err = generate_instructor_coding_assignment(num_tasks, difficulty, topics, instructions)
        if err:
            return jsonify({"success": False, "error": err}), 400

        return jsonify({
            "success": True,
            "difficulty": difficulty if difficulty in ("L", "M", "H") else "M",
            "num_tasks": max(1, min(10, num_tasks)),
            "topics": topics,
            "codingTasks": payload.get("codingTasks", []),
            "meta": payload.get("meta", {}),
        })
    except Exception as e:
        print(f"❌ generate_coding_assignment: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/generate-test-cases', methods=['POST'])
def generate_test_cases():
    try:
        data = request.json or {}
        problem_statement = str(data.get("problemStatement") or data.get("question") or "").strip()
        constraints = data.get("constraints") or []
        input_format = str(data.get("inputFormat") or "").strip()
        output_format = str(data.get("outputFormat") or "").strip()
        expected_concepts = data.get("expectedConcepts") or []
        difficulty = (data.get("difficulty") or "M").upper()

        if not problem_statement:
            return jsonify({"success": False, "error": "problemStatement is required"}), 400
        if not GROQ_API_KEY and not MISTRAL_API_KEY:
            return jsonify({"success": False, "error": "No AI provider configured for test case generation"}), 400

        from langchain_core.prompts import ChatPromptTemplate

        prompt_template = """You are an expert Java instructor. Create EXACTLY ONE coding task for the given problem statement.

PROBLEM STATEMENT:
{problem_statement}

CONSTRAINTS:
{constraints}

INPUT FORMAT:
{input_format}

OUTPUT FORMAT:
{output_format}

EXPECTED CONCEPTS:
{expected_concepts}

DIFFICULTY: {difficulty_prompt}

⚠️ CRITICAL RULES - MUST FOLLOW EXACTLY - NO EXCEPTIONS:

1. Return ONLY valid JSON (no markdown).
2. Include: question, constraints, problemStatement, inputFormat, outputFormat, referenceSolution, sampleTestCases, hiddenTestCases, expectedConcepts.

3. THE REFERENCE SOLUTION:
   - MUST be valid, deterministic Java code
   - MUST NOT include ANY prompts or user messages
   - NO System.out.println("Enter..."), NO System.out.println("Please...")
   - ONLY output the computed results
   - Read input using Scanner, output ONLY results
   - Example WRONG: System.out.println("Enter number: "); int x = sc.nextInt(); System.out.println(x);
   - Example RIGHT: int x = sc.nextInt(); System.out.println(x);

4. FOR EACH TEST CASE:
   - Determine what the reference solution OUTPUTS (not what prompts it shows)
   - If solution reads "11.56" and computes "numberOfOneDollars: 11", the output is ONLY "numberOfOneDollars: 11"
   - Do NOT include "Enter amount: " in the output - that's a prompt, not output
   - Test cases must match ONLY the computed result, never include prompts

5. NEVER use:
   - System.currentTimeMillis(), Random, Math.random(), System.nanoTime()
   - Any println() for prompts (only print results)
   - Any System.out.println() before reading input

6. Pure functions: input → computation → output (deterministic)

7. Provide AT LEAST 2 sample test cases and 5 hidden test cases (minimum 7 total).

8. Include edge cases: 0, empty input, negative numbers, maximum constraint values.

9. VERIFICATION BEFORE GENERATING JSON:
   - [ ] Reference solution has NO prompt println() statements
   - [ ] Reference solution ONLY outputs computed results
   - [ ] I traced EACH test case input through reference solution
   - [ ] Test case "output" field ONLY contains the computed result (no prompts)
   - [ ] Output matches what reference solution would print (without prompts)

JSON format:
{{
  "codingTasks": [
    {{
      "id": "1",
      "question": "...",
      "constraints": ["..."],
      "problemStatement": "...",
      "inputFormat": "...",
      "outputFormat": "...",
      "referenceSolution": "public class Main {{ ... }}",
      "sampleTestCases": [{{"input":"...", "output":"..."}}],
      "hiddenTestCases": [{{"input":"...", "output":"..."}}],
      "expectedConcepts": ["...", "..."]
    }}
  ]
}}
"""
        prompt = ChatPromptTemplate.from_template(prompt_template)
        invoke_args = {
            "problem_statement": problem_statement,
            "constraints": ", ".join([str(item) for item in constraints]) if isinstance(constraints, list) else str(constraints),
            "input_format": input_format or "Not provided",
            "output_format": output_format or "Not provided",
            "expected_concepts": ", ".join([str(item) for item in expected_concepts]) if isinstance(expected_concepts, list) else str(expected_concepts),
            "difficulty_prompt": _difficulty_lmh_to_prompt(difficulty if difficulty in ("L", "M", "H") else "M"),
        }

        last_error = None
        for attempt in range(3):
            for provider_name, model_factory in (
                ("groq", lambda: __import__("langchain_groq", fromlist=["ChatGroq"]).ChatGroq(
                    model="llama-3.3-70b-versatile",
                    groq_api_key=GROQ_API_KEY,
                    temperature=0.25,
                    max_tokens=8192,
                )),
                ("mistral", lambda: __import__("langchain_mistralai", fromlist=["ChatMistralAI"]).ChatMistralAI(
                    model="mistral-small-latest",
                    mistral_api_key=MISTRAL_API_KEY,
                    temperature=0.2,
                    max_tokens=8192,
                )),
            ):
                if provider_name == "groq" and not GROQ_API_KEY:
                    continue
                if provider_name == "mistral" and not MISTRAL_API_KEY:
                    continue

                try:
                    result = (prompt | model_factory()).invoke(invoke_args)
                    parsed = _parse_coding_assignment_json(result.content, 1, json)
                    if parsed:
                        validation = validate_generated_coding_tasks(parsed, min_sample_cases=2, min_hidden_cases=5)
                        if validation["valid"]:
                            return jsonify({
                                "success": True,
                                "data": validation["tasks"][0],
                                "meta": {"source": f"{provider_name}-rag", "attempts": attempt + 1},
                            })
                        last_error = validation.get("error")
                except Exception as error:
                    last_error = str(error)
                    print(f"⚠️ generate_test_cases {provider_name} failed: {error}")

        return jsonify({"success": False, "error": last_error or "Failed to generate validated test cases"}), 400
    except Exception as e:
        print(f"❌ generate_test_cases: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/analyze-code-assignment', methods=['POST'])
def analyze_code_assignment():
    """Lightweight AI rubric for coding assignment submissions."""
    try:
        data = request.json or {}
        code_snippet = str(data.get("codeSnippet") or "")
        problem = str(data.get("problemStatement") or "")
        expected_concepts = data.get("expectedConcepts") or []

        if not code_snippet.strip():
            return jsonify({"success": False, "error": "codeSnippet is required"}), 400

        if not GROQ_API_KEY and not MISTRAL_API_KEY:
            return jsonify({
                "success": True,
                "analysis": {
                    "logic": "LLM unavailable; verify logic via test-case pass rate.",
                    "quality": "LLM unavailable; fallback analysis only.",
                    "structure": "LLM unavailable; fallback analysis only.",
                    "score": 0,
                },
            })

        from langchain_core.prompts import ChatPromptTemplate
        import json as _json

        prompt = ChatPromptTemplate.from_template(
            """Evaluate this Java solution and return ONLY valid JSON:
{{"logic":"...","quality":"...","structure":"...","score":0-10}}

Problem:
{problem}

Expected concepts:
{concepts}

Code:
{code}
"""
        )
        invoke_args = {
            "problem": problem[:2500],
            "concepts": ", ".join([str(c) for c in expected_concepts][:20]),
            "code": code_snippet[:9000],
        }

        content = None
        if GROQ_API_KEY:
            from langchain_groq import ChatGroq
            model = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=GROQ_API_KEY, temperature=0.2, max_tokens=1024)
            content = (prompt | model).invoke(invoke_args).content
        elif MISTRAL_API_KEY:
            from langchain_mistralai import ChatMistralAI
            model = ChatMistralAI(model="mistral-small-latest", mistral_api_key=MISTRAL_API_KEY, temperature=0.2, max_tokens=1024)
            content = (prompt | model).invoke(invoke_args).content

        text = str(content or "").strip()
        if text.startswith("```"):
            parts = text.split("```")
            text = parts[1] if len(parts) > 1 else text
            if text.startswith("json"):
                text = text[4:]
        parsed = _json.loads(text.strip())

        return jsonify({
            "success": True,
            "analysis": {
                "logic": str(parsed.get("logic", "")),
                "quality": str(parsed.get("quality", "")),
                "structure": str(parsed.get("structure", "")),
                "score": max(0, min(10, int(parsed.get("score", 0)))),
            },
        })
    except Exception as e:
        print(f"❌ analyze_code_assignment: {e}")
        return jsonify({
            "success": True,
            "analysis": {
                "logic": "Automatic AI analysis failed.",
                "quality": "Automatic AI analysis failed.",
                "structure": "Automatic AI analysis failed.",
                "score": 0,
            },
        })


def _is_course_java_query(user_text: str) -> bool:
    text = (user_text or "").strip().lower()
    if not text:
        return False

    java_keywords = [
        "java", "jdk", "jvm", "compiler", "javac", "class", "method",
        "oop", "inheritance", "polymorphism", "encapsulation", "array",
        "loop", "while", "for", "if", "switch", "exception", "runtime",
        "syntax", "string", "scanner", "algorithm", "code", "coding",
        "program", "programming", "chapter", "topic", "assignment", "quiz"
    ]
    
    general_learning_keywords = [
        "concise", "short", "detail", "explain", "clarify", "example",
        "simplify", "summarize", "summary", "understand", "meaning",
        "response", "answer", "question", "error", "bug", "fix", "issue",
        "help", "yes", "no", "thanks", "thank you", "ok", "okay",
        "what", "how", "why", "show", "give", "more", "less", "make it"
    ]

    off_topic_signals = [
        "recipe", "cook", "cooking", "diet", "travel", "movie", "song",
        "politics", "crypto price", "stock", "football", "cricket score"
    ]

    if any(signal in text for signal in off_topic_signals) and not any(k in text for k in java_keywords):
        return False

    if any(k in text for k in java_keywords) or any(k in text for k in general_learning_keywords):
        return True

    # Allow short follow-up messages up to 5 words
    if len(text.split()) <= 5:
        return True

    return False


@app.route('/api/assistant/chat', methods=['POST'])
def assistant_chat():
    """
    Virtual Java learning assistant endpoint.
    Uses LLM semantics to allow valid Java queries and conversation history.
    """
    try:
        data = request.json or {}
        user_message = (data.get("message") or "").strip()
        chapter_id = data.get("chapter_id")
        history = data.get("history") or []

        if not user_message:
            return jsonify({"success": False, "error": "message is required"}), 400

        chapter_hint = ""
        try:
            if chapter_id is not None:
                cid = int(chapter_id)
                if cid in CHAPTER_TOPICS:
                    chapter_hint = CHAPTER_TOPICS[cid]["title"]
        except Exception:
            chapter_hint = ""

        retrieval_query = f"Java programming {chapter_hint} {user_message}".strip()
        relevant_content = get_relevant_context(retrieval_query, k=4)
        book_context = "\n\n".join(relevant_content) if relevant_content else ""

        if not MISTRAL_API_KEY:
            return jsonify({
                "success": True,
                "off_topic": False,
                "response": (
                    "Java assistant is temporarily unavailable because the model key is not configured. "
                    "Please try again later."
                )
            })

        system_prompt = (
            "You are a helpful and conversational Java Learning AI Assistant for a course platform. "
            "Rules:\n"
            "1. Answer Java, programming, and course-related queries, even broader discussions like 'Why Java is better' or comparisons.\n"
            "2. Accept follow-up queries and conversational adjustments (e.g., 'make it concise', 'explain again', 'why?').\n"
            "3. Reject ONLY clearly irrelevant, non-programming queries (e.g., sports, politics, cooking). If completely off-topic, reply politely: "
            "'I can help with Java and programming topics. Could you clarify your question?'\n"
            "4. Use clear Markdown formatting: bullet points, short paragraphs, and properly fenced code blocks. Do not dump raw text.\n"
            "5. Use provided book context when relevant; do not fabricate chapter facts."
        )

        user_prompt = f"""
Student question:
{user_message}

Chapter hint:
{chapter_hint or 'N/A'}

Book context:
{book_context[:5000] if book_context else 'No retrieved context available.'}
"""

        response_text = ""

        # Prefer langchain mistral client (already used elsewhere in this project).
        try:
            from langchain_mistralai import ChatMistralAI
            from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

            model = ChatMistralAI(
                model="mistral-small-latest",
                mistral_api_key=MISTRAL_API_KEY,
                temperature=0.2,
                max_tokens=1200
            )
            
            messages_for_llm = [SystemMessage(content=system_prompt)]
            
            # Add conversation history
            for msg in history:
                role = msg.get("role")
                text = msg.get("text") or ""
                if role == "user":
                    messages_for_llm.append(HumanMessage(content=text))
                elif role == "assistant":
                    messages_for_llm.append(AIMessage(content=text))
                    
            messages_for_llm.append(HumanMessage(content=user_prompt))

            result = model.invoke(messages_for_llm)
            response_text = (result.content or "").strip()
            
        except Exception as lc_err:
            print(f"⚠️ assistant_chat langchain mistral failed: {lc_err}")
            try:
                from mistralai import Mistral

                client = Mistral(api_key=MISTRAL_API_KEY)
                
                messages_for_sdk = [{"role": "system", "content": system_prompt}]
                for msg in history:
                    role = msg.get("role")
                    if role in ["user", "assistant"]:
                        messages_for_sdk.append({"role": role, "content": msg.get("text") or ""})
                        
                messages_for_sdk.append({"role": "user", "content": user_prompt})
                
                chat_response = client.chat.complete(
                    model="mistral-large-latest",
                    messages=messages_for_sdk,
                    temperature=0.2
                )
                response_text = (chat_response.choices[0].message.content or "").strip()
            except Exception as sdk_err:
                print(f"⚠️ assistant_chat mistral sdk failed: {sdk_err}")
                # Final graceful fallback to avoid 500s in UI.
                if book_context:
                    response_text = (
                        "I am your Java Learning AI Assistant. Model service is temporarily unavailable, "
                        "but here is guidance from your course context:\n\n"
                        f"{book_context[:700]}"
                    )
                else:
                    response_text = (
                        "I am your Java Learning AI Assistant. Model service is temporarily unavailable. "
                        "Please ask again shortly."
                    )

        if not response_text:
            response_text = "I can help with Java and course topics. Ask me a Java-related question."

        return jsonify({
            "success": True,
            "off_topic": False,
            "response": response_text
        })

    except Exception as e:
        print(f"❌ assistant_chat error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Starting RAG Learning API")
    print(f"📚 Loaded {len(CHAPTER_TOPICS)} chapters")
    print(f"📖 Total topics: {sum(len(c['topics']) for c in CHAPTER_TOPICS.values())}")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5001, debug=True)
