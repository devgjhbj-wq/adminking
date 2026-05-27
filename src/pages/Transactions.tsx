import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTransactions, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageContainer, SearchHeader, Pagination } from '@/components/PageContainer';

const Transactions = () => {
  const { token } = useAuth();
  const [userId, setUserId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = async (p = 1) => {
    const q = userId.trim();
    if (!q) {
      toast.error('User ID is required');
      return;
    }
    // Validate numeric user ID
    if (isNaN(Number(q))) {
      toast.error('User ID must be a number');
      return;
    }
    setAuthToken(token);
    setLoading(true);
    try {
      const res = await fetchTransactions(q, p);
      setData(res.data);
      setPage(p);
      setUpdatedAt(new Date());
    } catch (err: any) {
      const errorMsg = err.response?.data?.msg || 'Failed to load transactions';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  const renderTable = (data: any) => {
    const showEmpty = !data?.items?.length;

    return (
      <div className="relative rounded" style={{ height: 445, border: '1px solid hsl(var(--border))' }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Loading size={30} />
          </div>
        )}

        <div style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
          <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 1050 }}>
            <colgroup>
              <col style={{ width: 95 }} />
              <col style={{ width: 150 }} />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
              <tr style={{ height: 50 }}>
                {['User ID', 'Order ID', 'Type', 'Amount', 'Status', 'Channel', 'Gateway No.', 'Created At'].map((label) => (
                  <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                    <div className="cell">{label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showEmpty ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 50, color: 'hsl(var(--muted-foreground))' }}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      <span>No Data</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((d: any, i: number) => (
                  <tr key={i} style={{ height: 50 }}>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.userId}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontFamily: 'monospace', fontSize: 11 }}>{d.orderId}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.type}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.amount ? `₹${Number(d.amount).toLocaleString()}` : '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${
                          d.status === 'SUCCESS' ? 'bg-primary/20 text-primary' :
                          d.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                          d.status === 'FAILED' ? 'bg-destructive/20 text-destructive' :
                          'bg-muted text-muted-foreground'
                        }`}>{d.status}</span>
                      </div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.channelName}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontFamily: 'monospace', fontSize: 11 }}>{d.gatewayOrderNo || '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontSize: 11 }}>{new Date(d.createdAt).toLocaleString()}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <PageContainer>
      <SearchHeader>
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap mr-[3px]">User ID</label>
        <Input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID"
          className="w-[180px] h-[26px] text-xs px-1.5"
          onKeyDown={(e) => e.key === 'Enter' && load(1)}
        />
        <Button
          onClick={() => load(1)}
          disabled={loading || !userId.trim()}
          size="sm"
          className="h-[26px] px-2.5 text-xs rounded-[5px]"
          style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}
        >
          {loading ? <Loading size={10} /> : null}
          Search
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-[26px] px-2.5 text-xs rounded-[5px]"
          onClick={() => setUserId('')}
        >
          Reset
        </Button>
        <LastUpdated timestamp={updatedAt} onRefresh={() => load(page)} loading={loading} compact />
      </SearchHeader>

      {data?.items && (
        <>
          {renderTable(data)}

          <Pagination page={page} totalPages={totalPages} total={data.total} loading={loading} onPageChange={load} />
        </>
      )}
    </PageContainer>
  );
};

export default Transactions;
