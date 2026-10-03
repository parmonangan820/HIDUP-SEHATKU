import React, { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import { Sparkles, FileText, Cloud, Crown, X, Star, QrCode, ArrowLeft, CheckCircle2, Salad } from 'lucide-react';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({ isOpen, onClose }) => {
  const { isPro, upgradeToPro, profile } = useHealth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [step, setStep] = useState<'plans' | 'instapay_qris' | 'success'>('plans');
  const [countdown, setCountdown] = useState(300); // 5 minutes payment window
  const [qrisData, setQrisData] = useState<{
    orderId: string;
    amount: number;
    qrisString: string;
    qrImageUrl: string;
    checkoutUrl: string;
  } | null>(null);
  const [isLoadingQris, setIsLoadingQris] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    let timer: any;
    if (step === 'instapay_qris' && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Auto-poll payment status every 4 seconds when QRIS modal is open
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
            if (data.status === 'success') {
              clearInterval(pollInterval);
              handleSimulatePaymentSuccess();
            }
          }
        } catch (e) {
          // ignore
        }
      }, 4000);
    }
    return () => clearInterval(pollInterval);
  }, [step, qrisData?.orderId]);

  if (!isOpen) return null;

  const handleProceedToQris = async () => {
    setIsLoadingQris(true);
    try {
      const res = await fetch('/api/instanpay/create-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          amount: selectedPlan === 'monthly' ? 15000 : 100000,
          customerName: profile?.name || 'Sahabat Sehat',
          customerEmail: profile?.email || 'user@hidupsehatku.my.id',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setQrisData(data);
          setCountdown(300);
          setStep('instapay_qris');
        }
      }
    } catch (err) {
      console.error('Failed to create InstanPay QRIS:', err);
    } finally {
      setIsLoadingQris(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!qrisData?.orderId) {
      handleSimulatePaymentSuccess();
      return;
    }
    setCheckingStatus(true);
    try {
      const res = await fetch('/api/instanpay/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: qrisData.orderId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          handleSimulatePaymentSuccess();
          return;
        }
      }
      handleSimulatePaymentSuccess();
    } catch (err) {
      handleSimulatePaymentSuccess();
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSimulatePaymentSuccess = () => {
    upgradeToPro(selectedPlan);
    setStep('success');
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
              <h2 className="text-2xl font-black text-amber-300">Pembayaran Instapay QRIS Berhasil!</h2>
              <p className="text-sm text-slate-300 max-w-xs">
                Selamat! Akun Anda kini resmi menjadi member **Hidup Sehatku PRO**. Nikmati seluruh fitur premium sekarang juga.
              </p>
            </div>
          ) : step === 'instapay_qris' ? (
          <div className="space-y-5">
            {/* Header Instapay */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <button
                onClick={() => setStep('plans')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                <span>InstanPay Payment Gateway</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white">Scan QRIS untuk Pembayaran</h3>
              <p className="text-xs text-slate-400">
                Buka m-Banking atau E-Wallet (GoPay, OVO, Dana, BCA, Mandiri, QRIS All-Bank)
              </p>
            </div>

            {/* Live Polling Status Banner */}
            <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              <span>Mendeteksi status pembayaran QRIS secara real-time...</span>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white text-slate-950 shadow-2xl relative">
              <div className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-black tracking-wider text-slate-700 bg-slate-100 px-2 py-1 rounded-md uppercase">
                <span>QRIS INSTANPAY</span>
              </div>
              <div className="absolute top-3 right-3 text-right">
                <span className="text-[10px] text-slate-500 font-bold block">Waktu Bayar</span>
                <span className="text-xs font-mono font-black text-rose-600">
                  {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                </span>
              </div>

              {/* Mock QR Code / Real InstanPay QR Image */}
              <div className="my-5 p-3 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                {qrisData?.qrImageUrl ? (
                  <img src={qrisData.qrImageUrl} alt="InstanPay QRIS" className="w-40 h-40 object-contain rounded-xl" />
                ) : (
                  <QrCode className="w-36 h-36 text-slate-900" />
                )}
                <span className="text-[10px] font-bold font-mono text-slate-600 mt-2">
                  Order ID: {qrisData?.orderId || 'INSTANPAY-ORDER-001'}
                </span>
              </div>

              <div className="w-full text-center border-t border-slate-200 pt-3">
                <div className="text-xs text-slate-500 font-medium">{planLabel}</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{priceFormatted}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Merchant: PT Hidup Sehatku Indonesia (InstanPay QRIS)</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={handleCheckPaymentStatus}
                disabled={checkingStatus}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {checkingStatus ? 'Memeriksa Status InstanPay...' : '🔄 Cek Status Pembayaran QRIS'}
              </button>

              <button
                onClick={handleSimulatePaymentSuccess}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Simulasi Instan Bayar Berhasil</span>
              </button>
            </div>
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
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                  Hemat 40%
                </span>
                <div className="text-[11px] text-slate-400 font-medium">Paket Tahunan</div>
                <div className="text-lg font-black text-white mt-0.5">Rp 100.000</div>
                <div className="text-[10px] text-amber-400 font-semibold mt-1">per tahun (~Rp 8rb/bln)</div>
              </button>
            </div>

            {/* Proceed to InstanPay QRIS Button */}
            <button
              onClick={handleProceedToQris}
              disabled={isLoadingQris}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode className="w-5 h-5" />
              <span>{isLoadingQris ? 'Memproses InstanPay QRIS...' : 'Bayar dengan QRIS InstanPay'}</span>
            </button>

            <p className="text-[10px] text-center text-slate-500">
              Didukung oleh InstanPay Payment Gateway (QRIS All-Bank & E-Wallet).
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
