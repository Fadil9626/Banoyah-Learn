import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import api from "../lib/api";
import Brand from "../components/Brand";
import ThemeToggle from "../components/ThemeToggle";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("auth/forgot", { method: "POST", body: JSON.stringify({ email }) });
      setSent(true);
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-full bg-bg flex flex-col">
      <header className="flex items-center justify-between p-6">
        <Brand compact />
        <ThemeToggle />
      </header>
      <div className="flex-1 grid place-items-center px-6 pb-20">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto text-ok" style={{ backgroundColor: "rgb(var(--ok) / 0.12)" }}>
                <MailCheck size={28} />
              </div>
              <h2 className="text-xl font-black text-content mt-4">Check your email</h2>
              <p className="text-sm text-muted mt-2">If <strong className="text-content">{email}</strong> is registered, we've sent a link to reset your password. It's valid for 1 hour.</p>
              <Link to="/login" className="btn-ghost mt-6 inline-flex"><ArrowLeft size={16} /> Back to sign in</Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black text-content tracking-tight">Forgot your password?</h2>
              <p className="text-sm text-muted mt-1">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={submit} className="mt-8 space-y-4">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                    <input type="email" className="input pl-10" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
                  </div>
                </div>
                <button className="btn-brand w-full" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : "Send reset link"}</button>
                <Link to="/login" className="block text-center text-xs text-muted hover:text-content">← Back to sign in</Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
