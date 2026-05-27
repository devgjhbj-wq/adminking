import { cn } from "@/lib/utils";

const fontCompact = { fontFamily: "'Helvetica Neue', Arial, sans-serif" };

const CompactPage = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-2", className)} style={fontCompact}>
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
    className={cn("w-full overflow-x-auto bg-card border border-border rounded shadow-sm", className)}
    style={fontCompact}
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
        padding: 5px 6px;
        border: 1px solid hsl(var(--border));
        font-size: 11px;
        line-height: 1.3;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .compact-table th {
        font-weight: 600;
        background: hsl(var(--secondary) / 0.3);
      }
      .compact-table tbody tr:hover {
        background: hsl(var(--secondary) / 0.12);
      }
    `}</style>
    {children}
  </div>
);

export { CompactPage, CompactTable };
