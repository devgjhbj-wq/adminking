import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAgencyConfigs, updateAgencyConfigLevel, seedAgencyConfigs,
  fetchAgentLevel, fetchAgentTeam, fetchTeamMembers, runMidnightBatch, setAuthToken
} from '@/lib/api';
import { toast } from 'sonner';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchInputWithHistory, addToHistory } from '@/components/SearchInputWithHistory';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchHeader } from '@/components/PageContainer';
import { Drawer } from '@/components/Drawer';
import { ChevronLeft, ChevronRight, Save, RefreshCw, Play, Plus, CalendarIcon, Search, Users } from 'lucide-react';
import { format } from 'date-fns';


const tabs = ['Level', 'Team', 'Config'] as const;
type Tab = typeof tabs[number];

const FormField = ({ label, value, sub }: { label: string; value: any; sub?: string }) => (
  <div>
    <label className="text-[11px] text-muted-foreground block mb-1">{label}</label>
    <div className="text-xs font-bold text-foreground">
      {value}
      {sub && <span className="text-[10px] text-muted-foreground ml-1.5">{sub}</span>}
    </div>
  </div>
);

const AgencyDashboard = () => {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('Level');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // ── Level tab ──
  const [levelUserId, setLevelUserId] = useState('');
  const [levelDate, setLevelDate] = useState<Date>();
  const [levelData, setLevelData] = useState<any>(null);
  const [levelLoading, setLevelLoading] = useState(false);

  const loadLevel = useCallback(async () => {
    const q = levelUserId.trim();
    if (!q) return;
    addToHistory(q);
    setAuthToken(token);
    setLevelLoading(true);
    try {
      const res = await fetchAgentLevel(q, levelDate ? format(levelDate, 'yyyy-MM-dd') : undefined);
      setLevelData(res.data);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load agent level');
    } finally {
      setLevelLoading(false);
    }
  }, [token, levelUserId, levelDate]);

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
    addToHistory(q);
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

  // ── Team Members drawer ──
  const [tmOpen, setTmOpen] = useState(false);
  const [tmTier, setTmTier] = useState('');
  const [tmUserId, setTmUserId] = useState('');
  const [tmFromDate, setTmFromDate] = useState<Date>();
  const [tmToDate, setTmToDate] = useState<Date>();
  const [tmData, setTmData] = useState<any>(null);
  const [tmLoading, setTmLoading] = useState(false);
  const [tmPage, setTmPage] = useState(1);
  const tmTotalPages = tmData?.total ? Math.ceil(tmData.total / (tmData.limit || 25)) : 0;

  const loadTeamMembers = useCallback(async (p = 1) => {
    setAuthToken(token);
    setTmLoading(true);
    try {
      const q = teamAgentId.trim();
      if (!q) { toast.error('Enter Agent ID first'); setTmLoading(false); return; }
      const res = await fetchTeamMembers(q, {
        tier: tmTier ? Number(tmTier) : undefined,
        userId: tmUserId.trim() || undefined,
        fromDate: tmFromDate ? format(tmFromDate, 'yyyy-MM-dd') : undefined,
        toDate: tmToDate ? format(tmToDate, 'yyyy-MM-dd') : undefined,
        page: p, limit: 25,
      });
      setTmData(res.data);
      setTmPage(p);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load team members');
    } finally {
      setTmLoading(false);
    }
  }, [token, teamAgentId, tmTier, tmUserId, tmFromDate, tmToDate]);

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
      <div className="grid grid-cols-2 border border-border rounded overflow-hidden divide-x divide-y divide-border">
        <div className="p-2 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10"><FormField label="Deposit Count" value={agg.depositCount ?? 0} /></div>
        <div className="p-2 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5"><FormField label="Deposit Amt" value={`₹${(agg.depositAmount ?? 0).toLocaleString()}`} /></div>
        <div className="p-2 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10"><FormField label="Bettor Count" value={agg.bettorCount ?? 0} /></div>
        <div className="p-2 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5"><FormField label="Bet Amount" value={`₹${(agg.betAmount ?? 0).toLocaleString()}`} /></div>
        <div className="p-2 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10"><FormField label="1st Deposit Count" value={agg.firstDepositCount ?? 0} /></div>
        <div className="p-2 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5"><FormField label="1st Deposit Amt" value={`₹${(agg.firstDepositAmount ?? 0).toLocaleString()}`} /></div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Tab Bar */}
      <div className="flex items-center gap-0 bg-card border border-border rounded-lg px-1.5 h-[34px]">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 text-xs font-medium rounded-pill transition-all h-[26px] ${
              tab === t
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Level Tab ── */}
      {tab === 'Level' && (
        <div className="space-y-4">
          <SearchHeader>
            <label className="text-xs font-medium text-foreground whitespace-nowrap mr-[3px]">Agent ID</label>
            <SearchInputWithHistory
              value={levelUserId}
              onChange={setLevelUserId}
              placeholder="Enter Agent User ID"
              className="w-[180px] h-[26px] text-xs px-1.5"
            />
            <label className="text-xs font-medium text-foreground whitespace-nowrap mr-[3px] ml-[3px]">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[130px] justify-start text-left font-normal text-xs h-[26px] px-2">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {levelDate ? format(levelDate, "MMM dd, yyyy") : "Today"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={levelDate} onSelect={setLevelDate} initialFocus captionLayout="dropdown-buttons" fromYear={2024} toYear={2026} />
              </PopoverContent>
            </Popover>
            <Button
              onClick={loadLevel}
              disabled={levelLoading || !levelUserId.trim()}
              size="sm"
              className="h-[26px] px-2.5 text-xs bg-primary text-primary-foreground"
            >
              {levelLoading ? <Loading size={10} /> : <Search className="w-3.5 h-3.5" />}
              Search
            </Button>
            <LastUpdated timestamp={updatedAt} onRefresh={loadLevel} loading={levelLoading} compact />
          </SearchHeader>

          {levelData && levelData.rebate_level !== undefined && (
            <div className="space-y-4">
              {/* Header: Rebate Level + Date + Commission */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-card border border-border p-4 rounded-lg space-y-3">
                  <label className="text-[11px] font-semibold text-foreground">Rebate Level</label>
                  <div className="grid grid-cols-2 border border-border rounded overflow-hidden divide-x divide-y divide-border">
                    <div className="p-2 bg-gradient-to-br from-blue-500/5 to-blue-500/10"><FormField label="Current Level" value={levelData.rebate_level} /></div>
                    {levelData.date && <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-500/5"><FormField label="Date" value={new Date(levelData.date).toLocaleDateString()} /></div>}
                  </div>
                </div>
                {levelData.commission && (
                  <div className="bg-card border border-border p-4 rounded-lg space-y-3">
                    <label className="text-[11px] font-semibold text-foreground">Commission</label>
                    <div className="grid grid-cols-2 border border-border rounded overflow-hidden divide-x divide-y divide-border">
                      <div className="p-2 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10"><FormField label="This Week" value={`₹${(levelData.commission.thisWeek ?? 0).toLocaleString()}`} /></div>
                      <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"><FormField label="Total" value={`₹${(levelData.commission.total ?? 0).toLocaleString()}`} /></div>
                      <div className="p-2 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10"><FormField label="Today" value={`₹${(levelData.commission.today ?? 0).toLocaleString()}`} /></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {['level1', 'level2', 'level3', 'total'].map((key) => {
                  const s = levelData[key];
                  if (!s) return null;
                  return (
                    <div key={key} className="bg-card border border-border p-4 rounded-lg space-y-3">
                      <label className="text-[11px] font-semibold text-foreground capitalize">{key.replace('level', 'Level ')}</label>
                      <div className="grid grid-cols-2 border border-border rounded overflow-hidden divide-x divide-y divide-border">
                        <div className="p-2 bg-gradient-to-br from-violet-500/5 to-violet-500/10"><FormField label="Members" value={s.members ?? 0} /></div>
                        <div className="p-2 bg-gradient-to-br from-violet-500/10 to-violet-500/5"><FormField label="Today Members" value={s.todayMembers ?? 0} /></div>
                        <div className="p-2 bg-gradient-to-br from-violet-500/5 to-violet-500/10"><FormField label="Total Bets" value={`₹${(s.totalBets ?? 0).toLocaleString()}`} /></div>
                        <div className="p-2 bg-gradient-to-br from-violet-500/10 to-violet-500/5"><FormField label="Today Bets" value={`₹${(s.todayBets ?? 0).toLocaleString()}`} /></div>
                        <div className="p-2 bg-gradient-to-br from-violet-500/5 to-violet-500/10"><FormField label="Total Deposit" value={`₹${(s.totalDeposit ?? 0).toLocaleString()}`} /></div>
                        <div className="p-2 bg-gradient-to-br from-violet-500/10 to-violet-500/5"><FormField label="Today Deposit" value={`₹${(s.todayDeposit ?? 0).toLocaleString()}`} /></div>
                        <div className="p-2 bg-gradient-to-br from-violet-500/5 to-violet-500/10"><FormField label="Total Withdrawal" value={`₹${(s.totalWithdrawal ?? 0).toLocaleString()}`} /></div>
                        <div className="p-2 bg-gradient-to-br from-violet-500/10 to-violet-500/5"><FormField label="Today Withdrawal" value={`₹${(s.todayWithdrawal ?? 0).toLocaleString()}`} /></div>
                        <div className="p-2 bg-gradient-to-br from-violet-500/5 to-violet-500/10"><FormField label="Today Deposit Count" value={s.depositCount ?? 0} /></div>
                        <div className="p-2 bg-gradient-to-br from-violet-500/10 to-violet-500/5"><FormField label="Today 1st Deposit" value={s.firstDepositCount ?? 0} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Team Tab ── */}
      {tab === 'Team' && (
        <div className="space-y-4">
          <SearchHeader>
            <label className="text-xs font-medium text-foreground whitespace-nowrap mr-[3px]">Agent ID</label>
            <SearchInputWithHistory
              value={teamAgentId}
              onChange={setTeamAgentId}
              placeholder="Agent ID"
              className="w-[120px] h-[26px] text-xs px-1.5"
            />
            <label className="text-xs font-medium text-foreground whitespace-nowrap mr-[3px] ml-[3px]">To</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[130px] justify-start text-left font-normal text-xs h-[26px] px-2">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {teamToDate ? format(teamToDate, "MMM dd, yyyy") : "Select"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={teamToDate} onSelect={setTeamToDate} initialFocus captionLayout="dropdown-buttons" fromYear={2024} toYear={2026} />
              </PopoverContent>
            </Popover>
            <label className="text-xs font-medium text-foreground whitespace-nowrap mr-[3px] ml-[3px]">From</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[130px] justify-start text-left font-normal text-xs h-[26px] px-2">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {teamFromDate ? format(teamFromDate, "MMM dd, yyyy") : "Select"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={teamFromDate} onSelect={setTeamFromDate} initialFocus captionLayout="dropdown-buttons" fromYear={2024} toYear={2026} />
              </PopoverContent>
            </Popover>
            <label className="text-xs font-medium text-foreground whitespace-nowrap mr-[3px] ml-[3px]">Tier</label>
            <select value={teamTier} onChange={(e) => setTeamTier(e.target.value)} className="w-[80px] h-[26px] rounded border border-input bg-background px-2 text-xs">
              <option value="">All</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
            <Button
              onClick={() => loadTeam(1)}
              disabled={teamLoading}
              size="sm"
              className="h-[26px] px-2.5 text-xs bg-primary text-primary-foreground"
            >
              {teamLoading ? <Loading size={10} /> : <Search className="w-3.5 h-3.5" />}
              Search
            </Button>
          </SearchHeader>

          {teamData?.agent && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border p-4 rounded-lg space-y-3">
                <label className="text-[11px] font-semibold text-foreground">Agent Info</label>
                <div className="grid grid-cols-2 border border-border rounded overflow-hidden divide-x divide-y divide-border">
                  <div className="p-2 bg-gradient-to-br from-blue-500/5 to-blue-500/10"><FormField label="User ID" value={teamData.agent.userId} /></div>
                  <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-500/5"><FormField label="Mobile" value={teamData.agent.mobile} /></div>
                  <div className="p-2 bg-gradient-to-br from-blue-500/5 to-blue-500/10"><FormField label="Admin" value={teamData.agent.admin ? 'Yes' : 'No'} /></div>
                  <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-500/5"><FormField label="Referred By" value={teamData.agent.referredBy} /></div>
                  <div className="p-2 bg-gradient-to-br from-blue-500/5 to-blue-500/10"><FormField label="Created" value={new Date(teamData.agent.createdAt).toLocaleString()} /></div>
                </div>
              </div>
              <div className="bg-card border border-border p-4 rounded-lg space-y-3">
                <label className="text-[11px] font-semibold text-foreground">Inviter</label>
                {teamData.inviter ? (
                  <div className="grid grid-cols-2 border border-border rounded overflow-hidden divide-x divide-y divide-border">
                    <div className="p-2 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10"><FormField label="User ID" value={teamData.inviter.userId} /></div>
                    <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"><FormField label="Mobile" value={teamData.inviter.mobile} /></div>
                    <div className="p-2 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10"><FormField label="Created" value={new Date(teamData.inviter.createdAt).toLocaleString()} /></div>
                  </div>
                ) : <p className="text-xs text-muted-foreground">No inviter</p>}
              </div>
            </div>
          )}

          {teamData?.aggregation && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-foreground">Aggregation</label>
                  <Button
                    size="sm"
                    onClick={() => { setTmOpen(true); setTmData(null); setTmPage(1); }}
                    className="h-[26px] px-2.5 text-xs bg-primary text-primary-foreground"
                  >
                    <Users className="w-3.5 h-3.5 mr-1" /> Team Members
                  </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {['level1', 'level2', 'level3', 'total'].map((key) => {
                  const agg = teamData.aggregation[key];
                  return agg ? (
                    <div key={key} className="bg-card border border-border p-4 rounded-lg space-y-3">
                      <label className="text-[11px] font-semibold text-foreground capitalize">{key.replace('level', 'Level ')}</label>
                      {renderAggregation(agg)}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Team Members Drawer ── */}
      <Drawer open={tmOpen} onClose={() => setTmOpen(false)} title="Team Members" width="700px">
        <div className="h-full flex flex-col">
          <div className="sticky top-0 z-10 bg-card pb-3 space-y-3 border-b border-border mb-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Tier</label>
                <select value={tmTier} onChange={(e) => setTmTier(e.target.value)} className="w-full h-[30px] rounded border border-input bg-background px-2 text-xs">
                  <option value="">All</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">User ID</label>
                <Input value={tmUserId} onChange={(e) => setTmUserId(e.target.value)} placeholder="Search by userId" className="h-[30px] text-xs" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal text-xs h-[30px] px-2">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {tmFromDate ? format(tmFromDate, "MMM dd, yyyy") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={tmFromDate} onSelect={setTmFromDate} initialFocus captionLayout="dropdown-buttons" fromYear={2024} toYear={2026} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal text-xs h-[30px] px-2">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {tmToDate ? format(tmToDate, "MMM dd, yyyy") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={tmToDate} onSelect={setTmToDate} initialFocus captionLayout="dropdown-buttons" fromYear={2024} toYear={2026} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button onClick={() => loadTeamMembers(1)} disabled={tmLoading} size="sm" className="w-full h-[30px] text-xs bg-primary text-primary-foreground">
              {tmLoading ? <Loading size={10} className="mr-1" /> : <Search className="w-3.5 h-3.5 mr-1" />}
              Search
            </Button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {tmData?.items && (
              <div className="space-y-2">
                <div className="relative rounded" style={{ border: '1px solid hsl(var(--border))' }}>
                  <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 650 }}>
                    <colgroup>
                      <col style={{ width: 80 }} />
                      <col />
                      <col />
                      <col />
                      <col />
                      <col />
                    </colgroup>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
                      <tr style={{ height: 40 }}>
                        {['User ID', 'Mobile', 'Tier', 'Total Deposit', 'Total Withdrawal', 'Total Bet'].map((label) => (
                          <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '6px 4px', fontWeight: 400, fontSize: 13 }}>
                            <div className="cell">{label}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tmData.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 30, color: 'hsl(var(--muted-foreground))' }}>
                            <span className="text-xs">No Data</span>
                          </td>
                        </tr>
                      ) : (
                        tmData.items.map((item: any, i: number) => (
                          <tr key={i} style={{ height: 44 }}>
                            <td style={{ border: '1px solid hsl(var(--border))', padding: '4px', textAlign: 'center' }}><div className="cell text-xs">{item.userId}</div></td>
                            <td style={{ border: '1px solid hsl(var(--border))', padding: '4px', textAlign: 'center' }}><div className="cell text-xs">{item.mobile}</div></td>
                            <td style={{ border: '1px solid hsl(var(--border))', padding: '4px', textAlign: 'center' }}><div className="cell"><span className="px-1.5 py-0.5 text-[10px] font-medium rounded-pill bg-secondary text-foreground">L{item.tier}</span></div></td>
                            <td style={{ border: '1px solid hsl(var(--border))', padding: '4px', textAlign: 'center' }}><div className="cell text-xs">₹{(item.totalDeposit ?? 0).toLocaleString()}</div></td>
                            <td style={{ border: '1px solid hsl(var(--border))', padding: '4px', textAlign: 'center' }}><div className="cell text-xs">₹{(item.totalWithdrawal ?? 0).toLocaleString()}</div></td>
                            <td style={{ border: '1px solid hsl(var(--border))', padding: '4px', textAlign: 'center' }}><div className="cell text-xs">₹{(item.totalBet ?? 0).toLocaleString()}</div></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {tmTotalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total: {tmData.total} — Page {tmPage}/{tmTotalPages}</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" disabled={tmPage <= 1} onClick={() => loadTeamMembers(tmPage - 1)}><ChevronLeft className="w-3.5 h-3.5" /></Button>
                      <Button variant="outline" size="sm" disabled={tmPage >= tmTotalPages} onClick={() => loadTeamMembers(tmPage + 1)}><ChevronRight className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* ── Config Tab ── */}
      {tab === 'Config' && (
        <div className="space-y-2">
          <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-tight text-foreground">Level Configurations</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadConfigs} disabled={configLoading} className="h-7 text-xs"><RefreshCw className={`w-3 h-3 mr-1 ${configLoading ? 'animate-spin' : ''}`} />Refresh</Button>
              <Button variant="outline" size="sm" onClick={handleSeed} className="h-7 text-xs"><Plus className="w-3 h-3 mr-1" />Seed Defaults</Button>
            </div>
          </div>

          {configLoading ? (
            <div className="flex justify-center py-8"><Loading size={20} /></div>
          ) : (
            <div className="relative rounded" style={{ height: 445, border: '1px solid hsl(var(--border))' }}>
              <div style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
                <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 1100 }}>
                  <colgroup>
                    <col style={{ width: 80 }} />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col />
                    <col style={{ width: 120 }} />
                  </colgroup>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
                    <tr style={{ height: 50 }}>
                      {['Level', 'Min Members', 'Min Bets (₹)', 'Min Deposit (₹)', 'L1 Rate', 'L2 Rate', 'L3 Rate', 'Action'].map((label) => (
                        <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                          <div className="cell">{label}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {configs.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 50, color: 'hsl(var(--muted-foreground))' }}>
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                            <span>No Data</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      configs.map((cfg) => (
                        <tr key={cfg.level} style={{ height: 50 }}>
                          {editingLevel === cfg.level ? (
                            <>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell">{cfg.level}</div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell"><Input type="number" className="h-6 w-20 text-[10px]" value={editForm.minMembers} onChange={(e) => setEditForm({ ...editForm, minMembers: Number(e.target.value) })} /></div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell"><Input type="number" className="h-6 w-24 text-[10px]" value={editForm.minBets} onChange={(e) => setEditForm({ ...editForm, minBets: Number(e.target.value) })} /></div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell"><Input type="number" className="h-6 w-24 text-[10px]" value={editForm.minDeposit} onChange={(e) => setEditForm({ ...editForm, minDeposit: Number(e.target.value) })} /></div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell"><Input type="number" step="0.0001" className="h-6 w-20 text-[10px]" value={editForm.l1Rate} onChange={(e) => setEditForm({ ...editForm, l1Rate: Number(e.target.value) })} /></div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell"><Input type="number" step="0.0001" className="h-6 w-20 text-[10px]" value={editForm.l2Rate} onChange={(e) => setEditForm({ ...editForm, l2Rate: Number(e.target.value) })} /></div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell"><Input type="number" step="0.0001" className="h-6 w-20 text-[10px]" value={editForm.l3Rate} onChange={(e) => setEditForm({ ...editForm, l3Rate: Number(e.target.value) })} /></div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                <div className="cell">
                                  <div className="flex gap-1 justify-center">
                                    <Button size="sm" variant="default" className="h-6 text-[10px] px-2" onClick={handleSaveConfig} disabled={configSaving}>{configSaving ? <Loading size={10} /> : <Save className="w-3 h-3" />}</Button>
                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditingLevel(null)}>Cancel</Button>
                                  </div>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell">{cfg.level}</div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell">{cfg.minMembers}</div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell">₹{cfg.minBets?.toLocaleString()}</div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell">₹{cfg.minDeposit?.toLocaleString()}</div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell">{(cfg.l1Rate * 100).toFixed(2)}%</div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell">{(cfg.l2Rate * 100).toFixed(2)}%</div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}><div className="cell">{(cfg.l3Rate * 100).toFixed(2)}%</div></td>
                              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                <div className="cell">
                                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => startEdit(cfg)}>Edit</Button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Admin: Run Midnight Batch */}
          <div className="bg-card border border-border p-3 rounded-lg space-y-2">
            <h3 className="text-xs font-semibold tracking-tight text-foreground">Admin Actions</h3>
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