import React, { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  AdminUserItem,
  AdminStats,
  AnnouncementItem,
  fetchAdminStats,
  fetchAdminUsers,
  fetchUserDetails,
  updateUserByAdmin,
  deleteUserByAdmin,
  resetUserByAdmin,
  postAnnouncement,
  deleteAnnouncement,
  changeAdminPin,
} from '../services/adminService';
import { optimizeBannerImage } from '../utils/imageOptimizer';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  BarChart3,
  Radio,
  Settings,
  X,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  RotateCcw,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Key,
  Copy,
  Check,
  LogOut,
  Download,
  Send,
  Droplets,
  Flame,
  Activity,
  FileText,
  Calendar,
  Phone,
  Scale,
  Ruler,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Database,
  Lock,
  Megaphone,
  QrCode,
  Share2,
  ExternalLink,
  Smartphone,
  Palette,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';

export const AdminPanelModal: React.FC = () => {
  const {
    isAdmin,
    isAdminModalOpen,
    setIsAdminModalOpen,
    logoutAdmin,
    refreshAnnouncement,
    activeAnnouncement,
    bannerSlides,
    updateBannerSlide,
    saveAllBannerSlides,
    refreshBannersFromServer,
  } = useHealth();

  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'broadcast' | 'banners' | 'security' | 'instanpay' | 'qrcode'>('users');
  const [instanpayConfig, setInstanpayConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('hidupsehat_instanpay_admin_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          mode: (parsed.mode || 'sandbox') as 'sandbox' | 'live',
          merchantId: parsed.merchantId || 'M-INSTANPAY-882910',
          liveApiKey: parsed.liveApiKey || parsed.apiKey || 'sk_live_sec_991823746501928374',
          liveClientKey: parsed.liveClientKey || parsed.clientKey || '',
          sandboxApiKey: parsed.sandboxApiKey || 'sk_test_f477df17909b8f706efa39f1f6ac826c4fb7',
          sandboxClientKey: parsed.sandboxClientKey || '',
          callbackUrl: parsed.callbackUrl || 'https://www.hidupsehatku.my.id/api/instanpay/callback',
          autoActivatePro: parsed.autoActivatePro ?? true,
        };
      }
    } catch {}
    return {
      mode: 'sandbox' as 'sandbox' | 'live',
      merchantId: 'M-INSTANPAY-882910',
      liveApiKey: 'sk_live_sec_991823746501928374',
      liveClientKey: '',
      sandboxApiKey: 'sk_test_f477df17909b8f706efa39f1f6ac826c4fb7',
      sandboxClientKey: '',
      callbackUrl: 'https://www.hidupsehatku.my.id/api/instanpay/callback',
      autoActivatePro: true,
    };
  });
  const [showLiveSecret, setShowLiveSecret] = useState(false);
  const [showSandboxSecret, setShowSandboxSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSavingInstanpay, setIsSavingInstanpay] = useState(false);
  const [instanpaySaveMessage, setInstanpaySaveMessage] = useState<string | null>(null);

  const handleCopyField = (text: string, label: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  const handleSaveInstanpayConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInstanpay(true);
    try {
      localStorage.setItem('hidupsehat_instanpay_admin_config', JSON.stringify(instanpayConfig));
      setInstanpaySaveMessage('Konfigurasi InstanPay Gateway & Mode berhasil disimpan!');
      setTimeout(() => setInstanpaySaveMessage(null), 4000);
    } catch (err) {
      setInstanpaySaveMessage('Gagal menyimpan konfigurasi.');
    } finally {
      setIsSavingInstanpay(false);
    }
  };
  const [bannerForm, setBannerForm] = useState(bannerSlides);
  const [savingSlideIndex, setSavingSlideIndex] = useState<number | null>(null);
  const [isSavingAllBanners, setIsSavingAllBanners] = useState(false);
  const [isRefreshingBanners, setIsRefreshingBanners] = useState(false);

  useEffect(() => {
    if (bannerSlides) {
      setBannerForm(bannerSlides);
    }
  }, [bannerSlides]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Selected User for Detail View
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Edit User State
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    age: 25,
    gender: 'pria' as 'pria' | 'wanita',
    weight: 60,
    height: 165,
    targetWaterMl: 2100,
    dailyWorkoutMinutesTarget: 30,
    role: 'user' as 'admin' | 'user',
  });

  // Broadcast Announcement State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState<'info' | 'warning' | 'challenge' | 'tips'>('info');

  // Security / PIN State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
      ]);
      setStats(statsData);
      setUsers(usersData.users || []);
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminModalOpen) {
      loadData();
    }
  }, [isAdminModalOpen]);

  if (!isAdminModalOpen || !isAdmin) return null;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  // View User Details
  const handleViewDetails = async (userId: string) => {
    setIsLoadingDetail(true);
    const details = await fetchUserDetails(userId);
    setSelectedUserDetail(details);
    setIsLoadingDetail(false);
  };

  // Open Edit User
  const handleOpenEdit = (user: AdminUserItem) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      phone: user.phone === '-' ? '' : user.phone,
      age: user.age,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      targetWaterMl: user.targetWaterMl,
      dailyWorkoutMinutesTarget: user.dailyWorkoutMinutesTarget,
      role: user.role,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = await updateUserByAdmin(editingUser.id, editFormData);
    if (res.success) {
      setActionFeedback({ type: 'success', message: 'Data pengguna berhasil diperbarui!' });
      setEditingUser(null);
      loadData();
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  // Reset User logs
  const handleResetUser = async (userId: string, userName: string) => {
    if (
      confirm(
        `Reset riwayat untuk ${userName}? Semua log minum air, olahraga, dan catatan kesehatan pengguna ini akan dikembalikan ke 0 ml & 0 menit.`
      )
    ) {
      const res = await resetUserByAdmin(userId);
      if (res.success) {
        setActionFeedback({ type: 'success', message: `Riwayat ${userName} berhasil direset ke 0!` });
        loadData();
      } else {
        setActionFeedback({ type: 'error', message: res.message });
      }
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      confirm(
        `PERINGATAN: Apakah Anda yakin ingin MENGHAPUS pengguna "${userName}"? Akun dan semua riwayatnya akan dihapus permanen dari Supabase.`
      )
    ) {
      const res = await deleteUserByAdmin(userId);
      if (res.success) {
        setActionFeedback({ type: 'success', message: `Pengguna ${userName} telah dihapus dari sistem.` });
        loadData();
      } else {
        setActionFeedback({ type: 'error', message: res.message });
      }
    }
  };

  // Toggle Admin Role
  const handleToggleRole = async (user: AdminUserItem) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const res = await updateUserByAdmin(user.id, { role: newRole });
    if (res.success) {
      setActionFeedback({
        type: 'success',
        message: `Peran ${user.name} diubah menjadi ${newRole.toUpperCase()}!`,
      });
      loadData();
    }
  };

  // Broadcast Announcement
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    const res = await postAnnouncement({
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      category: broadcastCategory,
    });

    if (res.success) {
      setActionFeedback({
        type: 'success',
        message: 'Pengumuman berhasil disiarkan ke seluruh pengguna aplikasi!',
      });
      setBroadcastTitle('');
      setBroadcastMessage('');
      refreshAnnouncement();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (confirm('Hapus pengumuman aktif saat ini? Pengumuman tidak akan tampil lagi di layar pengguna.')) {
      const res = await deleteAnnouncement();
      if (res.success) {
        setActionFeedback({ type: 'success', message: 'Pengumuman telah dinonaktifkan.' });
        refreshAnnouncement();
      }
    }
  };

  // Change PIN
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await changeAdminPin(currentPin, newPin);
    if (res.success) {
      setPinFeedback('PIN Admin berhasil diperbarui!');
      setCurrentPin('');
      setNewPin('');
    } else {
      setPinFeedback(res.message);
    }
  };

  // Export Users to CSV
  const handleExportCSV = () => {
    if (!users || users.length === 0) return;
    const headers = [
      'ID',
      'Nama',
      'Telepon',
      'Umur',
      'Gender',
      'Berat (kg)',
      'Tinggi (cm)',
      'Target Air (ml)',
      'Target Olahraga (menit)',
      'Peran',
      'Total Log Air',
      'Total Log Olahraga',
      'Total Catatan',
      'Tanggal Bergabung',
    ];
    const rows = users.map((u) => [
      u.id,
      `"${u.name}"`,
      `"${u.phone}"`,
      u.age,
      u.gender,
      u.weight,
      u.height,
      u.targetWaterMl,
      u.dailyWorkoutMinutesTarget,
      u.role,
      u.waterLogsCount,
      u.workoutLogsCount,
      u.notesCount,
      `"${u.createdAt ? new Date(u.createdAt).toLocaleString('id-ID') : '-'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hidup_sehatku_pengguna_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in overflow-hidden">
      <div className="w-full max-w-4xl max-h-[94vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-[2px] shadow-lg shadow-amber-500/20 flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-amber-400">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Dasbor Panel Admin</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                  Admin Otoritas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kontrol pengguna terdaftar di Supabase PostgreSQL & analisis sistem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold px-3"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Segarkan Data</span>
            </button>
            <button
              onClick={() => setIsAdminModalOpen(false)}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Tutup Panel Admin"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div
            className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 bg-slate-950/50 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manajemen Pengguna ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Statistik & Metrik</span>
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Broadcast Pengumuman</span>
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'banners'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
           >
            <FileText className="w-3.5 h-3.5" />
            <span>Kelola Banner (8:2)</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Keamanan & Ekspor</span>
          </button>
          <button
            onClick={() => setActiveTab('instanpay')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'instanpay'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>InstantPay Gateway</span>
          </button>
          <button
            onClick={() => setActiveTab('qrcode')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'qrcode'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>QR Code Aplikasi</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* ======================================================== */}
          {/* TAB INSTANPAY GATEWAY */}
          {/* ======================================================== */}
          {activeTab === 'instanpay' && (
            <div className="space-y-5 max-w-2xl mx-auto animate-in fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 text-xs text-indigo-200 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <span>Dashboard Pengaturan InstantPay (QRIS)</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                        Payment Gateway
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Atur kredensial QRIS InstantPay, beralih antara mode **Sandbox** (Uji Coba) dan **Live** (Produksi), serta pantau transaksi pembayaran member PRO secara real-time.
                    </p>
                  </div>
                </div>
              </div>

              {instanpaySaveMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{instanpaySaveMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveInstanpayConfig} className="space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                {/* Environment Mode Toggle */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    Mode Lingkungan Transaksi (*Environment*)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInstanpayConfig((prev: any) => ({ ...prev, mode: 'sandbox' }))}
                      className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                        instanpayConfig.mode === 'sandbox'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                      <span>Sandbox (Uji Coba / Test)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstanpayConfig((prev: any) => ({ ...prev, mode: 'live' }))}
                      className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                        instanpayConfig.mode === 'live'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Live (Produksi / Real)</span>
                    </button>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* 1. KUNCI LIVE MODE (PRODUKSI) */}
                {/* ======================================================== */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" />
                        <span>Kunci Live Mode (Produksi / Transaksi Nyata)</span>
                      </h5>
                    </div>
                    {instanpayConfig.mode === 'live' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-black uppercase">
                        Sedang Aktif
                      </span>
                    )}
                  </div>

                  {/* Live Secret Key */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 block">Live API Secret Key</label>
                      {instanpayConfig.liveApiKey && (
                        <button
                          type="button"
                          onClick={() => handleCopyField(instanpayConfig.liveApiKey, 'liveApiKey')}
                          className="text-[10px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedField === 'liveApiKey' ? (
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
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showLiveSecret ? 'text' : 'password'}
                        value={instanpayConfig.liveApiKey}
                        onChange={(e) => setInstanpayConfig((prev: any) => ({ ...prev, liveApiKey: e.target.value }))}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                        placeholder="sk_live_..."
                        required={instanpayConfig.mode === 'live'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLiveSecret(!showLiveSecret)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                        title={showLiveSecret ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {showLiveSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* 2. KUNCI SANDBOX MODE (UJI COBA) */}
                {/* ======================================================== */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" />
                        <span>Kunci Sandbox Mode (Uji Coba / Testing)</span>
                      </h5>
                    </div>
                    {instanpayConfig.mode === 'sandbox' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black uppercase">
                        Sedang Aktif
                      </span>
                    )}
                  </div>

                  {/* Sandbox Secret Key */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 block">Sandbox API Secret Key</label>
                      {instanpayConfig.sandboxApiKey && (
                        <button
                          type="button"
                          onClick={() => handleCopyField(instanpayConfig.sandboxApiKey, 'sandboxApiKey')}
                          className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedField === 'sandboxApiKey' ? (
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
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showSandboxSecret ? 'text' : 'password'}
                        value={instanpayConfig.sandboxApiKey}
                        onChange={(e) => setInstanpayConfig((prev: any) => ({ ...prev, sandboxApiKey: e.target.value }))}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                        placeholder="sk_test_..."
                        required={instanpayConfig.mode === 'sandbox'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSandboxSecret(!showSandboxSecret)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                        title={showSandboxSecret ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {showSandboxSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Callback URL */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 block">Webhook / Callback URL</label>
                    {instanpayConfig.callbackUrl && (
                      <button
                        type="button"
                        onClick={() => handleCopyField(instanpayConfig.callbackUrl, 'callbackUrl')}
                        className="text-[10px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedField === 'callbackUrl' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin URL Webhook</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={instanpayConfig.callbackUrl}
                    onChange={(e) => setInstanpayConfig((prev: any) => ({ ...prev, callbackUrl: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Salin URL ini dan tempelkan ke menu <strong>Webhook & Log</strong> di dasbor InstanPay (mendukung <code className="text-indigo-400">/api/instantpay/webhook</code> & <code className="text-indigo-400">/api/instanpay/webhook</code>).
                  </p>
                </div>

                {/* Auto activate PRO */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <h5 className="text-xs font-bold text-white">Auto-Aktivasi PRO via Webhook</h5>
                    <p className="text-[10px] text-slate-400">Otomatis ubah status akun user menjadi PRO setelah pembayaran QRIS sukses.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={instanpayConfig.autoActivatePro}
                    onChange={(e) => setInstanpayConfig((prev: any) => ({ ...prev, autoActivatePro: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingInstanpay}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{isSavingInstanpay ? 'Menyimpan Konfigurasi...' : 'Simpan Pengaturan InstantPay'}</span>
                </button>
              </form>
            </div>
          )}
          {/* ======================================================== */}
          {/* TAB BANNERS */}
          {/* ======================================================== */}
          {activeTab === 'banners' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 text-xs text-cyan-200 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <span>Kelola Banner Image Slider Beranda (Rasio 8:1)</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        Sinkronisasi Global Multi-Browser
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Upload dan atur gambar banner beranda (Panjang 8 cm x Lebar 1 cm / Rasio 8:1). Setiap perubahan yang Anda simpan akan <strong>otomatis tersimpan di server dan langsung tampil di semua browser, perangkat handphone, maupun pengunjung lain</strong> tanpa perlu pengaturan manual lagi.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cyan-500/20">
                  <button
                    onClick={async () => {
                      setIsSavingAllBanners(true);
                      try {
                        const optimizedSlides = await Promise.all(
                          bannerForm.map(async (slide) => {
                            if (slide.imageUrl && slide.imageUrl.startsWith('data:image/')) {
                              const opt = await optimizeBannerImage(slide.imageUrl);
                              return { ...slide, imageUrl: opt };
                            }
                            return slide;
                          })
                        );
                        setBannerForm(optimizedSlides);
                        const res = await saveAllBannerSlides(optimizedSlides);
                        if (res.success) {
                          setActionFeedback({ type: 'success', message: 'Semua 3 slide banner berhasil disimpan secara global dan langsung tampil di semua browser!' });
                        } else {
                          setActionFeedback({ type: 'error', message: res.message || 'Gagal menyimpan banner' });
                        }
                      } catch (err: any) {
                        setActionFeedback({ type: 'error', message: err?.message || 'Gagal memproses gambar banner' });
                      } finally {
                        setIsSavingAllBanners(false);
                        setTimeout(() => setActionFeedback(null), 4000);
                      }
                    }}
                    disabled={isSavingAllBanners}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSavingAllBanners ? 'animate-spin' : ''}`} />
                    <span>{isSavingAllBanners ? 'Mengoptimasi & Menyimpan...' : 'Simpan Semua Slide (Aktif di Semua Browser)'}</span>
                  </button>

                  <button
                    onClick={async () => {
                      setIsRefreshingBanners(true);
                      await refreshBannersFromServer();
                      setIsRefreshingBanners(false);
                      setActionFeedback({ type: 'success', message: 'Data banner terbaru berhasil disegarkan dari server!' });
                      setTimeout(() => setActionFeedback(null), 3000);
                    }}
                    disabled={isRefreshingBanners}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingBanners ? 'animate-spin' : ''}`} />
                    <span>Segarkan dari Server</span>
                  </button>
                </div>
              </div>

              {bannerForm.map((slide, index) => (
                <div key={slide.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400">Slide Banner #{index + 1}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Rasio 8:1 (Panjang 8 cm x 1 cm)</span>
                  </div>

                  {/* Image Preview */}
                  <div className="relative w-full aspect-[8/1] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                    {slide.imageUrl ? (
                      <img
                        src={slide.imageUrl}
                        alt={`Preview Slide ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-500 text-xs">
                        Belum ada gambar yang di-upload untuk slide ini
                      </div>
                    )}
                  </div>

                  {/* File Upload Input */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Pilih Gambar Banner Baru (Format: JPEG, JPG, PNG, GIF, SVG)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const optimized = await optimizeBannerImage(file);
                            const updated = [...bannerForm];
                            updated[index] = { ...updated[index], imageUrl: optimized };
                            setBannerForm(updated);
                          } catch (err) {
                            console.error('Gagal mengoptimasi file gambar banner:', err);
                          }
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {slide.imageUrl ? (
                      <button
                        onClick={async () => {
                          const updated = [...bannerForm];
                          updated[index] = { ...updated[index], imageUrl: '' };
                          setBannerForm(updated);
                          await updateBannerSlide(index, updated[index]);
                          setActionFeedback({ type: 'success', message: `Gambar Slide #${index + 1} berhasil dikosongkan.` });
                          setTimeout(() => setActionFeedback(null), 3000);
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                      >
                        Hapus Gambar Slide
                      </button>
                    ) : <div />}

                    <button
                      onClick={async () => {
                        setSavingSlideIndex(index);
                        try {
                          let slideToSave = bannerForm[index];
                          if (slideToSave.imageUrl && slideToSave.imageUrl.startsWith('data:image/')) {
                            const opt = await optimizeBannerImage(slideToSave.imageUrl);
                            slideToSave = { ...slideToSave, imageUrl: opt };
                          }
                          await updateBannerSlide(index, slideToSave);
                          setActionFeedback({ type: 'success', message: `Gambar Slide #${index + 1} berhasil disimpan ke server dan tampil di semua browser!` });
                        } catch (err: any) {
                          setActionFeedback({ type: 'error', message: err?.message || `Gagal menyimpan slide #${index + 1}` });
                        } finally {
                          setSavingSlideIndex(null);
                          setTimeout(() => setActionFeedback(null), 3500);
                        }
                      }}
                      disabled={savingSlideIndex === index}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {savingSlideIndex === index ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan ke Server...</span>
                        </>
                      ) : (
                        <span>Simpan Gambar Slide #{index + 1}</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: MANAJEMEN PENGGUNA */}
          {/* ======================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Cari pengguna berdasarkan nama, nomor telepon, atau peran..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    disabled={users.length === 0}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 disabled:opacity-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor CSV</span>
                  </button>
                </div>
              </div>

              {/* Users List */}
              {loading ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                  <p className="text-xs">Memuat data pengguna dari Supabase PostgreSQL...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800 p-6">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-300">Belum ada pengguna ditemukan</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {searchQuery
                      ? 'Tidak ada pengguna yang cocok dengan kata kunci pencarian.'
                      : 'Belum ada pengguna yang mendaftar di Supabase.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      {/* User Info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[2px] flex-shrink-0">
                          <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-cyan-300 font-extrabold text-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-extrabold text-white truncate">
                              {u.name}
                            </span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                u.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                            {u.gender && (
                              <span className="text-[10px] text-slate-400">
                                ({u.gender === 'pria' ? 'L' : 'P'}, {u.age} thn)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                            {u.phone && u.phone !== '-' && (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-slate-500" />
                                {u.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Scale className="w-3 h-3 text-slate-500" />
                              {u.weight} kg / {u.height} cm
                            </span>
                            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                              <Droplets className="w-3 h-3" />
                              Target: {u.targetWaterMl} ml
                            </span>
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <Flame className="w-3 h-3" />
                              Target: {u.dailyWorkoutMinutesTarget} mnt
                            </span>
                          </div>

                          {/* Activity Logs Count Badges */}
                          <div className="flex items-center gap-2 mt-2 text-[10px]">
                            <span className="px-2 py-0.5 rounded-lg bg-cyan-950/40 text-cyan-300 border border-cyan-500/20">
                              💧 {u.waterLogsCount} log minum
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/20">
                              🏃 {u.workoutLogsCount} log olahraga
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-purple-950/40 text-purple-300 border border-purple-500/20">
                              📝 {u.notesCount} catatan
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                        <button
                          onClick={() => handleViewDetails(u.id)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
                          title="Lihat Riwayat & Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 hover:text-amber-200 transition-colors"
                          title="Ubah Target / Data Pengguna"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleRole(u)}
                          className={`p-2 rounded-xl transition-colors ${
                            u.role === 'admin'
                              ? 'bg-amber-950/40 text-amber-400 hover:bg-amber-900/50'
                              : 'bg-slate-800 text-slate-400 hover:text-amber-300'
                          }`}
                          title={u.role === 'admin' ? 'Turunkan ke Pengguna Biasa' : 'Jadikan Admin'}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleResetUser(u.id, u.name)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-950/40 text-cyan-400 hover:text-cyan-300 transition-colors"
                          title="Reset Riwayat ke 0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition-colors"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: STATISTIK & METRIK SISTEM */}
          {/* ======================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Pengguna Terdaftar</span>
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {stats?.totalUsers || users.length}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                    ✓ Aktif di Supabase
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Total Air Diminum</span>
                    <Droplets className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">
                    {((stats?.totalWaterMl || 0) / 1000).toFixed(1)} L
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                    {stats?.totalWaterLogs || 0} catatan log
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Total Olahraga</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {stats?.totalWorkoutMinutes || 0} mnt
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                    {stats?.totalWorkoutLogs || 0} sesi olahraga
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Kalori Terbakar</span>
                    <Flame className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-rose-400 font-mono">
                    {stats?.totalCalories || 0} kkal
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                    Aktivitas fisik kumulatif
                  </span>
                </div>
              </div>

              {/* Status Server Database */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Infrastruktur Supabase PostgreSQL</span>
                  </h4>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    🟢 ONLINE & OPERASIONAL
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-850">
                    <span className="text-[10px] text-slate-400 block">Tabel Profiles</span>
                    <strong className="text-white text-sm font-mono">{users.length} akun</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-850">
                    <span className="text-[10px] text-slate-400 block">Tabel Water Logs</span>
                    <strong className="text-cyan-400 text-sm font-mono">{stats?.totalWaterLogs || 0} baris</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-850">
                    <span className="text-[10px] text-slate-400 block">Tabel Workout Logs</span>
                    <strong className="text-emerald-400 text-sm font-mono">{stats?.totalWorkoutLogs || 0} baris</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: BROADCAST PENGUMUMAN */}
          {/* ======================================================== */}
          {activeTab === 'broadcast' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-1">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span>Siarkan Pesan / Pengumuman ke Pengguna</span>
                </h4>
                <p className="text-[11px] text-slate-400 mb-4">
                  Pesan yang Anda buat di sini akan otomatis muncul sebagai banner penting di halaman depan seluruh pengguna aplikasi.
                </p>

                <form onSubmit={handleBroadcast} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      Kategori Pengumuman
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['info', 'warning', 'challenge', 'tips'] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setBroadcastCategory(cat)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold capitalize transition-all ${
                            broadcastCategory === cat
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      Judul Pengumuman <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Tantangan Minum 2.5L Hari Ini!"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      Isi Pesan Pengumuman <span className="text-amber-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Tuliskan pesan kesehatan atau pemberitahuan penting untuk seluruh pengguna..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-amber-500 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Siarkan Pengumuman Sekarang</span>
                  </button>
                </form>
              </div>

              {/* Status Pengumuman Saat Ini */}
              {activeAnnouncement && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>Pengumuman Sedang Aktif di Aplikasi</span>
                    </span>
                    <button
                      onClick={handleDeleteAnnouncement}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus Pengumuman</span>
                    </button>
                  </div>
                  <h5 className="text-xs font-extrabold text-white">{activeAnnouncement.title}</h5>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {activeAnnouncement.message}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: KEAMANAN & PENGATURAN ADMIN */}
          {/* ======================================================== */}
          {activeTab === 'security' && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-1">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Ubah PIN Akses Administrator</span>
                </h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Ganti PIN admin untuk mencegah akses yang tidak diizinkan.
                </p>

                {pinFeedback && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-300 text-center mb-3">
                    {pinFeedback}
                  </div>
                )}

                <form onSubmit={handleChangePin} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      PIN Admin Saat Ini
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="PIN saat ini (standar: 8820)"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      PIN Baru (Minimal 4 Angka)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      placeholder="Masukkan PIN baru"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <span>Simpan PIN Baru</span>
                  </button>
                </form>
              </div>

              {/* Ekspor Laporan Lengkap */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <h4 className="font-bold text-white flex items-center gap-2 mb-1">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Cadangan & Ekspor Data Pengguna</span>
                </h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Unduh seluruh daftar data pengguna dan target hidrasi dalam format CSV untuk dianalisis di Excel atau Google Sheets.
                </p>
                <button
                  onClick={handleExportCSV}
                  disabled={users.length === 0}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Data CSV Sekarang</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB QR CODE APLIKASI (DOWNLOAD & SHARE) */}
          {/* ======================================================== */}
          {activeTab === 'qrcode' && (
            <div className="space-y-5 max-w-xl mx-auto animate-in fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/70 via-slate-900 to-emerald-950/70 border border-teal-500/40 text-xs text-teal-200 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <span>QR Code Resmi Aplikasi Hidup Sehatku</span>
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold">
                        Bagikan & Promosi
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Admin dapat mengunduh QR Code aplikasi ini untuk dibagikan ke media sosial, poster kesehatan, atau kartu nama rekan sehat. Pengguna cukup memindai untuk langsung masuk ke aplikasi.
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code Preview Card */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-white rounded-2xl shadow-inner border-4 border-teal-500/35 flex items-center justify-center">
                  <img
                    id="admin-app-qrcode-img"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                      window.location.origin || 'https://www.hidupsehatku.my.id'
                    )}`}
                    alt="QR Code Aplikasi Hidup Sehatku"
                    className="w-52 h-52 object-contain rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white">hidupsehatku.my.id</h3>
                  <p className="text-[11px] text-slate-400 font-mono break-all max-w-sm">
                    {window.location.origin || 'https://www.hidupsehatku.my.id'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                        window.location.origin || 'https://www.hidupsehatku.my.id'
                      )}`;
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'QRCode-HidupSehatKu.png';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      setActionFeedback({ type: 'success', message: 'QR Code berhasil diunduh dalam resolusi tinggi!' });
                      setTimeout(() => setActionFeedback(null), 3000);
                    }}
                    className="py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Unduh Gambar QR (PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const appUrl = window.location.origin || 'https://www.hidupsehatku.my.id';
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(appUrl);
                        setActionFeedback({ type: 'success', message: 'Tautan aplikasi berhasil disalin ke clipboard!' });
                        setTimeout(() => setActionFeedback(null), 3000);
                      }
                    }}
                    className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-teal-400" />
                    <span>Salin Tautan Aplikasi</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Sub-view: Detail Pengguna Lengkap */}
        {selectedUserDetail && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 p-4 sm:p-6 overflow-y-auto flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Riwayat Lengkap: {selectedUserDetail.profile?.name}</span>
              </h3>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Profil Detail */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Nama</span>
                  <strong className="text-white">{selectedUserDetail.profile?.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">No Telepon</span>
                  <strong className="text-white font-mono">{selectedUserDetail.profile?.phone || '-'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Target Air</span>
                  <strong className="text-cyan-400 font-mono">{selectedUserDetail.profile?.target_water_ml} ml/hari</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Target Olahraga</span>
                  <strong className="text-emerald-400 font-mono">{selectedUserDetail.profile?.daily_workout_minutes_target} mnt/hari</strong>
                </div>
              </div>

              {/* Log Minum Air */}
              <div>
                <h4 className="font-bold text-cyan-300 mb-2">💧 Riwayat Minum Air Terbaru</h4>
                {selectedUserDetail.waterLogs.length === 0 ? (
                  <p className="text-slate-500 italic">Belum ada catatan minum air.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedUserDetail.waterLogs.map((w: any) => (
                      <div key={w.id} className="p-2 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-between text-[11px]">
                        <span>{w.date} ({w.time})</span>
                        <strong className="text-cyan-400 font-mono">+{w.amount_ml} ml ({w.container_type})</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Log Olahraga */}
              <div>
                <h4 className="font-bold text-emerald-300 mb-2">🏃 Riwayat Olahraga Terbaru</h4>
                {selectedUserDetail.workoutLogs.length === 0 ? (
                  <p className="text-slate-500 italic">Belum ada catatan olahraga.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedUserDetail.workoutLogs.map((wk: any) => (
                      <div key={wk.id} className="p-2 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-between text-[11px]">
                        <span>{wk.date} ({wk.time}) - {wk.activity_name}</span>
                        <strong className="text-emerald-400 font-mono">{wk.duration_minutes} menit ({wk.calories_burned} kkal)</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Sub-view: Edit Pengguna */}
        {editingUser && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 p-4 sm:p-6 overflow-y-auto flex flex-col justify-center animate-in fade-in">
            <div className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 className="text-sm font-extrabold text-white">
                  Ubah Data Pengguna: {editingUser.name}
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">No Telepon</label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Peran Akun</label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    >
                      <option value="user">User Biasa</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Target Air (ml)</label>
                    <input
                      type="number"
                      required
                      value={editFormData.targetWaterMl}
                      onChange={(e) => setEditFormData({ ...editFormData, targetWaterMl: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Target Olahraga (mnt)</label>
                    <input
                      type="number"
                      required
                      value={editFormData.dailyWorkoutMinutesTarget}
                      onChange={(e) => setEditFormData({ ...editFormData, dailyWorkoutMinutesTarget: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
