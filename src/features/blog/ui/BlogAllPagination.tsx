"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/shared/ui/Pagination";

type Props = {
  currentPage: number;
  totalPages: number;
};

/** Page-param pagination for /blog/all, preserving the category filter — same pattern as CatalogPagination. */
export function BlogAllPagination({ currentPage, totalPages }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function changePage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    router.push(params.toString() ? `?${params.toString()}` : "/blog/all", { scroll: false });
  }

  return <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={changePage} />;
}
