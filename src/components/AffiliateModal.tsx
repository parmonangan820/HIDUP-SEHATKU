import React, { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import { getAffiliateStats, saveAffiliateStats, PROMO_TEMPLATES, AffiliateStats } from '../services/affiliateService';
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
  ArrowUpRight,
  Sparkles,
  MessageSquare,
  X,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AffiliateModal: React.FC<AffiliateModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useHealth();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplateIndex, setCopiedTemplateIndex] = useState<number | null>(null);
  const [payoutRequested, setPayoutRequested] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      const data = getAffiliateStats(profile.id || 'default-user', profile.name || 'Member');
      setStats(data);
    }
  }, [isOpen, profile]);

  if (!isOpen || !stats) return null;

  const affiliateUrl = `${window.location.origin}/?ref=${stats.affiliateCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateUrl);
    setCopiedLink(true);
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch (e) {}
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyTemplate = (text: string, index: number) => {
    const fullText = text.replace(/\[AFF_LINK\]/g, affiliateUrl);
    navigator.clipboard.writeText(fullText);
    setCopiedTemplateIndex(index);
    setTimeout(() => setCopiedTemplateIndex(null), 2000);
  };

  const handleRequestPayout = () => {
    if (stats.pendingEarnings <= 0) {
      alert('Saldo komisi tertunda Anda masih Rp 0.');
      return;
    }
    setPayoutRequested(true);
    const updated = {
      ...stats,
      paidEarnings: stats.paidEarnings + stats.pendingEarnings,
      pendingEarnings: 0,
    };
    setStats(updated);
    saveAffiliateStats(profile.id || 'default-user', updated);
    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    } catch (e) {}
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-amber-500/30 p-5 sm:p-6 shadow-2xl relative text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-600 p-[2px] shadow-lg shadow-amber-500/20 flex-shrink-0">
            <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-amber-300">
              <Share2 className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">Affiliate Hidup Sehatku</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black uppercase">
                Komisi 10%
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Bagikan link affiliate Anda dan dapatkan 10% dari setiap teman yang mendaftar dan membeli versi PRO.
            </p>
          </div>
        </div>

        {/* Affiliate Link Box */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-600/10 border border-amber-500/30">
          <label className="text-xs font-bold text-amber-300 block mb-1.5 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Link Affiliate Unik Anda:</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={affiliateUrl}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/25 active:scale-95 transition-all flex-shrink-0"
            >
              {copiedLink ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Tersalin!' : 'Salin Link'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Kode Affiliate Anda: <strong className="text-amber-400 font-mono">{stats.affiliateCode}</strong>
          </p>
        </div>

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-medium block">Total Klik Link</span>
            <span className="text-xl font-extrabold text-cyan-300 mt-1 block">{stats.totalClicks}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-medium block">Total Referral</span>
            <span className="text-xl font-extrabold text-white mt-1 block">{stats.totalReferrals}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-medium block">Member PRO</span>
            <span className="text-xl font-extrabold text-amber-400 mt-1 block">{stats.proReferrals}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 font-medium block">Total Komisi</span>
            <span className="text-lg font-black text-emerald-400 mt-1 block">{formatRupiah(stats.totalEarnings)}</span>
          </div>
        </div>

        {/* Payout Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Saldo Komisi Siap Dicairkan (Pending)</span>
              <span className="text-lg font-black text-white">{formatRupiah(stats.pendingEarnings)}</span>
              {stats.paidEarnings > 0 && (
                <span className="text-[10px] text-slate-500 block">Sudah dicairkan: {formatRupiah(stats.paidEarnings)}</span>
              )}
            </div>
          </div>

          <button
            onClick={handleRequestPayout}
            disabled={stats.pendingEarnings <= 0}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
          >
            <DollarSign className="w-4 h-4" />
            <span>Tarik Komisi (Payout)</span>
          </button>
        </div>

        {/* Payout Success Notice */}
        {payoutRequested && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Permintaan pencairan komisi berhasil diajukan! Dana akan ditransfer ke rekening / E-Wallet terdaftar dalam 1x24 jam.</span>
          </div>
        )}

        {/* Promo Templates Section */}
        <div className="mb-6 space-y-3">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Kalimat Promosi Siap Salin (Copy-Paste)</span>
          </h3>
          <div className="space-y-3">
            {PROMO_TEMPLATES.map((tpl, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">{tpl.title}</span>
                  <button
                    onClick={() => handleCopyTemplate(tpl.text, idx)}
                    className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    {copiedTemplateIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTemplateIndex === idx ? 'Tersalin!' : 'Salin Teks'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-850 font-mono whitespace-pre-wrap leading-relaxed">
                  {tpl.text.replace(/\[AFF_LINK\]/g, affiliateUrl)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Referrals History Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Daftar Referral & Komisi Anda ({stats.referrals.length})</span>
          </h3>

          <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                    <th className="p-3 font-semibold">Nama Pengguna</th>
                    <th className="p-3 font-semibold">Tanggal Daftar</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">Komisi (10%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats.referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-300 font-black text-xs">
                          {ref.referredName.charAt(0)}
                        </div>
                        <span>{ref.referredName}</span>
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {new Date(ref.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3">
                        {ref.isPro ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                            <Crown className="w-3 h-3 fill-amber-300" />
                            <span>PRO ({ref.planPurchased === 'annual' ? 'Tahunan' : 'Bulanan'})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium text-[10px]">
                            <span>Free Member</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-emerald-400">
                        {ref.commissionEarned > 0 ? formatRupiah(ref.commissionEarned) : 'Rp 0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
