import { Book, Code2, Lightbulb, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { CodeBlock } from './CodeBlock';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { FeedbackPanel } from './FeedbackPanel';
import { PracticeEditor } from './PracticeEditor';
import { useNavigate } from 'react-router-dom';

export function LearningContent({ onStartPractice, topicIndex }) {
  const navigate = useNavigate();
  const [showPracticeButton, setShowPracticeButton] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPracticeButton(true);
    }, 2000);

    const handleScroll = (e) => {
      const target = e.target;
      const scrollPosition = target.scrollTop + target.clientHeight;
      const scrollHeight = target.scrollHeight;

      if (scrollHeight - scrollPosition < 200) {
        setShowPracticeButton(true);
      }
    };

    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
    scrollArea?.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      scrollArea?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSubmit = (fb) => {
    setFeedback(fb);
    if (fb) {
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Header / Breadcrumb */}
      <div className="bg-[#13132B] border-b border-gray-800/50 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/student')}
            className="text-gray-300 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-3 text-gray-400">
            <span>Java Fundamentals</span>
            <span>/</span>
            <span className="text-white">Chapter 1: Introduction to Java</span>
          </div>
        </div>

        <div /> {/* right-side placeholder for actions if needed */}
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-5xl mx-auto px-8 py-12 space-y-10">
          {/* Topic Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#6C63FF]/20 to-[#22D3EE]/20 rounded-xl border border-[#6C63FF]/30">
                <Book className="w-7 h-7 text-[#6C63FF]" />
              </div>
              <div>
                <h1 className="text-white text-3xl">Introduction to Java</h1>
                <p className="text-gray-400 mt-1">Chapter 1 • 15 min read</p>
              </div>
            </div>
          </div>

          {/* Introduction Section */}
          <section className="bg-[#13132B]/50 rounded-2xl p-8 border border-gray-800/50 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-[#6C63FF] to-[#22D3EE] rounded-full" />
              <h2 className="text-white">What is Java?</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Java is one of the most popular programming languages in the world. Created by James Gosling
              at Sun Microsystems in 1995, Java was designed with the principle of "Write Once, Run Anywhere" (WORA).
              This means that compiled Java code can run on all platforms that support Java without the need for recompilation.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Java is used for building enterprise-scale applications, Android mobile apps, web applications,
              cloud-based solutions, game development, and much more. Companies like Google, Netflix, Amazon,
              and countless others rely on Java for their critical systems.
            </p>
          </section>

          {/* Key Features */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-[#6C63FF] to-[#22D3EE] rounded-full" />
              <h2 className="text-white">Key Features of Java</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Platform Independent',
                  description: 'Java code runs on any device with JVM installed',
                  icon: '🌐'
                },
                {
                  title: 'Object-Oriented',
                  description: 'Everything in Java is an object, making code modular and reusable',
                  icon: '📦'
                },
                {
                  title: 'Secure',
                  description: 'Built-in security features protect against viruses and malicious code',
                  icon: '🔒'
                },
                {
                  title: 'Multithreaded',
                  description: 'Supports concurrent execution of multiple threads',
                  icon: '⚡'
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-[#13132B]/50 rounded-xl p-6 border border-gray-800/50 hover:border-[#6C63FF]/30 transition-colors"
                >
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* First Java Program */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-[#6C63FF] to-[#22D3EE] rounded-full" />
              <h2 className="text-white">Your First Java Program</h2>
            </div>

            <div className="bg-[#13132B]/50 rounded-2xl p-8 border border-gray-800/50 space-y-4">
              <p className="text-gray-300 leading-relaxed">
                Let's start with the traditional "Hello World" program. This is the simplest Java program
                you can write, and it introduces you to the basic structure of a Java application.
              </p>

              <CodeBlock
                language="java"
                code={`public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`}
              />

              <div className="bg-gradient-to-r from-[#6C63FF]/10 to-[#22D3EE]/10 rounded-xl p-6 border border-[#6C63FF]/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#22D3EE]" />
                  <h3 className="text-[#22D3EE]">Understanding the Code</h3>
                </div>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#6C63FF] shrink-0 mt-0.5" />
                    <div>
                      <code className="text-[#22D3EE] bg-[#0B0B1A]/50 px-2 py-0.5 rounded">public class HelloWorld</code>
                      <span className="text-gray-400"> - Declares a public class named HelloWorld. The class name must match the file name.</span>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#6C63FF] shrink-0 mt-0.5" />
                    <div>
                      <code className="text-[#22D3EE] bg-[#0B0B1A]/50 px-2 py-0.5 rounded">public static void main(String[] args)</code>
                      <span className="text-gray-400"> - The main method is the entry point of any Java program.</span>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#6C63FF] shrink-0 mt-0.5" />
                    <div>
                      <code className="text-[#22D3EE] bg-[#0B0B1A]/50 px-2 py-0.5 rounded">System.out.println()</code>
                      <span className="text-gray-400"> - Prints text to the console and adds a new line.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Java Syntax Rules */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-[#6C63FF] to-[#22D3EE] rounded-full" />
              <h2 className="text-white">Java Syntax Rules</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-[#13132B]/50 rounded-xl p-6 border border-gray-800/50">
                <h3 className="text-white mb-3">1. Case Sensitivity</h3>
                <p className="text-gray-400 mb-3">
                  Java is case-sensitive. This means <code className="text-[#22D3EE] bg-[#0B0B1A]/50 px-2 py-0.5 rounded">Hello</code> and
                  <code className="text-[#22D3EE] bg-[#0B0B1A]/50 px-2 py-0.5 rounded mx-1">hello</code> are considered different identifiers.
                </p>

                <CodeBlock
                  language="java"
                  code={`String name = "Java";  // Correct
String Name = "Java";  // Different variable
// System and system are different!`}
                />
              </div>

              <div className="bg-[#13132B]/50 rounded-xl p-6 border border-gray-800/50">
                <h3 className="text-white mb-3">2. Semicolons</h3>
                <p className="text-gray-400 mb-3">
                  Every statement in Java must end with a semicolon (;). This tells the compiler where one statement ends.
                </p>

                <CodeBlock
                  language="java"
                  code={`System.out.println("Hello");  // Correct
System.out.println("World");  // Correct
// System.out.println("Error")  // Wrong - missing semicolon`}
                />
              </div>

              <div className="bg-[#13132B]/50 rounded-xl p-6 border border-gray-800/50">
                <h3 className="text-white mb-3">3. Curly Braces</h3>
                <p className="text-gray-400 mb-3">
                  Curly braces {'{ }'} define blocks of code and determine scope. They must always come in pairs.
                </p>

                <CodeBlock
                  language="java"
                  code={`public class Example {  // Opening brace
    public static void main(String[] args) {  // Opening brace
        System.out.println("Inside main method");
    }  // Closing brace for main
}  // Closing brace for class`}
                />
              </div>
            </div>
          </section>

          {/* JVM Architecture */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-[#6C63FF] to-[#22D3EE] rounded-full" />
              <h2 className="text-white">How Java Works: JVM Architecture</h2>
            </div>

            <div className="bg-[#13132B]/50 rounded-2xl p-8 border border-gray-800/50 space-y-6">
              <p className="text-gray-300 leading-relaxed">
                Understanding how Java executes your code is crucial. The Java Virtual Machine (JVM) is what makes
                Java platform-independent. Here's the process:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0B0B1A]/50 rounded-xl p-6 border border-gray-800/30 text-center">
                  <div className="w-12 h-12 bg-[#6C63FF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-[#6C63FF]">1</span>
                  </div>
                  <h3 className="text-white mb-2">Write Code</h3>
                  <p className="text-gray-400">You write Java source code (.java files)</p>
                </div>

                <div className="bg-[#0B0B1A]/50 rounded-xl p-6 border border-gray-800/30 text-center">
                  <div className="w-12 h-12 bg-[#6C63FF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-[#6C63FF]">2</span>
                  </div>
                  <h3 className="text-white mb-2">Compile</h3>
                  <p className="text-gray-400">Compiler converts to bytecode (.class files)</p>
                </div>

                <div className="bg-[#0B0B1A]/50 rounded-xl p-6 border border-gray-800/30 text-center">
                  <div className="w-12 h-12 bg-[#6C63FF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-[#6C63FF]">3</span>
                  </div>
                  <h3 className="text-white mb-2">Execute</h3>
                  <p className="text-gray-400">JVM runs the bytecode on any platform</p>
                </div>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="bg-gradient-to-br from-[#6C63FF]/10 via-[#13132B]/50 to-[#22D3EE]/10 rounded-2xl p-8 border border-[#6C63FF]/30 space-y-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-6 h-6 text-[#6C63FF]" />
              <h2 className="text-white">Summary</h2>
            </div>

            <p className="text-gray-300 leading-relaxed">
              You've now learned the fundamentals of Java! You understand what Java is, its key features,
              the basic structure of a Java program, and how the JVM makes Java platform-independent.
            </p>

            <div className="bg-[#0B0B1A]/50 rounded-xl p-6 border border-gray-800/30">
              <h3 className="text-white mb-3">Key Takeaways:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#6C63FF]">•</span>
                  Java is platform-independent, object-oriented, and widely used
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6C63FF]">•</span>
                  Every Java program needs a main() method as an entry point
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6C63FF]">•</span>
                  Java code is compiled to bytecode, then executed by the JVM
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6C63FF]">•</span>
                  Java syntax is case-sensitive and requires semicolons and braces
                </li>
              </ul>
            </div>
          </section>

          {/* Practice Button */}
          <div
            className={`sticky bottom-8 transition-all duration-500 ${
              showPracticeButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <div className="bg-gradient-to-r from-[#6C63FF] to-[#22D3EE] rounded-2xl p-8 text-center space-y-4 shadow-2xl border border-[#6C63FF]/50">
              <h3 className="text-white text-2xl">Ready to Practice?</h3>
              <p className="text-white/90">
                Apply what you've learned with hands-on coding exercises
              </p>

              <Button
                onClick={onStartPractice}
                size="lg"
                className="bg-white text-[#6C63FF] hover:bg-gray-100 px-8 py-6 text-lg h-auto"
              >
                <Code2 className="w-5 h-5 mr-2" />
                Start Practice
              </Button>
            </div>
          </div>

          {/* Spacer */}
          <div className="h-32" />
        </div>
      </ScrollArea>
    </div>
  );
}
