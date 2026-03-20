import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Clock, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;
  placeholder?: string;
  loading?: boolean;
  storageKey?: string;
  maxHistory?: number;
  debounceMs?: number;
}

const SearchBar = ({ 
  value, 
  onChange, 
  onSearch, 
  placeholder = 'Search...', 
  loading = false,
  storageKey = 'search_history',
  maxHistory = 5,
  debounceMs = 300
}: SearchBarProps) => {
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [storageKey]);

  // Handle input changes with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);

    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Update suggestions with debounce
    debounceTimer.current = setTimeout(() => {
      if (newValue.trim()) {
        const filtered = history.filter(item =>
          item.toLowerCase().includes(newValue.toLowerCase())
        );
        setSuggestions(filtered.slice(0, maxHistory));
      } else {
        setSuggestions(history.slice(0, maxHistory));
      }
    }, debounceMs);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSearch = () => {
    if (value.trim()) {
      // Add to history
      const newHistory = [value, ...history.filter(item => item !== value)].slice(0, maxHistory);
      setHistory(newHistory);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newHistory));
      } catch {
        // Silently fail if localStorage is not available
      }
      setShowSuggestions(false);
      onSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    // Don't auto-search, let user click search button
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleClearHistory = () => {
    setHistory([]);
    setSuggestions([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="bg-secondary/50 text-foreground placeholder:text-muted-foreground border-border w-full h-10 pr-8"
          />
          {value && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={loading || !value.trim()} 
          className="h-10 px-4 whitespace-nowrap"
        >
          <Search className="w-4 h-4 mr-2" />
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50">
          <div className="max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-secondary/50 transition-colors flex items-center gap-2 first:rounded-t-md last:rounded-b-md"
              >
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:bg-secondary/50 transition-colors border-t border-border"
              >
                Clear history
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state message */}
      {showSuggestions && suggestions.length === 0 && value === '' && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50">
          <div className="p-2 text-xs text-muted-foreground">
            <p className="px-2 py-1 font-semibold">Recent searches</p>
            {history.slice(0, maxHistory).map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(item)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors rounded flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{item}</span>
              </button>
            ))}
            <button
              onClick={handleClearHistory}
              className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/50 transition-colors rounded"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
