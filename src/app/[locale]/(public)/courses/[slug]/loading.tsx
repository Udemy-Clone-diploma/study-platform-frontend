import { SectionContainer } from "@/shared/ui/SectionContainer";
import { CourseSkeleton } from "@/widgets/course-detail";

export default function Loading() {
  return (
    <SectionContainer>
      <div className="mx-auto max-w-[1100px]">
        <CourseSkeleton />
      </div>
    </SectionContainer>
  );
}
