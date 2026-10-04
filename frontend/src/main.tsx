import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useMemo, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import type { Student } from "./api";
import { AuthContext } from "./auth";
import "./index.css";

function Root() {
  const [student, setStudent] = useState<Student | null>(() => {
    try {
      const raw = localStorage.getItem("campus_copilot_student");
      return raw ? (JSON.parse(raw) as Student) : null;
    } catch {
      return null;
    }
  });
  const value = useMemo(
    () => ({
      student,
      setSession: (_token: string | null, next: Student | null) => {
        setStudent(next);
        if (next) localStorage.setItem("campus_copilot_student", JSON.stringify(next));
        else localStorage.removeItem("campus_copilot_student");
      },
    }),
    [student],
  );

  return (
    <AuthContext.Provider value={value}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
