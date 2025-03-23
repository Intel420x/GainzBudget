'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { db, Transaction, Category } from '@/lib/db';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  PointElement,
  LineElement
);

export default function ReportsPage() {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [reportType, setReportType] = useState<'expense' | 'income' | 'both'>('expense');
  const [groupBy, setGroupBy] = useState<'category' | 'month'>('category');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load categories
        const allCategories = await db.categories.toArray();
        setCategories(allCategories);
        
        // Load all transactions and filter by date manually
        const allTransactions = await db.transactions.toArray();
        const transactionsInRange = allTransactions.filter(t => {
          return t.date >= dateRange.start && t.date <= dateRange.end;
        });
        
        setTransactions(transactionsInRange);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [dateRange]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate summary stats
  const totalIncome = transactions
    .filter(t => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => !t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Get transactions to use for current report
  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      if (reportType === 'expense') return !t.isIncome;
      if (reportType === 'income') return t.isIncome;
      return true; // both
    });
  };

  // Prepare data for category-based charts
  const getCategoryChartData = () => {
    const filteredTransactions = getFilteredTransactions();
    
    // Group transactions by category
    const groupedData: Record<string, number> = {};
    
    filteredTransactions.forEach(transaction => {
      const categoryName = transaction.category || 'Uncategorized';
      
      if (!groupedData[categoryName]) {
        groupedData[categoryName] = 0;
      }
      
      groupedData[categoryName] += transaction.amount;
    });
    
    // Sort by amount descending and limit to top 10
    const sortedCategories = Object.entries(groupedData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    // Find category colors
    const categoryColors = sortedCategories.map(([categoryName]) => {
      const category = categories.find(c => c.name === categoryName);
      return category?.color || '#6366F1'; // Default to indigo if no color found
    });
    
    return {
      labels: sortedCategories.map(([categoryName]) => categoryName),
      datasets: [
        {
          data: sortedCategories.map(([, amount]) => amount),
          backgroundColor: categoryColors,
          borderColor: categoryColors.map(color => color),
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare data for time-based charts
  const getTimeChartData = () => {
    const filteredTransactions = getFilteredTransactions();
    
    // Group transactions by month
    const monthlyData: Record<string, number> = {};
    
    // Initialize with all months in range
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const monthKey = currentDate.toISOString().substring(0, 7); // YYYY-MM
      monthlyData[monthKey] = 0;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Sum transactions by month
    filteredTransactions.forEach(transaction => {
      const monthKey = transaction.date.substring(0, 7); // YYYY-MM
      
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey] += transaction.amount;
      }
    });
    
    // Convert to arrays for chart
    const months = Object.keys(monthlyData).sort();
    const amounts = months.map(month => monthlyData[month]);
    
    // Format month labels for display
    const formattedMonths = months.map(month => {
      const date = new Date(month + '-01');
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    });
    
    return {
      labels: formattedMonths,
      datasets: [
        {
          label: reportType === 'expense' ? 'Expenses' : reportType === 'income' ? 'Income' : 'Amount',
          data: amounts,
          backgroundColor: reportType === 'expense' ? 'rgba(239, 68, 68, 0.5)' : reportType === 'income' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(99, 102, 241, 0.5)',
          borderColor: reportType === 'expense' ? 'rgb(239, 68, 68)' : reportType === 'income' ? 'rgb(16, 185, 129)' : 'rgb(99, 102, 241)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Get top transactions
  const getTopTransactions = () => {
    const filteredTransactions = getFilteredTransactions();
    
    // Sort by amount descending and take top 5
    return [...filteredTransactions]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'start' | 'end') => {
    setDateRange({
      ...dateRange,
      [field]: e.target.value,
    });
  };

  // Generate income/expense comparison data for the selected period
  const getIncomeExpenseComparisonData = () => {
    // Group by month
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    
    // Initialize with all months in range
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const monthKey = currentDate.toISOString().substring(0, 7); // YYYY-MM
      monthlyData[monthKey] = { income: 0, expense: 0 };
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Sum transactions by month
    transactions.forEach(transaction => {
      const monthKey = transaction.date.substring(0, 7); // YYYY-MM
      
      if (monthlyData[monthKey]) {
        if (transaction.isIncome) {
          monthlyData[monthKey].income += transaction.amount;
        } else {
          monthlyData[monthKey].expense += transaction.amount;
        }
      }
    });
    
    // Convert to arrays for chart
    const months = Object.keys(monthlyData).sort();
    const formattedMonths = months.map(month => {
      const date = new Date(month + '-01');
      return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    });
    
    return {
      labels: formattedMonths,
      datasets: [
        {
          label: 'Income',
          data: months.map(month => monthlyData[month].income),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
        },
        {
          label: 'Expenses',
          data: months.map(month => monthlyData[month].expense),
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Financial Reports
        </h1>
        
        {/* Controls */}
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateChange(e, 'start')}
                fullWidth
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateChange(e, 'end')}
                fullWidth
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'expense' | 'income' | 'both')}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
                <option value="both">Both</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Group By
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'category' | 'month')}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="category">Category</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>
        </Card>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card title="Total Income">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalIncome)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  For selected period
                </p>
              </Card>
              
              <Card title="Total Expenses">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalExpense)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  For selected period
                </p>
              </Card>
              
              <Card title="Net Savings">
                <p className={`text-2xl font-bold ${netSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(netSavings)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Income - Expenses
                </p>
              </Card>
              
              <Card title="Savings Rate">
                <p className={`text-2xl font-bold ${savingsRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {savingsRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Of total income
                </p>
              </Card>
            </div>
            
            {/* Main Chart */}
            <Card title={`${reportType === 'expense' ? 'Expense' : reportType === 'income' ? 'Income' : 'Transaction'} Breakdown by ${groupBy === 'category' ? 'Category' : 'Month'}`}>
              <div className="h-80">
                {groupBy === 'category' ? (
                  <Pie 
                    data={getCategoryChartData()} 
                    options={{ 
                      plugins: { 
                        legend: { 
                          position: 'right',
                          labels: {
                            boxWidth: 15,
                            padding: 15,
                          }
                        } 
                      },
                      maintainAspectRatio: false,
                    }} 
                  />
                ) : (
                  <Bar 
                    data={getTimeChartData()} 
                    options={{
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      },
                      maintainAspectRatio: false,
                    }}
                  />
                )}
              </div>
            </Card>
            
            {/* Income vs Expense Comparison */}
            <Card title="Income vs Expenses Over Time">
              <div className="h-80">
                <Line 
                  data={getIncomeExpenseComparisonData()} 
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    },
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </Card>
            
            {/* Top Transactions */}
            <Card title={`Top 5 ${reportType === 'expense' ? 'Expenses' : reportType === 'income' ? 'Income Sources' : 'Transactions'}`}>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {getTopTransactions().length > 0 ? (
                  getTopTransactions().map((transaction) => (
                    <div key={transaction.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.description || 'Unnamed Transaction'}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.category || 'Uncategorized'}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className={`font-medium ${transaction.isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {transaction.isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-gray-500 dark:text-gray-400">
                    No transactions found for the selected period and type.
                  </p>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
} 