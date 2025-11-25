import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Github } from "lucide-react";
import CodableLogo from "../../assets/codable-logo.png";
import { api } from "../../services/apiClient";


const TYPING_MESSAGES = [
  "Learn. Practice. Master - all in one place.",
  "Your personalized coding journey starts here.",
  "Turn your logic into flawless code.",
  "Get real-time AI feedback on your code.",
  "Level up your skills with interactive learning.",
  "Code smarter, not harder."
];

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [msgIndex, setMsgIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = TYPING_MESSAGES[msgIndex];
    let timer;

    if (!isDeleting && display === current) {
      timer = setTimeout(() => setIsDeleting(true), 1100);
    } else if (isDeleting && display === "") {
      setIsDeleting(false);
      setMsgIndex((i) => (i + 1) % TYPING_MESSAGES.length);
    } else {
      timer = setTimeout(() => {
        setDisplay((prev) =>
          isDeleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1)
        );
      }, isDeleting ? 35 : 60);
    }

    return () => clearTimeout(timer);
  }, [display, isDeleting, msgIndex]);

  const handleGoogleSignIn = () => alert("Google sign-in coming soon");
  const handleGithubSignIn = () => alert("GitHub sign-in coming soon");

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try{
      const data = await api.login(email, password);

      if(data?.token){
        localStorage.setItem("token", data.token);
      }
      navigate("/student");
    } catch(err){
      setError(err.payload?.message || err.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            `linear-gradient(to bottom,#0A1428 0%,#0F1B2D 55%,#040B1D 100%)`,
        }}
      />
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-40 -left-32 w-[50rem] h-[50rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute -bottom-48 -right-40 w-[56rem] h-[56rem] rounded-full bg-purple-600/25 blur-[150px]" />
        <div className="absolute top-10 right-1/4 w-[30rem] h-[30rem] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute bottom-24 left-1/3 w-[26rem] h-[26rem] rounded-full bg-fuchsia-500/10 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-40 mix-blend-soft-light"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><circle cx=%2230%22 cy=%22330%22 r=%221%22 fill=%22white%22 fill-opacity=%220.04%22/></svg>')"
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
        <section className="md:w-2/5 w-full bg-[#141622]/60 backdrop-blur-md border border-gray-800 rounded-2xl p-6 md:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_8px_24px_-6px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2">
              <img src={CodableLogo} alt="Codable" className="w-10 h-12 object-contain" />
            </div>
            <span className="text-lg text-gray-400">Codable</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
            Codable - Code Learning Platform
          </h1>
            <p className="mt-3 text-base md:text-lg text-slate-300">
            A Smarter Place to Learn Code.
          </p>
          <div className="mt-6">
            <p className="text-cyan-300/90 text-sm uppercase tracking-wider mb-2">
              What you’ll get
            </p>
            <div className="text-lg md:text-xl font-semibold text-white/90">
              <span>{display}</span>
              <span className="ml-1 inline-block w-[2px] h-5 bg-cyan-400 animate-pulse" />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-gray-300">
            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">Interactive IDE</div>
            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">AI Suggestions</div>
            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">Real Projects</div>
            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">Progress Tracking</div>
          </div>
        </section>

        <section className="md:w-3/5 w-full">
          <div className="h-full bg-[#141622]/70 backdrop-blur-md border border-gray-800 rounded-2xl p-6 md:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_8px_28px_-6px_rgba(0,0,0,0.65)]">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">Welcome Back</h2>
              <p className="text-sm text-gray-400">Login to continue to Codable</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full rounded-lg bg-[#1b1e2d] border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm px-3 py-2 text-gray-200 outline-none transition"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full rounded-lg bg-[#1b1e2d] border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm px-3 py-2 text-gray-200 outline-none transition"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-sm text-rose-400">{error}</p>}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="accent-cyan-500"
                  />
                  <span className="text-gray-300">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert("Reset coming soon")}
                  className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2.5 text-sm transition cursor-pointer"
              >
                <LogIn size={16} />
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-xs text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 rounded-lg px-4 py-2.5 bg-white text-gray-800 hover:bg-gray-100 border border-gray-300 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.813 32.91 29.28 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C33.787 6.053 29.147 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.493 0 19.128-7.637 19.128-20 0-1.341-.147-2.651-.417-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.817C14.38 16.062 18.831 12 24 12c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C33.787 6.053 29.147 4 24 4 16.318 4 9.661 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.206 0 9.9-1.988 13.423-5.223l-6.197-5.238C29.219 35.488 26.778 36 24 36c-5.259 0-9.781-3.072-11.592-7.49l-6.54 5.04C8.186 39.63 15.53 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.085 3.172-3.557 5.657-6.88 6.539l6.197 5.238C37.76 37.809 40 31.333 40 24c0-1.341-.147-2.651-.417-3.917z" />
                </svg>
                <span className="text-sm font-medium cursor-pointer">Sign in with Google</span>
              </button>
              <button
                type="button"
                onClick={handleGithubSignIn}
                className="w-full flex items-center justify-center gap-3 rounded-lg px-4 py-2.5 bg-[#24292e] text-white hover:bg-black/80 border border-gray-700 transition"
              >
                <Github size={18} />
                <span className="text-sm font-medium cursor-pointer">Sign in with GitHub</span>
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 pt-6">
              New here?{" "}
              <span
                onClick={() => navigate("/signup")}
                className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                Create an account
              </span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;