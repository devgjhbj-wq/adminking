import { useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onSave?: () => void;
  saveLabel?: string;
  saving?: boolean;
  width?: string;
}

const Drawer = ({
  open,
  onClose,
  title,
  children,
  footer,
  onSave,
  saveLabel = "Save",
  saving,
  width = "400px",
}: DrawerProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[2000] bg-black/50 transition-opacity duration-300"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={cn(
          "absolute top-0 right-0 h-full bg-card border-l border-border shadow-[-2px_0_8px_rgba(0,0,0,0.15)]",
          "flex flex-col animate-slide-in-right"
        )}
        style={{ width }}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-sm p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-foreground">
          {children}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 h-14 border-t border-border flex-shrink-0">
          {footer || (
            <>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              {onSave && (
                <Button size="sm" onClick={onSave} disabled={saving}>
                  {saving ? "Saving..." : saveLabel}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export { Drawer };
export type { DrawerProps };
