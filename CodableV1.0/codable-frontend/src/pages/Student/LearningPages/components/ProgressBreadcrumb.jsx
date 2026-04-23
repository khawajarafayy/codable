import { ChevronRight, Code2, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export function ProgressBreadcrumb() {
  const progress = 45; // 45% complete
  
  return (
    <div className="bg-[#13132B] border-b border-gray-800/50 h-16">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="h-6 w-px bg-gray-700"></div>
          
          <div className="flex items-center gap-2 text-gray-400">
            <Code2 className="w-4 h-4" />
            <span className="hover:text-gray-200 cursor-pointer">Java Course</span>
            <ChevronRight className="w-4 h-4" />
            <span className="hover:text-gray-200 cursor-pointer">Chapter 1</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#6C63FF]">Intro to JAVA</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-gray-400">
            Progress: <span className="text-[#22D3EE]">{progress}%</span>
          </div>
          <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#6C63FF] to-[#22D3EE] transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
