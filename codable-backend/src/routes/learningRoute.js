import express from 'express';
import axios from 'axios';

const router = express.Router();
const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:5001/api';

// Get all chapters with their topics
router.get('/chapters', async (req, res) => {
  try {
    const response = await axios.get(`${RAG_API_URL}/chapters`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching chapters:', error.message);
    // Return fallback data if RAG API is not available
    res.json({
      success: true,
      chapters: getFallbackChapters()
    });
  }
});

// Get topics for a specific chapter
router.get('/chapters/:chapterId/topics', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const response = await axios.get(`${RAG_API_URL}/chapter/${chapterId}/topics`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching topics:', error.message);
    // Return fallback data
    const chapterId = parseInt(req.params.chapterId);
    res.json({
      success: true,
      chapter_id: chapterId,
      topics: getFallbackTopics(chapterId)
    });
  }
});

// Get content for a specific topic
router.get('/topics/:topicId/content', async (req, res) => {
  try {
    const { topicId } = req.params;
    const response = await axios.get(`${RAG_API_URL}/topic/${topicId}/content`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching content:', error.message);
    // Return fallback content
    const topicId = req.params.topicId;
    res.json({
      success: true,
      topic_id: topicId,
      topic: { title: `Topic ${topicId}`, description: 'Learning content' },
      totalPages: 1,
      sections: getFallbackContent(topicId)
    });
  }
});

// Get practice questions for a topic
router.get('/topics/:topicId/questions', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { difficulty = 'medium', num = 5 } = req.query;
    
    const response = await axios.get(
      `${RAG_API_URL}/topic/${topicId}/questions`,
      { params: { difficulty, num } }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching questions:', error.message);
    res.json({
      success: true,
      topic_id: req.params.topicId,
      questions: getFallbackQuestions(req.params.topicId)
    });
  }
});

// Get practice questions for a topic (structured for coding exercises)
router.get('/topics/:topicId/practice-questions', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { difficulty = 'easy', num = 3 } = req.query;
    const response = await axios.get(
      `${RAG_API_URL}/topic/${topicId}/practice-questions`,
      { params: { difficulty, num } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching practice questions:', error.message);
    // Return fallback questions
    res.json({
      success: true,
      topic_id: req.params.topicId,
      questions: getDefaultPracticeQuestions(req.params.topicId, req.query.difficulty || 'easy')
    });
  }
});

