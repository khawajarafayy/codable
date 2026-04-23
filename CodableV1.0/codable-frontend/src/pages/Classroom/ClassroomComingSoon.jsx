import { useNavigate } from 'react-router-dom';

const ClassroomComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col min-h-screen">
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1428] via-[#0F1B2D] to-[#040B1D] opacity-100" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full filter blur-[128px] animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header with Back Button */}
        <div className="py-6 px-6 border-b border-gray-800">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* Main Content */}
        <main className="flex-grow flex items-center justify-center py-12 px-4">
          <div className="max-w-2xl w-full text-center">
            <div className="mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto animate-pulse">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5M10.5 1.5v6h6M10.5 1.5L16.5 7.5" />
                </svg>
              </div>
            </div>

            <h1 className="text-4xl font-extrabold text-white mb-4">
              Classroom Coming Soon
            </h1>

            <p className="text-lg text-gray-300 mb-8">
              We're building an amazing classroom experience where you can join classes, collaborate with peers, and complete assignments from your instructors.
            </p>

            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
            >
              Back to Modules
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClassroomComingSoon;
