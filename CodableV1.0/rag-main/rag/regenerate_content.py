"""
Regenerate all topic content with new layout structure
"""
import os
import sys
import json
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from vector import get_relevant_context, load_existing_vector_store
from config import MISTRAL_API_KEY

# Directory for generated content
GENERATED_CONTENT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_content")

# Chapter topics from api.py
CHAPTER_TOPICS = {
    1: {
        "title": "Introduction to Computers, Programs, and Java",
        "topics": [
            {"id": "1-1", "title": "Introduction", "description": "Overview of the chapter and what you will learn", "query": "Introduction to computers programs and Java chapter overview objectives"},
            {"id": "1-2", "title": "What is a Computer?", "description": "Understanding computer hardware and components", "query": "What is a computer hardware CPU memory storage input output devices components"},
            {"id": "1-3", "title": "Programming Languages", "description": "Machine language, assembly language, and high-level languages", "query": "Programming languages machine language assembly language high-level languages compiler interpreter"},
            {"id": "1-4", "title": "Operating Systems", "description": "Role of operating systems in managing computer resources", "query": "Operating systems manage hardware software resources Windows Linux Mac"},
            {"id": "1-5", "title": "Java, the World Wide Web, and Beyond", "description": "History of Java and its role in modern computing", "query": "Java history World Wide Web Sun Microsystems James Gosling internet programming"},
            {"id": "1-6", "title": "The Java Language Specification, API, JDK, and IDE", "description": "Java tools and development environment", "query": "Java JDK API IDE specification development kit environment tools Eclipse NetBeans"},
            {"id": "1-7", "title": "A Simple Java Program", "description": "Writing and understanding your first Java program", "query": "Simple Java program Hello World main method class public static void println"},
            {"id": "1-8", "title": "Creating, Compiling, and Executing a Java Program", "description": "Steps to write, compile, and run Java programs", "query": "Create compile execute Java program javac bytecode JVM virtual machine"},
            {"id": "1-9", "title": "Programming Style and Documentation", "description": "Best practices for writing clean and documented code", "query": "Java programming style documentation comments naming conventions readable code"},
            {"id": "1-10", "title": "Programming Errors", "description": "Types of errors: syntax, runtime, and logic errors", "query": "Programming errors syntax errors runtime errors logic errors debugging"}
        ]
    },
    2: {
        "title": "Elementary Programming",
        "topics": [
            {"id": "2-1", "title": "Introduction to Elementary Programming", "description": "Overview of elementary programming concepts", "query": "Elementary programming introduction basics fundamentals Java"},
            {"id": "2-2", "title": "Writing a Simple Program", "description": "Creating basic Java programs step by step", "query": "Writing simple Java program step by step basic compute area"},
            {"id": "2-3", "title": "Reading Input from the Console", "description": "Using Scanner class to read user input", "query": "Java Scanner class read input console keyboard nextInt nextDouble nextLine"},
            {"id": "2-4", "title": "Identifiers", "description": "Rules for naming variables, methods, and classes", "query": "Java identifiers naming rules variables methods classes conventions"},
            {"id": "2-5", "title": "Variables", "description": "Declaring and using variables to store data", "query": "Java variables declare assign store data values declaration"},
            {"id": "2-6", "title": "Assignment Statements and Assignment Expressions", "description": "Assigning values to variables", "query": "Java assignment statements expressions assign values variables equals"},
            {"id": "2-7", "title": "Named Constants", "description": "Using final keyword for constants", "query": "Java named constants final keyword unchanging values PI"},
            {"id": "2-8", "title": "Naming Conventions", "description": "Standard conventions for naming in Java", "query": "Java naming conventions camelCase style standards variables classes methods"},
            {"id": "2-9", "title": "Numeric Data Types and Operations", "description": "Working with int, double, and other numeric types", "query": "Java numeric data types int double float long byte short arithmetic operations"},
            {"id": "2-10", "title": "Numeric Literals", "description": "How to write numeric values in code", "query": "Java numeric literals integer decimal floating-point scientific notation"},
            {"id": "2-11", "title": "Evaluating Expressions and Operator Precedence", "description": "Order of operations in expressions", "query": "Java expression evaluation operator precedence order of operations arithmetic"},
            {"id": "2-12", "title": "Augmented Assignment Operators", "description": "Shorthand operators like +=, -=, *=", "query": "Java augmented assignment operators += -= *= /= shorthand compound"},
            {"id": "2-13", "title": "Increment and Decrement Operators", "description": "Using ++ and -- operators", "query": "Java increment decrement operators ++ -- prefix postfix"},
            {"id": "2-14", "title": "Type Casting", "description": "Converting between data types", "query": "Java type casting convert data types implicit explicit widening narrowing"},
            {"id": "2-15", "title": "Software Development Process", "description": "Steps in developing software programs", "query": "Software development process requirements analysis design implementation testing"},
            {"id": "2-16", "title": "Common Errors in Elementary Programming", "description": "Common mistakes in elementary programming", "query": "Common Java programming errors mistakes beginners avoid elementary"}
        ]
    },
    3: {
        "title": "Selections",
        "topics": [
            {"id": "3-1", "title": "Introduction to Selections", "description": "Overview of selection statements", "query": "Java selections introduction decision making control flow statements"},
            {"id": "3-2", "title": "boolean Data Type", "description": "Understanding true/false values", "query": "Java boolean data type true false logical values comparison"},
            {"id": "3-3", "title": "if Statements", "description": "Making decisions with if statements", "query": "Java if statement condition decision making one-way selection"},
            {"id": "3-4", "title": "Two-Way if-else Statements", "description": "Choosing between two alternatives", "query": "Java if else statement two-way selection alternative paths"},
            {"id": "3-5", "title": "Nested if and Multi-Way if-else Statements", "description": "Complex decision making with nested conditions", "query": "Java nested if else if multi-way selection statements complex conditions"},
            {"id": "3-6", "title": "Common Errors in Selection Statements", "description": "Avoiding mistakes with if statements", "query": "Common errors mistakes Java if else selection statements dangling else"},
            {"id": "3-7", "title": "Generating Random Numbers", "description": "Using Math.random() for random values", "query": "Java generate random numbers Math.random Random class"},
            {"id": "3-8", "title": "Logical Operators", "description": "Using AND, OR, and NOT operators", "query": "Java logical operators AND OR NOT && || ! boolean expressions"},
            {"id": "3-9", "title": "switch Statements", "description": "Multi-way branching with switch", "query": "Java switch statement case break default multi-way branching"},
            {"id": "3-10", "title": "Conditional Expressions", "description": "Ternary operator for compact conditions", "query": "Java conditional expression ternary operator ?: shorthand if else"},
            {"id": "3-11", "title": "Operator Precedence and Associativity", "description": "Order of evaluation for operators", "query": "Java operator precedence associativity evaluation order rules"}
        ]
    },
    4: {
        "title": "Mathematical Functions, Characters, and Strings",
        "topics": [
            {"id": "4-1", "title": "Introduction", "description": "Overview of math, characters, and strings", "query": "Java mathematical functions characters strings introduction overview"},
            {"id": "4-2", "title": "Common Mathematical Functions", "description": "Using Math class methods", "query": "Java Math class functions abs sqrt pow max min round ceil floor log exp"},
            {"id": "4-3", "title": "Character Data Type and Operations", "description": "Working with char type", "query": "Java char character data type ASCII Unicode encoding operations"},
            {"id": "4-4", "title": "The String Type", "description": "Creating and using String objects", "query": "Java String type create text objects immutable methods length charAt"},
            {"id": "4-5", "title": "Formatting Console Output", "description": "Using printf for formatted output", "query": "Java printf format console output %d %f %s formatting specifiers"}
        ]
    },
    5: {
        "title": "Loops",
        "topics": [
            {"id": "5-1", "title": "Introduction to Loops", "description": "Overview of loop structures", "query": "Java loops introduction iteration repeat control structures"},
            {"id": "5-2", "title": "The while Loop", "description": "Repeating code with while", "query": "Java while loop condition repeat iteration loop-continuation-condition"},
            {"id": "5-3", "title": "The do-while Loop", "description": "Loop that executes at least once", "query": "Java do while loop execute at least once post-test loop"},
            {"id": "5-4", "title": "The for Loop", "description": "Counter-controlled loops", "query": "Java for loop counter controlled iteration initial-action loop-continuation increment"},
            {"id": "5-5", "title": "Which Loop to Use?", "description": "Choosing the right loop type", "query": "Java which loop to use when while for do-while comparison guidelines"},
            {"id": "5-6", "title": "Nested Loops", "description": "Loops inside loops", "query": "Java nested loops inner outer loop multiplication table pattern"},
            {"id": "5-7", "title": "Minimizing Numeric Errors", "description": "Avoiding floating-point issues in loops", "query": "Java minimizing numeric errors floating-point precision loops accumulated"},
            {"id": "5-8", "title": "Keywords break and continue", "description": "Controlling loop execution", "query": "Java break continue keywords exit loop skip iteration terminate"}
        ]
    },
    6: {
        "title": "Methods",
        "topics": [
            {"id": "6-1", "title": "Introduction to Methods", "description": "Overview of methods in Java", "query": "Java methods introduction functions procedures modular programming"},
            {"id": "6-2", "title": "Defining a Method", "description": "How to create methods", "query": "Java defining methods create method signature header body return type parameters"},
            {"id": "6-3", "title": "Calling a Method", "description": "How to invoke methods", "query": "Java calling methods invoke execute method call arguments"},
            {"id": "6-4", "title": "void vs. Value-Returning Methods", "description": "Methods with and without return values", "query": "Java void return value methods returning values return statement"},
            {"id": "6-5", "title": "Passing Arguments by Values", "description": "How arguments are passed to methods", "query": "Java passing arguments by value parameters method pass-by-value copy"},
            {"id": "6-6", "title": "Modularizing Code", "description": "Breaking code into reusable methods", "query": "Java modularizing code reusable methods organize stepwise refinement"},
            {"id": "6-7", "title": "Overloading Methods", "description": "Multiple methods with same name", "query": "Java method overloading same name different parameters signature ambiguous"},
            {"id": "6-8", "title": "The Scope of Variables", "description": "Where variables can be accessed", "query": "Java variable scope local variables access block method lifetime"}
        ]
    },
    7: {
        "title": "Single-Dimensional Arrays",
        "topics": [
            {"id": "7-1", "title": "Introduction to Arrays", "description": "Overview of arrays", "query": "Java arrays introduction collection elements single-dimensional store"},
            {"id": "7-2", "title": "Array Basics", "description": "Creating and using arrays", "query": "Java array basics create declare index element access new size length"},
            {"id": "7-3", "title": "Copying Arrays", "description": "How to copy array contents", "query": "Java copying arrays clone arraycopy System.arraycopy reference vs copy"},
            {"id": "7-4", "title": "Passing Arrays to Methods", "description": "Using arrays as method parameters", "query": "Java passing arrays to methods parameter reference call by reference"},
            {"id": "7-5", "title": "Returning an Array from a Method", "description": "Methods that return arrays", "query": "Java returning array from method return type array reverse"},
            {"id": "7-6", "title": "Searching Arrays", "description": "Finding elements in arrays", "query": "Java searching arrays linear search binary search find element index"},
            {"id": "7-7", "title": "Sorting Arrays", "description": "Arranging array elements in order", "query": "Java sorting arrays selection sort insertion sort Arrays.sort ascending"},
            {"id": "7-8", "title": "The Arrays Class", "description": "Utility methods for arrays", "query": "Java Arrays class utility methods sort fill toString binarySearch equals"}
        ]
    },
    8: {
        "title": "Multidimensional Arrays",
        "topics": [
            {"id": "8-1", "title": "Introduction to Multidimensional Arrays", "description": "Overview of multidimensional arrays", "query": "Java multidimensional arrays introduction 2D two-dimensional matrix table"},
            {"id": "8-2", "title": "Two-Dimensional Array Basics", "description": "Creating and using 2D arrays", "query": "Java two-dimensional 2D array basics row column matrix declare create"},
            {"id": "8-3", "title": "Processing Two-Dimensional Arrays", "description": "Working with 2D array elements", "query": "Java processing two-dimensional arrays nested loops row column traverse"},
            {"id": "8-4", "title": "Passing Two-Dimensional Arrays to Methods", "description": "Using 2D arrays as parameters", "query": "Java passing two-dimensional arrays to methods parameter 2D"},
            {"id": "8-5", "title": "Ragged Arrays", "description": "Arrays with varying row lengths", "query": "Java ragged arrays varying row lengths irregular jagged"}
        ]
    },
    9: {
        "title": "Objects and Classes",
        "topics": [
            {"id": "9-1", "title": "Introduction to Objects and Classes", "description": "Overview of object-oriented programming", "query": "Java objects classes OOP object-oriented programming introduction concepts"},
            {"id": "9-2", "title": "Defining Classes for Objects", "description": "How to create class definitions", "query": "Java defining classes for objects blueprint template data fields methods"},
            {"id": "9-3", "title": "Constructors", "description": "Initializing objects with constructors", "query": "Java constructors initialize objects new keyword no-arg default"},
            {"id": "9-4", "title": "Accessing Objects via Reference Variables", "description": "How reference variables work", "query": "Java reference variables access objects dot operator instance member"},
            {"id": "9-5", "title": "Using Classes from the Java Library", "description": "Working with built-in Java classes", "query": "Java library classes Date Random Point import API built-in"},
            {"id": "9-6", "title": "Static Variables, Constants, and Methods", "description": "Class-level members with static", "query": "Java static variables constants methods class-level shared instance vs static"},
            {"id": "9-7", "title": "Visibility Modifiers", "description": "public, private, and access control", "query": "Java visibility modifiers public private protected access control encapsulation"},
            {"id": "9-8", "title": "Data Field Encapsulation", "description": "Hiding data with getters and setters", "query": "Java encapsulation getter setter methods private data fields accessor mutator"},
            {"id": "9-9", "title": "Passing Objects to Methods", "description": "How objects are passed to methods", "query": "Java passing objects to methods reference parameter object state"}
        ]
    },
    10: {
        "title": "Object-Oriented Thinking",
        "topics": [
            {"id": "10-1", "title": "Introduction to Object-Oriented Thinking", "description": "Thinking in objects", "query": "Java object-oriented thinking design OOP introduction procedural vs OO"},
            {"id": "10-2", "title": "Class Abstraction and Encapsulation", "description": "Hiding implementation details", "query": "Java class abstraction encapsulation hiding implementation class contract"},
            {"id": "10-3", "title": "Thinking in Objects", "description": "Designing with objects in mind", "query": "Java thinking in objects design modeling real-world class design"},
            {"id": "10-4", "title": "Class Relationships", "description": "Association, aggregation, and composition", "query": "Java class relationships association aggregation composition has-a owns"},
            {"id": "10-5", "title": "Wrapper Classes for Primitive Types", "description": "Wrapper classes for primitives", "query": "Java wrapper classes Integer Double Character primitive values objects boxing"},
            {"id": "10-6", "title": "The BigInteger and BigDecimal Classes", "description": "Working with large numbers", "query": "Java BigInteger BigDecimal large numbers arbitrary precision arithmetic"},
            {"id": "10-7", "title": "The String Class Methods", "description": "String methods and operations", "query": "Java String class methods substring length charAt indexOf compareTo replace"},
            {"id": "10-8", "title": "The StringBuilder and StringBuffer Classes", "description": "Mutable string operations", "query": "Java StringBuilder StringBuffer mutable strings append insert delete reverse"}
        ]
    }
}


