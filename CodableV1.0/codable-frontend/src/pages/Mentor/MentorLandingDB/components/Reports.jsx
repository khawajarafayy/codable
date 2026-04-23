import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { TrendingUp, Users, Award, Target } from "lucide-react";

export default function Reports() {
  const classPerformance = [
    { class: "React Fund.", avgScore: 87, students: 45 },
    { class: "Python", avgScore: 82, students: 38 },
    { class: "JavaScript", avgScore: 85, students: 32 },
    { class: "Data Struct.", avgScore: 79, students: 41 },
    { class: "Web Dev", avgScore: 91, students: 52 },
    { class: "Algorithms", avgScore: 76, students: 29 },
  ];

  const skillDistribution = [
    { skill: "Problem Solving", value: 85 },
    { skill: "Code Quality", value: 78 },
    { skill: "Debugging", value: 82 },
    { skill: "Documentation", value: 72 },
    { skill: "Testing", value: 75 },
    { skill: "Collaboration", value: 88 },
  ];

  const topPerformers = [
    { name: "Sarah Chen", class: "Web Dev", score: 98, assignments: 12 },
    { name: "Michael Torres", class: "React Fund.", score: 96, assignments: 11 },
    { name: "Emily Rodriguez", class: "JavaScript", score: 95, assignments: 10 },
    { name: "David Kim", class: "Data Struct.", score: 94, assignments: 11 },
    { name: "Jessica Lee", class: "Python", score: 93, assignments: 12 },
  ];

  const statsCards = [
    {
      title: "Overall Avg Score",
      value: "84.3%",
      icon: Target,
      trend: "+5.2%",
      bgGlow: "bg-blue-500/10",
      borderGlow: "border-blue-500/30",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      title: "Top Performers",
      value: "48",
      icon: Award,
      trend: "+12",
      bgGlow: "bg-purple-500/10",
      borderGlow: "border-purple-500/30",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      title: "Active Learners",
      value: "312",
      icon: Users,
      trend: "+24",
      bgGlow: "bg-emerald-500/10",
      borderGlow: "border-emerald-500/30",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      title: "Improvement Rate",
      value: "92%",
      icon: TrendingUp,
      trend: "+8%",
      bgGlow: "bg-rose-500/10",
      borderGlow: "border-rose-500/30",
      iconBg: "bg-rose-500/20",
      iconColor: "text-rose-400",
    },
  ];

  // Helper function for dynamic category styling
  const getCategoryClasses = (color) => {
    const colorMap = {
      emerald: {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
      },
      blue: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        text: "text-blue-400",
      },
      rose: {
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        text: "text-rose-400",
      },
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">Reports & Analytics</h1>
        <p className="text-[#fdfdff]/60">Track student performance and class progress.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`relative p-6 rounded-2xl backdrop-blur-sm ${card.bgGlow} border ${card.borderGlow} hover:scale-105 transition-transform duration-300`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.iconBg}`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <span className="text-emerald-400 text-sm font-medium">{card.trend}</span>
              </div>
              <div>
                <p className="text-[#fdfdff]/60 text-sm mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-[#fdfdff]">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Class Performance Bar Chart */}
        <div className="relative p-6 rounded-2xl backdrop-blur-sm bg-blue-500/10 border border-blue-500/30">
          <h2 className="text-xl font-semibold text-[#fdfdff] mb-6">Class Performance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classPerformance}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="class" stroke="#fdfdff" opacity={0.6} fontSize={12} />
                <YAxis stroke="#fdfdff" opacity={0.6} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A1428",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    borderRadius: "12px",
                    color: "#fdfdff",
                  }}
                  cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                />
                <Bar dataKey="avgScore" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Distribution Radar Chart */}
        <div className="relative p-6 rounded-2xl backdrop-blur-sm bg-purple-500/10 border border-purple-500/30">
          <h2 className="text-xl font-semibold text-[#fdfdff] mb-6">Skill Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillDistribution}>
                <PolarGrid stroke="#9333ea" opacity={0.3} />
                <PolarAngleAxis dataKey="skill" stroke="#fdfdff" opacity={0.7} fontSize={11} />
                <PolarRadiusAxis stroke="#fdfdff" opacity={0.5} fontSize={10} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#a855f7"
                  fill="#a855f7"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="relative p-6 rounded-2xl backdrop-blur-sm bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-[#fdfdff]">Top Performers</h2>
        </div>

        <div className="space-y-3">
          {topPerformers.map((student, index) => (
            <div
              key={student.name}
              className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-all duration-300"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-sm">
                  #{index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-[#fdfdff]">{student.name}</h3>
                  <p className="text-sm text-[#fdfdff]/60">{student.class}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-[#fdfdff]/50">Assignments</p>
                  <p className="font-[JetBrains_Mono] text-sm text-[#fdfdff] font-semibold">
                    {student.assignments}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#fdfdff]/50">Avg Score</p>
                  <p className="font-[JetBrains_Mono] text-lg text-emerald-400 font-bold">
                    {student.score}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Progress Overview */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: "Excellent (90-100%)", count: 48, color: "emerald" },
          { label: "Good (75-89%)", count: 142, color: "blue" },
          { label: "Needs Support (<75%)", count: 47, color: "rose" },
        ].map((category, index) => {
          const classes = getCategoryClasses(category.color);
          return (
            <div
              key={category.label}
              className={`p-6 rounded-2xl backdrop-blur-sm ${classes.bg} border ${classes.border}`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <p className="text-[#fdfdff]/60 text-sm mb-2">{category.label}</p>
              <p className={`text-4xl font-bold ${classes.text}`}>{category.count}</p>
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-[#fdfdff]/50">
                  {Math.round((category.count / 237) * 100)}% of total students
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
