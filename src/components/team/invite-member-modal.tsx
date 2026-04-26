"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ApiError, type TeamRole } from "@/lib/api-client";
import { type ResolvedTeamRoleOption, useInviteMember } from "@/hooks/use-team";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableRoles: ResolvedTeamRoleOption[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteMemberModal({
  isOpen,
  onClose,
  onSuccess,
  availableRoles,
}: InviteMemberModalProps) {
  const { invite, isInviting } = useInviteMember();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>(availableRoles[0]?.value ?? "analyst");
  const [emailError, setEmailError] = useState("");
  const [bannerError, setBannerError] = useState("");
  const [successEmail, setSuccessEmail] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setRole((currentRole) =>
      availableRoles.some((option) => option.value === currentRole)
        ? currentRole
        : (availableRoles[0]?.value ?? "analyst"),
    );
  }, [availableRoles]);

  useEffect(() => {
    setMounted(true);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setRole(availableRoles[0]?.value ?? "analyst");
      setEmailError("");
      setBannerError("");
      setSuccessEmail("");
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isOpen]);

  function validateEmail(value: string) {
    if (!value.trim()) {
      return "Work email is required";
    }

    if (!EMAIL_PATTERN.test(value.trim())) {
      return "Enter a valid work email";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEmailError = validateEmail(email);
    setEmailError(nextEmailError);
    setBannerError("");

    if (nextEmailError) {
      return;
    }

    try {
      const submittedEmail = email.trim();

      await invite({
        email: submittedEmail,
        role,
      });

      setSuccessEmail(submittedEmail);
      setEmail("");
      setRole(availableRoles[0]?.value ?? "analyst");
      setEmailError("");
      setBannerError("");

      timerRef.current = window.setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setEmailError("This email is already a team member");
        return;
      }

      setBannerError("Failed to send invite — try again");
    }
  }

  if (!isOpen || !mounted) {
    return null;
  }

  return createPortal(
    <div className="absolute inset-0 z-50 bg-black/45 px-4 py-10">
      <div className="mx-auto flex min-h-full max-w-[480px] items-center justify-center">
        <div className="relative w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-2xl leading-none text-gray-400 transition hover:text-gray-700"
            aria-label="Close invite member modal"
          >
            ×
          </button>

          <div className="pr-10">
            <h2 className="text-xl font-semibold text-gray-900">Invite team member</h2>
            <p className="mt-2 text-sm text-gray-600">
              Send a workspace invite and assign access before they join.
            </p>
          </div>

          {bannerError ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {bannerError}
            </div>
          ) : null}

          {successEmail ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Invite sent to {successEmail}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="invite-email" className="mb-2 block text-sm font-medium text-gray-700">
                Work email
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setEmail(nextValue);
                  setSuccessEmail("");

                  if (emailError) {
                    setEmailError(validateEmail(nextValue));
                  }
                }}
                onBlur={() => setEmailError(validateEmail(email))}
                placeholder="name@company.com"
                className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-600/20 ${
                  emailError ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-blue-600"
                }`}
              />
              {emailError ? <p className="mt-2 text-sm text-red-600">{emailError}</p> : null}
            </div>

            <div>
              <label htmlFor="invite-role" className="mb-2 block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as TeamRole);
                  setSuccessEmail("");
                }}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              >
                {availableRoles.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-3">
                {availableRoles.map((option) => (
                  <div key={option.value} className="text-sm">
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-gray-600">{option.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isInviting}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isInviting ? "Sending invite..." : "Send invite"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
