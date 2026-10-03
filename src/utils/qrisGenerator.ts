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
  payload += formatTag('01', '12');

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

  const amountStr = amount.toFixed(2);
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

export function createClientQrisPayload(plan: 'monthly' | 'annual', amount: number) {
  const orderId = `INSTANPAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const qrisString = generateNationalQRIS({
    orderId,
    amount,
    merchantName: 'HIDUP SEHATKU PRO',
  });
  return {
    success: true,
    orderId,
    amount,
    qrisString,
    checkoutUrl: `https://app.instanpay.co.id/pay/${orderId}`,
    qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrisString)}`,
    status: 'pending',
    expiresInSeconds: 300,
  };
}
