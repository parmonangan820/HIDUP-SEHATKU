import { instanpayOrderStore } from './_store';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { orderId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    const order = instanpayOrderStore.get(orderId);

    // If real credentials are provided, attempt to check live InstanPay status
    const instanpayApiKey = process.env.INSTANPAY_API_KEY || '';
    const instanpayMerchantId = process.env.INSTANPAY_MERCHANT_ID || '';

    if (instanpayApiKey && instanpayMerchantId) {
      try {
        const liveCheckRes = await fetch(`https://api.instanpay.co.id/v1/orders/${encodeURIComponent(orderId)}/status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${instanpayApiKey}`,
            'X-Merchant-Id': instanpayMerchantId,
          },
        });
        if (liveCheckRes.ok) {
          const liveData = await liveCheckRes.json();
          if (liveData?.status === 'PAID' || liveData?.status === 'SUCCESS' || liveData?.status === 'SETTLED') {
            if (order) order.status = 'paid';
            return res.status(200).json({
              success: true,
              orderId,
              status: 'paid',
              message: 'Pembayaran QRIS InstanPay berhasil dikonfirmasi.',
            });
          }
        }
      } catch (err) {
        console.warn('Live InstanPay check warning:', err);
      }
    }

    if (!order) {
      // Order not found in memory, keep status as pending
      return res.status(200).json({
        success: true,
        orderId,
        status: 'pending',
        message: 'Menunggu proses scan dan pembayaran QRIS...',
      });
    }

    // Check expiration
    if (order.status === 'pending' && Date.now() > order.expiresAt) {
      order.status = 'expired';
      return res.status(200).json({
        success: true,
        orderId,
        status: 'expired',
        message: 'Waktu pembayaran QRIS telah kedaluwarsa.',
      });
    }

    if (order.status === 'paid') {
      return res.status(200).json({
        success: true,
        orderId,
        status: 'paid',
        paidAt: order.paidAt || Date.now(),
        message: 'Pembayaran QRIS InstanPay berhasil dikonfirmasi.',
      });
    }

    // Default: pending payment
    return res.status(200).json({
      success: true,
      orderId,
      status: 'pending',
      message: 'Menunggu scan dan pembayaran QRIS oleh pengguna.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
}
