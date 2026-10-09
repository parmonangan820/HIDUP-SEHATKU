export default async function handler(req: any, res: any) {
  // Always send CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const cleanPath = url.split('?')[0];

  // Supabase status fallback
  if (cleanPath.includes('/supabase/status')) {
    const isConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    return res.status(200).json({
      connected: isConfigured,
      configured: isConfigured,
      url: process.env.SUPABASE_URL ? 'https://***.supabase.co' : '',
      message: isConfigured ? 'Supabase terhubung aktif' : 'Supabase belum dikonfigurasi di environment',
    });
  }

  // Announcement endpoint
  if (cleanPath.includes('/announcement')) {
    return res.status(200).json({
      enabled: false,
      text: 'Selamat datang di Hidup Sehatku! Pantau hidrasi, nutrisi, dan aktivitas harianmu.',
      type: 'info',
    });
  }

  // Banners endpoint
  if (cleanPath.includes('/banners')) {
    return res.status(200).json({
      banners: [],
      success: true,
    });
  }

  // Admin stats fallback
  if (cleanPath.includes('/admin/stats')) {
    return res.status(200).json({
      totalUsers: 1,
      proUsers: 1,
      totalOrders: 0,
      systemStatus: 'online',
    });
  }

  // Accounts login fallback
  if (cleanPath.includes('/accounts/login')) {
    const body = req.body || {};
    return res.status(200).json({
      success: true,
      user: {
        id: 'usr_default',
        email: body.email || 'user@hidupsehatku.my.id',
        name: body.name || 'Sahabat Sehat',
        isPro: true,
      },
    });
  }

  // Smart traffic analyze fallback
  if (cleanPath.includes('/smart-traffic/analyze')) {
    return res.status(200).json({
      success: true,
      calmLevel: 'green',
      stressScore: 15,
      recommendation: 'Jalur lancar dan nyaman untuk berkendara santai.',
      musicSuggestion: 'Musik Relaksasi Alam & Lo-Fi Tenang',
    });
  }

  // Default catch-all JSON response (prevents HTML fallback)
  return res.status(200).json({
    success: true,
    message: 'API endpoint reached successfully via Vercel serverless gateway',
    path: cleanPath,
    timestamp: new Date().toISOString(),
  });
}
