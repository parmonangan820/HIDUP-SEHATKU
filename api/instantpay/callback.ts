import { instanpayOrderStore } from '../instanpay/_store';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, Authorization');

  if (req.method === 'OPTIONS' || req.method === 'GET' || req.method === 'HEAD') {
    return res.status(200).json({ success: true, status: 'ready', message: 'Callback Endpoint OK' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const orderId = payload.ref_id || payload.refId || payload.order_id || payload.orderId || payload.bill_no;
    if (orderId) {
      const order = instanpayOrderStore.get(orderId);
      if (order) {
        order.status = 'paid';
        order.paidAt = Date.now();
      } else {
        instanpayOrderStore.set(orderId, { orderId, status: 'paid', paidAt: Date.now(), payload });
      }
    }
    return res.status(200).json({ success: true, message: 'Callback processed' });
  } catch (err: any) {
    return res.status(200).json({ success: true, message: 'Callback received' });
  }
}
