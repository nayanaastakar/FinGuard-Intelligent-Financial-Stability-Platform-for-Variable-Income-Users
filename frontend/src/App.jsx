import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  User as UserIcon, 
  LogOut, 
  Plus, 
  Trash2, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  Briefcase, 
  PieChart as PieIcon, 
  Sun, 
  Moon, 
  RefreshCw,
  Sparkles,
  Info,
  ChevronRight,
  CreditCard,
  Landmark,
  Users,
  BookOpen,
  Home,
  Fuel,
  GraduationCap,
  Pencil,
  Save,
  Send,
  MessageSquare,
  FileText,
  Clock,
  Menu,
  X,
  ScanLine,
  Download,
  Home as HomeIcon,
  Brain,
  LineChart as LineChartNavIcon,
  Globe,
  PiggyBank
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { LanguageSelector } from './components/LanguageSelector';
import { ReceiptScanner } from './components/ReceiptScanner';
import { AiSpendingInsights } from './components/AiSpendingInsights';
import { NetWorthTab } from './components/NetWorthTab';
import { useLanguage } from './context/LanguageContext';
import { finguardApi } from './services/finguardApi';
import { generateFinancialReport } from './utils/generateFinancialReport';
import { categoryLabel, transactionTypeLabel, riskLevelLabel } from './utils/i18nHelpers';

const ACCOUNT_OPTIONS = [
  { name: 'Primary Bank', type: 'BANK', upiId: '' },
  { name: 'Secondary Bank', type: 'BANK', upiId: '' },
  { name: 'UPI Wallet', type: 'UPI', upiId: 'primary@upi' }
];

const DEFAULT_PROFILE_DETAILS = {
  phone: '',
  city: 'Bengaluru',
  householdMembers: 4,
  familyMembers: [
    { name: 'Spouse', relation: 'Spouse', monthlyExpense: 6000 },
    { name: 'Child 1', relation: 'Child', monthlyExpense: 3500 }
  ],
  savingsGoals: [
    { name: 'School Fees', category: 'EDUCATION', targetAmount: 25000, monthlyPlan: 3000 },
    { name: 'Books & Uniforms', category: 'BOOKS', targetAmount: 6000, monthlyPlan: 700 },
    { name: 'House Expense', category: 'HOUSE', targetAmount: 18000, monthlyPlan: 4500 },
    { name: 'Petrol / Travel', category: 'PETROL', targetAmount: 8000, monthlyPlan: 2000 }
  ],
  linkedAccounts: [
    { name: 'Primary Bank', type: 'BANK', maskedAccount: 'XXXX 4321', upiId: '', monthlyLimit: 25000 },
    { name: 'UPI Wallet', type: 'UPI', maskedAccount: '', upiId: 'primary@upi', monthlyLimit: 10000 }
  ],
  fullName: '',
  profession: '',
  targetSavings: 1500
};

const formatCurrency = (amount, maximumFractionDigits = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits
  }).format(amount || 0);

// Safe empty defaults shown when backend is unreachable
const EMPTY_FORECAST_RESULT = {
  linear: [],
  holt: [],
  arima: [],
  lstm: [],
  ensemble: []
};

const EMPTY_DASHBOARD = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  stabilityScore: 0,
  riskLevel: 'LOW',
  savingsPotential: 0,
  recentTransactions: [],
  monthlyExpensesByCategory: {},
  monthlyIncomesByCategory: {},
  notifications: [],
  fraudAlerts: [],
  incomeForecast: EMPTY_FORECAST_RESULT,
  expenseForecast: EMPTY_FORECAST_RESULT
};

