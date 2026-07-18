import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { generateFinancialRecommendations } from './spendingInsights';
import { sanitizePdfText, formatInrForPdf } from './pdfText';

async function captureElement(element, scale = 2) {
  return null; // Snapshots removed per user preference for a cleaner text report
}

function addImageFitPage(doc, image, x, y, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * ratio;
  const height = image.height * ratio;
  doc.addImage(image.dataUrl, 'PNG', x, y, width, height);
  return y + height + 8;
}

export async function generateFinancialReport({
  user,
  dashboardData,
  savingsGoals = [],
  roundUpBucketBalance = 0,
  roundUpBucketThreshold = 50,
  captureRoot,
  chartSelectors = [],
  t = (key) => key,
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  const recommendations = generateFinancialRecommendations(dashboardData, user, t);
  const generatedAt = sanitizePdfText(new Date().toLocaleString('en-IN'));

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(sanitizePdfText(t('pdf.title')), margin, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(sanitizePdfText(user?.fullName || user?.username || t('pdf.accountHolder')), margin, 22);
  doc.text(`${t('pdf.reportGeneratedAt')}: ${generatedAt}`, pageWidth - margin, 22, { align: 'right' });

  y = 40;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(sanitizePdfText(t('pdf.financialSummary')), margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const summaryLines = [
    `${t('pdf.totalIncome')}: ${formatInrForPdf(dashboardData.totalIncome)}`,
    `${t('pdf.totalExpense')}: ${formatInrForPdf(dashboardData.totalExpense)}`,
    `${t('pdf.balance')}: ${formatInrForPdf(dashboardData.balance)}`,
    `${t('pdf.savingsPotential')}: ${formatInrForPdf(dashboardData.savingsPotential)}`,
    `${t('pdf.fsiScore')}: ${dashboardData.stabilityScore?.toFixed?.(1) ?? dashboardData.stabilityScore} (${dashboardData.riskLevel || 'N/A'} ${t('pdf.riskSuffix')})`,
    `${t('networth.totalAssets')}: ${formatInrForPdf(dashboardData.totalAssets || 0)}`,
    `${t('networth.totalLiabilities')}: ${formatInrForPdf(dashboardData.totalLiabilities || 0)}`,
    `${t('networth.netWorth')}: ${formatInrForPdf((dashboardData.totalAssets || 0) - (dashboardData.totalLiabilities || 0))}`,
  ];

  summaryLines.forEach((line) => {
    doc.text(sanitizePdfText(line), margin, y);
    y += 6;
  });

  const burnRate = dashboardData.totalIncome
    ? Math.round((dashboardData.totalExpense / dashboardData.totalIncome) * 100)
    : 0;
  const savingsRate = dashboardData.totalIncome
    ? Math.round(((dashboardData.totalIncome - dashboardData.totalExpense) / dashboardData.totalIncome) * 100)
    : 0;
  const runwayMonths = dashboardData.totalExpense
    ? (dashboardData.balance / dashboardData.totalExpense).toFixed(1)
    : 'N/A';
  const activeGoalsCount = (savingsGoals || []).filter((goal) => goal.name !== 'Auto Round-Up Savings').length;
  const topCategories = Object.entries(dashboardData.monthlyExpensesByCategory || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (y > 240) {
    doc.addPage();
    y = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(sanitizePdfText(t('pdf.keyMetrics')), margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const metricLines = [
    `${t('pdf.savingsRate')}: ${savingsRate}%`,
    `${t('pdf.burnRate')}: ${burnRate}%`,
    `${t('pdf.runwayMonths')}: ${runwayMonths} ${t('common.months')}`,
    `${t('pdf.activeGoals')}: ${activeGoalsCount}`,
  ];
  metricLines.forEach((line) => {
    doc.text(sanitizePdfText(line), margin, y);
    y += 6;
  });

  if (topCategories.length) {
    y += 4;
    if (y > 240) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(sanitizePdfText(t('pdf.topCategories')), margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    topCategories.forEach(([category, amount], index) => {
      doc.text(sanitizePdfText(`${index + 1}. ${category}: ${formatInrForPdf(amount)}`), margin, y);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
    });
  }

  // Projections removed per user request

  if (savingsGoals.length) {
    if (y > 240) {
      doc.addPage();
      y = margin;
    }
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(sanitizePdfText(t('pdf.savingsGoals')), margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const activeGoals = savingsGoals.filter(goal => goal.name !== 'Auto Round-Up Savings');
    activeGoals.slice(0, 4).forEach((goal) => {
      const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
      doc.text(sanitizePdfText(`• ${goal.name}: ${formatInrForPdf(goal.currentAmount)} / ${formatInrForPdf(goal.targetAmount)} (${progress}% )`), margin, y);
      y += 5;
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
    });

    if (activeGoals.length > 4) {
      doc.text(sanitizePdfText(`+ ${activeGoals.length - 4} more goals`), margin, y);
      y += 6;
    }
  }

  if (roundUpBucketBalance != null) {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(sanitizePdfText(t('pdf.autoRoundUpBucket')), margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(sanitizePdfText(`${t('pdf.bucketBalance')}: ${formatInrForPdf(roundUpBucketBalance)}`), margin, y);
    y += 6;
    const bucketNote = roundUpBucketBalance >= roundUpBucketThreshold
      ? t('pdf.bucketStatusReady')
      : t('pdf.bucketStatusWaiting', { remaining: formatInrForPdf(roundUpBucketThreshold - roundUpBucketBalance) });
    doc.text(sanitizePdfText(bucketNote), margin, y);
    y += 6;
  }

  y += 4;
  if (y > 230) {
    doc.addPage();
    y = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(sanitizePdfText(t('pdf.recommendations')), margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  recommendations.forEach((item, index) => {
    const wrapped = doc.splitTextToSize(sanitizePdfText(`${index + 1}. ${item}`), pageWidth - margin * 2);
    if (y + wrapped.length * 5 > 270) {
      doc.addPage();
      y = margin;
    }
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5 + 2;
  });

  y += 4;
  if (y > 230) {
    doc.addPage();
    y = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(sanitizePdfText(t('pdf.recentTransactions')), margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const transactions = (dashboardData.recentTransactions || []).slice(0, 10);
  if (!transactions.length) {
    doc.text(sanitizePdfText(t('pdf.noTransactions')), margin, y);
    y += 6;
  } else {
    transactions.forEach((tx) => {
      const line = `${tx.date} | ${tx.type} | ${tx.category} | ${formatInrForPdf(tx.amount)} | ${tx.description || '-'}`;
      const wrapped = doc.splitTextToSize(sanitizePdfText(line), pageWidth - margin * 2);
      if (y + wrapped.length * 4.5 > 275) {
        doc.addPage();
        y = margin;
      }
      doc.text(wrapped, margin, y);
      y += wrapped.length * 4.5 + 1;
    });
  }

  const categoryEntries = Object.entries(dashboardData.monthlyExpensesByCategory || {});
  if (categoryEntries.length) {
    if (y > 240) {
      doc.addPage();
      y = margin;
    }
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(sanitizePdfText(t('pdf.expenseBreakdown')), margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    categoryEntries.forEach(([category, amount]) => {
      doc.text(sanitizePdfText(`${category}: ${formatInrForPdf(amount)}`), margin, y);
      y += 5;
    });
  }

  // Snapshots removed to make the report cleaner and strictly text-based

  const fileName = `FinGuard_Report_${(user?.username || 'user')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
