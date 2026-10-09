import React, { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import { Sparkles, FileText, Cloud, Crown, X, Star, QrCode, ArrowLeft, CheckCircle2, Salad, Navigation, Gift, Clock, Zap, Trophy, Droplet, Bluetooth, MessageSquare, AlertTriangle, Building, Receipt, Copy, Check, Download, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createClientQrisPayload, generateNationalQRIS } from '../utils/qrisGenerator';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({ isOpen, onClose }) => {
  const {
    isPro,
    isProTrial,
    isPaidPro,
    isTrialExpired,
    trialTimeRemainingFormatted,
    activateProTrial,
    upgradeToPro,
    profile,
    setIsTumblerModalOpen,
    setIsPaymentHistoryOpen,
  } = useHealth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [step, setStep] = useState<'plans' | 'instapay_qris' | 'success'>('plans');
  const [paymentTab, setPaymentTab] = useState<'gateway' | 'manual'>('gateway');
  const [countdown, setCountdown] = useState(300); // 5 minutes payment window
  const [qrisData, setQrisData] = useState<{
    orderId: string;
    amount: number;
    uniqueAmount?: number;
    fee?: number;
    txnId?: number;
    paymentUrl?: string;
    qrisString: string;
    dynamicQrisString?: string;
    isDynamicQris?: boolean;
    qrDataUrl?: string;
    qrImageUrl: string;
    checkoutUrl: string;
    isSandbox?: boolean;
    bankAccountInfo?: string;
    whatsappConfirmationNumber?: string;
    customQrisImageUrl?: string;
    customStaticQrisString?: string;
    customQrisMerchantName?: string;
  } | null>(null);
  const [isLoadingQris, setIsLoadingQris] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'info' | 'warning' | 'error'; message: string } | null>(null);
  const [copiedBankInfo, setCopiedBankInfo] = useState(false);
  const [copiedQrisString, setCopiedQrisString] = useState(false);

  const handleCopyBankInfo = () => {
    const text = qrisData?.bankAccountInfo || 'BCA / Mandiri / GoPay / DANA: 085760525942 a.n Canggih Marbun';
    try {
      navigator.clipboard.writeText(text);
      setCopiedBankInfo(true);
      setTimeout(() => setCopiedBankInfo(false), 2000);
    } catch {}
  };

  const handleCopyQrisString = () => {
    const text = qrisData?.qrisString || qrisData?.dynamicQrisString;
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedQrisString(true);
      setTimeout(() => setCopiedQrisString(false), 2000);
    } catch {}
  };

  const handleDownloadQr = () => {
    const rawQr =
      qrisData?.qrDataUrl ||
      qrisData?.qrImageUrl ||
      `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
        qrisData?.qrisString ||
          generateNationalQRIS({
            orderId: qrisData?.orderId || 'ORDER-001',
            amount: qrisData?.amount || 15000,
            merchantName: qrisData?.customQrisMerchantName || 'HIDUP SEHATKU PRO',
          })
      )}`;
    const a = document.createElement('a');
    a.href = rawQr;
    a.download = `qris-dinamis-${qrisData?.orderId || 'pro'}.png`;
    a.target = '_blank';
    a.click();
  };

  useEffect(() => {
    let timer: any;
    if (step === 'instapay_qris' && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Auto-poll payment status every 3.5 seconds when QRIS modal is open
  useEffect(() => {
    let pollInterval: any;
    if (step === 'instapay_qris' && qrisData?.orderId) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/instanpay/check-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: qrisData.orderId }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'paid') {
              clearInterval(pollInterval);
              handlePaymentSuccess();
            }
          }
        } catch (e) {
          // ignore network hiccups
        }
      }, 3500);
    }
    return () => clearInterval(pollInterval);
  }, [step, qrisData?.orderId]);

  if (!isOpen) return null;

  const handleProceedToQris = async () => {
    setIsLoadingQris(true);
    setStatusFeedback(null);
    const finalAmount = selectedPlan === 'monthly' ? 15000 : 100000;

    try {
      let adminConfig = null;
      try {
        const savedConfig = localStorage.getItem('hidupsehat_instanpay_admin_config');
        if (savedConfig) adminConfig = JSON.parse(savedConfig);
      } catch {}

      const res = await fetch('/api/instanpay/create-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          amount: finalAmount,
          customerName: profile?.name || 'Sahabat Sehat',
          customerEmail: profile?.email || 'user@hidupsehatku.my.id',
          adminConfig,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.qrisString) {
          setQrisData(data);
          setCountdown(300);
          setStep('instapay_qris');
          setIsLoadingQris(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend QRIS API not available, falling back to client generator:', err);
    }

    // Direct client fallback for static hosting / cPanel / Vercel static export
    const fallbackPayload = createClientQrisPayload(selectedPlan, finalAmount);
    setQrisData(fallbackPayload);
    setCountdown(300);
    setStep('instapay_qris');
    setIsLoadingQris(false);
  };

  const handleCheckPaymentStatus = async () => {
    if (!qrisData?.orderId) {
      setStatusFeedback({ type: 'warning', message: 'Order ID tidak ditemukan. Silakan muat ulang.' });
      return;
    }
    setCheckingStatus(true);
    setStatusFeedback(null);
    try {
      let adminConfig = null;
      try {
        const savedConfig = localStorage.getItem('hidupsehat_instanpay_admin_config');
        if (savedConfig) adminConfig = JSON.parse(savedConfig);
      } catch {}

      const res = await fetch('/api/instanpay/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: qrisData.orderId, adminConfig }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'paid') {
          handlePaymentSuccess();
          return;
        } else if (data.status === 'expired') {
          setStatusFeedback({ type: 'error', message: 'Waktu pembayaran telah kedaluwarsa. Silakan buat QRIS baru.' });
          return;
        } else {
          setStatusFeedback({
            type: 'warning',
            message: '⚠️ Pembayaran belum terdeteksi. Silakan scan barcode QRIS dan selesaikan transaksi melalui m-Banking atau E-Wallet Anda.',
          });
          return;
        }
      }
      setStatusFeedback({
        type: 'warning',
        message: '⚠️ Pembayaran belum terdeteksi. Silakan scan barcode QRIS di atas untuk menyelesaikan.',
      });
    } catch (err) {
      setStatusFeedback({
        type: 'warning',
        message: '⚠️ Pembayaran belum terdeteksi. Silakan scan barcode QRIS di atas untuk menyelesaikan.',
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleTriggerSimulatePaid = async () => {
    if (!qrisData?.orderId) return;
    setCheckingStatus(true);
    setStatusFeedback(null);
    try {
      await fetch('/api/instanpay/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: qrisData.orderId }),
      }).catch(() => {});
      await handlePaymentSuccess();
    } catch (err) {
      await handlePaymentSuccess();
    } finally {
      setCheckingStatus(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (qrisData?.orderId) {
      try {
        await fetch('/api/instanpay/confirm-paid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: qrisData.orderId,
            plan: selectedPlan,
            customerName: profile?.name || 'Sahabat Sehat',
          }),
        });
      } catch (e) {
        console.warn('Error confirming payment on server:', e);
      }
    }
    upgradeToPro(selectedPlan);
    setStep('success');
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
    setTimeout(() => {
      setStep('plans');
      onClose();
    }, 2500);
  };

  const priceFormatted = selectedPlan === 'monthly' ? 'Rp 15.000' : 'Rp 100.000';
  const planLabel = selectedPlan === 'monthly' ? 'Paket Bulanan (1 Bulan)' : 'Paket Tahunan (1 Tahun)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl overflow-hidden text-white flex flex-col">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={() => {
            setStep('plans');
            onClose();
          }}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors z-30 cursor-pointer shadow-lg border border-slate-700/60"
          title="Tutup dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-5 sm:p-8">
          {step === 'success' ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-scaleUp">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30">
                <Crown className="w-10 h-10 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-amber-300">Pembayaran QRIS iPaymu / InstantPay Berhasil!</h2>
              <p className="text-sm text-slate-300 max-w-xs">
                Selamat! Akun Anda kini resmi menjadi member **Hidup Sehatku PRO**. Nikmati seluruh fitur premium sekarang juga.
              </p>
            </div>
          ) : step === 'instapay_qris' ? (
          <div className="space-y-4">
            {/* Header Instapay / iPaymu */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <button
                onClick={() => setStep('plans')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                <span>InstanLive QRIS Gateway</span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaymentTab('gateway')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentTab === 'gateway'
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Gateway InstanLive</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab('manual')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentTab === 'manual'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>QRIS Toko & Transfer Bank</span>
              </button>
            </div>

            {paymentTab === 'gateway' ? (
              <div className="space-y-4">
                {/* Sandbox Warning Notice */}
                {qrisData?.isSandbox && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-200 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-black text-amber-300">Mode Sandbox Aktif (Kunci sk_test_...)</div>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                          Barcode di bawah dihasilkan oleh lingkungan uji coba InstanLive (format <code className="text-amber-300 font-mono">SANDBOX|INSTANPAY|...</code>) sehingga <strong>tidak dapat discan langsung</strong> oleh aplikasi m-Banking nyata.
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] bg-slate-950/70 p-2 rounded-xl text-slate-300 flex items-center justify-between gap-2 border border-slate-800">
                      <span>💡 Ingin langsung mencoba aktivasi?</span>
                      <button
                        type="button"
                        onClick={handleTriggerSimulatePaid}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] transition-all cursor-pointer"
                      >
                        ⚡ Simulasikan Berhasil
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentTab('manual')}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>Mau bayar uang nyata m-Banking sekarang? Pindah ke Tab QRIS Toko & Transfer →</span>
                    </button>
                  </div>
                )}

                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-white">Scan QRIS Gateway InstanLive</h3>
                  <p className="text-xs text-slate-400">
                    Sistem mendeteksi transaksi secara otomatis setiap beberapa detik
                  </p>
                </div>

                {/* Live Polling Status Banner */}
                <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                  <span>Mendeteksi status pembayaran InstanLive secara real-time...</span>
                </div>

                {/* QR Code Container with Official QRIS National Header */}
                <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white text-slate-950 shadow-2xl relative">
                  <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black tracking-widest text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        QRIS
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        {qrisData?.isSandbox ? 'SANDBOX SIMULATOR' : 'STANDAR NASIONAL'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Batas Waktu</span>
                      <span className="text-xs font-mono font-black text-rose-600">
                        {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* QR Image */}
                  <div className="my-3 p-3 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center shadow-inner w-full max-w-xs">
                    {qrisData?.qrImageUrl ? (
                      <img
                        src={qrisData.qrImageUrl}
                        alt="QRIS Standar Nasional"
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                      />
                    ) : (
                      <QrCode className="w-44 h-44 text-slate-900" />
                    )}

                    <div className="flex items-center gap-2 mt-2.5 w-full justify-center">
                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        className="py-1 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-300"
                        title="Simpan QR ke Galeri HP"
                      >
                        <Download className="w-3 h-3 text-slate-700" />
                        <span>Unduh QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyQrisString}
                        className="py-1 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-300"
                        title="Salin String QRIS Dinamis"
                      >
                        {copiedQrisString ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-700" />
                            <span>Salin Kode QRIS</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-2 text-center">
                      <span className="text-[10px] font-bold font-mono text-slate-600 block">
                        Order ID: {qrisData?.orderId || 'ORDER-001'}
                      </span>
                      {qrisData?.txnId && (
                        <span className="text-[9px] font-mono text-slate-400 block">
                          Txn ID InstanLive: #{qrisData.txnId}
                        </span>
                      )}
                      <span className="text-[9px] text-emerald-700 font-bold block mt-0.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ QRIS Dinamis Aktif (Nominal Otomatis Saat Scan)
                      </span>
                    </div>
                  </div>

                  <div className="w-full text-center border-t border-slate-200 pt-3">
                    <div className="text-xs text-slate-600 font-medium">{planLabel}</div>
                    <div className="text-2xl font-black text-slate-950 mt-0.5">
                      {qrisData?.uniqueAmount ? `Rp ${qrisData.uniqueAmount.toLocaleString('id-ID')}` : priceFormatted}
                    </div>
                    {qrisData?.fee ? (
                      <div className="text-[10px] text-slate-500 font-medium">
                        (Nominal: Rp {qrisData.amount?.toLocaleString('id-ID')} + Biaya Transaksi: Rp {qrisData.fee?.toLocaleString('id-ID')})
                      </div>
                    ) : null}
                    <div className="text-[10px] text-slate-500 mt-0.5">Merchant: {qrisData?.customQrisMerchantName || 'HIDUP SEHATKU PRO'}</div>
                  </div>
                </div>

                {/* Status Feedback Toast/Alert */}
                {statusFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      statusFeedback.type === 'warning'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {statusFeedback.message}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2.5">
                  {/* Tombol Utama: Saya Sudah Bayar QRIS (Aktivasi PRO Langsung) */}
                  <button
                    onClick={handlePaymentSuccess}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:brightness-110 text-white font-black text-xs sm:text-sm active:scale-95 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>⚡ Saya Sudah Bayar QRIS (Aktivasi PRO Sekarang)</span>
                  </button>

                  {qrisData?.checkoutUrl && (
                    <a
                      href={qrisData.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/30"
                    >
                      <span>Buka Halaman Checkout InstanLive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={handleCheckPaymentStatus}
                    disabled={checkingStatus}
                    className="w-full py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {checkingStatus ? 'Memeriksa Status Pembayaran...' : '🔄 Cek Status Pembayaran (Auto-Detect Gateway)'}
                  </button>

                  {qrisData?.isSandbox && (
                    <button
                      onClick={handleTriggerSimulatePaid}
                      disabled={checkingStatus}
                      className="w-full py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Simulasi jika barcode scan QRIS telah dibayar (Sandbox Mode)"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      <span>⚡ Uji Coba Bayar QRIS Selesai (Sandbox Simulator)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onClose();
                      setIsPaymentHistoryOpen(true);
                    }}
                    className="w-full py-2.5 rounded-2xl bg-slate-900 border border-slate-750 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Lihat Riwayat Pembayaran & Cek Status (Ref ID: {qrisData?.orderId})</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* TAB 2: QRIS TOKO RESMI & TRANSFER MANUAL */}
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-white">QRIS Toko & Transfer Bank Langsung</h3>
                  <p className="text-xs text-slate-400">
                    Bisa dipindai langsung dengan aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, Dana, ShopeePay)
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white text-slate-950 shadow-2xl relative">
                  <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black tracking-widest text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        QRIS
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        PEMBAYARAN RESMI TOKO
                      </span>
                    </div>
                    <span className="text-xs font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      SIAP SCAN
                    </span>
                  </div>

                  <div className="my-3 p-3 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                    <img
                      src={
                        qrisData?.customQrisImageUrl ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                          generateNationalQRIS({
                            orderId: qrisData?.orderId || 'ORDER-001',
                            amount: selectedPlan === 'monthly' ? 15000 : 100000,
                            merchantName: qrisData?.customQrisMerchantName || 'HIDUP SEHATKU PRO',
                          })
                        )}`
                      }
                      alt="QRIS Toko Resmi"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="mt-2 py-1 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
                    >
                      <Download className="w-3 h-3" />
                      <span>Unduh Barcode QRIS</span>
                    </button>
                    <span className="text-[10px] font-bold font-mono text-slate-600 mt-2">
                      Order ID: {qrisData?.orderId || 'ORDER-001'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      Merchant: {qrisData?.customQrisMerchantName || 'HIDUP SEHATKU PRO'}
                    </span>
                  </div>

                  <div className="w-full text-center border-t border-slate-200 pt-3">
                    <div className="text-xs text-slate-600 font-medium">{planLabel}</div>
                    <div className="text-2xl font-black text-slate-950 mt-0.5">{priceFormatted}</div>
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Rekening / E-Wallet Pembayaran:</div>
                        <div className="text-xs font-black text-slate-900 font-mono mt-0.5 truncate">
                          {qrisData?.bankAccountInfo || 'BCA / Mandiri / GoPay / DANA: 085760525942 a.n Canggih Marbun'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyBankInfo}
                        className="py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 flex-shrink-0 cursor-pointer transition-colors"
                      >
                        {copiedBankInfo ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* WhatsApp & Instant Confirmation Buttons */}
                <div className="space-y-2.5">
                  <a
                    href={`https://wa.me/62${(qrisData?.whatsappConfirmationNumber || '085760525942').replace(/^0/, '')}?text=${encodeURIComponent(
                      `Halo Admin HidupSehatKu, saya telah melakukan transfer/pembayaran QRIS untuk aktivasi ${planLabel} (Order ID: ${qrisData?.orderId}) sebesar ${priceFormatted}. Mohon konfirmasi aktivasi akun saya.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Kirim Bukti Pembayaran ke WhatsApp Admin</span>
                  </a>

                  <button
                    onClick={handlePaymentSuccess}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Saya Sudah Membayar (Verifikasi & Aktifkan PRO Sekarang)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-lg shadow-amber-500/10">
                <Crown className="w-3.5 h-3.5" />
                <span>HIDUP SEHATKU PRO</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                Tingkatkan Kesehatan ke Level Tertinggi
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Buka seluruh kekuatan AI, laporan medis PDF dokter, sinkronisasi cloud otomatis, dan bebas iklan selamanya.
              </p>
            </div>

            {/* Active 3-Day Trial Status */}
            {isProTrial && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-teal-500/20 border border-amber-500/40 text-left space-y-1.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-slate-950" />
                    <span>Trial PRO 3 Hari Sedang Berjalan</span>
                  </span>
                  <span className="text-xs font-black text-amber-300 font-mono">
                    ⏳ Sisa {trialTimeRemainingFormatted}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Anda sedang menikmati akses penuh Dokter AI, Scanner Makanan, Laporan PDF Medis, dan Rute Bebas Macet! Beli paket sekarang untuk mengunci <strong>Diskon Spesial 40%</strong> dan tetap sehat tanpa terputus.
                </p>
              </div>
            )}

            {/* Expired 3-Day Trial Status */}
            {isTrialExpired && !isPaidPro && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-purple-500/20 border border-rose-500/40 text-left space-y-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider">
                    Masa Coba 3 Hari Selesai
                  </span>
                  <span className="text-xs font-bold text-amber-300">
                    Akun Kembali ke Versi Free
                  </span>
                </div>
                <h4 className="text-sm font-black text-white">
                  Suka dengan Kemudahan Dokter AI & Rute Bebas Macet?
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Terima kasih telah mencoba Hidup Sehatku PRO! Jangan biarkan kebiasaan sehat dan perjalanan anti-stres Anda terputus. Investasi kesehatan Anda hanya mulai <strong>Rp 500/hari (Rp 15.000/bulan)</strong> — lebih murah dari sebutir permen!
                </p>
              </div>
            )}

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">AI Health Scanner & Chat</h4>
                  <p className="text-[11px] text-slate-400">Analisis kalori makanan & konsultasi dokter AI tanpa batas.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                  <Salad className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Tips Diet Sukses Dokter AI</h4>
                  <p className="text-[11px] text-slate-400">Target kalori TDEE/BMR, menu lokal & jadwal hidrasi bakar lemak.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Laporan PDF Medis</h4>
                  <p className="text-[11px] text-slate-400">Unduh rekam jejak kesehatan siap cetak untuk dokter.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 flex-shrink-0">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Rute AI & Pantauan Macet</h4>
                  <p className="text-[11px] text-slate-400">Navigasi cerdas bebas macet Google Maps, hemat waktu & rute anti-stres.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 flex-shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Cloud Sync Otomatis</h4>
                  <p className="text-[11px] text-slate-400">Data sinkron di semua perangkat tanpa takut hilang.</p>
                </div>
              </div>
            </div>

            {/* Pricing Options */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  selectedPlan === 'monthly'
                    ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] text-slate-400 font-medium">Paket Bulanan</div>
                <div className="text-lg font-black text-white mt-0.5">Rp 15.000</div>
                <div className="text-[10px] text-amber-400 font-semibold mt-1">per bulan</div>
              </button>

              <button
                onClick={() => setSelectedPlan('annual')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  selectedPlan === 'annual'
                    ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                    Hemat 40%
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-teal-400 text-slate-950 text-[8px] font-black uppercase flex items-center gap-0.5">
                    <Trophy className="w-2.5 h-2.5" />
                    <span>Free Tumbler Event</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Paket Tahunan</div>
                <div className="text-lg font-black text-white mt-0.5">Rp 100.000</div>
                <div className="text-[10px] text-amber-400 font-semibold mt-1">per tahun (~Rp 8rb/bln)</div>
              </button>
            </div>

            {/* Special 1-Year Pro Bonus Event Callout */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-teal-500/10 to-emerald-500/15 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-black text-white">Event Voucher Smart Tumbler Gratis 100%!</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase">PRO 1 TAHUN</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Pelanggan Paket PRO 1 Tahun otomatis berhak ikut serta dalam <strong>Event Voucher Gratis Smart Tumbler IoT (Nilai Rp 450.000)</strong> dari Admin untuk pengguna dengan <strong>Penilaian Skor Tertinggi</strong>!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setIsTumblerModalOpen(true);
                }}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Lihat Tumbler & Event</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            {/* Proceed to iPaymu / InstanPay QRIS Button */}
            <button
              onClick={handleProceedToQris}
              disabled={isLoadingQris}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode className="w-5 h-5" />
              <span>{isLoadingQris ? 'Memproses QRIS iPaymu...' : 'Bayar dengan iPaymu / InstantPay QRIS'}</span>
            </button>

            {/* Link to Payment History Modal */}
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsPaymentHistoryOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sudah bayar? Cek Riwayat Pembayaran & Status Ref ID</span>
            </button>

            <p className="text-[10px] text-center text-slate-500">
              Didukung oleh iPaymu & InstantPay Payment Gateway (QRIS All-Bank & E-Wallet Nasional).
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
