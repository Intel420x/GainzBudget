import Dexie, { Table } from 'dexie';

// Define interfaces for database models
export interface Transaction {
  id?: number;
  date: string;
  amount: number;
  description?: string;
  category?: string;
  categoryId?: number;
  isIncome: boolean;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id?: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id?: number;
  categoryId: number;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id?: number;
  currency: string;
  darkMode?: boolean;
  passwordProtected?: boolean;
  passwordHash?: string | null;
  exportEncrypted?: boolean;
  lastBackup?: string;
  createdAt: string;
  updatedAt: string;
}

// Define the database class
class GainzBudgetDatabase extends Dexie {
  // Define tables
  transactions!: Table<Transaction, number>;
  categories!: Table<Category, number>;
  budgets!: Table<Budget, number>;
  settings!: Table<Settings, number>;

  constructor() {
    super('GainzBudgetDB');
    
    // Define schema version
    this.version(1).stores({
      transactions: '++id, date, amount, category, categoryId, isIncome, createdAt, updatedAt',
      categories: '++id, name, type, createdAt, updatedAt',
      budgets: '++id, categoryId, period, startDate, endDate, createdAt, updatedAt',
      settings: '++id, createdAt, updatedAt',
    });
  }

  // Initialize default data
  async initializeDefaults() {
    // Check if categories exist
    const categoryCount = await this.categories.count();
    if (categoryCount === 0) {
      // Add default categories
      const now = new Date().toISOString();
      
      // Default income categories
      await this.categories.bulkAdd([
        {
          name: 'Salary',
          type: 'income',
          color: '#10B981', // Emerald
          icon: 'dollar-sign',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Freelance',
          type: 'income',
          color: '#6366F1', // Indigo
          icon: 'laptop',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Investments',
          type: 'income',
          color: '#F59E0B', // Amber
          icon: 'chart-line',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Gifts',
          type: 'income',
          color: '#EC4899', // Pink
          icon: 'gift',
          createdAt: now,
          updatedAt: now,
        },
      ]);
      
      // Default expense categories
      await this.categories.bulkAdd([
        {
          name: 'Housing',
          type: 'expense',
          color: '#EF4444', // Red
          icon: 'home',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Food',
          type: 'expense',
          color: '#F97316', // Orange
          icon: 'utensils',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Transportation',
          type: 'expense',
          color: '#06B6D4', // Cyan
          icon: 'car',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Entertainment',
          type: 'expense',
          color: '#8B5CF6', // Violet
          icon: 'gamepad',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Healthcare',
          type: 'expense',
          color: '#10B981', // Emerald
          icon: 'pills',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Shopping',
          type: 'expense',
          color: '#EC4899', // Pink
          icon: 'shopping-cart',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Utilities',
          type: 'expense',
          color: '#6366F1', // Indigo
          icon: 'phone',
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }
    
    // Check if settings exist
    const settingsCount = await this.settings.count();
    if (settingsCount === 0) {
      // Add default settings
      const now = new Date().toISOString();
      await this.settings.add({
        currency: 'USD',
        darkMode: false,
        passwordProtected: false,
        exportEncrypted: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  
  // Clean up duplicate categories
  async cleanupDuplicateCategories() {
    try {
      const allCategories = await this.categories.toArray();
      const uniqueMap = new Map();
      const duplicateIds: number[] = [];
      
      // Find duplicates and keep only the first occurrence
      allCategories.forEach(category => {
        const key = `${category.name.toLowerCase()}-${category.type}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, category);
        } else if (category.id) {
          // This is a duplicate, mark for deletion
          duplicateIds.push(category.id);
        }
      });
      
      // Delete duplicates
      if (duplicateIds.length > 0) {
        await this.categories.bulkDelete(duplicateIds);
        console.log(`Cleaned up ${duplicateIds.length} duplicate categories`);
      }
      
      return duplicateIds.length;
    } catch (error) {
      console.error('Error cleaning up duplicate categories:', error);
      return 0;
    }
  }
}

// Create and export database instance
export const db = new GainzBudgetDatabase();

// Initialize database when app starts
export const initDB = async () => {
  await db.initializeDefaults();
  // Clean up any duplicate categories
  await db.cleanupDuplicateCategories();
};

// Export a function to reset the database (for testing or user-initiated reset)
export const resetDB = async () => {
  await db.delete();
  const newDb = new GainzBudgetDatabase();
  await newDb.initializeDefaults();
  return newDb;
}; 