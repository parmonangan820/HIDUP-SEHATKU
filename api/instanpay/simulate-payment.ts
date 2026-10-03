import { instanpayOrderStore } from './store';

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
    if (order) {
      order.status = 'paid';
      order.paidAt = Date.now();
    } else {
      instanpayOrderStore.set(orderId, {
        orderId,
        status: 'paid',
        paidAt: Date.now(),
      });
    }

    return res.status(200).json({
      success: true,
      orderId,
      status: 'paid',
      message: 'Simulasi scan dan pembayaran QRIS berhasil! Status telah menjadi PAID.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
}
