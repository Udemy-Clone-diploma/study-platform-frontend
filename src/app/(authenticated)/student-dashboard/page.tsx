import { Suspense } from "react";
import { DashboardOverview } from "@/widgets/dashboard/DashboardOverview";

export default function StudentDashboardPage() {
  return (
    <Suspense>
      <DashboardOverview role="student" />
    </Suspense>
  );
}
