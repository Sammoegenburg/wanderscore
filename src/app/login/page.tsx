"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="aurora-bg" />

      <div className="w-full max-w-md relative z-10">
        <Link
          href="/"
          className="flex items-center gap-2 mb-8 justify-center group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
            W
          </div>
          <span className="font-display text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
            WanderScore
          </span>
        </Link>

        <div className="glass-card p-8">
          <h1 className="font-display text-2xl font-bold text-center mb-2">
            Welcome back
          </h1>
          <p className="text-slate-400 text-center text-sm mb-6">
            Sign in to continue your sonic adventures
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glow-btn w-full py-3 text-white font-semibold text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 text-center">
            <p className="text-slate-600 text-xs">
              Demo account:{" "}
              <span className="text-slate-400">demo@wanderscore.com</span> /{" "}
              <span className="text-slate-400">wanderscore</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
