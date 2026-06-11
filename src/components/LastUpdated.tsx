import { RefreshCw } from 'lucide-react';

interface LastUpdatedProps {
  timestamp: Date | null;
  onRefresh?: () => void;
  loading?: boolean;
  compact?: boolean;
}

const LastUpdated = ({ timestamp, onRefresh, loading, compact }: LastUpdatedProps) => {
  if (!timestamp) return null;

  return (
    <div className={`flex items-center gap-1.5 ${compact ? 'text-[10px]' : 'text-[10px]'} text-muted-foreground`}>
      <span>Updated: {timestamp.toLocaleTimeString()}</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground rounded-pill border border-border transition-all disabled:opacity-50 active:scale-[0.96]"
        >
          <RefreshCw className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      )}
    </div>
  );
};

export default LastUpdated;