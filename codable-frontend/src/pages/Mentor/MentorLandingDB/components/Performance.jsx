import { Card } from "../../../../components/ui/card";
import { 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend
} from "recharts";

const skillsData = [
  { subject: 'Core Java', score: 92, fullMark: 100 },
  { subject: 'OOP Concepts', score: 88, fullMark: 100 },
  { subject: 'Collections', score: 85, fullMark: 100 },
  { subject: 'Multithreading', score: 68, fullMark: 100 },
  { subject: 'Spring Boot', score: 78, fullMark: 100 },
  { subject: 'JVM & Memory', score: 72, fullMark: 100 },
];

const categoryPerformance = [
  { category: 'Collections', completed: 42, total: 50 },
  { category: 'Streams API', completed: 35, total: 40 },
  { category: 'Exception Handling', completed: 38, total: 40 },
  { category: 'Multithreading', completed: 22, total: 45 },
  { category: 'Spring Framework', completed: 28, total: 50 },
];

const progressOverTime = [
  { month: 'Apr', score: 65 },
  { month: 'May', score: 72 },
  { month: 'Jun', score: 78 },
  { month: 'Jul', score: 82 },
  { month: 'Aug', score: 85 },
  { month: 'Sep', score: 87 },
];

export function Performance() {
  return (
    <div className="space-y-6">
      {/* Skills Radar Chart */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
        <h3 className="text-white mb-6">Java Skills Overview</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={skillsData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fill: '#888', fontSize: 10 }}
              />
              <Radar 
                name="Skills" 
                dataKey="score" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
          <h3 className="text-white mb-6">Category Completion</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="category" 
                  stroke="#888"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  style={{ fontSize: '11px' }}
                />
                <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(26, 26, 46, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="completed" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="total" fill="rgba(255,255,255,0.1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
          <h3 className="text-white mb-6">Score Progress</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="month" 
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#888" 
                  domain={[60, 100]}
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
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#a855f7" 
                  strokeWidth={3}
                  dot={{ fill: '#a855f7', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
          <p className="text-sm text-muted-foreground mb-2">Problem Solving Speed</p>
          <p className="text-2xl text-white mb-1">12.5 min</p>
          <p className="text-xs text-green-400">↓ 15% faster than average</p>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
          <p className="text-sm text-muted-foreground mb-2">First Attempt Success</p>
          <p className="text-2xl text-white mb-1">68%</p>
          <p className="text-xs text-green-400">↑ 8% from last month</p>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
          <p className="text-sm text-muted-foreground mb-2">Code Efficiency Rating</p>
          <p className="text-2xl text-white mb-1">8.4/10</p>
          <p className="text-xs text-yellow-400">→ Consistent with average</p>
        </Card>
      </div>
    </div>
  );
}
