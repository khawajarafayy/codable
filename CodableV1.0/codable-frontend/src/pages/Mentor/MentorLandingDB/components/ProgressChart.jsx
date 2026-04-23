import { Card } from "../../../../components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Mon", hours: 3.5 },
  { day: "Tue", hours: 4.2 },
  { day: "Wed", hours: 3.8 },
  { day: "Thu", hours: 5.5 },
  { day: "Fri", hours: 4.8 },
  { day: "Sat", hours: 6.2 },
  { day: "Sun", hours: 5.0 },
];

export function ProgressChart() {
  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6 mb-8">
      <div className="space-y-4">
        <div>
          <h3 className="text-white mb-1">Weekly Progress</h3>
          <p className="text-sm text-muted-foreground">Your coding activity this week</p>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="day"
                stroke="#888"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#888"
                style={{ fontSize: '12px' }}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#888' }}
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
                dataKey="hours"
                stroke="url(#colorGradient)"
                strokeWidth={3}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
