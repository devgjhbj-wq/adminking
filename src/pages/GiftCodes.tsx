import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchGiftCodes, 
  createGiftCode, 
  toggleGiftCode, 
  deleteGiftCode, 
  fetchGiftCodeRedemptions,
  setAuthToken,
  GiftCodeCreateData
} from '@/lib/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import LastUpdated from '@/components/LastUpdated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Gift, 
  Plus, 
  Search, 
  Trash2, 
  Power, 
  PowerOff, 
  Users, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info,
  Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface GiftCode {
  _id: string;
  code: string;
  rewardAmount: number;
  turnoverMultiplier: number;
  maxRedemptions: number;
  usedCount: number;
  expiryDate: string;
  minDepositToday: number;
  isActive: boolean;
  description: string;
  createdAt?: string;
}

interface Redemption {
  _id: string;
  code: string;
  userId: number;
  rewardAmount: number;
  turnoverAdded: number;
  createdAt: string;
}

const GiftCodes = () => {
  const { token } = useAuth();
  
  // List state
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  
  // Create state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [formData, setFormData] = useState<GiftCodeCreateData>({
    code: '',
    rewardAmount: 0,
    turnoverMultiplier: 1,
    maxRedemptions: 100,
    expiryDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    minDepositToday: 0,
    isActive: true,
    description: '',
    codeLength: 12
  });
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  // Redemptions state
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionPage, setRedemptionPage] = useState(1);
  const [redemptionTotal, setRedemptionTotal] = useState(0);
  const [redemptionLoading, setRedemptionLoading] = useState(false);
  const [isRedemptionsOpen, setIsRedemptionsOpen] = useState(false);

  const loadCodes = useCallback(async (p = 1) => {
    setLoading(true);
    setAuthToken(token);
    try {
      const params: any = { page: p, limit };
      if (search) params.search = search;
      if (isActiveFilter !== 'all') params.isActive = isActiveFilter === 'active';
      
      const res = await fetchGiftCodes(params);
      setCodes(res.data.items);
      setTotal(res.data.total);
      setPage(p);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to fetch gift codes');
    } finally {
      setLoading(false);
    }
  }, [token, search, isActiveFilter, limit]);

  useEffect(() => {
    loadCodes(1);
  }, [loadCodes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setAuthToken(token);
    try {
      const data = { ...formData };
      if (expiryDate) data.expiryDate = expiryDate.toISOString();
      
      if (isEditMode && editingCode) {
        // Only include non-code fields for update
        const { code, codeLength, isActive, ...updateData } = data;
        await updateGiftCode(editingCode, updateData);
        toast.success('Gift code updated successfully');
      } else {
        if (!data.code) delete data.code;
        await createGiftCode(data);
        toast.success('Gift code created successfully');
      }
      
      setIsCreateOpen(false);
      loadCodes(page);
      // Reset form
      setFormData({
        code: '',
        rewardAmount: 0,
        turnoverMultiplier: 1,
        maxRedemptions: 100,
        expiryDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        minDepositToday: 0,
        isActive: true,
        description: '',
        codeLength: 12
      });
      setIsEditMode(false);
      setEditingCode(null);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || `Failed to ${isEditMode ? 'update' : 'create'} gift code`);
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (code: GiftCode) => {
    setFormData({
      code: code.code,
      rewardAmount: code.rewardAmount,
      turnoverMultiplier: code.turnoverMultiplier,
      maxRedemptions: code.maxRedemptions,
      expiryDate: code.expiryDate,
      minDepositToday: code.minDepositToday,
      isActive: code.isActive,
      description: code.description,
      codeLength: 12
    });
    setExpiryDate(new Date(code.expiryDate));
    setIsEditMode(true);
    setEditingCode(code.code);
    setIsCreateOpen(true);
  };

  const handleToggle = async (code: string, currentStatus: boolean) => {
    setAuthToken(token);
    try {
      await toggleGiftCode(code, !currentStatus);
      toast.success(`Gift code ${!currentStatus ? 'enabled' : 'disabled'}`);
      setCodes(codes.map(c => c.code === code ? { ...c, isActive: !currentStatus } : c));
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to toggle status');
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to delete gift code ${code}? This will also delete all redemption records.`)) return;
    setAuthToken(token);
    try {
      await deleteGiftCode(code);
      toast.success('Gift code deleted');
      loadCodes(page);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to delete gift code');
    }
  };

  const loadRedemptions = async (code: string, p = 1) => {
    setRedemptionLoading(true);
    setAuthToken(token);
    try {
      const res = await fetchGiftCodeRedemptions(code, p, 10);
      setRedemptions(res.data.items);
      setRedemptionTotal(res.data.total);
      setRedemptionPage(p);
      setSelectedCode(code);
      setIsRedemptionsOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to fetch redemptions');
    } finally {
      setRedemptionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const redemptionTotalPages = Math.ceil(redemptionTotal / 10);

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card border border-border p-3 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search code..."
              className="pl-9 h-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadCodes(1)}
            />
          </div>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button size="sm" onClick={() => loadCodes(1)} disabled={loading} className="h-9 px-4">
            {loading ? <Loading size={14} /> : 'Search'}
          </Button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <LastUpdated timestamp={updatedAt} onRefresh={() => loadCodes(page)} loading={loading} compact />
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setIsEditMode(false);
              setEditingCode(null);
              setFormData({
                code: '',
                rewardAmount: 0,
                turnoverMultiplier: 1,
                maxRedemptions: 100,
                expiryDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
                minDepositToday: 0,
                isActive: true,
                description: '',
                codeLength: 12
              });
              setExpiryDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 font-bold">
                <Plus className="w-4 h-4" />
                Create Gift Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Edit Gift Code' : 'Create New Gift Code'}</DialogTitle>
                <DialogDescription>
                  {isEditMode ? 'Update gift code settings. Code itself cannot be changed.' : 'Create a reward code for users. Leave code empty to auto-generate.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Custom Code (Optional)</label>
                    <Input 
                      placeholder="e.g. WELCOME100" 
                      className="text-xs uppercase"
                      disabled={isEditMode}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Auto Length</label>
                    <Input 
                      type="number"
                      placeholder="12" 
                      className="text-xs"
                      disabled={!!formData.code || isEditMode}
                      value={formData.codeLength}
                      onChange={(e) => setFormData({ ...formData, codeLength: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Reward Amount (₹)</label>
                    <Input 
                      type="number"
                      required
                      className="text-xs font-bold"
                      value={formData.rewardAmount}
                      onChange={(e) => setFormData({ ...formData, rewardAmount: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Turnover Mult.</label>
                    <Input 
                      type="number"
                      step="0.1"
                      className="text-xs"
                      value={formData.turnoverMultiplier}
                      onChange={(e) => setFormData({ ...formData, turnoverMultiplier: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Max Redemptions</label>
                    <Input 
                      type="number"
                      required
                      className="text-xs"
                      value={formData.maxRedemptions}
                      onChange={(e) => setFormData({ ...formData, maxRedemptions: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Min Deposit Today</label>
                    <Input 
                      type="number"
                      className="text-xs"
                      value={formData.minDepositToday}
                      onChange={(e) => setFormData({ ...formData, minDepositToday: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Expiry Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-9 text-xs",
                          !expiryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expiryDate}
                        onSelect={setExpiryDate}
                        initialFocus
                        fromYear={2026}
                        toYear={2030}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Description (Admin Reference)</label>
                  <Input 
                    placeholder="e.g. New User Bonus" 
                    className="text-xs"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={createLoading}>
                    {createLoading ? <Loading size={14} className="mr-2" /> : isEditMode ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {isEditMode ? 'Update Code' : 'Create Code'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Codes Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30">
              <TableHead className="text-[10px] font-bold uppercase py-2">Code</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-2">Reward</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-2">Usage</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-2">Turnover</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-2">Requirements</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-2">Expiry</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-2">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-2 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && codes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center"><Loading /></TableCell>
              </TableRow>
            ) : codes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center text-muted-foreground text-xs">No gift codes found.</TableCell>
              </TableRow>
            ) : (
              codes.map((code) => (
                <TableRow key={code._id} className="hover:bg-secondary/10">
                  <TableCell className="font-mono font-bold text-primary py-3">
                    {code.code}
                    {code.description && (
                      <p className="text-[10px] text-muted-foreground font-normal mt-0.5">{code.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="font-black">₹{code.rewardAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] w-24">
                        <span>{code.usedCount} / {code.maxRedemptions}</span>
                        <span>{Math.round((code.usedCount / code.maxRedemptions) * 100)}%</span>
                      </div>
                      <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all",
                            (code.usedCount / code.maxRedemptions) > 0.9 ? "bg-red-500" : "bg-primary"
                          )}
                          style={{ width: `${Math.min(100, (code.usedCount / code.maxRedemptions) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[11px]">
                    <span className="text-muted-foreground">x</span>{code.turnoverMultiplier}
                    <p className="text-[10px] text-muted-foreground font-medium">Req: ₹{(code.rewardAmount * code.turnoverMultiplier).toLocaleString()}</p>
                  </TableCell>
                  <TableCell className="text-[11px]">
                    {code.minDepositToday > 0 ? (
                      <span className="bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        Dep: ₹{code.minDepositToday}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[11px]">
                    <div className={cn(
                      "flex items-center gap-1",
                      new Date(code.expiryDate) < new Date() ? "text-red-500 font-bold" : "text-foreground"
                    )}>
                      <CalendarIcon className="w-3 h-3" />
                      {format(new Date(code.expiryDate), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      code.isActive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {code.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Edit Code"
                        onClick={() => openEdit(code)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="View Redemptions"
                        onClick={() => loadRedemptions(code.code, 1)}
                      >
                        <Users className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-7 w-7 p-0", code.isActive ? "text-red-500" : "text-green-500")}
                        title={code.isActive ? "Disable" : "Enable"}
                        onClick={() => handleToggle(code.code, code.isActive)}
                      >
                        {code.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                        title="Delete"
                        onClick={() => handleDelete(code.code)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between bg-secondary/10">
            <span className="text-[11px] text-muted-foreground">Total {total} codes</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page <= 1 || loading}
                onClick={() => loadCodes(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 px-2">
                <span className="text-[11px] font-bold">{page}</span>
                <span className="text-[11px] text-muted-foreground">/</span>
                <span className="text-[11px] text-muted-foreground">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page >= totalPages || loading}
                onClick={() => loadCodes(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Redemptions Dialog */}
      <Dialog open={isRedemptionsOpen} onOpenChange={setIsRedemptionsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Redemptions for <span className="text-primary font-mono">{selectedCode}</span>
            </DialogTitle>
            <DialogDescription>
              List of users who have used this gift code.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto px-6 py-2">
            {redemptionLoading ? (
              <div className="h-48 flex items-center justify-center"><Loading /></div>
            ) : redemptions.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                <Info className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No redemptions yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] uppercase h-8">User ID</TableHead>
                    <TableHead className="text-[10px] uppercase h-8">Reward</TableHead>
                    <TableHead className="text-[10px] uppercase h-8">Turnover Added</TableHead>
                    <TableHead className="text-[10px] uppercase h-8">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptions.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-bold py-2">{r.userId}</TableCell>
                      <TableCell className="font-black py-2">₹{r.rewardAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground py-2">₹{r.turnoverAdded.toLocaleString()}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground py-2">
                        {format(new Date(r.createdAt), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {redemptionTotalPages > 1 && (
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={redemptionPage <= 1 || redemptionLoading}
                onClick={() => loadRedemptions(selectedCode!, redemptionPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={redemptionPage >= redemptionTotalPages || redemptionLoading}
                onClick={() => loadRedemptions(selectedCode!, redemptionPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="p-4 bg-secondary/10 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsRedemptionsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GiftCodes;
