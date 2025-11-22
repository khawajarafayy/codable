import { Award, Target, CheckCircle2, Trophy, Flame } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';

export function Sidebar() {
  return (
    <aside className="hidden xl:block w-80 p-6 pl-0">
      <div className="sticky top-24 space-y-5">
        
        {/* Stats Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-gray-800/50">
          <h3 className="text-white mb-4">Your Stats</h3>

          <div className="space-y-4">
            <StatItem 
              icon={CheckCircle2}
              label="Lessons Completed"
              value="24"
              color="blue"
            />
            <StatItem 
              icon={Trophy}
              label="Badges Earned"
              value="7"
              color="purple"
            />
            <StatItem 
              icon={Flame}
              label="Day Streak"
              value="12"
              color="orange"
            />
            <StatItem 
              icon={Target}
              label="Next Milestone"
              value="50 Lessons"
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
            <AchievementBadge 
              title="Loop Master"
              description="Completed all loop exercises"
              color="from-blue-500 to-cyan-500"
            />
            <AchievementBadge 
              title="Quick Learner"
              description="3 topics in one week"
              color="from-purple-500 to-pink-500"
            />
            <AchievementBadge 
              title="Early Bird"
              description="Studied before 8 AM"
              color="from-amber-500 to-orange-500"
            />
          </div>
        </div>

        {/* Study Goal Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-gray-800/50">
          <h3 className="text-white mb-4">Weekly Goal</h3>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Study Time</span>
              <span className="text-white">8h / 10h</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                style={{ width: '80%' }}
              ></div>
            </div>
          </div>

          <p className="text-gray-400">
            Just 2 more hours to reach your weekly goal! 🎯
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
