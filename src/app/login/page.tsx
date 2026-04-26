"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, getCurrentWorkspaceId } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { Lock, Mail, Loader2 } from "lucide-react";

function GoogleLogo() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M21.805 12.23c0-.64-.057-1.254-.164-1.846H12v3.49h5.51a4.71 4.71 0 0 1-2.045 3.09v2.567h3.305c1.935-1.782 3.035-4.409 3.035-7.301Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.076-.915 6.768-2.469l-3.305-2.567c-.915.614-2.082.978-3.463.978-2.66 0-4.913-1.796-5.72-4.212H2.864v2.648A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.28 13.73A6 6 0 0 1 5.96 12c0-.6.11-1.182.32-1.73V7.62H2.864A10 10 0 0 0 2 12c0 1.615.386 3.145 1.068 4.38l3.212-2.65Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.058c1.5 0 2.848.516 3.91 1.528l2.932-2.933C17.07 3.004 14.754 2 12 2A10 10 0 0 0 3.068 7.62l3.212 2.65C7.087 7.854 9.34 6.058 12 6.058Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("error");

    if (reason === "invalid_token") {
      setError("This verification link is invalid or has expired. Please sign in and request a new one.");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.login({ email, password });
      const user = await refreshAuth();
      const workspaceId = getCurrentWorkspaceId(user);

      router.push(workspaceId ? "/dashboard" : "/onboarding");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-2">Sign in to ES Studio</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium text-center">
            {error}
          </div>
        )}

        <div className="mb-5 space-y-5">
          <button
            type="button"
            onClick={() => authApi.googleLogin()}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <GoogleLogo />
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-sm text-gray-500 dark:bg-gray-900">or</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          New to SocialMetrics?{" "}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
