import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { searchUser, updateUserStatus, updateUserPayment, fetchUserPaymentMethods, updateUserPaymentMethodById, searchUsersByIp, searchUserByMobile, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import UserTurnover from '@/components/UserTurnover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const SectionCard = ({ title, titleExtra, children, rightAction }: {
  title: string;
  titleExtra?: React.ReactNode;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}) => (
  <div className="bg-card border border-border rounded-lg shadow-apple-card overflow-hidden">
    <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">{title}</h3>
        {titleExtra && <span className="text-xs text-muted-foreground">{titleExtra}</span>}
      </div>
      {rightAction && <div className="flex items-center gap-2">{rightAction}</div>}
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

const FormField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-[11px] text-muted-foreground font-medium mb-0.5">{label}</div>
    <div className="text-xs font-semibold text-foreground">{value}</div>
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
  const [mobile, setMobile] = useState('');
  const [ipUsers, setIpUsers] = useState<any[] | null>(null);
  const [ipLoading, setIpLoading] = useState(false);

  const handleSearch = async () => {
    const id = userId.trim();
    const mob = mobile.trim();
    if (!id && mob.length !== 10) { toast.error('Enter User ID or 10-digit mobile'); return; }
    setAuthToken(token);
    setLoading(true);
    setResult(null);
    setIpUsers(null);
    try {
      const res = id ? await searchUser(id) : await searchUserByMobile(mob);
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

  const handleSearchSameIp = async () => {
    const ip = result?.lastIp;
    if (!ip) { toast.error('IP address not available'); return; }
    setAuthToken(token);
    setIpLoading(true);
    try {
      const res = await searchUsersByIp(ip);
      setIpUsers(res.data.users || []);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load IP users');
    } finally {
      setIpLoading(false);
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

  const { user, account, paymentMethods, lastIp, deviceInfo } = result || {};

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="form-grid w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1.5">User ID</div>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter User ID"
              className="w-full h-9 text-sm px-3"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1.5">Mobile</div>
            <Input
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
              className="w-full h-9 text-sm px-3"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} disabled={!userId.trim() && mobile.length !== 10} loading={loading} size="sm" className="h-9 px-4">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <SectionCard title="User Profile">
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <FormField label="User ID" value={user?.userId ?? '—'} />
              <FormField label="Mobile" value={user?.mobile ?? '—'} />
              <FormField label="Admin" value={user ? (user.admin ? 'Yes' : 'No') : '—'} />
              <FormField label="Created" value={user?.createdAt ? new Date(user.createdAt).toLocaleString() : '—'} />
              <FormField label="Updated" value={user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : '—'} />
            </div>
          </SectionCard>

          <SectionCard
            title="Account"
            rightAction={
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs gap-1 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                onClick={() => setStatusDialogOpen(true)}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Change Status
              </Button>
            }
          >
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <FormField label="Balance" value={account ? `₹${(account.balance ?? 0).toLocaleString()}` : '—'} />
              <FormField label="Withdrawable" value={account ? `₹${(account.withdrawable ?? 0).toLocaleString()}` : '—'} />
              <FormField label="Total Deposits" value={account ? `₹${(account.totalDeposits ?? 0).toLocaleString()}` : '—'} />
              <FormField label="Total Withdrawals" value={account ? `₹${(account.totalWithdrawals ?? 0).toLocaleString()}` : '—'} />
              <FormField
                label="Status"
                value={
                  account ? (
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded-pill",
                      account.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                      account.status === 'suspended' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-rose-500/15 text-rose-400'
                    )}>
                      {account.status}
                    </span>
                  ) : '—'
                }
              />
              {account?.statusRemark && <FormField label="Status Remark" value={account.statusRemark} />}
              <FormField label="VIP Level" value={account?.vipLevel || '—'} />
              <FormField label="Withdraw Daily Limit" value={account ? `₹${(account.withdrawDailyLimit ?? 0).toLocaleString()}` : '—'} />
              <FormField label="Turnover Requirement" value={account ? `₹${(account.turnover_requirement ?? 0).toLocaleString()}` : '—'} />
              <FormField label="Turnover Completed" value={account ? `₹${(account.total_turnover_completed ?? 0).toLocaleString()}` : '—'} />
              <FormField label="Currency" value={account?.currency || 'INR'} />
              <FormField label="Game Member" value={account ? (account.gameMemberCreated ? 'Created' : 'Not Created') : '—'} />
              <FormField label="First Deposit Bonus" value={account ? (account.firstDepositBonusGiven ? 'Given' : 'Not Given') : '—'} />
              <FormField label="Created" value={account?.createdAt ? new Date(account.createdAt).toLocaleString() : '—'} />
              <FormField label="Updated" value={account?.updatedAt ? new Date(account.updatedAt).toLocaleString() : '—'} />
            </div>
          </SectionCard>

          <SectionCard
            title="Same IP Users"
            titleExtra={<span className="font-semibold text-foreground">Users Sharing IP: {result?.sameIpUsers ?? 0}</span>}
            rightAction={
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-xs gap-1 border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
                    disabled={!lastIp}
                    onClick={() => { handleSearchSameIp(); }}
                  >
                    <Search className="w-3.5 h-3.5" />
                    View Users
                  </Button>
                </SheetTrigger>
                  <SheetContent side="right" className="w-[500px] sm:max-w-[500px]">
                  <SheetHeader>
                    <SheetTitle className="text-sm">Users Sharing IP: {lastIp}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    {ipLoading ? (
                      <div className="flex items-center justify-center py-8"><Loading size={20} /></div>
                    ) : ipUsers && ipUsers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>Mobile</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ipUsers.map((u: any) => (
                            <TableRow key={u.userId}>
                              <TableCell className="text-xs">{u.userId}</TableCell>
                              <TableCell className="text-xs">{u.mobile}</TableCell>
                              <TableCell className="text-xs">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex items-center justify-center py-8"><span className="text-xs text-foreground">No users found</span></div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            }
          >
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <FormField label="IP Address" value={lastIp || '—'} />
              {deviceInfo?.city && <FormField label="City" value={deviceInfo.city} />}
              {deviceInfo?.region && <FormField label="Region" value={deviceInfo.region} />}
              {deviceInfo?.country_name && <FormField label="Country" value={deviceInfo.country_name} />}
              {deviceInfo?.asn && <FormField label="ASN" value={deviceInfo.asn} />}
              {deviceInfo?.org && <FormField label="Organization" value={deviceInfo.org} />}
              {deviceInfo?.isp && <FormField label="ISP" value={deviceInfo.isp} />}
              {deviceInfo?.latitude != null && deviceInfo?.longitude != null && (
                <FormField label="Location" value={`${deviceInfo.latitude}, ${deviceInfo.longitude}`} />
              )}
              {deviceInfo?.timezone && <FormField label="Timezone" value={deviceInfo.timezone} />}
              {deviceInfo?.postal && <FormField label="Postal Code" value={deviceInfo.postal} />}
            </div>
          </SectionCard>

          <SectionCard
            title="Payment Methods"
            rightAction={
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs gap-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => {
                  setPaymentType('BANK');
                  setBankName(paymentMethods?.bank?.bankName || '');
                  setBankCode(paymentMethods?.bank?.ifsc || '');
                  setAccountNumber(paymentMethods?.bank?.accountNo || '');
                  setAccountHolder(paymentMethods?.holderName || '');
                  setUpiId(paymentMethods?.upi?.address || '');
                  setRplId(paymentMethods?.upay?.address || '');
                  setPaymentDialogOpen(true);
                }}
              >
                Edit
              </Button>
            }
          >
            <div className="flex items-center gap-1.5 mb-3">
              {(paymentMethods?.bank?.bankName) && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-pill bg-primary/10 text-primary">BANK</span>}
              {(paymentMethods?.upi?.address) && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-pill bg-emerald-500/15 text-emerald-400">UPI</span>}
              {(paymentMethods?.upay?.address) && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-pill bg-purple-500/15 text-purple-400">UPAY</span>}
              {paymentMethods?.isDefault && <span className="text-[9px] text-muted-foreground">(Default)</span>}
            </div>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <FormField label="Bank Name" value={paymentMethods?.bank?.bankName || '—'} />
              <FormField label="IFSC" value={paymentMethods?.bank?.ifsc || '—'} />
              <FormField label="Account No" value={paymentMethods?.bank?.accountNo || '—'} />
              <FormField label="UPI ID" value={paymentMethods?.upi?.address || '—'} />
              <FormField label="RPL ID" value={paymentMethods?.upay?.address || '—'} />
              <FormField label="Holder Name" value={paymentMethods?.holderName || '—'} />
            </div>
          </SectionCard>

          {user?.userId && (
            <UserTurnover userId={user.userId} />
          )}
        </div>
      )}

      <Sheet open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <SheetContent side="right" className="w-[400px] sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle className="text-sm">Change User Status</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full h-8 border border-input bg-background px-3 text-xs rounded-pill"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive (Ban)</option>
              </select>
            </div>
            <div className="space-y-1.5">
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
          <SheetFooter className="mt-6">
            <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleStatusChange} disabled={statusLoading}>
              {statusLoading && <Loading size={14} />}
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <SheetContent side="right" className="w-[400px] sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle className="text-sm">Edit Payment Details</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as any)}
                className="w-full h-8 border border-input bg-background px-3 text-xs rounded-pill"
              >
                <option value="BANK">Bank Account</option>
                <option value="UPI">UPI</option>
                <option value="UPAY">UPAY</option>
              </select>
            </div>
            {paymentType === 'BANK' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Bank Name</label>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g., SBI" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">IFSC Code</label>
                  <Input value={bankCode} onChange={(e) => setBankCode(e.target.value)} placeholder="e.g., SBIN0001234" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Account Number</label>
                  <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g., 1234567890" />
                </div>
              </>
            )}
            {paymentType === 'UPI' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium">UPI ID</label>
                <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g., name@paytm" />
              </div>
            )}
            {paymentType === 'UPAY' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium">RPL ID</label>
                <Input value={rplId} onChange={(e) => setRplId(e.target.value)} placeholder="e.g., RPL123456" />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Account Holder</label>
              <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="e.g., John Doe" />
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" size="sm" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handlePaymentUpdate} disabled={paymentLoading}>
              {paymentLoading && <Loading size={14} />}
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </div>
  );
};

export default UserSearch;