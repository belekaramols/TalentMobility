import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

export function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}) {
  if (totalCount === 0) return null;

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const multiPage = totalCount > pageSize;

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {totalCount}
      </p>
      {multiPage && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="size-4" />Previous
          </Button>
          <span className="px-2 text-xs font-medium">Page {page} of {pageCount}</span>
          <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
            Next<ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </nav>
  );
}
