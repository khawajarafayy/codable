import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { PracticeTaskPanel } from './PracticeTaskPanel';
import { PracticeEditor } from './PracticeEditor';
import { FeedbackPanel } from './FeedbackPanel';

export function PracticeMode({ onBackToLearning, topicIndex }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState('editor');
  const [metrics, setMetrics] = useState(null);
  const [code, setCode] = useState(`public class Solution {
    public static void main(String[] args) {
        // Write your code here
        
    }
}`);

  const questions = [
    {
      id: 1,
      title: 'Print Your Name',
      difficulty: 'Easy',
      description: 'Write a Java program that prints your name to the console.',
      constraints: [
        'Use System.out.println() method',
        'Your program must compile without errors',
        'Output should be a single line'
      ],
      examples: [
        { input: 'None', output: 'Your Name' }
      ],
      hints: [
        'Remember that strings in Java are enclosed in double quotes',
        'Every statement must end with a semicolon',
        'The main method is the entry point of your program'
      ]
    },
    {
      id: 2,
      title: 'Simple Addition',
      difficulty: 'Easy',
      description: 'Create a program that adds two numbers (5 and 10) and prints the result.',
      constraints: [
        'Declare two integer variables',
        'Print the sum using System.out.println()',
        'Expected output: 15'
      ],
      examples: [
        { input: 'int a = 5, b = 10', output: '15' }
      ],
      hints: [
        'Use the int data type for whole numbers',
        'Addition in Java uses the + operator',
        'You can print variables directly'
      ]
    },
    {
      id: 3,
      title: 'String Concatenation',
      difficulty: 'Easy',
      description: 'Write a program that combines two strings "Hello" and "Java" with a space between them.',
      constraints: [
        'Use two String variables',
        'Concatenate using the + operator',
        'Print the combined result'
      ],
      examples: [
        { input: 'String str1 = "Hello", str2 = "Java"', output: 'Hello Java' }
      ],
      hints: [
        'String concatenation uses the + operator',
        'Don\'t forget to add a space between the words',
        'Strings are enclosed in double quotes'
      ]
    }
  ];

  const currentQuestion = questions[currentQuestionIndex];

  const handleSubmit = (submittedMetrics) => {
    setMetrics(submittedMetrics);
    setViewMode('feedback');
    console.log('Submitted metrics:', submittedMetrics);
  };


  const handleRunCode = () => {
    console.log('Running code...');
  };

  const handleSubmitCode = () => {
    setViewMode('feedback');
  };

  const handleTryAgain = () => {
    setViewMode('editor');
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setViewMode('editor');
      setCode(`public class Solution {
    public static void main(String[] args) {
        // Write your code here
        
    }
}`);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setViewMode('editor');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0B0B1A]">
      {/* Header */}
      <div className="bg-[#13132B] border-b border-gray-800/50 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToLearning}
            className="text-gray-400 hover:text-white hover:bg-gray-800/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning
          </Button>
          <div className="w-px h-6 bg-gray-700" />
          <h1 className="text-white">Practice: Introduction to Java</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Question {currentQuestionIndex + 1} of {questions.length}</span>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Task Description */}
        <PracticeTaskPanel 
          question={currentQuestion}
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          onPrevious={handlePreviousQuestion}
          onNext={handleNextQuestion}
        />

        {/* Right Panel - Editor or Feedback */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'editor' ? (
            <PracticeEditor
              code={code}
              onChange={setCode}
              onRun={handleRunCode}
              onSubmit={handleSubmit}
              question={currentQuestion}
            />
          ) : (
            <FeedbackPanel
              onTryAgain={handleTryAgain}
              onNextQuestion={handleNextQuestion}
              hasNextQuestion={currentQuestionIndex < questions.length - 1}
              metrics={metrics}
            />
          )}
        </div>
      </div>
    </div>
  );
}
