"""
Flask API for RAG-based Learning Content
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import re

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from vector import get_relevant_context, load_existing_vector_store
from question_generator import QuestionGenerator
from config import GROQ_API_KEY, MISTRAL_API_KEY

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# Initialize question generator
question_gen = QuestionGenerator()

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
                "query": "Introduction to computers programs and Java chapter overview objectives"
            },
            {
                "id": "1-2", 
                "title": "What is a Computer?",
                "description": "Understanding computer hardware and components",
                "keywords": ["computer", "hardware", "CPU", "memory", "storage", "devices", "components"],
                "query": "What is a computer hardware CPU memory storage input output devices components"
            },
            {
                "id": "1-3",
                "title": "Programming Languages",
                "description": "Machine language, assembly language, and high-level languages",
                "keywords": ["programming language", "machine language", "assembly", "high-level", "compiler", "interpreter"],
                "query": "Programming languages machine language assembly language high-level languages compiler interpreter"
            },
            {
                "id": "1-4",
                "title": "Operating Systems",
                "description": "Role of operating systems in managing computer resources",
                "keywords": ["operating system", "OS", "Windows", "Linux", "Mac", "manage", "resources"],
                "query": "Operating systems manage hardware software resources Windows Linux Mac"
            },
            {
                "id": "1-5",
                "title": "Java, the World Wide Web, and Beyond",
                "description": "History of Java and its role in modern computing",
                "keywords": ["Java", "history", "Sun Microsystems", "James Gosling", "web", "internet", "applet"],
                "query": "Java history World Wide Web Sun Microsystems James Gosling internet programming"
            },
            {
                "id": "1-6",
                "title": "The Java Language Specification, API, JDK, and IDE",
                "description": "Java tools and development environment",
                "keywords": ["JDK", "API", "IDE", "specification", "Java SE", "development", "tools"],
                "query": "Java JDK API IDE specification development kit environment tools Eclipse NetBeans"
            },
            {
                "id": "1-7",
                "title": "A Simple Java Program",
                "description": "Writing and understanding your first Java program",
                "keywords": ["program", "Hello World", "main", "class", "public", "static", "void", "System.out"],
                "query": "Simple Java program Hello World main method class public static void println"
            },
            {
                "id": "1-8",
                "title": "Creating, Compiling, and Executing a Java Program",
                "description": "Steps to write, compile, and run Java programs",
                "keywords": ["compile", "execute", "run", "javac", "java", "bytecode", "JVM"],
                "query": "Create compile execute Java program javac bytecode JVM virtual machine"
            },
            {
                "id": "1-9",
                "title": "Programming Style and Documentation",
                "description": "Best practices for writing clean and documented code",
                "keywords": ["style", "documentation", "comments", "naming", "conventions", "readable"],
                "query": "Java programming style documentation comments naming conventions readable code"
            },
            {
                "id": "1-10",
                "title": "Programming Errors",
                "description": "Types of errors: syntax, runtime, and logic errors",
                "keywords": ["error", "syntax", "runtime", "logic", "bug", "debug", "exception"],
                "query": "Programming errors syntax errors runtime errors logic errors debugging"
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
                "query": "Elementary programming introduction basics fundamentals Java"
            },
            {
                "id": "2-2",
                "title": "Writing a Simple Program",
                "description": "Creating basic Java programs step by step",
                "keywords": ["simple", "program", "basic", "write", "create"],
                "query": "Writing simple Java program step by step basic compute area"
            },
            {
                "id": "2-3",
                "title": "Reading Input from the Console",
                "description": "Using Scanner class to read user input",
                "keywords": ["input", "Scanner", "console", "read", "keyboard", "nextInt", "nextDouble"],
                "query": "Java Scanner class read input console keyboard nextInt nextDouble nextLine"
            },
            {
                "id": "2-4",
                "title": "Identifiers",
                "description": "Rules for naming variables, methods, and classes",
                "keywords": ["identifier", "name", "variable", "naming", "rules", "convention"],
                "query": "Java identifiers naming rules variables methods classes conventions"
            },
            {
                "id": "2-5",
                "title": "Variables",
                "description": "Declaring and using variables to store data",
                "keywords": ["variable", "declare", "assign", "store", "data", "value"],
                "query": "Java variables declare assign store data values declaration"
            },
            {
                "id": "2-6",
                "title": "Assignment Statements and Assignment Expressions",
                "description": "Assigning values to variables",
                "keywords": ["assignment", "statement", "expression", "equals", "="],
                "query": "Java assignment statements expressions assign values variables equals"
            },
            {
                "id": "2-7",
                "title": "Named Constants",
                "description": "Using final keyword for constants",
                "keywords": ["constant", "final", "named", "unchanging", "PI"],
                "query": "Java named constants final keyword unchanging values PI"
            },
            {
                "id": "2-8",
                "title": "Naming Conventions",
                "description": "Standard conventions for naming in Java",
                "keywords": ["naming", "convention", "camelCase", "standard", "style"],
                "query": "Java naming conventions camelCase style standards variables classes methods"
            },
            {
                "id": "2-9",
                "title": "Numeric Data Types and Operations",
                "description": "Working with int, double, and other numeric types",
                "keywords": ["numeric", "int", "double", "float", "long", "byte", "short", "arithmetic"],
                "query": "Java numeric data types int double float long byte short arithmetic operations"
            },
            {
                "id": "2-10",
                "title": "Numeric Literals",
                "description": "How to write numeric values in code",
                "keywords": ["literal", "number", "integer", "decimal", "scientific"],
                "query": "Java numeric literals integer decimal floating-point scientific notation"
            },
            {
                "id": "2-11",
                "title": "Evaluating Expressions and Operator Precedence",
                "description": "Order of operations in expressions",
                "keywords": ["expression", "precedence", "order", "operations", "evaluate"],
                "query": "Java expression evaluation operator precedence order of operations arithmetic"
            },
            {
                "id": "2-12",
                "title": "Augmented Assignment Operators",
                "description": "Shorthand operators like +=, -=, *=",
                "keywords": ["augmented", "+=", "-=", "*=", "/=", "shorthand"],
                "query": "Java augmented assignment operators += -= *= /= shorthand compound"
            },
            {
                "id": "2-13",
                "title": "Increment and Decrement Operators",
                "description": "Using ++ and -- operators",
                "keywords": ["increment", "decrement", "++", "--", "prefix", "postfix"],
                "query": "Java increment decrement operators ++ -- prefix postfix"
            },
            {
                "id": "2-14",
                "title": "Type Casting",
                "description": "Converting between data types",
                "keywords": ["casting", "convert", "type", "implicit", "explicit"],
                "query": "Java type casting convert data types implicit explicit widening narrowing"
            },
            {
                "id": "2-15",
                "title": "Software Development Process",
                "description": "Steps in developing software programs",
                "keywords": ["development", "process", "requirements", "design", "implement", "test"],
                "query": "Software development process requirements analysis design implementation testing"
            },
            {
                "id": "2-16",
                "title": "Common Errors in Elementary Programming",
                "description": "Common mistakes in elementary programming",
                "keywords": ["errors", "mistakes", "common", "avoid", "pitfalls"],
                "query": "Common Java programming errors mistakes beginners avoid elementary"
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
                "query": "Java selections introduction decision making control flow statements"
            },
            {
                "id": "3-2",
                "title": "boolean Data Type",
                "description": "Understanding true/false values",
                "keywords": ["boolean", "true", "false", "logical"],
                "query": "Java boolean data type true false logical values comparison"
            },
            {
                "id": "3-3",
                "title": "if Statements",
                "description": "Making decisions with if statements",
                "keywords": ["if", "condition", "statement", "decision"],
                "query": "Java if statement condition decision making one-way selection"
            },
            {
                "id": "3-4",
                "title": "Two-Way if-else Statements",
                "description": "Choosing between two alternatives",
                "keywords": ["if", "else", "two-way", "alternative"],
                "query": "Java if else statement two-way selection alternative paths"
            },
            {
                "id": "3-5",
                "title": "Nested if and Multi-Way if-else Statements",
                "description": "Complex decision making with nested conditions",
                "keywords": ["nested", "if", "else if", "multi-way"],
                "query": "Java nested if else if multi-way selection statements complex conditions"
            },
            {
                "id": "3-6",
                "title": "Common Errors in Selection Statements",
                "description": "Avoiding mistakes with if statements",
                "keywords": ["errors", "mistakes", "common", "if", "selection"],
                "query": "Common errors mistakes Java if else selection statements dangling else"
            },
            {
                "id": "3-7",
                "title": "Generating Random Numbers",
                "description": "Using Math.random() for random values",
                "keywords": ["random", "Math.random", "generate", "number"],
                "query": "Java generate random numbers Math.random Random class"
            },
            {
                "id": "3-8",
                "title": "Logical Operators",
                "description": "Using AND, OR, and NOT operators",
                "keywords": ["logical", "AND", "OR", "NOT", "&&", "||", "!"],
                "query": "Java logical operators AND OR NOT && || ! boolean expressions"
            },
            {
                "id": "3-9",
                "title": "switch Statements",
                "description": "Multi-way branching with switch",
                "keywords": ["switch", "case", "break", "default", "branch"],
                "query": "Java switch statement case break default multi-way branching"
            },
            {
                "id": "3-10",
                "title": "Conditional Expressions",
                "description": "Ternary operator for compact conditions",
                "keywords": ["conditional", "ternary", "?:", "expression"],
                "query": "Java conditional expression ternary operator ?: shorthand if else"
            },
            {
                "id": "3-11",
                "title": "Operator Precedence and Associativity",
                "description": "Order of evaluation for operators",
                "keywords": ["precedence", "associativity", "order", "evaluate"],
                "query": "Java operator precedence associativity evaluation order rules"
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
                "query": "Java mathematical functions characters strings introduction overview"
            },
            {
                "id": "4-2",
                "title": "Common Mathematical Functions",
                "description": "Using Math class methods",
                "keywords": ["Math", "abs", "sqrt", "pow", "max", "min", "round"],
                "query": "Java Math class functions abs sqrt pow max min round ceil floor log exp"
            },
            {
                "id": "4-3",
                "title": "Character Data Type and Operations",
                "description": "Working with char type",
                "keywords": ["char", "character", "ASCII", "Unicode"],
                "query": "Java char character data type ASCII Unicode encoding operations"
            },
            {
                "id": "4-4",
                "title": "The String Type",
                "description": "Creating and using String objects",
                "keywords": ["String", "text", "create", "object", "immutable"],
                "query": "Java String type create text objects immutable methods length charAt"
            },
            {
                "id": "4-5",
                "title": "Formatting Console Output",
                "description": "Using printf for formatted output",
                "keywords": ["printf", "format", "output", "console", "%d", "%f", "%s"],
                "query": "Java printf format console output %d %f %s formatting specifiers"
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
                "query": "Java loops introduction iteration repeat control structures"
            },
            {
                "id": "5-2",
                "title": "The while Loop",
                "description": "Repeating code with while",
                "keywords": ["while", "loop", "condition", "repeat"],
                "query": "Java while loop condition repeat iteration loop-continuation-condition"
            },
            {
                "id": "5-3",
                "title": "The do-while Loop",
                "description": "Loop that executes at least once",
                "keywords": ["do", "while", "loop", "execute", "once"],
                "query": "Java do while loop execute at least once post-test loop"
            },
            {
                "id": "5-4",
                "title": "The for Loop",
                "description": "Counter-controlled loops",
                "keywords": ["for", "loop", "counter", "controlled", "iteration"],
                "query": "Java for loop counter controlled iteration initial-action loop-continuation increment"
            },
            {
                "id": "5-5",
                "title": "Which Loop to Use?",
                "description": "Choosing the right loop type",
                "keywords": ["loop", "choose", "when", "while", "for", "do-while"],
                "query": "Java which loop to use when while for do-while comparison guidelines"
            },
            {
                "id": "5-6",
                "title": "Nested Loops",
                "description": "Loops inside loops",
                "keywords": ["nested", "loop", "inside", "inner", "outer"],
                "query": "Java nested loops inner outer loop multiplication table pattern"
            },
            {
                "id": "5-7",
                "title": "Minimizing Numeric Errors",
                "description": "Avoiding floating-point issues in loops",
                "keywords": ["numeric", "errors", "floating-point", "precision"],
                "query": "Java minimizing numeric errors floating-point precision loops accumulated"
            },
            {
                "id": "5-8",
                "title": "Keywords break and continue",
                "description": "Controlling loop execution",
                "keywords": ["break", "continue", "exit", "skip", "loop"],
                "query": "Java break continue keywords exit loop skip iteration terminate"
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
                "query": "Java methods introduction functions procedures modular programming"
            },
            {
                "id": "6-2",
                "title": "Defining a Method",
                "description": "How to create methods",
                "keywords": ["define", "method", "create", "signature", "body"],
                "query": "Java defining methods create method signature header body return type parameters"
            },
            {
                "id": "6-3",
                "title": "Calling a Method",
                "description": "How to invoke methods",
                "keywords": ["call", "invoke", "method", "execute"],
                "query": "Java calling methods invoke execute method call arguments"
            },
            {
                "id": "6-4",
                "title": "void vs. Value-Returning Methods",
                "description": "Methods with and without return values",
                "keywords": ["void", "return", "value", "method"],
                "query": "Java void return value methods returning values return statement"
            },
            {
                "id": "6-5",
                "title": "Passing Arguments by Values",
                "description": "How arguments are passed to methods",
                "keywords": ["arguments", "parameters", "pass", "value", "copy"],
                "query": "Java passing arguments by value parameters method pass-by-value copy"
            },
            {
                "id": "6-6",
                "title": "Modularizing Code",
                "description": "Breaking code into reusable methods",
                "keywords": ["modular", "reusable", "organize", "methods"],
                "query": "Java modularizing code reusable methods organize stepwise refinement"
            },
            {
                "id": "6-7",
                "title": "Overloading Methods",
                "description": "Multiple methods with same name",
                "keywords": ["overload", "same name", "different parameters"],
                "query": "Java method overloading same name different parameters signature ambiguous"
            },
            {
                "id": "6-8",
                "title": "The Scope of Variables",
                "description": "Where variables can be accessed",
                "keywords": ["scope", "local", "variable", "access", "block"],
                "query": "Java variable scope local variables access block method lifetime"
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
                "query": "Java arrays introduction collection elements single-dimensional store"
            },
            {
                "id": "7-2",
                "title": "Array Basics",
                "description": "Creating and using arrays",
                "keywords": ["array", "create", "declare", "index", "element"],
                "query": "Java array basics create declare index element access new size length"
            },
            {
                "id": "7-3",
                "title": "Copying Arrays",
                "description": "How to copy array contents",
                "keywords": ["copy", "array", "clone", "arraycopy"],
                "query": "Java copying arrays clone arraycopy System.arraycopy reference vs copy"
            },
            {
                "id": "7-4",
                "title": "Passing Arrays to Methods",
                "description": "Using arrays as method parameters",
                "keywords": ["array", "method", "pass", "parameter", "reference"],
                "query": "Java passing arrays to methods parameter reference call by reference"
            },
            {
                "id": "7-5",
                "title": "Returning an Array from a Method",
                "description": "Methods that return arrays",
                "keywords": ["return", "array", "method"],
                "query": "Java returning array from method return type array reverse"
            },
            {
                "id": "7-6",
                "title": "Searching Arrays",
                "description": "Finding elements in arrays",
                "keywords": ["search", "find", "linear", "binary", "array"],
                "query": "Java searching arrays linear search binary search find element index"
            },
            {
                "id": "7-7",
                "title": "Sorting Arrays",
                "description": "Arranging array elements in order",
                "keywords": ["sort", "array", "order", "selection", "insertion"],
                "query": "Java sorting arrays selection sort insertion sort Arrays.sort ascending"
            },
            {
                "id": "7-8",
                "title": "The Arrays Class",
                "description": "Utility methods for arrays",
                "keywords": ["Arrays", "class", "utility", "sort", "fill", "toString"],
                "query": "Java Arrays class utility methods sort fill toString binarySearch equals"
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
                "query": "Java multidimensional arrays introduction 2D two-dimensional matrix table"
            },
            {
                "id": "8-2",
                "title": "Two-Dimensional Array Basics",
                "description": "Creating and using 2D arrays",
                "keywords": ["2D", "array", "row", "column", "matrix"],
                "query": "Java two-dimensional 2D array basics row column matrix declare create"
            },
            {
                "id": "8-3",
                "title": "Processing Two-Dimensional Arrays",
                "description": "Working with 2D array elements",
                "keywords": ["process", "2D", "array", "nested", "loop"],
                "query": "Java processing two-dimensional arrays nested loops row column traverse"
            },
            {
                "id": "8-4",
                "title": "Passing Two-Dimensional Arrays to Methods",
                "description": "Using 2D arrays as parameters",
                "keywords": ["pass", "2D", "array", "method", "parameter"],
                "query": "Java passing two-dimensional arrays to methods parameter 2D"
            },
            {
                "id": "8-5",
                "title": "Ragged Arrays",
                "description": "Arrays with varying row lengths",
                "keywords": ["ragged", "array", "varying", "length", "rows"],
                "query": "Java ragged arrays varying row lengths irregular jagged"
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
                "query": "Java objects classes OOP object-oriented programming introduction concepts"
            },
            {
                "id": "9-2",
                "title": "Defining Classes for Objects",
                "description": "How to create class definitions",
                "keywords": ["class", "define", "object", "blueprint"],
                "query": "Java defining classes for objects blueprint template data fields methods"
            },
            {
                "id": "9-3",
                "title": "Constructors",
                "description": "Initializing objects with constructors",
                "keywords": ["constructor", "initialize", "new", "create", "object"],
                "query": "Java constructors initialize objects new keyword no-arg default"
            },
            {
                "id": "9-4",
                "title": "Accessing Objects via Reference Variables",
                "description": "How reference variables work",
                "keywords": ["reference", "variable", "object", "access", "dot"],
                "query": "Java reference variables access objects dot operator instance member"
            },
            {
                "id": "9-5",
                "title": "Using Classes from the Java Library",
                "description": "Working with built-in Java classes",
                "keywords": ["library", "Java", "class", "Date", "Random", "import"],
                "query": "Java library classes Date Random Point import API built-in"
            },
            {
                "id": "9-6",
                "title": "Static Variables, Constants, and Methods",
                "description": "Class-level members with static",
                "keywords": ["static", "class", "variable", "method", "constant"],
                "query": "Java static variables constants methods class-level shared instance vs static"
            },
            {
                "id": "9-7",
                "title": "Visibility Modifiers",
                "description": "public, private, and access control",
                "keywords": ["visibility", "public", "private", "protected", "access"],
                "query": "Java visibility modifiers public private protected access control encapsulation"
            },
            {
                "id": "9-8",
                "title": "Data Field Encapsulation",
                "description": "Hiding data with getters and setters",
                "keywords": ["encapsulation", "getter", "setter", "private", "data"],
                "query": "Java encapsulation getter setter methods private data fields accessor mutator"
            },
            {
                "id": "9-9",
                "title": "Passing Objects to Methods",
                "description": "How objects are passed to methods",
                "keywords": ["pass", "object", "method", "reference"],
                "query": "Java passing objects to methods reference parameter object state"
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
                "query": "Java object-oriented thinking design OOP introduction procedural vs OO"
            },
            {
                "id": "10-2",
                "title": "Class Abstraction and Encapsulation",
                "description": "Hiding implementation details",
                "keywords": ["abstraction", "encapsulation", "hide", "implementation"],
                "query": "Java class abstraction encapsulation hiding implementation class contract"
            },
            {
                "id": "10-3",
                "title": "Thinking in Objects",
                "description": "Designing with objects in mind",
                "keywords": ["thinking", "objects", "design", "modeling"],
                "query": "Java thinking in objects design modeling real-world class design"
            },
            {
                "id": "10-4",
                "title": "Class Relationships",
                "description": "Association, aggregation, and composition",
                "keywords": ["relationship", "association", "aggregation", "composition"],
                "query": "Java class relationships association aggregation composition has-a owns"
            },
            {
                "id": "10-5",
                "title": "Wrapper Classes for Primitive Types",
                "description": "Wrapper classes for primitives",
                "keywords": ["wrapper", "Integer", "Double", "primitive", "object"],
                "query": "Java wrapper classes Integer Double Character primitive values objects boxing"
            },
            {
                "id": "10-6",
                "title": "The BigInteger and BigDecimal Classes",
                "description": "Working with large numbers",
                "keywords": ["BigInteger", "BigDecimal", "large", "numbers", "precision"],
                "query": "Java BigInteger BigDecimal large numbers arbitrary precision arithmetic"
            },
            {
                "id": "10-7",
                "title": "The String Class Methods",
                "description": "String methods and operations",
                "keywords": ["String", "methods", "substring", "length", "charAt"],
                "query": "Java String class methods substring length charAt indexOf compareTo replace"
            },
            {
                "id": "10-8",
                "title": "The StringBuilder and StringBuffer Classes",
                "description": "Mutable string operations",
                "keywords": ["StringBuilder", "StringBuffer", "mutable", "append"],
                "query": "Java StringBuilder StringBuffer mutable strings append insert delete reverse"
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


if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Starting RAG Learning API")
    print(f"📚 Loaded {len(CHAPTER_TOPICS)} chapters")
    print(f"📖 Total topics: {sum(len(c['topics']) for c in CHAPTER_TOPICS.values())}")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5001, debug=True)