export default function App() {
  const { language, translate } = useLanguage();
  const t = translate;
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD);
  const [profileDetails, setProfileDetails] = useState(() => {
    const saved = localStorage.getItem('profileDetails');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE_DETAILS;
  });
  const [profileDraft, setProfileDraft] = useState(() => {
    const saved = localStorage.getItem('profileDetails');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE_DETAILS;
  });
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  
  const [isAutoSweepActive, setIsAutoSweepActive] = useState(() => {
    const saved = localStorage.getItem('isAutoSweepActive');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [cardLimitEnabled, setCardLimitEnabled] = useState(() => {
    const saved = localStorage.getItem('cardLimitEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [cardLimitValue, setCardLimitValue] = useState(() => {
    const saved = localStorage.getItem('cardLimitValue');
    return saved !== null ? parseInt(saved, 10) : 12000;
  });
  const [stabilityVaultBalance, setStabilityVaultBalance] = useState(() => {
    const saved = localStorage.getItem('stabilityVaultBalance');
    return saved !== null ? parseFloat(saved) : 937.50;
  });

  useEffect(() => {
    localStorage.setItem('isAutoSweepActive', JSON.stringify(isAutoSweepActive));
  }, [isAutoSweepActive]);

  useEffect(() => {
    localStorage.setItem('cardLimitEnabled', JSON.stringify(cardLimitEnabled));
  }, [cardLimitEnabled]);

  useEffect(() => {
    localStorage.setItem('cardLimitValue', JSON.stringify(cardLimitValue));
  }, [cardLimitValue]);

  useEffect(() => {
    localStorage.setItem('stabilityVaultBalance', JSON.stringify(stabilityVaultBalance));
  }, [stabilityVaultBalance]);
  
  // Modals state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [expenseRecords, setExpenseRecords] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const dashboardReportRef = useRef(null);

  // Forms state
  const [authMode, setAuthMode] = useState('login'); // login or register
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    profession: 'Freelance Designer',
    targetSavings: 1500.0,
    roundUpBucketThreshold: 50.0
  });

  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    category: 'FREELANCE',
    source: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: 'FOOD',
    date: new Date().toISOString().split('T')[0],
    description: '',
    accountName: ACCOUNT_OPTIONS[0].name,
    accountType: ACCOUNT_OPTIONS[0].type,
    upiId: ACCOUNT_OPTIONS[0].upiId
  });

  const [stabilityAdvice, setStabilityAdvice] = useState('');
  const [stabilityData, setStabilityData] = useState(null);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [savingsForm, setSavingsForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: ''
  });
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [contributeGoalId, setContributeGoalId] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [netWorthData, setNetWorthData] = useState({ totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
  
  const [roundUpHistory, setRoundUpHistory] = useState([]);

  const AUTO_ROUND_UP_GOAL_NAME = 'Auto Round-Up Savings';
  const roundUpBucketThreshold = user?.roundUpBucketThreshold ?? 50.0;
  const roundUpBucketGoal = savingsGoals.find(goal => goal.name === AUTO_ROUND_UP_GOAL_NAME);
  const activeSavingsGoals = savingsGoals.filter(goal => goal.name !== AUTO_ROUND_UP_GOAL_NAME);
  const roundUpBucketBalance = roundUpBucketGoal?.currentAmount || 0;
  const roundUpBucketRemaining = Math.max(0, roundUpBucketThreshold - roundUpBucketBalance);

  useEffect(() => {
    console.log("ROUND-UP DEBUG:", { 
      autoRoundUpEnabled: user?.autoRoundUpEnabled, 
      expenseRecordsLength: expenseRecords.length,
      firstExpense: expenseRecords[0]
    });
    if (user?.autoRoundUpEnabled && expenseRecords.length > 0) {
      const generatedHistory = expenseRecords
        .filter(exp => exp.amount > 0)
        .map((exp, index) => {
          let rounded = Math.ceil(exp.amount / 10) * 10;
          if (rounded === exp.amount) rounded += 10;
          const spare = parseFloat((rounded - exp.amount).toFixed(2));
          const bucketIndex = activeSavingsGoals.length > 0 ? index % activeSavingsGoals.length : 0;
          return {
            id: exp.id || Math.random(),
            date: exp.date,
            expenseAmount: exp.amount,
            roundedTo: rounded,
            spareChange: spare,
            goalName: activeSavingsGoals[bucketIndex]?.name || 'Reserve Bucket'
          };
        })
        .filter(r => r.spareChange > 0 && r.spareChange <= 10)
        .slice(0, 50); // limit to last 50
      setRoundUpHistory(generatedHistory);
    } else {
      setRoundUpHistory([]);
    }
  }, [expenseRecords, user?.autoRoundUpEnabled, activeSavingsGoals]);

  const totalSavingsGoalTarget = activeSavingsGoals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0);
  const totalSavingsGoalSaved = activeSavingsGoals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
  const totalSavingsGoalRemaining = Math.max(0, totalSavingsGoalTarget - totalSavingsGoalSaved);
  const recommendedMonthlySavings = stabilityData?.recommendedSavings || 0;
  const vaultRate = netWorthData.netWorth >= 0 ? 0.15 : 0.10;
  const vaultAllocation = recommendedMonthlySavings * vaultRate;
  const goalAllocation = Math.max(0, recommendedMonthlySavings - vaultAllocation);
  const goalContributionPerGoal = activeSavingsGoals.length > 0 ? (goalAllocation / activeSavingsGoals.length) : 0;
  const goalCompletionMonths = goalAllocation > 0 ? Math.max(0, totalSavingsGoalRemaining / goalAllocation) : Infinity;
  const [advisorView, setAdvisorView] = useState('report'); // 'report' or 'chat'
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: '' }
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    setChatMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === 'ai') {
        return [{ sender: 'ai', text: t('stability.copilotGreeting') }];
      }
      return prev;
    });
  }, [language]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiProvider, setAiProvider] = useState('');
  const [isBankLinkOpen, setIsBankLinkOpen] = useState(false);
  const [bankLinkStep, setBankLinkStep] = useState(1);
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankLinkMobile, setBankLinkMobile] = useState('');
  const [bankLinkOtp, setBankLinkOtp] = useState('');
  const paymentAccounts = profileDetails.linkedAccounts?.length
    ? profileDetails.linkedAccounts.map((account) => ({
        name: account.name,
        type: account.type,
        upiId: account.upiId || ''
      }))
    : ACCOUNT_OPTIONS;

  const handleSaveProfile = async () => {
    setProfileDetails(profileDraft);
    localStorage.setItem('profileDetails', JSON.stringify(profileDraft));

    if (!backendOffline && token) {
      try {
        const updated = await finguardApi.updateProfile(token, {
          fullName: profileDraft.fullName || user?.fullName,
          profession: profileDraft.profession || user?.profession,
          targetSavings: profileDraft.targetSavings ?? user?.targetSavings,
          roundUpBucketThreshold: profileDraft.roundUpBucketThreshold ?? user?.roundUpBucketThreshold
        });
        const mergedUser = { ...user, fullName: updated.fullName, profession: updated.profession, targetSavings: updated.targetSavings, roundUpBucketThreshold: updated.roundUpBucketThreshold };
        setUser(mergedUser);
        localStorage.setItem('user', JSON.stringify(mergedUser));
      } catch (err) {
        console.error('Profile API update failed', err);
        alert(t('alerts.profileSyncFailed'));
      }
    }
    setIsProfileEditing(false);
  };

  const resetIncomeForm = () => {
    setIncomeForm({
      amount: '',
      category: 'FREELANCE',
      source: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setEditingIncomeId(null);
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      amount: '',
      category: 'FOOD',
      date: new Date().toISOString().split('T')[0],
      description: '',
      accountName: paymentAccounts[0]?.name || 'Primary Bank',
      accountType: paymentAccounts[0]?.type || 'BANK',
      upiId: paymentAccounts[0]?.upiId || ''
    });
    setEditingExpenseId(null);
  };

  const openIncomeModal = (record = null) => {
    if (record) {
      setEditingIncomeId(record.id);
      setIncomeForm({
        amount: String(record.amount),
        category: record.category,
        source: record.source || '',
        date: record.date,
        description: record.description || ''
      });
    } else {
      resetIncomeForm();
    }
    setIsIncomeModalOpen(true);
  };

  const openExpenseModal = (record = null) => {
    if (record) {
      setEditingExpenseId(record.id);
      setExpenseForm({
        amount: String(record.amount),
        category: record.category,
        date: record.date,
        description: record.description || '',
        accountName: record.accountName || paymentAccounts[0]?.name || 'Primary Bank',
        accountType: record.accountType || paymentAccounts[0]?.type || 'BANK',
        upiId: record.upiId || ''
      });
    } else {
      resetExpenseForm();
    }
    setIsExpenseModalOpen(true);
  };

  const prefillExpenseFromReceipt = (data) => {
    setExpenseForm({
      amount: String(data.amount || ''),
      category: data.category || 'OTHER',
      date: data.date || new Date().toISOString().split('T')[0],
      description: data.description || '',
      accountName: paymentAccounts[0]?.name || 'Primary Bank',
      accountType: paymentAccounts[0]?.type || 'BANK',
      upiId: paymentAccounts[0]?.upiId || ''
    });
    setEditingExpenseId(null);
    setCurrentTab('expense');
    setIsExpenseModalOpen(true);
  };

  const handleDownloadReport = async () => {
    setIsGeneratingReport(true);
    try {
      await generateFinancialReport({
        user,
        dashboardData: { ...dashboardData, ...netWorthData },
        savingsGoals,
        roundUpBucketBalance,
        roundUpBucketThreshold,
        captureRoot: dashboardReportRef.current,
        chartSelectors: [
          '#dashboard-cashflow-chart',
          '#dashboard-expense-pie',
          '#dashboard-fsi-chart',
        ],
        t,
      });
    } catch (error) {
      console.error('PDF report generation failed', error);
      alert(t('insights.reportError'));
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleFinishBankLink = () => {
    if (!selectedBank) return;
    
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newAccount = {
      name: `${selectedBank} Savings`,
      type: 'BANK',
      maskedAccount: `XXXX ${randomSuffix}`,
      upiId: '',
      monthlyLimit: 50000
    };

    // Update Profile state
    const updatedAccounts = [...(profileDetails.linkedAccounts || []), newAccount];
    const updatedProfile = { ...profileDetails, linkedAccounts: updatedAccounts };
    setProfileDetails(updatedProfile);
    setProfileDraft(updatedProfile);
    localStorage.setItem('profileDetails', JSON.stringify(updatedProfile));

    // Update Dashboard aggregates with starting balance simulation
    const startingBalance = 45000.0;
    const newTx = {
      id: Math.floor(100000 + Math.random() * 900000),
      amount: startingBalance,
      category: 'BUSINESS',
      date: new Date().toISOString().split('T')[0],
      description: 'Starting balance',
      referenceId: null,
      type: 'INCOME',
      upiId: '',
      accountName: `${selectedBank} Savings`,
      accountType: 'BANK'
    };

    const updatedTxs = [newTx, ...dashboardData.recentTransactions];
    const updatedIncome = dashboardData.totalIncome + startingBalance;
    const updatedBalance = dashboardData.balance + startingBalance;

    // Add notification
    const newNotif = {
      id: Math.floor(100000 + Math.random() * 900000),
      title: t('alerts.bankLinkedTitle'),
      message: t('alerts.bankLinkedMessage', {
        bank: selectedBank,
        account: `XXXX ${randomSuffix}`,
        amount: `₹${startingBalance.toLocaleString('en-IN')}`,
      }),
      type: 'INFO',
      createdAt: new Date().toISOString(),
      isRead: false
    };

    const updatedNotifs = [newNotif, ...dashboardData.notifications];

    setDashboardData({
      ...dashboardData,
      totalIncome: updatedIncome,
      balance: updatedBalance,
      recentTransactions: updatedTxs,
      notifications: updatedNotifs
    });

    setIsBankLinkOpen(false);
    setBankLinkStep(1);
    setSelectedBank(null);
    setBankLinkMobile('');
    setBankLinkOtp('');
  };

  const updateProfileListItem = (listName, index, field, value) => {
    setProfileDraft((current) => ({
      ...current,
      [listName]: current[listName].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addProfileListItem = (listName, item) => {
    setProfileDraft((current) => ({
      ...current,
      [listName]: [...current[listName], item]
    }));
  };

  const removeProfileListItem = (listName, index) => {
    setProfileDraft((current) => ({
      ...current,
      [listName]: current[listName].filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  // Apply Theme class
  useEffect(() => {
    const root = window.document.documentElement;
    if (isLightMode) {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }
  }, [isLightMode]);

  const fetchUserProfile = async () => {
    if (!token || backendOffline) return;
    try {
      const data = await finguardApi.getProfile(token);
      setUser((prev) => {
        const mergedUser = {
          ...prev,
          userId: data.id,
          username: data.username,
          email: data.email,
          fullName: data.fullName,
          profession: data.profession,
          targetSavings: data.targetSavings,
          autoRoundUpEnabled: data.autoRoundUpEnabled,
          roundUpBucketThreshold: data.roundUpBucketThreshold,
          role: data.role
        };
        localStorage.setItem('user', JSON.stringify(mergedUser));
        return mergedUser;
      });
      setProfileDraft((prev) => ({
        ...prev,
        fullName: data.fullName,
        profession: data.profession,
        targetSavings: data.targetSavings,
        roundUpBucketThreshold: data.roundUpBucketThreshold ?? 50.0
      }));
      setProfileDetails((prev) => ({
        ...prev,
        fullName: data.fullName,
        profession: data.profession,
        targetSavings: data.targetSavings,
        roundUpBucketThreshold: data.roundUpBucketThreshold ?? 50.0
      }));
    } catch (err) {
      console.warn('GET /api/auth/profile failed', err);
    }
  };

  const fetchIncomes = async () => {
    if (!token || backendOffline) return;
    try {
      const data = await finguardApi.getIncomes(token);
      setIncomeRecords(data);
    } catch (err) {
      console.warn('GET /api/income failed', err);
    }
  };

  const fetchExpenses = async () => {
    if (!token || backendOffline) return;
    try {
      const data = await finguardApi.getExpenses(token);
      setExpenseRecords(data);
    } catch (err) {
      console.warn('GET /api/expense failed', err);
    }
  };

  const fetchFraudAlerts = async () => {
    if (!token || backendOffline) return;
    try {
      const data = await finguardApi.getFraudAlerts(token);
      setFraudAlerts(data);
      setDashboardData((prev) => ({ ...prev, fraudAlerts: data }));
    } catch (err) {
      console.warn('GET /api/fraud/alerts failed', err);
    }
  };

  const fetchNotifications = async () => {
    if (!token || backendOffline) return;
    try {
      const data = await finguardApi.getNotifications(token);
      setNotifications(data);
      setDashboardData((prev) => ({ ...prev, notifications: data }));
    } catch (err) {
      console.warn('GET /api/notifications failed', err);
    }
  };

  // Fetch complete Dashboard stats
  const fetchDashboard = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let data = await finguardApi.getDashboard(token);
        
        // Dynamic Ceiling check & warning injection
        if (cardLimitEnabled && data.totalExpense > cardLimitValue) {
          const limitAlertDescription = t('alerts.ceilingExceededDetail', {
            expense: formatCurrency(data.totalExpense),
            limit: formatCurrency(cardLimitValue),
          });
          const alertExists = data.fraudAlerts.some(a => a.alertType === 'LIMIT_SPIKE');
          if (!alertExists) {
            const limitAlert = {
              id: 9999,
              alertType: 'LIMIT_SPIKE',
              description: limitAlertDescription,
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
              amount: data.totalExpense - cardLimitValue,
              category: 'OVERFLOW'
            };
            data.fraudAlerts = [limitAlert, ...data.fraudAlerts];
            data.notifications = [{
              id: 9999,
              title: t('alerts.spendingLimitBreached'),
              message: limitAlertDescription,
              type: 'WARNING',
              isRead: false,
              createdAt: new Date().toISOString()
            }, ...data.notifications];
          }
        }
        
        setDashboardData(data);
        setFraudAlerts(data.fraudAlerts || []);
        setNotifications(data.notifications || []);
        setBackendOffline(false);
    } catch (err) {
      console.warn("Backend service unavailable. Using local continuity data.");
      setBackendOffline(true);
      // Keep static fallback data
    } finally {
      setLoading(false);
    }
  };

  const fetchStabilityReport = async () => {
    if (!token) return;
    try {
      const data = await finguardApi.getStability(token);
      setStabilityAdvice(data.aiSuggestions);
      setStabilityData(data);
    } catch (err) {
      // Fallback response for offline or missing key
      setStabilityAdvice(`### FinGuard API Advisor Report for John Doe (Freelancer)\n* **Financial Stability Score (FSI):** 82.5/100\n* **Income Volatility Factor:** 0.28\n* **Expense Burn Rate:** 64.8%\n\n✨ **EXCELLENT STABILITY:** Your financial system is healthy. Volatility is minimal, and you are maintaining excellent cash margins!\n\n#### Action Items:\n1. **Sweep and Invest:** Your passive reserves are excellent. Sweep 20% of your current balance into a high-yield instrument.\n2. **Increase Targets:** Since you are comfortably on track to hit your savings goal (Rs 1,500), consider raising your threshold to build long-term capital assets.`);
    }
  };

  const fetchNetWorth = async () => {
    if (!token) return;
    try {
      const [assets, liabilities] = await Promise.all([
        finguardApi.getAssets(token),
        finguardApi.getLiabilities(token)
      ]);
      const totalAssets = (assets || []).reduce((s, a) => s + a.value, 0);
      const totalLiabilities = (liabilities || []).reduce((s, l) => s + l.value, 0);
      setNetWorthData({ totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities });
    } catch (err) {
      console.warn('Net worth fetch failed', err);
    }
  };

  const fetchSavingsGoals = async () => {
    if (!token) return;
    try {
      const data = await finguardApi.getSavingsGoals(token);
      setSavingsGoals(data || []);
    } catch (err) {
      console.warn('Savings goals fetch failed', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboard();
      fetchStabilityReport();
      fetchUserProfile();
      fetchNetWorth();
      fetchSavingsGoals();
      fetchExpenses(); // Needed for auto round-up history on dashboard
    }
  }, [token]);

  useEffect(() => {
    if (!token || backendOffline) return;
    if (currentTab === 'income') fetchIncomes();
    if (currentTab === 'expense') fetchExpenses();
    if (currentTab === 'fraud') fetchFraudAlerts();
    if (currentTab === 'savings') fetchSavingsGoals();
  }, [currentTab, token, backendOffline]);

  useEffect(() => {
    if (isNotificationsOpen && token && !backendOffline) {
      fetchNotifications();
    }
  }, [isNotificationsOpen, token, backendOffline]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [currentTab]);

  useEffect(() => {
    if (advisorView === 'chat') {
      const chatBox = document.getElementById('ai-chat-box');
      if (chatBox) {
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [chatMessages, isAiTyping, advisorView]);

  // Auth Operations
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await finguardApi.login(loginForm);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setToken(data.token);
        setUser(data);
        setBackendOffline(false);
    } catch (err) {
      // Local continuity sign-in for development and offline review.
      console.log("Offline login fallback activated.");
      if (loginForm.username === 'demo' && (loginForm.password === 'password123' || loginForm.password === 'password')) {
        const mockUser = {
          userId: 1,
          username: 'demo',
          email: 'user@finguard.ai',
          fullName: 'John Doe',
          role: 'USER',
          profession: 'Freelance Designer & Gig Worker',
          targetSavings: 1500.0,
          autoRoundUpEnabled: true,
          roundUpBucketThreshold: 50.0
        };
        localStorage.setItem('token', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify(mockUser));
        setToken('mock-jwt-token');
        setUser(mockUser);
        setBackendOffline(true);
      } else {
        alert(t('alerts.authUnavailable'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await finguardApi.register(registerForm);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setToken(data.token);
        setUser(data);
        setBackendOffline(false);
    } catch (err) {
      alert(t('alerts.registrationUnavailable'));
      setAuthMode('login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  // Transaction Operations
  const handleAddIncome = async (e) => {
    e.preventDefault();
    const payload = {
      ...incomeForm,
      amount: parseFloat(incomeForm.amount)
    };
    try {
      if (isAutoSweepActive && !editingIncomeId) {
        const sweepRate = netWorthData?.netWorth != null
          ? (netWorthData.netWorth >= 0 ? 0.15 : 0.10)
          : 0.15;
        setStabilityVaultBalance(prev => prev + (payload.amount * sweepRate));
      }
      if (backendOffline) {
        // Mock add locally
        const newTx = {
          id: Date.now(),
          type: 'INCOME',
          amount: payload.amount,
          category: payload.category,
          date: payload.date,
          description: payload.description || payload.source,
          source: payload.source
        };
        const updatedTxs = [newTx, ...dashboardData.recentTransactions];
        const updatedIncome = dashboardData.totalIncome + payload.amount;
        setDashboardData({
          ...dashboardData,
          totalIncome: updatedIncome,
          balance: updatedIncome - dashboardData.totalExpense,
          recentTransactions: updatedTxs
        });
        setIncomeRecords((prev) => editingIncomeId
          ? prev.map((item) => item.id === editingIncomeId ? { ...item, ...payload } : item)
          : [newTx, ...prev]);
        setIsIncomeModalOpen(false);
        resetIncomeForm();
      } else if (editingIncomeId) {
        await finguardApi.updateIncome(token, editingIncomeId, payload);
        setIsIncomeModalOpen(false);
        resetIncomeForm();
        fetchIncomes();
        fetchDashboard();
        fetchStabilityReport();
      } else {
        await finguardApi.addIncome(token, payload);
          setIsIncomeModalOpen(false);
        resetIncomeForm();
        fetchIncomes();
          fetchDashboard();
          fetchStabilityReport();
      }
    } catch (err) {
      alert(t('alerts.incomeSaveError'));
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const payload = {
      ...expenseForm,
      amount: parseFloat(expenseForm.amount)
    };
    try {
      if (backendOffline) {
        // Mock add locally
        const newTx = {
          id: Date.now(),
          type: 'EXPENSE',
          amount: payload.amount,
          category: payload.category,
          date: payload.date,
          description: payload.description,
          accountName: payload.accountName,
          accountType: payload.accountType,
          upiId: payload.upiId
        };
        const updatedTxs = [newTx, ...dashboardData.recentTransactions];
        const updatedExpense = dashboardData.totalExpense + payload.amount;
        
        // Mock alert trigger for MacBook outlier
        let newAlerts = [...dashboardData.fraudAlerts];
        let newNotifs = [...dashboardData.notifications];
        if (payload.amount > 1000) {
          const alertDescription = t('alerts.suspiciousExpense', {
            amount: formatCurrency(payload.amount),
            category: categoryLabel(t, payload.category),
          });
          const alertObj = {
            id: Date.now(),
            alertType: 'LARGE_OUTLIER',
            description: alertDescription,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            amount: payload.amount,
            category: payload.category
          };
          newAlerts.unshift(alertObj);
          newNotifs.unshift({
            id: Date.now(),
            title: t('anomaly.suspicious'),
            message: alertObj.description,
            type: 'FRAUD',
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }

        // Limit breach warning trigger
        if (cardLimitEnabled && (updatedExpense > cardLimitValue)) {
          const limitAlertDescription = t('alerts.ceilingExceededDetail', {
            expense: formatCurrency(updatedExpense),
            limit: formatCurrency(cardLimitValue),
          });
          const exists = newAlerts.some(a => a.alertType === 'LIMIT_SPIKE');
          if (!exists) {
            const limitAlert = {
              id: 9999,
              alertType: 'LIMIT_SPIKE',
              description: limitAlertDescription,
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
              amount: updatedExpense - cardLimitValue,
              category: 'OVERFLOW'
            };
            newAlerts.unshift(limitAlert);
            newNotifs.unshift({
              id: 9999,
              title: t('alerts.spendingLimitBreached'),
              message: limitAlertDescription,
              type: 'WARNING',
              isRead: false,
              createdAt: new Date().toISOString()
            });
          }
        }

        setDashboardData({
          ...dashboardData,
          totalExpense: updatedExpense,
          balance: dashboardData.totalIncome - updatedExpense,
          recentTransactions: updatedTxs,
          fraudAlerts: newAlerts,
          notifications: newNotifs
        });
        setIsExpenseModalOpen(false);
        resetExpenseForm();
      } else if (editingExpenseId) {
        await finguardApi.updateExpense(token, editingExpenseId, payload);
        setIsExpenseModalOpen(false);
        resetExpenseForm();
        fetchExpenses();
        fetchDashboard();
        fetchStabilityReport();
        fetchFraudAlerts();
      } else {
        await finguardApi.addExpense(token, payload);
        setIsExpenseModalOpen(false);
        resetExpenseForm();
        fetchExpenses();
        fetchDashboard();
        fetchStabilityReport();
        fetchFraudAlerts();
        fetchNotifications();
      }
    } catch (err) {
      alert(t('alerts.expenseSaveError'));
    }
  };

  const handleDeleteTransaction = async (id, type) => {
    if (!confirm(t('messages.deleteConfirm'))) return;
    try {
      if (backendOffline) {
        // Mock remove locally
        const tx = dashboardData.recentTransactions.find(t => t.id === id);
        if (!tx) return;
        const updatedTxs = dashboardData.recentTransactions.filter(t => t.id !== id);
        if (type === 'INCOME') {
          const updatedIncome = dashboardData.totalIncome - tx.amount;
          setDashboardData({
            ...dashboardData,
            totalIncome: updatedIncome,
            balance: updatedIncome - dashboardData.totalExpense,
            recentTransactions: updatedTxs
          });
        } else {
          const updatedExpense = dashboardData.totalExpense - tx.amount;
          setDashboardData({
            ...dashboardData,
            totalExpense: updatedExpense,
            balance: dashboardData.totalIncome - updatedExpense,
            recentTransactions: updatedTxs
          });
        }
      } else {
        const endpoint = type.toLowerCase() === 'income' ? 'income' : 'expense';
        if (type === 'INCOME') {
          await finguardApi.deleteIncome(token, id);
          fetchIncomes();
        } else {
          await finguardApi.deleteExpense(token, id);
          fetchExpenses();
        }
          fetchDashboard();
          fetchStabilityReport();
        if (type === 'EXPENSE') fetchFraudAlerts();
      }
    } catch (err) {
      alert(t('alerts.deleteError'));
    }
  };

  const handleAddSavingsGoal = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: savingsForm.name,
        targetAmount: parseFloat(savingsForm.targetAmount),
        currentAmount: parseFloat(savingsForm.currentAmount || '0'),
        targetDate: savingsForm.targetDate || null
      };
      await finguardApi.addSavingsGoal(token, payload);
      setIsSavingsModalOpen(false);
      setSavingsForm({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
      fetchSavingsGoals();
    } catch (err) {
      alert('Failed to save savings goal');
    }
  };

  const handleContributeSavingsGoal = async (e) => {
    e.preventDefault();
    try {
      const amt = parseFloat(contributeAmount);
      if (isNaN(amt) || amt === 0) return;
      await finguardApi.contributeToSavingsGoal(token, contributeGoalId, amt);
      setIsContributeModalOpen(false);
      setContributeGoalId(null);
      setContributeAmount('');
      fetchSavingsGoals();
    } catch (err) {
      alert('Failed to contribute to savings goal');
    }
  };

  const handleDeleteSavingsGoal = async (id) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await finguardApi.deleteSavingsGoal(token, id);
      fetchSavingsGoals();
    } catch (err) {
      alert('Failed to delete savings goal');
    }
  };

  const toggleAutoRoundUp = async () => {
    if (!user) return;
    try {
      const nextVal = !user.autoRoundUpEnabled;
      await finguardApi.updateProfile(token, {
        fullName: user.fullName,
        profession: user.profession,
        targetSavings: user.targetSavings,
        autoRoundUpEnabled: nextVal,
        roundUpBucketThreshold: user.roundUpBucketThreshold
      });
      const updatedUser = { ...user, autoRoundUpEnabled: nextVal };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      alert('Failed to toggle auto round-up');
    }
  };

  const handleResolveAlert = async (id, status) => {
    try {
      if (backendOffline) {
        const sourceAlerts = fraudAlerts.length ? fraudAlerts : dashboardData.fraudAlerts;
        const updatedAlerts = sourceAlerts.map(a => 
          a.id === id ? { ...a, status: status } : a
        );
        setFraudAlerts(updatedAlerts);
        setDashboardData({ ...dashboardData, fraudAlerts: updatedAlerts });
      } else {
        await finguardApi.resolveFraudAlert(token, id, status);
        fetchFraudAlerts();
          fetchDashboard();
        }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      if (backendOffline) {
        const updatedNotifs = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
        setNotifications(updatedNotifs);
        setDashboardData({ ...dashboardData, notifications: updatedNotifs });
      } else {
        await finguardApi.markNotificationRead(token, id);
        fetchNotifications();
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (backendOffline) {
        const updatedNotifs = notifications.map((n) => ({ ...n, isRead: true }));
        setNotifications(updatedNotifs);
        setDashboardData({ ...dashboardData, notifications: updatedNotifs });
      } else {
        await finguardApi.markAllNotificationsRead(token);
        fetchNotifications();
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Chart Mappings
  const chartData = [
    { name: t('income.title'), amount: dashboardData.totalIncome },
    { name: t('expense.title'), amount: dashboardData.totalExpense }
  ];

  const expensePieData = Object.entries(dashboardData.monthlyExpensesByCategory).map(([key, val]) => ({
    name: categoryLabel(t, key),
    value: val
  })).filter(d => d.value > 0);

  const projectionChartData = React.useMemo(() => {
    if (!stabilityData || !stabilityData.projectedIncome) return [];
    return stabilityData.projectionMonthLabels.map((label, index) => ({
      name: label,
      income: stabilityData.projectedIncome[index],
      expense: stabilityData.projectedExpense[index],
      linear: dashboardData.incomeForecast?.linear?.[index] ?? 0,
      holt: dashboardData.incomeForecast?.holt?.[index] ?? 0,
      arima: dashboardData.incomeForecast?.arima?.[index] ?? 0,
      lstm: dashboardData.incomeForecast?.lstm?.[index] ?? 0,
      ensemble: dashboardData.incomeForecast?.ensemble?.[index] ?? 0
    }));
  }, [stabilityData, dashboardData]);

  const incomePieData = Object.entries(dashboardData.monthlyIncomesByCategory).map(([key, val]) => ({
    name: categoryLabel(t, key),
    value: val
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

  const getTrendData = () => {
    const transactions = [...dashboardData.recentTransactions].reverse();
    const dailyData = {};
    
    if (transactions.length === 0) {
      return [
        { date: '05-10', inflow: 1200, outflow: 400, netReserve: 800 },
        { date: '05-12', inflow: 1850, outflow: 600, netReserve: 1250 },
        { date: '05-15', inflow: 3200, outflow: 1500, netReserve: 1700 },
        { date: '05-18', inflow: 6250, outflow: 4051, netReserve: 2199 }
      ];
    }
    
    let runningInflow = 0;
    let runningOutflow = 0;
    
    transactions.forEach((tx) => {
      const d = tx.date ? tx.date.substring(5) : '05-01';
      if (!dailyData[d]) {
        dailyData[d] = { inflow: 0, outflow: 0 };
      }
      if (tx.type === 'INCOME') {
        dailyData[d].inflow += tx.amount;
      } else {
        dailyData[d].outflow += tx.amount;
      }
    });
    
    const sortedDates = Object.keys(dailyData).sort();
    return sortedDates.map((date) => {
      runningInflow += dailyData[date].inflow;
      runningOutflow += dailyData[date].outflow;
      return {
        date,
        inflow: runningInflow,
        outflow: runningOutflow,
        netReserve: runningInflow - runningOutflow
      };
    });
  };

  const renderMarkdownText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Render Header 3: ### Some Title
      if (trimmed.startsWith('### ')) {
        const headerText = trimmed.replace('### ', '');
        const parts = headerText.split('**');
        return (
          <h4 key={idx} style={{
            fontSize: '0.92rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginTop: '0.85rem',
            marginBottom: '0.45rem',
            paddingBottom: '0.2rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            {parts.map((part, pIdx) => 
              pIdx % 2 === 1 ? <span key={pIdx} className="gradient-text-primary" style={{ fontWeight: '800' }}>{part}</span> : part
            )}
          </h4>
        );
      }
      
      // Render Bullet points: * Item or - Item
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const bulletText = trimmed.substring(2);
        const parts = bulletText.split('**');
        return (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            margin: '0.3rem 0 0.3rem 0.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.45'
          }}>
            <span style={{ color: 'var(--color-success)', fontSize: '0.85rem', flexShrink: 0 }}>•</span>
            <span>
              {parts.map((part, pIdx) => 
                pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{part}</strong> : part
              )}
            </span>
          </div>
        );
      }

      // Render Numbered lists: 1. Item or 2. Item
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        const num = numMatch[1];
        const numText = numMatch[2];
        const parts = numText.split('**');
        return (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            margin: '0.35rem 0 0.35rem 0.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.45'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: 'var(--color-primary-light)',
              fontSize: '0.68rem',
              fontWeight: '700',
              flexShrink: 0,
              marginTop: '1px'
            }}>{num}</span>
            <span>
              {parts.map((part, pIdx) => 
                pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{part}</strong> : part
              )}
            </span>
          </div>
        );
      }

      // Default paragraph
      if (trimmed === '') {
        return <div key={idx} style={{ height: '0.3rem' }} />;
      }

      const parts = trimmed.split('**');
      return (
        <p key={idx} style={{
          margin: '0.2rem 0',
          color: 'var(--text-secondary)',
          fontSize: '0.82rem',
          lineHeight: '1.45'
        }}>
          {parts.map((part, pIdx) => 
            pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{part}</strong> : part
          )}
        </p>
      );
    });
  };

  const generateLocalAiResponse = (msgText) => {
      const textLower = msgText.toLowerCase();
      const fsi = dashboardData.stabilityScore;
      const balance = dashboardData.balance;
      const expenses = dashboardData.totalExpense;
      const savings = dashboardData.savingsPotential;
      const runway = expenses > 0 ? (balance / expenses).toFixed(1) : '99+';
    const profession = user?.profession || t('auth.professionExample');
    const risk = riskLevelLabel(t, dashboardData.riskLevel);

    if (textLower.includes('save') || textLower.includes('goal')) {
      return t('stability.localSavingsPlan', {
        balance: `₹${balance.toLocaleString('en-IN')}`,
        savings: `₹${savings.toLocaleString('en-IN')}`,
        runway,
      });
    }
    if (textLower.includes('invest') || textLower.includes('sip')) {
      return t('stability.localInvestGuidance', {
        savings: `₹${savings.toLocaleString('en-IN')}`,
      });
    }
    return t('stability.localSummaryFull', {
      profession,
      score: fsi?.toFixed?.(1) ?? fsi,
      risk,
      balance: `₹${balance.toLocaleString('en-IN')}`,
      runway,
    });
  };

  const handleSendChatMessage = async (textToSubmit) => {
    const msgText = textToSubmit || chatInput;
    if (!msgText.trim()) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text: msgText }]);
    setChatInput('');
    setIsAiTyping(true);

    const history = chatMessages.slice(-8).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    try {
      const data = await finguardApi.advisorChat(token, { message: msgText, history });
      setAiProvider(data.realAiUsed ? data.provider : 'fallback');
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: data.reply, realAi: data.realAiUsed, provider: data.provider }
      ]);
    } catch (err) {
      console.warn('AI advisor unavailable, using local fallback.', err);
      setAiProvider('offline');
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: generateLocalAiResponse(msgText), realAi: false, provider: 'offline' }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const trendData = getTrendData();
  const activeNotifications = notifications.length ? notifications : dashboardData.notifications;
  const activeFraudAlerts = fraudAlerts.length ? fraudAlerts : dashboardData.fraudAlerts;
  const displayIncomes = incomeRecords.length
    ? incomeRecords
    : dashboardData.recentTransactions.filter((t) => t.type === 'INCOME');
  const displayExpenses = expenseRecords.length
    ? expenseRecords
    : dashboardData.recentTransactions.filter((t) => t.type === 'EXPENSE');

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-lang-float">
          <LanguageSelector />
        </div>

        <div className="login-page-layout">
          <section className="login-hero">
            <div className="login-hero-brand">
              <span className="login-hero-logo">
                <Shield size={22} strokeWidth={2.2} />
              </span>
            <div>
                <h1 className="login-hero-name">FinGuard API</h1>
                <span className="login-hero-tag">{t('ui.brandTagline')}</span>
            </div>
          </div>

            <h2 className="login-hero-title">{t('ui.loginHeroTitle')}</h2>
            <p className="login-hero-body">{t('ui.loginHeroBody')}</p>

            <ul className="login-hero-points">
              <li>
                <TrendingUp size={16} />
                <span>{t('ui.loginPointStability')}</span>
              </li>
              <li>
                <Shield size={16} />
                <span>{t('ui.loginPointShield')}</span>
              </li>
              <li>
                <PieIcon size={16} />
                <span>{t('ui.loginPointLedger')}</span>
              </li>
            </ul>
          </section>

          <section className="login-panel">
            <div className="login-card">
            <div className="login-card-heading">
              <h2>{authMode === 'login' ? t('ui.welcomeBack') : t('ui.createAccount')}</h2>
              <p>{authMode === 'login' ? t('ui.loginSubtitle') : t('ui.registerSubtitle')}</p>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="login-form">
                <div className="login-field">
                    <label className="login-label" htmlFor="login-username">{t('auth.username')}</label>
                  <input
                      id="login-username"
                    type="text"
                    className="login-input"
                    placeholder={t('ui.usernamePlaceholder')}
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      autoComplete="username"
                    required
                  />
                </div>

                <div className="login-field">
                    <label className="login-label" htmlFor="login-password">{t('auth.password')}</label>
                  <input
                      id="login-password"
                    type="password"
                    className="login-input"
                      placeholder={t('auth.passwordPlaceholder')}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      autoComplete="current-password"
                    required
                  />
                </div>

                <button type="submit" className="login-submit-btn">
                    <span>{t('common.login')}</span>
                    <ChevronRight size={18} />
                </button>

                <p className="login-toggle-text">
                  {t('ui.newToFinguard')}{' '}
                  <span onClick={() => setAuthMode('register')}>{t('ui.createAnAccount')}</span>
                </p>

                  <p className="login-footnote">{t('ui.loginFootnote')}</p>
                </form>
            ) : (
              <form onSubmit={handleRegister} className="login-form">
                <div className="login-field-row">
                  <div className="login-field">
                    <label className="login-label">{t('auth.username')}</label>
                      <input type="text" className="login-input" placeholder={t('auth.usernameExample')}
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      required />
                  </div>
                  <div className="login-field">
                    <label className="login-label">{t('auth.email')}</label>
                      <input type="email" className="login-input" placeholder={t('auth.emailExample')}
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label">{t('auth.fullName')}</label>
                    <input type="text" className="login-input" placeholder={t('auth.fullNameExample')}
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                    required />
                </div>

                <div className="login-field-row">
                  <div className="login-field">
                    <label className="login-label">{t('auth.profession')}</label>
                      <input type="text" className="login-input" placeholder={t('auth.professionExample')}
                      value={registerForm.profession}
                      onChange={(e) => setRegisterForm({ ...registerForm, profession: e.target.value })}
                      required />
                  </div>
                  <div className="login-field">
                    <label className="login-label">{t('auth.targetSavings')} (₹)</label>
                      <input type="number" className="login-input" placeholder={t('auth.targetSavingsExample')}
                      value={registerForm.targetSavings}
                      onChange={(e) => setRegisterForm({ ...registerForm, targetSavings: parseFloat(e.target.value) })}
                      required />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label">Round-Up Bucket Threshold (₹)</label>
                    <input type="number" className="login-input" placeholder="e.g. 50"
                    value={registerForm.roundUpBucketThreshold}
                    onChange={(e) => setRegisterForm({ ...registerForm, roundUpBucketThreshold: parseFloat(e.target.value) })}
                    required />
                </div>

                <div className="login-field">
                  <label className="login-label">{t('auth.password')}</label>
                    <input type="password" className="login-input" placeholder={t('auth.passwordMinLength')}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required />
                </div>

                <button type="submit" className="login-submit-btn">
                    <span>{t('ui.createFreeAccount')}</span>
                    <ChevronRight size={18} />
                </button>

                <p className="login-toggle-text">
                  {t('ui.alreadyHaveAccount')}{' '}
                  <span onClick={() => setAuthMode('login')}>{t('ui.signInInstead')}</span>
                </p>
              </form>
            )}
          </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      {/* Radial glow background blobs */}
      <div className="bg-glow bg-glow-indigo"></div>
      <div className="bg-glow bg-glow-purple"></div>
      <div className="bg-glow bg-glow-emerald"></div>

      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() => setIsSidebarOpen((open) => !open)}
        aria-label={isSidebarOpen ? t('ui.closeMenu') : t('ui.openMenu')}
      >
        {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {isSidebarOpen && (
        <button
          type="button"
          className="mobile-sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-label={t('ui.closeMenu')}
        />
      )}
      
      {/* 1. Left Sidebar Navigation */}
      <aside className={`finguard-sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        
        {/* Brand */}
        <div className="sidebar-brand-center">
          <div className="sidebar-logo-mark" aria-hidden="true">
            <svg viewBox="0 0 48 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 2L6 9.5v13.5c0 11.2 7.6 21.7 18 26.5 10.4-4.8 18-15.3 18-26.5V9.5L24 2z" fill="#10B981"/>
              <text x="24" y="30" textAnchor="middle" fill="#FFFFFF" fontSize="17" fontWeight="700" fontFamily="Poppins, Inter, sans-serif">₹</text>
            </svg>
          </div>
          <h2 className="sidebar-app-name">
            <span className="sidebar-name-finguard">FinGuard</span>{' '}
            <span className="sidebar-name-ai">API</span>
          </h2>
          <p className="sidebar-brand-tagline">{t('ui.sidebarTagline')}</p>
        </div>

        {/* Profile card */}
        {user && (
          <div
            className="sidebar-profile-card"
            onClick={() => {
              setProfileDraft(profileDetails);
              setCurrentTab('profile');
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setProfileDraft(profileDetails);
                setCurrentTab('profile');
              }
            }}
          >
            <div className="sidebar-profile-avatar">
              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="sidebar-profile-meta">
              <span className="sidebar-welcome-text">{t('ui.welcomeShort')}</span>
              <h4 className="sidebar-profile-name">{user.fullName}</h4>
              <span className="sidebar-user-badge">{t('ui.userBadge')}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          <button
            type="button"
            className={`sidebar-nav-item nav-profile btn-secondary ${currentTab === 'profile' ? 'active-tab' : ''}`}
            onClick={() => {
              setProfileDraft(profileDetails);
              setCurrentTab('profile');
            }}
          >
            <UserIcon size={18} /> <span className="sidebar-nav-label">{t('common.profile')}</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item nav-dashboard btn-secondary ${currentTab === 'dashboard' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            <HomeIcon size={18} /> <span className="sidebar-nav-label">{t('dashboard.title')}</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item nav-income btn-secondary ${currentTab === 'income' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('income')}
          >
            <TrendingUp size={18} /> <span className="sidebar-nav-label">{t('income.title')}</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item nav-expense btn-secondary ${currentTab === 'expense' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('expense')}
          >
            <CreditCard size={18} /> <span className="sidebar-nav-label">{t('expense.title')}</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item nav-stability btn-secondary ${currentTab === 'stability' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('stability')}
          >
            <LineChartNavIcon size={18} /> <span className="sidebar-nav-label">{t('stability.title')}</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item nav-networth btn-secondary ${currentTab === 'networth' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('networth')}
          >
            <Landmark size={18} /> <span className="sidebar-nav-label">{t('networth.title')}</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item nav-savings btn-secondary ${currentTab === 'savings' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('savings')}
          >
            <PiggyBank size={18} /> <span className="sidebar-nav-label">{t('savings.title', 'Savings')}</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item nav-insights btn-secondary ${currentTab === 'insights' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('insights')}
          >
            <Brain size={18} /> <span className="sidebar-nav-label">{t('insights.title')}</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item nav-receipt btn-secondary ${currentTab === 'receipt' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('receipt')}
          >
            <ScanLine size={18} /> <span className="sidebar-nav-label">{t('receipt.title')}</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item nav-fraud btn-secondary ${currentTab === 'fraud' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('fraud')}
          >
            <Shield size={18} /> <span className="sidebar-nav-label">{t('anomaly.title')}</span>
            {activeFraudAlerts.filter(a => a.status === 'ACTIVE').length > 0 && (
              <span className="badge badge-high sidebar-nav-badge">
                {activeFraudAlerts.filter(a => a.status === 'ACTIVE').length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`sidebar-nav-item nav-notifications btn-secondary ${isNotificationsOpen ? 'active-tab' : ''}`}
            onClick={() => setIsNotificationsOpen((open) => !open)}
          >
            <Bell size={18} /> <span className="sidebar-nav-label">{t('ui.notifications')}</span>
            {activeNotifications.filter(n => !n.isRead).length > 0 && (
              <span className="badge badge-high sidebar-nav-badge">
                {activeNotifications.filter(n => !n.isRead).length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`sidebar-nav-item nav-reports btn-secondary ${isGeneratingReport ? 'active-tab' : ''}`}
            disabled={isGeneratingReport}
            onClick={() => {
              if (currentTab !== 'dashboard') {
                setCurrentTab('dashboard');
                setTimeout(() => handleDownloadReport(), 350);
              } else {
                handleDownloadReport();
              }
            }}
          >
            <FileText size={18} /> <span className="sidebar-nav-label">{t('insights.downloadReport')}</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {backendOffline && (
            <div className="sidebar-offline-banner">
              <AlertTriangle size={12} /> {t('ui.serverOffline')}
            </div>
          )}

          <div className="sidebar-lang-footer nav-language">
            <Globe size={16} className="sidebar-lang-icon" />
            <span className="sidebar-lang-footer-label">{t('common.language')}</span>
            <LanguageSelector />
          </div>
          <button
            type="button"
            onClick={() => setIsLightMode(!isLightMode)}
            className="btn-secondary sidebar-theme-btn"
            title={isLightMode ? t('ui.darkTheme') : t('ui.lightTheme')}
          >
            {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
            <span>{isLightMode ? t('ui.darkTheme') : t('ui.lightTheme')}</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="btn-secondary sidebar-logout-btn"
          >
            <LogOut size={16} /> {t('common.logout')}
          </button>
        </div>

      </aside>

      {/* 2. Main Panel */}
      <main style={{ flexGrow: 1, padding: '3.5rem 4rem', overflowY: 'auto', height: '100vh', position: 'relative', zIndex: 1 }}>
        
        {/* Top bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 className={`page-title-accent page-title-${currentTab}`} style={{ fontSize: '2rem' }}>
              {currentTab === 'dashboard' && t('dashboard.title')}
              {currentTab === 'profile' && t('common.profile')}
              {currentTab === 'income' && t('income.title')}
              {currentTab === 'expense' && t('expense.title')}
              {currentTab === 'receipt' && t('receipt.title')}
              {currentTab === 'stability' && t('stability.title')}
              {currentTab === 'fraud' && t('anomaly.title')}
              {currentTab === 'networth' && t('networth.title')}
              {currentTab === 'savings' && t('savings.title', 'Savings')}
              {currentTab === 'insights' && t('insights.title', 'AI Spending Insights')}
            </h1>
          </div>

          {/* Quick triggers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <LanguageSelector />
            
            {/* Quick Action buttons */}
            <button onClick={() => setIsIncomeModalOpen(true)} className="btn-secondary header-action-btn header-action-income">
              <Plus size={16} /> {t('income.title')}
            </button>
            
            <button onClick={() => setIsExpenseModalOpen(true)} className="btn-secondary header-action-btn header-action-expense">
              <Plus size={16} /> {t('expense.title')}
            </button>

            {currentTab === 'dashboard' && (
              <button
                onClick={handleDownloadReport}
                disabled={isGeneratingReport}
                className="btn-secondary header-action-btn header-action-report"
              >
                <Download size={16} /> {isGeneratingReport ? t('insights.generating') : t('insights.downloadReport')}
              </button>
            )}

            {/* Notification Badge */}
            <div style={{ position: 'relative' }}>
              <div 
                style={{ position: 'relative', cursor: 'pointer' }} 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <div 
                  className={activeNotifications.filter(n => !n.isRead).length > 0 ? 'bell-shake-animation' : ''}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-secondary)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <Bell size={18} />
                </div>
                {activeNotifications.filter(n => !n.isRead).length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    background: 'var(--color-danger)',
                    borderRadius: '50%',
                    boxShadow: '0 0 10px 0 var(--color-danger)'
                  }}></span>
                )}
              </div>

              {isNotificationsOpen && (
                <div className="notifications-drawer">
                  <div className="notifications-drawer-header">
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <Bell size={16} /> {t('ui.notifications')}
                    </h4>
                    {activeNotifications.filter(n => !n.isRead).length > 0 && (
                      <button 
                        onClick={() => {
                          handleMarkAllRead();
                          setIsNotificationsOpen(false);
                        }} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-primary-light)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {t('ui.markAllRead')}
                      </button>
                    )}
                  </div>
                  <div className="notifications-drawer-body">
                    {activeNotifications.length > 0 ? (
                      activeNotifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                          onClick={() => {
                            if (!n.isRead) {
                              handleMarkNotificationRead(n.id);
                            }
                            if (n.type === 'FRAUD') {
                              setCurrentTab('fraud');
                            } else {
                              setCurrentTab('dashboard');
                            }
                            setIsNotificationsOpen(false);
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: n.type === 'FRAUD' ? 'var(--color-danger-light)' : 'var(--color-primary-light)' }}>
                                {n.title}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{n.message}</span>
                            {(n.type === 'FRAUD' || n.type === 'OVERSPENDING' || n.type === 'ROUND_UP') && (
                              <button 
                                className="btn-primary" 
                                style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', alignSelf: 'flex-start' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!n.isRead) handleMarkAsRead(n.id);
                                  if (n.type === 'FRAUD') setCurrentTab('fraud');
                                  else if (n.type === 'ROUND_UP') setCurrentTab('savings');
                                  else setCurrentTab('dashboard');
                                  setIsNotificationsOpen(false);
                                }}
                              >
                                {n.type === 'ROUND_UP' ? 'View Savings' : 'Resolve'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {t('ui.noNotificationsYet')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {currentTab === 'profile' && (() => {
          const accountsGridTemplate = isProfileEditing ? '1.4fr 0.9fr 1.7fr 1.2fr auto' : '1.4fr 0.9fr 1.7fr 1.2fr';
          const familyGridTemplate = isProfileEditing ? '1.4fr 1.2fr 1.4fr auto' : '1.4fr 1.2fr 1.4fr';
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Header profile row */}
              <div className="glass-panel profile-hero-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem 2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-success) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1.6rem',
                    boxShadow: '0 4px 14px var(--color-primary-glow)'
                  }}>
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{user.fullName}</h2>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{user.profession} · {profileDetails.city}</p>
                  </div>
                </div>

                <button
                  className={isProfileEditing ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => {
                    if (isProfileEditing) {
                      handleSaveProfile();
                    } else {
                      setProfileDraft(profileDetails);
                      setIsProfileEditing(true);
                    }
                  }}
                  style={{ minWidth: '150px' }}
                >
                  {isProfileEditing ? <Save size={16} /> : <Pencil size={16} />}
                  {isProfileEditing ? t('profile.saveProfile') : t('profile.editProfile')}
                </button>
              </div>

              {/* Personal Details & Linked Accounts grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '2rem' }}>
                
                {/* 1. Personal details card */}
                <div className="glass-panel profile-section-card profile-accent-violet">
                  <h3 className="profile-section-heading">
                    <UserIcon size={20} /> {t('profile.personalDetails')}
                  </h3>
                  <div style={{ display: 'grid', gap: '1.5rem', flexGrow: 1 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('profile.fullNameApi')}</span>
                      <input
                        className="form-input"
                        disabled={!isProfileEditing}
                        value={profileDraft.fullName || user?.fullName || ''}
                        onChange={(e) => setProfileDraft({ ...profileDraft, fullName: e.target.value })}
                        style={{ padding: '0.85rem 1.1rem' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('profile.professionApi')}</span>
                      <input
                        className="form-input"
                        disabled={!isProfileEditing}
                        value={profileDraft.profession || user?.profession || ''}
                        onChange={(e) => setProfileDraft({ ...profileDraft, profession: e.target.value })}
                        style={{ padding: '0.85rem 1.1rem' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('profile.targetSavingsApi')}</span>
                      <input
                        type="number"
                        className="form-input"
                        disabled={!isProfileEditing}
                        value={profileDraft.targetSavings ?? user?.targetSavings ?? 0}
                        onChange={(e) => setProfileDraft({ ...profileDraft, targetSavings: Number(e.target.value) })}
                        style={{ padding: '0.85rem 1.1rem' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Round-Up Bucket Threshold</span>
                      <input
                        type="number"
                        className="form-input"
                        disabled={!isProfileEditing}
                        value={profileDraft.roundUpBucketThreshold ?? user?.roundUpBucketThreshold ?? 50}
                        onChange={(e) => setProfileDraft({ ...profileDraft, roundUpBucketThreshold: Number(e.target.value) })}
                        style={{ padding: '0.85rem 1.1rem' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('profile.phone')}</span>
                      <input
                        className="form-input"
                        disabled={!isProfileEditing}
                        value={profileDraft.phone}
                        onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })}
                        placeholder={t('profile.phonePlaceholder')}
                        style={{ padding: '0.85rem 1.1rem' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('profile.city')}</span>
                      <input
                        className="form-input"
                        disabled={!isProfileEditing}
                        value={profileDraft.city}
                        onChange={(e) => setProfileDraft({ ...profileDraft, city: e.target.value })}
                        style={{ padding: '0.85rem 1.1rem' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('profile.householdMembers')}</span>
                      <input
                        type="number"
                        className="form-input"
                        disabled={!isProfileEditing}
                        value={profileDraft.householdMembers}
                        onChange={(e) => setProfileDraft({ ...profileDraft, householdMembers: Number(e.target.value) })}
                        style={{ padding: '0.85rem 1.1rem' }}
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Linked accounts card */}
                <div className="glass-panel profile-section-card profile-accent-blue">
                  <h3 className="profile-section-heading">
                    <Landmark size={20} /> {t('profile.linkedAccounts')}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>
                    
                    {/* Headers for Linked Accounts */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: accountsGridTemplate,
                      gap: '1rem',
                      padding: '0 0.5rem',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      <div>{t('common.name')}</div>
                      <div>{t('common.type')}</div>
                      <div>{t('profile.detailsUpiAcc')}</div>
                      <div>{t('profile.limitPerMonth')}</div>
                      {isProfileEditing && <div></div>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {profileDraft.linkedAccounts.map((account, index) => (
                        <div key={`${account.name}-${index}`} style={{ display: 'grid', gridTemplateColumns: accountsGridTemplate, gap: '1rem', alignItems: 'center' }}>
                          <input 
                            className="form-input" 
                            disabled={!isProfileEditing} 
                            value={account.name} 
                            onChange={(e) => updateProfileListItem('linkedAccounts', index, 'name', e.target.value)} 
                            style={{ padding: '0.75rem 0.85rem', fontSize: '0.9rem' }}
                          />
                          <select 
                            className="form-input" 
                            disabled={!isProfileEditing} 
                            value={account.type} 
                            onChange={(e) => updateProfileListItem('linkedAccounts', index, 'type', e.target.value)}
                            style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', height: '42px' }}
                          >
                            <option value="BANK">{t('profile.accountTypeBank')}</option>
                            <option value="UPI">{t('profile.accountTypeUpi')}</option>
                            <option value="CASH">{t('profile.accountTypeCash')}</option>
                          </select>
                          <input 
                            className="form-input" 
                            disabled={!isProfileEditing} 
                            value={account.upiId || account.maskedAccount} 
                            onChange={(e) => updateProfileListItem('linkedAccounts', index, account.type === 'UPI' ? 'upiId' : 'maskedAccount', e.target.value)} 
                            placeholder={account.type === 'UPI' ? t('ui.upiPlaceholder') : t('profile.maskedAccountPlaceholder')}
                            style={{ padding: '0.75rem 0.85rem', fontSize: '0.9rem' }}
                          />
                          <input 
                            type="number" 
                            className="form-input" 
                            disabled={!isProfileEditing} 
                            value={account.monthlyLimit} 
                            onChange={(e) => updateProfileListItem('linkedAccounts', index, 'monthlyLimit', Number(e.target.value))}
                            style={{ padding: '0.75rem 0.85rem', fontSize: '0.9rem' }}
                          />
                          {isProfileEditing && (
                            <button 
                              className="btn-secondary" 
                              type="button" 
                              onClick={() => removeProfileListItem('linkedAccounts', index)} 
                              style={{ padding: '0.75rem', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {isProfileEditing && (
                        <button className="btn-secondary" type="button" onClick={() => addProfileListItem('linkedAccounts', { name: t('profile.defaultNewAccount'), type: 'BANK', maskedAccount: 'XXXX 0000', upiId: '', monthlyLimit: 5000 })} style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem' }}>
                          <Plus size={14} /> {t('profile.addBankUpi')}
                        </button>
                      )}
                      <button 
                        className="btn-primary" 
                        type="button" 
                        onClick={() => {
                          setBankLinkStep(1);
                          setSelectedBank(null);
                          setBankLinkMobile('');
                          setBankLinkOtp('');
                          setIsBankLinkOpen(true);
                        }} 
                        style={{ 
                          padding: '0.75rem 1.25rem', 
                          fontSize: '0.85rem',
                          background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))',
                          boxShadow: '0 4px 10px rgba(0, 242, 254, 0.15)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <RefreshCw size={14} /> {t('profile.linkLiveBank')}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: '0.5rem' }}>
                      🛡️ {t('profile.bankLinkSecurityNote')}
                    </p>
                  </div>
                </div>

              </div>

              {/* Family Expense Planning card */}
              <div className="glass-panel profile-section-card profile-accent-orange">
                <h3 className="profile-section-heading">
                  <Users size={20} /> {t('profile.familyPlanning')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Headers for Family Members */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: familyGridTemplate,
                    gap: '1rem',
                    padding: '0 0.5rem',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    <div>{t('profile.memberName')}</div>
                    <div>{t('profile.relationship')}</div>
                    <div>{t('profile.estMonthlyExpense')}</div>
                    {isProfileEditing && <div></div>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {profileDraft.familyMembers.map((member, index) => (
                      <div key={`${member.name}-${index}`} style={{ display: 'grid', gridTemplateColumns: familyGridTemplate, gap: '1rem', alignItems: 'center' }}>
                        <input 
                          className="form-input" 
                          disabled={!isProfileEditing} 
                          value={member.name} 
                          onChange={(e) => updateProfileListItem('familyMembers', index, 'name', e.target.value)} 
                          placeholder={t('common.name')} 
                          style={{ padding: '0.75rem 0.85rem', fontSize: '0.9rem' }}
                        />
                        <input 
                          className="form-input" 
                          disabled={!isProfileEditing} 
                          value={member.relation} 
                          onChange={(e) => updateProfileListItem('familyMembers', index, 'relation', e.target.value)} 
                          placeholder={t('profile.relationPlaceholder')} 
                          style={{ padding: '0.75rem 0.85rem', fontSize: '0.9rem' }}
                        />
                        <input 
                          type="number" 
                          className="form-input" 
                          disabled={!isProfileEditing} 
                          value={member.monthlyExpense} 
                          onChange={(e) => updateProfileListItem('familyMembers', index, 'monthlyExpense', Number(e.target.value))} 
                          placeholder={t('profile.monthlyExpensePlaceholder')} 
                          style={{ padding: '0.75rem 0.85rem', fontSize: '0.9rem' }}
                        />
                        {isProfileEditing && (
                          <button 
                            className="btn-secondary" 
                            type="button" 
                            onClick={() => removeProfileListItem('familyMembers', index)} 
                            style={{ padding: '0.75rem', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isProfileEditing && (
                    <button className="btn-secondary" type="button" onClick={() => addProfileListItem('familyMembers', { name: t('profile.defaultChild'), relation: t('profile.defaultChild'), monthlyExpense: 2000 })} style={{ marginTop: '0.5rem', padding: '0.75rem 1.5rem' }}>
                      <Plus size={16} /> {t('profile.addFamilyMember')}
                    </button>
                  )}
                </div>
              </div>

              {/* Savings goals section — connected to real backend goals */}
              <div className="glass-panel profile-section-card profile-accent-emerald">
                <h3 className="profile-section-heading">
                  <GraduationCap size={20} /> {t('profile.savingsGoals')}
                </h3>

                {activeSavingsGoals.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <GraduationCap size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                    <p style={{ margin: 0 }}>No savings goals yet. Create one in the Savings tab.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                    {activeSavingsGoals.map((goal) => {
                      const pct = Math.min(100, Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100));
                      const isComplete = goal.status === 'COMPLETED' || pct >= 100;
                      return (
                        <div key={goal.id} style={{ background: 'var(--bg-secondary)', border: `1px solid ${isComplete ? 'rgba(52,211,153,0.4)' : 'var(--border-color)'}`, borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <p style={{ margin: '0 0 0.2rem 0', fontWeight: 700, fontSize: '0.95rem' }}>{goal.name}</p>
                              {goal.targetDate && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  🗓️ Target: {goal.targetDate}
                                </span>
                              )}
                            </div>
                            <span style={{
                              fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '20px',
                              background: isComplete ? 'rgba(52,211,153,0.15)' : 'var(--color-primary-glow)',
                              color: isComplete ? 'var(--color-success)' : 'var(--color-primary-light)'
                            }}>
                              {isComplete ? '✅ Done' : `${pct}%`}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: isComplete ? 'var(--color-success)' : 'var(--color-primary)', borderRadius: '99px', transition: 'width 0.4s ease' }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <span>Saved: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(goal.currentAmount || 0)}</strong></span>
                            <span>Target: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(goal.targetAmount || 0)}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => { setCurrentTab('savings'); setIsSavingsModalOpen(true); }}
                    style={{ padding: '0.7rem 1.4rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Plus size={15} /> {t('profile.addSavingsGoal')}
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => setCurrentTab('savings')}
                    style={{ padding: '0.7rem 1.4rem', fontSize: '0.85rem' }}
                  >
                    View All in Savings Tab →
                  </button>
                </div>
              </div>

              {/* Stability Vault settings card */}
              <div className="glass-panel profile-vault-panel">
                <h3 className="profile-section-heading">
                  <Shield size={20} /> {t('profile.vaultSettings')}
                </h3>

                <div className="vault-balance-strip">
                  <div>
                    <span className="vault-balance-label">{t('dashboard.vaultBalance')}</span>
                    <strong className="vault-balance-value">
                      ₹{stabilityVaultBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="vault-status-chips">
                    <span className={`vault-chip ${isAutoSweepActive ? 'vault-chip-active' : ''}`}>
                      {isAutoSweepActive ? t('dashboard.autoSweepActive') : t('dashboard.autoSweepDisabled')}
                    </span>
                    <span className="vault-chip vault-chip-limit">
                      {cardLimitEnabled ? `₹${cardLimitValue.toLocaleString('en-IN')}${t('common.perMonth')}` : t('dashboard.unlimited')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                  
                  {/* Left Column: Toggles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="vault-setting-row vault-setting-sweep">
                      <div>
                        <strong style={{ fontSize: '0.88rem', display: 'block' }}>{t('profile.autoSweepTitle')}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('profile.autoSweepDescription')}</span>
                      </div>
                      <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                        <input 
                          type="checkbox" 
                          checked={isAutoSweepActive} 
                          onChange={(e) => setIsAutoSweepActive(e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span className="slider" style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: isAutoSweepActive ? 'var(--color-success)' : 'rgba(255,255,255,0.1)',
                          transition: '.3s',
                          borderRadius: '24px'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: '18px', width: '18px',
                            left: isAutoSweepActive ? '24px' : '3px',
                            bottom: '3px',
                            backgroundColor: '#fff',
                            transition: '.3s',
                            borderRadius: '50%'
                          }}></span>
                        </span>
                      </label>
                    </div>

                    <div className="vault-setting-row vault-setting-ceiling">
                      <div>
                        <strong style={{ fontSize: '0.88rem', display: 'block' }}>{t('profile.upiSpendingCeiling')}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('profile.upiCeilingDescription')}</span>
                      </div>
                      <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                        <input 
                          type="checkbox" 
                          checked={cardLimitEnabled} 
                          onChange={(e) => setCardLimitEnabled(e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span className="slider" style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: cardLimitEnabled ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                          transition: '.3s',
                          borderRadius: '24px'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: '18px', width: '18px',
                            left: cardLimitEnabled ? '24px' : '3px',
                            bottom: '3px',
                            backgroundColor: '#fff',
                            transition: '.3s',
                            borderRadius: '50%'
                          }}></span>
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Right Column: Limit Slider & Vault actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {cardLimitEnabled && (
                      <div className="vault-limit-slider-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{t('profile.monthlyLimit')}</span>
                          <strong style={{ color: 'var(--color-primary-light)' }}>₹{cardLimitValue.toLocaleString('en-IN')}</strong>
                        </div>
                        <input 
                          type="range" 
                          min="1000" 
                          max="50000" 
                          step="1000" 
                          value={cardLimitValue} 
                          onChange={(e) => setCardLimitValue(Number(e.target.value))}
                          style={{ 
                            width: '100%', 
                            accentColor: 'var(--color-primary)', 
                            background: 'rgba(255, 255, 255, 0.1)', 
                            height: '6px', 
                            borderRadius: '3px', 
                            cursor: 'pointer' 
                          }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button 
                        type="button"
                        onClick={() => setStabilityVaultBalance(prev => prev + 5000)}
                        className="btn-secondary vault-deposit-btn"
                        style={{ flexGrow: 1, padding: '0.75rem 1rem', fontSize: '0.82rem', justifyContent: 'center' }}
                      >
                        ➕ {t('profile.depositToVault')}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setStabilityVaultBalance(937.5)}
                        className="btn-secondary vault-reset-btn"
                        style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', justifyContent: 'center' }}
                      >
                        {t('profile.resetVault')}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {currentTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* Cards aggregate */}
            <div ref={dashboardReportRef} className="dashboard-metric-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              
              {/* Card 1: Balance - Dark Indigo */}
              <div className="glass-panel dashboard-metric-card metric-balance" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', border: '1px solid rgba(129,140,248,0.25)' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>{t('dashboard.overallBalance')}</span>
                  <h2 style={{ fontSize: '2rem', marginTop: '0.5rem', fontWeight: 800, color: '#fff' }}>
                    {formatCurrency(dashboardData.balance)}
                  </h2>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem' }}>
                    <span style={{ color: '#a5f3fc', display: 'flex', alignItems: 'center' }}>
                      <TrendingUp size={12} style={{ marginRight: '0.1rem' }} /> +{formatCurrency(dashboardData.totalIncome, 0)} {t('dashboard.inflowShort')}
                    </span>
                    <span style={{ color: '#fda4af', display: 'flex', alignItems: 'center' }}>
                      <TrendingDown size={12} style={{ marginRight: '0.1rem' }} /> -{formatCurrency(dashboardData.totalExpense, 0)} {t('dashboard.outflowShort')}
                    </span>
                  </div>
                </div>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.18)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Landmark size={24} />
                </div>
              </div>

              {/* Card 2: Savings - Dark Emerald */}
              <div className="glass-panel dashboard-metric-card metric-savings" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)', border: '1px solid rgba(52,211,153,0.22)' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>{t('dashboard.savingsPotential')}</span>
                  <h2 style={{ fontSize: '2rem', marginTop: '0.5rem', fontWeight: 800, color: '#fff' }}>
                    {formatCurrency(dashboardData.savingsPotential)}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.75rem' }}>
                    {t('dashboard.savingsPotentialHint')}
                  </p>
                </div>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.18)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={24} />
                </div>
              </div>

              {/* Card 3: Net Worth - Dark Sapphire */}
              <div className="glass-panel dashboard-metric-card metric-networth" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(148,163,184,0.22)' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>{t('networth.netWorth')}</span>
                  <h2 style={{ fontSize: '2rem', marginTop: '0.5rem', fontWeight: 800, color: '#fff' }}>
                    {formatCurrency(netWorthData.netWorth)}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.75rem' }}>
                    {netWorthData.netWorth >= 0 ? 'Positive net worth supports higher sweep rates.' : 'Negative net worth reduces sweep pressure until reserves improve.'}
                  </p>
                </div>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.18)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Landmark size={24} />
                </div>
              </div>

              {/* Card 4: Stability - Dark Crimson */}
              <div className="glass-panel dashboard-metric-card metric-stability" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #881337 0%, #9f1239 100%)', border: '1px solid rgba(251,113,133,0.22)' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>{t('dashboard.stabilityIndex')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.75rem' }}>
                    
                    {/* SVG Circular Progress Ring */}
                    <div className="stability-gauge-container" style={{ flexShrink: 0 }}>
                      <svg width="64" height="64" viewBox="0 0 36 36">
                        <defs>
                          <linearGradient id="stabilityGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={
                              dashboardData.stabilityScore >= 75 ? 'var(--color-success)' : 
                              dashboardData.stabilityScore >= 45 ? 'var(--color-warning)' : 'var(--color-danger)'
                            } />
                            <stop offset="100%" stopColor="var(--color-primary-light)" />
                          </linearGradient>
                        </defs>
                        {/* Background circle */}
                        <path
                          className="gauge-bg"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeWidth="3.5"
                        />
                        {/* Colored stability progress */}
                        <path
                          className="gauge-progress"
                          strokeDasharray={`${dashboardData.stabilityScore}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="url(#stabilityGlow)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          style={{
                            transition: 'stroke-dasharray 1s ease-in-out',
                            transformOrigin: '50% 50%',
                            transform: 'rotate(-90deg)'
                          }}
                        />
                      </svg>
                      <div className="stability-gauge-text">
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>{dashboardData.stabilityScore.toFixed(0)}</span>
                        <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>{t('dashboard.fsiAbbrev')}</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.72rem', fontWeight: 700 }}>
                        🛡️ {t('dashboard.riskLabel', { level: riskLevelLabel(t, dashboardData.riskLevel) })}
                      </span>
                      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', marginTop: '0.3rem', lineHeight: '1.25' }}>
                        {dashboardData.stabilityScore >= 75 ? t('dashboard.fsiHealthy') :
                         dashboardData.stabilityScore >= 45 ? t('dashboard.fsiElevated') :
                         t('dashboard.fsiCritical')}
                      </p>
                    </div>

                  </div>
                </div>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.18)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={24} />
                </div>
              </div>

            </div>

            {activeNotifications.filter(n => !n.isRead).length > 0 && (
              <div className="glass-panel" style={{ background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.25)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{t('dashboard.accountAdvisory')}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                      {activeNotifications.filter(n => !n.isRead)[0].message}
                    </span>
                  </div>
                </div>
                <button onClick={handleMarkAllRead} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                  {t('dashboard.dismissAlerts')}
                </button>
              </div>
            )}

            {/* Analytical Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
              
              <div id="dashboard-cashflow-chart" data-report-title={t('dashboard.cashFlowTrend')} className="glass-panel" style={{ height: '350px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📈 {t('dashboard.cashFlowReservesTrend')}
                </h3>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorReserve" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" stroke="var(--text-tertiary)" tickLine={false} style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="var(--text-tertiary)" tickLine={false} style={{ fontSize: '0.75rem' }} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'var(--bg-secondary)', 
                        borderColor: 'var(--border-color)', 
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        fontSize: '0.8rem' 
                      }} 
                      formatter={(val) => [formatCurrency(val), null]}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                    <Area type="monotone" name={t('dashboard.legendInflow')} dataKey="inflow" stroke="var(--color-success)" strokeWidth={2} fillOpacity={1} fill="url(#colorInflow)" />
                    <Area type="monotone" name={t('dashboard.legendOutflow')} dataKey="outflow" stroke="var(--color-danger)" strokeWidth={2} fillOpacity={1} fill="url(#colorOutflow)" />
                    <Area type="monotone" name={t('dashboard.legendNetReserves')} dataKey="netReserve" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorReserve)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div id="dashboard-expense-pie" data-report-title={t('dashboard.expenseCategories')} className="glass-panel" style={{ height: '350px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🍕 {t('dashboard.outflowCategorySpread')}
                </h3>
                {expensePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <defs>
                        <linearGradient id="pieGrad0" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>
                        <linearGradient id="pieGrad1" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="pieGrad2" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="pieGrad3" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                        <linearGradient id="pieGrad4" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                        <linearGradient id="pieGrad5" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#0891b2" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#pieGrad${index % 6})`} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: 'var(--bg-secondary)', 
                          borderColor: 'var(--border-color)', 
                          borderRadius: '12px',
                          fontSize: '0.8rem' 
                        }}
                        formatter={(val) => [formatCurrency(val), t('dashboard.outflow')]}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.75rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    {t('dashboard.noExpensesYet')}
                  </div>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '350px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    🔮 {t('dashboard.futureProjectionTitle')}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('dashboard.projectionIncome')}</span>
                      <strong style={{ fontSize: '1rem' }}>{formatCurrency(dashboardData.incomeForecast?.ensemble?.[5] ?? 0)}</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('dashboard.projectionExpense')}</span>
                      <strong style={{ fontSize: '1rem' }}>{formatCurrency(dashboardData.expenseForecast?.ensemble?.[5] ?? 0)}</strong>
                    </div>
                  </div>
                </div>
                {projectionChartData && projectionChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={projectionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="name" stroke="var(--text-tertiary)" tickLine={false} style={{ fontSize: '0.75rem' }} />
                      <YAxis stroke="var(--text-tertiary)" tickLine={false} style={{ fontSize: '0.75rem' }} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'var(--bg-secondary)', 
                          borderColor: 'var(--border-color)', 
                          borderRadius: '12px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                          fontSize: '0.8rem' 
                        }} 
                        formatter={(val) => [formatCurrency(val), null]}
                      />
                      <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                      <Bar dataKey="income" name={t('income.title')} fill="var(--color-success)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expense" name={t('expense.title')} fill="var(--color-danger)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="ensemble" name="Balanced" fill="#f97316" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    {t('dashboard.projectionUnavailable')}
                  </div>
                )}
              </div>
            </div>

            {/* Stability History and Cushion Vault details */}
            {(() => {
              const getFsiHistory = () => {
                const currentFsi = dashboardData.stabilityScore;
                const months = ['Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026'];
                const baseOffset = [ -6.5, -4.2, -8.1, 2.5, -1.8, 0 ];
                return months.map((month, idx) => {
                  const pointScore = Math.max(30, Math.min(100, currentFsi + baseOffset[idx]));
                  return {
                    month,
                    score: parseFloat(pointScore.toFixed(1))
                  };
                });
              };

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2.5rem', marginTop: '2.5rem', marginBottom: '2.5rem' }}>
                  
                  {/* FSI Historical Trend LineChart */}
                  <div id="dashboard-fsi-chart" data-report-title={t('dashboard.fsiHistory')} className="glass-panel" style={{ height: '350px' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🛡️ {t('dashboard.fsiHistoryTitle')}
                    </h3>
                    <ResponsiveContainer width="100%" height="80%">
                      <LineChart data={getFsiHistory()} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="month" stroke="var(--text-tertiary)" tickLine={false} style={{ fontSize: '0.75rem' }} />
                        <YAxis domain={[0, 100]} stroke="var(--text-tertiary)" tickLine={false} style={{ fontSize: '0.75rem' }} />
                        <Tooltip 
                          contentStyle={{ 
                            background: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            borderRadius: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                            fontSize: '0.8rem' 
                          }} 
                        />
                        <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                        <Line 
                          type="monotone" 
                          name={t('dashboard.fsiStabilityScore')} 
                          dataKey="score" 
                          stroke="var(--color-success)" 
                          strokeWidth={3} 
                          activeDot={{ r: 8 }}
                          dot={{ stroke: 'var(--color-success)', strokeWidth: 2, r: 4, fill: 'var(--bg-secondary)' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stability Cushion Vault Info Card */}
                  <div className="glass-panel" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🔒 {t('dashboard.cushionVaultTitle')}
                    </h3>
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dashboard.vaultBalance')}</span>
                          <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--color-success-light)' }}>
                            ₹{stabilityVaultBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h3>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {t('dashboard.interestEarned')} <strong style={{ color: 'var(--text-primary)' }}>₹{(stabilityVaultBalance * 0.072 / 12).toLocaleString('en-IN', { maximumFractionDigits: 2 })}{t('common.perMonth')}</strong> {t('dashboard.rdYieldNote')}
                          </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <div className="vault-shield-circle" style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '50%',
                            background: isAutoSweepActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            color: isAutoSweepActive ? 'var(--color-success)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            border: isAutoSweepActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: isAutoSweepActive ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none'
                          }}>
                            🛡️
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-tertiary)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{t('dashboard.autoSweepStatus')}</span>
                          <span className={`status-indicator ${isAutoSweepActive ? 'status-online' : 'status-offline'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                            {isAutoSweepActive ? t('dashboard.autoSweepActive') : t('dashboard.autoSweepDisabled')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{t('dashboard.activeSpendingLimit')}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                            {cardLimitEnabled ? `₹${cardLimitValue.toLocaleString('en-IN')}${t('common.perMonth')}` : t('dashboard.unlimited')}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        {t('dashboard.autoSweepHelp')}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* Bottom splits: AI suggestions and Recent transaction logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              
              {/* Stability advice panel */}
              <div className="glass-panel glow-indigo" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--color-accent)' }} /> {t('dashboard.aiCopilotInsights')}
                </h3>
                
                <div style={{
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                  flexGrow: 1
                }}>
                  {stabilityAdvice ? (
                    <div style={{ whiteSpace: 'pre-line' }}>
                      {stabilityAdvice.replace(/### |#### |## |\* |\*\*|⚠️ |🛡️ |💎 /g, '')}
                    </div>
                  ) : (
                    t('dashboard.analyzingTrends')
                  )}
                </div>

                <button onClick={() => setCurrentTab('stability')} className="btn-secondary" style={{ marginTop: '1rem', border: 'none', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                  {t('dashboard.viewFullAdvisory')} <ChevronRight size={16} />
                </button>
              </div>

              {/* Transactions table */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📅 {t('dashboard.recentTransactionsLog')}
                </h3>

                <div style={{ overflowX: 'auto', flexGrow: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '1.25rem 1rem' }}>{t('common.type')}</th>
                        <th style={{ padding: '1.25rem 1rem' }}>{t('income.date')}</th>
                        <th style={{ padding: '1rem' }}>{t('income.category')}</th>
                        <th style={{ padding: '1.25rem 1rem' }}>{t('expense.description')}</th>
                        <th style={{ padding: '1.25rem 1rem' }}>{t('dashboard.accountUpi')}</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>{t('income.amount')}</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>{t('common.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentTransactions.slice(0, 5).map((tx) => (
                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle' }}>
                          <td style={{ padding: '1.25rem 1rem' }}>
                            <span style={{
                              color: tx.type === 'INCOME' ? 'var(--color-success)' : 'var(--color-danger)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              background: tx.type === 'INCOME' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px'
                            }}>
                              {transactionTypeLabel(t, tx.type)}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{tx.date}</td>
                          <td style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>{categoryLabel(t, tx.category)}</td>
                          <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.description}</td>
                          <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)' }}>
                            {tx.type === 'EXPENSE' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                {tx.accountType === 'UPI' ? <CreditCard size={14} /> : <Landmark size={14} />}
                                {tx.accountName || t('dashboard.cash')}
                                {tx.upiId ? ` (${tx.upiId})` : ''}
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: 700, color: tx.type === 'INCOME' ? 'var(--color-success)' : 'var(--text-primary)' }}>
                            {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                            <button onClick={() => handleDeleteTransaction(tx.id, tx.type)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }} className="delete-btn">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* ── Round-Up History Ledger ────────────────────────────────── */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🪙 Round-Up Spare Change History
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                      Every ₹1–₹10 rounded up from your expenses and saved automatically.
                    </p>
                  </div>
                  {roundUpHistory.length > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Saved</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-success)' }}>
                        {formatCurrency(roundUpHistory.reduce((s, r) => s + r.spareChange, 0))}
                      </div>
                    </div>
                  )}
                </div>

                {roundUpHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🪙</div>
                    No round-ups yet. Enable Auto Round-Ups and log an expense to start saving spare change!
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Expense</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Rounded To</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--color-success)' }}>Spare Change</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Saved To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roundUpHistory.map((r) => (
                          <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{r.date}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{categoryLabel(t, r.category)}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{formatCurrency(r.expenseAmount)}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{formatCurrency(r.roundedTo)}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-success)' }}>
                              +{formatCurrency(r.spareChange)}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary-light)', borderRadius: '8px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                🎯 {r.goalName}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Income management */}
        {/* Tab 2: Income management */}
        {currentTab === 'income' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Income Rate Analytics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              
              {/* Box 1: Hourly - Indigo */}
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.4rem 1.6rem', background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', border: '1px solid rgba(255,255,255,0.15)', minHeight: '150px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>{t('income.hourlyRate')}</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.35rem', color: '#fff' }}>
                    {formatCurrency(dashboardData.totalIncome / 160)}
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{t('income.basedOn160Hours')}</span>
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={22} />
                </div>
              </div>

              {/* Box 2: Daily - Emerald */}
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.4rem 1.6rem', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', border: '1px solid rgba(255,255,255,0.15)', minHeight: '150px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>{t('income.dailyAverageRate')}</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.35rem', color: '#fff' }}>
                    {formatCurrency(dashboardData.totalIncome / 30)}
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{t('income.basedOn30Days')}</span>
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={22} />
                </div>
              </div>

              {/* Box 3: Weekly - Rose */}
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.4rem 1.6rem', background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)', border: '1px solid rgba(255,255,255,0.15)', minHeight: '150px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>{t('income.weeklyAverageRate')}</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.35rem', color: '#fff' }}>
                    {formatCurrency(dashboardData.totalIncome / 4.33)}
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{t('income.basedOn433Weeks')}</span>
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={22} />
                </div>
              </div>

              {/* Box 4: 6-Month - Amber */}
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.4rem 1.6rem', background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', border: '1px solid rgba(255,255,255,0.15)', minHeight: '150px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>{t('income.sixMonthProjection')}</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.35rem', color: '#fff' }}>
                    {formatCurrency(dashboardData.totalIncome * 6)}
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{t('income.aggregateVelocity')}</span>
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Landmark size={22} />
                </div>
              </div>

            </div>

            <div className="glass-panel glow-emerald">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>{t('income.historicalLedger')}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('income.historicalLedgerSubtitle')}</p>
                </div>
                <button onClick={() => openIncomeModal()} className="btn-primary">
                  <Plus size={16} /> {t('ui.logIncomeDeposit')}
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1.25rem 1rem' }}>{t('income.date')}</th>
                      <th style={{ padding: '1.25rem 1rem' }}>{t('income.category')}</th>
                      <th style={{ padding: '1.25rem 1rem' }}>{t('income.source')}</th>
                      <th style={{ padding: '1.25rem 1rem' }}>{t('expense.description')}</th>
                      <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>{t('income.amount')}</th>
                      <th style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayIncomes.map((inc) => (
                      <tr key={inc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{inc.date}</td>
                        <td style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>{categoryLabel(t, inc.category)}</td>
                        <td style={{ padding: '1.25rem 1rem' }}>{inc.source || inc.description || '-'}</td>
                        <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)' }}>{inc.description || t('income.defaultDescription')}</td>
                        <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-success)', fontSize: '1rem' }}>
                          +{formatCurrency(inc.amount)}
                        </td>
                        <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
                            <button onClick={() => openIncomeModal(inc)} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>
                              <Pencil size={16} />
                            </button>
                          <button onClick={() => handleDeleteTransaction(inc.id, 'INCOME')} style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Expense Tracker */}
        {currentTab === 'expense' && (
          <div className="glass-panel glow-coral">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>{t('expense.disbursementsLedger')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('expense.disbursementsSubtitle')}</p>
              </div>
              <button onClick={() => openExpenseModal()} className="btn-primary" style={{ background: 'linear-gradient(135deg, var(--color-danger) 0%, #a855f7 100%)', boxShadow: 'none' }}>
                <Plus size={16} /> {t('expense.logOutflow')}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '1.25rem 1rem' }}>{t('expense.date')}</th>
                    <th style={{ padding: '1.25rem 1rem' }}>{t('expense.category')}</th>
                    <th style={{ padding: '1.25rem 1rem' }}>{t('expense.description')}</th>
                    <th style={{ padding: '1.25rem 1rem' }}>{t('dashboard.accountUpi')}</th>
                    <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>{t('expense.amount')}</th>
                    <th style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayExpenses.map((exp) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{exp.date}</td>
                      <td style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>{categoryLabel(t, exp.category)}</td>
                      <td style={{ padding: '1.25rem 1rem' }}>{exp.description}</td>
                      <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {exp.accountType === 'UPI' ? <CreditCard size={14} /> : <Landmark size={14} />}
                          {exp.accountName || t('dashboard.cash')}
                          {exp.upiId ? ` (${exp.upiId})` : ''}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
                          <button onClick={() => openExpenseModal(exp)} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>
                            <Pencil size={16} />
                          </button>
                        <button onClick={() => handleDeleteTransaction(exp.id, 'EXPENSE')} style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === 'receipt' && (
          <ReceiptScanner t={t} onApplyToExpense={prefillExpenseFromReceipt} />
        )}

        {currentTab === 'insights' && (
          <div className="tab-pane active fade-in" style={{ padding: '2rem' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
              <div>
                <h2 className="page-title">{t('insights.title', 'AI Spending Insights')}</h2>
                <p className="page-subtitle">{t('insights.subtitle', 'Smart analysis of your financial habits')}</p>
              </div>
            </div>
            <AiSpendingInsights dashboardData={{ ...dashboardData, ...netWorthData }} user={user} t={t} onNavigate={setCurrentTab} />
          </div>
        )}

        {/* Tab 4: AI Advisor Deep Dive */}
        {currentTab === 'stability' && (
          <div className="advisor-split-grid">
            
            {/* Left Column: KPI metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-panel glow-indigo" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📊 {t('stability.consistencyMetrics')}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Consistency score */}
                  <div className="metric-bar-card">
                    <div className="metric-bar-header">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('stability.incomeConsistency')}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>
                        {user?.username === 'rajesh_k' ? '45%' : user?.username === 'priya_s' ? '65%' : user?.username === 'divya_t' ? '85%' : '75%'}
                      </span>
                    </div>
                    <div className="metric-bar-track">
                      <div 
                        className={`metric-bar-fill ${
                          (user?.username === 'rajesh_k') ? 'danger' : 
                          (user?.username === 'priya_s') ? 'warning' : 'success'
                        }`}
                        style={{ width: user?.username === 'rajesh_k' ? '45%' : user?.username === 'priya_s' ? '65%' : user?.username === 'divya_t' ? '85%' : '75%' }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {t('stability.incomeConsistencyHint')}
                    </span>
                  </div>

                  {/* Burn rate */}
                  <div className="metric-bar-card">
                    <div className="metric-bar-header">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('stability.monthlyBurnRate')}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>
                        {((dashboardData.totalExpense / (dashboardData.totalIncome || 1)) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="metric-bar-track">
                      <div 
                        className={`metric-bar-fill ${
                          ((dashboardData.totalExpense / (dashboardData.totalIncome || 1)) * 100) > 75 ? 'danger' :
                          ((dashboardData.totalExpense / (dashboardData.totalIncome || 1)) * 100) > 50 ? 'warning' : 'success'
                        }`}
                        style={{ width: `${Math.min(((dashboardData.totalExpense / (dashboardData.totalIncome || 1)) * 100), 100)}%` }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {t('stability.burnRateHint')}
                    </span>
                  </div>

                  {/* Runway */}
                  <div className="metric-bar-card">
                    <div className="metric-bar-header">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('stability.emergencyRunway')}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>
                        {(dashboardData.balance / (dashboardData.totalExpense || 1)).toFixed(1)} {t('common.months')}
                      </span>
                    </div>
                    <div className="metric-bar-track">
                      <div 
                        className={`metric-bar-fill ${
                          (dashboardData.balance / (dashboardData.totalExpense || 1)) < 1.0 ? 'danger' :
                          (dashboardData.balance / (dashboardData.totalExpense || 1)) < 3.0 ? 'warning' : 'success'
                        }`}
                        style={{ width: `${Math.min((dashboardData.balance / (dashboardData.totalExpense || 1)) * 25, 100)}%` }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {t('stability.runwayHint')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Parsed advice or Interactive AI Copilot */}
            <div className="glass-panel glow-indigo" style={{ display: 'flex', flexDirection: 'column', minHeight: '580px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  {advisorView === 'report' ? (
                    <>
                      <Sparkles style={{ color: 'var(--color-accent)' }} /> {t('stability.predictiveReport')}
                    </>
                  ) : (
                    <>
                      <MessageSquare style={{ color: 'var(--color-success)' }} /> {t('stability.copilotChat')}
                    </>
                  )}
                </h3>
                
                {/* View Toggle Group */}
                <div style={{ 
                  display: 'flex', 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '30px', 
                  padding: '2px', 
                  gap: '2px' 
                }}>
                  <button
                    onClick={() => setAdvisorView('report')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 1rem',
                      borderRadius: '30px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: advisorView === 'report' ? 'var(--color-primary-glow)' : 'transparent',
                      color: advisorView === 'report' ? 'var(--color-success-light)' : 'var(--text-secondary)'
                    }}
                  >
                    <FileText size={14} /> {t('stability.reportTab')}
                  </button>
                  <button
                    onClick={() => setAdvisorView('chat')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 1rem',
                      borderRadius: '30px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: advisorView === 'chat' ? 'var(--color-primary-glow)' : 'transparent',
                      color: advisorView === 'chat' ? 'var(--color-success-light)' : 'var(--text-secondary)'
                    }}
                  >
                    <MessageSquare size={14} /> {t('stability.copilotTab')}
                  </button>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: 0 }}>
                {advisorView === 'report' 
                  ? t('stability.reportSubtitle')
                  : t('stability.chatSubtitle')
                }
              </p>

              {advisorView === 'report' ? (
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  fontSize: '0.88rem',
                  lineHeight: '1.7',
                  flexGrow: 1,
                  overflowY: 'auto',
                  maxHeight: '420px'
                }}>
                  {stabilityAdvice ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {stabilityAdvice.split('\n').map((line, idx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;
                        
                        // Headers (###)
                        if (trimmed.startsWith('###')) {
                          return (
                            <h3 key={idx} style={{ 
                              fontSize: '1.15rem', 
                              color: 'var(--text-primary)', 
                              borderBottom: '1px solid var(--border-color)', 
                              paddingBottom: '0.4rem', 
                              marginTop: '1rem', 
                              fontWeight: 700 
                            }}>
                              {trimmed.replace('###', '').trim()}
                            </h3>
                          );
                        }
                        
                        // Subheaders (####)
                        if (trimmed.startsWith('####')) {
                          return (
                            <h4 key={idx} style={{ 
                              fontSize: '1rem', 
                              color: 'var(--color-primary-light)', 
                              marginTop: '0.8rem', 
                              fontWeight: 700 
                            }}>
                              {trimmed.replace('####', '').trim()}
                            </h4>
                          );
                        }
                        
                        // Bold lines starting with warning icons or alerts
                        if (trimmed.includes('EXCELLENT STABILITY') || trimmed.includes('STABILITY ADVISORY') || trimmed.includes('HEALTHY MARGINS')) {
                          return (
                            <div key={idx} style={{
                              background: 'rgba(16, 185, 129, 0.08)',
                              border: '1px solid var(--color-success)',
                              borderRadius: '12px',
                              padding: '0.85rem 1rem',
                              color: 'var(--color-success-light)',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              margin: '0.5rem 0'
                            }}>
                              <span>⭐</span> {trimmed.replace(/\*+/g, '')}
                            </div>
                          );
                        }

                        // Bullet items (*)
                        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
                          const cleanLine = trimmed.replace(/^[\*\-]\s*/, '');
                          const parts = cleanLine.split('**');
                          return (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: '0.5rem', 
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)' 
                            }}>
                              <span style={{ color: 'var(--color-primary)', marginTop: '0.2rem' }}>✦</span>
                              <span>
                                {parts.map((part, pIdx) => 
                                  pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--text-primary)' }}>{part}</strong> : part
                                )}
                              </span>
                            </div>
                          );
                        }

                        // Numbered lists (1., 2.)
                        if (trimmed.match(/^\d+\./)) {
                          const cleanLine = trimmed.replace(/^\d+\.\s*/, '');
                          const parts = cleanLine.split('**');
                          const num = trimmed.match(/^\d+/)[0];
                          return (
                            <div key={idx} style={{ 
                              background: 'rgba(255, 255, 255, 0.02)', 
                              border: '1px solid var(--border-color)', 
                              padding: '0.85rem 1rem', 
                              borderRadius: '12px', 
                              margin: '0.4rem 0',
                              display: 'flex',
                              gap: '0.75rem',
                              alignItems: 'flex-start'
                            }}>
                              <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: 'var(--color-primary-glow)',
                                color: 'var(--color-primary-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                flexShrink: 0
                              }}>
                                {num}
                              </div>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {parts.map((part, pIdx) => 
                                  pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--text-primary)' }}>{part}</strong> : part
                                )}
                              </span>
                            </div>
                          );
                        }
                        
                        return <p key={idx} style={{ margin: '0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{trimmed}</p>;
                      })}
                    </div>
                  ) : (
                    t('stability.assemblingModels')
                  )}
                </div>
              ) : (
                // AI Copilot Chat Interface
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '420px' }}>
                  {/* Chat bubbles container */}
                  <div 
                    id="ai-chat-box"
                    style={{
                      flexGrow: 1,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      overflowY: 'auto',
                      marginBottom: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      maxHeight: '320px'
                    }}
                  >
                    {chatMessages.map((msg, index) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div 
                          key={index}
                          style={{
                            display: 'flex',
                            justifyContent: isUser ? 'flex-end' : 'flex-start',
                            width: '100%'
                          }}
                        >
                          <div
                            style={{
                              background: isUser 
                                ? 'linear-gradient(135deg, var(--color-primary), var(--color-success))' 
                                : 'var(--bg-tertiary)',
                              border: isUser ? 'none' : '1px solid var(--border-color)',
                              color: isUser ? '#ffffff' : 'var(--text-primary)',
                              borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                              padding: '0.75rem 1rem',
                              maxWidth: '85%',
                              fontSize: '0.85rem',
                              lineHeight: '1.5',
                              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {isUser ? (
                              msg.text
                            ) : (
                              renderMarkdownText(msg.text)
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing state */}
                    {isAiTyping && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                        <div style={{
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          borderRadius: '16px 16px 16px 2px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
                        }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.4s infinite ease-in-out both' }}></span>
                            <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                            <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('stability.advisorAnalyzing')}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI provider badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: aiProvider && aiProvider !== 'fallback' && aiProvider !== 'offline' ? 'var(--color-success)' : 'var(--text-muted)'
                    }}>
                      {aiProvider === 'gemini' || aiProvider === 'openai' || aiProvider === 'ollama'
                        ? t('stability.liveAiProvider', { provider: aiProvider })
                        : aiProvider === 'fallback'
                          ? t('stability.fallbackAdvisor')
                          : aiProvider === 'offline'
                            ? t('stability.offlineAdvisor')
                            : t('stability.copilotName')}
                    </span>
                  </div>

                  {/* Suggestion Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {[
                      { label: t('stability.chipSavings'), query: 'how can I save money and automate sweeps' },
                      { label: t('stability.chipInvest'), query: 'recommend a safe investment plan' },
                      { label: t('stability.chipBudget'), query: 'how to build a variable budget plan' },
                      { label: t('stability.chipSplit'), query: 'how to split household expenses fairly' },
                      { label: t('stability.chipStability'), query: 'how to improve my stability score' },
                      { label: t('stability.chipOutliers'), query: 'are there any anomaly warnings' }
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        onClick={() => handleSendChatMessage(chip.query)}
                        style={{
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '20px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontWeight: 500
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-success)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.background = 'var(--bg-tertiary)';
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Input form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChatMessage();
                    }}
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '30px',
                      padding: '0.25rem 0.35rem 0.25rem 1rem'
                    }}
                  >
                    <input
                      type="text"
                      placeholder={t('stability.chatPlaceholder')}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      style={{
                        flexGrow: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                        padding: '0.35rem 0'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      style={{
                        background: chatInput.trim() 
                          ? 'linear-gradient(135deg, var(--color-primary), var(--color-success))' 
                          : 'var(--bg-secondary)',
                        border: 'none',
                        color: chatInput.trim() ? '#ffffff' : 'var(--text-muted)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: chatInput.trim() ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        boxShadow: chatInput.trim() ? '0 4px 10px rgba(0, 242, 254, 0.2)' : 'none'
                      }}
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 5: Fraud anomaly Center */}
        {currentTab === 'fraud' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Banner console */}
            <div className={`glass-panel ${activeFraudAlerts.filter(a => a.status === 'ACTIVE').length > 0 ? 'glow-coral' : 'glow-amber'}`} style={{
              background: 'var(--bg-glass)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '2rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div className="shield-heartbeat" style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '16px', 
                  background: 'rgba(99, 102, 241, 0.08)', 
                  border: '1px solid rgba(99, 102, 241, 0.25)', 
                  color: 'var(--color-primary)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Shield size={30} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{t('anomaly.detectionCenter')}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {activeFraudAlerts.filter(a => a.status === 'ACTIVE').length > 0 ? (
                      <span style={{ color: 'var(--color-danger-light)', fontWeight: 600 }}>
                        ⚠️ {t('anomaly.activeRiskBanner', { count: activeFraudAlerts.filter(a => a.status === 'ACTIVE').length })}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-success-light)', fontWeight: 600 }}>
                        ✓ {t('anomaly.shieldActiveBanner')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('anomaly.activeRisks')}</span>
                  <h4 style={{ fontSize: '1.3rem', color: 'var(--color-danger)', fontWeight: 800 }}>
                    {activeFraudAlerts.filter(a => a.status === 'ACTIVE').length}
                  </h4>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('anomaly.shieldEngine')}</span>
                  <h4 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', fontWeight: 800 }}>v3.4</h4>
                </div>
              </div>
            </div>

            <div className="glass-panel glow-indigo">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🛡️ {t('anomaly.auditLog')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '2rem' }}>
                {t('anomaly.auditLogSubtitle')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeFraudAlerts.length > 0 ? (
                  activeFraudAlerts.map((alert) => (
                    <div key={alert.id} style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderLeft: alert.status === 'ACTIVE' ? '4px solid var(--color-danger)' : '4px solid var(--text-muted)',
                      borderRadius: '12px',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span className={`badge ${alert.status === 'ACTIVE' ? 'badge-high' : 'badge-medium'}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            {alert.alertType}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('anomaly.loggedAt')} {new Date(alert.createdAt).toLocaleString()}</span>
                        </div>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{alert.description}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {t('anomaly.transactionRef', { category: categoryLabel(t, alert.category), amount: formatCurrency(alert.amount) })}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {alert.status === 'ACTIVE' ? (
                          <>
                            <button 
                              onClick={() => handleResolveAlert(alert.id, 'RESOLVED')} 
                              className="btn-primary" 
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', background: 'var(--color-success)', boxShadow: 'none' }}
                            >
                              <CheckCircle size={13} /> {t('anomaly.resolveAlert')}
                            </button>
                            <button 
                              onClick={() => handleResolveAlert(alert.id, 'DISMISSED')} 
                              className="btn-secondary" 
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                            >
                              {t('anomaly.dismiss')}
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            ✓ {t('anomaly.resolvedStatus', { status: alert.status })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    ✓ {t('anomaly.noAnomalies')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'networth' && (
          <NetWorthTab token={token} t={t} onUpdate={fetchNetWorth} />
        )}

        {currentTab === 'savings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Savings logic summary */}
            <div className="glass-panel glow-indigo" style={{ padding: '1.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', marginBottom: '0.75rem' }}>{t('savings.bucketPlanTitle')}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  {t('savings.bucketDescription', {
                    recommendedMonthlySavings: formatCurrency(recommendedMonthlySavings),
                    vaultAllocation: formatCurrency(vaultAllocation),
                    goalAllocation: formatCurrency(goalAllocation)
                  })}
                </p>
                <p style={{ margin: '1rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {netWorthData.netWorth >= 0
                    ? t('savings.reserveNotePositive')
                    : t('savings.reserveNoteNegative')}
                </p>
              </div>
              <div style={{ minWidth: 0, display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>{t('dashboard.vaultBalance')}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatCurrency(stabilityVaultBalance)}</div>
                </div>
                <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Goal Progress</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatCurrency(totalSavingsGoalSaved)} / {formatCurrency(totalSavingsGoalTarget)}</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {totalSavingsGoalRemaining > 0
                      ? `Needs ${formatCurrency(totalSavingsGoalRemaining)} more (${goalCompletionMonths === Infinity ? 'no goals' : `${goalCompletionMonths.toFixed(1)} months at goal allocation`}).`
                      : 'All active goals are fully funded.'}
                  </div>
                </div>
                <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Round-Up Bucket</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatCurrency(roundUpBucketBalance)}</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {roundUpBucketBalance >= roundUpBucketThreshold
                      ? t('savings.releaseReady')
                      : t('savings.releaseWaiting', { remaining: formatCurrency(roundUpBucketRemaining) })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Smart recommendation banner */}
            <div className="glass-panel glow-indigo" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ flex: '1 1 400px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '1.25rem' }}>
                  {t('savings.smartAdvisorTitle')}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  {t('savings.smartAdvisorSubtitle')}
                </p>
                <h2 style={{ fontSize: '2rem', color: 'var(--color-primary-light)', marginTop: '0.5rem', marginBottom: 0 }}>
                  {formatCurrency(stabilityData?.recommendedSavings || 0)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{t('savings.thisMonth')}</span>
                </h2>
              </div>
              <div className="glass-panel" style={{ padding: '1rem 1.5rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-secondary)', minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('savings.enableAutoRoundUps')}</span>
                  <input 
                    type="checkbox" 
                    checked={!!user?.autoRoundUpEnabled} 
                    onChange={toggleAutoRoundUp} 
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  {t('savings.autoRoundUpDescription')}
                </p>
              </div>
            </div>

            {/* Savings Goals Grid */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{t('savings.activeBucketsTitle')}</h3>
                <button onClick={() => setIsSavingsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                  <Plus size={16} /> {t('savings.newGoal')}
                </button>
              </div>

              {savingsGoals.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {savingsGoals.map(goal => {
                    const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                    return (
                      <div key={goal.id} className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 600 }}>{goal.name}</h4>
                            {goal.targetDate && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('savings.targetDateLabel')} {goal.targetDate}</span>
                            )}
                          </div>
                          <span className={`badge ${goal.status === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                            {goal.status}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{t('savings.progressLabel')}</span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)} ({percent}%)</span>
                        </div>

                        <div className="metric-bar-track" style={{ height: '8px', marginBottom: '1.5rem' }}>
                          <div 
                            className={`metric-bar-fill ${goal.status === 'COMPLETED' ? 'success' : 'primary'}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button 
                            onClick={() => {
                              setContributeGoalId(goal.id);
                              setIsContributeModalOpen(true);
                            }}
                            className="btn-primary" 
                            style={{ flexGrow: 1, padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                          >
                            {t('savings.contribute')}
                          </button>
                          <button 
                            onClick={() => handleDeleteSavingsGoal(goal.id)}
                            className="btn-secondary" 
                            style={{ padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                  <PiggyBank size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('savings.noGoalsYet')}</p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* 3. Income Modal */}
      {isIncomeModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          zIndex: 999, backdropFilter: 'blur(10px)', overflowY: 'auto', padding: '2rem 1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem 3rem', margin: 'auto' }}>
            <h2 style={{ marginBottom: '1.75rem' }}>{editingIncomeId ? t('modals.updateIncome') : t('ui.logIncomeDeposit')}</h2>
            
            <form onSubmit={handleAddIncome}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('ui.amountInr')}</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder={t('modals.amountExample')}
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('income.category')}</label>
                <select 
                  className="form-input"
                  value={incomeForm.category}
                  onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                >
                  <option value="FREELANCE">{t('ui.freelanceRetainer')}</option>
                  <option value="GIG_WORK">{t('ui.gigPayout')}</option>
                  <option value="BUSINESS">{t('ui.privateBusiness')}</option>
                  <option value="SALARY">{t('ui.fixedSalary')}</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('ui.sourceClientName')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={t('modals.sourceExample')}
                  value={incomeForm.source}
                  onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('income.date')}</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={incomeForm.date}
                  onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('income.description')}</label>
                <textarea 
                  className="form-input" 
                  placeholder={t('ui.briefContext')}
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={() => { setIsIncomeModalOpen(false); resetIncomeForm(); }} className="btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--color-success)' }}>
                  {editingIncomeId ? t('common.update') : t('ui.logDeposit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Expense Modal */}
      {isExpenseModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          zIndex: 999, backdropFilter: 'blur(10px)', overflowY: 'auto', padding: '2rem 1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', padding: '2.5rem 3rem', margin: 'auto' }}>
            <h2 style={{ marginBottom: '1.75rem' }}>{editingExpenseId ? t('modals.updateExpense') : t('expense.addExpense')}</h2>
            
            <form onSubmit={handleAddExpense}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('expense.amount')} (INR)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder={t('modals.amountExampleSmall')}
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('expense.category')}</label>
                <select 
                  className="form-input"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  <option value="FOOD">{t('ui.foodGroceries')}</option>
                  <option value="RENT">{t('ui.housingRent')}</option>
                  <option value="BILLS">{t('ui.digitalBills')}</option>
                  <option value="SHOPPING">{t('ui.hardwareShopping')}</option>
                  <option value="TRAVEL">{t('ui.travelCosts')}</option>
                  <option value="OTHER">{t('ui.otherDiscretionary')}</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('ui.paidFromAccount')}</label>
                <select
                  className="form-input"
                  value={expenseForm.accountName}
                  onChange={(e) => {
                    const selected = paymentAccounts.find((account) => account.name === e.target.value) || paymentAccounts[0];
                    setExpenseForm({
                      ...expenseForm,
                      accountName: selected.name,
                      accountType: selected.type,
                      upiId: selected.upiId
                    });
                  }}
                >
                  {paymentAccounts.map((account) => (
                    <option key={account.name} value={account.name}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </div>

              {expenseForm.accountType === 'UPI' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('ui.upiId')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('ui.upiPlaceholder')}
                    value={expenseForm.upiId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, upiId: e.target.value })}
                  />
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('expense.date')}</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('expense.description')}</label>
                <textarea 
                  className="form-input" 
                  placeholder={t('ui.briefContext')}
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={() => { setIsExpenseModalOpen(false); resetExpenseForm(); }} className="btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--color-danger)' }}>
                  {editingExpenseId ? t('common.update') : t('expense.addExpense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Account Aggregator Link Modal */}
      {isBankLinkOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          zIndex: 999, backdropFilter: 'blur(10px)', overflowY: 'auto', padding: '2rem 1rem'
        }}>
          <div className="glass-panel glow-indigo animate-fadeIn" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', margin: 'auto', border: '1px solid var(--border-color)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>{t('ui.linkBankTitle')}</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('ui.linkBankSubtitle')}</span>
              </div>
            </div>

            {/* Wizard Steps */}

            {/* Step 1: Choose Bank */}
            {bankLinkStep === 1 && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  {t('ui.selectBankPrompt')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((bankName) => (
                    <button
                      key={bankName}
                      type="button"
                      onClick={() => {
                        setSelectedBank(bankName);
                        setBankLinkStep(2);
                      }}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      🏦 {bankName}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setIsBankLinkOpen(false)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Mobile handle verification */}
            {bankLinkStep === 2 && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  {t('modals.bankConnectMobile', { bank: selectedBank })}
                </p>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (bankLinkMobile.trim()) setBankLinkStep(3);
                }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>{t('ui.mobileNumber')}</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="form-input" style={{ width: '60px', padding: '0.75rem 0', textAlign: 'center', background: 'var(--bg-tertiary)' }}>+91</span>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder={t('modals.mobileExample')}
                        value={bankLinkMobile}
                        onChange={(e) => setBankLinkMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                        style={{ flexGrow: 1 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <button type="button" onClick={() => setBankLinkStep(1)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                      {t('ui.back')}
                    </button>
                    <button type="submit" disabled={bankLinkMobile.length < 10} className="btn-primary" style={{ padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))', border: 'none' }}>
                      {t('ui.requestConsent')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: OTP Verification */}
            {bankLinkStep === 3 && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  {t('modals.consentOtpPrompt', { mobile: bankLinkMobile, bank: selectedBank })}
                </p>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (bankLinkOtp === '123456') {
                    setBankLinkStep(4);
                  } else {
                    alert(t('ui.invalidOtp'));
                  }
                }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>{t('ui.enterOtp')}</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder={t('modals.otpExample')}
                      value={bankLinkOtp}
                      onChange={(e) => setBankLinkOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem', textAlign: 'center' }}>
                      {t('ui.otpHint')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <button type="button" onClick={() => setBankLinkStep(2)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                      {t('ui.back')}
                    </button>
                    <button type="submit" disabled={bankLinkOtp.length < 6} className="btn-primary" style={{ padding: '0.5rem 1.25rem', background: 'var(--color-success)', border: 'none' }}>
                      {t('ui.approveConsent')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 4: Success confirmation */}
            {bankLinkStep === 4 && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  color: 'var(--color-success)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <CheckCircle size={36} />
                </div>
                
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>{t('ui.connectionSuccessful')}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  {t('modals.bankLinkSuccessBody', { bank: selectedBank })}
                </p>

                <button 
                  type="button" 
                  onClick={handleFinishBankLink} 
                  className="btn-primary" 
                  style={{ 
                    padding: '0.6rem 2rem', 
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))', 
                    border: 'none',
                    width: '100%'
                  }}
                >
                  {t('ui.done')}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 6. Add Savings Goal Modal */}
      {isSavingsModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          zIndex: 999, backdropFilter: 'blur(10px)', overflowY: 'auto', padding: '2rem 1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem 3rem', margin: 'auto' }}>
            <h2 style={{ marginBottom: '1.75rem' }}>Create Savings Goal</h2>
            
            <form onSubmit={handleAddSavingsGoal}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>Goal Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Emergency Fund, Vacation"
                  value={savingsForm.name}
                  onChange={(e) => setSavingsForm({ ...savingsForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>Target Amount (Rs)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 5000"
                  value={savingsForm.targetAmount}
                  onChange={(e) => setSavingsForm({ ...savingsForm, targetAmount: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>Initial Saved Amount (Rs) (Optional)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 0"
                  value={savingsForm.currentAmount}
                  onChange={(e) => setSavingsForm({ ...savingsForm, currentAmount: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>Target Date (Optional)</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={savingsForm.targetDate}
                  onChange={(e) => setSavingsForm({ ...savingsForm, targetDate: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={() => { setIsSavingsModalOpen(false); setSavingsForm({ name: '', targetAmount: '', currentAmount: '', targetDate: '' }); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Contribute to Savings Goal Modal */}
      {isContributeModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          zIndex: 999, backdropFilter: 'blur(10px)', overflowY: 'auto', padding: '2rem 1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 3rem', margin: 'auto' }}>
            <h2 style={{ marginBottom: '1.75rem' }}>Contribute to Goal</h2>
            
            <form onSubmit={handleContributeSavingsGoal}>
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>Amount (Rs)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 500 (use negative to withdraw)"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={() => { setIsContributeModalOpen(false); setContributeGoalId(null); setContributeAmount(''); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
