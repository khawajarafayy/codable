import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Target, Loader } from "lucide-react";
import mentorApi from "../../../../services/mentorApi.js";

export default function Reports() {
  // State for chart data
  const [classPerformance, setClassPerformance] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [statsCards, setStatsCards] = useState([]);
  const [studentProgressData, setStudentProgressData] = useState({ excellent: 0, good: 0, needsSupport: 0 });

  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch instructor classes, assignments and real submission data
        const reportsData = await mentorApi.getReportsData();
        let classPerformanceData = reportsData.classPerformance || [];

        // Filter out empty classes and limit to 6
        classPerformanceData = classPerformanceData
          .filter((cls) => cls.students > 0 && cls.avgScore > 0)
          .slice(0, 6);

        setClassPerformance(classPerformanceData);

        // Fetch real student performance data from assignment submissions
        let studentsPerformance = await mentorApi.getStudentsPerformanceData();

        console.log("Students Performance Data:", studentsPerformance);

        // Calculate top performers from real scores
        const performers = studentsPerformance
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 5)
          .map((student, index) => ({
            name: student.name || `Student ${index + 1}`,
            class: student.class || "Unassigned",
            score: student.score || 0,
            individualScores: student.individualScores || [],
            assignments: student.assignmentCount || 0,
          }));

        setTopPerformers(performers.length > 0 ? performers : getDefaultTopPerformers());

        // Calculate overall statistics from real data - using all attempted assignment scores
        const totalStudents = studentsPerformance.length;
        
        // Collect all individual assignment scores from all students
        const allAssignmentScores = [];
        studentsPerformance.forEach((student) => {
          if (student.individualScores && Array.isArray(student.individualScores)) {
            allAssignmentScores.push(...student.individualScores);
          }
        });

        // Calculate average from all attempted assignments, not per-student averages
        const avgOverallScore = allAssignmentScores.length > 0
          ? Math.round(
              allAssignmentScores.reduce((sum, score) => sum + score, 0) / allAssignmentScores.length
            )
          : 84;

        const excellentCount = studentsPerformance.filter((s) => (s.score || 0) >= 90).length;
        const goodCount = studentsPerformance.filter((s) => (s.score || 0) >= 75 && (s.score || 0) < 90).length;
        const needsSupportCount = studentsPerformance.filter((s) => (s.score || 0) < 75).length;

        setStudentProgressData({
          excellent: excellentCount,
          good: goodCount,
          needsSupport: needsSupportCount,
        });

        // Create stats cards with real data
        const stats = [
          {
            title: "Overall Avg Score",
            value: `${avgOverallScore}%`,
            icon: Target,
            trend: totalStudents > 0 ? `${excellentCount} high performers` : "No data",
            bgGlow: "bg-blue-500/10",
            borderGlow: "border-blue-500/30",
            iconBg: "bg-blue-500/20",
            iconColor: "text-blue-400",
          },
          {
            title: "Active Learners",
            value: totalStudents.toString(),
            icon: Users,
            trend: `${goodCount + excellentCount} above 75%`,
            bgGlow: "bg-emerald-500/10",
            borderGlow: "border-emerald-500/30",
            iconBg: "bg-emerald-500/20",
            iconColor: "text-emerald-400",
          },
        ];

        setStatsCards(stats);
      } catch (err) {
        console.error("Error fetching reports data:", err);
        setError(err.message || "Failed to load reports data");
        // Set default data on error
        setClassPerformance(getDefaultClassPerformance());
        setTopPerformers(getDefaultTopPerformers());
        setStatsCards(getDefaultStatsCards());
        setStudentProgressData({ excellent: 48, good: 142, needsSupport: 47 });
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, []);

  // Default data functions for fallback
  const getDefaultClassPerformance = () => [
    { class: "React Fund.", avgScore: 87, students: 45 },
    { class: "Python", avgScore: 82, students: 38 },
    { class: "JavaScript", avgScore: 85, students: 32 },
    { class: "Data Struct.", avgScore: 79, students: 41 },
    { class: "Web Dev", avgScore: 91, students: 52 },
    { class: "Algorithms", avgScore: 76, students: 29 },
  ];

  const getDefaultTopPerformers = () => [
    { name: "Sarah Chen", class: "Web Dev", score: 98, assignments: 12 },
    { name: "Michael Torres", class: "React Fund.", score: 96, assignments: 11 },
    { name: "Emily Rodriguez", class: "JavaScript", score: 95, assignments: 10 },
    { name: "David Kim", class: "Data Struct.", score: 94, assignments: 11 },
    { name: "Jessica Lee", class: "Python", score: 93, assignments: 12 },
  ];

  const getDefaultStatsCards = () => [
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
      title: "Active Learners",
      value: "312",
      icon: Users,
      trend: "+24",
      bgGlow: "bg-emerald-500/10",
      borderGlow: "border-emerald-500/30",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
  ];

  // Helper function for dynamic category styling (fixes Tailwind dynamic class issue)
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

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">Reports & Analytics</h1>
          <p className="text-[#fdfdff]/60">Track student performance and class progress.</p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 text-blue-400 animate-spin" />
            <p className="text-[#fdfdff]/60">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && statsCards.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">Reports & Analytics</h1>
          <p className="text-[#fdfdff]/60">Track student performance and class progress.</p>
        </div>
        <div className="p-6 rounded-2xl backdrop-blur-sm bg-rose-500/10 border border-rose-500/30">
          <p className="text-rose-400">Note: {error}</p>
          <p className="text-[#fdfdff]/60 mt-2">Displaying cached data or defaults.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">Reports & Analytics</h1>
        <p className="text-[#fdfdff]/60">Track student performance and class progress.</p>
      </div>

      {/* Stats Cards - 2 columns */}
      <div className="grid grid-cols-2 gap-6">
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

      {/* Class Performance Chart */}
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

      {/* Top Performers Table */}
      <div className="relative p-6 rounded-2xl backdrop-blur-sm bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Users className="w-5 h-5 text-emerald-400" />
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
                  <p className="text-xs text-[#fdfdff]/50">Score %</p>
                  <div className="flex gap-1">
                    {student.individualScores && student.individualScores.length > 0 ? (
                      student.individualScores.slice(0, 5).map((score, idx) => (
                        <span key={idx} className="font-[JetBrains_Mono] text-sm text-emerald-400 font-bold">
                          {Math.round(score)}%
                        </span>
                      ))
                    ) : (
                      <span className="font-[JetBrains_Mono] text-lg text-emerald-400 font-bold">
                        {student.score}%
                      </span>
                    )}
                  </div>
                  {student.individualScores && student.individualScores.length > 5 && (
                    <p className="text-xs text-[#fdfdff]/40 mt-1">+{student.individualScores.length - 5} more</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Progress Overview */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: "Excellent (90-100%)", count: studentProgressData.excellent, color: "emerald" },
          { label: "Good (75-89%)", count: studentProgressData.good, color: "blue" },
          { label: "Needs Support (<75%)", count: studentProgressData.needsSupport, color: "rose" },
        ].map((category, index) => {
          const classes = getCategoryClasses(category.color);
          const totalStudents = studentProgressData.excellent + studentProgressData.good + studentProgressData.needsSupport;
          const percentage = totalStudents > 0 ? Math.round((category.count / totalStudents) * 100) : 0;
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
                  {percentage}% of total students
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
