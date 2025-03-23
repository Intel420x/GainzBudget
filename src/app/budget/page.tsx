'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { db, Budget, Category, Transaction } from '@/lib/db';

export default function BudgetPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // Format: YYYY-MM
  );
  const [editingBudget, setEditingBudget] = useState<{
    categoryId: number;
    amount: number;
  } | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all categories
        const allCategories = await db.categories.toArray();
        setCategories(allCategories);
        
        // Load all budgets
        const allBudgets = await db.budgets.toArray();
        setBudgets(allBudgets);
        
        // Load transactions for the current month with correct date formatting
        const [year, month] = currentMonth.split('-');
        const startDateStr = `${year}-${month}-01`;
        
        // Create Date objects for start and end of month
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
        
        // Format dates as strings in YYYY-MM-DD format for comparison
        const startDateFormatted = startDate.toISOString().split('T')[0];
        const endDateFormatted = endDate.toISOString().split('T')[0];
        
        // Get all transactions and filter by date
        const allTransactions = await db.transactions.toArray();
        const monthTransactions = allTransactions.filter(t => {
          return t.date >= startDateFormatted && t.date <= endDateFormatted;
        });
        
        setTransactions(monthTransactions);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentMonth]);

  // Handle month change
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMonth(e.target.value);
  };

  // Calculate spending by category
  const getCategorySpending = (categoryName: string): number => {
    return transactions
      .filter(t => !t.isIncome && t.category === categoryName)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Get budget for a category
  const getCategoryBudget = (categoryId: number): Budget | undefined => {
    return budgets.find(b => b.categoryId === categoryId);
  };

  // Calculate budget progress
  const getBudgetProgress = (categoryId: number, categoryName: string): number => {
    const budget = getCategoryBudget(categoryId);
    if (!budget || budget.amount === 0) return 0;
    
    const spent = getCategorySpending(categoryName);
    return Math.min(100, (spent / budget.amount) * 100);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Start editing a budget
  const handleEditBudget = (categoryId: number) => {
    const existingBudget = getCategoryBudget(categoryId);
    setEditingBudget({
      categoryId,
      amount: existingBudget?.amount || 0,
    });
  };

  // Save budget
  const handleSaveBudget = async () => {
    if (!editingBudget) return;
    
    try {
      const now = new Date().toISOString();
      const existingBudget = getCategoryBudget(editingBudget.categoryId);
      
      if (existingBudget) {
        // Update existing budget
        await db.budgets.update(existingBudget.id!, {
          amount: editingBudget.amount,
          updatedAt: now,
        });
      } else {
        // Create new budget
        const [year, month] = currentMonth.split('-');
        const startDate = `${year}-${month}-01`;
        
        await db.budgets.add({
          categoryId: editingBudget.categoryId,
          amount: editingBudget.amount,
          period: 'monthly',
          startDate,
          createdAt: now,
          updatedAt: now,
        });
      }
      
      // Reload budgets
      const allBudgets = await db.budgets.toArray();
      setBudgets(allBudgets);
      
      // Clear editing state
      setEditingBudget(null);
    } catch (error) {
      console.error('Failed to save budget:', error);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingBudget(null);
  };

  // Get month name
  const getMonthName = (): string => {
    const [year, month] = currentMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getMonthName()} Budget
          </h1>
          
          <div>
            <Input
              type="month"
              value={currentMonth}
              onChange={handleMonthChange}
              className="text-sm py-1"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories
              .filter(category => category.type === 'expense')
              .map(category => {
                const budget = getCategoryBudget(category.id!);
                const spent = getCategorySpending(category.name);
                const progress = getBudgetProgress(category.id!, category.name);
                const isOverBudget = budget && spent > budget.amount;
                
                return (
                  <Card 
                    key={category.id}
                    title={
                      <div className="flex items-center">
                        <div 
                          className="flex items-center justify-center w-8 h-8 rounded-full mr-2"
                          style={{ backgroundColor: category.color }}
                        >
                          <i className={`fas fa-${category.icon} text-white`}></i>
                        </div>
                        <span>{category.name}</span>
                      </div>
                    }
                    className="relative"
                  >
                    {editingBudget && editingBudget.categoryId === category.id ? (
                      <div className="space-y-4">
                        <Input
                          type="number"
                          label="Budget Amount"
                          value={editingBudget.amount}
                          onChange={(e) => setEditingBudget({
                            ...editingBudget,
                            amount: parseFloat(e.target.value) || 0,
                          })}
                          fullWidth
                          min="0"
                          step="0.01"
                        />
                        
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={handleSaveBudget}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Spent</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(spent)} {budget ? `/ ${formatCurrency(budget.amount)}` : '(No budget set)'}
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                          <div 
                            className={`h-2.5 rounded-full ${
                              isOverBudget 
                                ? 'bg-red-600 dark:bg-red-500' 
                                : progress > 85 
                                  ? 'bg-yellow-400 dark:bg-yellow-500' 
                                  : 'bg-primary-600 dark:bg-primary-500'
                            }`} 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        
                        {isOverBudget && (
                          <div className="text-sm text-red-600 dark:text-red-400 mb-4">
                            Over budget by {formatCurrency(spent - budget!.amount)}
                          </div>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditBudget(category.id!)}
                          fullWidth
                        >
                          {budget ? 'Edit Budget' : 'Set Budget'}
                        </Button>
                      </>
                    )}
                  </Card>
                );
              })}
          </div>
        )}
        
        {/* Total Budget Summary */}
        <Card 
          title={
            <div className="flex items-center">
              <div 
                className="flex items-center justify-center w-8 h-8 rounded-full mr-2 bg-green-500"
              >
                <i className="fas fa-chart-pie text-white"></i>
              </div>
              <span>Budget Summary</span>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Budgeted</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(budgets.reduce((sum, b) => sum + b.amount, 0))}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Spent</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatCurrency(transactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0))}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="font-medium">Remaining</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {formatCurrency(
                  budgets.reduce((sum, b) => sum + b.amount, 0) - 
                  transactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0)
                )}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}