import { Card } from "../../../../components/ui/card";
import { Progress } from "../../../../components/ui/progress";
import { AlertTriangle, Bug, Code, Zap } from "lucide-react";

export function ErrorIntelligence({ errorProfile, loading }) {
  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Error Intelligence</h2>
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700/50 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  console.log("ErrorIntelligence received errorProfile:", errorProfile);

  if (!errorProfile) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Error Intelligence Panel</h2>
        <p className="text-gray-400">No error data available yet. Complete some topics to see error patterns.</p>
      </Card>
    );
  }

  const errorTypes = [
    {
      icon: Code,
      label: "Syntax Errors",
      rate: errorProfile.syntax_error_rate || 0,
      color: "from-red-500 to-pink-500",
    },
    {
      icon: Bug,
      label: "Logic Errors",
      rate: errorProfile.logic_error_rate || 0,
      color: "from-orange-500 to-yellow-500",
    },
    {
      icon: Zap,
      label: "Runtime Errors",
      rate: errorProfile.runtime_error_rate || 0,
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: AlertTriangle,
      label: "Edge Case Failures",
      rate: errorProfile.edge_case_failure_rate || 0,
      color: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Error Intelligence Panel</h2>
      
      <div className="space-y-6 mb-6">
        {errorTypes.map((error, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${error.color} flex items-center justify-center`}>
                  <error.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-medium">{error.label}</span>
              </div>
              <span className="text-white font-bold">{error.rate}%</span>
            </div>
            <Progress value={error.rate} className="h-2" />
          </div>
        ))}
      </div>

      {errorProfile.common_patterns && errorProfile.common_patterns.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">Common Error Patterns</h3>
          <div className="space-y-2">
            {errorProfile.common_patterns.map((pattern, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400"></div>
                {pattern}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
