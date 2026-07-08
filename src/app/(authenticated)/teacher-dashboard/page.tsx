import { Suspense } from "react";
import { DashboardOverview } from "@/widgets/dashboard/DashboardOverview";

export default function TeacherDashboardPage() {
  return (
    <Suspense>
      <DashboardOverview role="teacher" />
    </Suspense>
  );
}