def get_topic_metadata(topic_id):
    """Get difficulty, estimated time, and next topic for a given topic"""
    parts = topic_id.split('-')
    chapter = int(parts[0]) if parts else 1
    topic_num = int(parts[1]) if len(parts) > 1 else 1
    
    if chapter <= 2:
        difficulty = "Beginner"
    elif chapter <= 5:
        difficulty = "Intermediate"
    elif chapter <= 8:
        difficulty = "Advanced"
    else:
        difficulty = "Expert"
    
    base_time = 5 + (chapter - 1) + (topic_num % 3)
    estimated_time = f"{min(base_time, 15)} min"
    
    # Calculate next topic
    next_topic_id = None
    if chapter in CHAPTER_TOPICS:
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


def generate_content_for_topic(topic_info, chapter_data, use_ai=True):
    """Generate content for a single topic using new layout"""
    from mistralai import Mistral
    import re
    
    topic_id = topic_info['id']
    topic_title = topic_info['title']
    description = topic_info.get('description', '')
    
    print(f"  📝 Generating content for {topic_id}: {topic_title}")
    
    # Get RAG context
    query = topic_info.get('query', topic_title)
    try:
        raw_docs = get_relevant_context(query, k=8)
        raw_context = '\n\n'.join(raw_docs) if raw_docs else ''
    except:
        raw_context = ''
    
    metadata = get_topic_metadata(topic_id)
    
    if use_ai and MISTRAL_API_KEY and raw_context:
        try:
            client = Mistral(api_key=MISTRAL_API_KEY)
            
            prompt = f"""You are a friendly programming tutor creating bite-sized learning content.

📚 TOPIC: {topic_title}
📝 DESCRIPTION: {description}
🎯 TOPIC ID: {topic_id}

RAW TEXTBOOK CONTENT:
---
{raw_context[:6000]}
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
    "content": "Short intro (2-3 lines max).\\n\\n• Bullet point 1\\n• Bullet point 2\\n• Bullet point 3",
    "type": "introduction"
  }},
  {{
    "title": "💡 Concept Explanation",
    "content": "Explain using a real-world analogy first.\\n\\nThen 2-3 short paragraphs with bullet points. Keep it simple!",
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
1. Keep paragraphs SHORT (2-3 lines max)
2. Use bullet points everywhere
3. Include analogies and examples
4. Friendly tone - like a tutor talking
5. Output ONLY valid JSON

Generate content now:"""

            chat_response = client.chat.complete(
                model="mistral-large-latest",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=8192
            )
            
            response_text = chat_response.choices[0].message.content.strip()
            
            # Clean markdown wrapper
            response_text = re.sub(r'^```json\s*\n?', '', response_text)
            response_text = re.sub(r'^```\s*\n?', '', response_text)
            response_text = re.sub(r'\n?\s*```$', '', response_text)
            
            # Extract JSON
            json_match = re.search(r'\[[\s\S]*\]', response_text)
            if json_match:
                sections = json.loads(json_match.group())
                if isinstance(sections, list) and len(sections) >= 5:
                    print(f"    ✅ AI generated {len(sections)} sections")
                    return sections
        except Exception as e:
            print(f"    ⚠️ AI error: {e}")
    
    # Fallback content with new structure
    print(f"    📦 Using fallback content")
    return generate_fallback_content(topic_info)


