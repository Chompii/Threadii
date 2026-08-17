import { useState } from "react";
import { signup, login } from "../api/client.js";
import { setToken } from "../auth.js";
import Logo from "./Logo.jsx";
import Spinner from "./Spinner.jsx";

const fieldClass =
  "w-full rounded-xl border border-taupe/25 bg-white px-3 py-2.5 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-steel/40";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const action = mode === "login" ? login : signup;
      const { token, user } = await action(email.trim(), password);
      setToken(token);
      onAuthenticated(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Logo size={56} />
          <h1 className="font-display font-extrabold text-3xl text-ink tracking-tight">Threadii</h1>
          <p className="font-caption text-sm text-taupe text-center">
            Outfits from the clothes you already own.
          </p>
        </div>

        <div className="flex gap-1 bg-sky/20 rounded-full p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full py-1.5 text-sm font-body font-bold transition-colors ${
              mode === "login" ? "bg-white text-ink shadow-sm" : "text-taupe"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full py-1.5 text-sm font-body font-bold transition-colors ${
              mode === "signup" ? "bg-white text-ink shadow-sm" : "text-taupe"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
          <input
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={mode === "signup" ? "Password (min. 8 characters)" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />

          {error && <p className="font-caption text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-steel text-cream py-3 text-sm font-body font-bold active:bg-steel-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Spinner size={16} />}
            {submitting ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-taupe/20" />
          <span className="font-caption text-xs text-taupe">or</span>
          <div className="flex-1 h-px bg-taupe/20" />
        </div>

        <div className="space-y-2">
          <OAuthButton label="Continue with Google" />
          <OAuthButton label="Continue with Apple" />
        </div>
      </div>
    </div>
  );
}

function OAuthButton({ label }) {
  return (
    <button
      type="button"
      disabled
      className="w-full rounded-xl border border-taupe/25 bg-white py-2.5 text-sm font-body font-bold text-taupe/70 flex items-center justify-center gap-2 cursor-not-allowed"
    >
      {label}
      <span className="font-caption text-[10px] px-1.5 py-0.5 rounded-full bg-taupe/10 text-taupe">
        Coming soon
      </span>
    </button>
  );
}
