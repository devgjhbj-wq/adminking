import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PageContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-3", className)}>{children}</div>
);

const SearchHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-card border border-border rounded-lg", className)}>
    <div className="flex flex-wrap items-center p-3 gap-3 text-xs">{children}</div>
  </div>
);

interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}
const TableContainer = ({ children, className, loading }: TableContainerProps) => (
  <div className={cn("relative w-full overflow-x-auto bg-card border border-border rounded-lg max-w-full", className)}>
    {loading && (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )}
    {children}
  </div>
);

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

const Pagination = ({ page, totalPages, total, loading, onPageChange }: PaginationProps) => {
  const [jumpVal, setJumpVal] = useState('');

  if (!totalPages || totalPages <= 0) return null;

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
    }
    return pages;
  };

  const handleJump = () => {
    const num = parseInt(jumpVal, 10);
    if (num >= 1 && num <= totalPages) {
      onPageChange(num);
      setJumpVal('');
    }
  };

  const btnBase = 'inline-flex items-center justify-center min-w-[26px] h-[26px] text-xs rounded-pill border bg-card px-2 transition-all';

  return (
    <div className="flex items-center justify-end bg-card border border-border rounded-lg p-2 mt-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {total !== undefined && <span className="mr-2">Total {total}</span>}
        <button
          className={`${btnBase} border-border hover:border-primary hover:text-primary ${page <= 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <ul className="flex items-center gap-1 p-0 m-0 list-none">
          {getPageNumbers().map((p) => (
            <li key={p} className="m-0 p-0">
              <button
                className={`${btnBase} ${
                  p === page
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-foreground hover:border-primary hover:text-primary'
                }`}
                onClick={() => p !== page && onPageChange(p)}
              >
                {p}
              </button>
            </li>
          ))}
        </ul>
        <button
          className={`${btnBase} border-border hover:border-primary hover:text-primary ${page >= totalPages ? 'opacity-40 cursor-not-allowed' : ''}`}
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <span className="flex items-center gap-1 ml-2">
          Go to
          <input
            type="number"
            className="w-[50px] h-[26px] text-xs text-center border border-border rounded-pill bg-card text-foreground outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-2"
            value={jumpVal}
            onChange={(e) => setJumpVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJump()}
            min={1}
            max={totalPages}
          />
        </span>
      </div>
    </div>
  );
};

export { PageContainer, SearchHeader, TableContainer, Pagination };