// Search content
router.post('/search', async (req, res) => {
  try {
    const response = await axios.post(`${RAG_API_URL}/search`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error searching:', error.message);
    res.json({
      success: false,
      error: 'Search service temporarily unavailable'
    });
  }
});

// Validate student solution
router.post('/validate-solution', async (req, res) => {
  try {
    const response = await axios.post(`${RAG_API_URL}/validate-solution`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error validating solution:', error.message);
    res.json({
      success: false,
      error: 'Validation service temporarily unavailable'
    });
  }
});

// Fallback data functions
function getFallbackChapters() {
  return [
    { id: 1, title: 'Introduction to Computers, Programs, and Java', topicCount: 5 },
    { id: 2, title: 'Elementary Programming', topicCount: 6 },
    { id: 3, title: 'Selections', topicCount: 6 },
    { id: 4, title: 'Mathematical Functions, Characters, and Strings', topicCount: 5 },
    { id: 5, title: 'Loops', topicCount: 6 },
    { id: 6, title: 'Methods', topicCount: 6 },
    { id: 7, title: 'Single-Dimensional Arrays', topicCount: 6 },
    { id: 8, title: 'Multidimensional Arrays', topicCount: 4 },
    { id: 9, title: 'Objects and Classes', topicCount: 7 },
    { id: 10, title: 'Thinking in Objects', topicCount: 5 },
  ];
}

function getFallbackTopics(chapterId) {
  const topicsByChapter = {
    1: [
      { id: '1-1', title: 'Introduction to Computers', description: 'Hardware, software, and how computers work', order: 1 },
      { id: '1-2', title: 'Programs and Programming Languages', description: 'Understanding programs and different programming languages', order: 2 },
      { id: '1-3', title: 'Introduction to Java', description: 'Java features, history, and platform independence', order: 3 },
      { id: '1-4', title: 'Your First Java Program', description: 'Writing, compiling, and running your first Java program', order: 4 },
      { id: '1-5', title: 'Java Development Environment', description: 'Setting up JDK, IDEs, and development tools', order: 5 },
    ],
    2: [
      { id: '2-1', title: 'Writing Simple Programs', description: 'Basic structure of Java programs', order: 1 },
      { id: '2-2', title: 'Variables and Data Types', description: 'Declaring variables and primitive data types', order: 2 },
      { id: '2-3', title: 'Reading Input from Console', description: 'Using Scanner class for user input', order: 3 },
      { id: '2-4', title: 'Operators', description: 'Arithmetic, relational, and logical operators', order: 4 },
      { id: '2-5', title: 'Expressions and Assignments', description: 'Writing expressions and assignment statements', order: 5 },
      { id: '2-6', title: 'Type Conversions', description: 'Implicit and explicit type casting', order: 6 },
    ],
    3: [
      { id: '3-1', title: 'Boolean Data Type', description: 'Understanding boolean values and expressions', order: 1 },
      { id: '3-2', title: 'if Statements', description: 'Single-selection if statements', order: 2 },
      { id: '3-3', title: 'if-else Statements', description: 'Two-way selection with if-else', order: 3 },
      { id: '3-4', title: 'Nested if Statements', description: 'Multiple conditions with nested if statements', order: 4 },
      { id: '3-5', title: 'switch Statements', description: 'Multi-way branching with switch', order: 5 },
      { id: '3-6', title: 'Conditional Expressions', description: 'Ternary operator and conditional expressions', order: 6 },
    ],
    4: [
      { id: '4-1', title: 'Mathematical Functions', description: 'Using Math class methods', order: 1 },
      { id: '4-2', title: 'Character Data Type', description: 'Working with char and Unicode', order: 2 },
      { id: '4-3', title: 'String Class', description: 'Creating and using String objects', order: 3 },
      { id: '4-4', title: 'String Methods', description: 'Common String manipulation methods', order: 4 },
      { id: '4-5', title: 'Formatting Output', description: 'printf and String.format methods', order: 5 },
    ],
    5: [
      { id: '5-1', title: 'while Loop', description: 'Understanding while loop structure', order: 1 },
      { id: '5-2', title: 'do-while Loop', description: 'Post-test loop with do-while', order: 2 },
      { id: '5-3', title: 'for Loop', description: 'Counter-controlled for loops', order: 3 },
      { id: '5-4', title: 'Nested Loops', description: 'Loops inside loops', order: 4 },
      { id: '5-5', title: 'break and continue', description: 'Loop control statements', order: 5 },
      { id: '5-6', title: 'Loop Design Strategies', description: 'Common loop patterns and best practices', order: 6 },
    ],
    6: [
      { id: '6-1', title: 'Defining Methods', description: 'Method declaration and signature', order: 1 },
      { id: '6-2', title: 'Calling Methods', description: 'Invoking methods and passing arguments', order: 2 },
      { id: '6-3', title: 'void vs Value-Returning Methods', description: 'Methods with and without return values', order: 3 },
      { id: '6-4', title: 'Pass by Value', description: 'How Java passes arguments to methods', order: 4 },
      { id: '6-5', title: 'Method Overloading', description: 'Creating multiple methods with same name', order: 5 },
      { id: '6-6', title: 'Scope of Variables', description: 'Local variables and their scope', order: 6 },
    ],
    7: [
      { id: '7-1', title: 'Array Basics', description: 'Declaring and creating arrays', order: 1 },
      { id: '7-2', title: 'Array Processing', description: 'Accessing and modifying array elements', order: 2 },
      { id: '7-3', title: 'Enhanced for Loop', description: 'Iterating arrays with for-each', order: 3 },
      { id: '7-4', title: 'Array Methods', description: 'Copying, sorting, and searching arrays', order: 4 },
      { id: '7-5', title: 'Arrays as Parameters', description: 'Passing arrays to methods', order: 5 },
      { id: '7-6', title: 'Variable-Length Arguments', description: 'Varargs in Java methods', order: 6 },
    ],
    8: [
      { id: '8-1', title: 'Two-Dimensional Arrays', description: 'Creating and using 2D arrays', order: 1 },
      { id: '8-2', title: 'Processing 2D Arrays', description: 'Nested loops for 2D array processing', order: 2 },
      { id: '8-3', title: 'Ragged Arrays', description: 'Arrays with different row lengths', order: 3 },
      { id: '8-4', title: 'Multidimensional Arrays', description: 'Arrays with more than two dimensions', order: 4 },
    ],
    9: [
      { id: '9-1', title: 'Defining Classes', description: 'Class structure and components', order: 1 },
      { id: '9-2', title: 'Creating Objects', description: 'Object instantiation with new', order: 2 },
      { id: '9-3', title: 'Constructors', description: 'Default and parameterized constructors', order: 3 },
      { id: '9-4', title: 'Instance Variables and Methods', description: 'Object state and behavior', order: 4 },
      { id: '9-5', title: 'Static Members', description: 'Class variables and methods', order: 5 },
      { id: '9-6', title: 'Visibility Modifiers', description: 'public, private, and protected', order: 6 },
      { id: '9-7', title: 'Data Encapsulation', description: 'Getters, setters, and data hiding', order: 7 },
    ],
    10: [
      { id: '10-1', title: 'Object-Oriented Design', description: 'Principles of OO design', order: 1 },
      { id: '10-2', title: 'Class Relationships', description: 'Association, aggregation, composition', order: 2 },
      { id: '10-3', title: 'Designing Classes', description: 'Best practices for class design', order: 3 },
      { id: '10-4', title: 'Immutable Objects', description: 'Creating immutable classes', order: 4 },
      { id: '10-5', title: 'this Reference', description: 'Using this keyword effectively', order: 5 },
    ],
  };
  
  return topicsByChapter[chapterId] || [];
}

function getFallbackContent(topicId) {
  return [{
    id: `${topicId}-section-1`,
    title: 'Introduction',
    content: `This is the learning content for topic ${topicId}. The RAG system will provide detailed content from the Java textbook once it's running.`,
    page: 1
  }];
}

function getFallbackQuestions(topicId) {
  return [{
    id: 1,
    question: 'What is the output of the following code?',
    type: 'multiple-choice',
    difficulty: 'medium',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 0
  }];
}

function getDefaultPracticeQuestions(topicId, difficulty) {
  // Parse topic ID to provide topic-specific questions
  const parts = topicId.split('-');
  const chapterId = parseInt(parts[0]) || 1;
  const topicNum = parseInt(parts[1]) || 1;
  
  // Topic-specific fallback questions based on chapter
  const topicQuestions = {
    // Chapter 1: Introduction to Java
    '1-7': {  // Simple Java Program
      title: 'Print a Welcome Message',
      description: 'Write a Java program that prints "Welcome to Java!" to the console.',
      expectedOutput: 'Welcome to Java!',
      mustContain: ['System.out.println', 'Welcome to Java'],
      mustNotContain: ['Scanner', 'if', 'else', 'for', 'while'],
      hints: ['Use System.out.println() to print text', 'Put your message in double quotes']
    },
    '1-8': {  // Creating, Compiling, Executing
      title: 'Display Your Name',
      description: 'Write a Java program that displays your name on the screen.',
      expectedOutput: 'Your Name',
      mustContain: ['System.out.println'],
      mustNotContain: ['Scanner', 'if', 'for', 'while'],
      hints: ['Use System.out.println() with your name as a string']
    },
    // Chapter 2: Elementary Programming
    '2-5': {  // Variables
      title: 'Variable Declaration',
      description: 'Declare an integer variable named "age" with value 25, and print it.',
      expectedOutput: '25',
      mustContain: ['int', 'age', '25', 'System.out.println'],
      mustNotContain: ['if', 'else', 'for', 'while', 'Scanner'],
      hints: ['Declare variable with: int variableName = value;', 'Print with System.out.println(variableName)']
    },
    '2-9': {  // Numeric Operations
      title: 'Basic Arithmetic',
      description: 'Declare two integers a=10 and b=5, then print their sum.',
      expectedOutput: '15',
      mustContain: ['int', 'System.out.println'],
      mustNotContain: ['if', 'else', 'for', 'while'],
      hints: ['Use + operator to add numbers', 'Print the result of a + b']
    },
    // Chapter 3: Selections
    '3-3': {  // if Statements
      title: 'Simple If Statement',
      description: 'Declare int number = 10. If number is greater than 5, print "Greater".',
      expectedOutput: 'Greater',
      mustContain: ['if', 'int', 'number', 'System.out.println'],
      mustNotContain: ['for', 'while', 'Scanner'],
      hints: ['Use if (condition) { } syntax', 'Compare using > operator']
    },
    '3-4': {  // if-else Statements
      title: 'If-Else Decision',
      description: 'Declare int score = 75. If score >= 60, print "Pass", else print "Fail".',
      expectedOutput: 'Pass',
      mustContain: ['if', 'else', 'int', 'System.out.println'],
      mustNotContain: ['for', 'while', 'Scanner'],
      hints: ['Use if-else structure', 'Check condition score >= 60']
    },
    // Chapter 5: Loops
    '5-2': {  // while Loop
      title: 'While Loop Counter',
      description: 'Use a while loop to print numbers 1 to 5, each on a new line.',
      expectedOutput: '1\n2\n3\n4\n5',
      mustContain: ['while', 'System.out.println'],
      mustNotContain: ['for'],
      hints: ['Initialize counter before loop', 'Increment counter inside loop', 'Check counter < 6 or counter <= 5']
    },
    '5-4': {  // for Loop
      title: 'For Loop Counter',
      description: 'Use a for loop to print numbers 1 to 5, each on a new line.',
      expectedOutput: '1\n2\n3\n4\n5',
      mustContain: ['for', 'System.out.println'],
      mustNotContain: ['while'],
      hints: ['Use for(int i = 1; i <= 5; i++) syntax', 'Print i inside the loop']
    }
  };
  
  // Get topic-specific question or use default
  const topicQ = topicQuestions[topicId];
  
  if (topicQ) {
    return [{
      id: 1,
      title: topicQ.title,
      difficulty: difficulty,
      description: topicQ.description,
      constraints: [
        'Your code must compile without errors',
        'Use proper Java syntax',
        `Output should be exactly: ${topicQ.expectedOutput}`
      ],
      examples: [{ input: 'N/A', output: topicQ.expectedOutput }],
      hints: topicQ.hints,
      starterCode: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n        \n    }\n}',
      expectedOutput: topicQ.expectedOutput,
      testCases: [{ input: '', expectedOutput: topicQ.expectedOutput }],
      solutionKeywords: topicQ.mustContain.slice(0, 3),
      mustContain: topicQ.mustContain,
      mustNotContain: topicQ.mustNotContain
    }];
  }
  
  // Default fallback based on chapter
  const chapterDefaults = {
    1: {
      title: 'Hello World Program',
      description: 'Write a Java program that prints "Hello, World!" to the console.',
      expectedOutput: 'Hello, World!',
      mustContain: ['System.out.println', 'Hello, World!'],
      mustNotContain: []
    },
    2: {
      title: 'Variable Practice',
      description: 'Declare a variable and print its value.',
      expectedOutput: 'Hello Java',
      mustContain: ['System.out.println'],
      mustNotContain: ['if', 'for', 'while']
    },
    3: {
      title: 'Condition Practice',
      description: 'Use an if statement to check a condition and print a result.',
      expectedOutput: 'Condition met',
      mustContain: ['if', 'System.out.println'],
      mustNotContain: ['for', 'while']
    },
    5: {
      title: 'Loop Practice',
      description: 'Use a loop to print a sequence of numbers.',
      expectedOutput: '1\n2\n3',
      mustContain: ['System.out.println'],
      mustNotContain: []
    }
  };
  
  const chapterDefault = chapterDefaults[chapterId] || chapterDefaults[1];
  
  return [{
    id: 1,
    title: chapterDefault.title,
    difficulty: difficulty,
    description: chapterDefault.description,
    constraints: [
      'Your code must compile without errors',
      'Use proper Java syntax',
      `Output should match: ${chapterDefault.expectedOutput}`
    ],
    examples: [{ input: 'N/A', output: chapterDefault.expectedOutput }],
    hints: ['Start with the basic structure', 'Test your code before submitting'],
    starterCode: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n        \n    }\n}',
    expectedOutput: chapterDefault.expectedOutput,
    testCases: [{ input: '', expectedOutput: chapterDefault.expectedOutput }],
    solutionKeywords: ['println'],
    mustContain: chapterDefault.mustContain,
    mustNotContain: chapterDefault.mustNotContain
  }];
}

export default router;
