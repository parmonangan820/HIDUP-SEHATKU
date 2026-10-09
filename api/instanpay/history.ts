import { instanpayOrderStore } from './_store';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const list = Array.from(instanpayOrderStore.values()).map((order: any) => ({
      ref_id: order.orderId,
      orderId: order.orderId,
      txnId: order.txnId || null,
      amount: order.amount || 0,
      uniqueAmount: order.uniqueAmount || order.amount || 0,
      fee: order.fee || 0,
      plan: order.plan || 'annual',
      customerName: order.customerName || 'Pelanggan Hidup Sehat',
      customerEmail: order.customerEmail || '',
      status: order.status === 'paid' ? 'successful' : order.status === 'failed' ? 'failed' : 'pending',
      rawStatus: order.status || 'pending',
      createdAt: order.createdAt || Date.now(),
      paidAt: order.paidAt || null,
      paymentUrl: order.paymentUrl || order.checkoutUrl || '',
      checkoutUrl: order.checkoutUrl || order.paymentUrl || '',
      mode: order.mode || 'sandbox',
      qrisString: order.qrisString || '',
    }));

    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.status(200).json({
      success: true,
      count: list.length,
      transactions: list,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Gagal memuat riwayat pembayaran' });
  }
}
