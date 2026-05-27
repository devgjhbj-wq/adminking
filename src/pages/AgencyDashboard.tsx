import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAgentStats, fetchAgencyConfigs, updateAgencyConfigLevel, seedAgencyConfigs,
  fetchAgentLevel, fetchAgencyDaily, fetchAgentTeam, runMidnightBatch, setAuthToken
} from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Save, RefreshCw, Play, Plus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const tabs = ['Stats', 'Daily', 'Team', 'Config'] as const;
type Tab = typeof tabs[number];

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <div className="flex justify-between items-center py-0.5 border-b border-border last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-medium text-foreground">{String(value ?? '—')}</span>
  </div>
);

const AgencyDashboard = () => {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('Stats');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // ── Stats tab ──
  const [statsUserId, setStatsUserId] = useState('');
  const [statsData, setStatsData] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsPage, setStatsPage] = useState(1);
  const statsTotalPages = statsData?.totalInvitees ? Math.ceil(statsData.totalInvitees / (statsData.limit || 50)) : 0;

  const loadStats = useCallback(async (p = 1) => {
    const q = statsUserId.trim();
    if (!q) return;
    setAuthToken(token);
    setStatsLoading(true);
    try {
      const res = await fetchAgentStats(q, p);
      setStatsData(res.data);
      setStatsPage(p);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load agent stats');
    } finally {
      setStatsLoading(false);
    }
  }, [token, statsUserId]);

  // ── Daily tab ──
  const [dailyUserId, setDailyUserId] = useState('');
  const [dailyDate, setDailyDate] = useState<Date>();
  const [dailyData, setDailyData] = useState<any>(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  const loadDaily = useCallback(async () => {
    const q = dailyUserId.trim();
    if (!q) return;
    setAuthToken(token);
    setDailyLoading(true);
    try {
      const res = await fetchAgencyDaily(q, dailyDate ? format(dailyDate, 'yyyy-MM-dd') : undefined);
      setDailyData(res.data);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load daily stats');
    } finally {
      setDailyLoading(false);
    }
  }, [token, dailyUserId, dailyDate]);

  // ── Team tab ──
  const [teamAgentId, setTeamAgentId] = useState('');
  const [teamToDate, setTeamToDate] = useState<Date>();
  const [teamFromDate, setTeamFromDate] = useState<Date>();
  const [teamTier, setTeamTier] = useState('');
  const [teamData, setTeamData] = useState<any>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamPage, setTeamPage] = useState(1);
  const teamTotalPages = teamData?.total ? Math.ceil(teamData.total / (teamData.limit || 25)) : 0;

  const loadTeam = useCallback(async (p = 1) => {
    const q = teamAgentId.trim();
    if (!q || !teamToDate) { toast.error('Enter Agent ID and To Date'); return; }
    setAuthToken(token);
    setTeamLoading(true);
    try {
      const res = await fetchAgentTeam(q, format(teamToDate, 'yyyy-MM-dd'), {
        fromDate: teamFromDate ? format(teamFromDate, 'yyyy-MM-dd') : undefined,
        tier: teamTier ? Number(teamTier) : undefined,
        page: p, limit: 25,
      });
      setTeamData(res.data);
      setTeamPage(p);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load team');
    } finally {
      setTeamLoading(false);
    }
  }, [token, teamAgentId, teamToDate, teamFromDate, teamTier]);

  // ── Config tab ──
  const [configs, setConfigs] = useState<any[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const loadConfigs = useCallback(async () => {
    setAuthToken(token);
    setConfigLoading(true);
    try {
      const res = await fetchAgencyConfigs();
      setConfigs(res.data?.configs || []);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load configs');
    } finally {
      setConfigLoading(false);
    }
  }, [token]);

  const startEdit = (cfg: any) => {
    setEditingLevel(cfg.level);
    setEditForm({
      minMembers: cfg.minMembers,
      minBets: cfg.minBets,
      minDeposit: cfg.minDeposit,
      l1Rate: cfg.l1Rate,
      l2Rate: cfg.l2Rate,
      l3Rate: cfg.l3Rate,
    });
  };

  const handleSaveConfig = async () => {
    if (editingLevel === null) return;
    setAuthToken(token);
    setConfigSaving(true);
    try {
      await updateAgencyConfigLevel(editingLevel, editForm);
      toast.success(`Level ${editingLevel} config updated`);
      setEditingLevel(null);
      loadConfigs();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update config');
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSeed = async () => {
    setAuthToken(token);
    try {
      await seedAgencyConfigs();
      toast.success('Default configs seeded');
      loadConfigs();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to seed configs');
    }
  };

  // ── Admin batch ──
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);

  const handleRunBatch = async () => {
    setAuthToken(token);
    setBatchRunning(true);
    setBatchResult(null);
    try {
      const res = await runMidnightBatch();
      setBatchResult(res.data);
      toast.success(res.data.msg || 'Batch completed');
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Batch failed');
    } finally {
      setBatchRunning(false);
    }
  };

  useEffect(() => {
    if (tab === 'Config') loadConfigs();
  }, [tab, loadConfigs]);

  const renderAggregation = (agg: any) => {
    if (!agg) return null;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
        <div><span className="text-muted-foreground">Deposit Count: </span><span className="font-medium">{agg.depositCount ?? 0}</span></div>
        <div><span className="text-muted-foreground">Deposit Amt: </span><span className="font-medium">₹{(agg.depositAmount ?? 0).toLocaleString()}</span></div>
        <div><span className="text-muted-foreground">Bettor Count: </span><span className="font-medium">{agg.bettorCount ?? 0}</span></div>
        <div><span className="text-muted-foreground">Bet Amount: </span><span className="font-medium">₹{(agg.betAmount ?? 0).toLocaleString()}</span></div>
        <div><span className="text-muted-foreground">1st Deposit Count: </span><span className="font-medium">{agg.firstDepositCount ?? 0}</span></div>
        <div><span className="text-muted-foreground">1st Deposit Amt: </span><span className="font-medium">₹{(agg.firstDepositAmount ?? 0).toLocaleString()}</span></div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Tab Bar */}
      <div className="flex gap-4 border-b border-border">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-1.5 text-xs font-medium border-b-2 transition-colors ${tab === t ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Stats Tab ── */}
      {tab === 'Stats' && (
        <div className="space-y-2">
          <div className="bg-card border border-border p-2 rounded-lg">
            <SearchBar value={statsUserId} onChange={setStatsUserId} onSearch={() => loadStats(1)} placeholder="Enter Agent User ID" loading={statsLoading} storageKey="agency_stats_search" maxHistory={5} />
          </div>

          {statsData?.agent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-card border border-border p-3 rounded-lg space-y-1">
                <h3 className="text-xs font-semibold text-foreground">Agent Info</h3>
                <InfoRow label="User ID" value={statsData.agent.userId} />
                <InfoRow label="Mobile" value={statsData.agent.mobile} />
                <InfoRow label="Admin" value={statsData.agent.admin ? 'Yes' : 'No'} />
                <InfoRow label="Referred By" value={statsData.agent.referredBy} />
                <InfoRow label="Created" value={new Date(statsData.agent.createdAt).toLocaleString()} />
              </div>
              <div className="bg-card border border-border p-3 rounded-lg space-y-1">
                <h3 className="text-xs font-semibold text-foreground">Inviter</h3>
                {statsData.inviter ? (
                  <>
                    <InfoRow label="User ID" value={statsData.inviter.userId} />
                    <InfoRow label="Mobile" value={statsData.inviter.mobile} />
                    <InfoRow label="Created" value={new Date(statsData.inviter.createdAt).toLocaleString()} />
                  </>
                ) : <p className="text-xs text-muted-foreground">No inviter</p>}
                <div className="pt-2 border-t border-border"><InfoRow label="Total Invitees" value={statsData.totalInvitees} /></div>
              </div>
            </div>
          )}

          {statsData?.invitees?.length > 0 && (
            <>
              <div className="bg-card border border-border overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left p-2 text-muted-foreground font-medium">User ID</th>
                        <th className="text-left p-2 text-muted-foreground font-medium">Mobile</th>
                        <th className="text-left p-2 text-muted-foreground font-medium">Deposits</th>
                        <th className="text-left p-2 text-muted-foreground font-medium">Withdrawals</th>
                        <th className="text-left p-2 text-muted-foreground font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData.invitees.map((inv: any, i: number) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="p-2 text-foreground font-mono text-[10px]">{inv.userId}</td>
                          <td className="p-2 text-muted-foreground">{inv.mobile || '—'}</td>
                          <td className="p-2 text-primary font-medium">₹{(inv.totals?.deposit ?? 0).toLocaleString()}</td>
                          <td className="p-2 text-destructive font-medium">₹{(inv.totals?.withdraw ?? 0).toLocaleString()}</td>
                          <td className="p-2 text-muted-foreground">{new Date(inv.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {statsTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total: {statsData.totalInvitees} — Page {statsPage}/{statsTotalPages}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={statsPage <= 1} onClick={() => loadStats(statsPage - 1)}><ChevronLeft className="w-3.5 h-3.5" /></Button>
                    <Button variant="outline" size="sm" disabled={statsPage >= statsTotalPages} onClick={() => loadStats(statsPage + 1)}><ChevronRight className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
          <LastUpdated timestamp={updatedAt} onRefresh={() => loadStats(statsPage)} loading={statsLoading} compact />
        </div>
      )}

      {/* ── Daily Tab ── */}
      {tab === 'Daily' && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2 bg-card border border-border p-2 rounded-lg">
            <div className="flex-1">
              <SearchBar value={dailyUserId} onChange={setDailyUserId} onSearch={loadDaily} placeholder="Enter Agent User ID" loading={dailyLoading} storageKey="agency_daily_search" maxHistory={5} />
            </div>
            <div className="w-full sm:w-36">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-xs h-7 px-2", !dailyDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dailyDate ? format(dailyDate, "MMM dd, yyyy") : "Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dailyDate} onSelect={setDailyDate} initialFocus captionLayout="dropdown-buttons" fromYear={2024} toYear={2026} />
                </PopoverContent>
              </Popover>
            </div>
            <LastUpdated timestamp={updatedAt} onRefresh={loadDaily} loading={dailyLoading} compact />
          </div>

          {dailyData && (
            <div className="space-y-3">
              <div className="bg-card border border-border p-3 rounded-lg">
                <div className="flex flex-wrap gap-4 text-xs">
                  <span><span className="text-muted-foreground">Date: </span><span className="font-medium">{new Date(dailyData.date).toLocaleDateString()}</span></span>
                  <span><span className="text-muted-foreground">This Week Commission: </span><span className="font-medium text-primary">₹{dailyData.thisWeekCommission?.toLocaleString()}</span></span>
                  <span><span className="text-muted-foreground">Total Commission: </span><span className="font-medium text-primary">₹{dailyData.totalCommission?.toLocaleString()}</span></span>
                  <span><span className="text-muted-foreground">Yesterday: </span><span className="font-medium">₹{dailyData.yesterdayTotalCommission?.toLocaleString()}</span></span>
                </div>
                {dailyData.totalRegister && (
                  <div className="flex gap-4 text-xs mt-2 pt-2 border-t border-border">
                    <span><span className="text-muted-foreground">L1 Reg: </span><span className="font-medium">{dailyData.totalRegister.level1 ?? 0}</span></span>
                    <span><span className="text-muted-foreground">L2 Reg: </span><span className="font-medium">{dailyData.totalRegister.level2 ?? 0}</span></span>
                    <span><span className="text-muted-foreground">L3 Reg: </span><span className="font-medium">{dailyData.totalRegister.level3 ?? 0}</span></span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {['level1', 'level2', 'level3'].map((lvl) => {
                  const s = dailyData[lvl];
                  return s ? (
                    <div key={lvl} className="bg-card border border-border p-3 rounded-lg space-y-1">
                      <h4 className="text-xs font-semibold text-foreground capitalize">{lvl.replace('level', 'Level ')}</h4>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <div><span className="text-muted-foreground">Deposit: </span><span className="font-medium">₹{(s.deposit ?? 0).toLocaleString()}</span></div>
                        <div><span className="text-muted-foreground">Reg Count: </span><span className="font-medium">{s.regCount ?? 0}</span></div>
                        <div><span className="text-muted-foreground">Deposit Count: </span><span className="font-medium">{s.depositCount ?? 0}</span></div>
                        <div><span className="text-muted-foreground">1st Deposit: </span><span className="font-medium">{s.firstDepositCount ?? 0}</span></div>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Team Tab ── */}
      {tab === 'Team' && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-end gap-2 bg-card border border-border p-2 rounded-lg">
            <div className="flex-1 min-w-[160px]">
              <label className="text-[10px] font-medium text-muted-foreground uppercase mb-1 block">Agent ID</label>
              <SearchBar value={teamAgentId} onChange={setTeamAgentId} onSearch={() => loadTeam(1)} placeholder="Agent ID" loading={teamLoading} storageKey="agency_team_search" maxHistory={5} hideButton />
            </div>
            <div className="w-[130px]">
              <label className="text-[10px] font-medium text-muted-foreground uppercase mb-1 block">To Date *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-[11px] h-7 px-2", !teamToDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {teamToDate ? format(teamToDate, "MMM dd, yyyy") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={teamToDate} onSelect={setTeamToDate} initialFocus captionLayout="dropdown-buttons" fromYear={2024} toYear={2026} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-[130px]">
              <label className="text-[10px] font-medium text-muted-foreground uppercase mb-1 block">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-[11px] h-7 px-2", !teamFromDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {teamFromDate ? format(teamFromDate, "MMM dd, yyyy") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={teamFromDate} onSelect={setTeamFromDate} initialFocus captionLayout="dropdown-buttons" fromYear={2024} toYear={2026} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-[80px]">
              <label className="text-[10px] font-medium text-muted-foreground uppercase mb-1 block">Tier</label>
              <select value={teamTier} onChange={(e) => setTeamTier(e.target.value)} className="flex h-7 w-full rounded border border-input bg-background px-1 py-0.5 text-[11px]">
                <option value="">All</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            <Button size="sm" onClick={() => loadTeam(1)} disabled={teamLoading} className="h-7 text-xs">Search</Button>
          </div>

          {teamData?.aggregation && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-foreground">Aggregation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {['level1', 'level2', 'level3', 'total'].map((key) => {
                  const agg = teamData.aggregation[key];
                  return agg ? (
                    <div key={key} className="bg-card border border-border p-2 rounded-lg">
                      <h4 className="text-[10px] font-semibold text-foreground uppercase mb-1">{key.replace('level', 'Level ')}</h4>
                      {renderAggregation(agg)}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {teamData?.items?.length > 0 && (
            <>
              <div className="bg-card border border-border overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left p-2 text-muted-foreground font-medium">User ID</th>
                        <th className="text-left p-2 text-muted-foreground font-medium">Mobile</th>
                        <th className="text-left p-2 text-muted-foreground font-medium">Tier</th>
                        <th className="text-left p-2 text-muted-foreground font-medium">Total Deposit</th>
                        <th className="text-left p-2 text-muted-foreground font-medium">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamData.items.map((item: any, i: number) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="p-2 text-foreground font-mono text-[10px]">{item.userId}</td>
                          <td className="p-2 text-muted-foreground">{item.mobile || '—'}</td>
                          <td className="p-2"><span className="px-1.5 py-0.5 text-[10px] font-medium rounded-sm bg-secondary text-foreground">L{item.tier}</span></td>
                          <td className="p-2 text-primary font-medium">₹{(item.totalDeposit ?? 0).toLocaleString()}</td>
                          <td className="p-2 text-muted-foreground">{new Date(item.registeredAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {teamTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total: {teamData.total} — Page {teamPage}/{teamTotalPages}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={teamPage <= 1} onClick={() => loadTeam(teamPage - 1)}><ChevronLeft className="w-3.5 h-3.5" /></Button>
                    <Button variant="outline" size="sm" disabled={teamPage >= teamTotalPages} onClick={() => loadTeam(teamPage + 1)}><ChevronRight className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Config Tab ── */}
      {tab === 'Config' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-card border border-border p-2 rounded-lg">
            <h3 className="text-xs font-semibold text-foreground">Level Configurations</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadConfigs} disabled={configLoading} className="h-7 text-xs"><RefreshCw className={`w-3 h-3 mr-1 ${configLoading ? 'animate-spin' : ''}`} />Refresh</Button>
              <Button variant="outline" size="sm" onClick={handleSeed} className="h-7 text-xs"><Plus className="w-3 h-3 mr-1" />Seed Defaults</Button>
            </div>
          </div>

          {configLoading ? (
            <div className="flex justify-center py-8"><Loading size={20} /></div>
          ) : (
            <div className="bg-card border border-border overflow-hidden rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left p-2 text-muted-foreground font-medium">Level</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Min Members</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Min Bets (₹)</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Min Deposit (₹)</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">L1 Rate</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">L2 Rate</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">L3 Rate</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((cfg) => (
                      <tr key={cfg.level} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                        {editingLevel === cfg.level ? (
                          <>
                            <td className="p-2 font-medium">{cfg.level}</td>
                            <td className="p-2"><Input type="number" className="h-6 w-20 text-[10px]" value={editForm.minMembers} onChange={(e) => setEditForm({ ...editForm, minMembers: Number(e.target.value) })} /></td>
                            <td className="p-2"><Input type="number" className="h-6 w-24 text-[10px]" value={editForm.minBets} onChange={(e) => setEditForm({ ...editForm, minBets: Number(e.target.value) })} /></td>
                            <td className="p-2"><Input type="number" className="h-6 w-24 text-[10px]" value={editForm.minDeposit} onChange={(e) => setEditForm({ ...editForm, minDeposit: Number(e.target.value) })} /></td>
                            <td className="p-2"><Input type="number" step="0.0001" className="h-6 w-20 text-[10px]" value={editForm.l1Rate} onChange={(e) => setEditForm({ ...editForm, l1Rate: Number(e.target.value) })} /></td>
                            <td className="p-2"><Input type="number" step="0.0001" className="h-6 w-20 text-[10px]" value={editForm.l2Rate} onChange={(e) => setEditForm({ ...editForm, l2Rate: Number(e.target.value) })} /></td>
                            <td className="p-2"><Input type="number" step="0.0001" className="h-6 w-20 text-[10px]" value={editForm.l3Rate} onChange={(e) => setEditForm({ ...editForm, l3Rate: Number(e.target.value) })} /></td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                <Button size="sm" variant="default" className="h-6 text-[10px] px-2" onClick={handleSaveConfig} disabled={configSaving}>{configSaving ? <Loading size={10} /> : <Save className="w-3 h-3" />}</Button>
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditingLevel(null)}>Cancel</Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 font-medium">{cfg.level}</td>
                            <td className="p-2">{cfg.minMembers}</td>
                            <td className="p-2">₹{cfg.minBets?.toLocaleString()}</td>
                            <td className="p-2">₹{cfg.minDeposit?.toLocaleString()}</td>
                            <td className="p-2 font-mono">{(cfg.l1Rate * 100).toFixed(2)}%</td>
                            <td className="p-2 font-mono">{(cfg.l2Rate * 100).toFixed(2)}%</td>
                            <td className="p-2 font-mono">{(cfg.l3Rate * 100).toFixed(2)}%</td>
                            <td className="p-2"><Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => startEdit(cfg)}>Edit</Button></td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Admin: Run Midnight Batch */}
          <div className="bg-card border border-border p-3 rounded-lg space-y-2">
            <h3 className="text-xs font-semibold text-foreground">Admin Actions</h3>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={handleRunBatch} disabled={batchRunning} className="h-7 text-xs">
                {batchRunning ? <Loading size={12} className="mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                Run Midnight Batch
              </Button>
              {batchResult && (
                <div className="text-xs text-muted-foreground">
                  Processed: <span className="font-medium text-foreground">{batchResult.processed}</span> |
                  Total Commission: <span className="font-medium text-primary">₹{batchResult.totalCommission?.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyDashboard;