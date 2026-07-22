import { notFound } from "next/navigation";
import { TeacherStudentDashboard } from "@/widgets/dashboard";

export default async function TeacherStudentDashboardPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const numericStudentId = Number(studentId);

  if (!Number.isInteger(numericStudentId) || numericStudentId <= 0) {
    notFound();
  }

  return <TeacherStudentDashboard studentId={numericStudentId} />;
}
