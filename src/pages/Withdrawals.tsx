import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithdrawals, fetchWithdrawalByOrder, approveWithdrawal, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { WithdrawalResponse, WithdrawalItem, WithdrawalFilters } from '@/types/withdrawal';

const statusColor: Record<string, string> = {
  SUCCESS: 'bg-primary/20 text-primary',
  AUDITING: 'bg-blue-500/20 text-blue-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  FAILED: 'bg-destructive/20 text-destructive',
  CANCELLED: 'bg-muted text-muted-foreground',
};

const Withdrawals = () => {
  const { token } = useAuth();
  
  // Unified search state
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  
  // Results state
  const [results, setResults] = useState<WithdrawalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (orderIdToApprove: string) => {
    setAuthToken(token);
    setApprovingId(orderIdToApprove);
    try {
      const res = await approveWithdrawal(orderIdToApprove);
      toast.success(res.data.msg || 'Withdrawal approved');
      if (results?.items) {
        const updatedItems = results.items.map((d) => 
          d.orderId === orderIdToApprove ? { ...d, status: 'AUDITING' as const } : d
        );
        setResults({ ...results, items: updatedItems });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string } }; message?: string };
      toast.error(error.response?.data?.msg || error.message || 'Failed to approve withdrawal');
    } finally {
      setApprovingId(null);
    }
  };

  const loadData = useCallback(async (p = 1) => {
    setLoading(true);
    setAuthToken(token);

    try {
      const query = searchQuery.trim();
      let response;

      // Logic: 
      // 1. If query starts with WD, it's an Order ID
      // 2. If query is numeric, it's a User ID
      // 3. Otherwise, it's a general search (latest withdrawals)

      if (query.startsWith('WD')) {
        response = await fetchWithdrawalByOrder(query);
        if (response.data?.items && Array.isArray(response.data.items)) {
          setResults({
            items: response.data.items,
            total: response.data.items.length,
            limit: 1,
            page: 1,
            status: response.data.status
          });
        } else {
          setResults(null);
          toast.error('Order not found');
        }
      } else {
        const filters: WithdrawalFilters = {
          page: p,
          limit: 50,
        };

        if (query && !isNaN(Number(query))) {
          filters.userId = query;
        }

        if (status && status !== 'all') {
          filters.status = status;
        }

        if (dateFrom) {
          filters.dateFrom = format(dateFrom, 'yyyy-MM-dd');
        }

        if (dateTo) {
          filters.dateTo = format(dateTo, 'yyyy-MM-dd');
        }

        response = await fetchWithdrawals(filters);
        setResults(response.data);
        setPage(p);
      }

      setUpdatedAt(new Date());
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string } }; message?: string };
      toast.error(error.response?.data?.msg || 'Failed to fetch withdrawals');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery, status, dateFrom, dateTo]);

  const handleClear = () => {
    setSearchQuery('');
    setStatus('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setResults(null);
    setPage(1);
  };

  const totalPages = results?.total ? Math.ceil(results.total / (results.limit || 50)) : 0;

  const renderTable = (data: WithdrawalResponse) => {
    if (!data?.items?.length) {
      return (
        <div className="p-8 text-center text-muted-foreground text-sm border border-border bg-card rounded-lg">
          No withdrawals found.
        </div>
      );
    }

    return (
      <div className="bg-card border border-border overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-2 text-muted-foreground font-medium">User ID</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Order ID</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Amount</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Bal. After</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Bank Details</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Remark</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Date</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((d: WithdrawalItem, i: number) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="p-2 text-foreground font-medium">{d.userId}</td>
                  <td className="p-2 text-foreground font-mono text-[10px]">{d.orderId}</td>
                  <td className="p-2 text-foreground">₹{d.amount?.toLocaleString()}</td>
                  <td className="p-2 text-foreground text-xs">{d.balanceAfter !== undefined ? `₹${d.balanceAfter.toLocaleString()}` : '-'}</td>
                  <td className="p-2 text-[10px]">
                    {d.bankDetails ? (
                      <div className="flex flex-col gap-1 w-max">
                        <div><span className="text-muted-foreground inline-block w-10">Holder:</span> <span className="font-medium text-foreground">{d.bankDetails.accountHolder}</span></div>
                        <div><span className="text-muted-foreground inline-block w-10">Bank:</span> <span className="text-foreground">{d.bankDetails.bankName}</span></div>
                        <div><span className="text-muted-foreground inline-block w-10">A/C:</span> <span className="text-foreground font-mono">{d.bankDetails.accountNumber}</span></div>
                        {d.bankDetails.bankCode && <div><span className="text-muted-foreground inline-block w-10">IFSC:</span> <span className="text-foreground font-mono">{d.bankDetails.bankCode}</span></div>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-2">
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${statusColor[d.status] || 'bg-muted text-muted-foreground'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-2 text-muted-foreground text-[10px] max-w-[150px] truncate" title={d.remark}>{d.remark || '-'}</td>
                  <td className="p-2 text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</td>
                  <td className="p-2">
                    {d.status === 'PENDING' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-primary border-primary/30 hover:bg-primary/10"
                        disabled={approvingId === d.orderId}
                        onClick={() => handleApprove(d.orderId)}
                      >
                        {approvingId === d.orderId ? (
                          <Loading size={14} />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        )}
                        Approve
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Compact Search & Filter Bar */}
      <div className="bg-card border border-border p-2 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-end gap-2">
          {/* ID Search */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-medium text-muted-foreground uppercase mb-1 block">User / Order ID</label>
            <div className="relative">
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery} 
                onSearch={() => loadData(1)} 
                placeholder="Ex: 123456 or WD..."
                loading={loading}
                storageKey="withdrawal_search"
                maxHistory={5}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-[120px]">
            <label className="text-[10px] font-medium text-muted-foreground uppercase mb-1 block">Status</label>
            <select
              className="flex h-7 w-full rounded border border-input bg-background px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="AUDITING">AUDITING</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase mb-0.5 block">Date Range</label>
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[110px] justify-start text-left font-normal text-[11px] h-7 px-2",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3 w-3" />
                    {dateFrom ? format(dateFrom, "MMM dd") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-[10px]">-</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[110px] justify-start text-left font-normal text-[11px] h-7 px-2",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3 w-3" />
                    {dateTo ? format(dateTo, "MMM dd") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button 
              onClick={() => loadData(1)} 
              disabled={loading} 
              size="sm"
              className="h-7 px-3 text-xs"
            >
              {loading ? <Loading size={12} className="mr-1" /> : null}
              Search
            </Button>
            <Button 
              onClick={handleClear} 
              variant="outline" 
              size="sm"
              className="h-7 px-3 text-xs"
            >
              Clear
            </Button>
            <div className="ml-1 border-l border-border pl-2">
              <LastUpdated 
                timestamp={updatedAt} 
                onRefresh={() => loadData(page)} 
                loading={loading} 
                compact 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {results && (
        <div className="space-y-3">
          {renderTable(results)}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-card border border-border p-2 rounded-lg">
              <span className="text-[10px] text-muted-foreground font-medium">
                Showing {results.items.length} of {results.total} results • Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page <= 1 || loading}
                  onClick={() => loadData(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs font-medium px-2 h-7 flex items-center bg-secondary/50 rounded">
                  {page}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page >= totalPages || loading}
                  onClick={() => loadData(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Withdrawals;
