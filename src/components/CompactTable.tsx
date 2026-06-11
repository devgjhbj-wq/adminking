import { cn } from "@/lib/utils";

const CompactPage = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-2", className)}>
    {children}
  </div>
);

const CompactTable = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn("w-full overflow-x-auto bg-card border border-border rounded-lg", className)}
  >
    <style>{`
      .compact-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        max-width: 100%;
      }
      .compact-table th,
      .compact-table td {
        padding: 6px 8px;
        border-bottom: 1px solid hsl(var(--border) / 0.5);
        font-size: 11px;
        line-height: 1.3;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .compact-table th {
        font-weight: 600;
        background: hsl(var(--muted));
        color: hsl(var(--muted-foreground));
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .compact-table tbody tr:hover {
        background: hsl(var(--accent) / 0.06);
      }
    `}</style>
    {children}
  </div>
);

export { CompactPage, CompactTable };