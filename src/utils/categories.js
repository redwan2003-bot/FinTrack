export const CATEGORIES = [
  // Expenses
  { id: 'food', name: 'Food & Dining', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: 'UtensilsCrossed', type: 'expense', parent: 'Living Expenses' },
  { id: 'transport', name: 'Transportation', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', icon: 'Car', type: 'expense', parent: 'Living Expenses' },
  { id: 'shopping', name: 'Shopping', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: 'ShoppingBag', type: 'expense', parent: 'Discretionary' },
  { id: 'entertainment', name: 'Entertainment', color: '#ec4899', bg: 'rgba(236,72,153,0.12)', icon: 'Tv2', type: 'expense', parent: 'Discretionary' },
  { id: 'bills', name: 'Bills & Utilities', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: 'Zap', type: 'expense', parent: 'Fixed Expenses', taxDeductible: true },
  { id: 'health', name: 'Health & Fitness', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: 'Heart', type: 'expense', parent: 'Living Expenses', taxDeductible: true },
  { id: 'travel', name: 'Travel', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: 'Plane', type: 'expense', parent: 'Discretionary' },
  { id: 'education', name: 'Education', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: 'BookOpen', type: 'expense', parent: 'Professional Development', taxDeductible: true },
  { id: 'business', name: 'Business Exp', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: 'Briefcase', type: 'expense', parent: 'Operating Expenses', taxDeductible: true },
  { id: 'savings', name: 'Savings', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: 'PiggyBank', type: 'asset', parent: 'Current Assets' },
  { id: 'other', name: 'Other', color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: 'MoreHorizontal', type: 'expense', parent: 'Miscellaneous' },
  
  // Revenue
  { id: 'income', name: 'Income', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: 'TrendingUp', type: 'revenue', parent: 'Operating Revenue' },
  { id: 'freelance', name: 'Freelance', color: '#14b8a6', bg: 'rgba(20,184,166,0.12)', icon: 'Briefcase', type: 'revenue', parent: 'Operating Revenue' },
  { id: 'investment', name: 'Investments', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: 'LineChart', type: 'revenue', parent: 'Non-Operating Revenue' },
];

export const getCategoryById = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c.type === 'expense');
export const INCOME_CATEGORIES = CATEGORIES.filter((c) => c.type === 'revenue');
