import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  X,
  Droplet,
  Bluetooth,
  BatteryCharging,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  Crown,
  Trophy,
  Sparkles,
  Award,
  Send,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Info,
  Truck,
  RotateCcw,
  Zap,
  ShoppingBag,
  Gift,
  QrCode,
  Flame,
  Check,
} from 'lucide-react';
import smartTumblerImg from '../assets/images/smart_tumbler_iot_1791423087354.jpg';

interface SmartTumblerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProUpgrade?: () => void;
}

export const SmartTumblerModal: React.FC<SmartTumblerModalProps> = ({
  isOpen,
  onClose,
  onOpenProUpgrade,
}) => {
  const {
    profile,
    todayRecord,
    logWater,
    isPro,
    userProPlan,
    setIsProModalOpen,
  } = useHealth();

  const [activeTab, setActiveTab] = useState<'product' | 'event'>('product');
  const [selectedColor, setSelectedColor] = useState<string>('Obsidian Black');
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [isSimulatingPour, setIsSimulatingPour] = useState<boolean>(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);
  const [claimAddress, setClaimAddress] = useState<string>('');
  const [claimSubmitted, setClaimSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const isAnnualPro = userProPlan === 'annual';
  const normalPrice = 450000;
  const promoPrice = 249000;

  // Calculate current user's hydration score (out of 100)
  const currentWater = todayRecord.totalWaterMl;
  const targetWater = profile.targetWaterMl || 2500;
  const waterRatio = Math.min(1.2, currentWater / targetWater);
  const hydrationScore = Math.min(100, Math.round(waterRatio * 85 + (todayRecord.waterLogs.length >= 4 ? 15 : todayRecord.waterLogs.length * 3)));

  const colorOptions = [
    { name: 'Obsidian Black', label: 'Hitam Titanium', hex: '#18181b', ring: 'ring-zinc-600' },
    { name: 'Glacier White', label: 'Putih Salju', hex: '#f8fafc', ring: 'ring-slate-300' },
    { name: 'Ocean Navy', label: 'Biru Samudra', hex: '#0f172a', ring: 'ring-cyan-500' },
    { name: 'Luxury Rose Gold', label: 'Rose Gold', hex: '#e2b3a3', ring: 'ring-rose-400' },
  ];

  const handleSimulateDrinking = () => {
    setIsSimulatingPour(true);
    setSimulationToast(null);

    setTimeout(() => {
      // Auto log 250ml
      logWater(250, 'tumbler');
      setIsSimulatingPour(false);
      setSimulationToast('🎉 Bluetooth IoT Sync Berhasil! +250 ml air dari Smart Tumbler otomatis tercatat di akun Anda tanpa perlu input manual.');
      
      setTimeout(() => {
        setSimulationToast(null);
      }, 5000);
    }, 1200);
  };

  const handleWhatsAppOrder = () => {
    const totalAmount = promoPrice * orderQuantity;
    const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalAmount);
    
    const message = `Halo Admin HidupSehatKu! Saya ingin memesan Smart Tumbler IoT resmi:
- Nama: ${profile.name || 'Sahabat Sehat'}
- No. WhatsApp: ${profile.phone || '-'}
- Pilihan Warna: ${selectedColor}
- Jumlah: ${orderQuantity} unit
- Total Promo: ${formattedTotal}
- Alamat Pengiriman: (Mohon konfirmasi ongkir)

Mohon dibantu nomor rekening pembayaran / invoice pengirimannya. Terima kasih!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/6281234567890?text=${encoded}`, '_blank');
  };

  const handleClaimVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimAddress.trim()) return;
    setClaimSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-30 p-2 rounded-full bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800"
          title="Tutup dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 p-5 sm:p-6 border-b border-slate-800 flex flex-col gap-3 relative">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Bluetooth className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>Smart IoT Merchandise</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Event Voucher Gratis PRO 1 Tahun</span>
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Smart Tumbler IoT HidupSehatKu
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Botol minum pintar berteknologi sensor presisi. Setiap tegukan air otomatis tercatat di aplikasi via Bluetooth tanpa perlu repot mengetik manual!
            </p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setActiveTab('product')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'product'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Droplet className="w-3.5 h-3.5" />
              <span>Detail & Beli Tumbler</span>
            </button>
            <button
              onClick={() => setActiveTab('event')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'event'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-amber-300 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>🏆 Event Voucher Gratis 100%</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'product' ? (
            <div className="space-y-6">
              {/* Product Hero Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                {/* Product Image Showcase with Real-Time Simulated LED */}
                <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 p-3 shadow-xl group">
                  <img
                    src={smartTumblerImg}
                    alt="Smart Tumbler HidupSehatKu"
                    className="w-full h-64 sm:h-72 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Floating badges on image */}
                  <div className="absolute top-5 left-5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-teal-500/40 text-teal-300 text-[10px] font-black flex items-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                    <span>Bluetooth 5.3 Connected</span>
                  </div>

                  <div className="absolute bottom-5 right-5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[11px] font-black flex items-center gap-1 shadow-lg">
                    <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Layar Suara & Suhu 24°C</span>
                  </div>
                </div>

                {/* Pricing & Key Advantages */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-400 line-through font-bold">Rp 450.000</span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black">
                        HEMAT 45%
                      </span>
                    </div>
                    <div className="text-3xl font-black text-white flex items-baseline gap-2">
                      <span>Rp 249.000</span>
                      <span className="text-xs text-slate-400 font-normal">/ unit (Garansi 1 Thn)</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Solusi terbaik untuk Anda yang sering lupa mencatat konsumsi air putih. Setiap tegukan langsung terkirim ke server dan dashboard HidupSehatKu secara otomatis dan instan!
                  </p>

                  {/* Color Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Pilihan Warna Premium:</span>
                      <span className="text-teal-400 font-extrabold">{selectedColor}</span>
                    </label>
                    <div className="flex items-center gap-3">
                      {colorOptions.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setSelectedColor(c.name)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            selectedColor === c.name
                              ? `ring-2 ring-offset-2 ring-offset-slate-900 ${c.ring} scale-110 shadow-lg`
                              : 'opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.label}
                        >
                          {selectedColor === c.name && (
                            <Check className={`w-4 h-4 ${c.name === 'Glacier White' ? 'text-slate-950' : 'text-white'}`} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs font-bold text-slate-400">Jumlah:</span>
                    <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1">
                      <button
                        type="button"
                        onClick={() => setOrderQuantity((q) => Math.max(1, q - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-sm flex items-center justify-center hover:bg-slate-700 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-white text-xs">{orderQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setOrderQuantity((q) => q + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-sm flex items-center justify-center hover:bg-slate-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Bluetooth Pour Simulator */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-500/15 via-slate-900 to-indigo-500/15 border-2 border-teal-500/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                      <Zap className="w-4 h-4 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        Uji Coba Langsung: Simulasi Auto-Sync Tumbler
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Coba rasakan bagaimana tumbler mencatat air Anda secara otomatis ke aplikasi!
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateDrinking}
                    disabled={isSimulatingPour}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-teal-500/25 flex items-center gap-2 cursor-pointer"
                  >
                    <Droplet className="w-4 h-4 fill-slate-950" />
                    <span>{isSimulatingPour ? 'Mendeteksi Aliran Air...' : '🧪 Minum 250ml dari Tumbler'}</span>
                  </button>
                </div>

                {simulationToast && (
                  <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{simulationToast}</span>
                  </div>
                )}
              </div>

              {/* 4 Super Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                    <Bluetooth className="w-4 h-4" />
                    <span>Auto-Sync Bluetooth 5.3 Low Energy</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Setiap tegukan dihitung dengan sensor presisi mililiter dan langsung tercatat di aplikasi tanpa sentuh ponsel.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Thermometer className="w-4 h-4" />
                    <span>Layar LED Touchscreen & Suhu Cerdas</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sentuh tutup botol untuk melihat suhu air secara instan. Lampu cincin berubah warna sesuai temperatur air.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Stainless Steel Medis 316 Food-Grade</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Kualitas tertinggi, anti-karat, tahan dingin 24 jam dan panas 12 jam. 100% Bebas BPA & anti-bocor 360°.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <BatteryCharging className="w-4 h-4" />
                    <span>Baterai Magnetik Tahan 30 Hari</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Kabel charger magnetik cepat. Cukup isi daya selama 1.5 jam untuk pemakaian aktif selama sebulan penuh.
                  </p>
                </div>
              </div>

              {/* Order Actions */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-left w-full sm:w-auto">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Pesanan:</span>
                  <span className="text-lg font-black text-teal-300">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(promoPrice * orderQuantity)}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 fill-slate-950" />
                    <span>Pesan via WhatsApp Admin</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* EVENT VOUCHER GRATIS 100% UNTUK PENGGUNA PRO 1 TAHUN */
            <div className="space-y-6">
              {/* Event Hero Announcement Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-600/20 border-2 border-amber-500/50 shadow-2xl space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-amber-500/30 shrink-0">
                    <Trophy className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                        EVENT RESMI ADMIN
                      </span>
                      <span className="text-xs font-bold text-amber-300">
                        Periode: Oktober - Desember 2026
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white mt-1">
                      Event Voucher Smart Tumbler Gratis 100% untuk Pengguna PRO 1 Tahun!
                    </h3>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                      Admin aplikasi mengadakan event spesial bagi pengguna setia yang berlangganan <strong>Paket PRO 1 Tahun</strong> dan memiliki <strong>Penilaian Skor Hidrasi & Kesehatan Tertinggi</strong>. Menangkan unit Smart Tumbler gratis senilai <strong>Rp 450.000</strong> langsung dikirim ke rumah Anda!
                    </p>
                  </div>
                </div>

                {/* Status Eligibility Check for Current User */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-1 text-left w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Status Akun Anda:</span>
                      {isAnnualPro ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>MEMBER PRO 1 TAHUN (MEMENUHI SYARAT)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black">
                          BELUM PRO 1 TAHUN
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-200">
                      Penilaian Skor Hidrasi Anda Hari Ini:{' '}
                      <strong className="text-amber-300 font-mono text-sm">{hydrationScore} / 100 Poin</strong>
                    </div>
                  </div>

                  {!isAnnualPro && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenProUpgrade) onOpenProUpgrade();
                        else setIsProModalOpen(true);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Crown className="w-4 h-4 fill-slate-950" />
                      <span>Upgrade ke PRO 1 Tahun (Rp 100rb)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Leaderboard Penilaian Skor Tertinggi */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Top Leaderboard Skor Hidrasi & Kesehatan Teraktif</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Diperbarui real-time</span>
                </div>

                <div className="space-y-2">
                  {[
                    { rank: 1, name: 'dr. Budi Prasetyo', score: 99, status: 'Calon Penerima Voucher #1', color: 'from-amber-400 to-yellow-500' },
                    { rank: 2, name: 'Siti Rahmawati', score: 97, status: 'Calon Penerima Voucher #2', color: 'from-slate-300 to-zinc-400' },
                    { rank: 3, name: 'Kevin Wijaya', score: 96, status: 'Calon Penerima Voucher #3', color: 'from-amber-600 to-amber-700' },
                    { rank: 4, name: 'Rina Anggraini', score: 94, status: 'Top 5 Konsistensi', color: 'from-cyan-400 to-blue-500' },
                    { rank: 5, name: `${profile.name || 'Sahabat Sehat'} (Anda)`, score: hydrationScore, status: isAnnualPro ? 'Tiket Event Aktif' : 'Tingkatkan ke PRO 1 Thn', color: 'from-teal-400 to-emerald-400' },
                  ].map((user) => (
                    <div
                      key={user.rank}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-3 border ${
                        user.name.includes('(Anda)')
                          ? 'bg-teal-500/15 border-teal-500/40 ring-1 ring-teal-500/30'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center text-slate-950 font-black text-xs shadow`}>
                          #{user.rank}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{user.name}</span>
                          <span className="text-[10px] text-slate-400">{user.status}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-amber-300 font-mono block">{user.score}</span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Poin Skor</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Syarat & Ketentuan Event */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3 Aturan Emas Pemenang Voucher Smart Tumbler:</span>
                </h5>
                <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside pl-1 leading-relaxed">
                  <li>Harus memiliki akun aktif dengan <strong>Paket PRO 1 Tahun (Tahunan)</strong>.</li>
                  <li>Rajin mencatat hidrasi setiap hari dan mencapai target air sesuai bobot tubuh minimal 21 hari berturut-turut.</li>
                  <li>Pengguna dengan poin skor tertinggi pada akhir periode event akan menerima kode voucher gratis 100% + Gratis Ongkir langsung dari Admin melalui WhatsApp/Email.</li>
                </ol>
              </div>

              {/* Voucher Claim Form (If User is Annual Pro) */}
              {isAnnualPro && !claimSubmitted && (
                <form onSubmit={handleClaimVoucherSubmit} className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 space-y-3">
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-emerald-400" />
                      <span>Konfirmasi Data Pemenang Voucher Anda:</span>
                    </h5>
                    <p className="text-[11px] text-slate-300">
                      Masukkan alamat lengkap pengiriman jika Anda terpilih sebagai penerima Smart Tumbler Gratis:
                    </p>
                  </div>

                  <input
                    type="text"
                    required
                    value={claimAddress}
                    onChange={(e) => setClaimAddress(e.target.value)}
                    placeholder="Contoh: Jl. Sudirman No. 45, Medan, Sumatera Utara..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                  />

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    Daftarkan Alamat & Tiket Event Saya
                  </button>
                </form>
              )}

              {claimSubmitted && (
                <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Alamat Anda telah terdaftar dalam sistem event Admin! Tim HidupSehatKu akan menghubungi Anda via WhatsApp jika skor Anda berhasil masuk ke babak final pemenang voucher gratis.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
