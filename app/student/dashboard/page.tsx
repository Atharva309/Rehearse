/**
 * dashboard/page.tsx — student
 * Lists enrolled classes as styled cards; simulations live inside each class.
 */

import { redirect } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { StudentClassCard } from "@/components/StudentClassCard";
import {
  StudentAttemptHistory,
  type StudentAttemptRow,
} from "@/components/StudentAttemptHistory";
import { loadStudentEnrolledClasses } from "@/lib/student-class-data";
import { DEFAULT_CLASS_ID } from "@/lib/constants";
import { getStudentSession } from "@/lib/student-session";
import { createServiceClient } from "@/lib/supabase/server";
import { JoinClassButton } from "./JoinClassButton";

/**
 * Student home — pick a class, then choose a simulation inside it.
 */
export default async function StudentDashboardPage(): Promise<React.ReactElement> {
  const session = await getStudentSession();
  if (!session) {
    redirect("/student-login");
  }

  const enrolledClasses = await loadStudentEnrolledClasses(session.studentId);

  const supabase = createServiceClient();
  const { data: completedAttempts } = await supabase
    .from("attempts")
    .select("id, total_score, completed_at, simulations ( id, title, persona_name )")
    .eq("student_id", session.studentId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(20);

  const history: StudentAttemptRow[] = (completedAttempts ?? []).map((row) => {
    const sim = row.simulations;
    const simulation = Array.isArray(sim) ? sim[0] ?? null : sim;
    return {
      id: row.id as string,
      total_score: row.total_score as number,
      completed_at: row.completed_at as string | null,
      simulations: simulation as StudentAttemptRow["simulations"],
    };
  });

  return (
    <div className="px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome back, {session.displayName}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {enrolledClasses.length === 0
              ? "Join a class to get started."
              : enrolledClasses.length === 1
                ? "Open your class to start a simulation."
                : `${enrolledClasses.length} classes — open one to view simulations.`}
          </p>
        </div>
        <JoinClassButton />
      </div>

      {enrolledClasses.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="No classes yet."
          description="Use the Join a Class button above with your professor's class code to get started."
        />
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrolledClasses.map((cls) => (
            <StudentClassCard
              key={cls.classId}
              classId={cls.classId}
              className={cls.className}
              description={cls.description}
              cardImageUrl={cls.cardImageUrl}
              cardColorScheme={cls.cardColorScheme}
              simulationCount={cls.simulationCount}
              isSystemDefault={cls.classId === DEFAULT_CLASS_ID}
            />
          ))}
        </div>
      )}

      <StudentAttemptHistory attempts={history} />
    </div>
  );
}
