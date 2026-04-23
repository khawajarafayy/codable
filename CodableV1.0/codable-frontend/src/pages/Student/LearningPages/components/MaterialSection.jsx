import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { CodeBlock } from './CodeBlock';
import { TopicAccordion } from './TopicAccordion';

export function MaterialSection() {
  const subtopics = [
    {
      id: '1',
      title: 'What is Java?',
      content: 'Java is a high-level, class-based, object-oriented programming language designed to have as few implementation dependencies as possible.'
    },
    {
      id: '2',
      title: 'Java Features',
      content: 'Java is platform-independent, object-oriented, secure, robust, and multithreaded.'
    },
    {
      id: '3',
      title: 'JVM Architecture',
      content: 'The Java Virtual Machine (JVM) is an abstract machine that enables your computer to run a Java program.'
    }
  ];
  
  return (
    <div className="border-r border-gray-800/50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-[#13132B] border-b border-gray-800/50 px-6 py-4 shrink-0">
        <h1 className="text-white flex items-center gap-3">
          Topic: Intro to JAVA
          <span className="px-2 py-1 bg-[#6C63FF]/20 text-[#6C63FF] rounded text-sm">
            Chapter 1
          </span>
        </h1>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Introduction */}
          <section className="bg-[#13132B]/50 rounded-lg p-6 border border-gray-800/50">
            <h2 className="text-white mb-4">Introduction</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Java is one of the most popular programming languages in the world. It's used for building 
              enterprise-scale applications, Android apps, web applications, and much more.
            </p>
            <p className="text-gray-300 leading-relaxed">
              In this lesson, you'll learn the fundamentals of Java programming, including its syntax, 
              basic structure, and how to write your first Java program.
            </p>
          </section>
          
          {/* Your First Java Program */}
          <section className="bg-[#13132B]/50 rounded-lg p-6 border border-gray-800/50">
            <h2 className="text-white mb-4">Your First Java Program</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Every Java program starts with a class definition. Here's the classic "Hello World" example:
            </p>
            
            <CodeBlock 
              language="java"
              code={`public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`}
            />
            
            <div className="mt-4 bg-[#6C63FF]/10 border border-[#6C63FF]/30 rounded-lg p-4">
              <h3 className="text-[#6C63FF] mb-2">💡 Key Points</h3>
              <ul className="text-gray-300 space-y-2 ml-4">
                <li>• <code className="text-[#22D3EE]">public class HelloWorld</code> - Defines a public class named HelloWorld</li>
                <li>• <code className="text-[#22D3EE]">main()</code> - The entry point of any Java program</li>
                <li>• <code className="text-[#22D3EE]">System.out.println()</code> - Prints output to the console</li>
              </ul>
            </div>
          </section>
          
          {/* Understanding Java Syntax */}
          <section className="bg-[#13132B]/50 rounded-lg p-6 border border-gray-800/50">
            <h2 className="text-white mb-4">Understanding Java Syntax</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Java syntax is the set of rules defining how a Java program is written and interpreted.
            </p>
            
            <div className="space-y-3">
              <div className="bg-[#0B0B1A] rounded p-4 border border-gray-800/30">
                <h3 className="text-white mb-2">Semicolons</h3>
                <p className="text-gray-400">Every statement in Java must end with a semicolon (;)</p>
              </div>
              
              <div className="bg-[#0B0B1A] rounded p-4 border border-gray-800/30">
                <h3 className="text-white mb-2">Curly Braces</h3>
                <p className="text-gray-400">Curly braces {'{ }'} define blocks of code and scope</p>
              </div>
              
              <div className="bg-[#0B0B1A] rounded p-4 border border-gray-800/30">
                <h3 className="text-white mb-2">Case Sensitivity</h3>
                <p className="text-gray-400">Java is case-sensitive: 'Hello' and 'hello' are different</p>
              </div>
            </div>
          </section>
          
          {/* Expandable Subtopics */}
          <section className="bg-[#13132B]/50 rounded-lg p-6 border border-gray-800/50">
            <h2 className="text-white mb-4">Additional Topics</h2>
            <TopicAccordion items={subtopics} />
          </section>
          
          {/* Practice Exercise */}
          <section className="bg-gradient-to-br from-[#6C63FF]/10 to-[#22D3EE]/10 rounded-lg p-6 border border-[#6C63FF]/30">
            <h2 className="text-white mb-4">🎯 Practice Exercise</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Now it's your turn! Use the compiler on the right to write a Java program that prints your name.
            </p>
            <p className="text-gray-400">
              Try modifying the Hello World example to display your own message.
            </p>
          </section>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <div className="bg-[#13132B] border-t border-gray-800/50 px-6 py-4 flex items-center justify-between shrink-0">
        <Button 
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <Button 
          className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark as Complete
        </Button>
        
        <Button 
          className="bg-gradient-to-r from-[#6C63FF] to-[#22D3EE] hover:from-[#5B52EE] hover:to-[#11C2DD] text-white"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}