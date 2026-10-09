import React, { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  Receipt,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Zap,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Crown,
  Filter,
  CreditCard,
  Calendar,
  Layers,
} from 'lucide-react';

export interface PaymentTransactionItem {
  ref_id: string;
  orderId: string;
  txnId?: number | null;
  amount: number;
  uniqueAmount?: number;
  fee?: number;
  plan: 'monthly' | 'annual' | string;
  customerName?: string;
  customerEmail?: string;
  status: 'pending' | 'successful' | 'failed';
  rawStatus?: string;
  createdAt: number;
  paidAt?: number | null;
  expiresAt?: number | null;
  paymentUrl?: string;
  checkoutUrl?: string;
  simulateUrl?: string;
  mode?: 'sandbox' | 'live' | string;
  qrisString?: string;
}

interface PaymentHistoryProps {
  onClose?: () => void;
  isModal?: boolean;
  initialRefId?: string;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  onClose,
  isModal = false,
  initialRefId = '',
}) => {
  const {
    setIsPaymentHistoryOpen,
    setIsProModalOpen,
    upgradeToPro,
  } = useHealth();

  const [transactions, setTransactions] = useState<PaymentTransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialRefId);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'successful' | 'failed'>('all');
  const [copiedRefId, setCopiedRefId] = useState<string | null>(null);
  const [checkingRefId, setCheckingRefId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Ambil daftar riwayat transaksi dari backend
  const fetchHistory = async (queryRef?: string) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const url = queryRef
        ? `/api/instanpay/history?ref_id=${encodeURIComponent(queryRef.trim())}`
        : '/api/instanpay/history';
      const res = await fetch(url);
      if (res.ok) {
        let data: any = null;
        try {
          const text = await res.text();
          data = JSON.parse(text);
        } catch {}
        if (data && data.success && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
          return;
        }
      }
    } catch (err) {
      console.warn('Error fetching payment history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(initialRefId);
  }, [initialRefId]);

  const handleCopyRefId = (refId: string) => {
    try {
      navigator.clipboard.writeText(refId);
      setCopiedRefId(refId);
      setTimeout(() => setCopiedRefId(null), 2000);
    } catch {}
  };

  // Cek status spesifik transaksi berdasarkan ref_id langsung ke server/gateway
  const handleCheckSpecificStatus = async (refId: string) => {
    if (!refId.trim()) return;
    const clean = refId.trim();
    setCheckingRefId(clean);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/instanpay/status/${encodeURIComponent(clean)}`);
      let data: any = null;
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch {}

      if (data && data.success && data.transaction) {
        const updatedTxn: PaymentTransactionItem = data.transaction;
        setTransactions((prev) => {
          const index = prev.findIndex((t) => t.ref_id === updatedTxn.ref_id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = updatedTxn;
            return next;
          }
          return [updatedTxn, ...prev];
        });

        if (updatedTxn.status === 'successful') {
          upgradeToPro(updatedTxn.plan === 'monthly' ? 'monthly' : 'annual');
          setStatusMessage({
            type: 'success',
            message: `Transaksi [${updatedTxn.ref_id}] telah BERHASIL (Lunas)! Fitur Akun PRO otomatis diaktifkan.`,
          });
        } else if (updatedTxn.status === 'failed') {
          setStatusMessage({
            type: 'error',
            message: `Transaksi [${updatedTxn.ref_id}] status GAGAL / EXPIRED. Silakan buat transaksi QRIS baru.`,
          });
        } else {
          setStatusMessage({
            type: 'info',
            message: `Transaksi [${updatedTxn.ref_id}] status MENUNGGU PEMBAYARAN. Silakan selesaikan scan QRIS.`,
          });
        }
      } else {
        setStatusMessage({
          type: 'error',
          message: data.error || `Transaksi dengan Ref ID "${clean}" tidak ditemukan di database atau server gateway.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        message: err?.message || 'Gagal menghubungi server untuk verifikasi status.',
      });
    } finally {
      setCheckingRefId(null);
    }
  };

  const handleSimulatePayment = async (orderId: string) => {
    setCheckingRefId(orderId);
    try {
      const res = await fetch('/api/instanpay/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        upgradeToPro('annual');
        setStatusMessage({
          type: 'success',
          message: `Simulasi bayar berhasil! Transaksi ${orderId} telah ditandai SUCCESSFUL.`,
        });
        await fetchHistory();
      } else {
        setStatusMessage({ type: 'error', message: data.error || 'Simulasi gagal dijalankan.' });
      }
    } catch {
      setStatusMessage({ type: 'error', message: 'Gagal menjalankan simulasi pembayaran.' });
    } finally {
      setCheckingRefId(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchHistory();
    } else {
      handleCheckSpecificStatus(searchQuery.trim());
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (activeFilter !== 'all' && t.status !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        t.ref_id.toLowerCase().includes(q) ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        (t.txnId && String(t.txnId).includes(q))
      );
    }
    return true;
  });

  const counts = {
    all: transactions.length,
    pending: transactions.filter((t) => t.status === 'pending').length,
    successful: transactions.filter((t) => t.status === 'successful').length,
    failed: transactions.filter((t) => t.status === 'failed').length,
  };

  const formatTimestamp = (ts: number | null | undefined) => {
    if (!ts) return '-';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsPaymentHistoryOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header Bar */}
      <div className="flex items-center gap-3 mb-4 pr-8">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[2px] shadow-lg shadow-cyan-500/20 flex-shrink-0">
          <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-cyan-300">
            <Receipt className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-white">
              Riwayat Pembayaran QRIS
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold uppercase tracking-wider">
              Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate">
            Pantau status transaksi QRIS (pending, successful, failed) berdasarkan <code className="text-cyan-300 font-mono font-bold">ref_id</code>.
          </p>
        </div>
      </div>

      {/* Search Input by ref_id */}
      <div className="space-y-3 mb-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari atau masukkan ref_id transaksi (cth: ORDER-123)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-750 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>

          <button
            type="submit"
            disabled={isLoading || Boolean(checkingRefId)}
            className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            {checkingRefId ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memeriksa...</span>
              </>
            ) : (
              <>
                <span>Cek Status</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              fetchHistory();
            }}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex-shrink-0"
            title="Muat Ulang Seluruh Transaksi"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </form>

        {/* Status Toast / Alert Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
                : 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            ) : (
              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-400" />
            )}
            <div className="flex-1 text-[11px] leading-relaxed font-medium">
              {statusMessage.message}
            </div>
          </div>
        )}

        {/* Filter Tabs by Status (all, pending, successful, failed) */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Semua</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeFilter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Pending</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
              {counts.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('successful')}
            className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeFilter === 'successful'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Success</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
              {counts.successful}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('failed')}
            className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeFilter === 'failed'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>Failed</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300">
              {counts.failed}
            </span>
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[220px]">
        {filteredTransactions.length === 0 ? (
          <div className="py-10 px-4 rounded-3xl bg-slate-950/60 border border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-300">Belum Ada Transaksi Ditemukan</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {searchQuery
                  ? `Tidak ada transaksi dengan ref_id "${searchQuery}". Silakan periksa kembali ketikan ref_id Anda.`
                  : 'Belum ada transaksi QRIS yang tercatat. Silakan lakukan transaksi baru untuk paket PRO.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                handleClose();
                setIsProModalOpen(true);
              }}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Beli Paket PRO Baru</span>
            </button>
          </div>
        ) : (
          filteredTransactions.map((txn) => {
            const isPending = txn.status === 'pending';
            const isSuccess = txn.status === 'successful';
            const isFailed = txn.status === 'failed';
            const isCheckingThis = checkingRefId === txn.ref_id;

            return (
              <div
                key={txn.ref_id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  isSuccess
                    ? 'bg-slate-950/90 border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : isPending
                    ? 'bg-slate-950/90 border-amber-500/40 ring-1 ring-amber-500/10'
                    : 'bg-slate-950/70 border-rose-500/30'
                }`}
              >
                {/* Header: ref_id & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Ref ID:
                      </span>
                      <code className="text-xs font-mono font-black text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-750">
                        {txn.ref_id}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyRefId(txn.ref_id)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Salin Ref ID"
                      >
                        {copiedRefId === txn.ref_id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      {txn.txnId && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          (Txn #{txn.txnId})
                        </span>
                      )}
                      {txn.mode && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            txn.mode === 'live'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {txn.mode}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>{formatTimestamp(txn.createdAt)}</span>
                      {txn.plan && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-400 font-bold capitalize">
                            Paket {txn.plan === 'monthly' ? 'Bulanan' : 'Tahunan'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {isSuccess && (
                      <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>SUCCESSFUL</span>
                      </div>
                    )}
                    {isPending && (
                      <div className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>PENDING</span>
                      </div>
                    )}
                    {isFailed && (
                      <div className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>FAILED</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount and Breakdown Info */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Total Nominal
                    </span>
                    <span className="text-sm font-black text-white">
                      Rp {(txn.uniqueAmount || txn.amount).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {txn.fee ? (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Biaya QRIS
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        Rp {txn.fee.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ) : null}

                  {txn.paidAt ? (
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                        Waktu Lunas
                      </span>
                      <span className="text-xs text-emerald-300 font-medium">
                        {formatTimestamp(txn.paidAt)}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Bottom Actions for each Transaction */}
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleCheckSpecificStatus(txn.ref_id)}
                    disabled={isCheckingThis}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Periksa status transaksi ini secara real-time berdasarkan ref_id"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingThis ? 'animate-spin text-cyan-400' : ''}`} />
                    <span>{isCheckingThis ? 'Memeriksa...' : 'Cek Status Terkini'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isPending && txn.checkoutUrl && (
                      <a
                        href={txn.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 cursor-pointer"
                      >
                        <span>Buka Bayar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {isPending && txn.mode === 'sandbox' && (
                      <button
                        type="button"
                        onClick={() => handleSimulatePayment(txn.ref_id)}
                        className="py-1.5 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Simulasi pembayaran sukses (Sandbox)"
                      >
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>Simulasi Bayar</span>
                      </button>
                    )}

                    {isSuccess && (
                      <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <Crown className="w-3.5 h-3.5" />
                        <span>Akses PRO Aktif</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 mt-2">
        <div className="flex items-center gap-1.5 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Terhubung ke Gateway QRIS (InstanLive API)</span>
        </div>

        {isModal && (
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        )}
      </div>
    </div>
  );
};
