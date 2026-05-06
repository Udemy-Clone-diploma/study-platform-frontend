"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/shared/ui/Pagination";

type Props = {
  currentPage: number;
  totalPages: number;
};

export function CatalogPagination({ currentPage, totalPages }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function changePage(page: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }

    router.push(params.toString() ? `?${params.toString()}` : "/catalog");
  }

  return <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={changePage} />;
}
