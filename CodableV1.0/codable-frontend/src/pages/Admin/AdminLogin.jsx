import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.adminLogin(email, password);
      if (res?.token) {
        login(res.token, res.user);
        navigate('/codable-admin', { replace: true });
      } else {
        setError(res?.message || 'Login failed');
      }
    } catch (err) {
      setError(err.payload?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-[#141622]/70 rounded-lg border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-4">Admin Sign In</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} required type="email" className="w-full mt-1 px-3 py-2 rounded bg-[#0f1724] text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} required type="password" className="w-full mt-1 px-3 py-2 rounded bg-[#0f1724] text-white" />
          </div>
          {error && <div className="text-rose-400 text-sm">{error}</div>}
          <button className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
