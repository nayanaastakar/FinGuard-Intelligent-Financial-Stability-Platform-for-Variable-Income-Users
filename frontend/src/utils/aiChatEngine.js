export function generateSmartAIResponse(query, dashboardData) {
  const q = query.toLowerCase();
  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  const totalInc = dashboardData?.totalIncome || 0;
  const totalExp = dashboardData?.totalExpense || 0;
  const savings = totalInc - totalExp;
  const savingsRate = totalInc ? ((savings / totalInc) * 100).toFixed(1) : 0;
  const expenses = dashboardData?.monthlyExpensesByCategory || {};
  const sortedExpenses = Object.entries(expenses).sort((a, b) => b[1] - a[1]);
  const highestExp = sortedExpenses[0];
  const lowestExp = sortedExpenses.length > 0 ? sortedExpenses[sortedExpenses.length - 1] : null;

  // 1. Greetings
  if (['hi', 'hello', 'hey', 'greetings', 'morning', 'evening'].some(k => q.includes(k) && q.length < 15)) {
    return "Hello there! I'm your FinGuard Copilot. How can I help you manage your finances today?";
  }

  // 2. Gratitude
  if (['thank', 'thanks', 'appreciate', 'awesome', 'good bot', 'great'].some(k => q.includes(k) && q.length < 20)) {
    return "You're very welcome! I'm always here to help you achieve financial stability.";
  }

  // 3. Total Expenses
  if (q.includes('total expense') || q.includes('how much did i spend') || q.includes('total spending') || (q.includes('how much') && q.includes('expense'))) {
    return `Your total tracked expenses amount to **${formatCurrency(totalExp)}**.`;
  }

  // 4. Total Income
  if (q.includes('total income') || q.includes('how much did i earn') || q.includes('my income') || (q.includes('how much') && q.includes('income'))) {
    return `Your total tracked income is **${formatCurrency(totalInc)}**.`;
  }

  // 5. Total Savings Amount
  if (q.includes('how much is my savings') || q.includes('total savings') || q.includes('amount saved') || q.includes('how much did i save') || q.includes('how much have i saved')) {
    return `You have saved **${formatCurrency(savings)}** out of your income.`;
  }

  // 6. Savings Rate & Advice
  if (q.includes('savings rate') || q.includes('saving enough') || q.includes('am i saving') || q.includes('percentage saved')) {
    if (savingsRate >= 20) return `You are saving **${savingsRate}%** of your income. That is fantastic! Experts recommend at least 20%, so you are on the right track.`;
    return `Right now, you are saving approximately **${savingsRate}%** of your income. Try to aim for at least 20% to build a strong financial cushion.`;
  }

  // 6.5 Save for specific event (e.g. Diwali, Vacation, Car)
  if (q.includes('save for') || q.includes('planning for') || q.includes('diwali') || q.includes('vacation')) {
    const monthlySurplus = savings > 0 ? savings : 0;
    if (monthlySurplus > 0) {
      return `To save up for a specific goal, I recommend creating a dedicated Savings Bucket! You currently have a monthly surplus of **${formatCurrency(monthlySurplus)}**. If you divert 20% of this surplus (**${formatCurrency(monthlySurplus * 0.2)}**) into a 'Diwali' or 'Vacation' bucket each month, you'll be funded in no time!`;
    } else {
      return "To save up for upcoming goals, you first need to generate a monthly surplus by lowering your expenses or increasing your income. Start by cutting down your highest discretionary expenses!";
    }
  }

  // 7. SIP / Mutual Funds / Investing
  if (q.includes('sip') || q.includes('invest') || q.includes('mutual fund') || q.includes('stock market') || q.includes('where to invest') || q.includes('should i invest')) {
    if (savings > 5000) {
      return `You have healthy savings! Based on your current surplus of **${formatCurrency(savings)}**, starting an SIP in a broad-market index fund or mutual fund is a great way to compound your wealth.`;
    } else {
      return `Before investing in an SIP or stocks, it is highly recommended to build a solid emergency fund. Try to increase your monthly savings first!`;
    }
  }

  // 8. Crypto
  if (q.includes('crypto') || q.includes('bitcoin') || q.includes('ethereum')) {
    return "Cryptocurrency is highly volatile. If you choose to invest, financial experts recommend keeping it to less than 5% of your total portfolio.";
  }

  // 9. Highest Expense Category
  if (q.includes('highest spending') || q.includes('where am i spending the most') || q.includes('most expensive') || q.includes('spend the most') || q.includes('biggest expense')) {
    if (highestExp) return `Your highest spending is currently in **${highestExp[0]}** at **${formatCurrency(highestExp[1])}**. Consider reviewing these transactions to see if you can cut back.`;
    return "I don't have enough expense data categorized yet. Keep logging your transactions!";
  }

  // 10. Lowest Expense Category
  if (q.includes('lowest spending') || q.includes('spend the least') || q.includes('smallest expense')) {
    if (lowestExp) return `You spend the least on **${lowestExp[0]}**, which is just **${formatCurrency(lowestExp[1])}**.`;
    return "I don't have enough categorized expense data yet.";
  }

  // 11. Reducing Expenses & Tips
  if (q.includes('reduce expense') || q.includes('cut cost') || q.includes('how to spend less') || q.includes('save more money') || q.includes('budgeting tips') || q.includes('save money') || q.match(/\btips\b/)) {
    if (highestExp) return `Here's a tip: Start by looking at your highest category (**${highestExp[0]}**). Try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. Also, try unsubscribing from unused digital services!`;
    return "To cut costs, try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. Tracking every transaction here in FinGuard is the perfect first step!";
  }

  // 12. Emergency Fund Target
  if ((q.includes('emergency fund') || q.includes('rainy day') || q.includes('safety net')) && !q.includes('sustain') && !q.includes('survive')) {
    const target = totalExp > 0 ? totalExp * 6 : 50000;
    return `An emergency fund should ideally cover 3 to 6 months of your expenses. Based on your data, a good target for you would be around **${formatCurrency(target)}**.`;
  }

  // 12.5. Sustainability / Runway
  if (q.includes('sustain') || q.includes('survive') || q.includes('how many months') || q.includes('runway')) {
    if (totalExp > 0) {
      const months = ((dashboardData?.totalAssets || savings) / totalExp).toFixed(1);
      return `Based on your current tracked assets and your average expenses of ${formatCurrency(totalExp)}, you could sustain your current lifestyle for approximately **${months} months** if your income stopped today.`;
    }
    return "I don't have enough expense data to calculate your runway accurately yet. Please log more expenses!";
  }

  // 13. Debt Payoff
  if (q.includes('pay off debt') || q.includes('clear loan') || q.includes('credit card debt') || q.includes('in debt') || q.includes('pay debt')) {
    return "For paying off debt, consider the 'Avalanche Method' (paying off the highest interest rate first to save money) or the 'Snowball Method' (paying off the smallest balances first for psychological wins).";
  }

  // 14. Net Worth / Assets
  if (q.includes('net worth') || q.includes('total assets') || q.includes('liabilities') || q.includes('my wealth')) {
    const assets = dashboardData?.totalAssets || 0;
    const liabilities = dashboardData?.totalLiabilities || 0;
    const netWorth = assets - liabilities;
    return `Your current Net Worth is **${formatCurrency(netWorth)}**. You have **${formatCurrency(assets)}** in assets and **${formatCurrency(liabilities)}** in liabilities.`;
  }

  // 15. Financial Stability Index (FSI)
  if (q.includes('fsi') || q.includes('stability score') || q.includes('financial health')) {
    return "The Financial Stability Index (FSI) is a proprietary score out of 100. It evaluates your savings rate, income consistency, and debt-to-asset ratio. Keep your FSI above 80 for optimal financial peace of mind!";
  }

  // 16. Round-ups
  if (q.includes('round up') || q.includes('spare change') || q.includes('micro-investing') || q.includes('round-up')) {
    return "Auto Round-ups analyze your transactions, round them up to the nearest ₹10 or ₹50, and allocate that spare change into your Savings Buckets automatically. It's a great way to save without thinking about it!";
  }

  // 17. Anomaly Detection
  if (q.includes('anomaly') || q.includes('fraud') || q.includes('weird transaction') || q.includes('suspicious')) {
    return "Our Anomaly Detection AI scans your expenses in real-time. If it notices a transaction that deviates from your usual spending patterns (like a huge spike in dining), it flags it for your review immediately.";
  }

  // 18. Recent Transactions Check
  if (q.includes('recent transaction') || q.includes('last bought') || q.includes('latest expense') || q.includes('what did i buy')) {
    const tx = dashboardData?.recentTransactions?.[0];
    if (tx) {
      return `Your most recent transaction was **${tx.description}** for **${formatCurrency(tx.amount)}** on ${new Date(tx.date).toLocaleDateString()}.`;
    }
    return "You don't have any recent transactions logged yet.";
  }

  // 19. Jokes
  if (q.includes('joke') || q.includes('funny') || q.includes('make me laugh')) {
    return "Why did the scarecrow become a successful financial advisor? Because he was outstanding in his field! 🌾💰";
  }

  // 20. App features
  if (q.includes('receipt scanner') || q.includes('scan receipt') || q.includes('ocr')) {
    return "The Receipt Scanner uses advanced OCR to read your physical receipts. Just upload an image, and it will automatically extract the Merchant Name, Total Amount, Date, and guess the Category!";
  }

  if (q.includes('download report') || q.includes('export data') || q.includes('pdf')) {
    return "You can download a comprehensive PDF report of your finances by clicking 'Download Report' in the sidebar or header. It includes your balances, category breakdown, and FSI score!";
  }

  // Check generic category mentions
  const matchedCategory = Object.keys(expenses).find(c => q.includes(c.toLowerCase()));
  if (matchedCategory) {
    return `You've spent **${formatCurrency(expenses[matchedCategory])}** on **${matchedCategory}** recently.`;
  }

  // Generic Catch-All
  return "That's an insightful question! While I can't calculate that exactly right now, I highly recommend checking out your Financial Stability tab for a deeper dive, or asking me about your savings, highest expenses, or budgeting tips!";
}
