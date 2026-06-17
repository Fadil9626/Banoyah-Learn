import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

// Code-split every page so the login screen (and a learner's session) never has
// to download the heavy authoring/admin bundles up front.
const Login        = lazy(() => import("./pages/Login"));
const Dashboard    = lazy(() => import("./pages/Dashboard"));
const People       = lazy(() => import("./pages/People"));
const Courses      = lazy(() => import("./pages/Courses"));
const CourseEditor = lazy(() => import("./pages/CourseEditor"));
const MyLearning   = lazy(() => import("./pages/MyLearning"));
const CoursePlayer = lazy(() => import("./pages/CoursePlayer"));
const Certificate  = lazy(() => import("./pages/Certificate"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Reporting    = lazy(() => import("./pages/Reporting"));
const ApiAccess    = lazy(() => import("./pages/ApiAccess"));
const AuditLog     = lazy(() => import("./pages/AuditLog"));
const Settings     = lazy(() => import("./pages/Settings"));
const Profile      = lazy(() => import("./pages/Profile"));
const Verify       = lazy(() => import("./pages/Verify"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword  = lazy(() => import("./pages/ResetPassword"));

function PageLoader() {
  return (
    <div className="min-h-full grid place-items-center text-muted">
      <Loader2 className="animate-spin h-7 w-7 text-brand" />
    </div>
  );
}

// Route guard: requires a session, and (optionally) one of `allowedRoles`.
// Roles in this app are: admin | instructor | learner. These mirror the backend's
// requireRole() guards exactly — the API is the real authority; this just keeps
// learners/instructors out of admin UI even by direct URL.
function Protected({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

const STAFF = ["admin", "instructor"];
const OVERSIGHT = ["admin", "instructor", "manager"]; // can view People + Reporting
const ADMIN = ["admin"];

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/verify/:serial" element={<Verify />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset/:token" element={<ResetPassword />} />

        {/* Anyone signed in */}
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/learn" element={<Protected><MyLearning /></Protected>} />
        <Route path="/learn/certificate/:serial" element={<Protected><Certificate /></Protected>} />
        <Route path="/learn/:id" element={<Protected><CoursePlayer /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />

        {/* Oversight (admin + instructor + manager) — managers are team-scoped */}
        <Route path="/people" element={<Protected allowedRoles={OVERSIGHT}><People /></Protected>} />
        <Route path="/reporting" element={<Protected allowedRoles={OVERSIGHT}><Reporting /></Protected>} />

        {/* Staff only (admin + instructor) — matches backend requireRole */}
        <Route path="/courses" element={<Protected allowedRoles={STAFF}><Courses /></Protected>} />
        <Route path="/courses/:id" element={<Protected allowedRoles={STAFF}><CourseEditor /></Protected>} />
        <Route path="/certificates" element={<Protected allowedRoles={STAFF}><Certificates /></Protected>} />

        {/* Admin only */}
        <Route path="/api-access" element={<Protected allowedRoles={ADMIN}><ApiAccess /></Protected>} />
        <Route path="/audit" element={<Protected allowedRoles={ADMIN}><AuditLog /></Protected>} />
        <Route path="/settings" element={<Protected allowedRoles={ADMIN}><Settings /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
