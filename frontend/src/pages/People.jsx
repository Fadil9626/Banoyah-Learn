import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { UserPlus, Search, X, Loader2, Mail, ShieldCheck } from "lucide-react";
import api from "../lib/api";
import PageHeader from "../components/PageHeader";

const ROLE_STYLE = {
  admin:      { bg: "rgb(var(--brand) / 0.12)",  fg: "rgb(var(--brand))" },
  instructor: { bg: "rgb(var(--brand-2) / 0.12)", fg: "rgb(var(--brand-2))" },
  learner:    { bg: "rgb(var(--muted) / 0.14)",  fg: "rgb(var(--muted))" },
};

export default function People() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () => {
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    api(`users${params}`).then(setRows).catch((e) => { toast.error(e.message); setRows([]); });
  };
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [q]); // eslint-disable-line

  return (
    <div>
      <PageHeader title="People" subtitle="Learners, instructors and admins in your organization.">
        <button className="btn-brand" onClick={() => setAdding(true)}>
          <UserPlus size={16} /> Add person
        </button>
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="p-3 border-b border-line">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input className="input pl-10" placeholder="Search by name or email…"
              value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {rows == null ? (
          <div className="py-20 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
        ) : rows.length === 0 ? (
          <Empty onAdd={() => setAdding(true)} />
        ) : (
          <div className="divide-y divide-line">
            {rows.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-4 sm:px-5 py-3.5 hover:bg-surface-2/50 transition">
                <div className="w-9 h-9 rounded-full grid place-items-center text-xs font-bold text-brand-fg flex-shrink-0"
                  style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}>
                  {u.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content truncate">{u.name}</p>
                  <p className="text-xs text-muted truncate flex items-center gap-1.5"><Mail size={11} />{u.email}</p>
                </div>
                {u.job_title && <span className="hidden md:block text-xs text-muted truncate max-w-[160px]">{u.job_title}</span>}
                {u.external_id && (
                  <span className="hidden lg:flex chip bg-surface-2 text-faint font-mono" title="External ID for API mapping">
                    <ShieldCheck size={11} />{u.external_id}
                  </span>
                )}
                <span className="chip capitalize flex-shrink-0"
                  style={{ backgroundColor: ROLE_STYLE[u.role]?.bg, color: ROLE_STYLE[u.role]?.fg }}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {adding && <AddModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
    </div>
  );
}

function Empty({ onAdd }) {
  return (
    <div className="py-20 flex flex-col items-center gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-surface-2 grid place-items-center text-faint"><UserPlus size={22} /></div>
      <div>
        <p className="font-semibold text-content">No people yet</p>
        <p className="text-sm text-muted">Add your first learner to get started.</p>
      </div>
      <button className="btn-brand" onClick={onAdd}><UserPlus size={16} /> Add person</button>
    </div>
  );
}

function AddModal({ onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", email: "", role: "learner", job_title: "", external_id: "" });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("users", { method: "POST", body: JSON.stringify(f) });
      toast.success("Person added");
      onSaved();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-content text-lg">Add person</h3>
          <button className="text-faint hover:text-content" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" autoFocus />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <select className="input" value={f.role} onChange={(e) => set("role", e.target.value)}>
                <option value="learner">Learner</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Job title</label>
              <input className="input" value={f.job_title} onChange={(e) => set("job_title", e.target.value)} placeholder="Lab technician" />
            </div>
          </div>
          <div>
            <label className="label">External ID <span className="text-faint font-normal">(optional — for API mapping)</span></label>
            <input className="input font-mono" value={f.external_id} onChange={(e) => set("external_id", e.target.value)} placeholder="staff-4921" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-brand flex-1" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : "Add person"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
