import { Lock, Play, Check, Clock } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';

export function TopicCard({ topic, onActionClick }) {
  const isLocked = topic.locked || topic.status === 'locked';
  const isCompleted = topic.status === 'completed';
  const isInProgress = topic.status === 'in-progress';
  
  return (
    <div 
      className={`bg-gray-900/50 backdrop-blur-sm rounded-xl p-5 shadow-lg border transition-all duration-200 hover:shadow-xl ${
        isLocked 
          ? 'border-gray-800/50 opacity-50' 
          : 'border-gray-800/50 hover:border-purple-800/50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isCompleted 
            ? 'bg-green-900/50 text-green-400' 
            : isInProgress
            ? 'bg-purple-900/50 text-purple-400'
            : isLocked
            ? 'bg-gray-800/50 text-gray-600'
            : 'bg-purple-900/50 text-purple-400'
        }`}>
          {isLocked ? (
            <Lock className="w-5 h-5" />
          ) : isCompleted ? (
            <Check className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </div>
        
        {isCompleted && (
          <Badge className="bg-green-900/50 text-green-400 hover:bg-green-900/50 border border-green-800/30">
            Completed
          </Badge>
        )}
        {isInProgress && (
          <Badge className="bg-purple-900/50 text-purple-400 hover:bg-purple-900/50 border border-purple-800/30">
            In Progress
          </Badge>
        )}
      </div>
      
      <h3 className="text-white mb-2">{topic.title}</h3>
      <p className="text-gray-400 mb-4 line-clamp-2">{topic.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{topic.duration}</span>
        </div>
        
        <Button 
          size="sm"
          disabled={isLocked}
          variant={isCompleted ? "outline" : "default"}
          onClick={isLocked ? undefined : onActionClick}
          className={
            isLocked 
              ? "bg-gray-800 text-gray-600 border-gray-700" 
              : isCompleted 
              ? "border-purple-800/50 text-purple-400 hover:bg-purple-900/30" 
              : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          }
        >
          {isLocked ? (
            'Locked'
          ) : isCompleted ? (
            'Review'
          ) : isInProgress ? (
            'Resume'
          ) : (
            'Start'
          )}
        </Button>
      </div>
      
      {/* Progress bar for in-progress topics */}
      {isInProgress && (
        <div className="mt-4 pt-4 border-t border-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-white">45%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-1.5 rounded-full" 
              style={{ width: '45%' }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}