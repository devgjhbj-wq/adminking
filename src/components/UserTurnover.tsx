import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTurnoverStatus, clearTurnover, addTurnover, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Loading from '@/components/Loading';
import { RefreshCw, Plus, Trash2, ShieldAlert } from 'lucide-react';

const UserTurnover = ({ userId }: { userId: string | number }) => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearReason, setClearReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [addType, setAddType] = useState('ADMIN_BONUS');

  const loadData = async () => {
    if (!userId) return;
    setAuthToken(token);
    setLoading(true);
    try {
      const res = await fetchTurnoverStatus(userId);
      setData(res.data?.data || res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleClear = async () => {
    setAuthToken(token);
    setActionLoading(true);
    try {
      await clearTurnover(userId, clearReason);
      toast.success('User turnover cleared successfully');
      setClearDialogOpen(false);
      setClearReason('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to clear turnover');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addAmount || isNaN(Number(addAmount))) {
      toast.error('Invalid amount');
      return;
    }
    setAuthToken(token);
    setActionLoading(true);
    try {
      await addTurnover({
        userId,
        amount: Number(addAmount),
        type: addType,
        sourceRef: 'ADMIN'
      });
      toast.success('Turnover added successfully');
      setAddDialogOpen(false);
      setAddAmount('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to add turnover');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm border-l-4 border-l-blue-500 p-4 flex justify-center py-6">
        <Loading />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm border-l-4 border-l-blue-500 p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            Turnover Status
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Withdrawable only when requirement is 0
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={loadData} disabled={loading} className="h-7 text-[10px] rounded-[5px]" style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)} className="h-7 text-[10px] rounded-[5px]" style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}>
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
          <Button size="sm" onClick={() => setClearDialogOpen(true)} className="h-7 text-[10px] rounded-[5px]" style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}>
            <Trash2 className="w-3 h-3 mr-1" /> Clear
          </Button>
        </div>
      </div>

      <style>{`
        .el-table {
          font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
          font-size: 14px;
          line-height: 1.15;
          color: hsl(var(--foreground));
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .el-table tbody { font-size: 12px; }
        .el-table tbody tr { transition: background-color 0.25s ease; }
        .el-table tbody tr:hover { background-color: hsl(var(--accent) / 0.12); }
        .el-table .cell {
          box-sizing: border-box;
          padding: 0 5px;
          word-break: break-word;
          overflow-wrap: break-word;
          overflow: hidden;
        }
      `}</style>

      <div style={{ overflowX: 'auto' }}>
        <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
            <tr style={{ height: 40 }}>
              <th style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                <div className="cell">Requirement</div>
              </th>
              <th style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                <div className="cell">Completed</div>
              </th>
              <th style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                <div className="cell">Progress</div>
              </th>
              <th style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                <div className="cell">Status</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ height: 50 }}>
              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                <div className="cell text-sm font-bold">₹{data.turnover_requirement?.toFixed(2) || 0}</div>
              </td>
              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                <div className="cell text-sm font-bold">₹{data.total_turnover_completed?.toFixed(2) || 0}</div>
              </td>
              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                <div className="cell text-sm font-bold">{data.progress || 0}%</div>
              </td>
              <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                <div className="cell">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${data.canWithdraw ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {data.canWithdraw ? 'Can Withdraw' : 'Cannot Withdraw'}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {data.batches && data.batches.length > 0 && (
        <div className="border border-border rounded overflow-hidden">
          <div style={{ overflowX: 'auto' }}>
            <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
                <tr style={{ height: 40 }}>
                  {['Date', 'Type', 'Amount', 'Mult.', 'Required', 'Completed', 'Remaining'].map((label) => (
                    <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                      <div className="cell">{label}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.batches.map((batch: any, i: number) => (
                  <tr key={i} style={{ height: 40 }}>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell text-xs whitespace-nowrap">{new Date(batch.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell text-xs">{batch.type}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell text-xs">₹{batch.amount}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell text-xs">{batch.multiplier}x</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell text-xs">₹{batch.required}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell text-xs text-muted-foreground">₹{batch.completed}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell text-xs font-medium">₹{batch.remaining}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm text-red-500 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Clear Turnover
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Are you sure you want to completely clear the turnover requirement for this user? This will set their requirement to 0 and allow them to withdraw.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium">Reason (optional)</label>
              <Input
                value={clearReason}
                onChange={(e) => setClearReason(e.target.value)}
                placeholder="e.g., Customer service resolution"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setClearDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleClear} disabled={actionLoading}>
              {actionLoading && <Loading size={14} />}
              Confirm Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Add Turnover Requirement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Type</label>
              <select
                value={addType}
                onChange={(e) => setAddType(e.target.value)}
                className="w-full h-9 border border-input rounded-md bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ADMIN_BONUS">Admin Bonus</option>
                <option value="PROMOTION">Promotion</option>
                <option value="REFERRAL_BONUS">Referral Bonus</option>
                <option value="DEPOSIT">Deposit</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Base Amount (₹)</label>
              <Input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Enter base amount"
              />
              <p className="text-[10px] text-muted-foreground">The final requirement will depend on the multiplier for this type.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={actionLoading || !addAmount}>
              {actionLoading && <Loading size={14} />}
              Add Turnover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserTurnover;
