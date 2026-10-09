const DEFAULT_INSTANPAY_API_KEY = 'sk_test_f477df17909b8f706efa39f1f6ac826c4fb7';

declare global {
  var __instanpayConfig: any;
}

function getConfig() {
  const defaults = {
    mode: 'sandbox',
    merchantId: 'M-INSTANPAY-882910',
    liveApiKey: '',
    sandboxApiKey: DEFAULT_INSTANPAY_API_KEY,
    callbackUrl: 'https://www.hidupsehatku.my.id/api/instanpay/callback',
    autoActivatePro: true,
    qrisMode: 'both',
    customStaticQrisString: '',
    customQrisImageUrl: '',
    customQrisNmid: 'ID1029384756810',
    customQrisMerchantName: 'HIDUP SEHATKU PRO',
    bankAccountInfo: 'BCA / Mandiri / GoPay / DANA: 085760525942 a.n Canggih Marbun',
    whatsappConfirmationNumber: '085760525942',
  };
  return { ...defaults, ...(globalThis.__instanpayConfig || {}) };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const updated = req.body || {};
    const current = getConfig();
    const merged = { ...current, ...updated };
    globalThis.__instanpayConfig = merged;
    return res.status(200).json({
      success: true,
      config: merged,
      message: 'Pengaturan QRIS & InstantPay berhasil disimpan ke server!',
    });
  }

  const cfg = getConfig();
  return res.status(200).json({ success: true, config: cfg });
}
