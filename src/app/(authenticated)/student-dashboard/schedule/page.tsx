import { Suspense } from "react";
import { CalendarView } from "@/widgets/calendar";

export default function StudentSchedulePage() {
  return (
    <Suspense>
      <CalendarView role="student" />
    </Suspense>
  );
}
