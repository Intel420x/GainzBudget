'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TransactionForm } from '@/components/TransactionForm';
import { db, Transaction, Category } from '@/lib/db';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'category'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load transactions and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all categories
        const allCategories = await db.categories.toArray();
        setCategories(allCategories);
        
        // Load all transactions
        const allTransactions = await db.transactions.toArray();
        setTransactions(allTransactions);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = searchQuery === '' || 
        (transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (transaction.category?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
      
      const matchesCategory = filterCategory === '' || transaction.category === filterCategory;
      
      const matchesType = filterType === 'all' || 
        (filterType === 'income' && transaction.isIncome) ||
        (filterType === 'expense' && !transaction.isIncome);
      
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortField === 'amount') {
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else if (sortField === 'category') {
        const categoryA = a.category || '';
        const categoryB = b.category || '';
        return sortDirection === 'asc' 
          ? categoryA.localeCompare(categoryB)
          : categoryB.localeCompare(categoryA);
      }
      return 0;
    });

  // Handle deleting a transaction
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await db.transactions.delete(id);
        setTransactions(prev => prev.filter(t => t.id !== id));
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  // Handle editing a transaction
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  // Handle form save (both create and edit)
  const handleFormSave = async (transaction: Transaction) => {
    try {
      // First save the transaction to the database
      if (transaction.id) {
        // Update existing transaction
        await db.transactions.update(transaction.id, transaction);
      } else {
        // Add new transaction
        await db.transactions.add(transaction);
      }
      
      // Then reload all transactions
      const allTransactions = await db.transactions.toArray();
      setTransactions(allTransactions);
      
      // Close form and reset editing state
      setShowForm(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  // Format amount as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Get total income, expenses, and balance
  const totalIncome = transactions
    .filter(t => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => !t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpenses;

  if (showForm) {
    return (
      <Layout>
        <TransactionForm 
          onSave={handleFormSave}
          onCancel={handleFormCancel}
          initialData={editingTransaction || undefined}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="bg-green-50 dark:bg-green-900/20">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Income</h3>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalIncome)}
              </p>
            </div>
          </Card>
          
          <Card className="bg-red-50 dark:bg-red-900/20">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Expenses</h3>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </Card>
          
          <Card className={`${balance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Balance</h3>
              <p className={`mt-2 text-3xl font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </Card>
        </div>
        
        {/* Filters and Actions */}
        <Card>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-grow max-w-md">
                <Input 
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                />
              </div>
              
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expenses Only</option>
                </select>
              </div>
              
              <Button 
                onClick={() => setShowForm(true)}
                variant="primary"
              >
                Add Transaction
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <button
                onClick={() => {
                  if (sortField === 'date') {
                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('date');
                    setSortDirection('desc');
                  }
                }}
                className={`px-3 py-1 text-sm rounded-md ${
                  sortField === 'date' 
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              
              <button
                onClick={() => {
                  if (sortField === 'amount') {
                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('amount');
                    setSortDirection('desc');
                  }
                }}
                className={`px-3 py-1 text-sm rounded-md ${
                  sortField === 'amount' 
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              
              <button
                onClick={() => {
                  if (sortField === 'category') {
                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('category');
                    setSortDirection('asc');
                  }
                }}
                className={`px-3 py-1 text-sm rounded-md ${
                  sortField === 'category' 
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </Card>
        
        {/* Transactions Table */}
        <Card>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No transactions found.
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
                Add Your First Transaction
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredTransactions.map(transaction => (
                    <tr 
                      key={transaction.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div>{transaction.description}</div>
                        {transaction.isRecurring && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Recurring ({transaction.recurringFrequency})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div>{transaction.category}</div>
                        {transaction.subcategory && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.subcategory}
                          </div>
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                        transaction.isIncome 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEdit(transaction)} 
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(transaction.id!)} 
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
} 