// Always store money as integer cents — never floats
export const toCents   = (amount) => Math.round(parseFloat(amount) * 100);
export const fromCents = (cents)  => cents / 100;

export const formatCurrency = (cents, currency = 'BDT') =>
  new Intl.NumberFormat('en-BD', { 
    style: 'currency', 
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(fromCents(cents));

export const formatCompact = (cents) => {
  const abs = Math.abs(fromCents(cents));
  if (abs >= 10_000_000) return `৳${(abs / 10_000_000).toFixed(1)}Cr`; // Crore
  if (abs >= 100_000)    return `৳${(abs / 100_000).toFixed(1)}L`;  // Lakh
  if (abs >= 1_000)      return `৳${(abs / 1_000).toFixed(1)}K`;
  return formatCurrency(cents);
};
