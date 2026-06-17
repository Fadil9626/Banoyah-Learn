import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, Lock, User, Building2, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import Brand from "../components/Brand";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const { login, bootstrap, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // 'login' | 'bootstrap' | null(loading)
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ org_name: "", name: "", email: "", password: "" });

  useEffect(() => { if (user) navigate("/", { replace: true }); }, [user, navigate]);

  useEffect(() => {
    api("auth/status")
      .then((s) => setMode(s.initialised ? "login" : "bootstrap"))
      .catch(() => setMode("login"));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "bootstrap") {
        await bootstrap(form);
        toast.success("Welcome to Banoyah Learn");
      } else {
        await login(form.email, form.password);
      }
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full grid lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden text-white"
        style={{ backgroundImage: "linear-gradient(150deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-black/10 blur-2xl" />
        <div className="relative">
          <Brand />
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-black leading-tight tracking-tight">
            Train your workforce. Certify with confidence.
          </h1>
          <p className="mt-4 text-white/80 text-sm leading-relaxed">
            Courses, assessments and verifiable certificates for your whole team —
            with a clean API so your other systems always know who's certified.
          </p>
        </div>
        <div className="relative text-xs text-white/60">A Banoyah Technologies product</div>
      </div>

      {/* Right — form */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6">
          <div className="lg:hidden"><Brand compact /></div>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-black text-content tracking-tight">
              {mode === "bootstrap" ? "Set up your workspace" : "Welcome back"}
            </h2>
            <p className="text-sm text-muted mt-1">
              {mode === "bootstrap"
                ? "Create your organization and administrator account."
                : "Sign in to continue to Banoyah Learn."}
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              {mode === "bootstrap" && (
                <>
                  <Input icon={Building2} label="Organization name" value={form.org_name}
                    onChange={(v) => set("org_name", v)} placeholder="Ministry of Health" autoFocus />
                  <Input icon={User} label="Your name" value={form.name}
                    onChange={(v) => set("name", v)} placeholder="Jane Doe" />
                </>
              )}
              <Input icon={Mail} type="email" label="Email" value={form.email}
                onChange={(v) => set("email", v)} placeholder="you@example.com" autoFocus={mode === "login"} />
              <Input icon={Lock} type="password" label="Password" value={form.password}
                onChange={(v) => set("password", v)} placeholder={mode === "bootstrap" ? "At least 8 characters" : "••••••••"} />

              <button type="submit" disabled={busy || !mode} className="btn-brand w-full mt-2">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <>
                  {mode === "bootstrap" ? "Create workspace" : "Sign in"}
                  <ArrowRight size={16} />
                </>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ icon: Icon, label, value, onChange, type = "text", placeholder, autoFocus }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
        <input
          type={type}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input pl-10"
        />
      </div>
    </div>
  );
}
