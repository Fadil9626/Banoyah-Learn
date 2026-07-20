import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import api from "../lib/api";
import Brand from "../components/Brand";
import ThemeToggle from "../components/ThemeToggle";
import PoweredBy from "../components/PoweredBy";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [pw, setPw] = useState({ new_password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.new_password.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw.new_password !== pw.confirm) return toast.error("Passwords don't match");
    setBusy(true);
    try {
      await api("auth/reset", { method: "POST", body: JSON.stringify({ token, new_password: pw.new_password }) });
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 1800);
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
          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto text-ok" style={{ backgroundColor: "rgb(var(--ok) / 0.12)" }}>
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-xl font-black text-content mt-4">Password reset</h2>
              <p className="text-sm text-muted mt-2">Taking you to the sign-in page…</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black text-content tracking-tight">Choose a new password</h2>
              <p className="text-sm text-muted mt-1">Set a new password for your account.</p>
              <form onSubmit={submit} className="mt-8 space-y-4">
                <Field label="New password" value={pw.new_password} onChange={(v) => setPw((s) => ({ ...s, new_password: v }))} placeholder="At least 8 characters" autoFocus />
                <Field label="Confirm password" value={pw.confirm} onChange={(v) => setPw((s) => ({ ...s, confirm: v }))} placeholder="Repeat password" />
                <button className="btn-brand w-full" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : "Reset password"}</button>
                <Link to="/login" className="block text-center text-xs text-muted hover:text-content">← Back to sign in</Link>
              </form>
            </>
          )}
          <PoweredBy className="mt-10" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, autoFocus }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input type="password" className="input pl-10" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} />
      </div>
    </div>
  );
}
