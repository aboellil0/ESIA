// Order pricing helpers — single place where the shipping fee is applied.
// The backend computes the order total (items subtotal + shipping fee) and
// never trusts the total sent by the frontend.
export interface PricedItem {
  unitPrice?: number;
  price?: number;
  quantity?: number;
  qty?: number;
}

export function computeItemsSubtotal(items: PricedItem[]): number {
  return items.reduce((sum, item) => {
    const price = Number(item.unitPrice ?? item.price ?? 0);
    const qty = Number(item.quantity ?? item.qty ?? 1);
    if (!Number.isFinite(price) || !Number.isFinite(qty)) return sum;
    return sum + price * qty;
  }, 0);
}

export function computeOrderTotal(items: PricedItem[], shippingFee: number): number {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const fee = Number(shippingFee);
  return computeItemsSubtotal(items) + (Number.isFinite(fee) ? fee : 0);
}
