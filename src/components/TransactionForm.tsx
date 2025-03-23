'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { db, Transaction, Category } from '@/lib/db';

interface TransactionFormProps {
  onSave: (transaction: Transaction) => void;
  onCancel: () => void;
  initialData?: Partial<Transaction>;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSave,
  onCancel,
  initialData,
}) => {
  // Load categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [isIncome, setIsIncome] = useState(initialData?.isIncome || false);
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    category: '',
    categoryId: undefined,
    isIncome: false,
    isRecurring: false,
    recurringFrequency: 'monthly',
    notes: '',
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await db.categories.toArray();
        setCategories(allCategories);
        
        // Set default category based on transaction type
        if (!initialData?.category) {
          const defaultCategory = allCategories.find(c => c.type === (isIncome ? 'income' : 'expense'));
          if (defaultCategory) {
            setFormData(prev => ({ 
              ...prev, 
              category: defaultCategory.name,
              categoryId: defaultCategory.id 
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    
    loadCategories();
  }, [initialData, isIncome]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else if (name === 'amount') {
      // Ensure amount is a positive number
      const amount = parseFloat(value);
      if (!isNaN(amount) && amount >= 0) {
        setFormData({ ...formData, [name]: amount });
      }
    } else if (name === 'category') {
      // Find category ID when category name changes
      const selectedCategory = categories.find(c => c.name === value);
      setFormData({ 
        ...formData, 
        [name]: value,
        categoryId: selectedCategory?.id 
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Toggle between income and expense
  const toggleTransactionType = () => {
    const newIsIncome = !isIncome;
    setIsIncome(newIsIncome);
    
    // Update form data
    setFormData(prev => ({ 
      ...prev, 
      isIncome: newIsIncome,
      category: '', // Reset category when switching types
      categoryId: undefined,
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const now = new Date().toISOString();
      const transactionToSave: Transaction = {
        ...formData as Transaction,
        isIncome,
        amount: formData.amount || 0,
        createdAt: initialData?.createdAt || now,
        updatedAt: now,
      };
      
      // Call onSave with the transaction data
      // This will trigger the parent component's save handler
      onSave(transactionToSave);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setErrors({ submit: 'Failed to save transaction. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card title={initialData?.id ? 'Edit Transaction' : 'Add Transaction'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction type toggle */}
        <div className="flex mb-6 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
          <button
            type="button"
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              !isIncome
                ? 'bg-red-600 text-white dark:bg-red-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200'
            }`}
            onClick={() => isIncome && toggleTransactionType()}
          >
            Expense
          </button>
          <button
            type="button"
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              isIncome
                ? 'bg-green-600 text-white dark:bg-green-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200'
            }`}
            onClick={() => !isIncome && toggleTransactionType()}
          >
            Income
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Date */}
          <Input
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            error={errors.date}
            fullWidth
          />

          {/* Amount */}
          <Input
            label="Amount"
            type="number"
            name="amount"
            value={formData.amount?.toString()}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            error={errors.amount}
            fullWidth
            leadingIcon={<span>$</span>}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Description */}
          <Input
            label="Description"
            type="text"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="What was this for?"
            required
            error={errors.description}
            fullWidth
          />

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              required
            >
              <option value="">Select a category</option>
              {categories
                .filter(category => category.type === (isIncome ? 'income' : 'expense'))
                .map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))
              }
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.category}
              </p>
            )}
          </div>
        </div>

        {/* Recurring transaction */}
        <div className="flex items-center">
          <input
            id="isRecurring"
            name="isRecurring"
            type="checkbox"
            checked={formData.isRecurring || false}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
          />
          <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            This is a recurring transaction
          </label>
        </div>

        {formData.isRecurring && (
          <div>
            <label htmlFor="recurringFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Frequency
            </label>
            <select
              id="recurringFrequency"
              name="recurringFrequency"
              value={formData.recurringFrequency || 'monthly'}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes || ''}
            onChange={handleChange}
            placeholder="Add any additional details"
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {errors.submit && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">
              {errors.submit}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onCancel} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant={isIncome ? 'success' : 'danger'}
            isLoading={isSubmitting}
          >
            {isIncome ? 'Save Income' : 'Save Expense'}
          </Button>
        </div>
      </form>
    </Card>
  );
}; 