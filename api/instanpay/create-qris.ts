import { generateNationalQRIS, convertStaticToDynamicQRIS } from './qrisHelper';
import { instanpayOrderStore } from './store';

const DEFAULT_INSTANPAY_API_KEY = 'sk_test_f477df17909b8f706efa39f1f6ac826c4fb7';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, amount, customerName, customerEmail, adminConfig, ref_id } = req.body || {};
    const effectiveConfig = adminConfig || {};

    const orderId = ref_id || `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const finalAmount = amount || (plan === 'monthly' ? 15000 : 100000);

    const mode = effectiveConfig.mode || 'sandbox';
    const activeApiKey =
      (mode === 'live' ? effectiveConfig.liveApiKey : effectiveConfig.sandboxApiKey) ||
      process.env.INSTANPAY_API_KEY ||
      DEFAULT_INSTANPAY_API_KEY;

    const isSandbox = mode === 'sandbox' || (Boolean(activeApiKey) && activeApiKey.startsWith('sk_test_'));

    // 1. Generate QRIS Dinamis standar nasional atau konversi dari QRIS Statis Toko
    let dynamicQrisString = '';
    if (effectiveConfig.customStaticQrisString && effectiveConfig.customStaticQrisString.trim().startsWith('000201')) {
      dynamicQrisString = convertStaticToDynamicQRIS(
        effectiveConfig.customStaticQrisString,
        finalAmount,
        orderId,
        effectiveConfig.customQrisMerchantName || 'HIDUP SEHATKU PRO'
      );
    } else {
      dynamicQrisString = generateNationalQRIS({
        orderId,
        amount: finalAmount,
        merchantName: effectiveConfig.customQrisMerchantName || 'HIDUP SEHATKU PRO',
        merchantCity: 'JAKARTA PUSAT',
        postalCode: '10110',
        nmid: effectiveConfig.customQrisNmid || 'ID1029384756810',
      });
    }

    let qrisString = dynamicQrisString;
    let checkoutUrl = `https://pay.instanlive.id/pay/${orderId}`;
    let paymentUrl = '';
    let txnId: number | null = null;
    let simulateUrl = '';
    let uniqueAmount = finalAmount;
    let fee = 0;
    let sandboxRawString = '';

    if (activeApiKey) {
      try {
        const instanliveRes = await fetch('https://pay.instanlive.id/api/v1/transaction/create', {
          method: 'POST',
          headers: {
            'X-Api-Key': activeApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref_id: orderId,
            amount: finalAmount,
          }),
        });

        if (instanliveRes.ok) {
          const resData = await instanliveRes.json();
          const liveData = resData?.data || resData;
          if (liveData?.txn_id) {
            txnId = liveData.txn_id;
          }
          if (liveData?.payment_url) {
            paymentUrl = liveData.payment_url;
            checkoutUrl = liveData.payment_url;
          }
          if (liveData?.qris_string || liveData?.qr_string) {
            const returnedQris = liveData.qris_string || liveData.qr_string;
            if (typeof returnedQris === 'string' && returnedQris.startsWith('000201')) {
              qrisString = returnedQris;
            } else {
              sandboxRawString = returnedQris;
              qrisString = dynamicQrisString;
            }
          }
          if (liveData?.unique_amount) {
            uniqueAmount = liveData.unique_amount;
          }
          if (liveData?.fee) {
            fee = liveData.fee;
          }
          if (liveData?.simulate_url) {
            simulateUrl = liveData.simulate_url;
          }
        }
      } catch (apiErr) {
        console.warn('InstanLive transaction create error:', apiErr);
      }
    }

    const orderRecord = {
      orderId,
      txnId,
      amount: finalAmount,
      uniqueAmount,
      fee,
      plan: plan || 'annual',
      customerName: customerName || 'Sahabat Sehat',
      customerEmail: customerEmail || 'user@hidupsehatku.my.id',
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 1800000, // 30 minutes
      qrisString,
      checkoutUrl,
      paymentUrl,
      simulateUrl,
      mode,
      apiKeyUsed: activeApiKey,
    };

    instanpayOrderStore.set(orderId, orderRecord);
    if (txnId) {
      instanpayOrderStore.set(String(txnId), orderRecord);
    }

    const finalQrData = qrisString || paymentUrl || checkoutUrl;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalQrData)}`;

    return res.status(200).json({
      success: true,
      orderId,
      txnId,
      amount: finalAmount,
      uniqueAmount,
      fee,
      qrisString: finalQrData,
      dynamicQrisString,
      isDynamicQris: true,
      sandboxRawString,
      checkoutUrl,
      paymentUrl,
      simulateUrl,
      qrImageUrl,
      status: 'pending',
      expiresInSeconds: 1800,
      mode,
      isSandbox,
      qrisMode: effectiveConfig.qrisMode || 'both',
      customQrisImageUrl: effectiveConfig.customQrisImageUrl || '',
      customStaticQrisString: effectiveConfig.customStaticQrisString || '',
      customQrisMerchantName: effectiveConfig.customQrisMerchantName || 'HIDUP SEHATKU PRO',
      bankAccountInfo: effectiveConfig.bankAccountInfo || 'BCA / Mandiri / GoPay / DANA: 085760525942 a.n Canggih Marbun',
      whatsappConfirmationNumber: effectiveConfig.whatsappConfirmationNumber || '085760525942',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}
