/**
 * StudentShellProvider.tsx
 * Shares collapsed state for the student portal left sidebar.
 */

"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const SIDEBAR_COLLAPSED_KEY = "rehearse-student-sidebar-collapsed";

type StudentShellContextValue = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

const StudentShellContext = createContext<StudentShellContextValue | null>(null);

/**
 * Provides sidebar collapse state to student shell children.
 */
export function StudentShellProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const toggleSidebar = useCallback((): void => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  return (
    <StudentShellContext.Provider value={{ sidebarCollapsed, toggleSidebar }}>
      {children}
    </StudentShellContext.Provider>
  );
}

/**
 * Reads student shell context — sidebar collapse toggle.
 */
export function useStudentShell(): StudentShellContextValue {
  const ctx = useContext(StudentShellContext);
  if (!ctx) {
    throw new Error("useStudentShell must be used within StudentShellProvider");
  }
  return ctx;
}
