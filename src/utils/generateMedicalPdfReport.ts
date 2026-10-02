export function printMedicalReport(
  profile: any,
  todayRecord: any,
  aiAnalysis: any,
  todayWaterByPeriod: any,
  weeklySummary: any,
  monthlySummary: any
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Mohon izinkan pop-up peramban untuk mengunduh/mencetak Laporan PDF Medis.');
    return;
  }

  const todayDateStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Medis Kesehatan & Hidrasi - ${profile?.name || 'Pasien'}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 30px;
          background: #fff;
        }
        .header {
          border-bottom: 3px solid #0284c7;
          padding-bottom: 15px;
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand {
          font-size: 22px;
          font-weight: 800;
          color: #0369a1;
        }
        .sub-brand {
          font-size: 12px;
          color: #64748b;
          margin-top: 3px;
        }
        .doc-title {
          text-align: right;
        }
        .doc-title h1 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
        }
        .doc-title p {
          margin: 3px 0 0 0;
          font-size: 11px;
          color: #64748b;
        }
        .patient-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          font-size: 12px;
        }
        .patient-box div strong {
          color: #334155;
          display: block;
          font-size: 10px;
          text-transform: uppercase;
        }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #0284c7;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
          margin-top: 25px;
          margin-bottom: 12px;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .stat-card {
          background: #f1f5f9;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
        }
        .stat-card .val {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-top: 8px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px;
          text-align: left;
        }
        th {
          background: #e2e8f0;
          color: #334155;
          font-weight: 700;
        }
        .recommendation-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 12px;
          font-size: 12px;
          color: #166534;
          margin-top: 15px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          font-size: 11px;
          color: #64748b;
        }
        .stamp-box {
          border: 2px dashed #0284c7;
          padding: 10px 15px;
          border-radius: 8px;
          text-align: center;
          color: #0284c7;
          font-weight: 700;
          font-size: 11px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
          🖨️ Cetak / Simpan sebagai PDF
        </button>
      </div>

      <div class="header">
        <div>
          <div class="brand">HIDUP SEHATKU — CLINICAL LAB</div>
          <div class="sub-brand">Laporan Medis Rekam Jejak Hidrasi, Nutrisi, & Kebugaran AI</div>
        </div>
        <div class="doc-title">
          <h1>REKAM MEDIS PASIEN</h1>
          <p>Tanggal Cetak: ${todayDateStr}</p>
        </div>
      </div>

      <div class="patient-box">
        <div><strong>Nama Pasien</strong> ${profile?.name || 'Pasien Sehat'}</div>
        <div><strong>Nomor HP / Kontak</strong> ${profile?.phone || '-'}</div>
        <div><strong>Email Terdaftar</strong> ${profile?.email || '-'}</div>
        <div><strong>Usia / Gender</strong> ${profile?.age || 25} Tahun / ${profile?.gender === 'pria' ? 'Pria' : 'Wanita'}</div>
        <div><strong>Berat / Tinggi</strong> ${profile?.weight || 60} kg / ${profile?.height || 165} cm</div>
        <div><strong>Status Akun</strong> Member PRO Terverifikasi 👑</div>
      </div>

      <div class="section-title">1. RINGKASAN STATUS HIDRASI & KEBUGARAN HARIAN</div>
      <div class="grid-2">
        <div class="stat-card">
          <span>Total Asupan Air Hari Ini:</span>
          <div class="val">${todayRecord?.totalWaterMl || 0} / ${profile?.targetWaterMl || 2500} ml</div>
          <small>Capaian: ${Math.round(((todayRecord?.totalWaterMl || 0) / (profile?.targetWaterMl || 2500)) * 100)}%</small>
        </div>
        <div class="stat-card">
          <span>Olahraga & Kalori Terbakar:</span>
          <div class="val">${todayRecord?.totalWorkoutMinutes || 0} Menit (${todayRecord?.totalCalories || 0} kcal)</div>
          <small>Target Olahraga: ${profile?.dailyWorkoutMinutesTarget || 30} Menit</small>
        </div>
      </div>

      <div class="section-title">2. DISTRIBUSI ASUPAN AIR PER PERIODE WAKTU</div>
      <table>
        <thead>
          <tr>
            <th>Periode Waktu</th>
            <th>Jam Rata-Rata</th>
            <th>Volume Air (ml)</th>
            <th>Status Evaluasi Medis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pagi Hari (05:00 - 11:00)</td>
            <td>07:00</td>
            <td>${todayWaterByPeriod?.morning || 0} ml</td>
            <td>${(todayWaterByPeriod?.morning || 0) >= 500 ? 'Sangat Baik (Mengaktifkan Organ)' : 'Cukup'}</td>
          </tr>
          <tr>
            <td>Siang Hari (11:00 - 15:00)</td>
            <td>12:30</td>
            <td>${todayWaterByPeriod?.afternoon || 0} ml</td>
            <td>${(todayWaterByPeriod?.afternoon || 0) >= 600 ? 'Optimal (Menjaga Konsentrasi)' : 'Cukup'}</td>
          </tr>
          <tr>
            <td>Sore Hari (15:00 - 18:30)</td>
            <td>16:30</td>
            <td>${todayWaterByPeriod?.evening || 0} ml</td>
            <td>${(todayWaterByPeriod?.evening || 0) >= 400 ? 'Baik (Persiapan Olahraga)' : 'Cukup'}</td>
          </tr>
          <tr>
            <td>Malam Hari (18:30 - 23:00)</td>
            <td>20:00</td>
            <td>${todayWaterByPeriod?.night || 0} ml</td>
            <td>${(todayWaterByPeriod?.night || 0) > 0 ? 'Terjaga (Mencegah Kram Malam)' : 'Cukup'}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">3. AKUMULASI PERKEMBANGAN MINGGUAN & BULANAN</div>
      <div class="grid-2">
        <div class="stat-card">
          <span>Total Air Minum Minggu Ini:</span>
          <div class="val">${weeklySummary?.totalWaterLiters || 0} Liter</div>
          <small>Rata-Rata: ${weeklySummary?.avgWaterMl || 0} ml/hari</small>
        </div>
        <div class="stat-card">
          <span>Total Olahraga Bulan Ini:</span>
          <div class="val">${monthlySummary?.totalWorkoutHours || 0} Jam</div>
          <small>Aktivitas Terbanyak: ${monthlySummary?.topActivity || 'Jalan Kaki'}</small>
        </div>
      </div>

      <div class="section-title">4. DIAGNOSIS & REKOMENDASI DOKTER AI MEDIS</div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 12px;">
        <p><strong>Golongan Kebugaran:</strong> ${aiAnalysis?.category || 'Pejuang Hidup Sehat Bugar'}</p>
        <p><strong>Skor Kebugaran AI:</strong> ${aiAnalysis?.overallScore || 88} / 100</p>
        <p><strong>Ulasan Klinis:</strong> ${aiAnalysis?.waterFeedback || 'Pola minum dan olahraga berjalan seimbang.'}</p>
      </div>

      ${
        aiAnalysis?.recommendations && aiAnalysis.recommendations.length > 0
          ? `<div class="recommendation-box">
              <strong>💡 Rekomendasi Terapi & Aktivitas Harian:</strong>
              <ul style="margin: 5px 0 0 15px; padding: 0;">
                ${aiAnalysis.recommendations.map((r: string) => `<li>${r}</li>`).join('')}
              </ul>
             </div>`
          : ''
      }

      <div class="footer">
        <div>
          <p>Dokumen ini diterbitkan secara resmi oleh sistem <strong>Hidup Sehatku Pro</strong>.</p>
          <p>Dapat diperlihatkan kepada dokter umum / spesialis saat pemeriksaan rutin.</p>
        </div>
        <div class="stamp-box">
          VERIFIED MEDICAL REPORT<br>
          HIDUP SEHATKU PRO 👑
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 600);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
