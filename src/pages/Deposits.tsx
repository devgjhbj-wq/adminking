import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDeposits, approveDeposit, fetchDepositConfig, updateDepositConfig, fetchDepositBonusConfig, updateDepositBonusConfig, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DepositResponse, DepositItem, DepositFilters } from '@/types/deposit';
import { PageContainer, SearchHeader, Pagination } from '@/components/PageContainer';
import '@/styles/deposits-design.css';

const Deposits = () => {
  const { token } = useAuth();

  const [userId, setUserId] = useState('');
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [results, setResults] = useState<DepositResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'orders' | 'config' | 'bonus'>('orders');
  const [config, setConfig] = useState<any[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [editConfig, setEditConfig] = useState<Record<string, { isActive: boolean; minAmount: number; maxAmount: number; exchangeRate: number }>>({});
  const [bonusConfig, setBonusConfig] = useState<any[]>([]);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusSaving, setBonusSaving] = useState(false);
  const [editBonus, setEditBonus] = useState<Record<number, { bonusRate: number; active: boolean }>>({});

  const loadConfig = useCallback(async () => {
    setAuthToken(token);
    setConfigLoading(true);
    try {
      const res = await fetchDepositConfig();
      const data = res.data?.data || [];
      setConfig(data);
      const edits: Record<string, any> = {};
      data.forEach((ch: any) => {
        edits[ch.channel] = { isActive: ch.isActive, minAmount: ch.minAmount, maxAmount: ch.maxAmount, exchangeRate: ch.exchangeRate ?? 1 };
      });
      setEditConfig(edits);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load config');
    } finally {
      setConfigLoading(false);
    }
  }, [token]);

  const handleSaveConfig = async (channel: string) => {
    setAuthToken(token);
    setConfigSaving(true);
    try {
      const data = editConfig[channel];
      const payload: Record<string, any> = {};
      if (data.isActive !== config.find((c: any) => c.channel === channel)?.isActive) payload.isActive = data.isActive;
      if (data.minAmount !== config.find((c: any) => c.channel === channel)?.minAmount) payload.minAmount = data.minAmount;
      if (data.maxAmount !== config.find((c: any) => c.channel === channel)?.maxAmount) payload.maxAmount = data.maxAmount;
      if (data.exchangeRate !== config.find((c: any) => c.channel === channel)?.exchangeRate) payload.exchangeRate = data.exchangeRate;
      const res = await updateDepositConfig(channel, payload);
      setConfig(prev => prev.map(c => c.channel === channel ? res.data?.data : c));
      toast.success('Channel updated');
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update channel');
    } finally {
      setConfigSaving(false);
    }
  };

  const loadBonusConfig = useCallback(async () => {
    setAuthToken(token);
    setBonusLoading(true);
    try {
      const res = await fetchDepositBonusConfig();
      const data = res.data?.configs || [];
      setBonusConfig(data);
      const edits: Record<number, any> = {};
      data.forEach((c: any) => {
        edits[c.depositCount] = { bonusRate: c.bonusRate, active: c.active };
      });
      setEditBonus(edits);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load bonus config');
    } finally {
      setBonusLoading(false);
    }
  }, [token]);

  const handleSaveBonusConfig = async (depositCount: number) => {
    setAuthToken(token);
    setBonusSaving(true);
    try {
      const data = editBonus[depositCount];
      const res = await updateDepositBonusConfig({ depositCount, bonusRate: data.bonusRate, active: data.active });
      setBonusConfig(prev => prev.map(c => c.depositCount === depositCount ? res.data?.config : c));
      toast.success('Bonus tier updated');
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update bonus tier');
    } finally {
      setBonusSaving(false);
    }
  };

  useEffect(() => {
    if (tab === 'config') loadConfig();
    if (tab === 'bonus') loadBonusConfig();
  }, [tab]);

  const handleApprove = async (orderIdToApprove: string) => {
    setAuthToken(token);
    setApprovingId(orderIdToApprove);
    try {
      const res = await approveDeposit(orderIdToApprove);
      toast.success(res.data.msg || 'Deposit approved');
      if (results?.items) {
        const updatedItems = results.items.map((d) =>
          d.orderId === orderIdToApprove ? { ...d, status: 'SUCCESS' as const } : d
        );
        setResults({ ...results, items: updatedItems });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string } }; message?: string };
      toast.error(error.response?.data?.msg || error.message || 'Failed to approve deposit');
    } finally {
      setApprovingId(null);
    }
  };

  const handleSearch = useCallback(async (p = 1) => {
    setLoading(true);
    setAuthToken(token);
    try {
      const filters: DepositFilters = {
        page: p,
        limit: 50,
      };
      const q = userId.trim();
      if (q) filters.userId = q;
      const mob = phone.trim();
      const oid = orderId.trim();
      if (q) filters.userId = q;
      if (mob) filters.mobile = mob;
      if (oid) filters.orderId = oid;
      if (status && status !== 'all') filters.status = status;
      if (dateFrom) filters.dateFrom = format(dateFrom, 'yyyy-MM-dd');
      if (dateTo) filters.dateTo = format(dateTo, 'yyyy-MM-dd');
      const response = await fetchDeposits(filters);
      setResults(response.data);
      setPage(p);
      setPageInput(p.toString());
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [token, userId, phone, orderId, status, dateFrom, dateTo]);

  const handleSearchClick = async (p = 1) => {
    const q = userId.trim();
    const mob = phone.trim();
    const oid = orderId.trim();
    if (!q && !mob && !oid && !status && !dateFrom && !dateTo) {
      toast.error('Select at least one filter');
      return;
    }
    await handleSearch(p);
  };

  const handlePageGo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const p = parseInt(pageInput);
      if (!isNaN(p) && p > 0 && p <= totalPages) {
        handleSearch(p);
      } else {
        toast.error(`Invalid page number. Please enter between 1 and ${totalPages}`);
      }
    }
  };

  const handleReset = () => {
    setUserId('');
    setPhone('');
    setOrderId('');
    setStatus('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setResults(null);
    setPage(1);
  };

  const totalPages = results?.total ? Math.ceil(results.total / (results.limit || 50)) : 0;

  const handleToday = () => {
    const today = new Date();
    setDateFrom(today);
    setDateTo(today);
  };

  const renderTable = (data: DepositResponse) => {
    const showEmpty = !data?.items?.length;

    return (
      <div className="relative rounded" style={{ maxHeight: 'calc(100vh - 380px)', border: '1px solid var(--ds-border-default, rgb(188,198,222))' }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Loading size={30} />
          </div>
        )}
        <div style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
          <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 1250 }}>
            <colgroup>
              <col style={{ width: 95 }} />
              <col style={{ width: 150 }} />
              <col />
              <col style={{ width: 100 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 120 }} />
              <col />
              <col />
              <col style={{ width: 80 }} />
            </colgroup>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr>
                {['User ID', 'Order No.', 'Amount', 'Recvd Amt', 'Currency', 'Status', 'Channel', 'Gateway No.', 'Note', 'Created At', 'Updated At', 'Action'].map((label) => (
                  <th key={label} className="ds-card-header">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showEmpty ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', borderBottom: '1px solid var(--ds-surface-muted, #eaeaea)', padding: 50, color: '#b0b0b0' }}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      <span>No Data</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((d: DepositItem) => (
                  <tr key={d.orderId} style={{ height: 50 }}>
                    <td style={{ borderBottom: '1px solid var(--ds-surface-muted, #eaeaea)', padding: '9px 6px', textAlign: 'center', fontSize: 12, color: '#333' }}>
                      <div className="cell">{d.userId}</div>
                    </td>
                    <td style={{ borderBottom: '1px solid var(--ds-surface-muted, #eaeaea)', padding: '9px 6px', textAlign: 'center', fontSize: 12, color: '#333' }}>
                      <div className="cell" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{d.orderId}</div>
                    </td>
                    <td style={{ borderBottom: '1px solid var(--ds-surface-muted, #eaeaea)', padding: '9px 6px', textAlign: 'center', fontSize: 12, color: '#333' }}>
                      <div className="cell">₹{d.amount?.toLocaleString()}</div>
                    </td>
                    <td style={{ borderBottom: '1px solid var(--ds-surface-muted, #eaeaea)', padding: '9px 6px', textAlign: 'center', fontSize: 12, color: '#333' }}>
                      <div className="cell">{d.receivedAmount != null ? `₹${d.receivedAmount.toLocaleString()}` : '—'}</div>
                    </td>
                    <td style={{ borderBottom: '1px solid var(--ds-surface-muted, #eaeaea)', padding: '9px 6px', textAlign: 'center', fontSize: 12, color: '#333' }}>
                      <div className="cell">{d.currency || 'INR'}</div>
                    </td>
                    <td style={{ borderBottom: '1px solid var(--ds-surface-muted, #eaeaea)', padding: '9px 6px', textAlign: 'center', fontSize: 12, color: '#333' }}>
                      <div className="cell">
                        <span className={`ds-badge ds-badge--${d.status}`}>
                          <span className="sr-only">Status: </span>{d.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ borderBottom: '1px solid var(--ds-surface-muted, #eaeaea)', padding: '9px 6px', textAlign: 'center', fontSize: 12, color: '#333' }}>
                      <div className="cell">{d.channelName}</div>
                    </td>
                    <td style={{ borderBottom: '1px solid var(--ds-surface-muted, #eaeaea)', padding: '9px 6px', textAlign: 'center', fontSize: 12, color: '#333' }}>
                      <div className="cell" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{d.gatewayOrderNo}</div>
                    </td>
                    <td style={{ borderBottom: '1px solid var(--ds-surface-muted, #eaeaea)', padding: '9px 6px', textAlign: 'center', fontSize: 12, color: '#333' }}>
                      <div className="cell">{d.note || '-'}</div>
                    </td>
                    <td style={{ borderBottom: '1px solid var(--ds-surface-muted, #eaeaea)', padding: '9px 6px', textAlign: 'center', fontSize: 12, color: '#333' }}>
                      <div className="cell">{new Date(d.createdAt).toLocaleString()}</div>
                    </td>
                    <td style={{ borderBottom: '1px solid var(--ds-surface-muted, #eaeaea)', padding: '9px 6px', textAlign: 'center', fontSize: 12, color: '#333' }}>
                      <div className="cell">{d.updatedAt ? new Date(d.updatedAt).toLocaleString() : '—'}</div>
                    </td>
                    <td style={{ borderBottom: '1px solid var(--ds-surface-muted, #eaeaea)', padding: '9px 6px', textAlign: 'center', fontSize: 12, color: '#333' }}>
                      <div className="cell">
                        {d.status === 'PENDING' ? (
                          <button
                            onClick={() => handleApprove(d.orderId)}
                            disabled={approvingId === d.orderId}
                            aria-label={`Approve order ${d.orderId}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              height: 24, padding: '0 8px', fontSize: 11, fontWeight: 600,
                              borderRadius: 3, border: 0, cursor: approvingId === d.orderId ? 'not-allowed' : 'pointer',
                              background: approvingId === d.orderId ? '#a0c0e0' : '#67c23a',
                              color: '#fff', lineHeight: 1, whiteSpace: 'nowrap',
                              transition: 'background 200ms',
                            }}
                            onMouseOver={e => { if (approvingId !== d.orderId) (e.target as HTMLButtonElement).style.background = '#85ce61'; }}
                            onMouseOut={e => { if (approvingId !== d.orderId) (e.target as HTMLButtonElement).style.background = '#67c23a'; }}
                          >
                            {approvingId === d.orderId ? 'Loading...' : 'Approve'}
                          </button>
                        ) : (
                          <span style={{ color: '#b0b0b0', fontSize: 12 }}>—</span>
                        )}
                      </div>
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
    <div className="deposits-page">
    <PageContainer>
      <div className="flex items-center gap-0 bg-card border border-border rounded-lg px-1.5 h-[34px]" role="tablist" aria-label="Deposit sections">
        {(['orders', 'config', 'bonus'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-3 text-xs font-medium rounded-pill transition-all h-[26px] capitalize ${
              tab === t
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
      <>

      <SearchHeader>
        <div className="form-grid w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">User ID</div>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="w-full h-[34px] text-sm px-2"
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Phone</div>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className="w-full h-[34px] text-sm px-2"
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Order ID</div>
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID"
              className="w-full h-[34px] text-sm px-2"
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Status</div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full h-[34px] text-sm px-3">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">From</div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  aria-label={dateFrom ? `From date: ${format(dateFrom, 'MMM dd, yyyy')}` : 'From date'}
                  className="w-full justify-start text-left font-normal text-sm h-[34px] px-3"
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
                  aria-label={dateTo ? `To date: ${format(dateTo, 'MMM dd, yyyy')}` : 'To date'}
                  className="w-full justify-start text-left font-normal text-sm h-[34px] px-3"
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
              className="h-[34px] px-3 text-sm bg-primary text-primary-foreground"
            >
              Today
            </Button>
          </div>

          <div className="flex items-end gap-3">
            <Button
              onClick={() => handleSearchClick(1)}
              disabled={loading}
              size="sm"
              className="h-[34px] px-4 text-sm bg-primary text-primary-foreground"
            >
              {loading ? <Loading size={14} /> : null}
              Search
            </Button>
            <Button
              onClick={handleReset}
              disabled={loading}
              variant="outline"
              size="sm"
              className="h-[34px] px-4 text-sm"
            >
              Reset
            </Button>
          </div>
        </div>
      </SearchHeader>

      {results && (
        <>
          {renderTable(results)}
          <Pagination page={page} totalPages={totalPages} total={results.total} loading={loading} onPageChange={(p) => handleSearch(p)} />
        </>
      )}
      </>
      )}

      {tab === 'bonus' && (
        <div className="bg-card border border-border p-4 rounded-lg space-y-4">
          <h3 className="text-sm font-semibold tracking-tight">Deposit Bonus Configuration</h3>
          {bonusLoading ? (
            <div className="flex justify-center py-8"><Loading size={20} /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bonusConfig.map((c: any) => {
                return (
                <div key={c.depositCount} className="border border-border rounded-lg p-4 bg-card shadow-apple-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-tight">
                      {c.depositCount === 1 ? '1st' : c.depositCount === 2 ? '2nd' : '3rd'} Deposit Bonus
                    </span>
                    <Button
                      onClick={() => handleSaveBonusConfig(c.depositCount)}
                      disabled={bonusSaving}
                      size="sm"
                      className="h-7 text-xs bg-primary text-primary-foreground"
                    >
                      {bonusSaving && <Loading size={12} className="mr-1" />}
                      Save
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground" htmlFor={`bonus-rate-${c.depositCount}`}>Bonus Rate (%)</label>
                      <Input
                        id={`bonus-rate-${c.depositCount}`}
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        className="h-7 text-xs mt-0.5"
                        value={editBonus[c.depositCount]?.bonusRate ?? 0}
                        onChange={(e) => setEditBonus(prev => ({
                          ...prev,
                          [c.depositCount]: { ...prev[c.depositCount], bonusRate: Number(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground" htmlFor={`bonus-active-${c.depositCount}`}>Active</label>
                      <div className="mt-1.5">
                        <Switch
                          id={`bonus-active-${c.depositCount}`}
                          checked={editBonus[c.depositCount]?.active ?? false}
                          onCheckedChange={(checked) => setEditBonus(prev => ({
                            ...prev,
                            [c.depositCount]: { ...prev[c.depositCount], active: checked }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>Current rate: <strong>{(c.bonusRate * 100).toFixed(0)}%</strong></span>
                    {c.createdAt && <span>| Created: {new Date(c.createdAt).toLocaleDateString()}</span>}
                    {c.updatedAt && <span>| Updated: {new Date(c.updatedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'config' && (
        <div className="bg-card border border-border p-4 rounded-lg space-y-4">
          <h3 className="text-sm font-semibold tracking-tight">Deposit Channel Configuration</h3>
          {configLoading ? (
            <div className="flex justify-center py-8"><Loading size={20} /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.map((ch: any) => {
                return (
                <div key={ch.channel} className="border border-border rounded-lg p-4 bg-card shadow-apple-card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs font-semibold text-foreground uppercase tracking-tight">{ch.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">({ch.channel})</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{ch.description}</span>
                    </div>
                    <Button
                      onClick={() => handleSaveConfig(ch.channel)}
                      disabled={configSaving}
                      size="sm"
                      className="h-7 text-xs bg-primary text-primary-foreground"
                    >
                      {configSaving && <Loading size={12} className="mr-1" />}
                      Save
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground" htmlFor={`active-${ch.channel}`}>Active</label>
                      <div className="mt-1.5">
                        <Switch
                          id={`active-${ch.channel}`}
                          checked={editConfig[ch.channel]?.isActive ?? false}
                          onCheckedChange={(checked) => setEditConfig(prev => ({
                            ...prev,
                            [ch.channel]: { ...prev[ch.channel], isActive: checked }
                          }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground" htmlFor={`min-${ch.channel}`}>Min Amount</label>
                      <Input
                        id={`min-${ch.channel}`}
                        type="number"
                        className="h-7 text-xs mt-0.5"
                        value={editConfig[ch.channel]?.minAmount ?? ''}
                        onChange={(e) => setEditConfig(prev => ({
                          ...prev,
                          [ch.channel]: { ...prev[ch.channel], minAmount: Number(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground" htmlFor={`max-${ch.channel}`}>Max Amount</label>
                      <Input
                        id={`max-${ch.channel}`}
                        type="number"
                        className="h-7 text-xs mt-0.5"
                        value={editConfig[ch.channel]?.maxAmount ?? ''}
                        onChange={(e) => setEditConfig(prev => ({
                          ...prev,
                          [ch.channel]: { ...prev[ch.channel], maxAmount: Number(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground" htmlFor={`rate-${ch.channel}`}>Exchange Rate</label>
                      <Input
                        id={`rate-${ch.channel}`}
                        type="number"
                        step="0.01"
                        className="h-7 text-xs mt-0.5"
                        value={editConfig[ch.channel]?.exchangeRate ?? 1}
                        onChange={(e) => setEditConfig(prev => ({
                          ...prev,
                          [ch.channel]: { ...prev[ch.channel], exchangeRate: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}
    </PageContainer>
    </div>
  );
};

export default Deposits;
