const DEFAULT_INSTANPAY_API_KEY = 'sk_test_f477df17909b8f706efa39f1f6ac826c4fb7';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { apiKey } = req.body || {};
    const keyToTest = (apiKey || '').trim() || process.env.INSTANPAY_API_KEY || DEFAULT_INSTANPAY_API_KEY;

    if (!keyToTest) {
      return res.status(400).json({ success: false, error: 'API Key wajib diisi untuk diuji' });
    }

    const testRes = await fetch('https://pay.instanlive.id/api/v1/transaction/create', {
      method: 'POST',
      headers: {
        'X-Api-Key': keyToTest,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref_id: `PING-${Date.now()}`,
        amount: 10000,
      }),
    });

    const data = await testRes.json().catch(() => null);
    if (testRes.ok && data?.ok) {
      const mode = data?.data?.mode || (keyToTest.startsWith('sk_live_') ? 'live' : 'sandbox');
      return res.status(200).json({
        success: true,
        valid: true,
        mode,
        message: `Koneksi InstanLive Berhasil! Mode Gateway: ${mode.toUpperCase()}`,
        data: data.data,
      });
    } else {
      return res.status(200).json({
        success: false,
        valid: false,
        error: data?.message || data?.error || `Gagal terhubung (Status: ${testRes.status})`,
      });
    }
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      error: err?.message || 'Gagal menghubungi server InstanLive',
    });
  }
}
