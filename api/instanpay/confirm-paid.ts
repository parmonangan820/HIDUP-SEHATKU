import { instanpayOrderStore } from './_store';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { orderId, plan, customerName } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    let order = instanpayOrderStore.get(orderId);
    if (order) {
      order.status = 'paid';
      order.paidAt = Date.now();
      if (plan) order.plan = plan;
      if (customerName) order.customerName = customerName;
    } else {
      order = {
        orderId,
        amount: plan === 'monthly' ? 15000 : 100000,
        plan: plan || 'annual',
        customerName: customerName || 'Sahabat Sehat',
        status: 'paid',
        paidAt: Date.now(),
      };
      instanpayOrderStore.set(orderId, order);
    }

    return res.status(200).json({
      success: true,
      orderId,
      status: 'paid',
      message: 'Pembayaran berhasil dikonfirmasi dan status akun ditingkatkan ke PRO!',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
}
