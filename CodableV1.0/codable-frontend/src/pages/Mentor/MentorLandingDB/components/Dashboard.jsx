import {
  Users,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Plus,
  Copy,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const summaryCards = [
    {
      title: "Active Classes",
      value: "12",
      icon: BookOpen,
      bgGlow: "bg-blue-500/10",
      borderGlow: "border-blue-500/30",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      title: "Total Students",
      value: "347",
      icon: Users,
      bgGlow: "bg-purple-500/10",
      borderGlow: "border-purple-500/30",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      title: "Pending Reviews",
      value: "28",
      icon: ClipboardCheck,
      bgGlow: "bg-rose-500/10",
      borderGlow: "border-rose-500/30",
      iconBg: "bg-rose-500/20",
      iconColor: "text-rose-400",
    },
    {
      title: "Avg Performance",
      value: "87%",
      icon: TrendingUp,
      bgGlow: "bg-emerald-500/10",
      borderGlow: "border-emerald-500/30",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
  ];

  const performanceData = [
    { week: "Week 1", score: 72 },
    { week: "Week 2", score: 78 },
    { week: "Week 3", score: 75 },
    { week: "Week 4", score: 82 },
    { week: "Week 5", score: 85 },
    { week: "Week 6", score: 87 },
  ];

  const classes = [
    { name: "React Fundamentals", students: 45, joinCode: "REACT2024" },
    { name: "Python for Beginners", students: 38, joinCode: "PY101" },
    { name: "JavaScript Advanced", students: 32, joinCode: "JS2024" },
    { name: "Data Structures", students: 41, joinCode: "DS2024" },
    { name: "Web Development", students: 52, joinCode: "WEB101" },
    { name: "Algorithm Design", students: 29, joinCode: "ALGO24" },
  ];

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">Dashboard</h1>
          <p className="text-[#fdfdff]/60">
            Welcome back! Here's your teaching overview.
          </p>
        </div>

        <button className="group relative px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-2xl border border-blue-500/30 transition-all duration-300 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span className="font-medium">Create New Class</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`p-6 rounded-2xl backdrop-blur-sm ${card.bgGlow} border ${card.borderGlow} hover:scale-105 transition-transform duration-300`}
            >
              <div className={`p-3 rounded-xl ${card.iconBg} w-fit mb-4`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>

              <p className="text-[#fdfdff]/60 text-sm mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-[#fdfdff]">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Performance Chart */}
      <div className="p-6 rounded-2xl backdrop-blur-sm bg-blue-500/10 border border-blue-500/30">
        <h2 className="text-xl font-semibold text-[#fdfdff] mb-6">
          Performance Trends
        </h2>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                opacity={0.3}
              />

              <XAxis dataKey="week" stroke="#fdfdff" opacity={0.6} />
              <YAxis stroke="#fdfdff" opacity={0.6} />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A1428",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "12px",
                  color: "#fdfdff",
                }}
              />

              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5, fill: "#3b82f6" }}
                activeDot={{ r: 7, fill: "#60a5fa" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Classes */}
      <div>
        <h2 className="text-2xl font-semibold text-[#fdfdff] mb-6">
          Class Overview
        </h2>

        <div className="grid grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div
              key={cls.joinCode}
              className="p-6 rounded-2xl backdrop-blur-sm bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/15 transition-all duration-300"
            >
              <h3 className="text-lg font-semibold text-[#fdfdff] mb-2">
                {cls.name}
              </h3>

              <p className="text-[#fdfdff]/60 text-sm mb-4">
                {cls.students} students
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                <code className="text-purple-400 font-semibold">
                  {cls.joinCode}
                </code>

                <button
                  onClick={() => copyToClipboard(cls.joinCode)}
                  className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
