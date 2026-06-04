import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

const STORAGE_KEY = 'agency-search-history';
const MAX_ITEMS = 5;

function getHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addToHistory(value: string) {
  const history = getHistory().filter((id) => id !== value);
  history.unshift(value);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ITEMS)));
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchInputWithHistory = ({ value, onChange, placeholder, className }: Props) => {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, []);

  const handleFocus = () => {
    setHistory(getHistory());
    setOpen(true);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    addToHistory(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const trimmed = value.trim();
      if (trimmed) addToHistory(trimmed);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {open && history.length > 0 && (
        <div className="absolute z-50 top-full mt-0.5 left-0 w-full bg-white dark:bg-[rgb(30,30,30)] border border-border rounded shadow-md max-h-[200px] overflow-y-auto">
          {history.map((id) => (
            <div
              key={id}
              onMouseDown={() => handleSelect(id)}
              className="px-2 py-1 text-xs cursor-pointer hover:bg-muted text-foreground"
            >
              {id}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { SearchInputWithHistory, addToHistory, getHistory };
