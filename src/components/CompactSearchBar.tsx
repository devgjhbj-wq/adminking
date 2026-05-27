import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

const fontCompact = { fontFamily: "'Helvetica Neue', Arial, sans-serif" };

const CompactSearchBar = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-card border-b border-border", className)} style={fontCompact}>
    <div className="flex flex-wrap items-center px-2 py-1 gap-[6px]">{children}</div>
  </div>
);

const CompactField = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("flex items-center", className)}>
    <label className="text-[11px] text-foreground/80 whitespace-nowrap mr-[4px]">{label}</label>
    {children}
  </div>
);

const CompactInput = ({ className, style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "w-[140px] h-[26px] rounded border border-border bg-background px-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/50",
      "focus:border-[#208fff] focus:outline-none focus:ring-0",
      "transition-colors duration-100 m-0",
      className
    )}
    style={{ ...fontCompact, ...style }}
    {...props}
  />
);

const CompactSelect = ({ className, style, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn(
      "w-[140px] h-[26px] rounded border border-border bg-background px-1.5 text-[11px] text-foreground",
      "focus:border-[#208fff] focus:outline-none focus:ring-0",
      "transition-colors duration-100 m-0",
      className
    )}
    style={{ ...fontCompact, ...style }}
    {...props}
  >
    {children}
  </select>
);

const CompactSearchButton = ({ children, className, style, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      "h-[26px] px-[10px] rounded text-[11px] font-medium whitespace-nowrap leading-none",
      "bg-[rgb(32,143,255)] text-white hover:bg-[rgb(32,143,255)]/85",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "transition-colors duration-100 flex items-center gap-1",
      className
    )}
    style={{ ...fontCompact, ...style }}
    {...props}
  >
    <Search className="w-3 h-3" />
    {children}
  </button>
);

export { CompactSearchBar, CompactField, CompactInput, CompactSelect, CompactSearchButton };
