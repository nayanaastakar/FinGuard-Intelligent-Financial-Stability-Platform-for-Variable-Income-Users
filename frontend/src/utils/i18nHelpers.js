export function categoryLabel(t, category) {
  const key = `categories.${category}`;
  const value = t(key);
  return value === key ? category : value;
}

export function transactionTypeLabel(t, type) {
  return type === 'INCOME' ? t('transactions.income') : t('transactions.expense');
}

export function riskLevelLabel(t, level) {
  const key = `stability.${(level || 'LOW').toLowerCase()}`;
  const value = t(key);
  return value === key ? level : value;
}
