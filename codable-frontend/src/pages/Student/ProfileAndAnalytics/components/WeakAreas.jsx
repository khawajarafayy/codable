import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Progress } from "../../../../components/ui/progress";
import { AlertTriangle, TrendingDown, BookOpen, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const weakTopics = [
  { 
    topic: "Multithreading & Concurrency", 
    score: 52, 
    attempts: 18,
    avgScore: 78,
    color: "#ef4444"
  },
  { 
    topic: "Java Streams API", 
    score: 58, 
    attempts: 15,
    avgScore: 78,
    color: "#f97316"
  },
  { 
    topic: "Design Patterns", 
    score: 62, 
    attempts: 12,
    avgScore: 78,
    color: "#eab308"
  },
  { 
    topic: "JVM Internals & GC", 
    score: 65, 
    attempts: 10,
    avgScore: 78,
    color: "#f59e0b"
  },
];

const recommendations = [
  {
    icon: BookOpen,
    title: "Master Multithreading",
    description: "Focus on ExecutorService, Locks, and synchronization",
    lessons: 12,
    color: "from-red-500 to-orange-500",
  },
  {
    icon: Target,
    title: "Practice Streams API",
    description: "Master map, filter, reduce, and collectors",
    lessons: 8,
    color: "from-orange-500 to-yellow-500",
  },
  {
    icon: AlertTriangle,
    title: "Learn Design Patterns",
    description: "Understand Singleton, Factory, and Observer patterns",
    lessons: 10,
    color: "from-yellow-500 to-amber-500",
  },
];

export function WeakAreas() {
  return (
    <div className="space-y-6">
      {/* Performance Gap Analysis */}
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingDown className="h-5 w-5 text-orange-400" />
          <h3 className="text-white">Performance Gap Analysis</h3>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weakTopics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="#888" style={{ fontSize: '12px' }} domain={[0, 100]} />
              <YAxis 
                dataKey="topic" 
                type="category" 
                stroke="#888"
                width={150}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(26, 26, 46, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                {weakTopics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
              <Bar dataKey="avgScore" fill="rgba(255,255,255,0.1)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-4">
          Your score vs. platform average (shown in grey)
        </p>
      </Card>

      {/* Detailed Weak Topics */}
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h3 className="text-white mb-6">Topics Needing Attention</h3>
        <div className="space-y-4">
          {weakTopics.map((topic, index) => (
            <div 
              key={index}
              className="p-4 rounded-lg bg-accent/10 border border-border/30"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-white mb-1">{topic.topic}</h4>
                  <p className="text-xs text-muted-foreground">
                    {topic.attempts} attempts • {topic.avgScore - topic.score} points below average
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white">{topic.score}%</p>
                  <p className="text-xs text-muted-foreground">Current Score</p>
                </div>
              </div>
              <Progress value={topic.score} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      {/* Personalized Recommendations */}
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h3 className="text-white mb-6">Personalized Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="p-5 rounded-xl bg-accent/10 border border-border/30 hover:bg-accent/20 transition-colors"
            >
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${rec.color} flex items-center justify-center mb-4`}>
                <rec.icon className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-white mb-2">{rec.title}</h4>
              <p className="text-sm text-muted-foreground mb-4">{rec.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{rec.lessons} lessons</span>
                <Button size="sm" variant="ghost" className="text-xs text-blue-400 hover:text-blue-300">
                  Start Learning →
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Items */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border-blue-500/20 p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-white mb-2">Improve Your Weak Areas</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Focusing on your weak areas can improve your overall score by up to 25%. Start with Multithreading & Concurrency to see the biggest impact.
            </p>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
              Create Study Plan
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