def generate_fallback_content(topic_info):
    """Generate fallback content with new layout"""
    topic_title = topic_info.get('title', 'this topic')
    description = topic_info.get('description', 'Key programming concepts')
    
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
                {"step": 1, "title": "Start Here", "description": "Begin with the basic structure", "code": "// Your code starts here"},
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
                "description": f"Create a simple program using {topic_title}. Start with the example and modify it!",
                "starterCode": f"// Practice {topic_title} here\npublic class Practice {{\n    public static void main(String[] args) {{\n        // Your code here\n    }}\n}}",
                "hints": ["Start with the basic structure", "Run your code after each change"],
                "solution": "// Solution will vary based on your approach",
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


def regenerate_all_content():
    """Regenerate all topic content files"""
    print("🔄 Loading vector store...")
    try:
        load_existing_vector_store()
        print("✅ Vector store loaded")
    except Exception as e:
        print(f"⚠️ Vector store error: {e}")
    
    os.makedirs(GENERATED_CONTENT_DIR, exist_ok=True)
    
    total_topics = sum(len(ch['topics']) for ch in CHAPTER_TOPICS.values())
    current = 0
    skipped = 0
    
    # Check for already updated files (within last hour)
    from datetime import timedelta
    cutoff_time = datetime.now() - timedelta(hours=1)
    
    print(f"\n📚 Regenerating {total_topics} topics with new layout...\n")
    
    for chapter_id, chapter_data in CHAPTER_TOPICS.items():
        print(f"\n📖 Chapter {chapter_id}: {chapter_data['title']}")
        
        for topic_info in chapter_data['topics']:
            current += 1
            topic_id = topic_info['id']
            filepath = os.path.join(GENERATED_CONTENT_DIR, f"topic_{topic_id}.json")
            
            # Skip if recently updated (has new structure)
            if os.path.exists(filepath):
                mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
                if mtime > cutoff_time:
                    print(f"  [{current}/{total_topics}] {topic_id}: ⏭️ Already updated, skipping")
                    skipped += 1
                    continue
            
            print(f"  [{current}/{total_topics}] {topic_id}: {topic_info['title']}")
            
            # Generate content
            sections = generate_content_for_topic(topic_info, chapter_data, use_ai=True)
            metadata = get_topic_metadata(topic_id)
            
            # Build response data
            response_data = {
                "topic": {
                    "id": topic_id,
                    "title": topic_info['title'],
                    "description": topic_info['description'],
                    "chapter_id": chapter_id,
                    "chapter_title": chapter_data['title']
                },
                "metadata": metadata,
                "sections": sections,
                "total_pages": len(sections),
                "_generated_at": datetime.now().isoformat(),
                "_topic_id": topic_id
            }
            
            # Save to file
            filepath = os.path.join(GENERATED_CONTENT_DIR, f"topic_{topic_id}.json")
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(response_data, f, ensure_ascii=False, indent=2)
            
            print(f"    💾 Saved: {filepath}")
    
    # Update metadata
    metadata_file = os.path.join(GENERATED_CONTENT_DIR, "_metadata.json")
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "total_topics": total_topics,
            "layout_version": "2.0",
            "sections": [
                "🎯 What You'll Learn",
                "💡 Concept Explanation", 
                "📊 Visual Simulation",
                "⚡ Key Points",
                "🔥 Tips & Mistakes (sidebar)",
                "🌍 Real World Use",
                "🧪 Practice Problem",
                "📝 Summary"
            ]
        }, f, indent=2)
    
    print(f"\n✅ Done! Regenerated {total_topics - skipped} topics, skipped {skipped} (already updated).")


if __name__ == "__main__":
    regenerate_all_content()
