import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

const CompactSearchBar = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-card border-b border-border", className)}>
    <div className="flex flex-wrap items-center px-3 py-2 gap-2">{children}</div>
  </div>
);

const CompactField = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("flex items-center gap-1.5", className)}>
    <label className="text-[11px] text-foreground/70 whitespace-nowrap">{label}</label>
    {children}
  </div>
);

const CompactInput = ({ className, style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "w-[140px] h-[26px] rounded-pill border border-border bg-background px-2.5 text-[11px] text-foreground placeholder:text-muted-foreground/50",
      "focus:border-primary focus:outline-none focus:ring-0",
      "transition-colors duration-100 m-0",
      className
    )}
    {...props}
  />
);

const CompactSelect = ({ className, style, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn(
      "w-[140px] h-[26px] rounded-pill border border-border bg-background px-2.5 text-[11px] text-foreground",
      "focus:border-primary focus:outline-none focus:ring-0",
      "transition-colors duration-100 m-0",
      className
    )}
    {...props}
  >
    {children}
  </select>
);

const CompactSearchButton = ({ children, className, style, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      "h-[26px] px-3 rounded-pill text-[11px] font-medium whitespace-nowrap leading-none",
      "bg-primary text-primary-foreground hover:bg-primary/85",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "transition-all duration-100 flex items-center gap-1 active:scale-[0.96]",
      className
    )}
    {...props}
  >
    <Search className="w-3 h-3" />
    {children}
  </button>
);

export { CompactSearchBar, CompactField, CompactInput, CompactSelect, CompactSearchButton };