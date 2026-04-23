import { Card } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Progress } from "../../../../components/ui/progress";
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Target,
  FileText,
  Send,
  BarChart3,
  Bell
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

const performanceData = [
  { week: "Week 1", average: 65, submissions: 45 },
  { week: "Week 2", average: 72, submissions: 52 },
  { week: "Week 3", average: 78, submissions: 58 },
  { week: "Week 4", average: 75, submissions: 50 },
  { week: "Week 5", average: 82, submissions: 61 },
  { week: "Week 6", average: 88, submissions: 65 },
];

const topicPerformance = [
  { topic: "OOP", score: 85 },
  { topic: "Collections", score: 78 },
  { topic: "Streams", score: 72 },
  { topic: "Threading", score: 68 },
  { topic: "Design Patterns", score: 75 },
];

const classDistribution = [
  { name: "Excellent (90+)", value: 15, color: "#10b981" },
  { name: "Good (75-89)", value: 25, color: "#3b82f6" },
  { name: "Average (60-74)", value: 35, color: "#f59e0b" },
  { name: "Needs Help (<60)", value: 15, color: "#ef4444" },
];

const classes = [
  {
    id: 1,
    name: "Java Fundamentals - Spring 2024",
    students: 32,
    avgScore: 85,
    completionRate: 78,
    newSubmissions: 12,
    status: "active"
  },
  {
    id: 2,
    name: "Advanced Java - OOP Mastery",
    students: 24,
    avgScore: 78,
    completionRate: 82,
    newSubmissions: 8,
    status: "active"
  },
  {
    id: 3,
    name: "Java Concurrency & Performance",
    students: 18,
    avgScore: 72,
    completionRate: 65,
    newSubmissions: 5,
    status: "active"
  },
];

const recentSubmissions = [
  { id: 1, student: "Rafay Khan", assignment: "Multithreading Exercise", class: "Java Fundamentals", time: "5 mins ago", status: "pending" },
  { id: 2, student: "Sarah Ahmed", assignment: "Collections Framework Lab", class: "Advanced Java", time: "12 mins ago", status: "pending" },
  { id: 3, student: "Ali Hassan", assignment: "Design Patterns Quiz", class: "Java Fundamentals", time: "23 mins ago", status: "pending" },
  { id: 4, student: "Fatima Zahra", assignment: "Stream API Challenge", class: "Advanced Java", time: "1 hour ago", status: "pending" },
  { id: 5, student: "Omar Farooq", assignment: "Exception Handling Task", class: "Java Fundamentals", time: "2 hours ago", status: "reviewed" },
];

const topPerformers = [
  { name: "Rafay Khan", score: 94, assignments: 24, class: "Java Fundamentals" },
  { name: "Sarah Ahmed", score: 92, assignments: 22, class: "Advanced Java" },
  { name: "Zainab Ali", score: 89, assignments: 26, class: "Java Fundamentals" },
  { name: "Hamza Iqbal", score: 87, assignments: 20, class: "Advanced Java" },
];

export function InstructorDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/40 backdrop-blur-xl border-gray-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-blue-400" />
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Active
            </Badge>
          </div>
          <p className="text-2xl text-white mb-1">3</p>
          <p className="text-sm text-muted-foreground">Active Classes</p>
        </Card>

        <Card className="bg-black/40 backdrop-blur-xl border-gray-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-400" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-2xl text-white mb-1">74</p>
          <p className="text-sm text-muted-foreground">Total Students</p>
        </Card>

        <Card className="bg-black/40 backdrop-blur-xl border-gray-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-400" />
            </div>
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
              25 New
            </Badge>
          </div>
          <p className="text-2xl text-white mb-1">25</p>
          <p className="text-sm text-muted-foreground">Pending Reviews</p>
        </Card>

        <Card className="bg-black/40 backdrop-blur-xl border-gray-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-400" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-2xl text-white mb-1">78%</p>
          <p className="text-sm text-muted-foreground">Avg Performance</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <Card className="bg-black/40 backdrop-blur-xl border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white mb-1">Performance Trends</h3>
              <p className="text-sm text-muted-foreground">Average scores and submissions over time</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
              <XAxis 
                dataKey="week" 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <YAxis 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend 
                wrapperStyle={{ color: '#888' }}
              />
              <Line 
                type="monotone" 
                dataKey="average" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Avg Score"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="submissions" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Submissions"
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Student Distribution */}
        <Card className="bg-black/40 backdrop-blur-xl border-gray-800 p-6">
          <div className="mb-6">
            <h3 className="text-white mb-1">Student Distribution</h3>
            <p className="text-sm text-muted-foreground">Performance categories across all classes</p>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={classDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {classDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            {classDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                  <p className="text-sm text-white">{item.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Classes and Submissions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes List */}
        <div className="lg:col-span-2">
          <Card className="bg-black/40 backdrop-blur-xl border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white mb-1">Your Classes</h3>
                <p className="text-sm text-muted-foreground">Overview of all active classes</p>
              </div>
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white">
                Create Class
              </Button>
            </div>

            <div className="space-y-4">
              {classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className="p-5 rounded-xl bg-accent/10 border border-gray-800 hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white">{classItem.name}</h4>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {classItem.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {classItem.students} students
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {classItem.avgScore}% avg
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          {classItem.completionRate}% completion
                        </span>
                      </div>
                    </div>
                    {classItem.newSubmissions > 0 && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        {classItem.newSubmissions} new
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Class Progress</span>
                      <span className="text-white">{classItem.completionRate}%</span>
                    </div>
                    <Progress value={classItem.completionRate} className="h-2" />
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="bg-black/40 border-gray-800 flex-1">
                      <Send className="h-3 w-3 mr-2" />
                      Assign Task
                    </Button>
                    <Button size="sm" variant="outline" className="bg-black/40 border-gray-800 flex-1">
                      <FileText className="h-3 w-3 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="bg-black/40 border-gray-800 flex-1">
                      <BarChart3 className="h-3 w-3 mr-2" />
                      Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Submissions */}
        <div>
          <Card className="bg-black/40 backdrop-blur-xl border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="h-5 w-5 text-orange-400" />
              <div>
                <h3 className="text-white">Recent Submissions</h3>
                <p className="text-sm text-muted-foreground">Needs review</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-3 rounded-lg bg-accent/10 border border-gray-800 hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                        {submission.student.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{submission.student}</p>
                      <p className="text-xs text-muted-foreground truncate">{submission.assignment}</p>
                      <p className="text-xs text-muted-foreground mt-1">{submission.class}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{submission.time}</span>
                    <Badge 
                      className={
                        submission.status === "pending" 
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs"
                          : "bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                      }
                    >
                      {submission.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Row: Topic Performance & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Performance */}
        <Card className="bg-black/40 backdrop-blur-xl border-gray-800 p-6">
          <div className="mb-6">
            <h3 className="text-white mb-1">Topic Performance</h3>
            <p className="text-sm text-muted-foreground">Average scores across Java topics</p>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topicPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
              <XAxis 
                dataKey="topic" 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <YAxis 
                stroke="#888"
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar 
                dataKey="score" 
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Performers */}
        <Card className="bg-black/40 backdrop-blur-xl border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <div>
              <h3 className="text-white">Top Performers</h3>
              <p className="text-sm text-muted-foreground">Students with highest scores</p>
            </div>
          </div>

          <div className="space-y-3">
            {topPerformers.map((student, index) => (
              <div
                key={student.name}
                className="p-4 rounded-lg bg-accent/10 border border-gray-800 hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 text-white flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{student.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{student.score}%</p>
                    <p className="text-xs text-muted-foreground">{student.assignments} tasks</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
