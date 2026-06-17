import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import People from "./pages/People";
import Courses from "./pages/Courses";
import CourseEditor from "./pages/CourseEditor";
import MyLearning from "./pages/MyLearning";
import CoursePlayer from "./pages/CoursePlayer";
import Certificate from "./pages/Certificate";
import ApiAccess from "./pages/ApiAccess";
import Settings from "./pages/Settings";
import Reporting from "./pages/Reporting";
import Certificates from "./pages/Certificates";
import Placeholder from "./pages/Placeholder";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-full grid place-items-center text-muted">
      <Loader2 className="animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/people" element={<Protected><People /></Protected>} />
      <Route path="/courses" element={<Protected><Courses /></Protected>} />
      <Route path="/courses/:id" element={<Protected><CourseEditor /></Protected>} />
      <Route path="/learn" element={<Protected><MyLearning /></Protected>} />
      <Route path="/learn/certificate/:serial" element={<Protected><Certificate /></Protected>} />
      <Route path="/learn/:id" element={<Protected><CoursePlayer /></Protected>} />
      <Route path="/certificates" element={<Protected><Certificates /></Protected>} />
      <Route path="/reporting" element={<Protected><Reporting /></Protected>} />
      <Route path="/api-access" element={<Protected><ApiAccess /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
