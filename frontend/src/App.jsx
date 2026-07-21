import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound"; // eager: an error page shouldn't need a chunk fetch to render

// Code-split every page so the login screen (and a learner's session) never has
// to download the heavy authoring/admin bundles up front.
const Login          = lazy(() => import("./pages/Login"));
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const People         = lazy(() => import("./pages/People"));
const Courses        = lazy(() => import("./pages/Courses"));
const CourseEditor   = lazy(() => import("./pages/CourseEditor"));
const MyLearning     = lazy(() => import("./pages/MyLearning"));
const CoursePlayer   = lazy(() => import("./pages/CoursePlayer"));
const Certificate    = lazy(() => import("./pages/Certificate"));
const Certificates   = lazy(() => import("./pages/Certificates"));
const Reporting      = lazy(() => import("./pages/Reporting"));
const ApiAccess      = lazy(() => import("./pages/ApiAccess"));
const AuditLog       = lazy(() => import("./pages/AuditLog"));
const Settings       = lazy(() => import("./pages/Settings"));
const Profile        = lazy(() => import("./pages/Profile"));
const Verify         = lazy(() => import("./pages/Verify"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword  = lazy(() => import("./pages/ResetPassword"));
const Sso            = lazy(() => import("./pages/Sso"));
const CourseHandout  = lazy(() => import("./pages/CourseHandout"));

function PageLoader() {
  return (
    <div className="min-h-full grid place-items-center text-muted">
      <Loader2 className="animate-spin h-7 w-7 text-brand" />
    </div>
  );
}

// Protected layout group. The Layout is mounted ONCE by the parent route and
// kept alive via <Outlet/> — only the inner page swaps on navigation, so the
// sidebar/topbar (and their state) never remount. Roles: admin | instructor |
// manager | learner — mirroring the backend's requireRole() guards.
function ProtectedLayout({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return (
    <Layout>
      {/* Suspense sits INSIDE the Layout: navigating to a not-yet-loaded page
          chunk spins only the content area — the sidebar/topbar stay put. */}
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
}

// Authenticated but chrome-free — for standalone full-page views like the
// printable course handout (no sidebar/header, so it prints cleanly).
function RequireAuthBare({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Keep already-authenticated users out of the login/forgot screens, sending them
// back to where they were headed (or the dashboard).
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to={location.state?.from?.pathname || "/"} replace />;
  return children;
}

const STAFF = ["admin", "instructor"];
const OVERSIGHT = ["admin", "instructor", "manager"]; // People + Reporting (managers are team-scoped)
const ADMIN = ["admin"];

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public auth screens — redirect away if already signed in */}
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/forgot" element={<PublicOnly><ForgotPassword /></PublicOnly>} />

        {/* Pure public — reset links, SSO hand-off, and verification must always work */}
        <Route path="/reset/:token" element={<ResetPassword />} />
        <Route path="/sso/:token" element={<Sso />} />
        <Route path="/verify/:serial" element={<Verify />} />

        {/* Authenticated, chrome-free printable handout */}
        <Route path="/learn/:id/handout" element={<RequireAuthBare><CourseHandout /></RequireAuthBare>} />

        {/* Anyone signed in (Layout mounted once) */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/learn" element={<MyLearning />} />
          <Route path="/learn/certificate/:serial" element={<Certificate />} />
          <Route path="/learn/:id" element={<CoursePlayer />} />
          <Route path="/profile" element={<Profile />} />
          {/* Unknown in-app path → 404 within the Layout, not a silent bounce home */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Oversight: admin + instructor + manager */}
        <Route element={<ProtectedLayout allowedRoles={OVERSIGHT} />}>
          <Route path="/people" element={<People />} />
          <Route path="/reporting" element={<Reporting />} />
        </Route>

        {/* Authoring: admin + instructor */}
        <Route element={<ProtectedLayout allowedRoles={STAFF} />}>
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseEditor />} />
          <Route path="/certificates" element={<Certificates />} />
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedLayout allowedRoles={ADMIN} />}>
          <Route path="/api-access" element={<ApiAccess />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

      </Routes>
    </Suspense>
  );
}
