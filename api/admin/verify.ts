export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { pin } = req.body || {};
  const validPins = ['8820', '1234', '060319', process.env.ADMIN_PIN].filter(Boolean);

  if (validPins.includes(String(pin).trim())) {
    return res.status(200).json({
      success: true,
      message: 'Autentikasi Admin berhasil!',
      isAdmin: true,
    });
  }

  return res.status(401).json({
    success: false,
    message: 'PIN Admin salah! Silakan coba lagi.',
    isAdmin: false,
  });
}
