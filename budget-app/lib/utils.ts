export function formatCurrency(amount: number | { toNumber(): number }) {
  const number = typeof amount === 'number' ? amount : amount.toNumber();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(number);
}
