import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Sparkles, Clock, Target, Code, TrendingUp, Brain } from "lucide-react";

const questions = [
  {
    id: 1,
    title: "Implement Thread-Safe Singleton Pattern",
    description: "Create a thread-safe singleton class using double-checked locking mechanism in Java.",
    difficulty: "Hard",
    estimatedTime: "25 min",
    tags: ["Multithreading", "Design Patterns", "OOP"],
    aiReason: "Based on your weak performance in Multithreading & Concurrency (52%)",
    points: 150,
    completionRate: 42
  },
  {
    id: 2,
    title: "Stream API - Complex Data Transformation",
    description: "Use Java Streams to filter, map, and collect data from a list of custom objects with multiple operations.",
    difficulty: "Medium",
    estimatedTime: "18 min",
    tags: ["Streams API", "Functional Programming", "Collections"],
    aiReason: "Targeted practice for Java Streams API (58% score)",
    points: 100,
    completionRate: 58
  },
  {
    id: 3,
    title: "Producer-Consumer Problem with BlockingQueue",
    description: "Implement the classic producer-consumer pattern using Java's BlockingQueue and multiple threads.",
    difficulty: "Hard",
    estimatedTime: "30 min",
    tags: ["Multithreading", "Concurrency", "Data Structures"],
    aiReason: "Critical weakness: Multithreading & Concurrency concepts",
    points: 200,
    completionRate: 35
  },
  {
    id: 4,
    title: "Custom HashMap Implementation",
    description: "Build a simplified version of HashMap with basic put, get, and collision handling using chaining.",
    difficulty: "Hard",
    estimatedTime: "35 min",
    tags: ["Data Structures", "Hashing", "Collections"],
    aiReason: "Strengthen understanding of Java Collections internals",
    points: 180,
    completionRate: 28
  },
  {
    id: 5,
    title: "JVM Memory Analysis Challenge",
    description: "Analyze and optimize code to reduce memory footprint. Identify memory leaks and suggest GC improvements.",
    difficulty: "Hard",
    estimatedTime: "28 min",
    tags: ["JVM Internals", "Memory Management", "Performance"],
    aiReason: "Low score in JVM Internals & GC (65%)",
    points: 160,
    completionRate: 38
  },
  {
    id: 6,
    title: "Observer Pattern Implementation",
    description: "Implement the Observer design pattern for a weather monitoring system with multiple observers.",
    difficulty: "Medium",
    estimatedTime: "20 min",
    tags: ["Design Patterns", "OOP", "Architecture"],
    aiReason: "Practice for Design Patterns weakness (62%)",
    points: 120,
    completionRate: 52
  },
  {
    id: 7,
    title: "Lambda Expressions & Method References",
    description: "Refactor traditional Java code to use lambda expressions and method references effectively.",
    difficulty: "Medium",
    estimatedTime: "15 min",
    tags: ["Streams API", "Functional Programming", "Java 8+"],
    aiReason: "Build on Java Streams API fundamentals",
    points: 90,
    completionRate: 65
  },
  {
    id: 8,
    title: "Concurrent HashMap vs Synchronized Map",
    description: "Compare performance and implement both approaches. Understand trade-offs in concurrent scenarios.",
    difficulty: "Hard",
    estimatedTime: "32 min",
    tags: ["Multithreading", "Collections", "Performance"],
    aiReason: "Advanced multithreading practice needed",
    points: 170,
    completionRate: 31
  }
];

const getDifficultyConfig = (difficulty) => {
  switch(difficulty) {
    case "Easy":
      return { color: "bg-green-500/20 text-green-400 border-green-500/30", icon: "●" };
    case "Medium":
      return { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: "●●" };
    case "Hard":
      return { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: "●●●" };
    default:
      return { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: "●" };
  }
};

export function PersonalizedQuestions() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-white text-2xl">Personalized Practice Questions</h2>
              <p className="text-sm text-muted-foreground">AI-curated challenges to strengthen your weak areas</p>
            </div>
          </div>
        </div>
        
        <Button variant="outline" className="bg-card/50 border-border/50">
          <Target className="h-4 w-4 mr-2" />
          View All Questions
        </Button>
      </div>

      {/* AI Note Banner */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl border-purple-500/20 p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-white mb-1">AI-Selected for Your Learning Needs</h4>
            <p className="text-sm text-muted-foreground">
              These questions are specifically chosen based on your performance data, focusing on Multithreading, 
              Streams API, Design Patterns, and JVM Internals where you need the most improvement.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Questions Available</p>
              <p className="text-2xl text-white">{questions.length}</p>
            </div>
            <Code className="h-8 w-8 text-blue-400" />
          </div>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Difficulty</p>
              <p className="text-2xl text-yellow-400">Medium+</p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Points</p>
              <p className="text-2xl text-white">1,270</p>
            </div>
            <Target className="h-8 w-8 text-green-400" />
          </div>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Est. Total Time</p>
              <p className="text-2xl text-white">3.5h</p>
            </div>
            <Clock className="h-8 w-8 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Question Cards */}
      <div className="grid grid-cols-1 gap-4">
        {questions.map((question, index) => {
          const difficultyConfig = getDifficultyConfig(question.difficulty);
          
          return (
            <Card
              key={question.id}
              className="bg-card/50 backdrop-blur-xl border-border/50 p-6 hover:bg-card/60 transition-all hover:border-purple-500/30"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Side - Question Details */}
                <div className="flex-1 space-y-4">
                  {/* Title and Difficulty */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">#{question.id}</span>
                        <h3 className="text-white">{question.title}</h3>
                      </div>
                      <Badge className={`${difficultyConfig.color} border ml-2 flex-shrink-0`}>
                        {difficultyConfig.icon} {question.difficulty}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {question.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag, tagIndex) => (
                      <Badge
                        key={tagIndex}
                        variant="outline"
                        className="bg-accent/20 border-border/50 text-white"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* AI Reason */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Sparkles className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-purple-300">
                      <span className="text-purple-400">AI Recommendation:</span> {question.aiReason}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{question.estimatedTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>{question.points} points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>{question.completionRate}% completion rate</span>
                    </div>
                  </div>
                </div>

                {/* Right Side - Action Button */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3">
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white lg:w-32"
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Solve Now
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-muted-foreground hover:text-white"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Load More */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" className="bg-card/50 border-border/50">
          Load More Questions
        </Button>
      </div>
    </div>
  );
}
