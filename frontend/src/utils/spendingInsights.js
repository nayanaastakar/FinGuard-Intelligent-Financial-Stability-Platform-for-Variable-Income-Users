function formatInr(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getExpenseTransactions(transactions) {
  return (transactions || []).filter((tx) => tx.type === 'EXPENSE');
}

function getIncomeTransactions(transactions) {
  return (transactions || []).filter((tx) => tx.type === 'INCOME');
}

function getLargestCategory(monthlyExpensesByCategory) {
  const entries = Object.entries(monthlyExpensesByCategory || {});
  if (!entries.length) return null;
  return entries.reduce((max, current) => (current[1] > max[1] ? current : max));
}

function getRecentExpenseTrend(transactions) {
  const expenses = getExpenseTransactions(transactions)
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (expenses.length < 2) {
    return { direction: 'stable', changePct: 0 };
  }

  const recent = expenses.slice(0, Math.ceil(expenses.length / 2));
  const older = expenses.slice(Math.ceil(expenses.length / 2));
  const recentAvg = recent.reduce((sum, tx) => sum + tx.amount, 0) / recent.length;
  const olderAvg = older.reduce((sum, tx) => sum + tx.amount, 0) / older.length;

  if (!olderAvg) return { direction: 'stable', changePct: 0 };

  const changePct = ((recentAvg - olderAvg) / olderAvg) * 100;
  if (changePct > 8) return { direction: 'up', changePct };
  if (changePct < -8) return { direction: 'down', changePct };
  return { direction: 'stable', changePct };
}

function categoryName(t, category) {
  const key = `categories.${category}`;
  const value = t(key);
  return value === key ? category : value;
}

export function generateFinancialRecommendations(dashboardData, user, t) {
  const recommendations = [];
  const burnRate = dashboardData.totalIncome
    ? (dashboardData.totalExpense / dashboardData.totalIncome) * 100
    : 0;
  const savingsRate = dashboardData.totalIncome
    ? ((dashboardData.totalIncome - dashboardData.totalExpense) / dashboardData.totalIncome) * 100
    : 0;

  if (burnRate > 85) {
    recommendations.push(t('insights.recommendations.reduceSpending'));
  } else if (savingsRate >= 20) {
    recommendations.push(t('insights.recommendations.maintainSavings'));
  } else {
    recommendations.push(t('insights.recommendations.aimSavings'));
  }

  if (dashboardData.stabilityScore < 60) {
    recommendations.push(t('insights.recommendations.buildEmergency'));
  } else if (dashboardData.stabilityScore < 80) {
    recommendations.push(t('insights.recommendations.trackFixed'));
  } else {
    recommendations.push(t('insights.recommendations.fsiHealthy'));
  }

  const largest = getLargestCategory(dashboardData.monthlyExpensesByCategory);
  if (largest) {
    recommendations.push(t('insights.recommendations.reviewCategory', {
      category: categoryName(t, largest[0]),
      amount: formatInr(largest[1]),
    }));
  }

  if (user?.targetSavings && dashboardData.savingsPotential < user.targetSavings) {
    recommendations.push(t('insights.recommendations.belowTarget', {
      target: formatInr(user.targetSavings),
    }));
  }

  const activeAlerts = (dashboardData.fraudAlerts || []).filter((alert) => alert.status === 'ACTIVE');
  if (activeAlerts.length) {
    recommendations.push(t('insights.recommendations.reviewAlerts'));
  }

  return recommendations;
}

export function generateSpendingInsights(dashboardData, user, t) {
  const insights = [];
  const burnRate = dashboardData.totalIncome
    ? (dashboardData.totalExpense / dashboardData.totalIncome) * 100
    : 0;
  const savingsRate = dashboardData.totalIncome
    ? ((dashboardData.totalIncome - dashboardData.totalExpense) / dashboardData.totalIncome) * 100
    : 0;
  const largest = getLargestCategory(dashboardData.monthlyExpensesByCategory);
  const expenseTrend = getRecentExpenseTrend(dashboardData.recentTransactions);
  const incomeCount = getIncomeTransactions(dashboardData.recentTransactions).length;
  const expenseCount = getExpenseTransactions(dashboardData.recentTransactions).length;

  insights.push({
    id: 'burn-rate',
    title: t('insights.items.burnRate.title'),
    message: burnRate
      ? t('insights.items.burnRate.message', {
        pct: burnRate.toFixed(0),
        expense: formatInr(dashboardData.totalExpense),
        income: formatInr(dashboardData.totalIncome),
      })
      : t('insights.items.burnRate.empty'),
    severity: burnRate > 90 ? 'danger' : burnRate > 75 ? 'warning' : 'success',
    trend: burnRate > 80 ? 'up' : burnRate < 60 ? 'down' : 'stable',
    icon: 'wallet',
  });

  insights.push({
    id: 'savings',
    title: t('insights.items.savings.title'),
    message: savingsRate >= 0
      ? t('insights.items.savings.message', {
        rate: savingsRate.toFixed(0),
        potential: formatInr(dashboardData.savingsPotential),
      })
      : t('insights.items.savings.negative'),
    severity: savingsRate < 10 ? 'warning' : savingsRate >= 20 ? 'success' : 'info',
    trend: savingsRate >= 15 ? 'up' : savingsRate < 5 ? 'down' : 'stable',
    icon: 'piggy-bank',
  });

  if (largest) {
    insights.push({
      id: 'top-category',
      title: t('insights.items.topCategory.title'),
      message: t('insights.items.topCategory.message', {
        category: categoryName(t, largest[0]),
        amount: formatInr(largest[1]),
      }),
      severity: 'info',
      trend: 'stable',
      icon: 'pie-chart',
    });
  }

  insights.push({
    id: 'expense-trend',
    title: t('insights.items.expenseTrend.title'),
    message: expenseTrend.direction === 'up'
      ? t('insights.items.expenseTrend.up', { pct: Math.abs(expenseTrend.changePct).toFixed(0) })
      : expenseTrend.direction === 'down'
        ? t('insights.items.expenseTrend.down', { pct: Math.abs(expenseTrend.changePct).toFixed(0) })
        : t('insights.items.expenseTrend.stable'),
    severity: expenseTrend.direction === 'up' ? 'warning' : expenseTrend.direction === 'down' ? 'success' : 'info',
    trend: expenseTrend.direction,
    icon: 'trending',
  });

  insights.push({
    id: 'income-stability',
    title: t('insights.items.incomeStability.title'),
    message: incomeCount >= 3
      ? t('insights.items.incomeStability.strong', { count: incomeCount })
      : incomeCount > 0
        ? t('insights.items.incomeStability.limited')
        : t('insights.items.incomeStability.none'),
    severity: incomeCount >= 3 ? 'success' : incomeCount > 0 ? 'warning' : 'info',
    trend: incomeCount >= 3 ? 'up' : 'stable',
    icon: 'activity',
  });

  const riskLabel = t(`stability.${(dashboardData.riskLevel || 'LOW').toLowerCase()}`);
  insights.push({
    id: 'fsi',
    title: t('insights.items.fsi.title'),
    message: dashboardData.stabilityScore >= 80
      ? t('insights.items.fsi.healthy', { score: dashboardData.stabilityScore.toFixed(0), risk: riskLabel })
      : dashboardData.stabilityScore >= 55
        ? t('insights.items.fsi.moderate', { score: dashboardData.stabilityScore.toFixed(0) })
        : t('insights.items.fsi.low', { score: dashboardData.stabilityScore.toFixed(0), risk: riskLabel }),
    severity: dashboardData.stabilityScore >= 80 ? 'success' : dashboardData.stabilityScore >= 55 ? 'warning' : 'danger',
    trend: dashboardData.stabilityScore >= 75 ? 'up' : dashboardData.stabilityScore < 50 ? 'down' : 'stable',
    icon: 'shield',
  });

  if (expenseCount > 0 && dashboardData.balance < dashboardData.totalExpense * 0.5) {
    insights.push({
      id: 'runway',
      title: t('insights.items.runway.title'),
      message: t('insights.items.runway.message', { balance: formatInr(dashboardData.balance) }),
      severity: 'danger',
      trend: 'down',
      icon: 'alert',
    });
  }

  if (user?.targetSavings) {
    const onTrack = dashboardData.savingsPotential >= user.targetSavings;
    insights.push({
      id: 'target',
      title: t('insights.items.target.title'),
      message: onTrack
        ? t('insights.items.target.onTrack', { target: formatInr(user.targetSavings) })
        : t('insights.items.target.below', {
          target: formatInr(user.targetSavings),
          gap: formatInr(user.targetSavings - dashboardData.savingsPotential),
        }),
      severity: onTrack ? 'success' : 'warning',
      trend: onTrack ? 'up' : 'down',
      icon: 'target',
    });
  }

  // Net Worth insight
  const totalAssets = dashboardData.totalAssets || 0;
  const totalLiabilities = dashboardData.totalLiabilities || 0;
  const netWorth = dashboardData.netWorth || (totalAssets - totalLiabilities);
  if (totalAssets > 0 || totalLiabilities > 0) {
    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 100;
    insights.push({
      id: 'networth',
      title: t('networth.netWorth'),
      message: `Assets ${formatInr(totalAssets)} · Liabilities ${formatInr(totalLiabilities)} · Net Worth ${formatInr(netWorth)} (Debt ratio: ${debtRatio.toFixed(0)}%)`,
      severity: debtRatio > 75 ? 'danger' : debtRatio > 40 ? 'warning' : 'success',
      trend: netWorth >= 0 ? 'up' : 'down',
      icon: 'shield',
    });
  }

  return insights;
}
