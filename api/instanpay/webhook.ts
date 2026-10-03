import { instanpayOrderStore } from './store';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const payload = req.body || {};
    const orderId = payload.order_id || payload.orderId || payload.bill_no;
    const status = (payload.status || payload.transaction_status || '').toUpperCase();

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Missing order_id in webhook' });
    }

    if (status === 'PAID' || status === 'SUCCESS' || status === 'SETTLEMENT' || status === 'COMPLETED') {
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
      return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
    }

    return res.status(200).json({ success: true, message: 'Webhook received for pending/unpaid status' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
}
