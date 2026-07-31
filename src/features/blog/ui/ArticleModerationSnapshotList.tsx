import type { ArticleModerationSnapshot } from "@/entities/blog";
import { ArticleModerationSnapshotRow } from "./ArticleModerationSnapshotRow";

type Props = { snapshots: ArticleModerationSnapshot[]; emptyLabel: string };

/** Same white-card shell as ArticleGrid, but for the read-only reject/publish decision
 * history -- no master-detail panel since there's nothing to manage here. */
export function ArticleModerationSnapshotList({ snapshots, emptyLabel }: Props) {
  return (
    <section className="min-h-[520px] rounded-[20px] bg-white p-4 shadow-(--shadow-dashboard-card) sm:p-6">
      {snapshots.length === 0 ? (
        <p className="mt-16 text-center text-lg text-(--color-text-secondary)">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col" style={{ gap: "clamp(8px, 1.11vw, 16px)" }}>
          {snapshots.map((snapshot) => (
            <ArticleModerationSnapshotRow key={snapshot.id} snapshot={snapshot} />
          ))}
        </div>
      )}
    </section>
  );
}
