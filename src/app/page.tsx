'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { db, initDB, Transaction, Budget, Category } from '@/lib/db';
import Link from 'next/link';
import { TransactionForm } from '@/components/TransactionForm';
import { useRouter } from 'next/navigation';
import { IntroScreen } from '@/components/IntroScreen';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    income: 0,
    expenses: 0,
    balance: 0
  });
  const [showIntro, setShowIntro] = useState(true);
  
  const router = useRouter();
  
  // Never show the intro screen on the main page
  useEffect(() => {
    // Always set showIntro to false for the main page
    // The intro is now handled by the dedicated /intro route
    setShowIntro(false);
  }, []);

  // Initialize the database
  useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
        await loadData();
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    
    setup();
  }, []);

  // Load all necessary data
  const loadData = async () => {
    try {
      // Get current month's date range
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Format dates as strings in YYYY-MM-DD format for comparison
      const firstDayStr = firstDay.toISOString().split('T')[0];
      const lastDayStr = lastDay.toISOString().split('T')[0];
      
      // Load all transactions and filter for current month
      const allTransactions = await db.transactions.toArray();
      const currentMonthTransactions = allTransactions.filter(t => {
        return t.date >= firstDayStr && t.date <= lastDayStr;
      });
      
      setTransactions(currentMonthTransactions);
      
      // Calculate monthly stats
      const income = currentMonthTransactions
        .filter(t => t.isIncome)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = currentMonthTransactions
        .filter(t => !t.isIncome)
        .reduce((sum, t) => sum + t.amount, 0);
      
      setMonthlyStats({
        income,
        expenses,
        balance: income - expenses
      });
      
      // Load budgets and categories
      const allBudgets = await db.budgets.toArray();
      const allCategories = await db.categories.toArray();
      
      setBudgets(allBudgets);
      setCategories(allCategories);
      
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get budget progress for a category
  const getBudgetProgress = (categoryId: number) => {
    const budget = budgets.find(b => b.categoryId === categoryId);
    if (!budget) return { spent: 0, budgeted: 0, percentage: 0 };
    
    const spent = transactions
      .filter(t => !t.isIncome && t.categoryId === categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const percentage = budget.amount > 0 
      ? Math.min(Math.round((spent / budget.amount) * 100), 100)
      : 0;
    
    return {
      spent,
      budgeted: budget.amount,
      percentage
    };
  };

  // Handle adding a new transaction
  const handleAddTransaction = async (transaction: Transaction) => {
    try {
      // First save to database
      let newId;
      if (transaction.id) {
        // Update existing transaction
        await db.transactions.update(transaction.id, transaction);
        newId = transaction.id;
      } else {
        // Add new transaction
        newId = await db.transactions.add(transaction);
      }
      
      // Add ID to the transaction object
      const newTransaction = { ...transaction, id: newId };
      
      // Update state
      setTransactions(prev => [...prev, newTransaction]);
      
      // Recalculate stats
      const newIncome = transaction.isIncome 
        ? monthlyStats.income + transaction.amount 
        : monthlyStats.income;
      
      const newExpenses = !transaction.isIncome 
        ? monthlyStats.expenses + transaction.amount 
        : monthlyStats.expenses;
      
      setMonthlyStats({
        income: newIncome,
        expenses: newExpenses,
        balance: newIncome - newExpenses
      });
      
      // Hide form
      setShowTransactionForm(false);
      
      // Reload all data to ensure everything is in sync
      await loadData();
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-4">
            Loading GainzBudget
          </h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isPasswordProtected && !isUnlocked) {
    // Show password entry screen
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
            Unlock GainzBudget
          </h1>
          {/* Password entry form would go here */}
          <Button fullWidth>Unlock</Button>
        </Card>
      </div>
    );
  }

  // Show transaction form if requested
  if (showTransactionForm) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <TransactionForm 
            onSave={handleAddTransaction}
            onCancel={() => setShowTransactionForm(false)}
          />
        </div>
      </Layout>
    );
  }

  // If showing intro screen
  if (showIntro) {
    return (
      <IntroScreen 
        onComplete={() => {
          // Set localStorage flag when intro is completed
          localStorage.setItem('hasSeenIntro', 'true');
          setShowIntro(false);
        }}
        skipIntro={false}
      />
    );
  }

  // Main application
  return (
    <Layout>
      {isLoaded ? (
        <div className="container mx-auto px-4 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 neon-text" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px #00ff66, 0 0 20px #00ff66' }}>Welcome to GainzBudget</h1>
            <p className="text-gray-100" style={{ fontFamily: 'Roboto Mono, monospace' }}>Your secure financial tracking platform</p>
            <p className="text-primary-400 italic text-sm mt-2" style={{ fontFamily: 'Roboto Mono, monospace', textShadow: '0 0 5px #00ff66' }}>"An investment in knowledge pays the best interest." - Benjamin Franklin</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-dark-400 border-primary-500/20 shadow-lg hover:shadow-primary-500/10 transition-all">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>Monthly Income</h3>
                <p className={`text-3xl font-bold ${monthlyStats.income > 0 ? 'text-green-500' : 'text-gray-400'}`} style={{ textShadow: '0 0 5px rgba(0, 255, 102, 0.3)' }}>
                  {formatCurrency(monthlyStats.income)}
                </p>
              </div>
            </Card>
            <Card className="bg-dark-400 border-primary-500/20 shadow-lg hover:shadow-primary-500/10 transition-all">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>Monthly Expenses</h3>
                <p className={`text-3xl font-bold ${monthlyStats.expenses > 0 ? 'text-red-500' : 'text-gray-400'}`} style={{ textShadow: '0 0 5px rgba(255, 0, 0, 0.3)' }}>
                  {formatCurrency(monthlyStats.expenses)}
                </p>
              </div>
            </Card>
            <Card className="bg-dark-400 border-primary-500/20 shadow-lg hover:shadow-primary-500/10 transition-all">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>Current Balance</h3>
                <p className={`text-3xl font-bold ${monthlyStats.balance >= 0 ? 'text-primary-400' : 'text-red-500'}`} style={{ textShadow: monthlyStats.balance >= 0 ? '0 0 5px rgba(0, 255, 102, 0.3)' : '0 0 5px rgba(255, 0, 0, 0.3)' }}>
                  {formatCurrency(monthlyStats.balance)}
                </p>
              </div>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-dark-400 border-primary-500/20 shadow-lg hover:shadow-primary-500/10 transition-all">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>Recent Transactions</h3>
                  <Link href="/transactions">
                    <Button variant="outline" size="sm" className="hover:bg-primary-500/20 hover:text-white transition-colors">View All</Button>
                  </Link>
                </div>
                <ul>
                  {transactions.slice(0, 5).map(t => (
                    <li key={t.id} className="py-2 border-b border-gray-700 last:border-b-0">
                      <div className="flex justify-between">
                        <span className="text-gray-100">{t.description || 'Transaction'}</span>
                        <span className={`text-lg font-bold ${t.isIncome ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(t.amount)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
            <Card className="bg-dark-400 border-primary-500/20 shadow-lg hover:shadow-primary-500/10 transition-all">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>Budget Overview</h3>
                  <Link href="/budget">
                    <Button variant="outline" size="sm" className="hover:bg-primary-500/20 hover:text-white transition-colors">Manage</Button>
                  </Link>
                </div>
                <ul>
                  {budgets.map(b => (
                    <li key={b.id} className="py-2 border-b border-gray-700 last:border-b-0">
                      <div className="flex justify-between">
                        <span className="text-gray-100">
                          {categories.find(c => c.id === b.categoryId)?.name || 'Budget'}
                        </span>
                        <span className="text-lg font-bold text-primary-400">{formatCurrency(b.amount)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/transactions" className="block">
              <Card className="bg-dark-400 border-primary-500/20 h-full transition-all hover:scale-102 hover:shadow-lg hover:shadow-primary-500/20">
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-center mb-3">
                    <i className="fas fa-exchange-alt text-primary-400 mr-3"></i>
                    <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>Transactions</h3>
                  </div>
                  <p className="text-gray-100 mb-4 flex-grow" style={{ fontFamily: 'Roboto Mono, monospace' }}>
                    Track your income and expenses with detailed transaction history
                  </p>
                  <Button variant="outline" className="mt-auto hover:bg-primary-500/20 hover:text-white transition-colors">View Transactions</Button>
                </div>
              </Card>
            </Link>
            <Link href="/budget" className="block">
              <Card className="bg-dark-400 border-primary-500/20 h-full transition-all hover:scale-102 hover:shadow-lg hover:shadow-primary-500/20">
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-center mb-3">
                    <i className="fas fa-chart-pie text-primary-400 mr-3"></i>
                    <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>Budget</h3>
                  </div>
                  <p className="text-gray-100 mb-4 flex-grow" style={{ fontFamily: 'Roboto Mono, monospace' }}>
                    Create and manage budgets to stay on top of your finances
                  </p>
                  <Button variant="outline" className="mt-auto hover:bg-primary-500/20 hover:text-white transition-colors">Manage Budget</Button>
                </div>
              </Card>
            </Link>
            <Link href="/categories" className="block">
              <Card className="bg-dark-400 border-primary-500/20 h-full transition-all hover:scale-102 hover:shadow-lg hover:shadow-primary-500/20">
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-center mb-3">
                    <i className="fas fa-tags text-primary-400 mr-3"></i>
                    <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>Categories</h3>
                  </div>
                  <p className="text-gray-100 mb-4 flex-grow" style={{ fontFamily: 'Roboto Mono, monospace' }}>
                    Organize your transactions with customizable categories
                  </p>
                  <Button variant="outline" className="mt-auto hover:bg-primary-500/20 hover:text-white transition-colors">View Categories</Button>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-4">
              Loading GainzBudget
            </h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 