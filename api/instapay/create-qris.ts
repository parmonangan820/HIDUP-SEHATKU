export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, amount, customerName, customerEmail } = req.body || {};
    const orderId = `INSTAPAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const finalAmount = amount || (plan === 'monthly' ? 15000 : 100000);

    const instapayApiKey = process.env.INSTAPAY_API_KEY || '';
    const instapayMerchantId = process.env.INSTAPAY_MERCHANT_ID || '';

    let qrisString = `00020101021226660014ID.CO.INSTAPAY.WWW011893600914ID10293847568100215${orderId}0303UMI5204581253033605802ID5919PT HIDUP SEHATKU IND6007JAKARTA6304${Math.floor(Math.random() * 8999 + 1000)}`;
    let checkoutUrl = `https://app.instapay.id/pay/${orderId}`;

    if (instapayApiKey && instapayMerchantId) {
      try {
        const instapayRes = await fetch('https://api.instapay.id/v1/charge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${instapayApiKey}`,
            'X-Merchant-Id': instapayMerchantId,
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
        if (instapayRes.ok) {
          const data = await instapayRes.json();
          if (data?.qris_string) qrisString = data.qris_string;
          if (data?.checkout_url) checkoutUrl = data.checkout_url;
        }
      } catch (apiErr) {
        console.warn('Instapay API call warning:', apiErr);
      }
    }

    return res.status(200).json({
      success: true,
      orderId,
      amount: finalAmount,
      qrisString,
      checkoutUrl,
      qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrisString)}`,
      status: 'pending',
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}
