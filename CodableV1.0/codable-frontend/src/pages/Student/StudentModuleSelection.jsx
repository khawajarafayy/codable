import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Code } from 'lucide-react';
import CodableLogo from '../../assets/codable-logo.png';

const StudentModuleSelection = () => {
  const navigate = useNavigate();

  const modules = [
    {
      id: 'learning',
      title: 'Learning Module',
      description: 'Learn to code with interactive lessons and AI-powered feedback',
      icon: BookOpen,
      path: '/student/dashboard',
      color: 'from-blue-500 to-cyan-500',
      lightColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      id: 'classroom',
      title: 'Classroom',
      description: 'Join classes, collaborate with peers, and get assignments from instructors',
      icon: Users,
      path: '/classroom',
      color: 'from-purple-500 to-pink-500',
      lightColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      comingSoon: true,
    },
    {
      id: 'workspace',
      title: 'Workspace',
      description: 'Write, test, and run code with full IDE support',
      icon: Code,
      path: '/workspace',
      color: 'from-emerald-500 to-teal-500',
      lightColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A1428] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-40 -left-32 w-[50rem] h-[50rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute -bottom-48 -right-40 w-[56rem] h-[56rem] rounded-full bg-purple-600/25 blur-[150px]" />
        <div className="absolute top-10 right-1/4 w-[30rem] h-[30rem] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-40 mix-blend-soft-light"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><circle cx=%2230%22 cy=%22330%22 r=%221%22 fill=%22white%22 fill-opacity=%220.04%22/></svg>')",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="pt-8 px-6 sm:px-8 md:px-12">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2">
              <img src={CodableLogo} alt="Codable" className="w-10 h-12 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Codable</h1>
              <p className="text-xs text-gray-400">Learn. Practice. Master</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-8 md:px-12 pb-12">
          <div className="w-full max-w-6xl">
            {/* Title */}
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">
                Welcome to Your Learning Hub
              </h2>
              <p className="text-lg text-gray-300">
                Choose how you want to learn and grow your coding skills
              </p>
            </div>

            {/* Module Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <button
                    key={module.id}
                    onClick={() => !module.comingSoon && navigate(module.path)}
                    disabled={module.comingSoon}
                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 p-8 text-left ${
                      module.comingSoon
                        ? `${module.borderColor} border opacity-60 cursor-not-allowed`
                        : `${module.borderColor} border bg-[#141622]/40 backdrop-blur-sm hover:border-opacity-100 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 cursor-pointer`
                    }`}
                  >
                    {/* Gradient background */}
                    <div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${module.color}`}
                    />

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div
                        className={`w-14 h-14 rounded-lg mb-4 flex items-center justify-center ${module.lightColor} transition-transform group-hover:scale-110`}
                      >
                        <Icon className={`w-7 h-7 bg-gradient-to-br ${module.color} bg-clip-text text-transparent`} />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>

                      {/* Description */}
                      <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                        {module.description}
                      </p>

                      {/* Coming Soon Badge */}
                      {module.comingSoon && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                          <span className="text-xs font-medium text-yellow-300">Coming Soon</span>
                        </div>
                      )}

                      {/* Button */}
                      {!module.comingSoon && (
                        <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-400 group-hover:text-cyan-300 transition-colors">
                          Get Started
                          <svg
                            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="bg-[#141622]/50 border border-gray-700/50 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400">
                💡 Pro tip: You can switch between modules anytime from the navigation bar
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentModuleSelection;
