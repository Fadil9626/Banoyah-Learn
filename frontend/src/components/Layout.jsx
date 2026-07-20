import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, Award, Plug, BarChart3,
  Settings, LogOut, Menu, X, GraduationCap, ScrollText, Building2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";

// `roles` lists who sees each item; omit it for "everyone signed in".
const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/learn", label: "My Learning", icon: GraduationCap },
  { to: "/people", label: "People", icon: Users, roles: ["admin", "instructor", "manager"] },
  { to: "/courses", label: "Courses", icon: BookOpen, roles: ["admin", "instructor"] },
  { to: "/certificates", label: "Certificates", icon: Award, roles: ["admin", "instructor"] },
  { to: "/reporting", label: "Reporting", icon: BarChart3, roles: ["admin", "instructor", "manager"] },
  { to: "/api-access", label: "API access", icon: Plug, roles: ["admin"] },
  { to: "/audit", label: "Audit log", icon: ScrollText, roles: ["admin"] },
];

export default function Layout({ children }) {
  const { user, org, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = () => { logout(); navigate("/login", { replace: true }); };

  const isAdmin = user?.role === "admin";
  const nav = NAV.filter((n) => !n.roles || n.roles.includes(user?.role));

  return (
    <div className="min-h-full flex bg-bg">
      {/* Sidebar */}
      <aside className={`fixed z-40 inset-y-0 left-0 w-64 bg-surface border-r border-line flex flex-col
        transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-line">
          <Brand />
          <button className="lg:hidden text-muted hover:text-content" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, end, soon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-brand/10 text-brand"
                    : "text-muted hover:text-content hover:bg-surface-2"
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {soon && <span className="chip bg-surface-2 text-faint">Soon</span>}
            </NavLink>
          ))}
        </nav>

        {isAdmin && (
          <div className="p-3 border-t border-line">
            <NavLink to="/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted hover:text-content hover:bg-surface-2 transition">
              <Settings size={18} /> Settings
            </NavLink>
          </div>
        )}
      </aside>

      {/* Backdrop on mobile */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64 min-w-0 flex flex-col">
        <header className="h-16 sticky top-0 z-20 bg-bg/80 backdrop-blur border-b border-line flex items-center gap-3 px-4 sm:px-6">
          <button className="lg:hidden text-muted hover:text-content" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg grid place-items-center bg-surface-2 text-muted flex-shrink-0"><Building2 size={16} /></div>
            <div className="min-w-0 leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">Workspace</p>
              <p className="text-sm font-bold text-content truncate">{org?.name || "Workspace"}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2.5 pl-3 border-l border-line">
              <NavLink to="/profile" className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 -mx-1.5 hover:bg-surface-2 transition" title="My account">
                <div className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-brand-fg"
                  style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}>
                  {(user?.name || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden sm:block leading-tight text-left">
                  <p className="text-xs font-bold text-content">{user?.name}</p>
                  <p className="text-[10px] text-faint capitalize">{user?.role}</p>
                </div>
              </NavLink>
              <button onClick={doLogout} title="Sign out"
                className="ml-1 text-faint hover:text-danger transition">
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
