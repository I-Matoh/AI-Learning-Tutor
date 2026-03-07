import React, { useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

type Props = {
  children: React.ReactNode;
};

type ProfileResponse = {
  user: {
    id: string;
    email: string | null;
  };
};

export const AuthShell: React.FC<Props> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse["user"] | null>(null);
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || "http://localhost:4000",
    []
  );

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setProfile(null);
      setProfileError("");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setError("");
    setMessage("");
    setSubmitting(true);

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      setSubmitting(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.session) {
        setMessage("Account created. Check your email to confirm signup.");
        return;
      }

      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }
  };

  const fetchProfile = async () => {
    if (!session?.access_token) return;

    setProfileLoading(true);
    setProfileError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/profile`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed (${response.status}).`);
      }

      const data: ProfileResponse = await response.json();
      setProfile(data.user);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {mode === "login" ? "Sign in" : "Create account"}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Authenticate with Supabase to access AI Learning Tutor.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="email"
              disabled={submitting}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="current-password"
              disabled={submitting}
            />

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-700">{message}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 text-white py-3 font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting
                ? "Please wait..."
                : mode === "login"
                  ? "Login"
                  : "Sign up"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setMessage("");
            }}
            className="w-full mt-4 text-sm text-indigo-700 hover:text-indigo-900 font-medium"
          >
            {mode === "login"
              ? "No account yet? Sign up"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="fixed top-3 right-3 z-50 bg-white/95 border border-slate-200 shadow-lg rounded-xl p-3 text-sm flex items-center gap-2">
        <span className="text-slate-700 max-w-56 truncate">{session.user.email}</span>
        <button
          onClick={fetchProfile}
          className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          disabled={profileLoading}
        >
          {profileLoading ? "Loading..." : "Profile"}
        </button>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          Logout
        </button>
      </div>

      {(profile || profileError) && (
        <div className="fixed top-16 right-3 z-50 w-80 bg-white border border-slate-200 shadow-lg rounded-xl p-3 text-sm">
          {profileError ? (
            <p className="text-red-600 break-words">{profileError}</p>
          ) : (
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">Protected Profile</p>
              <p className="text-slate-600 break-all">id: {profile?.id}</p>
              <p className="text-slate-600 break-all">email: {profile?.email}</p>
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
};
