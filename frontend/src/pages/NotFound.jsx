import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Compass, ArrowLeft, LayoutDashboard } from "lucide-react";

// Rendered by the catch-all route. Lives inside the Layout for signed-in users,
// so they keep their sidebar/topbar and get a clear "this page doesn't exist"
// instead of being silently bounced to the dashboard.
export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] grid place-items-center text-center px-6">
      <div>
        <div className="w-16 h-16 rounded-2xl grid place-items-center mx-auto text-brand"
          style={{ backgroundColor: "rgb(var(--brand) / 0.12)" }}>
          <Compass size={30} />
        </div>
        <p className="mt-6 text-5xl font-black text-content tracking-tight tabular-nums">404</p>
        <h1 className="mt-2 text-lg font-bold text-content">Page not found</h1>
        <p className="mt-1.5 text-sm text-muted max-w-sm mx-auto">
          The page you're looking for doesn't exist or may have moved. If you followed a link, it might be out of date.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost"><ArrowLeft size={16} /> Go back</button>
          <Link to="/" className="btn-brand"><LayoutDashboard size={16} /> Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
