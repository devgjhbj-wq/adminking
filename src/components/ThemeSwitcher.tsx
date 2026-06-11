import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

const themes = [
  { id: 'theme-parchment', label: 'Parchment', desc: 'Apple Light', color: 'bg-[#f5f5f7] border-[#1d1d1f]' },
  { id: 'theme-slate', label: 'Slate', desc: 'Dark Blue', color: 'bg-[#1a2235] border-[#8ba1c9]' },
  { id: 'theme-ivory', label: 'Ivory', desc: 'Warm', color: 'bg-[#f3f1ed] border-[#272522]' },
  { id: 'theme-indigo', label: 'Indigo', desc: 'Deep Dark', color: 'bg-[#12101f] border-[#7c7ab8]' },
  { id: 'theme-nord', label: 'Nord', desc: 'Arctic Blue', color: 'bg-[#2e3440] border-[#88c0d0]' },
  { id: 'theme-dracula', label: 'Dracula', desc: 'Purple Dark', color: 'bg-[#282a36] border-[#bd93f9]' },
  { id: 'theme-tokyo', label: 'Tokyo Night', desc: 'Blue Dark', color: 'bg-[#1a1b26] border-[#7aa2f7]' },
  { id: 'theme-mocha', label: 'Mocha', desc: 'Catppuccin', color: 'bg-[#1e1e2e] border-[#cba6f7]' },
  { id: 'theme-solarized', label: 'Solarized', desc: 'Light Warm', color: 'bg-[#fdf6e3] border-[#268bd2]' },
  { id: 'theme-onedark', label: 'One Dark', desc: 'Atom Dark', color: 'bg-[#282c34] border-[#61afef]' },
];

const ThemeSwitcher = () => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const [current, setCurrent] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('king-admin-theme') || 'theme-parchment';
    }
    return 'theme-parchment';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.className = root.className.replace(/theme-\w+/g, '').trim();
    root.classList.add(current);
    localStorage.setItem('king-admin-theme', current);
  }, [current]);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen(true);
  };

  const activeTheme = themes.find(t => t.id === current);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-2 py-1 rounded-pill border border-border bg-background/50 hover:bg-secondary text-[10px] text-muted-foreground transition-all"
        title="Switch theme"
      >
        <span className={cn(
          "w-3 h-3 rounded-full border",
          current === 'theme-parchment' ? 'bg-[#f5f5f7] border-[#1d1d1f]' :
          current === 'theme-slate' ? 'bg-[#1a2235] border-[#8ba1c9]' :
          current === 'theme-ivory' ? 'bg-[#f3f1ed] border-[#272522]' :
          current === 'theme-indigo' ? 'bg-[#12101f] border-[#7c7ab8]' :
          current === 'theme-nord' ? 'bg-[#2e3440] border-[#88c0d0]' :
          current === 'theme-dracula' ? 'bg-[#282a36] border-[#bd93f9]' :
          current === 'theme-tokyo' ? 'bg-[#1a1b26] border-[#7aa2f7]' :
          current === 'theme-mocha' ? 'bg-[#1e1e2e] border-[#cba6f7]' :
          current === 'theme-solarized' ? 'bg-[#fdf6e3] border-[#268bd2]' :
          'bg-[#282c34] border-[#61afef]'
        )} />
        <span className="hidden sm:inline">{activeTheme?.label}</span>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[9999]" onClick={() => setOpen(false)}>
          <div
            className="fixed bg-card border border-border rounded-lg shadow-2xl p-1.5 min-w-[170px]"
            style={{ top: pos.top, right: pos.right }}
            onClick={(e) => e.stopPropagation()}
          >
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => { setCurrent(theme.id); setOpen(false); }}
                className={cn(
                  "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-xs transition-all text-left",
                  current === theme.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                )}
              >
                <span className={cn("w-4 h-4 rounded-full border flex-shrink-0", theme.color)} />
                <div>
                  <div className="font-medium">{theme.label}</div>
                  <div className="text-[10px] text-muted-foreground">{theme.desc}</div>
                </div>
                {current === theme.id && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ThemeSwitcher;