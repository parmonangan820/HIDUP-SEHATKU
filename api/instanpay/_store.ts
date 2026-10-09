declare global {
  var __instanpayOrders: Map<string, any> | undefined;
}

if (!globalThis.__instanpayOrders) {
  globalThis.__instanpayOrders = new Map<string, any>();
}

export const instanpayOrderStore = globalThis.__instanpayOrders;
