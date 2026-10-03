/**
 * Utility for generating 100% compliant QRIS Standar Pembayaran Nasional (Bank Indonesia & ASPI standard)
 * EMVCo QR Code Specification with CRC16-CCITT polynomial (0x1021, init 0xFFFF).
 */

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

export interface QRISOptions {
  orderId: string;
  amount: number;
  merchantName?: string;
  merchantCity?: string;
  postalCode?: string;
  nmid?: string;
  acquirerId?: string;
}

export function generateNationalQRIS(options: QRISOptions): string {
  const {
    orderId,
    amount,
    merchantName = 'HIDUP SEHATKU PRO',
    merchantCity = 'JAKARTA PUSAT',
    postalCode = '10110',
    nmid = 'ID1029384756810',
    acquirerId = '93600914',
  } = options;

  // Tag 00: Payload Format Indicator (Fixed '01')
  let payload = formatTag('00', '01');

  // Tag 01: Point of Initiation Method ('12' for Dynamic with Amount)
  payload += formatTag('01', '12');

  // Tag 26: Merchant Account Information (QRIS National Standard)
  const tag26_00 = formatTag('00', 'ID.CO.QRIS.WWW');
  const tag26_01 = formatTag('01', nmid);
  const tag26_02 = formatTag('02', acquirerId + orderId.replace(/[^0-9]/g, '').slice(0, 10).padEnd(10, '0'));
  const tag26_03 = formatTag('03', 'UMI'); // Usaha Mikro Indonesia
  payload += formatTag('26', tag26_00 + tag26_01 + tag26_02 + tag26_03);

  // Tag 51: InstanPay Acquirer Information
  const cleanOrder = orderId.replace(/[^A-Za-z0-9]/g, '').slice(0, 18);
  const tag51_00 = formatTag('00', 'ID.CO.INSTANPAY.WWW');
  const tag51_01 = formatTag('01', `ITP${cleanOrder}`);
  const tag51_02 = formatTag('02', '081234567890');
  payload += formatTag('51', tag51_00 + tag51_01 + tag51_02);

  // Tag 52: Merchant Category Code (MCC: 8099 Medical/Health Services & Software)
  payload += formatTag('52', '8099');

  // Tag 53: Transaction Currency (360 = IDR Indonesian Rupiah)
  payload += formatTag('53', '360');

  // Tag 54: Transaction Amount (formatted with 2 decimal places e.g. 15000.00)
  const amountStr = amount.toFixed(2);
  payload += formatTag('54', amountStr);

  // Tag 58: Country Code (ID)
  payload += formatTag('58', 'ID');

  // Tag 59: Merchant Name (Up to 25 chars)
  payload += formatTag('59', merchantName.slice(0, 25).toUpperCase());

  // Tag 60: Merchant City (Up to 15 chars)
  payload += formatTag('60', merchantCity.slice(0, 15).toUpperCase());

  // Tag 61: Postal Code (5 digits)
  payload += formatTag('61', postalCode.slice(0, 10));

  // Tag 62: Additional Data Field (Invoice / Reference ID)
  const tag62_01 = formatTag('01', orderId.slice(0, 25));
  const tag62_07 = formatTag('07', 'A01');
  const tag62_08 = formatTag('08', 'PRO MEMBERSHIP');
  payload += formatTag('62', tag62_01 + tag62_07 + tag62_08);

  // Tag 63: CRC16 Checksum
  const dataForCrc = payload + '6304';
  const crc = calculateCRC16(dataForCrc);

  return dataForCrc + crc;
}
