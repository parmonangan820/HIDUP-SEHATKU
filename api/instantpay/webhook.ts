import { instanpayOrderStore } from '../instanpay/store';

export default async function handler(req: any, res: any) {
  // Always allow CORS & preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle health check / ping from InstanPay dashboard (GET/HEAD)
  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.status(200).json({
      success: true,
      status: 'ready',
      message: 'InstanPay Webhook Endpoint is Active and Ready',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const orderId =
      payload.ref_id ||
      payload.refId ||
      payload.reference_id ||
      payload.order_id ||
      payload.orderId ||
      payload.bill_no ||
      payload.trx_id;

    const rawStatus = (
      payload.status ||
      payload.transaction_status ||
      payload.payment_status ||
      payload.state ||
      'PAID'
    ).toString().toUpperCase();

    if (orderId) {
      if (
        rawStatus === 'PAID' ||
        rawStatus === 'SUCCESS' ||
        rawStatus === 'SETTLEMENT' ||
        rawStatus === 'COMPLETED' ||
        rawStatus === 'SETTLED' ||
        rawStatus === '1' ||
        rawStatus === 'TRUE'
      ) {
        const order = instanpayOrderStore.get(orderId);
        if (order) {
          order.status = 'paid';
          order.paidAt = Date.now();
        } else {
          instanpayOrderStore.set(orderId, {
            orderId,
            status: 'paid',
            paidAt: Date.now(),
            payload,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      code: 200,
      message: 'Webhook processed successfully',
      orderId: orderId || null,
      received_at: new Date().toISOString(),
    });
  } catch (error: any) {
    // Return 200 OK so gateway doesn't mark as error if parsing non-critical body
    return res.status(200).json({
      success: true,
      message: 'Webhook received with warning',
      warning: error?.message,
    });
  }
}
