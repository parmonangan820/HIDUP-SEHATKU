import React, { useState, useEffect, useRef } from 'react';
import { useHealth } from '../context/HealthContext';
import QRCode from 'qrcode';
import {
  getAffiliateStats,
  saveAffiliateStats,
  simulateAffiliateReferral,
  COMMISSION_RATES,
  PROMO_TEMPLATES,
  AffiliateStats,
} from '../services/affiliateService';
import {
  Share2,
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  ExternalLink,
  Crown,
  Award,
  Wallet,
  Sparkles,
  MessageSquare,
  X,
  QrCode,
  Download,
  Flame,
  Gift,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  Eye,
  ArrowRight,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AffiliateModal: React.FC<AffiliateModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useHealth();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [activeTab, setActiveTab] = useState<'qr_poster' | 'analytics' | 'referrals' | 'templates'>('qr_poster');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTemplateIndex, setCopiedTemplateIndex] = useState<number | null>(null);
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  // Bank payout form state
  const [bankName, setBankName] = useState<string>('BCA');
  const [accountNumber, setAccountNumber] = useState<string>('8820192831');
  const [accountHolder, setAccountHolder] = useState<string>(profile.name || 'Sahabat Sehat');

  const posterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load stats
  useEffect(() => {
    if (isOpen && profile) {
      const data = getAffiliateStats(profile.id || 'default-user', profile.name || 'Member');
      setStats(data);
      if (data.bankDetails) {
        setBankName(data.bankDetails.bankName || 'BCA');
        setAccountNumber(data.bankDetails.accountNumber || '');
        setAccountHolder(data.bankDetails.accountHolder || profile.name || '');
      }
    }
  }, [isOpen, profile]);

  // Generate crisp QR code whenever stats changes
  useEffect(() => {
    if (stats?.affiliateCode) {
      const affiliateUrl = `${window.location.origin}/?ref=${encodeURIComponent(stats.affiliateCode)}`;
      QRCode.toDataURL(affiliateUrl, {
        width: 400,
        margin: 1.5,
        color: {
          dark: '#030712',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Failed to generate QR Code:', err));
    }
  }, [stats?.affiliateCode]);

  if (!isOpen || !stats) return null;

  const affiliateUrl = `${window.location.origin}/?ref=${encodeURIComponent(stats.affiliateCode)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateUrl);
    setCopiedLink(true);
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(stats.affiliateCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyTemplate = (text: string, index: number) => {
    const fullText = text.replace(/\[AFF_LINK\]/g, affiliateUrl);
    navigator.clipboard.writeText(fullText);
    setCopiedTemplateIndex(index);
    try {
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
    } catch (e) {}
    setTimeout(() => setCopiedTemplateIndex(null), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = `Halo! 👋 Yuk mulai pola hidup sehat bersama aplikasi *Hidup Sehatku*! 💧🌿\n\nBanyak fitur keren seperti pengingat minum cerdas, pencatat olahraga, scan kalori makanan via kamera, dan asisten Dokter AI pribadi.\n\nSpesial lewat undanganku ini, kamu otomatis dapat *PRO Trial 3 Hari GRATIS* lho!\n\n👉 Langsung daftar di sini:\n${affiliateUrl}\n\nAtau scan QR Code resmiku ya! Semangat sehat selalu! ✨`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDownloadQrOnly = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `QRCode-Affiliate-HidupSehatKu-${stats.affiliateCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Generate high-resolution promotional flyer poster
  const handleDownloadFlyerPoster = async () => {
    if (!qrCodeDataUrl) return;
    setIsGeneratingPoster(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 900, 1350);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#061325');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 900, 1350);

      // 2. Ambient Glows
      const glow1 = ctx.createRadialGradient(800, 150, 20, 800, 150, 400);
      glow1.addColorStop(0, 'rgba(20, 184, 166, 0.35)');
      glow1.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(400, 0, 500, 500);

      const glow2 = ctx.createRadialGradient(100, 1200, 20, 100, 1200, 450);
      glow2.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
      glow2.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 800, 600, 550);

      // 3. Top Header Tag
      ctx.fillStyle = 'rgba(20, 184, 166, 0.15)';
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(240, 70, 420, 46, 23);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#2dd4bf';
      ctx.textAlign = 'center';
      ctx.fillText('✨ UNDANGAN EKSKLUSIF RESMI AFILIATOR', 450, 100);

      // 4. Main App Title
      ctx.font = '900 48px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('HIDUP SEHATKU', 450, 175);

      ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Aplikasi Cerdas Pendamping Gaya Hidup Sehat & Bugar', 450, 215);

      // 5. Special Voucher Banner Box
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(100, 260, 700, 90, 20);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('🎁 KLAIM AKSES PRO TRIAL 3 HARI GRATIS!', 450, 300);

      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText('Scan QR Code di bawah untuk langsung daftar tanpa biaya sepeser pun', 450, 332);

      // 6. QR Code Card Holder
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;
      ctx.beginPath();
      ctx.roundRect(230, 390, 440, 490, 28);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Load QR Code Image onto canvas
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.src = qrCodeDataUrl;
      await new Promise((resolve) => {
        qrImg.onload = resolve;
      });

      ctx.drawImage(qrImg, 265, 420, 370, 370);

      // QR Instruction badge on white card
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(270, 810, 360, 48, 14);
      ctx.fill();

      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('SCAN DENGAN KAMERA HP ANDA', 450, 840);

      // 7. Affiliate Information Card
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(100, 920, 700, 90, 20);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Direkomendasikan oleh:', 260, 955);

      ctx.font = '900 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(stats.userName || profile.name || 'Sahabat Sehat', 260, 988);

      ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Kode Referral:', 630, 955);

      ctx.font = '900 24px "Plus Jakarta Sans", monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(stats.affiliateCode, 630, 988);

      // 8. 3 Feature Highlights
      const features = [
        '💧 Sensor Minum Cerdas & Auto-Sync Tumbler',
        '🏃‍♂️ Tracker Olahraga & Kalori Terbakar Akurat',
        '🤖 Konsultasi Dokter AI & Rute Anti-Macet Cerdas',
      ];

      features.forEach((feat, i) => {
        const y = 1050 + i * 50;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.beginPath();
        ctx.roundRect(100, y, 700, 42, 12);
        ctx.fill();

        ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'left';
        ctx.fillText(feat, 130, y + 27);
      });

      // 9. Footer
      ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('Kunjungi: www.hidupsehatku.my.id • Mulai Hidup Sehat & Bugar Hari Ini!', 450, 1270);

      // Trigger download
      const posterData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = posterData;
      a.download = `Poster-Resmi-Afiliasi-HidupSehatKu-${stats.affiliateCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (e) {
      console.error('Failed to generate poster:', e);
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (stats.pendingEarnings <= 0) {
      alert('Saldo komisi Anda saat ini Rp 0.');
      return;
    }

    const updated: AffiliateStats = {
      ...stats,
      paidEarnings: stats.paidEarnings + stats.pendingEarnings,
      pendingEarnings: 0,
      bankDetails: {
        bankName,
        accountNumber,
        accountHolder,
      },
      payoutHistory: [
        {
          id: `pay-${Date.now()}`,
          amount: stats.pendingEarnings,
          date: new Date().toISOString(),
          status: 'sukses',
          destination: `${bankName} •••• ${accountNumber.slice(-4) || 'Rekening'}`,
        },
        ...(stats.payoutHistory || []),
      ],
    };

    setStats(updated);
    saveAffiliateStats(profile.id || 'default-user', updated);
    setPayoutRequested(true);

    try {
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
    } catch (e) {}

    setTimeout(() => setPayoutRequested(false), 6000);
  };

  const handleRunSimulation = (type: 'free_join' | 'pro_monthly' | 'pro_annual') => {
    const { updatedStats, message } = simulateAffiliateReferral(profile.id || 'default-user', type);
    setStats(updatedStats);
    setSimulationToast(message);

    try {
      confetti({
        particleCount: type === 'pro_annual' ? 70 : 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    setTimeout(() => {
      setSimulationToast(null);
    }, 6000);
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl flex flex-col relative text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/90 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-30 cursor-pointer border border-slate-700/60 shadow-lg"
          title="Tutup dasbor affiliate"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Motivational Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-teal-950 p-5 sm:p-6 border-b border-slate-800 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  <span>Program Kemitraan Afiliasi Resmi</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-teal-400" />
                  <span>Tracking Cookie Permanen</span>
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Sebarkan Hidup Sehat, Raih Komisi Pasif Tanpa Batas! 💰
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Bagikan <strong>QR Code</strong> atau link unik Anda ke keluarga, teman, dan grup kerja. Setiap kali ada yang scan dan mendaftar, mereka langsung tercatat sebagai member Anda. <strong>Kapan pun mereka membeli versi PRO</strong> (hari ini, besok, atau tahun depan), komisi otomatis masuk ke rekening Anda!
              </p>
            </div>

            {/* Quick Balance Header Widget */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-center gap-3 shrink-0 self-start md:self-auto shadow-xl">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Saldo Komisi Siap Cair:</span>
                <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">
                  {formatRupiah(stats.pendingEarnings)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('qr_poster')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'qr_poster'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>📱 QR Code & Poster Siap Sebar</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>📊 Komisi & Penarikan Saldo</span>
            </button>

            <button
              onClick={() => setActiveTab('referrals')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'referrals'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>👥 Calon User & Referral ({stats.referrals.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'templates'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>💬 Kata-Kata Promosi Teruji</span>
            </button>
          </div>
        </div>

        {/* Body Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Simulation Toast Notice */}
          {simulationToast && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-500/20 via-emerald-500/20 to-teal-500/20 border-2 border-teal-500/50 text-teal-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-fadeIn shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 animate-bounce" />
              <span className="leading-snug">{simulationToast}</span>
            </div>
          )}

          {/* TAB 1: QR CODE & FLYER POSTER */}
          {activeTab === 'qr_poster' && (
            <div className="space-y-6">
              {/* Highlight Announcement & Commission Rules */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-500/15 via-slate-900 to-amber-500/15 border-2 border-amber-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                      GARANSI SEUMUR HIDUP
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      Sistem Tracking Otomatis 100%
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Bagikan QR Code ini — Calon User Otomatis Tercatat Sebagai Member Anda!
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Setiap orang yang scan QR Code ini akan otomatis terhubung permanen dengan akun Anda. Saat ini juga mereka dapat <strong>Akun Gratis + PRO Trial 3 Hari</strong>. Dan <strong>kapan pun mereka membeli PRO</strong> (Paket Bulanan atau Tahunan), Anda otomatis menerima komisi!
                  </p>
                </div>

                {/* Rates Callout */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">PRO Bulanan</span>
                    <span className="text-sm font-black text-teal-300 font-mono">Rp 3.000</span>
                    <span className="text-[9px] text-teal-400/80 font-bold block">(20%)</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/40 text-center ring-1 ring-amber-500/30">
                    <span className="text-[10px] text-amber-300 font-bold block">PRO Tahunan</span>
                    <span className="text-sm font-black text-amber-300 font-mono">Rp 25.000</span>
                    <span className="text-[9px] text-amber-400 font-bold block">(25% Super Cuan)</span>
                  </div>
                </div>
              </div>

              {/* QR Code Presentation Box & Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left: The Visual QR Showcase Card */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-950 shadow-2xl border-4 border-amber-400 w-full max-w-xs text-center space-y-3">
                    {/* Top Branding Pill */}
                    <div className="flex items-center justify-center gap-1.5 pb-1 border-b border-slate-200">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
                        HidupSehatKu • QR
                      </span>
                    </div>

                    {/* QR Canvas / Image */}
                    <div className="bg-white p-2 rounded-2xl shadow-inner border border-slate-200 flex items-center justify-center">
                      {qrCodeDataUrl ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="Affiliate QR Code"
                          className="w-56 h-56 object-contain rounded-xl"
                        />
                      ) : (
                        <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                          Memuat QR Code...
                        </div>
                      )}
                    </div>

                    {/* Code & Instruction */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Kode Referral Afiliasi:
                      </span>
                      <div className="inline-block px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-sm tracking-wider font-mono shadow-sm">
                        {stats.affiliateCode}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight pt-1">
                        Scan dengan Kamera HP / Google Lens untuk Daftar & Klaim PRO Trial 3 Hari
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons, Share & Copy Link */}
                <div className="md:col-span-7 space-y-4 text-left">
                  {/* Share Action Buttons */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-amber-400" />
                      <span>Sebarkan QR Code & Link Sekarang:</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* WhatsApp Share Button */}
                      <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>📲 Kirim ke WhatsApp</span>
                      </button>

                      {/* Download Poster Button */}
                      <button
                        type="button"
                        onClick={handleDownloadFlyerPoster}
                        disabled={isGeneratingPoster}
                        className="p-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4 stroke-[2.5]" />
                        <span>{isGeneratingPoster ? 'Merender Poster...' : '📥 Unduh Poster QR (PNG)'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadQrOnly}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-teal-400" />
                      <span>Unduh File Gambar QR Code Saja</span>
                    </button>
                  </div>

                  {/* Affiliate Link Input Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">Link Afiliasi Anda:</span>
                      <button
                        onClick={handleCopyCode}
                        className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                      >
                        {copiedCode ? 'Kode Tersalin!' : 'Salin Kode Saja'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={affiliateUrl}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        {copiedLink ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedLink ? 'Tersalin!' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Simulator / Sandbox Test Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-slate-950 to-indigo-500/10 border border-purple-500/30 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs font-black text-white">
                          Uji Coba Langsung: Simulasi Calon User Scan & Beli PRO
                        </h4>
                      </div>
                      <span className="text-[10px] text-purple-300 font-medium">Tes Real-Time</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Coba rasakan bagaimana sistem otomatis mencatat calon user saat scan QR dan menambahkan komisi saat mereka upgrade ke PRO:
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleRunSimulation('free_join')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold cursor-pointer"
                      >
                        + Simulasi Calon User Scan QR (Free)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRunSimulation('pro_monthly')}
                        className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold cursor-pointer"
                      >
                        💎 Simulasi User Beli PRO Bulanan (+Rp 3.000)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRunSimulation('pro_annual')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-black cursor-pointer"
                      >
                        🔥 Simulasi Beli PRO Tahunan (+Rp 25.000)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANALYTICS & PAYOUT WITHDRAWAL */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">Total Klik / Scan QR</span>
                  <span className="text-2xl font-black text-cyan-300 font-mono">{stats.totalClicks}</span>
                  <span className="text-[10px] text-slate-500 block">Kunjungan tercatat</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">Calon User Terdaftar</span>
                  <span className="text-2xl font-black text-white font-mono">{stats.totalReferrals}</span>
                  <span className="text-[10px] text-emerald-400 font-bold block">Terkunci di akun Anda</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 text-center space-y-1">
                  <span className="text-[11px] text-amber-300 font-bold uppercase block">Member PRO Aktif</span>
                  <span className="text-2xl font-black text-amber-300 font-mono">{stats.proReferrals}</span>
                  <span className="text-[10px] text-amber-400/80 font-bold block">Menghasilkan komisi</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 text-center space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold uppercase block">Total Akumulasi Komisi</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                    {formatRupiah(stats.totalEarnings)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Semua waktu</span>
                </div>
              </div>

              {/* Payout Withdrawal Box */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-emerald-400" />
                      <span>Penarikan Saldo Komisi (Payout)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pencairan langsung ditransfer ke rekening bank lokal atau E-Wallet dalam 1x24 jam kerja.
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Saldo Tersedia:</span>
                    <span className="text-xl font-black text-emerald-300 font-mono">
                      {formatRupiah(stats.pendingEarnings)}
                    </span>
                  </div>
                </div>

                {/* Payout Form */}
                <form onSubmit={handleRequestPayout} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Pilihan Bank / E-Wallet:
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="BCA">Bank BCA</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BRI">Bank BRI</option>
                      <option value="BNI">Bank BNI</option>
                      <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                      <option value="GoPay">GoPay</option>
                      <option value="OVO">OVO</option>
                      <option value="DANA">DANA</option>
                      <option value="ShopeePay">ShopeePay</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Nomor Rekening / No. HP:
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Contoh: 882019xxxx / 0812xxxx"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                    </input>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Nama Pemilik Rekening:
                    </label>
                    <input
                      type="text"
                      required
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="Nama sesuai buku tabungan"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                    </input>
                  </div>

                  <div className="sm:col-span-3 pt-2">
                    <button
                      type="submit"
                      disabled={stats.pendingEarnings <= 0}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4 stroke-[2.5]" />
                      <span>
                        {stats.pendingEarnings > 0
                          ? `Tarik Saldo Komisi ${formatRupiah(stats.pendingEarnings)} Sekarang`
                          : 'Saldo Komisi Belum Tersedia (Rp 0)'}
                      </span>
                    </button>
                  </div>
                </form>

                {payoutRequested && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>
                      Permintaan pencairan sebesar {formatRupiah(stats.paidEarnings)} berhasil diajukan! Dana sedang diproses ke {bankName} an. {accountHolder}.
                    </span>
                  </div>
                )}
              </div>

              {/* Payout History Table */}
              {stats.payoutHistory && stats.payoutHistory.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Riwayat Penarikan Dana (Payout History)
                  </h4>
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 divide-y divide-slate-850">
                    {stats.payoutHistory.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block">{item.destination}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-emerald-400 block">
                            +{formatRupiah(item.amount)}
                          </span>
                          <span className="text-[10px] text-teal-300 font-bold uppercase">
                            ✓ {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REFERRALS TABLE & TRACKING */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Daftar Calon User & Status Pembelian PRO ({stats.referrals.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Semua calon user yang pernah scan QR Code atau klik link Anda tercatat di sini secara permanen.
                  </p>
                </div>

                <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
                  {stats.proReferrals} dari {stats.referrals.length} sudah jadi Member PRO
                </span>
              </div>

              {/* Table */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                        <th className="p-3.5 font-bold">Nama Calon User</th>
                        <th className="p-3.5 font-bold">Sumber</th>
                        <th className="p-3.5 font-bold">Tanggal Bergabung</th>
                        <th className="p-3.5 font-bold">Status Membership</th>
                        <th className="p-3.5 font-bold text-right">Komisi Diterima</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {stats.referrals.map((ref) => (
                        <tr key={ref.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3.5 font-bold text-white flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-teal-300 font-black text-xs shrink-0">
                              {ref.referredName.charAt(0)}
                            </div>
                            <div>
                              <span className="block text-white font-bold">{ref.referredName}</span>
                              {ref.referredPhone && (
                                <span className="text-[10px] text-slate-400 font-mono">{ref.referredPhone}</span>
                              )}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 w-fit">
                              <QrCode className="w-3 h-3 text-amber-400" />
                              <span>{ref.source === 'qr_code' ? 'Scan QR Code' : 'Direct Link'}</span>
                            </span>
                          </td>

                          <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                            {new Date(ref.joinedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="p-3.5">
                            {ref.isPro ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-[10px]">
                                  <Crown className="w-3 h-3 fill-amber-300" />
                                  <span>PRO ({ref.planPurchased === 'annual' ? '1 Tahun' : '1 Bulan'})</span>
                                </span>
                                <span className="text-[9px] text-emerald-400 block font-semibold">
                                  ✓ Komisi Berhasil Masuk
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium text-[10px]">
                                  <span>Free Member (Trial Aktif)</span>
                                </span>
                                <span className="text-[9px] text-slate-500 block">
                                  Menunggu upgrade ke PRO
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="p-3.5 text-right font-bold font-mono text-emerald-400 text-sm">
                            {ref.commissionEarned > 0 ? formatRupiah(ref.commissionEarned) : 'Rp 0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TEMPLATES PROMOSI SIAP PAKAI */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Template Kata-Kata Promosi Teruji (Siap Salin & Sebarkan)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cukup klik tombol <strong>Salin Teks</strong>, link unik afiliasi Anda otomatis terpasang di dalamnya!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PROMO_TEMPLATES.map((tpl, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-amber-300">{tpl.title}</span>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-bold">
                          {tpl.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                        {tpl.text.replace(/\[AFF_LINK\]/g, affiliateUrl)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-850">
                      <button
                        type="button"
                        onClick={() => handleCopyTemplate(tpl.text, idx)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedTemplateIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedTemplateIndex === idx ? 'Tersalin!' : 'Salin Teks Lengkap'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const full = tpl.text.replace(/\[AFF_LINK\]/g, affiliateUrl);
                          window.open(`https://wa.me/?text=${encodeURIComponent(full)}`, '_blank');
                        }}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                        title="Kirim langsung ke WhatsApp"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
