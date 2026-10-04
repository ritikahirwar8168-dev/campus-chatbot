import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getToken } from "./api";
import AppShell from "./AppShell";
import { useAuth } from "./auth";
import AcademicsPage from "./pages/AcademicsPage";
import AIToolsPage from "./pages/AIToolsPage";
import AssistantPage from "./pages/AssistantPage";
import AttendancePage from "./pages/AttendancePage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ProductivityPage from "./pages/ProductivityPage";

function Protected({ children }: { children: ReactElement }) {
  const { student } = useAuth();
  if (!student && !getToken()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="academics" element={<AcademicsPage />} />
        <Route path="productivity" element={<ProductivityPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="ai-tools" element={<AIToolsPage />} />
      </Route>
    </Routes>
  );
}
