import { ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Progress } from '../../../../components/ui/progress';

export function ProgressSection() {
  const overallProgress = 65;
  
  return (
    <section className="mb-8">
      <h1 className="text-white mb-6">Welcome back, Alex! 👋</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Overall Progress Card */}
        <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-800/50">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-white mb-1">Your Learning Journey</h3>
              <p className="text-gray-400">Keep up the great work!</p>
            </div>
            <div className="relative w-20 h-20">
              {/* Circular Progress */}
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="#374151"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - overallProgress / 100)}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9333EA" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white">{overallProgress}%</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Course Progress</span>
                <span className="text-gray-400">{overallProgress}% Complete</span>
              </div>
              <Progress value={overallProgress} className="h-2 bg-gray-800" />
            </div>
            
            <div className="flex gap-6 pt-2">
              <div>
                <div className="text-white">8</div>
                <div className="text-gray-400">Lessons Completed</div>
              </div>
              <div className="h-12 w-px bg-gray-800"></div>
              <div>
                <div className="text-white">4</div>
                <div className="text-gray-400">Topics Mastered</div>
              </div>
              <div className="h-12 w-px bg-gray-800"></div>
              <div>
                <div className="text-white">28h</div>
                <div className="text-gray-400">Time Invested</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Continue Learning Card */}
        <div className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-2xl p-6 shadow-lg border border-purple-800/30 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            
            <h3 className="mb-2">Continue Learning</h3>
            <p className="text-purple-300 mb-6">Pick up where you left off</p>
            
            <div className="bg-purple-500/10 backdrop-blur-sm rounded-lg p-3 mb-4 border border-purple-500/20">
              <div className="text-purple-300 mb-1">Current Topic</div>
              <div>Loops - For & While</div>
            </div>
            
            <Button 
              className="w-full bg-purple-600 text-white hover:bg-purple-700"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}