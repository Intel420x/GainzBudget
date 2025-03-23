'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { db } from '@/lib/db';
import { encryptData, decryptData, generateEncryptionKey } from '@/lib/encryption';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    currency: 'USD',
    darkMode: false,
    passwordProtected: false,
    exportEncrypted: true,
  });

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const appSettings = await db.settings.toArray();
        
        if (appSettings.length > 0) {
          setSettings({
            currency: appSettings[0].currency || 'USD',
            darkMode: appSettings[0].darkMode || false,
            passwordProtected: appSettings[0].passwordProtected || false,
            exportEncrypted: appSettings[0].exportEncrypted !== false, // default to true
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Save settings
  const handleSaveSettings = async () => {
    try {
      const appSettings = await db.settings.toArray();
      
      if (appSettings.length > 0) {
        await db.settings.update(appSettings[0].id!, {
          ...settings,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await db.settings.add({
          ...settings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      
      // Apply dark mode immediately
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Handle change password
  const handleChangePassword = async () => {
    // Reset error states
    setCurrentPasswordError('');
    setNewPasswordError('');
    
    // Validate current password if already password protected
    if (settings.passwordProtected) {
      const appSettings = await db.settings.toArray();
      const storedPasswordHash = appSettings[0].passwordHash;
      
      // Implement real password validation here - this is simplified
      if (password !== storedPasswordHash) {
        setCurrentPasswordError('Current password is incorrect');
        return;
      }
    }
    
    // Validate new password
    if (newPassword.length < 8) {
      setNewPasswordError('Password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setNewPasswordError('Passwords do not match');
      return;
    }
    
    try {
      const appSettings = await db.settings.toArray();
      
      if (appSettings.length > 0) {
        await db.settings.update(appSettings[0].id!, {
          passwordProtected: true,
          passwordHash: newPassword, // In a real app, use proper hashing
          updatedAt: new Date().toISOString(),
        });
      } else {
        await db.settings.add({
          ...settings,
          passwordProtected: true,
          passwordHash: newPassword, // In a real app, use proper hashing
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      
      setSettings({
        ...settings,
        passwordProtected: true,
      });
      
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      alert('Password has been updated successfully');
    } catch (error) {
      console.error('Failed to update password:', error);
    }
  };

  // Remove password protection
  const handleRemovePassword = async () => {
    // Validate current password
    const appSettings = await db.settings.toArray();
    const storedPasswordHash = appSettings[0].passwordHash;
    
    if (password !== storedPasswordHash) {
      setCurrentPasswordError('Current password is incorrect');
      return;
    }
    
    try {
      await db.settings.update(appSettings[0].id!, {
        passwordProtected: false,
        passwordHash: null,
        updatedAt: new Date().toISOString(),
      });
      
      setSettings({
        ...settings,
        passwordProtected: false,
      });
      
      setPassword('');
      alert('Password protection has been removed');
    } catch (error) {
      console.error('Failed to remove password:', error);
    }
  };

  // Export data
  const handleExportData = async () => {
    try {
      setExporting(true);
      setExportStatus('Preparing data for export...');
      
      // Collect all data
      const categories = await db.categories.toArray();
      const transactions = await db.transactions.toArray();
      const budgets = await db.budgets.toArray();
      const appSettings = await db.settings.toArray();
      
      const exportData = {
        categories,
        transactions,
        budgets,
        settings: appSettings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // Convert to JSON
      let dataStr = JSON.stringify(exportData, null, 2);
      
      // Encrypt if needed
      if (settings.exportEncrypted) {
        setExportStatus('Encrypting data...');
        
        // For demo purposes - would need proper key management
        const encryptionKey = await generateEncryptionKey(password || 'default-key');
        const encryptedData = await encryptData(dataStr, encryptionKey);
        dataStr = JSON.stringify({
          encrypted: true,
          data: encryptedData
        });
      }
      
      // Create download
      setExportStatus('Creating download...');
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gainzbudget-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExporting(false);
        setExportStatus('Data exported successfully');
        setTimeout(() => setExportStatus(''), 3000);
      }, 100);
    } catch (error) {
      console.error('Export failed:', error);
      setExporting(false);
      setExportStatus(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle file import selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  // Import data
  const handleImportData = async () => {
    if (!importFile) {
      setImportStatus('Please select a file to import');
      return;
    }
    
    try {
      setImporting(true);
      setImportStatus('Reading import file...');
      
      // Read file
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(importFile);
      });
      
      let importData;
      
      try {
        importData = JSON.parse(fileContent);
      } catch (error) {
        setImportStatus('Invalid file format');
        setImporting(false);
        return;
      }
      
      // Check if data is encrypted
      if (importData.encrypted) {
        setImportStatus('Decrypting data...');
        
        if (!password) {
          setImportStatus('Password required to decrypt data');
          setImporting(false);
          return;
        }
        
        try {
          // For demo purposes - would need proper key management
          const decryptionKey = await generateEncryptionKey(password);
          const decryptedData = await decryptData(importData.data, decryptionKey);
          importData = JSON.parse(decryptedData);
        } catch (error) {
          setImportStatus('Failed to decrypt data. Incorrect password?');
          setImporting(false);
          return;
        }
      }
      
      // Validate structure
      if (!importData.categories || !importData.transactions || !importData.budgets) {
        setImportStatus('Invalid data structure in import file');
        setImporting(false);
        return;
      }
      
      // Confirm import
      if (!confirm('This will replace all your current data. Are you sure you want to continue?')) {
        setImportStatus('Import cancelled');
        setImporting(false);
        return;
      }
      
      setImportStatus('Importing data...');
      
      // Clear existing data
      await db.categories.clear();
      await db.transactions.clear();
      await db.budgets.clear();
      
      // Import new data (preserving IDs can be tricky, might need to reassign)
      await db.categories.bulkAdd(importData.categories);
      await db.transactions.bulkAdd(importData.transactions);
      await db.budgets.bulkAdd(importData.budgets);
      
      // Update settings if available
      if (importData.settings && importData.settings.length > 0) {
        await db.settings.clear();
        await db.settings.add(importData.settings[0]);
        setSettings({
          currency: importData.settings[0].currency || 'USD',
          darkMode: importData.settings[0].darkMode || false,
          passwordProtected: importData.settings[0].passwordProtected || false,
          exportEncrypted: importData.settings[0].exportEncrypted !== false,
        });
      }
      
      setImporting(false);
      setImportStatus('Data imported successfully');
      setImportFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('import-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Import failed:', error);
      setImporting(false);
      setImportStatus(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Reset all data
  const handleResetData = async () => {
    if (!confirm('WARNING: This will permanently delete ALL your data. This action cannot be undone. Are you absolutely sure?')) {
      return;
    }
    
    if (!confirm('Last chance: Are you really sure you want to delete all your data?')) {
      return;
    }
    
    try {
      await db.categories.clear();
      await db.transactions.clear();
      await db.budgets.clear();
      
      // Keep settings but reset certain values
      const appSettings = await db.settings.toArray();
      if (appSettings.length > 0) {
        await db.settings.update(appSettings[0].id!, {
          passwordProtected: false,
          passwordHash: null,
          updatedAt: new Date().toISOString(),
        });
      }
      
      alert('All data has been reset successfully');
      
      // Update local state
      setSettings({
        ...settings,
        passwordProtected: false,
      });
    } catch (error) {
      console.error('Failed to reset data:', error);
      alert('Failed to reset data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        
        {/* General Settings */}
        <Card title="General Settings">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="JPY">Japanese Yen (¥)</option>
                <option value="CAD">Canadian Dollar (C$)</option>
                <option value="AUD">Australian Dollar (A$)</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="darkMode"
                checked={settings.darkMode}
                onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
              />
              <label htmlFor="darkMode" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Dark Mode
              </label>
            </div>
            
            <div className="pt-4">
              <Button 
                variant="primary" 
                onClick={handleSaveSettings}
              >
                Save Settings
              </Button>
              
              {settingsSaved && (
                <span className="ml-3 text-sm text-green-600 dark:text-green-400">
                  Settings saved successfully
                </span>
              )}
            </div>
          </div>
        </Card>
        
        {/* Security */}
        <Card title="Security">
          <div className="space-y-4">
            {settings.passwordProtected ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your application is currently password protected
                </p>
                
                <Input
                  type="password"
                  label="Current Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={currentPasswordError}
                  fullWidth
                />
                
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Input
                      type="password"
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      fullWidth
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="password"
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={newPasswordError}
                      fullWidth
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 pt-2">
                  <Button 
                    variant="primary" 
                    onClick={handleChangePassword}
                  >
                    Update Password
                  </Button>
                  
                  <Button 
                    variant="danger" 
                    onClick={handleRemovePassword}
                  >
                    Remove Password Protection
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add password protection to secure your financial data
                </p>
                
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Input
                      type="password"
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      fullWidth
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="password"
                      label="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={newPasswordError}
                      fullWidth
                    />
                  </div>
                </div>
                
                <Button 
                  variant="primary" 
                  onClick={handleChangePassword}
                >
                  Enable Password Protection
                </Button>
              </>
            )}
          </div>
        </Card>
        
        {/* Data Management */}
        <Card title="Data Management">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Export Data</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Export all your financial data to a JSON file for backup or migration
              </p>
              
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="exportEncrypted"
                  checked={settings.exportEncrypted}
                  onChange={(e) => setSettings({ ...settings, exportEncrypted: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <label htmlFor="exportEncrypted" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Encrypt exported data
                </label>
              </div>
              
              {settings.exportEncrypted && settings.passwordProtected && (
                <Input
                  type="password"
                  label="Password for Encryption"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mb-4"
                  fullWidth
                />
              )}
              
              <Button 
                variant="primary" 
                onClick={handleExportData}
                disabled={exporting}
              >
                {exporting ? 'Exporting...' : 'Export Data'}
              </Button>
              
              {exportStatus && (
                <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                  {exportStatus}
                </span>
              )}
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Import Data</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Import financial data from a previously exported file
              </p>
              
              <input
                type="file"
                id="import-file"
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-300 dark:text-gray-400 mb-4"
              />
              
              {importFile && settings.passwordProtected && (
                <Input
                  type="password"
                  label="Password (if data is encrypted)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mb-4"
                  fullWidth
                />
              )}
              
              <Button 
                variant="primary" 
                onClick={handleImportData}
                disabled={importing || !importFile}
              >
                {importing ? 'Importing...' : 'Import Data'}
              </Button>
              
              {importStatus && (
                <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                  {importStatus}
                </span>
              )}
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Reset all data - This action cannot be undone!
              </p>
              
              <Button 
                variant="danger" 
                onClick={handleResetData}
              >
                Reset All Data
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
} 