import { generateNationalQRIS, convertStaticToDynamicQRIS } from './_qrisHelper';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { staticQris, amount, merchantName, orderId } = req.body || {};
    const finalAmount = Number(amount) || 15000;
    const finalOrderId = orderId || `TEST-${Date.now()}`;
    const name = merchantName || 'HIDUP SEHATKU PRO';

    let resultQris = '';
    if (staticQris && String(staticQris).trim().startsWith('000201')) {
      resultQris = convertStaticToDynamicQRIS(String(staticQris).trim(), finalAmount, finalOrderId, name);
    } else {
      resultQris = generateNationalQRIS({
        orderId: finalOrderId,
        amount: finalAmount,
        merchantName: name,
      });
    }

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(resultQris)}`;

    return res.status(200).json({
      success: true,
      amount: finalAmount,
      orderId: finalOrderId,
      merchantName: name,
      qrisString: resultQris,
      qrImageUrl,
      message: 'QRIS Dinamis berhasil di-generate! Siap di-scan m-Banking & E-Wallet.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Gagal generate QRIS Dinamis' });
  }
}
