import { Suspense } from "react";
import { CalendarView } from "@/widgets/calendar";

export default function TeacherSchedulePage() {
  return (
    <Suspense>
      <CalendarView role="teacher" />
    </Suspense>
  );
}
