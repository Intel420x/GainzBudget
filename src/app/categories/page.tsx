'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { db, Category } from '@/lib/db';

export default function CategoriesPage() {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    type: 'expense',
    color: '#6366F1', // Default color
    icon: 'tag', // Default icon
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showAddForm, setShowAddForm] = useState(false);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const allCategories = await db.categories.toArray();
        
        // Deduplicate categories by name and type
        const uniqueCategories: Category[] = [];
        const seen = new Set();
        
        allCategories.forEach(category => {
          const key = `${category.name.toLowerCase()}-${category.type}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueCategories.push(category);
          }
        });
        
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, []);

  // Add category
  const handleAddCategory = async () => {
    try {
      if (!newCategory.name?.trim()) {
        setError('Category name is required');
        return;
      }
      
      // Check for duplicate name
      const existingCategory = categories.find(
        c => c.name.toLowerCase() === (newCategory.name || '').toLowerCase() && c.type === newCategory.type
      );
      
      if (existingCategory) {
        setError(`A ${newCategory.type} category with this name already exists`);
        return;
      }
      
      const categoryToAdd: Category = {
        name: newCategory.name,
        type: newCategory.type || 'expense',
        color: newCategory.color || '#6366F1',
        icon: newCategory.icon || 'tag',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const id = await db.categories.add(categoryToAdd);
      
      // Update categories list
      setCategories([...categories, { ...categoryToAdd, id }]);
      
      // Reset form
      setNewCategory({
        name: '',
        type: activeTab,
        color: '#6366F1',
        icon: 'tag',
      });
      
      setError('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add category:', error);
      setError('Failed to add category');
    }
  };

  // Start edit
  const handleStartEdit = (category: Category) => {
    setEditingCategory({ ...category });
    setError('');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setError('');
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingCategory) return;
    
    try {
      if (!editingCategory.name) {
        setError('Category name is required');
        return;
      }
      
      // Check for duplicate name, excluding the current category
      const existingCategory = categories.find(
        c => c.id !== editingCategory.id && 
        c.name.toLowerCase() === editingCategory.name.toLowerCase() && 
        c.type === editingCategory.type
      );
      
      if (existingCategory) {
        setError(`A ${editingCategory.type} category with this name already exists`);
        return;
      }
      
      // Update in database
      await db.categories.update(editingCategory.id!, {
        name: editingCategory.name,
        color: editingCategory.color,
        icon: editingCategory.icon,
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setCategories(
        categories.map(c => c.id === editingCategory.id ? { ...editingCategory } : c)
      );
      
      // Exit edit mode
      setEditingCategory(null);
      setError('');
    } catch (error) {
      console.error('Failed to update category:', error);
      setError('Failed to update category');
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId: number) => {
    try {
      // Check if category is in use
      const transactions = await db.transactions
        .where('categoryId')
        .equals(categoryId)
        .count();
      
      const budgets = await db.budgets
        .where('categoryId')
        .equals(categoryId)
        .count();
      
      if (transactions > 0 || budgets > 0) {
        const inUseMessage = [
          transactions > 0 ? `${transactions} transaction(s)` : '',
          budgets > 0 ? `${budgets} budget(s)` : ''
        ].filter(Boolean).join(' and ');
        
        if (!confirm(`This category is being used in ${inUseMessage}. Deleting it may cause issues. Are you sure you want to continue?`)) {
          return;
        }
      } else {
        if (!confirm('Are you sure you want to delete this category?')) {
          return;
        }
      }
      
      // Delete from database
      await db.categories.delete(categoryId);
      
      // Update local state
      setCategories(categories.filter(c => c.id !== categoryId));
      
      // If editing this category, cancel edit
      if (editingCategory && editingCategory.id === categoryId) {
        setEditingCategory(null);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      setError('Failed to delete category');
    }
  };

  // Change tab
  const handleTabChange = (tab: 'expense' | 'income') => {
    setActiveTab(tab);
    setNewCategory(prev => ({ ...prev, type: tab }));
  };

  // Available colors
  const availableColors = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];

  // Available icons (limited for simplicity)
  const availableIcons = [
    'tag',
    'home',
    'shopping-cart',
    'utensils',
    'car',
    'plane',
    'gas-pump',
    'tshirt',
    'pills',
    'gamepad',
    'graduation-cap',
    'coffee',
    'gift',
    'phone',
    'laptop',
    'dollar-sign',
    'credit-card',
    'piggy-bank',
    'paw',
  ];

  // Get category count by type
  const getCategoryCount = (type: 'expense' | 'income') => {
    return categories.filter(c => c.type === type).length;
  };

  // Render category form (used for both add and edit)
  const renderCategoryForm = (isEdit: boolean = false) => {
    const category = isEdit ? editingCategory : newCategory;
    if (!category) return null;
    
    return (
      <Card 
        title={isEdit ? 'Edit Category' : 'Add New Category'}
        className="mb-6"
      >
        <div className="space-y-4">
          {/* Name */}
          <Input
            label="Category Name"
            value={category.name}
            onChange={(e) => 
              isEdit 
                ? setEditingCategory({ ...editingCategory!, name: e.target.value }) 
                : setNewCategory({ ...newCategory, name: e.target.value })
            }
            error={error}
            fullWidth
          />
          
          {/* Color selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => 
                    isEdit 
                      ? setEditingCategory({ ...editingCategory!, color }) 
                      : setNewCategory({ ...newCategory, color })
                  }
                  className={`w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                    category.color === color ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
          
          {/* Icon selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-3 sm:grid-cols-8 md:grid-cols-10">
              {availableIcons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => 
                    isEdit 
                      ? setEditingCategory({ ...editingCategory!, icon }) 
                      : setNewCategory({ ...newCategory, icon })
                  }
                  className={`flex items-center justify-center w-10 h-10 rounded border focus:outline-none ${
                    category.icon === icon 
                      ? 'bg-primary-100 border-primary-500 text-primary-700 dark:bg-primary-900 dark:border-primary-400 dark:text-primary-300' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  aria-label={`Select icon ${icon}`}
                >
                  <i className={`fas fa-${icon}`}></i>
                </button>
              ))}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outline"
              onClick={() => isEdit ? handleCancelEdit() : setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={isEdit ? handleSaveEdit : handleAddCategory}
            >
              {isEdit ? 'Save Changes' : 'Add Category'}
            </Button>
          </div>
        </div>
      </Card>
    );
  };
  
  // Get filtered categories
  const filteredCategories = categories.filter(c => c.type === activeTab);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Categories
          </h1>
          
          <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'expense'
                  ? 'bg-primary-600 text-white dark:bg-primary-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200'
              }`}
              onClick={() => handleTabChange('expense')}
            >
              Expenses ({getCategoryCount('expense')})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'income'
                  ? 'bg-primary-600 text-white dark:bg-primary-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200'
              }`}
              onClick={() => handleTabChange('income')}
            >
              Income ({getCategoryCount('income')})
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : (
          <>
            {/* Add category button and form */}
            {!showAddForm && !editingCategory && (
              <div className="flex justify-end mb-6">
                <Button
                  variant="primary"
                  onClick={() => setShowAddForm(true)}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add {activeTab === 'expense' ? 'Expense' : 'Income'} Category
                </Button>
              </div>
            )}
            
            {showAddForm && !editingCategory && renderCategoryForm()}
            {editingCategory && renderCategoryForm(true)}
            
            {/* Categories list */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.length > 0 ? (
                filteredCategories.map(category => (
                  <Card key={category.id} className="h-full">
                    <div className="flex items-center">
                      <div 
                        className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full mr-4"
                        style={{ backgroundColor: category.color }}
                      >
                        <i className={`fas fa-${category.icon} text-white text-lg`}></i>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStartEdit(category)}
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id!)}
                      >
                        <i className="fas fa-trash-alt mr-1"></i>
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No {activeTab} categories found.
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowAddForm(true)}
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add {activeTab === 'expense' ? 'Expense' : 'Income'} Category
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
} 