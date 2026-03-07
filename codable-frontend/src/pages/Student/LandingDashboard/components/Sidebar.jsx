import { Award, Target, CheckCircle2, Trophy, Flame } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';

// Helper to format time
const formatTime = (seconds) => {
  if (!seconds || seconds === 0) return '0h';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

// Helper to calculate achievements based on stats
const getAchievements = (stats, chaptersProgress) => {
  const achievements = [];
  
  // Check for completed chapters
  const completedChapters = chaptersProgress?.filter(c => c.status === 'completed').length || 0;
  
  if (completedChapters >= 1) {
    achievements.push({
      title: "First Steps",
      description: "Completed your first chapter",
      color: "from-green-500 to-emerald-500"
    });
  }
  
  if (completedChapters >= 3) {
    achievements.push({
      title: "On a Roll",
      description: "Completed 3 chapters",
      color: "from-blue-500 to-cyan-500"
    });
  }
  
  if (stats?.currentStreak >= 3) {
    achievements.push({
      title: "Consistent Learner",
      description: `${stats.currentStreak} day streak!`,
      color: "from-orange-500 to-amber-500"
    });
  }
  
  if (stats?.totalTopicsCompleted >= 10) {
    achievements.push({
      title: "Topic Explorer",
      description: "Completed 10+ topics",
      color: "from-purple-500 to-pink-500"
    });
  }
  
  // Default achievements if none earned yet
  if (achievements.length === 0) {
    achievements.push({
      title: "Getting Started",
      description: "Begin your learning journey",
      color: "from-gray-500 to-gray-600"
    });
  }
  
  return achievements.slice(0, 3); // Max 3 achievements shown
};

export function Sidebar({ stats = {}, chaptersProgress = [], weeklyGoalHours = 10 }) {
  const topicsCompleted = stats.totalTopicsCompleted || 0;
  const chaptersCompleted = stats.totalChaptersCompleted || 0;
  const currentStreak = stats.currentStreak || 0;
  const timeSpentSeconds = stats.totalTimeSpent || 0;
  const timeSpentHours = timeSpentSeconds / 3600;
  
  // Calculate weekly goal progress (assuming weekly goal is in hours)
  const weeklyProgress = Math.min((timeSpentHours / weeklyGoalHours) * 100, 100);
  const hoursRemaining = Math.max(weeklyGoalHours - timeSpentHours, 0);
  
  // Get dynamic achievements
  const achievements = getAchievements(stats, chaptersProgress);
  
  // Calculate next milestone
  const getNextMilestone = () => {
    if (topicsCompleted < 10) return "10 Topics";
    if (topicsCompleted < 25) return "25 Topics";
    if (topicsCompleted < 50) return "50 Topics";
    if (topicsCompleted < 100) return "100 Topics";
    return "Master Level";
  };

  return (
    <aside className="hidden xl:block w-80 p-6 pl-0">
      <div className="sticky top-24 space-y-5">
        {/* Stats Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-gray-800/50">
          <h3 className="text-white mb-4">Your Stats</h3>
          
          <div className="space-y-4">
            <StatItem 
              icon={CheckCircle2}
              label="Topics Completed"
              value={topicsCompleted.toString()}
              color="blue"
            />
            <StatItem 
              icon={Trophy}
              label="Chapters Completed"
              value={chaptersCompleted.toString()}
              color="purple"
            />
            <StatItem 
              icon={Flame}
              label="Day Streak"
              value={currentStreak.toString()}
              color="orange"
            />
            <StatItem 
              icon={Target}
              label="Next Milestone"
              value={getNextMilestone()}
              color="green"
            />
          </div>
        </div>
        
        {/* Achievements Card */}
        <div className="bg-gradient-to-br from-purple-950 to-purple-900 rounded-2xl p-5 border border-purple-800/30">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-purple-400" />
            <h3 className="text-purple-200">Recent Achievements</h3>
          </div>
          
          <div className="space-y-3">
            {achievements.map((achievement, index) => (
              <AchievementBadge 
                key={index}
                title={achievement.title}
                description={achievement.description}
                color={achievement.color}
              />
            ))}
          </div>
        </div>
        
        {/* Study Goal Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-gray-800/50">
          <h3 className="text-white mb-4">Weekly Goal</h3>
          
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Study Time</span>
              <span className="text-white">{formatTime(timeSpentSeconds)} / {weeklyGoalHours}h</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${weeklyProgress}%` }}
              ></div>
            </div>
          </div>
          
          <p className="text-gray-400">
            {weeklyProgress >= 100 
              ? "🎉 You've reached your weekly goal!" 
              : `Just ${hoursRemaining.toFixed(1)} more hours to reach your weekly goal! 🎯`}
          </p>
        </div>
      </div>
    </aside>
  );
}

function StatItem({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-900/50 text-blue-400',
    purple: 'bg-purple-900/50 text-purple-400',
    orange: 'bg-orange-900/50 text-orange-400',
    green: 'bg-green-900/50 text-green-400',
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="text-gray-400">{label}</div>
        <div className="text-white">{value}</div>
      </div>
    </div>
  );
}

function AchievementBadge({ title, description, color }) {
  return (
    <div className="flex items-center gap-3 bg-gray-900/50 backdrop-blur-sm rounded-lg p-3 border border-gray-800/30">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Award className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white">{title}</div>
        <div className="text-gray-400 truncate">{description}</div>
      </div>
    </div>
  );
}