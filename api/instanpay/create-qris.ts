import { generateNationalQRIS } from './qrisHelper';
import { instanpayOrderStore } from './store';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, amount, customerName, customerEmail } = req.body || {};
    const orderId = `INSTANPAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const finalAmount = amount || (plan === 'monthly' ? 15000 : 100000);

    const instanpayApiKey = process.env.INSTANPAY_API_KEY || '';
    const instanpayMerchantId = process.env.INSTANPAY_MERCHANT_ID || '';

    // Generate genuine QRIS Standar Nasional Indonesia (EMVCo with CRC16-CCITT)
    let qrisString = generateNationalQRIS({
      orderId,
      amount: finalAmount,
      merchantName: 'HIDUP SEHATKU PRO',
      merchantCity: 'JAKARTA PUSAT',
      postalCode: '10110',
      nmid: 'ID1029384756810',
    });
    let checkoutUrl = `https://app.instanpay.co.id/pay/${orderId}`;

    if (instanpayApiKey && instanpayMerchantId) {
      try {
        const instanpayRes = await fetch('https://api.instanpay.co.id/v1/charge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${instanpayApiKey}`,
            'X-Merchant-Id': instanpayMerchantId,
          },
          body: JSON.stringify({
            order_id: orderId,
            amount: finalAmount,
            payment_method: 'qris',
            customer_name: customerName || 'Sahabat Sehat',
            customer_email: customerEmail || 'user@hidupsehatku.my.id',
            description: `Upgrade Hidup Sehatku PRO - ${plan === 'monthly' ? 'Bulanan' : 'Tahunan'}`,
          }),
        });
        if (instanpayRes.ok) {
          const data = await instanpayRes.json();
          if (data?.qris_string) qrisString = data.qris_string;
          if (data?.checkout_url) checkoutUrl = data.checkout_url;
        }
      } catch (apiErr) {
        console.warn('InstanPay API call warning:', apiErr);
      }
    }

    const orderRecord = {
      orderId,
      amount: finalAmount,
      plan: plan || 'annual',
      customerName: customerName || 'Sahabat Sehat',
      customerEmail: customerEmail || 'user@hidupsehatku.my.id',
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 300000, // 5 minutes
      qrisString,
      checkoutUrl,
    };

    instanpayOrderStore.set(orderId, orderRecord);

    return res.status(200).json({
      success: true,
      orderId,
      amount: finalAmount,
      qrisString,
      checkoutUrl,
      qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrisString)}`,
      status: 'pending',
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}
