import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  Calendar,
  Clock,
  Bell,
  BellRing,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Sparkles,
  Droplets,
  Dumbbell,
  Heart,
  Smile,
  Frown,
  Meh,
  Volume2,
  X,
  AlertCircle,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { HealthNote, NoteCategory, HealthAlarm } from '../types';

export const NotesTab: React.FC = () => {
  const {
    notes,
    addNote,
    updateNote,
    deleteNote,
    alarms,
    addAlarm,
    toggleAlarm,
    deleteAlarm,
    testAlarmSound,
    selectedDate,
    setSelectedDate,
  } = useHealth();

  const [activeSection, setActiveSection] = useState<'notes' | 'alarms'>('notes');
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isAddAlarmOpen, setIsAddAlarmOpen] = useState(false);

  // Form State: Add Note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('hidrasi');
  const [noteMood, setNoteMood] = useState<'hebat' | 'sehat' | 'biasa' | 'lelah'>('sehat');
  const [hasAlarm, setHasAlarm] = useState(false);
  const [alarmTime, setAlarmTime] = useState('09:00');

  // Form State: Add Custom Alarm
  const [customAlarmLabel, setCustomAlarmLabel] = useState('');
  const [customAlarmTime, setCustomAlarmTime] = useState('10:00');
  const [customAlarmType, setCustomAlarmType] = useState<HealthAlarm['type']>('minum');

  // Today Date calculations
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(
    todayObj.getDate()
  ).padStart(2, '0')}`;

  const currentFormattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(selectedDate));

  // Filter notes for currently selected date
  const filteredNotes = notes.filter((n) => n.date === selectedDate);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    addNote({
      date: selectedDate,
      time: currentTime,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      category: noteCategory,
      mood: noteMood,
      hasAlarm,
      alarmTime: hasAlarm ? alarmTime : undefined,
      isAlarmActive: hasAlarm,
      completed: false,
    });

    // Reset Form
    setNoteTitle('');
    setNoteContent('');
    setHasAlarm(false);
    setIsAddNoteOpen(false);
  };

  const handleCreateAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAlarmLabel.trim()) return;

    addAlarm({
      label: customAlarmLabel.trim(),
      time: customAlarmTime,
      days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      isActive: true,
      type: customAlarmType,
      soundEnabled: true,
    });

    setCustomAlarmLabel('');
    setIsAddAlarmOpen(false);
  };

  const getCategoryBadge = (cat: NoteCategory) => {
    switch (cat) {
      case 'hidrasi':
        return { label: 'Hidrasi Air', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      case 'olahraga':
        return { label: 'Olahraga', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'makanan':
        return { label: 'Makanan Sehat', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'mood':
        return { label: 'Mood & Istirahat', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'kesehatan':
        return { label: 'Kesehatan Fisik', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      default:
        return { label: 'Catatan Umum', color: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'hebat':
        return <span className="text-sm" title="Hebat & Segar">🤩</span>;
      case 'sehat':
        return <span className="text-sm" title="Bugar Sehat">😊</span>;
      case 'biasa':
        return <span className="text-sm" title="Cukup Biasa">😐</span>;
      case 'lelah':
        return <span className="text-sm" title="Butuh Istirahat">😴</span>;
      default:
        return null;
    }
  };

  // Find next upcoming alarm today
  const currentNowStr = `${String(todayObj.getHours()).padStart(2, '0')}:${String(
    todayObj.getMinutes()
  ).padStart(2, '0')}`;
  const upcomingAlarm = alarms
    .filter((a) => a.isActive && a.time >= currentNowStr)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  return (
    <div className="space-y-4 pb-28">
      {/* Top Date Hero Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 p-4 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                Catatan & Alarm Hari Ini
              </span>
              <h2 className="text-base font-extrabold text-white capitalize">
                {currentFormattedDate}
              </h2>
            </div>
          </div>

          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-colors"
            >
              Hari Ini
            </button>
          )}
        </div>

        {/* Next Alarm Alert Bar */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block">Alarm Terdekat:</span>
              <span className="text-xs font-bold text-white truncate block">
                {upcomingAlarm ? (
                  <>
                    <span className="text-amber-400 font-extrabold mr-1">{upcomingAlarm.time}</span>
                    <span>{upcomingAlarm.label}</span>
                  </>
                ) : (
                  'Tidak ada alarm aktif lagi hari ini'
                )}
              </span>
            </div>
          </div>

          <button
            onClick={testAlarmSound}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            title="Uji coba nada dering alarm"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">Tes Suara</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Catatan vs Daftar Alarm */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setActiveSection('notes')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSection === 'notes'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Catatan Hari Ini ({filteredNotes.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('alarms')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSection === 'alarms'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Pengingat & Alarm ({alarms.filter((a) => a.isActive).length})</span>
        </button>
      </div>

      {/* SECTION 1: CATATAN HARI INI */}
      {activeSection === 'notes' && (
        <div className="space-y-3">
          {/* Add Note Button Trigger */}
          <button
            onClick={() => setIsAddNoteOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tulis Catatan Kesehatan Hari Ini</span>
          </button>

          {/* List of Notes */}
          {filteredNotes.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Belum Ada Catatan</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                Catat bagaimana kondisi tubuh Anda hari ini, target minum, olahraga, atau pasang alarm pengingat.
              </p>
              <button
                onClick={() => setIsAddNoteOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold"
              >
                + Buat Catatan Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredNotes.map((note) => {
                const badge = getCategoryBadge(note.category);
                return (
                  <div
                    key={note.id}
                    className={`rounded-2xl border p-4 transition-all duration-200 ${
                      note.completed
                        ? 'bg-slate-900/40 border-slate-850 opacity-75'
                        : 'bg-slate-900/90 border-slate-800 shadow-md hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => updateNote(note.id, { completed: !note.completed })}
                          className="flex-shrink-0 text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          {note.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <h4
                            className={`text-sm font-bold text-white truncate ${
                              note.completed ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {note.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>{note.time}</span>
                            <span>·</span>
                            <span className={`px-1.5 py-0.2 rounded border text-[10px] font-semibold ${badge.color}`}>
                              {badge.label}
                            </span>
                            {getMoodIcon(note.mood)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {note.content && (
                      <p className="text-xs text-slate-300 leading-relaxed pl-7 mb-2">
                        {note.content}
                      </p>
                    )}

                    {/* Alarm Indicator in Note */}
                    {note.hasAlarm && (
                      <div className="ml-7 mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                        <Bell className="w-3 h-3 text-amber-400 animate-pulse" />
                        <span>Alarm Pengingat: {note.alarmTime}</span>
                        <span className="text-[10px] text-slate-400">
                          ({note.isAlarmActive ? 'Aktif' : 'Mati'})
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: ALARM & PENGINGAT SEHAT */}
      {activeSection === 'alarms' && (
        <div className="space-y-3">
          {/* Add Alarm Trigger */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300">
              Alarm Rutinitas Hidup Sehat:
            </span>

            <button
              onClick={() => setIsAddAlarmOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Alarm</span>
            </button>
          </div>

          {/* Alarm Items List */}
          <div className="space-y-2">
            {alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  alarm.isActive
                    ? 'bg-slate-900 border-slate-800 shadow-md'
                    : 'bg-slate-900/50 border-slate-850 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      alarm.isActive
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-white">
                        {alarm.time}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {alarm.type === 'minum' ? '💧 Minum' : alarm.type === 'olahraga' ? '🏃 Olahraga' : '⏰ Pengingat'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-300 font-semibold block truncate">
                      {alarm.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {alarm.days.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAlarm(alarm.id)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      alarm.isActive ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                    title={alarm.isActive ? 'Nonaktifkan Alarm' : 'Aktifkan Alarm'}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        alarm.isActive ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => deleteAlarm(alarm.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Hapus Alarm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH CATATAN BARU */}
      {isAddNoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddNoteOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Catatan Kesehatan Baru</h3>
                <p className="text-xs text-slate-400">Tanggal: {currentFormattedDate}</p>
              </div>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3.5">
              {/* Note Title */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Judul Catatan
                </label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Contoh: Minum 500ml air hangat, Paha rileks..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Category Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Kategori
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'hidrasi', label: '💧 Hidrasi' },
                      { id: 'olahraga', label: '🏃 Olahraga' },
                      { id: 'makanan', label: '🥗 Makanan' },
                      { id: 'mood', label: '🧘 Mood' },
                      { id: 'kesehatan', label: '💊 Fisik' },
                      { id: 'umum', label: '📝 Umum' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNoteCategory(cat.id)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        noteCategory === cat.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Feeling */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Kondisi / Perasaan Tubuh
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'hebat', emoji: '🤩', label: 'Hebat' },
                    { id: 'sehat', emoji: '😊', label: 'Bugar' },
                    { id: 'biasa', emoji: '😐', label: 'Biasa' },
                    { id: 'lelah', emoji: '😴', label: 'Lelah' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setNoteMood(m.id as any)}
                      className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        noteMood === m.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-lg">{m.emoji}</span>
                      <span className="text-[10px] font-semibold">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note Content */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Isi Catatan & Evaluasi
                </label>
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Ceritakan rutinitas minum, olahraga, atau keluhan tubuh yang dirasakan..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Alarm Checkbox */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Pasang Alarm Pengingat
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Alarm akan berdering pada jam yang ditentukan
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={hasAlarm}
                  onChange={(e) => setHasAlarm(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              {/* Alarm Time Input if enabled */}
              {hasAlarm && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">Jam Alarm:</span>
                  <input
                    type="time"
                    value={alarmTime}
                    onChange={(e) => setAlarmTime(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-white font-bold text-xs"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
              >
                Simpan Catatan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH ALARM RUTIN BARU */}
      {isAddAlarmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl relative">
            <button
              onClick={() => setIsAddAlarmOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tambah Alarm Sehat</h3>
                <p className="text-xs text-slate-400">Atur pengingat jam minum atau olahraga</p>
              </div>
            </div>

            <form onSubmit={handleCreateAlarm} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama / Label Alarm
                </label>
                <input
                  type="text"
                  required
                  value={customAlarmLabel}
                  onChange={(e) => setCustomAlarmLabel(e.target.value)}
                  placeholder="Contoh: Minum Air Jam 10, Jalan Kaki..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Jam Alarm
                </label>
                <input
                  type="time"
                  required
                  value={customAlarmTime}
                  onChange={(e) => setCustomAlarmTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono text-center font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Jenis Aktivitas
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'minum', label: '💧 Minum' },
                    { id: 'olahraga', label: '🏃 Olahraga' },
                    { id: 'istirahat', label: '☕ Rehat' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCustomAlarmType(t.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                        customAlarmType === t.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
              >
                Pasang Alarm
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
