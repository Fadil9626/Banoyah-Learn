import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { User, Lock, Loader2, Check, Building2, Mail, Shield } from "lucide-react";
import api from "../lib/api";
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
      await api("auth/password", { method: "PUT", body: JSON.stringify({ current_password: pw.current_password, new_password: pw.new_password }) });
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
    </div>
  );
}
