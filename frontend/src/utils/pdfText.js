/**
 * jsPDF built-in Helvetica only supports basic Latin.
 * Rupee, smart quotes, and dashes must be normalized for PDF output.
 */
export function sanitizePdfText(text) {
  if (text == null) return '';

  return String(text)
    .replace(/\u20B9/g, 'Rs. ')
    .replace(/₹/g, 'Rs. ')
    .replace(/\u2014/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

export function formatInrForPdf(amount, maximumFractionDigits = 2) {
  const value = Number(amount) || 0;
  const formatted = value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
  return `Rs. ${formatted}`;
}
