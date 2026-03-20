import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;
  placeholder?: string;
  loading?: boolean;
}

const SearchBar = ({ value, onChange, onSearch, placeholder = 'Search...', loading }: SearchBarProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="flex gap-1.5">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="bg-secondary/50 text-foreground placeholder:text-muted-foreground border-border w-full sm:w-80 h-10"
      />
      <Button onClick={onSearch} disabled={loading || !value.trim()} className="h-10 px-4">
        <Search className="w-4 h-4 mr-2" />
        {loading ? 'Searching...' : 'Search'}
      </Button>
    </div>
  );
};

export default SearchBar;
