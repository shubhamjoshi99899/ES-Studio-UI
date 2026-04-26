"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { ApiError, authApi } from "@/lib/api-client";

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

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [genericError, setGenericError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setEmailExists(false);
    setGenericError("");

    if (password.length < 8) {
      setGenericError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.register({ name, email, password });
      setSuccessEmail(email);
    } catch (error) {
      const status = error instanceof ApiError ? error.status : undefined;

      if (status === 409) {
        setEmailExists(true);
      } else {
        setGenericError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-[420px] rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-950">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600">Set up SocialMetrics with your organisation email</p>
        </div>

        {successEmail ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-900">
            <p className="font-medium">Check your inbox</p>
            <p className="mt-1">We sent a verification link to {successEmail}</p>
          </div>
        ) : (
          <>
            {genericError ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {genericError}
              </div>
            ) : null}

            <div className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => authApi.googleLogin()}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <GoogleLogo />
                  Continue with Google
                </button>
                <p className="mt-3 text-center text-sm text-gray-500">Sign in with your organisation email</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-sm text-gray-500">or</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    placeholder="Jane Smith"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailExists(false);
                    }}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    placeholder="jane@company.com"
                  />
                  {emailExists ? (
                    <p className="mt-2 text-sm text-red-600">An account with this email already exists</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create account
                </button>
              </form>
            </div>
          </>
        )}

        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
