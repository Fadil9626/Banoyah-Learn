import React, { useState } from "react";
import { toast } from "react-hot-toast";
import QRCode from "qrcode";
import { User, Lock, Loader2, Check, Building2, Mail, Shield, ShieldCheck, Smartphone, X } from "lucide-react";
import api, { setToken } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";

export default function Profile() {
  const { user, org, refresh } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  const saveName = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSavingName(true);
    try { await api("auth/profile", { method: "PUT", body: JSON.stringify({ name: name.trim() }) }); toast.success("Profile updated"); refresh(); }
    catch (e) { toast.error(e.message); } finally { setSavingName(false); }
  };

  const savePw = async () => {
    if (pw.new_password.length < 8) return toast.error("New password must be at least 8 characters");
    if (pw.new_password !== pw.confirm) return toast.error("Passwords don't match");
    setSavingPw(true);
    try {
      const res = await api("auth/password", { method: "PUT", body: JSON.stringify({ current_password: pw.current_password, new_password: pw.new_password }) });
      if (res.token) setToken(res.token); // password change rotates the session token
      toast.success("Password updated");
      setPw({ current_password: "", new_password: "", confirm: "" });
    } catch (e) { toast.error(e.message); } finally { setSavingPw(false); }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="My account" subtitle="Your profile and password." />

      {/* Identity card */}
      <div className="card p-6 flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl grid place-items-center text-xl font-bold text-brand-fg flex-shrink-0" style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}>
          {(user?.name || "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-black text-content truncate">{user?.name}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted">
            <span className="flex items-center gap-1.5"><Mail size={12} />{user?.email}</span>
            <span className="flex items-center gap-1.5 capitalize"><Shield size={12} />{user?.role}</span>
            <span className="flex items-center gap-1.5"><Building2 size={12} />{org?.name}</span>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-content flex items-center gap-2 mb-4"><User size={16} className="text-brand" /> Display name</h3>
        <div className="flex gap-2">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn-brand flex-shrink-0" onClick={saveName} disabled={savingName || name === user?.name}>
            {savingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="card p-6">
        <h3 className="font-bold text-content flex items-center gap-2 mb-4"><Lock size={16} className="text-brand" /> Change password</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <input type="password" className="input" value={pw.current_password} onChange={(e) => setPw((s) => ({ ...s, current_password: e.target.value }))} placeholder="••••••••" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">New password</label>
              <input type="password" className="input" value={pw.new_password} onChange={(e) => setPw((s) => ({ ...s, new_password: e.target.value }))} placeholder="At least 8 characters" />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input type="password" className="input" value={pw.confirm} onChange={(e) => setPw((s) => ({ ...s, confirm: e.target.value }))} placeholder="Repeat new password" />
            </div>
          </div>
          <button className="btn-brand" onClick={savePw} disabled={savingPw || !pw.new_password}>
            {savingPw ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Update password
          </button>
        </div>
      </div>

      <TwoFactor user={user} refresh={refresh} />
    </div>
  );
}

function TwoFactor({ user, refresh }) {
  const enabled = !!user?.totp_enabled;
  const [setup, setSetup] = useState(null); // { secret, qr } during enrollment
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const r = await api("auth/2fa/start", { method: "POST" });
      const qr = await QRCode.toDataURL(r.otpauth_url, { margin: 1, width: 200 });
      setSetup({ secret: r.secret, qr });
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const enable = async () => {
    setBusy(true);
    try {
      const r = await api("auth/2fa/enable", { method: "POST", body: JSON.stringify({ code }) });
      if (r.token) setToken(r.token);
      toast.success("Two-factor enabled");
      setSetup(null); setCode(""); refresh();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const disable = async () => {
    setBusy(true);
    try {
      const r = await api("auth/2fa/disable", { method: "POST", body: JSON.stringify({ password: pw }) });
      if (r.token) setToken(r.token);
      toast.success("Two-factor disabled");
      setDisabling(false); setPw(""); refresh();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="card p-6 mt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-content flex items-center gap-2"><ShieldCheck size={16} className="text-brand" /> Two-factor authentication</h3>
          <p className="text-sm text-muted mt-1">Require a code from an authenticator app when signing in.</p>
        </div>
        <span className="chip flex-shrink-0" style={{ backgroundColor: enabled ? "rgb(var(--ok) / 0.14)" : "rgb(var(--muted) / 0.14)", color: enabled ? "rgb(var(--ok))" : "rgb(var(--muted))" }}>
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {!enabled && !setup && (
        <button className="btn-brand mt-4" onClick={start} disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />} Enable 2FA</button>
      )}

      {!enabled && setup && (
        <div className="mt-4 flex flex-col sm:flex-row gap-5 items-start">
          <img src={setup.qr} alt="2FA QR code" className="rounded-xl border border-line bg-white p-1.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-muted">Scan with Google Authenticator, Authy, 1Password, etc. — or enter this key manually:</p>
            <code className="block mt-2 font-mono text-xs text-content bg-surface-2 border border-line rounded-lg px-3 py-2 break-all">{setup.secret}</code>
            <label className="label mt-4">Enter the 6-digit code to confirm</label>
            <div className="flex gap-2">
              <input className="input font-mono tracking-widest" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" />
              <button className="btn-brand flex-shrink-0" onClick={enable} disabled={busy || code.length !== 6}>{busy ? <Loader2 size={16} className="animate-spin" /> : "Confirm"}</button>
            </div>
            <button className="text-xs text-muted hover:text-content mt-3" onClick={() => { setSetup(null); setCode(""); }}>Cancel</button>
          </div>
        </div>
      )}

      {enabled && !disabling && (
        <button className="btn-ghost mt-4" onClick={() => setDisabling(true)}><X size={16} /> Disable 2FA</button>
      )}
      {enabled && disabling && (
        <div className="mt-4 max-w-sm">
          <label className="label">Confirm your password to disable</label>
          <div className="flex gap-2">
            <input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
            <button className="btn-brand flex-shrink-0" style={{ backgroundImage: "none", backgroundColor: "rgb(var(--danger))" }} onClick={disable} disabled={busy || !pw}>{busy ? <Loader2 size={16} className="animate-spin" /> : "Disable"}</button>
          </div>
          <button className="text-xs text-muted hover:text-content mt-2" onClick={() => { setDisabling(false); setPw(""); }}>Cancel</button>
        </div>
      )}
    </div>
  );
}
