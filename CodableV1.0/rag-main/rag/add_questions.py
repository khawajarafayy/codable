"""
Add 2 MCQ questions to each of the 88 topic JSON files in generated_content.
Each question has: id, question, options (4 choices), correctAnswer (0-3 index), explanation.
"""

import json
import os
import glob

GENERATED_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_content")

TOPIC_QUESTIONS = {
    # ============ Chapter 1: Introduction to Computers, Programs, and Java ============
    "1-1": [
        {
            "id": 1,
            "question": "What is the primary purpose of the Java Virtual Machine (JVM)?",
            "options": [
                "To write Java code",
                "To execute Java bytecode on any platform",
                "To compile Java source code",
                "To design user interfaces"
            ],
            "correctAnswer": 1,
            "explanation": "The JVM executes Java bytecode, enabling Java programs to run on any platform that has a JVM installed. This is what makes Java platform-independent."
        },
        {
            "id": 2,
            "question": "Which of the following is NOT a key tool required for Java development?",
            "options": [
                "JDK (Java Development Kit)",
                "IDE (Integrated Development Environment)",
                "JRE (Java Runtime Environment)",
                "GPU (Graphics Processing Unit)"
            ],
            "correctAnswer": 3,
            "explanation": "The JDK, IDEs, and JRE are essential Java development tools. A GPU is a hardware component for graphics processing and is not a Java development requirement."
        }
    ],
    "1-2": [
        {
            "id": 1,
            "question": "Which component of a computer is responsible for executing instructions and performing calculations?",
            "options": [
                "Hard Drive",
                "RAM",
                "CPU (Central Processing Unit)",
                "Monitor"
            ],
            "correctAnswer": 2,
            "explanation": "The CPU is the brain of the computer. It fetches instructions from memory and executes them, performing all calculations and logic operations."
        },
        {
            "id": 2,
            "question": "What is the difference between RAM and storage (hard drive)?",
            "options": [
                "RAM is permanent, storage is temporary",
                "RAM is volatile and fast, storage is non-volatile and slower",
                "RAM stores programs, storage stores only files",
                "There is no difference"
            ],
            "correctAnswer": 1,
            "explanation": "RAM is volatile memory that loses data when power is off but provides fast access. Storage (hard drive/SSD) retains data permanently but is slower to access."
        }
    ],
    "1-3": [
        {
            "id": 1,
            "question": "Which type of programming language uses 0s and 1s that the CPU directly understands?",
            "options": [
                "High-level language",
                "Assembly language",
                "Machine language",
                "Scripting language"
            ],
            "correctAnswer": 2,
            "explanation": "Machine language consists of binary instructions (0s and 1s) that the CPU can directly execute without any translation."
        },
        {
            "id": 2,
            "question": "What is the role of a compiler in programming?",
            "options": [
                "It runs the program directly",
                "It translates the entire source code into machine code before execution",
                "It translates code one line at a time during execution",
                "It designs the program structure"
            ],
            "correctAnswer": 1,
            "explanation": "A compiler translates the entire source code into machine code (or bytecode) at once before the program is executed, unlike an interpreter which translates line by line."
        }
    ],
    "1-4": [
        {
            "id": 1,
            "question": "What is the primary role of an operating system?",
            "options": [
                "To write programs",
                "To manage hardware resources and provide services to applications",
                "To connect to the internet",
                "To store files permanently"
            ],
            "correctAnswer": 1,
            "explanation": "The operating system manages hardware resources (CPU, memory, storage, I/O devices) and provides a platform and services for application programs to run."
        },
        {
            "id": 2,
            "question": "Which of the following is an example of an operating system?",
            "options": [
                "Java",
                "Microsoft Word",
                "Linux",
                "Google Chrome"
            ],
            "correctAnswer": 2,
            "explanation": "Linux is an operating system (along with Windows and macOS). Java is a programming language, Microsoft Word is an application, and Google Chrome is a web browser."
        }
    ],
    "1-5": [
        {
            "id": 1,
            "question": "Who created the Java programming language?",
            "options": [
                "Bill Gates",
                "Dennis Ritchie",
                "James Gosling at Sun Microsystems",
                "Guido van Rossum"
            ],
            "correctAnswer": 2,
            "explanation": "Java was created by James Gosling and his team at Sun Microsystems in the mid-1990s. It was originally designed for interactive television but became popular for web and enterprise applications."
        },
        {
            "id": 2,
            "question": "What makes Java 'platform-independent'?",
            "options": [
                "Java runs only on Windows",
                "Java code is compiled to bytecode that runs on any JVM",
                "Java does not need to be compiled",
                "Java uses machine language directly"
            ],
            "correctAnswer": 1,
            "explanation": "Java achieves platform independence through its 'Write Once, Run Anywhere' principle. Java source code is compiled to bytecode, which can run on any platform that has a Java Virtual Machine (JVM)."
        }
    ],
    "1-6": [
        {
            "id": 1,
            "question": "What does JDK stand for and what does it contain?",
            "options": [
                "Java Design Kit - contains design templates",
                "Java Development Kit - contains compiler, JRE, and development tools",
                "Java Debug Kit - contains debugging tools only",
                "Java Data Kit - contains database tools"
            ],
            "correctAnswer": 1,
            "explanation": "JDK stands for Java Development Kit. It includes the Java compiler (javac), the Java Runtime Environment (JRE), and various development tools needed to write and compile Java programs."
        },
        {
            "id": 2,
            "question": "What is the purpose of an IDE in Java development?",
            "options": [
                "It replaces the need for a JDK",
                "It provides a comprehensive environment with editor, compiler, and debugger",
                "It is used only for running programs",
                "It is a type of operating system"
            ],
            "correctAnswer": 1,
            "explanation": "An IDE (Integrated Development Environment) like Eclipse or IntelliJ provides a code editor, compiler integration, debugger, and other tools in one application to make development more efficient."
        }
    ],
    "1-7": [
        {
            "id": 1,
            "question": "What is the correct signature of the main method in Java?",
            "options": [
                "public void main(String args)",
                "public static void main(String[] args)",
                "static void main(String args[])",
                "public main(String[] args)"
            ],
            "correctAnswer": 1,
            "explanation": "The correct main method signature is 'public static void main(String[] args)'. It must be public (accessible), static (no object needed), void (returns nothing), and accept a String array parameter."
        },
        {
            "id": 2,
            "question": "What does System.out.println() do in Java?",
            "options": [
                "Reads input from the user",
                "Prints text to the console and moves to a new line",
                "Creates a new variable",
                "Compiles the program"
            ],
            "correctAnswer": 1,
            "explanation": "System.out.println() prints the specified text (or value) to the console output and then moves the cursor to the next line. 'println' stands for 'print line'."
        }
    ],
    "1-8": [
        {
            "id": 1,
            "question": "Which command is used to compile a Java file named Hello.java?",
            "options": [
                "java Hello.java",
                "javac Hello.java",
                "compile Hello.java",
                "run Hello.java"
            ],
            "correctAnswer": 1,
            "explanation": "The 'javac' command is the Java compiler. Running 'javac Hello.java' compiles the source file and produces a Hello.class bytecode file."
        },
        {
            "id": 2,
            "question": "What file is produced when you compile a Java source file?",
            "options": [
                "A .exe file",
                "A .class file containing bytecode",
                "A .jar file",
                "A .html file"
            ],
            "correctAnswer": 1,
            "explanation": "The Java compiler (javac) produces a .class file containing bytecode. This bytecode is platform-independent and can be executed by any JVM."
        }
    ],
    "1-9": [
        {
            "id": 1,
            "question": "Which of the following is a proper single-line comment in Java?",
            "options": [
                "# This is a comment",
                "// This is a comment",
                "<!-- This is a comment -->",
                "-- This is a comment"
            ],
            "correctAnswer": 1,
            "explanation": "In Java, single-line comments start with //. Everything after // on that line is ignored by the compiler. Multi-line comments use /* */."
        },
        {
            "id": 2,
            "question": "What is the recommended naming convention for variables in Java?",
            "options": [
                "ALLCAPS",
                "camelCase (e.g., myVariable)",
                "snake_case (e.g., my_variable)",
                "PascalCase (e.g., MyVariable)"
            ],
            "correctAnswer": 1,
            "explanation": "Java convention uses camelCase for variable and method names (e.g., myVariable, calculateArea). Class names use PascalCase, and constants use ALL_CAPS."
        }
    ],
    "1-10": [
        {
            "id": 1,
            "question": "Which type of error is detected by the compiler before the program runs?",
            "options": [
                "Logic error",
                "Runtime error",
                "Syntax error",
                "Semantic error"
            ],
            "correctAnswer": 2,
            "explanation": "Syntax errors (also called compilation errors) are detected by the compiler before the program runs. They occur when code violates Java's grammar rules, such as missing semicolons or mismatched braces."
        },
        {
            "id": 2,
            "question": "A program compiles without errors but produces incorrect results. What type of error is this?",
            "options": [
                "Syntax error",
                "Runtime error",
                "Logic error",
                "Compilation error"
            ],
            "correctAnswer": 2,
            "explanation": "Logic errors occur when a program runs successfully but produces incorrect results. The code is syntactically correct but the algorithm or logic is flawed."
        }
    ],

    # ============ Chapter 2: Elementary Programming ============
    "2-1": [
        {
            "id": 1,
            "question": "What is elementary programming primarily concerned with?",
            "options": [
                "Building graphical user interfaces",
                "Working with variables, data types, and basic operations",
                "Creating databases",
                "Designing web pages"
            ],
            "correctAnswer": 1,
            "explanation": "Elementary programming covers the fundamentals: variables, data types, input/output, basic arithmetic operations, and writing simple programs that perform calculations."
        },
        {
            "id": 2,
            "question": "Which of the following is a fundamental concept in elementary Java programming?",
            "options": [
                "Inheritance",
                "Polymorphism",
                "Variable declaration and assignment",
                "Abstract classes"
            ],
            "correctAnswer": 2,
            "explanation": "Variable declaration and assignment is a core elementary programming concept. Inheritance, polymorphism, and abstract classes are advanced OOP concepts covered in later chapters."
        }
    ],
    "2-2": [
        {
            "id": 1,
            "question": "What is the correct way to declare an integer variable and assign it a value in Java?",
            "options": [
                "integer x = 5;",
                "int x = 5;",
                "x = 5 int;",
                "var int x = 5;"
            ],
            "correctAnswer": 1,
            "explanation": "In Java, you declare a variable by specifying the type followed by the name and optional assignment: 'int x = 5;'. The keyword is 'int', not 'integer'."
        },
        {
            "id": 2,
            "question": "What is the output of: System.out.println(2 + 3 * 4);?",
            "options": [
                "20",
                "14",
                "24",
                "9"
            ],
            "correctAnswer": 1,
            "explanation": "Due to operator precedence, multiplication (*) is performed before addition (+). So 3 * 4 = 12, then 2 + 12 = 14."
        }
    ],
    "2-3": [
        {
            "id": 1,
            "question": "Which class is used to read input from the console in Java?",
            "options": [
                "System.in",
                "Console",
                "Scanner",
                "Reader"
            ],
            "correctAnswer": 2,
            "explanation": "The Scanner class (java.util.Scanner) is the standard way to read input from the console. You create it with: Scanner input = new Scanner(System.in);"
        },
        {
            "id": 2,
            "question": "Which Scanner method reads an integer value from the user?",
            "options": [
                "readInt()",
                "getInt()",
                "nextInt()",
                "scanInt()"
            ],
            "correctAnswer": 2,
            "explanation": "The nextInt() method of the Scanner class reads the next integer value from the input. Other methods include nextDouble(), nextLine(), and next()."
        }
    ],
    "2-4": [
        {
            "id": 1,
            "question": "Which of the following is a valid Java identifier?",
            "options": [
                "2ndValue",
                "my-variable",
                "myVariable",
                "class"
            ],
            "correctAnswer": 2,
            "explanation": "Java identifiers must start with a letter, underscore, or dollar sign. '2ndValue' starts with a digit, 'my-variable' contains a hyphen, and 'class' is a reserved keyword."
        },
        {
            "id": 2,
            "question": "Why can't you use 'int' as a variable name in Java?",
            "options": [
                "It starts with a lowercase letter",
                "It is too short",
                "It is a reserved keyword",
                "It contains only letters"
            ],
            "correctAnswer": 2,
            "explanation": "'int' is a reserved keyword in Java used to declare integer variables. Reserved keywords cannot be used as identifiers (variable names, method names, etc.)."
        }
    ],
    "2-5": [
        {
            "id": 1,
            "question": "What happens if you try to use a variable before assigning it a value in Java?",
            "options": [
                "It defaults to 0",
                "It defaults to null",
                "A compilation error occurs",
                "A runtime error occurs"
            ],
            "correctAnswer": 2,
            "explanation": "Java requires local variables to be initialized before use. If you try to use an uninitialized local variable, the compiler will report an error."
        },
        {
            "id": 2,
            "question": "Which statement correctly declares two integer variables in Java?",
            "options": [
                "int x, y;",
                "int x; int y;",
                "int x and y;",
                "Both A and B are correct"
            ],
            "correctAnswer": 3,
            "explanation": "Both 'int x, y;' (comma-separated) and separate declarations 'int x; int y;' are valid ways to declare multiple variables of the same type in Java."
        }
    ],
    "2-6": [
        {
            "id": 1,
            "question": "What is the value of x after: int x = 5; x = x + 3;?",
            "options": [
                "5",
                "3",
                "8",
                "Error"
            ],
            "correctAnswer": 2,
            "explanation": "First x is assigned 5. Then x = x + 3 evaluates the right side (5 + 3 = 8) and assigns the result back to x, so x becomes 8."
        },
        {
            "id": 2,
            "question": "In the assignment statement 'y = x + 1;', which side is evaluated first?",
            "options": [
                "The left side (y)",
                "The right side (x + 1)",
                "Both sides simultaneously",
                "It depends on the compiler"
            ],
            "correctAnswer": 1,
            "explanation": "In an assignment statement, the right-hand side expression is evaluated first, then the result is assigned to the variable on the left-hand side."
        }
    ],
    "2-7": [
        {
            "id": 1,
            "question": "How do you declare a constant in Java?",
            "options": [
                "const double PI = 3.14;",
                "final double PI = 3.14;",
                "constant double PI = 3.14;",
                "static PI = 3.14;"
            ],
            "correctAnswer": 1,
            "explanation": "In Java, constants are declared using the 'final' keyword. Once assigned, a final variable's value cannot be changed. Java does not use the 'const' keyword."
        },
        {
            "id": 2,
            "question": "What happens if you try to change the value of a final variable?",
            "options": [
                "The value changes normally",
                "A runtime error occurs",
                "A compilation error occurs",
                "The change is silently ignored"
            ],
            "correctAnswer": 2,
            "explanation": "Attempting to reassign a value to a final variable causes a compilation error. The 'final' keyword ensures the value remains constant throughout the program."
        }
    ],
    "2-8": [
        {
            "id": 1,
            "question": "According to Java naming conventions, how should a class be named?",
            "options": [
                "camelCase (e.g., myClass)",
                "PascalCase (e.g., MyClass)",
                "snake_case (e.g., my_class)",
                "ALL_CAPS (e.g., MY_CLASS)"
            ],
            "correctAnswer": 1,
            "explanation": "Java convention uses PascalCase (also called UpperCamelCase) for class names, where each word starts with a capital letter (e.g., MyClass, StudentRecord)."
        },
        {
            "id": 2,
            "question": "How should constants be named according to Java conventions?",
            "options": [
                "camelCase (e.g., maxValue)",
                "PascalCase (e.g., MaxValue)",
                "ALL_CAPS with underscores (e.g., MAX_VALUE)",
                "lowercase (e.g., maxvalue)"
            ],
            "correctAnswer": 2,
            "explanation": "Java constants are conventionally named using ALL_CAPS with underscores separating words (e.g., MAX_VALUE, PI, INTEREST_RATE)."
        }
    ],
    "2-9": [
        {
            "id": 1,
            "question": "What is the result of the integer division 7 / 2 in Java?",
            "options": [
                "3.5",
                "3",
                "4",
                "3.0"
            ],
            "correctAnswer": 1,
            "explanation": "When both operands are integers, Java performs integer division, which truncates the decimal part. 7 / 2 = 3 (not 3.5). To get 3.5, at least one operand must be a double."
        },
        {
            "id": 2,
            "question": "What does the modulus operator (%) return?",
            "options": [
                "The quotient of division",
                "The remainder after division",
                "The percentage value",
                "The absolute value"
            ],
            "correctAnswer": 1,
            "explanation": "The modulus operator (%) returns the remainder after integer division. For example, 7 % 2 returns 1 because 7 divided by 2 is 3 with a remainder of 1."
        }
    ],
    "2-10": [
        {
            "id": 1,
            "question": "Which of the following is a floating-point literal in Java?",
            "options": [
                "100",
                "100L",
                "100.0",
                "100f only if cast"
            ],
            "correctAnswer": 2,
            "explanation": "100.0 is a floating-point (double) literal because it contains a decimal point. 100 is an integer literal, and 100L is a long literal."
        },
        {
            "id": 2,
            "question": "What type does Java assign to the literal 3.14 by default?",
            "options": [
                "float",
                "double",
                "int",
                "long"
            ],
            "correctAnswer": 1,
            "explanation": "By default, Java treats floating-point literals like 3.14 as double type. To make it a float, you must add an 'f' suffix: 3.14f."
        }
    ],
    "2-11": [
        {
            "id": 1,
            "question": "What is the result of: 2 + 3 * 4 - 1?",
            "options": [
                "19",
                "13",
                "12",
                "15"
            ],
            "correctAnswer": 1,
            "explanation": "Following operator precedence: multiplication first (3 * 4 = 12), then left to right for addition and subtraction (2 + 12 - 1 = 13)."
        },
        {
            "id": 2,
            "question": "How can you override the default operator precedence in Java?",
            "options": [
                "Using curly braces {}",
                "Using parentheses ()",
                "Using square brackets []",
                "You cannot override precedence"
            ],
            "correctAnswer": 1,
            "explanation": "Parentheses () are used to override default operator precedence. Expressions inside parentheses are evaluated first. For example, (2 + 3) * 4 = 20."
        }
    ],
    "2-12": [
        {
            "id": 1,
            "question": "What is 'x += 5;' equivalent to?",
            "options": [
                "x = 5;",
                "x = x + 5;",
                "x = x * 5;",
                "x + 5;"
            ],
            "correctAnswer": 1,
            "explanation": "The augmented assignment operator += adds the right operand to the variable and assigns the result back. So x += 5 is shorthand for x = x + 5."
        },
        {
            "id": 2,
            "question": "If x = 10, what is the value of x after 'x %= 3;'?",
            "options": [
                "3",
                "1",
                "10",
                "0"
            ],
            "correctAnswer": 1,
            "explanation": "x %= 3 is equivalent to x = x % 3. Since 10 % 3 = 1 (remainder of 10 divided by 3), x becomes 1."
        }
    ],
    "2-13": [
        {
            "id": 1,
            "question": "If x = 5, what is the value of y after 'int y = x++;'?",
            "options": [
                "5",
                "6",
                "4",
                "Error"
            ],
            "correctAnswer": 0,
            "explanation": "The postfix ++ (x++) returns the current value of x first, then increments it. So y gets the value 5, and x becomes 6 after the statement."
        },
        {
            "id": 2,
            "question": "If x = 5, what is the value of y after 'int y = ++x;'?",
            "options": [
                "5",
                "6",
                "4",
                "Error"
            ],
            "correctAnswer": 1,
            "explanation": "The prefix ++ (++x) increments x first, then returns the new value. So x becomes 6, and y also gets 6."
        }
    ],
    "2-14": [
        {
            "id": 1,
            "question": "What is the result of: (int) 5.9 in Java?",
            "options": [
                "6",
                "5",
                "5.0",
                "Error"
            ],
            "correctAnswer": 1,
            "explanation": "Casting a double to int truncates (removes) the decimal part. (int) 5.9 results in 5, not 6. It does not round the value."
        },
        {
            "id": 2,
            "question": "Which type of casting happens automatically in Java?",
            "options": [
                "Narrowing casting (double to int)",
                "Widening casting (int to double)",
                "String to int casting",
                "Object to int casting"
            ],
            "correctAnswer": 1,
            "explanation": "Widening casting (smaller type to larger type, like int to double) happens automatically because no data is lost. Narrowing casting requires an explicit cast."
        }
    ],
    "2-15": [
        {
            "id": 1,
            "question": "What is the first step in the software development process?",
            "options": [
                "Writing code",
                "Testing",
                "Requirements specification and analysis",
                "Deployment"
            ],
            "correctAnswer": 2,
            "explanation": "The software development process begins with requirements specification and analysis - understanding what the program should do before any code is written."
        },
        {
            "id": 2,
            "question": "Why is testing an important part of software development?",
            "options": [
                "It makes the code run faster",
                "It ensures the program meets requirements and works correctly",
                "It is only needed for large programs",
                "It replaces the need for documentation"
            ],
            "correctAnswer": 1,
            "explanation": "Testing verifies that the program produces correct results and meets its requirements. It helps catch bugs and ensures reliability before deployment."
        }
    ],
    "2-16": [
        {
            "id": 1,
            "question": "What is a common error when dividing two integers in Java?",
            "options": [
                "Using the wrong variable name",
                "Expecting a decimal result from integer division",
                "Forgetting to import a library",
                "Using too many variables"
            ],
            "correctAnswer": 1,
            "explanation": "A common beginner mistake is expecting 5/2 to give 2.5. In Java, integer division truncates the decimal part, giving 2. Use double types or cast to get decimal results."
        },
        {
            "id": 2,
            "question": "Which of the following will cause a compilation error?",
            "options": [
                "int x = 5;",
                "double y = 3.14;",
                "int z = 3.14;",
                "String s = \"hello\";"
            ],
            "correctAnswer": 2,
            "explanation": "Assigning a double literal (3.14) directly to an int variable causes a compilation error because it is a narrowing conversion that could lose data. You need an explicit cast: int z = (int) 3.14;"
        }
    ],

    # ============ Chapter 3: Selections ============
    "3-1": [
        {
            "id": 1,
            "question": "What is the purpose of selection statements in Java?",
            "options": [
                "To repeat a block of code",
                "To make decisions and execute code conditionally",
                "To define methods",
                "To create objects"
            ],
            "correctAnswer": 1,
            "explanation": "Selection statements (if, if-else, switch) allow programs to make decisions and execute different blocks of code based on whether conditions are true or false."
        },
        {
            "id": 2,
            "question": "Which of the following is a selection statement in Java?",
            "options": [
                "for",
                "while",
                "if-else",
                "do-while"
            ],
            "correctAnswer": 2,
            "explanation": "if-else is a selection statement used for making decisions. for, while, and do-while are loop statements used for repetition."
        }
    ],
    "3-2": [
        {
            "id": 1,
            "question": "What are the two possible values of a boolean variable in Java?",
            "options": [
                "0 and 1",
                "yes and no",
                "true and false",
                "on and off"
            ],
            "correctAnswer": 2,
            "explanation": "In Java, the boolean data type has exactly two possible values: true and false. Unlike some languages, Java does not allow 0 and 1 to represent boolean values."
        },
        {
            "id": 2,
            "question": "What is the result of the expression: 5 > 3?",
            "options": [
                "5",
                "3",
                "true",
                "1"
            ],
            "correctAnswer": 2,
            "explanation": "The comparison operator > returns a boolean value. Since 5 is greater than 3, the expression 5 > 3 evaluates to true."
        }
    ],
    "3-3": [
        {
            "id": 1,
            "question": "What is the correct syntax for an if statement in Java?",
            "options": [
                "if x > 0 { ... }",
                "if (x > 0) { ... }",
                "if [x > 0] { ... }",
                "if x > 0 then { ... }"
            ],
            "correctAnswer": 1,
            "explanation": "Java requires the condition of an if statement to be enclosed in parentheses: if (condition) { statements; }. This is mandatory syntax."
        },
        {
            "id": 2,
            "question": "What happens if the condition in an if statement is false?",
            "options": [
                "The program crashes",
                "The code inside the if block is skipped",
                "The condition is re-evaluated",
                "An error is thrown"
            ],
            "correctAnswer": 1,
            "explanation": "If the condition in an if statement evaluates to false, the code inside the if block is simply skipped, and execution continues with the next statement after the if block."
        }
    ],
    "3-4": [
        {
            "id": 1,
            "question": "When is the else block executed in an if-else statement?",
            "options": [
                "Always",
                "When the if condition is true",
                "When the if condition is false",
                "Before the if condition is checked"
            ],
            "correctAnswer": 2,
            "explanation": "In an if-else statement, the else block executes only when the if condition evaluates to false. Either the if block or the else block executes, never both."
        },
        {
            "id": 2,
            "question": "What is the output of: if (10 > 20) { System.out.println(\"A\"); } else { System.out.println(\"B\"); }?",
            "options": [
                "A",
                "B",
                "AB",
                "No output"
            ],
            "correctAnswer": 1,
            "explanation": "Since 10 > 20 is false, the else block executes, printing 'B'. The if block is skipped."
        }
    ],
    "3-5": [
        {
            "id": 1,
            "question": "What is the purpose of 'else if' in a multi-way if-else statement?",
            "options": [
                "To end the if statement",
                "To check additional conditions when previous conditions are false",
                "To create a loop",
                "To define a default action"
            ],
            "correctAnswer": 1,
            "explanation": "'else if' allows testing additional conditions when the preceding if/else-if condition is false. It creates a chain of condition checks, with only the first true condition's block executing."
        },
        {
            "id": 2,
            "question": "In a nested if-else, which if does an else belong to?",
            "options": [
                "The first if in the code",
                "The nearest preceding unmatched if",
                "The outermost if",
                "It can belong to any if"
            ],
            "correctAnswer": 1,
            "explanation": "In Java, an else clause is associated with the nearest preceding unmatched if statement. This is known as the 'dangling else' rule."
        }
    ],
    "3-6": [
        {
            "id": 1,
            "question": "What is the 'dangling else' problem?",
            "options": [
                "An else without a matching if",
                "Ambiguity about which if an else belongs to in nested statements",
                "An else that never executes",
                "Using too many else statements"
            ],
            "correctAnswer": 1,
            "explanation": "The dangling else problem is the ambiguity that arises in nested if statements about which if an else clause belongs to. Java resolves this by matching else with the nearest unmatched if."
        },
        {
            "id": 2,
            "question": "What is a common mistake when comparing values in if conditions?",
            "options": [
                "Using parentheses around the condition",
                "Using = (assignment) instead of == (comparison)",
                "Using too many conditions",
                "Forgetting the semicolon after the condition"
            ],
            "correctAnswer": 1,
            "explanation": "Using = instead of == is a common error. = is the assignment operator, while == is the comparison operator. For example, if (x = 5) is assignment, not comparison."
        }
    ],
    "3-7": [
        {
            "id": 1,
            "question": "What does Math.random() return?",
            "options": [
                "A random integer between 0 and 100",
                "A random double value >= 0.0 and < 1.0",
                "A random boolean value",
                "A random double value between 1.0 and 10.0"
            ],
            "correctAnswer": 1,
            "explanation": "Math.random() returns a random double value that is greater than or equal to 0.0 and less than 1.0. You can scale and shift this to get other ranges."
        },
        {
            "id": 2,
            "question": "How would you generate a random integer between 0 and 9 (inclusive)?",
            "options": [
                "Math.random() * 10",
                "(int)(Math.random() * 10)",
                "Math.random(10)",
                "(int)(Math.random() * 9)"
            ],
            "correctAnswer": 1,
            "explanation": "Math.random() * 10 gives a double from 0.0 to 9.999... Casting to int with (int) truncates the decimal, giving integers 0 through 9."
        }
    ],
    "3-8": [
        {
            "id": 1,
            "question": "What is the result of: true && false?",
            "options": [
                "true",
                "false",
                "1",
                "Error"
            ],
            "correctAnswer": 1,
            "explanation": "The logical AND operator (&&) returns true only if both operands are true. Since one operand is false, the result is false."
        },
        {
            "id": 2,
            "question": "What is the result of: true || false?",
            "options": [
                "true",
                "false",
                "1",
                "Error"
            ],
            "correctAnswer": 0,
            "explanation": "The logical OR operator (||) returns true if at least one operand is true. Since the first operand is true, the result is true."
        }
    ],
    "3-9": [
        {
            "id": 1,
            "question": "What keyword is used to exit a case block in a switch statement?",
            "options": [
                "exit",
                "stop",
                "break",
                "return"
            ],
            "correctAnswer": 2,
            "explanation": "The 'break' keyword exits a case block in a switch statement. Without break, execution 'falls through' into the next case block."
        },
        {
            "id": 2,
            "question": "What happens if you omit the break statement in a switch case?",
            "options": [
                "A compilation error occurs",
                "Only the matching case executes",
                "Execution falls through to subsequent cases",
                "The default case executes"
            ],
            "correctAnswer": 2,
            "explanation": "Without a break statement, execution falls through from the matched case into the subsequent cases until a break is encountered or the switch block ends."
        }
    ],
    "3-10": [
        {
            "id": 1,
            "question": "What is the ternary operator in Java?",
            "options": [
                "if-else",
                "?:",
                "&&",
                "||"
            ],
            "correctAnswer": 1,
            "explanation": "The ternary operator (?:) is a shorthand for if-else. Its syntax is: condition ? valueIfTrue : valueIfFalse. For example: int max = (a > b) ? a : b;"
        },
        {
            "id": 2,
            "question": "What is the value of: int x = (5 > 3) ? 10 : 20;?",
            "options": [
                "5",
                "3",
                "10",
                "20"
            ],
            "correctAnswer": 2,
            "explanation": "Since 5 > 3 is true, the ternary operator returns the value after '?', which is 10. If the condition were false, it would return 20."
        }
    ],
    "3-11": [
        {
            "id": 1,
            "question": "Which operator has higher precedence: && or ||?",
            "options": [
                "||",
                "&&",
                "They have the same precedence",
                "It depends on the context"
            ],
            "correctAnswer": 1,
            "explanation": "&& (logical AND) has higher precedence than || (logical OR). So in 'a || b && c', the && is evaluated first: a || (b && c)."
        },
        {
            "id": 2,
            "question": "What does associativity determine for operators?",
            "options": [
                "Which operator runs faster",
                "The direction of evaluation when operators have equal precedence",
                "Whether an operator is binary or unary",
                "The data type of the result"
            ],
            "correctAnswer": 1,
            "explanation": "Associativity determines the order of evaluation when operators have the same precedence. Most binary operators are left-associative (evaluated left to right), while assignment is right-associative."
        }
    ],

    # ============ Chapter 4: Mathematical Functions, Characters, and Strings ============
    "4-1": [
        {
            "id": 1,
            "question": "Which Java class provides mathematical methods like sqrt, pow, and abs?",
            "options": [
                "Scanner",
                "System",
                "Math",
                "String"
            ],
            "correctAnswer": 2,
            "explanation": "The Math class in Java provides commonly used mathematical methods like Math.sqrt(), Math.pow(), Math.abs(), Math.max(), and Math.min()."
        },
        {
            "id": 2,
            "question": "Which of the following data types represents a single character in Java?",
            "options": [
                "String",
                "char",
                "byte",
                "boolean"
            ],
            "correctAnswer": 1,
            "explanation": "The char data type represents a single character in Java. It uses single quotes (e.g., 'A'). String represents a sequence of characters and uses double quotes."
        }
    ],
    "4-2": [
        {
            "id": 1,
            "question": "What does Math.pow(2, 3) return?",
            "options": [
                "6.0",
                "8.0",
                "5.0",
                "23.0"
            ],
            "correctAnswer": 1,
            "explanation": "Math.pow(2, 3) computes 2 raised to the power of 3, which is 2 * 2 * 2 = 8.0. The method returns a double value."
        },
        {
            "id": 2,
            "question": "What does Math.sqrt(16) return?",
            "options": [
                "8.0",
                "4.0",
                "256.0",
                "2.0"
            ],
            "correctAnswer": 1,
            "explanation": "Math.sqrt(16) returns the square root of 16, which is 4.0. The method always returns a double value."
        }
    ],
    "4-3": [
        {
            "id": 1,
            "question": "What is the correct way to declare a char variable in Java?",
            "options": [
                "char c = \"A\";",
                "char c = 'A';",
                "char c = A;",
                "String c = 'A';"
            ],
            "correctAnswer": 1,
            "explanation": "Character literals in Java use single quotes: char c = 'A'. Double quotes are for String literals, not characters."
        },
        {
            "id": 2,
            "question": "What encoding system does Java use for characters?",
            "options": [
                "ASCII only",
                "EBCDIC",
                "Unicode",
                "Binary"
            ],
            "correctAnswer": 2,
            "explanation": "Java uses Unicode encoding for characters, which supports characters from all major world languages. ASCII is a subset of Unicode."
        }
    ],
    "4-4": [
        {
            "id": 1,
            "question": "How do you find the length of a String in Java?",
            "options": [
                "str.size()",
                "str.length()",
                "str.count()",
                "length(str)"
            ],
            "correctAnswer": 1,
            "explanation": "The length() method of the String class returns the number of characters in the string. For example, \"Hello\".length() returns 5."
        },
        {
            "id": 2,
            "question": "Are String objects mutable or immutable in Java?",
            "options": [
                "Mutable - they can be changed after creation",
                "Immutable - they cannot be changed after creation",
                "It depends on how they are created",
                "Only final Strings are immutable"
            ],
            "correctAnswer": 1,
            "explanation": "Strings in Java are immutable. Once a String object is created, its content cannot be changed. Methods like concat() or replace() create new String objects."
        }
    ],
    "4-5": [
        {
            "id": 1,
            "question": "Which method is used for formatted output in Java?",
            "options": [
                "System.out.println()",
                "System.out.printf()",
                "System.out.print()",
                "System.out.write()"
            ],
            "correctAnswer": 1,
            "explanation": "System.out.printf() is used for formatted output, allowing format specifiers like %d for integers, %f for floating-point numbers, and %s for strings."
        },
        {
            "id": 2,
            "question": "What does the format specifier %d represent in printf?",
            "options": [
                "A double value",
                "A decimal (floating-point) value",
                "An integer value",
                "A string value"
            ],
            "correctAnswer": 2,
            "explanation": "%d is the format specifier for integer values in printf. %f is for floating-point, %s is for strings, and %c is for characters."
        }
    ],

    # ============ Chapter 5: Loops ============
    "5-1": [
        {
            "id": 1,
            "question": "What is the primary purpose of a loop in programming?",
            "options": [
                "To make decisions",
                "To repeat a block of code multiple times",
                "To define methods",
                "To store data"
            ],
            "correctAnswer": 1,
            "explanation": "Loops are control structures that repeat a block of code multiple times based on a condition. They help avoid writing repetitive code."
        },
        {
            "id": 2,
            "question": "Which of the following is NOT a loop structure in Java?",
            "options": [
                "while",
                "for",
                "do-while",
                "if-else"
            ],
            "correctAnswer": 3,
            "explanation": "if-else is a selection (decision) statement, not a loop. Java's three loop structures are while, for, and do-while."
        }
    ],
    "5-2": [
        {
            "id": 1,
            "question": "When does a while loop stop executing?",
            "options": [
                "After a fixed number of iterations",
                "When the loop condition becomes false",
                "When the program ends",
                "When a return statement is reached"
            ],
            "correctAnswer": 1,
            "explanation": "A while loop continues to execute as long as its condition is true. It stops when the condition evaluates to false."
        },
        {
            "id": 2,
            "question": "What happens if the condition of a while loop is initially false?",
            "options": [
                "The loop executes once",
                "The loop body never executes",
                "An error occurs",
                "The loop runs indefinitely"
            ],
            "correctAnswer": 1,
            "explanation": "If the while loop condition is false from the start, the loop body is never executed. The program skips the loop entirely."
        }
    ],
    "5-3": [
        {
            "id": 1,
            "question": "How does a do-while loop differ from a while loop?",
            "options": [
                "It runs faster",
                "It always executes the loop body at least once",
                "It does not need a condition",
                "It can only run a fixed number of times"
            ],
            "correctAnswer": 1,
            "explanation": "A do-while loop checks its condition after executing the loop body, guaranteeing that the body executes at least once, unlike a while loop which checks the condition first."
        },
        {
            "id": 2,
            "question": "Where is the condition checked in a do-while loop?",
            "options": [
                "Before the loop body",
                "After the loop body",
                "In the middle of the loop body",
                "Conditions are not needed"
            ],
            "correctAnswer": 1,
            "explanation": "In a do-while loop, the condition is checked after the loop body executes. The syntax is: do { statements; } while (condition);"
        }
    ],
    "5-4": [
        {
            "id": 1,
            "question": "What are the three parts of a for loop header in Java?",
            "options": [
                "condition, body, return",
                "initialization, condition, update",
                "start, end, step",
                "input, process, output"
            ],
            "correctAnswer": 1,
            "explanation": "A for loop has three parts: initialization (runs once), condition (checked before each iteration), and update (runs after each iteration). Syntax: for (init; condition; update) { body; }"
        },
        {
            "id": 2,
            "question": "How many times does this loop execute: for (int i = 0; i < 5; i++)?",
            "options": [
                "4 times",
                "5 times",
                "6 times",
                "Infinite"
            ],
            "correctAnswer": 1,
            "explanation": "The loop starts at i=0 and runs while i < 5, so it executes for i = 0, 1, 2, 3, 4 — a total of 5 times."
        }
    ],
    "5-5": [
        {
            "id": 1,
            "question": "When is a for loop the best choice?",
            "options": [
                "When you don't know how many times to loop",
                "When you need the loop to run at least once",
                "When you know the exact number of iterations",
                "When there is no condition"
            ],
            "correctAnswer": 2,
            "explanation": "A for loop is ideal when you know the number of iterations in advance, as it combines initialization, condition, and update in one line."
        },
        {
            "id": 2,
            "question": "When would you choose a do-while loop over a while loop?",
            "options": [
                "When you need better performance",
                "When the loop must execute at least once before checking the condition",
                "When you know the number of iterations",
                "When the loop has no condition"
            ],
            "correctAnswer": 1,
            "explanation": "Use a do-while loop when the loop body must execute at least once regardless of the condition, such as when displaying a menu and getting user input."
        }
    ],
    "5-6": [
        {
            "id": 1,
            "question": "In nested loops, how many total iterations occur with an outer loop of 3 and inner loop of 4?",
            "options": [
                "7",
                "12",
                "3",
                "4"
            ],
            "correctAnswer": 1,
            "explanation": "In nested loops, the inner loop runs completely for each iteration of the outer loop. So 3 (outer) * 4 (inner) = 12 total iterations of the inner loop body."
        },
        {
            "id": 2,
            "question": "In nested loops, which loop completes all its iterations first?",
            "options": [
                "The outer loop",
                "The inner loop",
                "Both complete simultaneously",
                "It depends on the condition"
            ],
            "correctAnswer": 1,
            "explanation": "The inner loop completes all its iterations for each single iteration of the outer loop. The outer loop advances only after the inner loop finishes."
        }
    ],
    "5-7": [
        {
            "id": 1,
            "question": "Why can floating-point numbers cause issues in loop conditions?",
            "options": [
                "They are too large for loops",
                "They cannot be used in conditions",
                "Precision errors can cause unexpected behavior",
                "They make loops run slower"
            ],
            "correctAnswer": 2,
            "explanation": "Floating-point numbers have limited precision, so accumulated small errors can cause loop conditions to behave unexpectedly. For example, adding 0.1 repeatedly may not exactly equal 1.0."
        },
        {
            "id": 2,
            "question": "What is a good strategy to minimize numeric errors in loops?",
            "options": [
                "Use float instead of double",
                "Use integer counters and compute floating-point values from them",
                "Avoid all arithmetic in loops",
                "Use String operations instead"
            ],
            "correctAnswer": 1,
            "explanation": "Using integer loop counters and computing floating-point values from them avoids accumulated floating-point errors. For example, use i/10.0 instead of adding 0.1 each iteration."
        }
    ],
    "5-8": [
        {
            "id": 1,
            "question": "What does the 'break' statement do inside a loop?",
            "options": [
                "Skips the current iteration and continues to the next",
                "Terminates the loop immediately",
                "Pauses the loop temporarily",
                "Restarts the loop from the beginning"
            ],
            "correctAnswer": 1,
            "explanation": "The break statement immediately terminates the innermost loop it is in. Execution continues with the first statement after the loop."
        },
        {
            "id": 2,
            "question": "What does the 'continue' statement do inside a loop?",
            "options": [
                "Terminates the loop",
                "Skips the remaining statements in the current iteration and starts the next iteration",
                "Pauses the loop",
                "Continues to the next loop"
            ],
            "correctAnswer": 1,
            "explanation": "The continue statement skips the remaining statements in the current iteration and jumps to the next iteration of the loop (re-evaluating the condition)."
        }
    ],

    # ============ Chapter 6: Methods ============
    "6-1": [
        {
            "id": 1,
            "question": "What is a method in Java?",
            "options": [
                "A type of variable",
                "A reusable block of code that performs a specific task",
                "A type of loop",
                "A class definition"
            ],
            "correctAnswer": 1,
            "explanation": "A method is a reusable block of code that performs a specific task. Methods help organize code into manageable, reusable pieces (modular programming)."
        },
        {
            "id": 2,
            "question": "What is the main benefit of using methods?",
            "options": [
                "They make programs run faster",
                "They allow code reuse and improve organization",
                "They are required by Java",
                "They replace the need for variables"
            ],
            "correctAnswer": 1,
            "explanation": "Methods promote code reuse and better organization. Instead of duplicating code, you write it once in a method and call it whenever needed."
        }
    ],
    "6-2": [
        {
            "id": 1,
            "question": "Which of the following is a correct method definition in Java?",
            "options": [
                "int add(int a, int b) { return a + b; }",
                "add(int a, int b) { return a + b; }",
                "int add(a, b) { return a + b; }",
                "method add(int a, int b) { return a + b; }"
            ],
            "correctAnswer": 0,
            "explanation": "A method definition requires a return type, method name, and parameter list with types. 'int add(int a, int b) { return a + b; }' is the correct syntax."
        },
        {
            "id": 2,
            "question": "What does the 'return type' in a method signature specify?",
            "options": [
                "The name of the method",
                "The type of value the method sends back to the caller",
                "The number of parameters",
                "The access level of the method"
            ],
            "correctAnswer": 1,
            "explanation": "The return type specifies what type of value the method returns to the caller. If a method returns no value, its return type is 'void'."
        }
    ],
    "6-3": [
        {
            "id": 1,
            "question": "How do you call a method named 'calculateArea' that takes two int parameters?",
            "options": [
                "calculateArea;",
                "call calculateArea(5, 10);",
                "calculateArea(5, 10);",
                "int calculateArea(5, 10);"
            ],
            "correctAnswer": 2,
            "explanation": "You call a method by writing its name followed by arguments in parentheses: calculateArea(5, 10). The arguments must match the parameter types defined in the method."
        },
        {
            "id": 2,
            "question": "What are 'arguments' in a method call?",
            "options": [
                "The return type of the method",
                "The values passed to the method when it is called",
                "The variable names inside the method",
                "The method body statements"
            ],
            "correctAnswer": 1,
            "explanation": "Arguments are the actual values you pass to a method when calling it. They correspond to the parameters defined in the method signature."
        }
    ],
    "6-4": [
        {
            "id": 1,
            "question": "What does the 'void' return type mean in a method?",
            "options": [
                "The method returns null",
                "The method returns 0",
                "The method does not return any value",
                "The method returns an empty string"
            ],
            "correctAnswer": 2,
            "explanation": "A void method does not return any value to the caller. It performs an action (like printing) but doesn't send back a result."
        },
        {
            "id": 2,
            "question": "Can a void method contain a return statement?",
            "options": [
                "No, never",
                "Yes, but only 'return;' without a value to exit the method early",
                "Yes, it can return any value",
                "Only if it's the last statement"
            ],
            "correctAnswer": 1,
            "explanation": "A void method can use 'return;' (without a value) to exit the method early. It cannot return a value since its return type is void."
        }
    ],
    "6-5": [
        {
            "id": 1,
            "question": "In Java, how are primitive type arguments passed to methods?",
            "options": [
                "By reference",
                "By value (a copy is passed)",
                "By pointer",
                "By name"
            ],
            "correctAnswer": 1,
            "explanation": "Java passes primitive type arguments by value, meaning a copy of the value is passed to the method. Changes to the parameter inside the method do not affect the original variable."
        },
        {
            "id": 2,
            "question": "If you change a parameter's value inside a method, does the original argument change?",
            "options": [
                "Yes, always",
                "No, for primitive types the original is unchanged",
                "Only if the parameter is final",
                "Only for int types"
            ],
            "correctAnswer": 1,
            "explanation": "For primitive types, changes to a parameter inside a method do not affect the original argument because Java passes a copy of the value."
        }
    ],
    "6-6": [
        {
            "id": 1,
            "question": "What does 'modularizing code' mean?",
            "options": [
                "Writing code in one long main method",
                "Breaking code into smaller, reusable methods with specific tasks",
                "Using only global variables",
                "Removing all comments from code"
            ],
            "correctAnswer": 1,
            "explanation": "Modularizing code means dividing a program into smaller, manageable methods, each responsible for a specific task. This improves readability, reusability, and maintainability."
        },
        {
            "id": 2,
            "question": "What is 'stepwise refinement' in programming?",
            "options": [
                "Debugging code step by step",
                "Breaking a large problem into smaller sub-problems solved by individual methods",
                "Running code one line at a time",
                "Adding comments after each line"
            ],
            "correctAnswer": 1,
            "explanation": "Stepwise refinement is a top-down approach where a large problem is broken down into smaller, manageable sub-problems, each implemented as a separate method."
        }
    ],
    "6-7": [
        {
            "id": 1,
            "question": "What is method overloading in Java?",
            "options": [
                "Calling a method too many times",
                "Having multiple methods with the same name but different parameter lists",
                "A method that is too long",
                "Overriding a method in a subclass"
            ],
            "correctAnswer": 1,
            "explanation": "Method overloading means defining multiple methods with the same name but different parameter lists (different number, types, or order of parameters). Java determines which to call based on the arguments."
        },
        {
            "id": 2,
            "question": "Can two overloaded methods differ only in return type?",
            "options": [
                "Yes, different return types alone is enough",
                "No, they must differ in their parameter lists",
                "Yes, if they are in different classes",
                "Only if one is static"
            ],
            "correctAnswer": 1,
            "explanation": "Overloaded methods must differ in their parameter lists (number, type, or order of parameters). Differing only in return type causes a compilation error."
        }
    ],
    "6-8": [
        {
            "id": 1,
            "question": "What is the scope of a local variable in Java?",
            "options": [
                "The entire class",
                "The block (method or code block) where it is declared",
                "The entire program",
                "All methods in the same file"
            ],
            "correctAnswer": 1,
            "explanation": "A local variable's scope is limited to the block (method, loop, or if statement) where it is declared. It cannot be accessed outside that block."
        },
        {
            "id": 2,
            "question": "What happens if you try to access a local variable outside its scope?",
            "options": [
                "It returns null",
                "It returns 0",
                "A compilation error occurs",
                "A runtime error occurs"
            ],
            "correctAnswer": 2,
            "explanation": "Accessing a local variable outside its scope causes a compilation error because the variable is not recognized outside the block where it was declared."
        }
    ],

    # ============ Chapter 7: Single-Dimensional Arrays ============
    "7-1": [
        {
            "id": 1,
            "question": "What is an array in Java?",
            "options": [
                "A single variable that stores one value",
                "A data structure that stores a collection of elements of the same type",
                "A type of loop",
                "A method that returns multiple values"
            ],
            "correctAnswer": 1,
            "explanation": "An array is a data structure that stores a fixed-size collection of elements of the same type. It provides indexed access to its elements."
        },
        {
            "id": 2,
            "question": "What is the index of the first element in a Java array?",
            "options": [
                "1",
                "0",
                "-1",
                "It depends on the array"
            ],
            "correctAnswer": 1,
            "explanation": "Java arrays are zero-indexed, meaning the first element has index 0, the second has index 1, and so on. The last element has index length - 1."
        }
    ],
    "7-2": [
        {
            "id": 1,
            "question": "Which statement correctly creates an array of 5 integers?",
            "options": [
                "int[] arr = new int(5);",
                "int[] arr = new int[5];",
                "int arr[] = new int{5};",
                "array int arr = 5;"
            ],
            "correctAnswer": 1,
            "explanation": "The correct syntax is: int[] arr = new int[5]; This creates an array of 5 integers, all initialized to 0 by default."
        },
        {
            "id": 2,
            "question": "How do you access the third element of an array named 'data'?",
            "options": [
                "data[3]",
                "data[2]",
                "data(3)",
                "data.get(2)"
            ],
            "correctAnswer": 1,
            "explanation": "Since arrays are zero-indexed, the third element is at index 2. So data[2] accesses the third element."
        }
    ],
    "7-3": [
        {
            "id": 1,
            "question": "What happens when you assign one array variable to another (e.g., arr2 = arr1)?",
            "options": [
                "The array contents are copied",
                "Both variables reference the same array object",
                "A new array is created automatically",
                "A compilation error occurs"
            ],
            "correctAnswer": 1,
            "explanation": "Assigning arr2 = arr1 copies the reference, not the array contents. Both variables now point to the same array object in memory."
        },
        {
            "id": 2,
            "question": "Which method can be used to properly copy array contents?",
            "options": [
                "arr1 = arr2",
                "System.arraycopy()",
                "arr1.copy(arr2)",
                "Arrays.move()"
            ],
            "correctAnswer": 1,
            "explanation": "System.arraycopy() properly copies array contents from one array to another. A simple assignment only copies the reference, not the actual elements."
        }
    ],
    "7-4": [
        {
            "id": 1,
            "question": "When an array is passed to a method, what is actually passed?",
            "options": [
                "A copy of the entire array",
                "A reference to the array object",
                "The first element only",
                "The array length"
            ],
            "correctAnswer": 1,
            "explanation": "When an array is passed to a method, the reference to the array is passed. This means the method can modify the original array's elements."
        },
        {
            "id": 2,
            "question": "If a method modifies an array element received as a parameter, is the original array affected?",
            "options": [
                "No, a copy is modified",
                "Yes, because the reference to the original array is passed",
                "Only if the array is declared as final",
                "Only for String arrays"
            ],
            "correctAnswer": 1,
            "explanation": "Since the method receives a reference to the original array, any modifications to the array elements inside the method affect the original array."
        }
    ],
    "7-5": [
        {
            "id": 1,
            "question": "Can a method return an array in Java?",
            "options": [
                "No, methods can only return primitive types",
                "Yes, by specifying the array type as the return type",
                "Only void methods can work with arrays",
                "Only static methods can return arrays"
            ],
            "correctAnswer": 1,
            "explanation": "A method can return an array by declaring the return type as an array type. For example: int[] reverseArray(int[] arr) { ... return result; }"
        },
        {
            "id": 2,
            "question": "What is the return type of a method that returns an integer array?",
            "options": [
                "int",
                "int[]",
                "array<int>",
                "Array"
            ],
            "correctAnswer": 1,
            "explanation": "The return type for a method returning an integer array is int[]. For example: public static int[] getScores() { ... }"
        }
    ],
    "7-6": [
        {
            "id": 1,
            "question": "What is linear search?",
            "options": [
                "Searching by dividing the array in half repeatedly",
                "Comparing each element sequentially until the target is found",
                "Sorting the array first then searching",
                "Using a formula to find the element's position"
            ],
            "correctAnswer": 1,
            "explanation": "Linear search checks each element one by one from the beginning until it finds the target or reaches the end of the array. It works on unsorted arrays."
        },
        {
            "id": 2,
            "question": "What is required for binary search to work correctly?",
            "options": [
                "The array must have an even number of elements",
                "The array must be sorted",
                "The array must contain unique elements",
                "The array must be of type int"
            ],
            "correctAnswer": 1,
            "explanation": "Binary search requires the array to be sorted. It works by repeatedly dividing the search space in half, which is only possible with ordered data."
        }
    ],
    "7-7": [
        {
            "id": 1,
            "question": "What is the basic idea behind selection sort?",
            "options": [
                "Insert each element into its correct position",
                "Find the minimum element and swap it to the front, then repeat",
                "Divide the array and sort each half",
                "Compare adjacent elements and swap them"
            ],
            "correctAnswer": 1,
            "explanation": "Selection sort works by repeatedly finding the minimum element from the unsorted portion and placing it at the beginning of that portion."
        },
        {
            "id": 2,
            "question": "What method can be used to sort an array using Java's built-in library?",
            "options": [
                "Array.sort(arr)",
                "arr.sort()",
                "Arrays.sort(arr)",
                "Collections.sort(arr)"
            ],
            "correctAnswer": 2,
            "explanation": "Arrays.sort(arr) from the java.util.Arrays class sorts the array in ascending order. It uses an optimized sorting algorithm internally."
        }
    ],
    "7-8": [
        {
            "id": 1,
            "question": "Which method from the Arrays class converts an array to a readable string?",
            "options": [
                "Arrays.print(arr)",
                "Arrays.toString(arr)",
                "arr.toString()",
                "Arrays.display(arr)"
            ],
            "correctAnswer": 1,
            "explanation": "Arrays.toString(arr) returns a string representation of the array in the format [elem1, elem2, elem3]. This is useful for printing array contents."
        },
        {
            "id": 2,
            "question": "What does Arrays.fill(arr, value) do?",
            "options": [
                "Adds elements to the array",
                "Assigns the specified value to every element in the array",
                "Finds the value in the array",
                "Removes the value from the array"
            ],
            "correctAnswer": 1,
            "explanation": "Arrays.fill(arr, value) sets every element in the array to the specified value. For example, Arrays.fill(arr, 0) sets all elements to 0."
        }
    ],

    # ============ Chapter 8: Multidimensional Arrays ============
    "8-1": [
        {
            "id": 1,
            "question": "What is a two-dimensional array?",
            "options": [
                "An array with two elements",
                "An array of arrays, organized in rows and columns",
                "Two separate arrays linked together",
                "An array that can only hold two data types"
            ],
            "correctAnswer": 1,
            "explanation": "A two-dimensional array is an array of arrays, organized like a table with rows and columns. It can be used to represent matrices, grids, or tables of data."
        },
        {
            "id": 2,
            "question": "How do you access an element in a 2D array at row 2, column 3?",
            "options": [
                "arr[2, 3]",
                "arr[2][3]",
                "arr(2)(3)",
                "arr.get(2, 3)"
            ],
            "correctAnswer": 1,
            "explanation": "In Java, 2D array elements are accessed using two indices: arr[row][column]. So arr[2][3] accesses row 2, column 3 (both zero-indexed)."
        }
    ],
    "8-2": [
        {
            "id": 1,
            "question": "Which statement correctly creates a 3x4 two-dimensional integer array?",
            "options": [
                "int[][] arr = new int[3, 4];",
                "int[][] arr = new int[3][4];",
                "int arr[][] = new int(3)(4);",
                "int[3][4] arr = new int[][];"
            ],
            "correctAnswer": 1,
            "explanation": "The correct syntax is: int[][] arr = new int[3][4]; This creates an array with 3 rows and 4 columns."
        },
        {
            "id": 2,
            "question": "What does matrix.length return for a 2D array?",
            "options": [
                "The total number of elements",
                "The number of rows",
                "The number of columns",
                "The number of dimensions"
            ],
            "correctAnswer": 1,
            "explanation": "For a 2D array, matrix.length returns the number of rows. To get the number of columns in row i, use matrix[i].length."
        }
    ],
    "8-3": [
        {
            "id": 1,
            "question": "How many nested loops are typically needed to traverse all elements of a 2D array?",
            "options": [
                "1",
                "2",
                "3",
                "It depends on the array size"
            ],
            "correctAnswer": 1,
            "explanation": "Traversing a 2D array typically requires 2 nested loops: the outer loop iterates through rows and the inner loop iterates through columns within each row."
        },
        {
            "id": 2,
            "question": "What is the correct way to get the number of columns in row i of a 2D array named 'grid'?",
            "options": [
                "grid.columns",
                "grid[i].length",
                "grid.length[i]",
                "grid.width(i)"
            ],
            "correctAnswer": 1,
            "explanation": "grid[i].length returns the number of columns (elements) in row i. Each row in a 2D array is itself an array, so you use .length on that row."
        }
    ],
    "8-4": [
        {
            "id": 1,
            "question": "What is the correct way to pass a 2D array to a method?",
            "options": [
                "void process(int arr[][])",
                "void process(int[][] arr)",
                "void process(int[] arr[])",
                "All of the above are valid"
            ],
            "correctAnswer": 3,
            "explanation": "Java allows multiple syntaxes for 2D array parameters: int[][] arr, int arr[][], and int[] arr[] are all valid ways to declare a 2D array parameter."
        },
        {
            "id": 2,
            "question": "When a 2D array is passed to a method, can the method modify the original array?",
            "options": [
                "No, a copy is always made",
                "Yes, because the reference is passed",
                "Only the first row can be modified",
                "Only if the method is static"
            ],
            "correctAnswer": 1,
            "explanation": "Like 1D arrays, 2D arrays are passed by reference. The method receives a reference to the original array, so modifications affect the original."
        }
    ],
    "8-5": [
        {
            "id": 1,
            "question": "What is a ragged array?",
            "options": [
                "An array with errors",
                "A 2D array where each row can have a different number of columns",
                "An array that is not initialized",
                "An array with negative indices"
            ],
            "correctAnswer": 1,
            "explanation": "A ragged (or jagged) array is a 2D array where rows can have different lengths. Each row is an independent array that can be of any size."
        },
        {
            "id": 2,
            "question": "How do you create a ragged array with 3 rows in Java?",
            "options": [
                "int[][] arr = new int[3][];",
                "int[][] arr = new int[][3];",
                "int[][] arr = new ragged[3];",
                "int[][] arr = {3};"
            ],
            "correctAnswer": 0,
            "explanation": "To create a ragged array, specify only the number of rows: int[][] arr = new int[3][]; Then create each row individually: arr[0] = new int[2]; arr[1] = new int[5]; etc."
        }
    ],

    # ============ Chapter 9: Objects and Classes ============
    "9-1": [
        {
            "id": 1,
            "question": "What is a class in object-oriented programming?",
            "options": [
                "A type of variable",
                "A blueprint or template for creating objects",
                "A built-in Java method",
                "A type of array"
            ],
            "correctAnswer": 1,
            "explanation": "A class is a blueprint or template that defines the properties (data fields) and behaviors (methods) that objects created from it will have."
        },
        {
            "id": 2,
            "question": "What is an object?",
            "options": [
                "A keyword in Java",
                "An instance of a class with its own data values",
                "A type of data field",
                "A static method"
            ],
            "correctAnswer": 1,
            "explanation": "An object is a specific instance of a class. It has its own set of data field values defined by the class blueprint. For example, different Circle objects can have different radii."
        }
    ],
    "9-2": [
        {
            "id": 1,
            "question": "What are the two main components of a class definition?",
            "options": [
                "Import statements and main method",
                "Data fields (properties) and methods (behaviors)",
                "Constructors and destructors",
                "Variables and loops"
            ],
            "correctAnswer": 1,
            "explanation": "A class definition contains data fields (instance variables that store the object's state) and methods (that define the object's behaviors and actions)."
        },
        {
            "id": 2,
            "question": "What keyword is used to create a new object from a class?",
            "options": [
                "create",
                "object",
                "new",
                "instance"
            ],
            "correctAnswer": 2,
            "explanation": "The 'new' keyword creates a new object (instance) of a class. For example: Circle c = new Circle(); creates a new Circle object."
        }
    ],
    "9-3": [
        {
            "id": 1,
            "question": "What is a constructor in Java?",
            "options": [
                "A method that destroys objects",
                "A special method that initializes objects when they are created",
                "A method that returns the class name",
                "A static method in every class"
            ],
            "correctAnswer": 1,
            "explanation": "A constructor is a special method called when an object is created using 'new'. It initializes the object's data fields. It has the same name as the class and no return type."
        },
        {
            "id": 2,
            "question": "What happens if you don't define any constructor in a class?",
            "options": [
                "The class cannot create objects",
                "Java provides a default no-arg constructor",
                "A compilation error occurs",
                "All fields are set to null"
            ],
            "correctAnswer": 1,
            "explanation": "If no constructor is defined, Java automatically provides a default no-arg constructor that initializes fields to their default values (0 for numbers, false for boolean, null for objects)."
        }
    ],
    "9-4": [
        {
            "id": 1,
            "question": "What is a reference variable in Java?",
            "options": [
                "A variable that stores a primitive value",
                "A variable that stores the memory address of an object",
                "A variable declared with the keyword 'ref'",
                "A variable that cannot be changed"
            ],
            "correctAnswer": 1,
            "explanation": "A reference variable holds the memory address (reference) of an object, not the object itself. It allows you to access the object's data and methods."
        },
        {
            "id": 2,
            "question": "What does the dot operator (.) do in Java?",
            "options": [
                "Concatenates strings",
                "Accesses an object's members (fields and methods)",
                "Compares two values",
                "Separates package names only"
            ],
            "correctAnswer": 1,
            "explanation": "The dot operator (.) is used to access an object's data fields and methods. For example, circle1.getRadius() calls the getRadius method on the circle1 object."
        }
    ],
    "9-5": [
        {
            "id": 1,
            "question": "Which Java library class is used to generate random numbers?",
            "options": [
                "java.util.Random",
                "java.util.Number",
                "java.lang.Math only",
                "java.util.Generate"
            ],
            "correctAnswer": 0,
            "explanation": "The java.util.Random class provides methods to generate various types of random numbers. While Math.random() also works, the Random class offers more methods like nextInt(bound)."
        },
        {
            "id": 2,
            "question": "What must you do before using a class from the java.util package?",
            "options": [
                "Nothing, all classes are available automatically",
                "Import it using an import statement",
                "Download it separately",
                "Declare it as static"
            ],
            "correctAnswer": 1,
            "explanation": "Classes from the java.util package must be imported using an import statement (e.g., import java.util.Scanner;). Only classes in java.lang are automatically available."
        }
    ],
    "9-6": [
        {
            "id": 1,
            "question": "What does the 'static' keyword mean for a variable?",
            "options": [
                "The variable cannot be changed",
                "The variable belongs to the class and is shared by all instances",
                "The variable is only accessible in the main method",
                "The variable is stored on the heap"
            ],
            "correctAnswer": 1,
            "explanation": "A static variable belongs to the class rather than any specific instance. All objects of the class share the same static variable."
        },
        {
            "id": 2,
            "question": "Can you call a static method without creating an object?",
            "options": [
                "No, an object is always required",
                "Yes, using the class name (e.g., ClassName.method())",
                "Only if the method is void",
                "Only in the main method"
            ],
            "correctAnswer": 1,
            "explanation": "Static methods can be called using the class name directly, without creating an instance. For example, Math.sqrt(25) calls the static sqrt method of the Math class."
        }
    ],
    "9-7": [
        {
            "id": 1,
            "question": "What does the 'private' visibility modifier do?",
            "options": [
                "Makes the member accessible from anywhere",
                "Makes the member accessible only within the same class",
                "Makes the member accessible only to subclasses",
                "Makes the member accessible within the same package"
            ],
            "correctAnswer": 1,
            "explanation": "The 'private' modifier restricts access to the member (field or method) to only within the same class where it is declared. Other classes cannot access it directly."
        },
        {
            "id": 2,
            "question": "What does the 'public' visibility modifier do?",
            "options": [
                "Makes the member accessible only within the same class",
                "Makes the member accessible from any class",
                "Makes the member accessible only to subclasses",
                "Makes the member static"
            ],
            "correctAnswer": 1,
            "explanation": "The 'public' modifier allows the member to be accessed from any class in any package. It provides the widest level of access."
        }
    ],
    "9-8": [
        {
            "id": 1,
            "question": "What is data field encapsulation?",
            "options": [
                "Making all fields public",
                "Making fields private and providing getter/setter methods",
                "Removing all data fields",
                "Using arrays to store fields"
            ],
            "correctAnswer": 1,
            "explanation": "Data field encapsulation means making data fields private and providing public getter and setter methods to access and modify them. This protects data integrity."
        },
        {
            "id": 2,
            "question": "What is the standard naming convention for a getter method of a field named 'radius'?",
            "options": [
                "radius()",
                "getRadius()",
                "readRadius()",
                "fetchRadius()"
            ],
            "correctAnswer": 1,
            "explanation": "By Java convention, getter methods are named with 'get' prefix followed by the field name with the first letter capitalized: getRadius(). For boolean fields, 'is' prefix is used."
        }
    ],
    "9-9": [
        {
            "id": 1,
            "question": "When an object is passed to a method in Java, what is actually passed?",
            "options": [
                "A copy of the entire object",
                "A copy of the reference to the object",
                "The object's class definition",
                "Only the object's data fields"
            ],
            "correctAnswer": 1,
            "explanation": "When an object is passed to a method, a copy of the reference (memory address) is passed. This means the method can modify the object's state through the reference."
        },
        {
            "id": 2,
            "question": "If a method changes the data fields of a passed object, is the original object affected?",
            "options": [
                "No, objects are always copied",
                "Yes, because the method has a reference to the same object",
                "Only if the object is declared final",
                "Only for String objects"
            ],
            "correctAnswer": 1,
            "explanation": "Since the method receives a reference to the same object, any changes to the object's data fields inside the method affect the original object."
        }
    ],

    # ============ Chapter 10: Object-Oriented Thinking ============
    "10-1": [
        {
            "id": 1,
            "question": "What is the key difference between procedural and object-oriented programming?",
            "options": [
                "Procedural is faster than OOP",
                "OOP organizes code around objects with data and behavior, procedural around functions",
                "OOP doesn't use methods",
                "Procedural doesn't use variables"
            ],
            "correctAnswer": 1,
            "explanation": "Procedural programming focuses on functions/procedures operating on data, while OOP organizes code around objects that combine data (fields) and behavior (methods) together."
        },
        {
            "id": 2,
            "question": "What does 'thinking in objects' mean when designing a program?",
            "options": [
                "Using only primitive data types",
                "Identifying real-world entities and modeling them as classes with properties and behaviors",
                "Writing code without methods",
                "Avoiding the use of loops"
            ],
            "correctAnswer": 1,
            "explanation": "Thinking in objects means identifying real-world entities relevant to the problem and modeling them as classes with appropriate data fields (properties) and methods (behaviors)."
        }
    ],
    "10-2": [
        {
            "id": 1,
            "question": "What is class abstraction?",
            "options": [
                "Making a class that cannot be instantiated",
                "Separating the class interface from its implementation details",
                "Creating abstract art with code",
                "Using only abstract methods"
            ],
            "correctAnswer": 1,
            "explanation": "Class abstraction means separating the class's public interface (what the class does) from its implementation details (how it does it). Users interact with the class through its public methods."
        },
        {
            "id": 2,
            "question": "How does encapsulation support abstraction?",
            "options": [
                "By making all methods public",
                "By hiding implementation details and exposing only a clean interface",
                "By using only static methods",
                "By avoiding the use of data fields"
            ],
            "correctAnswer": 1,
            "explanation": "Encapsulation hides the internal implementation details (private fields, helper methods) and exposes only a clean public interface. Users don't need to know how the class works internally."
        }
    ],
    "10-3": [
        {
            "id": 1,
            "question": "When modeling a real-world entity as a class, what should the data fields represent?",
            "options": [
                "Methods of the entity",
                "Properties or attributes of the entity",
                "Other classes",
                "Only numeric values"
            ],
            "correctAnswer": 1,
            "explanation": "Data fields should represent the properties or attributes of the real-world entity. For a Student class, fields might be name, age, and GPA."
        },
        {
            "id": 2,
            "question": "What should methods in a class represent when thinking in objects?",
            "options": [
                "The properties of the entity",
                "The behaviors or actions the entity can perform",
                "The data types used",
                "The constructors only"
            ],
            "correctAnswer": 1,
            "explanation": "Methods represent the behaviors or actions that the entity can perform. For a BankAccount class, methods might be deposit(), withdraw(), and getBalance()."
        }
    ],
    "10-4": [
        {
            "id": 1,
            "question": "What is an 'association' between classes?",
            "options": [
                "One class inherits from another",
                "A general relationship where one class uses or interacts with another",
                "Two classes that are identical",
                "A class that cannot be used with others"
            ],
            "correctAnswer": 1,
            "explanation": "Association is a general relationship where one class uses or interacts with another. For example, a Student class may be associated with a Course class."
        },
        {
            "id": 2,
            "question": "What is the difference between aggregation and composition?",
            "options": [
                "There is no difference",
                "In composition, the contained object cannot exist without the container; in aggregation, it can",
                "Aggregation is stronger than composition",
                "Composition allows sharing objects, aggregation does not"
            ],
            "correctAnswer": 1,
            "explanation": "In composition, the contained object's lifecycle depends on the container (e.g., a Room cannot exist without a House). In aggregation, the contained object can exist independently (e.g., a Student can exist without a University)."
        }
    ],
    "10-5": [
        {
            "id": 1,
            "question": "Why are wrapper classes needed in Java?",
            "options": [
                "To make code more complex",
                "To allow primitive values to be used where objects are required",
                "To replace primitive types entirely",
                "To encrypt data"
            ],
            "correctAnswer": 1,
            "explanation": "Wrapper classes (Integer, Double, Character, etc.) allow primitive values to be treated as objects. This is needed for collections like ArrayList that can only store objects."
        },
        {
            "id": 2,
            "question": "What is autoboxing in Java?",
            "options": [
                "Manually creating wrapper objects",
                "Automatic conversion of a primitive to its wrapper type",
                "Converting a wrapper to a primitive",
                "Packaging classes into a JAR file"
            ],
            "correctAnswer": 1,
            "explanation": "Autoboxing is Java's automatic conversion of a primitive type to its corresponding wrapper class. For example, Integer x = 5; automatically converts the int 5 to an Integer object."
        }
    ],
    "10-6": [
        {
            "id": 1,
            "question": "When should you use BigInteger instead of long?",
            "options": [
                "When you need faster calculations",
                "When you need to represent integers larger than Long.MAX_VALUE",
                "When you need decimal numbers",
                "Always, for better precision"
            ],
            "correctAnswer": 1,
            "explanation": "BigInteger should be used when you need to work with integers that exceed the range of long (which is about 9.2 * 10^18). BigInteger can represent arbitrarily large integers."
        },
        {
            "id": 2,
            "question": "How do you add two BigInteger values?",
            "options": [
                "a + b",
                "a.add(b)",
                "BigInteger.add(a, b)",
                "add(a, b)"
            ],
            "correctAnswer": 1,
            "explanation": "BigInteger uses method calls instead of operators. To add two BigInteger values, use: result = a.add(b). You cannot use the + operator with BigInteger."
        }
    ],
    "10-7": [
        {
            "id": 1,
            "question": "What does the substring(2, 5) method return for the string \"HelloWorld\"?",
            "options": [
                "\"llo\"",
                "\"lloW\"",
                "\"ell\"",
                "\"lo\""
            ],
            "correctAnswer": 0,
            "explanation": "substring(2, 5) returns characters from index 2 (inclusive) to index 5 (exclusive). For \"HelloWorld\", indices 2, 3, 4 are 'l', 'l', 'o', giving \"llo\"."
        },
        {
            "id": 2,
            "question": "What does the indexOf(\"Java\") method return if the substring is not found?",
            "options": [
                "0",
                "null",
                "-1",
                "An exception is thrown"
            ],
            "correctAnswer": 2,
            "explanation": "The indexOf() method returns -1 if the specified substring is not found in the string. If found, it returns the index of the first occurrence."
        }
    ],
    "10-8": [
        {
            "id": 1,
            "question": "What is the key difference between String and StringBuilder?",
            "options": [
                "String is faster than StringBuilder",
                "String is immutable, StringBuilder is mutable",
                "StringBuilder cannot hold text",
                "There is no difference"
            ],
            "correctAnswer": 1,
            "explanation": "String objects are immutable (cannot be modified after creation), while StringBuilder objects are mutable (can be modified in place). StringBuilder is more efficient for frequent string modifications."
        },
        {
            "id": 2,
            "question": "Which method adds text to the end of a StringBuilder?",
            "options": [
                "add()",
                "concat()",
                "append()",
                "insert(0, text)"
            ],
            "correctAnswer": 2,
            "explanation": "The append() method adds text to the end of a StringBuilder. For example: sb.append(\" World\") adds \" World\" to the existing content."
        }
    ]
}


def add_questions_to_files():
    """Add questions to all topic JSON files."""
    files_updated = 0
    files_skipped = 0
    errors = []

    for topic_id, questions in TOPIC_QUESTIONS.items():
        filepath = os.path.join(GENERATED_DIR, f"topic_{topic_id}.json")
        
        if not os.path.exists(filepath):
            errors.append(f"File not found: {filepath}")
            continue
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Add questions field
            data['questions'] = questions
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            files_updated += 1
            print(f"  Updated: topic_{topic_id}.json")
        except Exception as e:
            errors.append(f"Error processing topic_{topic_id}.json: {e}")
    
    print(f"\nDone! Updated {files_updated} files, {files_skipped} skipped")
    if errors:
        print(f"Errors ({len(errors)}):")
        for err in errors:
            print(f"  - {err}")


if __name__ == "__main__":
    print("Adding questions to topic files...")
    add_questions_to_files()
