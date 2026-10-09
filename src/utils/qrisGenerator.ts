export function calculateCRC16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const c = data.charCodeAt(i);
    crc ^= c << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function formatTag(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

export function parseQrisTags(qrisStr: string): Map<string, string> {
  const tags = new Map<string, string>();
  let i = 0;
  const str = qrisStr.trim();
  while (i < str.length) {
    if (i + 4 > str.length) break;
    const tag = str.substring(i, i + 2);
    const len = parseInt(str.substring(i + 2, i + 4), 10);
    if (isNaN(len) || len < 0) break;
    const val = str.substring(i + 4, i + 4 + len);
    tags.set(tag, val);
    i = i + 4 + len;
  }
  return tags;
}

/**
 * Konversi QRIS Statis (misalnya dari BCA, GoPay, DANA Bisnis, ShopeePay)
 * menjadi QRIS Dinamis (010212) dengan nominal Rupiah tetap & Order ID unik.
 */
export function convertStaticToDynamicQRIS(
  staticQris: string,
  amount: number,
  orderId: string,
  merchantNameOverride?: string
): string {
  let cleanStr = staticQris.trim();
  // Lepas tag CRC lama (6304XXXX) jika ada di akhir
  const crcIndex = cleanStr.lastIndexOf('6304');
  if (crcIndex !== -1 && crcIndex >= cleanStr.length - 8) {
    cleanStr = cleanStr.substring(0, crcIndex);
  }

  const tags = parseQrisTags(cleanStr);
  if (!tags.has('00')) {
    tags.set('00', '01');
  }
  // Ubah tipe dari Statis (11) menjadi Dinamis (12)
  tags.set('01', '12');

  // Tag 54: Nominal (angka bulat Rupiah)
  const amountStr = Math.round(amount).toString();
  tags.set('54', amountStr);

  // Tag 53: IDR (360)
  if (!tags.has('53')) {
    tags.set('53', '360');
  }

  // Tag 58: ID
  if (!tags.has('58')) {
    tags.set('58', 'ID');
  }

  // Override nama merchant jika disediakan
  if (merchantNameOverride) {
    tags.set('59', merchantNameOverride.slice(0, 25).toUpperCase());
  }

  // Tag 62: Order Reference / Bill ID
  const cleanOrder = orderId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 25);
  const tag62_01 = formatTag('01', cleanOrder);
  const tag62_07 = formatTag('07', 'A01');
  const tag62_08 = formatTag('08', 'PRO MEMBERSHIP');
  tags.set('62', tag62_01 + tag62_07 + tag62_08);

  // Urutan standar EMVCo
  const standardOrder = [
    '00', '01', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35',
    '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '51', '52',
    '53', '54', '55', '56', '57', '58', '59', '60', '61', '62'
  ];

  let rebuilt = '';
  for (const t of standardOrder) {
    if (tags.has(t)) {
      rebuilt += formatTag(t, tags.get(t)!);
    }
  }
  for (const [t, val] of tags.entries()) {
    if (!standardOrder.includes(t) && t !== '63') {
      rebuilt += formatTag(t, val);
    }
  }

  const dataForCrc = rebuilt + '6304';
  const crc = calculateCRC16(dataForCrc);
  return dataForCrc + crc;
}

export function generateNationalQRIS(options: {
  orderId: string;
  amount: number;
  merchantName?: string;
  merchantCity?: string;
  postalCode?: string;
  nmid?: string;
  acquirerId?: string;
}): string {
  const {
    orderId,
    amount,
    merchantName = 'HIDUP SEHATKU PRO',
    merchantCity = 'JAKARTA PUSAT',
    postalCode = '10110',
    nmid = 'ID1029384756810',
    acquirerId = '93600914',
  } = options;

  let payload = formatTag('00', '01');
  payload += formatTag('01', '12'); // Dynamic QRIS

  const tag26_00 = formatTag('00', 'ID.CO.QRIS.WWW');
  const tag26_01 = formatTag('01', nmid);
  const tag26_02 = formatTag('02', acquirerId + orderId.replace(/[^0-9]/g, '').slice(0, 10).padEnd(10, '0'));
  const tag26_03 = formatTag('03', 'UMI');
  payload += formatTag('26', tag26_00 + tag26_01 + tag26_02 + tag26_03);

  const cleanOrder = orderId.replace(/[^A-Za-z0-9]/g, '').slice(0, 18);
  const tag51_00 = formatTag('00', 'ID.CO.INSTANPAY.WWW');
  const tag51_01 = formatTag('01', `ITP${cleanOrder}`);
  const tag51_02 = formatTag('02', '081234567890');
  payload += formatTag('51', tag51_00 + tag51_01 + tag51_02);

  payload += formatTag('52', '8099');
  payload += formatTag('53', '360');

  const amountStr = Math.round(amount).toString();
  payload += formatTag('54', amountStr);
  payload += formatTag('58', 'ID');
  payload += formatTag('59', merchantName.slice(0, 25).toUpperCase());
  payload += formatTag('60', merchantCity.slice(0, 15).toUpperCase());
  payload += formatTag('61', postalCode.slice(0, 10));

  const tag62_01 = formatTag('01', orderId.slice(0, 25));
  const tag62_07 = formatTag('07', 'A01');
  const tag62_08 = formatTag('08', 'PRO MEMBERSHIP');
  payload += formatTag('62', tag62_01 + tag62_07 + tag62_08);

  const dataForCrc = payload + '6304';
  const crc = calculateCRC16(dataForCrc);

  return dataForCrc + crc;
}

export function createClientQrisPayload(plan: 'monthly' | 'annual', amount: number, customStaticQris?: string) {
  const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  let qrisString = '';

  if (customStaticQris && customStaticQris.trim().startsWith('000201')) {
    qrisString = convertStaticToDynamicQRIS(customStaticQris, amount, orderId, 'HIDUP SEHATKU PRO');
  } else {
    qrisString = generateNationalQRIS({
      orderId,
      amount,
      merchantName: 'HIDUP SEHATKU PRO',
    });
  }

  return {
    success: true,
    orderId,
    amount,
    qrisString,
    checkoutUrl: `https://pay.instanlive.id/pay/${orderId}`,
    qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrisString)}`,
    status: 'pending',
    expiresInSeconds: 1800,
    isSandbox: false,
  };
}
