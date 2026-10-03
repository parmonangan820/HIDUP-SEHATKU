export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { orderId } = req.body || {};
    return res.status(200).json({
      success: true,
      orderId,
      status: 'success',
      message: 'Pembayaran QRIS Instapay berhasil dikonfirmasi.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
}
