// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();
  const { status }              = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'admin') {
      navigate('/admin', { replace: true })
    } else if (status === 'professor') {
      navigate('/', { replace: true })
    } else if (status === 'not-approved') {
      navigate('/not-approved', { replace: true })
    }
  }, [status, navigate])

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.endsWith("@smu.tn")) {
      setError("Only @smu.tn accounts are allowed.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthContext will handle redirect automatically
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Try again later.");
          break;
        default:
          setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">SMU Smart Campus</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in with your university account</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              University Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@smu.tn"
              required
              className="w-full border border-surface-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-surface-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}