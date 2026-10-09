declare global {
  var __instanpayOrders: Map<string, any> | undefined;
  var __instanpayConfig: any;
}

if (!globalThis.__instanpayOrders) {
  globalThis.__instanpayOrders = new Map<string, any>();
}

export const instanpayOrderStore = globalThis.__instanpayOrders;

export const DEFAULT_INSTANPAY_API_KEY = 'sk_test_f477df17909b8f706efa39f1f6ac826c4fb7';

export function getInstanpayConfig() {
  const defaults = {
    mode: 'sandbox',
    merchantId: 'M-INSTANPAY-882910',
    liveApiKey: '',
    sandboxApiKey: DEFAULT_INSTANPAY_API_KEY,
    callbackUrl: 'https://www.hidupsehatku.my.id/api/instanpay/callback',
    autoActivatePro: true,
    qrisMode: 'both',
    customStaticQrisString: '',
    customQrisImageUrl: '',
    customQrisNmid: 'ID1029384756810',
    customQrisMerchantName: 'HIDUP SEHATKU PRO',
    bankAccountInfo: 'BCA / Mandiri / GoPay / DANA: 085760525942 a.n Canggih Marbun',
    whatsappConfirmationNumber: '085760525942',
  };
  return { ...defaults, ...(globalThis.__instanpayConfig || {}) };
}

export function setInstanpayConfig(newCfg: any) {
  const current = getInstanpayConfig();
  globalThis.__instanpayConfig = { ...current, ...newCfg };
  return globalThis.__instanpayConfig;
}
