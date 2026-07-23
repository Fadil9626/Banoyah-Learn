import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { UserPlus, Search, X, Loader2, Mail, ShieldCheck, FileUp, Download, CheckCircle2, AlertTriangle, KeyRound, Users2 } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";

const ROLE_STYLE = {
  admin:      { bg: "rgb(var(--brand) / 0.12)",  fg: "rgb(var(--brand))" },
  instructor: { bg: "rgb(var(--brand-2) / 0.12)", fg: "rgb(var(--brand-2))" },
  manager:    { bg: "rgb(var(--warn) / 0.14)",   fg: "rgb(var(--warn))" },
  learner:    { bg: "rgb(var(--muted) / 0.14)",  fg: "rgb(var(--muted))" },
};

export default function People() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "instructor";
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  const load = () => {
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    api(`users${params}`).then(setRows).catch((e) => { toast.error(e.message); setRows([]); });
  };
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [q]); // eslint-disable-line

  const visible = (rows || []).filter((u) => role === "all" || u.role === role);
  const roleCounts = (rows || []).reduce((m, u) => ({ ...m, [u.role]: (m[u.role] || 0) + 1 }), {});

  return (
    <div>
      <PageHeader title="Staff" subtitle={canManage ? "Everyone in your organization who learns, teaches or administers." : "Your team."}>
        {canManage && <>
          <button className="btn-ghost" onClick={() => setImporting(true)}>
            <FileUp size={16} /> Import CSV
          </button>
          <button className="btn-brand" onClick={() => setAdding(true)}>
            <UserPlus size={16} /> Add staff
          </button>
        </>}
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="p-3 border-b border-line flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input className="input pl-10" placeholder="Search by name or email…"
              value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {rows?.length > 0 && (
            <div className="flex gap-1 p-1 rounded-xl bg-surface-2 overflow-x-auto">
              {[["all", "All"], ["learner", "Learners"], ["manager", "Managers"], ["instructor", "Instructors"], ["admin", "Admins"]]
                .filter(([k]) => k === "all" || roleCounts[k])
                .map(([k, l]) => (
                  <button key={k} onClick={() => setRole(k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${role === k ? "text-brand-fg" : "text-muted hover:text-content"}`}
                    style={role === k ? { backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" } : undefined}>
                    {l}{k !== "all" && <span className="opacity-70"> {roleCounts[k]}</span>}
                  </button>
                ))}
            </div>
          )}
        </div>

        {rows == null ? (
          <div className="py-20 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
        ) : rows.length === 0 ? (
          <Empty onAdd={() => setAdding(true)} />
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-muted text-sm">No {role}s match.</div>
        ) : (
          <div className="divide-y divide-line">
            {visible.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-4 sm:px-5 py-3.5 hover:bg-surface-2/50 transition">
                <div className="w-9 h-9 rounded-full grid place-items-center text-xs font-bold text-brand-fg flex-shrink-0"
                  style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}>
                  {u.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content truncate">{u.name}</p>
                  <p className="text-xs text-muted truncate flex items-center gap-1.5"><Mail size={11} />{u.email}</p>
                </div>
                {u.team && (
                  <span className="hidden md:flex chip bg-surface-2 text-muted" title="Team / unit"><Users2 size={11} />{u.team}</span>
                )}
                {u.external_id && (
                  <span className="hidden lg:flex chip bg-surface-2 text-faint font-mono" title="External ID for API mapping">
                    <ShieldCheck size={11} />{u.external_id}
                  </span>
                )}
                {!u.has_password && (
                  <span className="chip flex-shrink-0" title="This person has no password and cannot sign in yet"
                    style={{ backgroundColor: "rgb(var(--warn) / 0.14)", color: "rgb(var(--warn))" }}>No login</span>
                )}
                <span className="chip capitalize flex-shrink-0"
                  style={{ backgroundColor: ROLE_STYLE[u.role]?.bg, color: ROLE_STYLE[u.role]?.fg }}>
                  {u.role}
                </span>
                {canManage && (
                  <button onClick={() => setResetTarget(u)} title={u.has_password ? "Reset password" : "Set password"}
                    className="text-faint hover:text-brand p-1.5 flex-shrink-0"><KeyRound size={15} /></button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {adding && <AddModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
      {importing && <ImportModal onClose={() => setImporting(false)} onDone={() => { setImporting(false); load(); }} />}
      {resetTarget && <ResetModal user={resetTarget} onClose={() => setResetTarget(null)} onDone={() => { setResetTarget(null); load(); }} />}
    </div>
  );
}

function ResetModal({ user, onClose, onDone }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    try {
      await api(`users/${user.id}`, { method: "PATCH", body: JSON.stringify({ password: pw }) });
      toast.success(`Password ${user.has_password ? "reset" : "set"} for ${user.name}`);
      onDone();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-content text-lg">{user.has_password ? "Reset password" : "Set password"}</h3>
          <button className="text-faint hover:text-content" onClick={onClose}><X size={18} /></button>
        </div>
        <p className="text-sm text-muted mb-4">Set a password for <span className="font-semibold text-content">{user.name}</span>. Share it with them to sign in; they can change it under My account.</p>
        <form onSubmit={save} className="space-y-4">
          <input type="text" className="input font-mono" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (min 8 chars)" autoFocus />
          <div className="flex gap-3">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-brand flex-1" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportModal({ onClose, onDone }) {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const ref = useRef();

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setCsv(String(ev.target.result || ""));
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const sample = "name,email,role,job_title,external_id\nJane Doe,jane@example.com,learner,Lab Technician,staff-001\nJohn Roe,john@example.com,instructor,Trainer,staff-002\n";
    const url = URL.createObjectURL(new Blob([sample], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "people-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const submit = async () => {
    if (!csv.trim()) return toast.error("Choose a CSV file first");
    setBusy(true);
    try {
      const r = await api("users/import", { method: "POST", body: JSON.stringify({ csv }) });
      setResult(r);
      if (r.created) toast.success(`Imported ${r.created} staff ${r.created === 1 ? "member" : "members"}`);
      else if (!r.errors.length) toast(`No new people (${r.skipped} already existed)`);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const dataRows = csv.trim() ? Math.max(0, csv.trim().split(/\r?\n/).length - 1) : 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-content text-lg">Import people from CSV</h3>
          <button className="text-faint hover:text-content" onClick={onClose}><X size={18} /></button>
        </div>

        {!result ? (
          <>
            <input ref={ref} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
            <button onClick={() => ref.current?.click()}
              className="w-full border-2 border-dashed border-line rounded-2xl py-8 flex flex-col items-center gap-2 hover:border-brand hover:bg-surface-2/50 transition">
              <FileUp size={26} className="text-faint" />
              <span className="text-sm font-semibold text-content">{fileName || "Choose a CSV file"}</span>
              <span className="text-xs text-muted">{fileName ? `${dataRows} row${dataRows === 1 ? "" : "s"} ready` : "name, email, role, job_title, external_id"}</span>
            </button>
            <div className="flex items-center justify-between mt-3">
              <button onClick={downloadTemplate} className="text-xs font-semibold text-brand flex items-center gap-1.5"><Download size={13} /> Download template</button>
              <span className="text-[11px] text-faint">Existing emails are skipped</span>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
              <button className="btn-brand flex-1" onClick={submit} disabled={busy || !csv.trim()}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : `Import${dataRows ? ` ${dataRows}` : ""}`}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[["Created", result.created, "ok"], ["Skipped", result.skipped, "muted"], ["Errors", result.errors.length, result.errors.length ? "danger" : "muted"]].map(([l, v, t]) => (
                <div key={l} className="bg-surface-2/60 border border-line rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-black tabular-nums" style={{ color: `rgb(var(--${t}))` }}>{v}</p>
                  <p className="text-xs text-muted">{l}</p>
                </div>
              ))}
            </div>
            {result.errors.length > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto rounded-xl border border-line divide-y divide-line">
                {result.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 text-xs">
                    <AlertTriangle size={13} className="text-danger flex-shrink-0 mt-0.5" />
                    <span className="text-muted">Row {e.row}: {e.reason}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-brand w-full mt-5" onClick={onDone}><CheckCircle2 size={16} /> Done</button>
          </>
        )}
      </div>
    </div>
  );
}

function Empty({ onAdd }) {
  return (
    <div className="py-20 flex flex-col items-center gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-surface-2 grid place-items-center text-faint"><UserPlus size={22} /></div>
      <div>
        <p className="font-semibold text-content">No staff yet</p>
        <p className="text-sm text-muted">Add your first learner to get started.</p>
      </div>
      <button className="btn-brand" onClick={onAdd}><UserPlus size={16} /> Add staff</button>
    </div>
  );
}

function AddModal({ onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", email: "", role: "learner", job_title: "", external_id: "", team: "" });
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
          <h3 className="font-bold text-content text-lg">Add staff</h3>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <select className="input" value={f.role} onChange={(e) => set("role", e.target.value)}>
                <option value="learner">Learner</option>
                <option value="manager">Manager</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Job title</label>
              <input className="input" value={f.job_title} onChange={(e) => set("job_title", e.target.value)} placeholder="Lab technician" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Team <span className="text-faint font-normal">(unit/facility)</span></label>
              <input className="input" value={f.team} onChange={(e) => set("team", e.target.value)} placeholder="District A" />
            </div>
            <div>
              <label className="label">External ID <span className="text-faint font-normal">(API)</span></label>
              <input className="input font-mono" value={f.external_id} onChange={(e) => set("external_id", e.target.value)} placeholder="staff-4921" />
            </div>
          </div>
          {f.role === "manager" && <p className="text-[11px] text-muted -mt-1">A manager sees only the people and reports for their <strong>team</strong>.</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-brand flex-1" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : "Add staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
