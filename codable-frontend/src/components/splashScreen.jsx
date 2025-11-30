import { useState, useEffect } from 'react';
import { Code2, Zap, BookOpen, Trophy } from 'lucide-react';
import logo from "../assets/codable-logo.png";

function SplashScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 800),
      setTimeout(() => setStep(3), 1300),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: 'Interactive Learning',
      description: 'Comprehensive Java tutorials',
      color: 'from-[#6C63FF] to-[#8B83FF]',
      delay: 'delay-100'
    },
    {
      icon: Code2,
      title: 'Live Coding',
      description: 'Practice with real-time editor',
      color: 'from-[#22D3EE] to-[#44E3FE]',
      delay: 'delay-200'
    },
    {
      icon: Trophy,
      title: 'Track Progress',
      description: 'Monitor your learning journey',
      color: 'from-[#F59E0B] to-[#FBBF24]',
      delay: 'delay-300'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0B1A] flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#6C63FF]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#22D3EE]/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }} 
        />

        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(108, 99, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(108, 99, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />

        <div className="absolute top-1/4 left-1/4 text-[#6C63FF]/20 text-6xl animate-float">{'{ }'}</div>
        <div className="absolute top-1/3 right-1/4 text-[#22D3EE]/20 text-5xl animate-float"
          style={{ animationDelay: '0.5s' }}
        >
          {'<>'}
        </div>
        <div className="absolute bottom-1/3 left-1/3 text-[#6C63FF]/20 text-4xl animate-float"
          style={{ animationDelay: '1s' }}
        >
          {'[ ]'}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">

        {/* Logo */}
        <div className={`transition-all duration-700 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-black rounded-2xl flex items-center justify-center rotate-3 shadow-2xl p-3">
                <img 
                  src={logo} 
                  alt="Codable Logo" 
                  className="w-full h-full object-contain -rotate-3"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-[#6C63FF] to-[#22D3EE] rounded-2xl blur-xl opacity-50 animate-pulse" />
            </div>
          </div>

          <h1 className="text-6xl mb-4 bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent font-bold">
            Codable
          </h1>

          <p className="text-xl text-gray-400 mb-2">Master Java Programming</p>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Zap className="w-4 h-4 text-[#22D3EE]" />
            <span>Learn • Practice • Excel</span>
          </div>
        </div>

        {/* Features */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 mb-12 transition-all duration-700 ${
          step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={`bg-[#13132B]/50 rounded-xl p-6 border border-gray-800/50 hover:border-[#6C63FF]/30 transition-all duration-300 ${feature.delay} animate-fade-in-up backdrop-blur-sm`}
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-white mb-2 font-semibold">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Version Badge */}
        <div className={`mt-12 transition-all duration-700 ${step >= 3 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#13132B]/50 rounded-full border border-gray-800/50 backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-gray-400 text-sm">Version 1.0.0 • Ready to Learn</span>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default SplashScreen