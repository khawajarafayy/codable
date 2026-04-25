import { Card } from "../../../../components/ui/card";
import { Progress } from "../../../../components/ui/progress";
import { Badge } from "../../../../components/ui/badge";
import { CalendarClock, Route, Flag, Lock, Rocket, CheckCircle2 } from "lucide-react";

const formatEta = (days) => {
  if (!Number.isFinite(days) || days <= 0) return "At current pace: unavailable";
  if (days < 7) return `Estimated completion in ~${Math.ceil(days)} days`;
  const weeks = Math.ceil(days / 7);
  return `Estimated completion in ~${weeks} week${weeks > 1 ? "s" : ""}`;
};

export function LearningTrajectory({ chapters = [], stats = {}, loading }) {
  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Learning Trajectory</h2>
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-700/50 rounded-xl"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!chapters || chapters.length === 0) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-3">Learning Trajectory</h2>
        <p className="text-gray-400">Start learning chapters to unlock trajectory and completion forecasting.</p>
      </Card>
    );
  }

  const totalChapters = chapters.length;
  const completed = chapters.filter((c) => c.status === "completed").length;
  const inProgress = chapters.filter((c) => c.status === "in-progress").length;
  const notStarted = chapters.filter((c) => c.status === "not-started").length;
  const locked = chapters.filter((c) => c.status === "locked").length;

  const completionPct = totalChapters > 0 ? Math.round((completed / totalChapters) * 100) : 0;
  const topicsRemaining = chapters.reduce(
    (sum, c) => sum + Math.max(0, (c.totalTopics || 0) - (c.completedTopics || 0)),
    0
  );

  const totalTopicsCompleted = stats.totalTopicsCompleted || 0;
  const activeDays = Math.max(1, stats.currentStreak || 0);
  const topicsPerActiveDay = totalTopicsCompleted > 0 ? totalTopicsCompleted / activeDays : 0;
  const estimatedDaysToFinish = topicsPerActiveDay > 0 ? topicsRemaining / topicsPerActiveDay : Number.POSITIVE_INFINITY;

  const nextChapter = chapters.find((c) => c.status === "not-started")?.chapterId || null;
  const weeklyGoalTopics = Math.max(3, Math.ceil(topicsRemaining / 6)); // 6-week practical target

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Learning Trajectory</h2>
          <p className="text-gray-400 mt-1">Roadmap health, completion forecast, and next milestone guidance.</p>
        </div>
        <Route className="h-5 w-5 text-blue-300" />
      </div>

      <div className="rounded-xl border border-gray-700/70 bg-gray-900/50 p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300">Path Completion</span>
          <span className="text-white font-medium">{completionPct}%</span>
        </div>
        <Progress value={completionPct} className="h-2 bg-gray-800" />
        <p className="text-xs text-gray-400 mt-2">
          {completed}/{totalChapters} chapters complete
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl border border-gray-700/70 bg-gray-900/50 p-3">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Rocket className="h-3.5 w-3.5" />
            Active Chapters
          </p>
          <p className="text-xl text-white font-semibold">{inProgress}</p>
        </div>
        <div className="rounded-xl border border-gray-700/70 bg-gray-900/50 p-3">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" />
            Locked Chapters
          </p>
          <p className="text-xl text-white font-semibold">{locked}</p>
        </div>
        <div className="rounded-xl border border-gray-700/70 bg-gray-900/50 p-3">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Flag className="h-3.5 w-3.5" />
            Remaining Topics
          </p>
          <p className="text-xl text-white font-semibold">{topicsRemaining}</p>
        </div>
        <div className="rounded-xl border border-gray-700/70 bg-gray-900/50 p-3">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            Weekly Target
          </p>
          <p className="text-xl text-white font-semibold">{weeklyGoalTopics}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-700/70 bg-gray-900/50 p-4 space-y-2">
        <p className="text-gray-300 text-sm">{formatEta(estimatedDaysToFinish)}</p>
        {nextChapter ? (
          <Badge variant="outline" className="border-blue-500/30 text-blue-300">
            Next milestone: Start Chapter {nextChapter}
          </Badge>
        ) : (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            All currently unlocked chapters are in motion
          </Badge>
        )}
        {notStarted > 0 && (
          <p className="text-xs text-gray-400">
            {notStarted} chapter{notStarted > 1 ? "s" : ""} ready to start now.
          </p>
        )}
      </div>
    </Card>
  );
}
