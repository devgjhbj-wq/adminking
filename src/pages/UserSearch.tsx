import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { searchUser, updateUserStatus, updateUserPayment, fetchUserPaymentMethods, updateUserPaymentMethodById, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';
import UserTurnover from '@/components/UserTurnover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Banknote, Search, ShieldAlert, Globe, Smartphone, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchHeader } from '@/components/PageContainer';

const SectionCard = ({ title, icon: TitleIcon, accentBorder, children }: {
  title: string;
  icon: any;
  accentBorder: string;
  children: React.ReactNode;
}) => (
  <div className={cn("bg-card border border-border rounded-lg shadow-sm overflow-hidden", accentBorder)}>
    <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TitleIcon className="w-4 h-4" />
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h3>
      </div>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

const StatRow = ({ label, value }: { label: string; value: any }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-b-0">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className="text-xs font-bold text-foreground">{value}</span>
  </div>
);

const UserSearch = () => {
  const { token } = useAuth();
  const [userId, setUserId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'inactive'>('active');
  const [statusRemark, setStatusRemark] = useState('');

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<'BANK' | 'UPI' | 'UPAY'>('BANK');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [upiId, setUpiId] = useState('');
  const [rplId, setRplId] = useState('');
  const handleSearch = async () => {
    if (!userId.trim()) return;
    setAuthToken(token);
    setLoading(true);
    setResult(null);
    try {
      const res = await searchUser(userId.trim());
      setResult(res.data);
      setUpdatedAt(new Date());
      setBankName('');
      setBankCode('');
      setAccountNumber('');
      setAccountHolder('');
      setUpiId('');
      setRplId('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.msg || err.response?.data?.message || 'User not found';
      toast.error(errorMsg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!user?.userId) return;
    if ((newStatus === 'suspended' || newStatus === 'inactive') && !statusRemark.trim()) {
      toast.error('Remark is required when banning or suspending');
      return;
    }
    setAuthToken(token);
    setStatusLoading(true);
    try {
      const res = await updateUserStatus(user.userId, newStatus, statusRemark);
      toast.success(res.data.msg || 'Status updated');
      setStatusDialogOpen(false);
      setStatusRemark('');
      handleSearch();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePaymentUpdate = async () => {
    if (!user?.userId) return;
    setAuthToken(token);
    setPaymentLoading(true);
    try {
      const data: Record<string, any> = { accountHolder };
      if (paymentType === 'BANK') {
        data.bankName = bankName;
        data.ifsc = bankCode;
        data.accountNo = accountNumber;
      } else if (paymentType === 'UPI') {
        data.upiId = upiId;
      } else if (paymentType === 'UPAY') {
        data.rplId = rplId;
      }
      const res = await updateUserPayment(user.userId, paymentType, data);
      toast.success(res.data.msg || 'Payment details updated');
      setPaymentDialogOpen(false);
      handleSearch();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSearchSameIp = async () => {
    toast.error('IP address not available from user search');
  };

  const { user, account, paymentMethods } = result || {};

  return (
    <div className="space-y-4">
      <SearchHeader>
        <label className="text-xs font-medium text-foreground whitespace-nowrap mr-[3px]">User ID</label>
        <Input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID"
          className="w-[180px] h-[26px] text-xs px-1.5"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          onClick={handleSearch}
          disabled={loading || !userId.trim()}
          size="sm"
          className="h-[26px] px-2.5 text-xs rounded-[5px] gap-1"
          style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}
        >
          <Search className="w-3.5 h-3.5" />
          Go
        </Button>
        <LastUpdated timestamp={updatedAt} onRefresh={handleSearch} loading={loading} compact />
      </SearchHeader>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* User Profile */}
          {user && (
            <SectionCard title="User Profile" icon={Users} accentBorder="border-r-[3px] border-r-[rgb(32,143,255)]">
              <StatRow label="User ID" value={user.userId} />
              <StatRow label="Mobile" value={user.mobile} />
              <StatRow label="Admin" value={user.admin ? 'Yes' : 'No'} />
              <StatRow label="Created" value={new Date(user.createdAt).toLocaleString()} />
              <StatRow label="Updated" value={new Date(user.updatedAt).toLocaleString()} />
            </SectionCard>
          )}

          {/* Account */}
          {account && (
            <SectionCard
              title="Account"
              icon={Banknote}
              accentBorder="border-r-[3px] border-r-emerald-500"
            >
              <div className="flex items-center justify-end gap-2 mb-2">
                <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => setStatusDialogOpen(true)}>
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  Change Status
                </Button>
              </div>
              <StatRow label="Balance" value={`₹${(account.balance ?? 0).toLocaleString()}`} />
              <StatRow label="Withdrawable" value={`₹${(account.withdrawable ?? 0).toLocaleString()}`} />
              <StatRow label="Total Deposits" value={`₹${(account.totalDeposits ?? 0).toLocaleString()}`} />
              <StatRow label="Total Withdrawals" value={`₹${(account.totalWithdrawals ?? 0).toLocaleString()}`} />
              <StatRow
                label="Status"
                value={
                  <span className={cn("px-1.5 py-0.5 text-[10px] font-semibold rounded",
                    account.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                    account.status === 'suspended' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-rose-500/15 text-rose-400'
                  )}>
                    {account.status}
                  </span>
                }
              />
              {account.statusRemark && <StatRow label="Status Remark" value={account.statusRemark} />}
              <StatRow label="VIP Level" value={account.vipLevel || '—'} />
              <StatRow label="Withdraw Daily Limit" value={`₹${(account.withdrawDailyLimit ?? 0).toLocaleString()}`} />
              <StatRow label="Turnover Requirement" value={`₹${(account.turnover_requirement ?? 0).toLocaleString()}`} />
              <StatRow label="Turnover Completed" value={`₹${(account.total_turnover_completed ?? 0).toLocaleString()}`} />
              <StatRow label="Currency" value={account.currency || 'INR'} />
              <StatRow label="Game Member" value={account.gameMemberCreated ? 'Created' : 'Not Created'} />
              <StatRow label="First Deposit Bonus" value={account.firstDepositBonusGiven ? 'Given' : 'Not Given'} />
              <StatRow label="Created" value={account.createdAt ? new Date(account.createdAt).toLocaleString() : '—'} />
              <StatRow label="Updated" value={account.updatedAt ? new Date(account.updatedAt).toLocaleString() : '—'} />
            </SectionCard>
          )}
        </div>
      )}

      {/* Same IP Users */}
      {result?.sameIpUsers !== undefined && result?.sameIpUsers > 0 && (
        <SectionCard title="Same IP Users" icon={Globe} accentBorder="border-r-[3px] border-r-amber-500">
          <span className="text-[11px] text-muted-foreground">
            <span className="font-bold text-foreground">{result.sameIpUsers}</span> other user{result.sameIpUsers !== 1 ? 's' : ''} sharing same IP
          </span>
        </SectionCard>
      )}

      {/* Payment Methods */}
      {paymentMethods && (
        <SectionCard title="Payment Methods" icon={Banknote} accentBorder="border-r-[3px] border-r-[rgb(32,143,255)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {paymentMethods.bank?.bankName && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">BANK</span>
              )}
              {paymentMethods.upi?.address && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">UPI</span>
              )}
              {paymentMethods.upay?.address && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">UPAY</span>
              )}
              {paymentMethods.isDefault && <span className="text-[9px] text-muted-foreground">(Default)</span>}
            </div>
          </div>

          {paymentMethods.bank?.bankName && (
            <div className="mb-3 pb-3 border-b border-border/60 last:border-b-0 last:mb-0 last:pb-0">
              <div className="flex items-center gap-1.5 mb-2">
                <Banknote className="w-3.5 h-3.5 text-[rgb(32,143,255)]" />
                <span className="text-[10px] font-bold text-foreground uppercase">Bank</span>
              </div>
              <StatRow label="Bank Name" value={paymentMethods.bank.bankName} />
              <StatRow label="IFSC" value={paymentMethods.bank.ifsc || '—'} />
              <StatRow label="Account No" value={paymentMethods.bank.accountNo || '—'} />
            </div>
          )}

          {paymentMethods.upi?.address && (
            <div className="mb-3 pb-3 border-b border-border/60 last:border-b-0 last:mb-0 last:pb-0">
              <div className="flex items-center gap-1.5 mb-2">
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold text-foreground uppercase">UPI</span>
              </div>
              <StatRow label="UPI ID" value={paymentMethods.upi.address} />
            </div>
          )}

          {paymentMethods.upay?.address && (
            <div className="mb-3 pb-3 border-b border-border/60 last:border-b-0 last:mb-0 last:pb-0">
              <div className="flex items-center gap-1.5 mb-2">
                <CreditCard className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[10px] font-bold text-foreground uppercase">UPAY</span>
              </div>
              <StatRow label="RPL ID" value={paymentMethods.upay.address} />
            </div>
          )}

          {paymentMethods.holderName && (
            <StatRow label="Holder Name" value={paymentMethods.holderName} />
          )}

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => {
              setPaymentType('BANK');
              setBankName(paymentMethods.bank?.bankName || '');
              setBankCode(paymentMethods.bank?.ifsc || '');
              setAccountNumber(paymentMethods.bank?.accountNo || '');
              setAccountHolder(paymentMethods.holderName || '');
              setUpiId(paymentMethods.upi?.address || '');
              setRplId(paymentMethods.upay?.address || '');
              setPaymentDialogOpen(true);
            }}>
              Edit
            </Button>
          </div>
        </SectionCard>
      )}

      {user?.userId && (
        <UserTurnover userId={user.userId} />
      )}



      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Change User Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full h-8 border border-input bg-background px-2 text-xs rounded"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive (Ban)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">
                Remark {newStatus !== 'active' ? <span className="text-rose-400">*</span> : '(optional)'}
              </label>
              <Input
                value={statusRemark}
                onChange={(e) => setStatusRemark(e.target.value)}
                placeholder={newStatus !== 'active' ? 'Required: reason for ban/suspend...' : 'Optional reason...'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleStatusChange} disabled={statusLoading}>
              {statusLoading && <Loading size={14} />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Payment Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as any)}
                className="w-full h-8 border border-input bg-background px-2 text-xs rounded"
              >
                <option value="BANK">Bank Account</option>
                <option value="UPI">UPI</option>
                <option value="UPAY">UPAY</option>
              </select>
            </div>
            {paymentType === 'BANK' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Bank Name</label>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g., SBI" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">IFSC Code</label>
                  <Input value={bankCode} onChange={(e) => setBankCode(e.target.value)} placeholder="e.g., SBIN0001234" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Account Number</label>
                  <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g., 1234567890" />
                </div>
              </>
            )}
            {paymentType === 'UPI' && (
              <div className="space-y-1">
                <label className="text-xs font-medium">UPI ID</label>
                <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g., name@paytm" />
              </div>
            )}
            {paymentType === 'UPAY' && (
              <div className="space-y-1">
                <label className="text-xs font-medium">RPL ID</label>
                <Input value={rplId} onChange={(e) => setRplId(e.target.value)} placeholder="e.g., RPL123456" />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium">Account Holder</label>
              <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="e.g., John Doe" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handlePaymentUpdate} disabled={paymentLoading}>
              {paymentLoading && <Loading size={14} />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSearch;
