/**
 * StudentSidebar.tsx
 * Fixed left navigation for the student portal — mirrors professor sidebar styling.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { DEFAULT_CLASS_ID, DEFAULT_CLASS_NAME } from "@/lib/constants";
import { useStudentShell } from "./StudentShellProvider";

export type StudentSidebarClass = {
  classId: string;
  className: string;
};

type StudentSidebarProps = {
  enrolledClasses: StudentSidebarClass[];
};

type NavItem = {
  key: string;
  label: string;
  icon: string;
  href: string;
};

const PRIMARY_NAV: NavItem[] = [
  { key: "dashboard", label: "My Classes", icon: "school", href: "/student/dashboard" },
];

/**
 * Resolves which primary nav item is active from the current path.
 */
function resolveActiveNav(pathname: string): string {
  if (pathname.startsWith("/student/classes")) {
    return "classes";
  }
  return "dashboard";
}

/**
 * Renders the student portal left sidebar with enrolled class links.
 */
export function StudentSidebar({ enrolledClasses }: StudentSidebarProps): React.ReactElement {
  const pathname = usePathname();
  const activeNav = resolveActiveNav(pathname);
  const { sidebarCollapsed, toggleSidebar } = useStudentShell();

  return (
    <aside
      className={`hidden md:flex flex-col h-full bg-surface-container-low border-r border-outline-variant shrink-0 transition-all duration-300 ease-in-out gap-2 ${
        sidebarCollapsed ? "w-[72px] p-2" : "w-64 p-4"
      }`}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        className={`flex items-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-all duration-200 h-8 ${
          sidebarCollapsed ? "justify-center w-full" : "justify-end px-1 w-full"
        }`}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <MaterialIcon
          name={sidebarCollapsed ? "chevron_right" : "chevron_left"}
          className="text-[20px]"
        />
      </button>

      <nav className="flex flex-col gap-1">
        {PRIMARY_NAV.map((item) => {
          const isActive =
            item.key === activeNav ||
            (item.key === "dashboard" && activeNav === "classes");
          return (
            <Link
              key={item.key}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={`flex items-center py-2 rounded-lg transition-all duration-200 ${
                sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"
              } ${
                isActive
                  ? "bg-primary-container text-on-primary-container font-bold"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              <MaterialIcon name={item.icon} className="text-[20px] shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-label-sm text-label-sm">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {!sidebarCollapsed && enrolledClasses.length > 0 && (
        <div className="pt-2">
          <p className="px-3 py-1 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Enrolled
          </p>
          <div className="flex flex-col gap-0.5 mt-1 max-h-[40vh] overflow-y-auto custom-scrollbar">
            {enrolledClasses.map((cls) => {
              const href = `/student/classes/${cls.classId}`;
              const isActive = pathname === href;
              const label =
                cls.classId === DEFAULT_CLASS_ID ? DEFAULT_CLASS_NAME : cls.className;

              return (
                <Link
                  key={cls.classId}
                  href={href}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-label-sm transition-all duration-200 truncate ${
                    isActive
                      ? "bg-secondary-fixed text-secondary font-bold"
                      : "text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  <MaterialIcon
                    name={cls.classId === DEFAULT_CLASS_ID ? "auto_awesome" : "folder"}
                    className="text-[18px] shrink-0"
                  />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-outline-variant">
        <p
          className={`text-on-surface-variant/60 font-label-sm ${
            sidebarCollapsed ? "text-center text-[10px]" : "px-3"
          }`}
        >
          {sidebarCollapsed ? "Stu" : "Student Portal"}
        </p>
      </div>
    </aside>
  );
}
