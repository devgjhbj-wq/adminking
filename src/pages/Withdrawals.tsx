import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithdrawals, fetchWithdrawalByOrder, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import LastUpdated from '@/components/LastUpdated';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const statusColor: Record<string, string> = {
  SUCCESS: 'bg-primary/20 text-primary',
  COMPLETED: 'bg-primary/20 text-primary',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  FAILED: 'bg-destructive/20 text-destructive',
  REJECTED: 'bg-destructive/20 text-destructive',
  REFUNDED: 'bg-blue-500/20 text-blue-400',
  EXPIRED: 'bg-muted text-muted-foreground',
};

const Withdrawals = () => {
  const { token } = useAuth();
  const [userId, setUserId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastSearchType, setLastSearchType] = useState<'list' | 'order'>('list');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadWithdrawals = async (p = 1) => {
    setAuthToken(token);
    setLoading(true);
    setLastSearchType('list');
    try {
      const res = await fetchWithdrawals({
        userId: userId.trim() || undefined,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: p,
      });
      setData(res.data);
      setPage(p);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const loadByOrder = async () => {
    const q = orderId.trim();
    if (!q) return;
    setAuthToken(token);
    setLoading(true);
    setLastSearchType('order');
    try {
      const res = await fetchWithdrawalByOrder(q);
      if (res.data?.withdrawal) {
        setData({ items: [res.data.withdrawal], total: 1, limit: 1, page: 1 });
      } else {
        setData(res.data);
      }
      setPage(1);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (lastSearchType === 'order') loadByOrder();
    else loadWithdrawals(page);
  };

  useEffect(() => {
    loadWithdrawals(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = data?.total ? Math.ceil(data.total / (data.limit || 25)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 bg-card border border-border p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <SearchBar value={orderId} onChange={setOrderId} onSearch={loadByOrder} placeholder="Search by Order ID (WD...)" loading={loading && lastSearchType === 'order'} />
            <span className="text-muted-foreground text-xs px-2 uppercase font-medium">OR</span>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="User ID (optional)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select
              className="flex h-9 w-full sm:w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
            </select>
            <input
              type="date"
              className="flex h-9 w-full sm:w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-muted-foreground text-xs">to</span>
            <input
              type="date"
              className="flex h-9 w-full sm:w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <Button onClick={() => loadWithdrawals(1)} disabled={loading && lastSearchType === 'list'} className="w-full sm:w-auto">
              Filter
            </Button>
          </div>
        </div>
        <div className="flex justify-end">
          <LastUpdated timestamp={updatedAt} onRefresh={handleRefresh} loading={loading} />
        </div>
      </div>

      {data?.items && (
        <>
          <div className="bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-2 text-muted-foreground font-medium">User ID</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Order ID</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Amount</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((d: any, i: number) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="p-2 text-foreground font-medium">{d.userId}</td>
                      <td className="p-2 text-foreground font-mono text-[10px]">{d.orderId}</td>
                      <td className="p-2 text-foreground">₹{d.amount?.toLocaleString()}</td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium ${statusColor[d.status] || 'bg-muted text-muted-foreground'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {lastSearchType === 'list' && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total: {data.total} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadWithdrawals(page - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadWithdrawals(page + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Withdrawals;
