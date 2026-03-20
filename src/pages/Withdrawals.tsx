import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithdrawals, fetchWithdrawalByOrder, approveWithdrawal, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const statusColor: Record<string, string> = {
  SUCCESS: 'bg-primary/20 text-primary',
  AUDITING: 'bg-blue-500/20 text-blue-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  FAILED: 'bg-destructive/20 text-destructive',
  CANCELLED: 'bg-muted text-muted-foreground',
};

const Withdrawals = () => {
  const { token } = useAuth();
  
  // Latest Withdrawals state
  const [latestData, setLatestData] = useState<any>(null);
  const [latestLoading, setLatestLoading] = useState(false);
  const [latestPage, setLatestPage] = useState(1);
  const [latestStatus, setLatestStatus] = useState('');
  const [latestDateFrom, setLatestDateFrom] = useState<Date>();
  const [latestDateTo, setLatestDateTo] = useState<Date>();
  const [latestUpdatedAt, setLatestUpdatedAt] = useState<Date | null>(null);

  // Search Withdrawals state
  const [searchData, setSearchData] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchUserId, setSearchUserId] = useState('');
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchUpdatedAt, setSearchUpdatedAt] = useState<Date | null>(null);
  const [lastSearchType, setLastSearchType] = useState<'user' | 'order' | null>(null);

  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (orderIdToApprove: string) => {
    setAuthToken(token);
    setApprovingId(orderIdToApprove);
    try {
      const res = await approveWithdrawal(orderIdToApprove);
      toast.success(res.data.msg || 'Withdrawal approved');
      const updateFn = (prev: any) => {
        if (!prev?.items) return prev;
        return {
          ...prev,
          items: prev.items.map((d: any) => d.orderId === orderIdToApprove ? { ...d, status: 'AUDITING' } : d)
        };
      };
      setLatestData(updateFn);
      setSearchData(updateFn);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || err.message || 'Failed to approve withdrawal');
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    loadLatest(1);
  }, [token]);

  const loadLatest = async (p = 1) => {
    setAuthToken(token);
    setLatestLoading(true);
    try {
      // Build filters object with current state values
      const filters: any = {
        page: p,
        limit: 50,
      };
      
      // Explicitly add filters if they have values
      if (latestStatus && latestStatus.trim()) {
        filters.status = latestStatus;
      }
      if (latestDateFrom) {
        filters.dateFrom = format(latestDateFrom, 'yyyy-MM-dd');
      }
      if (latestDateTo) {
        filters.dateTo = format(latestDateTo, 'yyyy-MM-dd');
      }

      const res = await fetchWithdrawals(filters);
      setLatestData(res.data);
      setLatestPage(p);
      setLatestUpdatedAt(new Date());
      
      // Show feedback for applied filters
      const appliedFilters = [];
      if (latestStatus && latestStatus.trim()) appliedFilters.push(`Status: ${latestStatus}`);
      if (latestDateFrom) appliedFilters.push(`From: ${format(latestDateFrom, 'MMM dd, yyyy')}`);
      if (latestDateTo) appliedFilters.push(`To: ${format(latestDateTo, 'MMM dd, yyyy')}`);
      
      if (appliedFilters.length > 0) {
        toast.success(`Filters applied: ${appliedFilters.join(' | ')}`);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.msg || 'Failed to load withdrawals';
      toast.error(errorMsg);
    } finally {
      setLatestLoading(false);
    }
  };

  const loadSearchByUser = async (p = 1) => {
    const q = searchUserId.trim();
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
    setSearchLoading(true);
    setLastSearchType('user');
    try {
      const res = await fetchWithdrawals({
        userId: q,
        page: p,
        limit: 50,
      });
      setSearchData(res.data);
      setSearchPage(p);
      setSearchUpdatedAt(new Date());
    } catch (err: any) {
      const errorMsg = err.response?.data?.msg || 'Failed to load withdrawals by user';
      toast.error(errorMsg);
      setSearchData(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadSearchByOrder = async () => {
    const q = searchOrderId.trim();
    if (!q) {
      toast.error('Order ID is required');
      return;
    }
    setAuthToken(token);
    setSearchLoading(true);
    setLastSearchType('order');
    try {
      const res = await fetchWithdrawalByOrder(q);
      // API returns items array with the withdrawal order
      if (res.data?.items && Array.isArray(res.data.items)) {
        setSearchData({
          items: res.data.items,
          total: res.data.items.length,
          limit: 1,
          page: 1,
          status: res.data.status
        });
      } else {
        toast.error('Order not found');
        setSearchData(null);
      }
      setSearchPage(1);
      setSearchUpdatedAt(new Date());
    } catch (err: any) {
      const errorMsg = err.message === 'Order ID is required' ? 'Please enter a valid order ID' : err.response?.data?.msg || 'Failed to load withdrawal order';
      toast.error(errorMsg);
      setSearchData(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const renderTable = (data: any, page: number, totalPages: number, loadMoreFn: (p: number) => void, isPaginated: boolean) => {
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
                {data.items.map((d: any, i: number) => (
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

  const latestTotalPages = latestData?.total ? Math.ceil(latestData.total / (latestData.limit || 25)) : 0;
  const searchTotalPages = searchData?.total ? Math.ceil(searchData.total / (searchData.limit || 25)) : 0;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="search">Search Orders</TabsTrigger>
          <TabsTrigger value="latest">Latest Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-1.5">
          <div className="flex flex-col gap-2 bg-card border border-border p-2 rounded-lg shadow-sm mb-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Search Withdrawal Orders</h3>
              <p className="text-xs text-muted-foreground mb-4">Find withdrawal orders by User ID or Order ID</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 w-full sm:w-auto">
                <span className="text-xs font-medium text-muted-foreground block mb-0.5">Search by Order ID</span>
                <div className="flex gap-0.5">
                  <SearchBar 
                    value={searchOrderId} 
                    onChange={setSearchOrderId} 
                    onSearch={loadSearchByOrder} 
                    placeholder="Ex: WD1234567..." 
                    loading={searchLoading && lastSearchType === 'order'}
                    storageKey="withdrawal_order_search"
                    maxHistory={5}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Enter the withdrawal order ID to search</p>
              </div>
              
              <div className="flex items-center justify-center pt-5">
                <span className="text-muted-foreground text-xs px-3 uppercase font-medium whitespace-nowrap">OR</span>
              </div>
              
              <div className="flex-1 w-full sm:w-auto">
                <span className="text-xs font-medium text-muted-foreground block mb-1.5">Search by User ID</span>
                <div className="flex gap-1.5">
                  <SearchBar 
                    value={searchUserId} 
                    onChange={setSearchUserId} 
                    onSearch={() => loadSearchByUser(1)} 
                    placeholder="Ex: 123456" 
                    loading={searchLoading && lastSearchType === 'user'}
                    storageKey="withdrawal_user_search"
                    maxHistory={5}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Enter user ID to see all withdrawals (50 per page)</p>
              </div>
            </div>
            
            {lastSearchType && searchData && (
              <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
                Found {searchData.total || 0} result{(searchData.total || 0) !== 1 ? 's' : ''}
              </div>
            )}
            
            <div className="flex justify-end">
              <LastUpdated 
                timestamp={searchUpdatedAt} 
                onRefresh={() => {
                  if (lastSearchType === 'order') {
                    loadSearchByOrder();
                  } else if (lastSearchType === 'user') {
                    loadSearchByUser(searchPage);
                  }
                }} 
                loading={searchLoading} 
              />
            </div>
          </div>
          {searchData && renderTable(searchData, searchPage, searchTotalPages, loadSearchByUser, lastSearchType === 'user')}
        </TabsContent>

        <TabsContent value="latest" className="space-y-4">
          <div className="flex flex-col gap-3">
            {/* Filter Info */}
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

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 bg-card border border-border p-2 rounded-lg">
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

              <Button onClick={() => loadLatest(1)} disabled={latestLoading} className="h-9 sm:mt-6 w-full sm:w-auto">
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

            <div className="flex justify-end">
              <LastUpdated timestamp={latestUpdatedAt} onRefresh={() => loadLatest(latestPage)} loading={latestLoading} />
            </div>
          </div>
          {renderTable(latestData, latestPage, latestTotalPages, loadLatest, true)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Withdrawals;
