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
  
  // Search fields state
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchUserId, setSearchUserId] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  
  // Results state (no caching)
  const [results, setResults] = useState<WithdrawalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (orderIdToApprove: string) => {
    setAuthToken(token);
    setApprovingId(orderIdToApprove);
    try {
      const res = await approveWithdrawal(orderIdToApprove);
      toast.success(res.data.msg || 'Withdrawal approved');
      // Refresh results without cache
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

  const performSearch = useCallback(async () => {
    const hasOrderId = searchOrderId.trim();
    const hasUserId = searchUserId.trim();

    if (!hasOrderId && !hasUserId) {
      toast.error('Enter Order ID or User ID');
      return;
    }

    setLoading(true);
    setAuthToken(token);

    try {
      let response;

      if (hasOrderId) {
        // Search by Order ID
        response = await fetchWithdrawalByOrder(hasOrderId);
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
      } else if (hasUserId) {
        // Search by User ID
        if (isNaN(Number(hasUserId))) {
          toast.error('User ID must be a number');
          setResults(null);
          setLoading(false);
          return;
        }

        const filters: WithdrawalFilters = {
          page: 1,
          limit: 50,
          userId: hasUserId
        };

        if (filterStatus && filterStatus !== 'all') {
          filters.status = filterStatus;
        }
        if (dateFrom) {
          filters.dateFrom = format(dateFrom, 'yyyy-MM-dd');
        }
        if (dateTo) {
          filters.dateTo = format(dateTo, 'yyyy-MM-dd');
        }

        response = await fetchWithdrawals(filters);
        setResults(response.data);
      }

      setUpdatedAt(new Date());
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string } }; message?: string };
      const errorMsg = error.response?.data?.msg || 'Failed to fetch withdrawals';
      toast.error(errorMsg);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [token, searchOrderId, searchUserId, filterStatus, dateFrom, dateTo]);

  const renderTable = (data: WithdrawalResponse, page: number, totalPages: number, loadMoreFn: (p: number) => void, isPaginated: boolean) => {
    if (!data?.items?.length) return <div className="p-4 text-center text-muted-foreground text-sm border border-border bg-card">No withdrawals found.</div>;

    return (
      <>
        <div className="bg-card border border-border overflow-hidden">
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

        {isPaginated && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">Total: {data.total} — Page {page}/{totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadMoreFn(page - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadMoreFn(page + 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  const searchTotalPages = searchData?.total ? Math.ceil(searchData.total / (searchData.limit || 25)) : 0;
  const latestTotalPages = latestData?.total ? Math.ceil(latestData.total / (latestData.limit || 25)) : 0;

  // Determine current data being displayed
  const currentData = searchMode === 'order' && searchData ? searchData : latestData;
  const currentPage = searchMode === 'order' && searchData ? searchPage : latestPage;
  const currentTotalPages = searchMode === 'order' && searchData ? searchTotalPages : latestTotalPages;
  const currentUpdatedAt = searchMode === 'order' && searchData ? searchUpdatedAt : latestUpdatedAt;
  const currentLoading = searchMode === 'order' ? searchLoading : latestLoading;

  return (
    <div className="space-y-4">
      {/* Unified Search Bar */}
      <div className="flex flex-col gap-3">
        {/* Search Bar with Mode Toggle */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center bg-card border border-border p-3 rounded-lg">
          <div className="flex-1">
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery} 
              onSearch={() => loadSearch(1)} 
              placeholder={searchMode === 'order' ? 'Ex: WD1234567...' : 'Ex: 123456'}
              loading={currentLoading}
              storageKey={searchMode === 'order' ? 'withdrawal_order_search' : 'withdrawal_user_search'}
              maxHistory={5}
              modes={[
                { value: 'order', label: 'Search Order' },
                { value: 'latest', label: 'Latest Withdrawal' }
              ]}
              selectedMode={searchMode}
              onModeChange={handleModeChange}
            />
          </div>

          {/* Info Display on Right */}
          <div className="flex flex-col items-end gap-1 sm:min-w-max">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-medium text-foreground">
                {searchMode === 'order' ? 'Search Order' : 'Latest Withdrawal'}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              <LastUpdated 
                timestamp={currentUpdatedAt} 
                onRefresh={() => {
                  if (searchMode === 'order') {
                    if (searchQuery.trim()) loadSearch(1);
                  } else {
                    loadLatest(latestPage);
                  }
                }} 
                loading={currentLoading} 
                compact
              />
            </div>
          </div>
        </div>

        {/* Status Info for Latest Mode */}
        {searchMode === 'latest' && (
          <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-md">
            <p className="text-xs text-foreground font-medium">📋 Withdrawal Status Meanings:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5 text-[11px] text-muted-foreground">
              <div><span className="font-medium text-yellow-400">PENDING</span> - Awaiting approval</div>
              <div><span className="font-medium text-blue-400">AUDITING</span> - Approved, payout processing</div>
              <div><span className="font-medium text-primary">SUCCESS</span> - Completed</div>
              <div><span className="font-medium text-destructive">FAILED</span> - Payout failed</div>
              <div><span className="font-medium">CANCELLED</span> - Cancelled/refunded</div>
            </div>
          </div>
        )}

        {/* Filters for Latest Mode */}
        {searchMode === 'latest' && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-1 bg-card border border-border p-2 rounded-lg">
            <div className="space-y-0.5">
              <label className="text-xs font-medium text-muted-foreground">Status Filter</label>
              <select
                className="flex h-9 w-full sm:w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={latestStatus}
                onChange={(e) => setLatestStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="AUDITING">AUDITING</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            
            <div className="space-y-0.5">
              <label className="text-xs font-medium text-muted-foreground">Date Range</label>
              <div className="flex gap-0.5 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[130px] justify-start text-left font-normal text-xs h-9",
                        !latestDateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {latestDateFrom ? format(latestDateFrom, "MMM dd") : <span>From</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={latestDateFrom}
                      onSelect={setLatestDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground text-xs">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[130px] justify-start text-left font-normal text-xs h-9",
                        !latestDateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {latestDateTo ? format(latestDateTo, "MMM dd") : <span>To</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={latestDateTo}
                      onSelect={setLatestDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button onClick={() => loadLatest(1)} disabled={latestLoading} className="h-9 w-full sm:w-auto">
              {latestLoading ? 'Filtering...' : 'Apply Filters'}
            </Button>

            {(latestStatus || latestDateFrom || latestDateTo) && (
              <Button 
                onClick={() => {
                  setLatestStatus('');
                  setLatestDateFrom(undefined);
                  setLatestDateTo(undefined);
                  setTimeout(() => loadLatest(1), 0);
                }} 
                variant="outline" 
                className="h-9 w-full sm:w-auto text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Results Count */}
        {searchMode === 'order' && searchData && (
          <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
            Found {searchData.total || 0} result{(searchData.total || 0) !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Results Table */}
      {searchMode === 'order' && searchData && renderTable(searchData, searchPage, searchTotalPages, (p) => loadSearch(p), false)}
      {searchMode === 'latest' && latestData && renderTable(latestData, latestPage, latestTotalPages, (p) => loadLatest(p), true)}
    </div>
  );
};

export default Withdrawals;
