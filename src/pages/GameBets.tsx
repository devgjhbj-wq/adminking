import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { searchBetsByMember, syncBetRecords, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PageContainer, SearchHeader, Pagination } from '@/components/PageContainer';

const siteOptions = [
  { value: '', label: 'All Sites' },
  { value: 'JE', label: 'JE' },
  { value: 'PG', label: 'PG' },
  { value: 'JD', label: 'JD' },
  { value: 'TU', label: 'TU' },
];

const GameBets = () => {
  const { token } = useAuth();
  const [member, setMember] = useState('');
  const [site, setSite] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(1);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const handleSearch = async (pageNum = 1) => {
    if (!member.trim()) {
      toast.error('Member username is required (e.g., u123456)');
      return;
    }
    setAuthToken(token);
    setLoading(true);
    try {
      const params: any = { page: pageNum, limit: 50 };
      if (site) params.site = site;
      if (status) params.status = Number(status);
      if (dateFrom) params.dateFrom = format(dateFrom, 'yyyy-MM-dd');
      if (dateTo) params.dateTo = format(dateTo, 'yyyy-MM-dd');
      const res = await searchBetsByMember(member.trim(), params);
      setData(res.data);
      setPage(pageNum);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to fetch bets');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => handleSearch(page);

  const handleReset = () => {
    setMember('');
    setSite('');
    setStatus('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setData(null);
    setPage(1);
  };

  const handleToday = () => {
    const today = new Date();
    setDateFrom(today);
    setDateTo(today);
  };

  const handleSync = async () => {
    setAuthToken(token);
    setSyncing(true);
    try {
      const res = await syncBetRecords();
      toast.success(`Sync Complete: Added ${res.data.inserted}, Updated ${res.data.updated}`);
      if (member) handleSearch(1);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to sync bets');
    } finally {
      setSyncing(false);
    }
  };

  const renderTable = (d: any) => {
    const showEmpty = !d?.items?.length;

    return (
      <div className="relative rounded" style={{ height: 445, border: '1px solid hsl(var(--border))' }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Loading size={30} />
          </div>
        )}

        <div style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
          <table className="el-table" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 1050 }}>
            <colgroup>
              <col style={{ width: 160 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 150 }} />
            </colgroup>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
              <tr style={{ height: 50 }}>
                {['Bet Time', 'Game ID', 'Bet Amount', 'Turnover', 'Payout', 'Net', 'Created At'].map((label) => (
                  <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                    <div className="cell">{label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showEmpty ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 50, color: 'hsl(var(--muted-foreground))', overflow: 'hidden' }}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      <span>No Data</span>
                    </div>
                  </td>
                </tr>
              ) : (
                d.items.map((item: any, i: number) => {
                  const net = (item.payout || 0) - (item.bet || 0);
                  return (
                    <tr key={i} style={{ height: 50 }}>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell" style={{ fontSize: 11 }}>{item.betTime ? new Date(item.betTime).toLocaleString() : '-'}</div>
                      </td>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell">{item.gameId || '-'}</div>
                      </td>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell">₹{item.bet?.toLocaleString() ?? '-'}</div>
                      </td>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell">₹{item.turnover?.toLocaleString() ?? '-'}</div>
                      </td>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell" style={{ color: item.payout > 0 ? 'hsl(var(--primary))' : 'inherit' }}>₹{item.payout?.toLocaleString() ?? '-'}</div>
                      </td>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell" style={{ color: net >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>₹{net.toLocaleString()}</div>
                      </td>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell" style={{ fontSize: 11 }}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</div>
                      </td>
                    </tr>
                  );
                })
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
        <div className="form-grid w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Member</div>
            <Input
              value={member}
              onChange={(e) => setMember(e.target.value)}
              placeholder="u + userId (e.g., u123456)"
              className="w-full h-[34px] text-sm px-2"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Site</div>
            <select
              className="w-full h-[34px] rounded border border-input bg-background px-2 text-sm"
              value={site}
              onChange={(e) => setSite(e.target.value)}
            >
              {siteOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Status</div>
            <select
              className="w-full h-[34px] rounded border border-input bg-background px-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="1">Valid</option>
            </select>
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">From</div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-sm h-[34px] px-3 rounded-[5px]"
                >
                  <CalendarIcon className="mr-1.5 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={2024}
                  toYear={2026}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">To</div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-sm h-[34px] px-3 rounded-[5px]"
                >
                  <CalendarIcon className="mr-1.5 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM dd, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={2024}
                  toYear={2026}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleToday}
              size="sm"
              className="h-[34px] px-3 text-sm rounded-[5px]"
              style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}
            >
              Today
            </Button>
          </div>

          <div className="flex items-end gap-3">
            <Button
              onClick={() => handleSearch(1)}
              disabled={loading || !member.trim()}
              size="sm"
              className="h-[34px] px-4 text-sm rounded-[5px] gap-1.5"
              style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}
            >
              {loading ? <Loading size={14} /> : null}
              Search
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="h-[34px] px-4 text-sm rounded-[5px]"
            >
              Reset
            </Button>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              size="sm"
              className="h-[34px] px-4 text-sm rounded-[5px] gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Bets'}
            </Button>
          </div>
        </div>
      </SearchHeader>

      {data && data.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-4 rounded-md space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">Total Bet</h4>
            <div className="text-xl font-bold text-foreground">₹{data.summary.totalBet?.toFixed(2)}</div>
          </div>
          <div className="bg-card border border-border p-4 rounded-md space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">Total Payout</h4>
            <div className="text-xl font-bold text-foreground">₹{data.summary.totalPayout?.toFixed(2)}</div>
          </div>
          <div className="bg-card border border-border p-4 rounded-md space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">Net PnL</h4>
            <div className={`text-xl font-bold ${(data.summary.netPnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>₹{data.summary.netPnl?.toFixed(2)}</div>
          </div>
          <div className="bg-card border border-border p-4 rounded-md space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">Total Turnover</h4>
            <div className="text-xl font-bold text-foreground">₹{data.summary.totalTurnover?.toFixed(2)}</div>
          </div>
        </div>
      )}

      {data && (
        <>
          {renderTable(data)}
          <Pagination page={data.page} totalPages={Math.ceil(data.total / data.limit)} total={data.total} loading={loading} onPageChange={handleSearch} />
        </>
      )}
    </PageContainer>
  );
};

export default GameBets;
