'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/Button';

// Define Electron interface
declare global {
  interface Window {
    electron?: {
      send: (channel: string, ...args: any[]) => void;
    };
    quitApp?: () => void;
  }
}

// Define the navigation items
const navItems = [
  { name: 'Dashboard', href: '/', icon: 'home' },
  { name: 'Transactions', href: '/transactions', icon: 'exchange-alt' },
  { name: 'Budget', href: '/budget', icon: 'chart-pie' },
  { name: 'Categories', href: '/categories', icon: 'tags' },
  { name: 'Reports', href: '/reports', icon: 'chart-line' },
  { name: 'Settings', href: '/settings', icon: 'cog' },
  { name: 'About', href: '/about', icon: 'info-circle' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Mobile sidebar */}
        <div className="lg:hidden">
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 flex">
              <div
                className="fixed inset-0 bg-dark-900 bg-opacity-75 transition-opacity"
                onClick={() => setSidebarOpen(false)}
              ></div>
              <div className="relative flex w-full max-w-xs flex-1 flex-col bg-dark-400 dark:bg-dark-500 pt-5 pb-4">
                <div className="flex items-center px-4">
                  <h1 className="text-xl font-bold text-white neon-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>GainzBudget</h1>
                </div>
                <div className="mt-5 h-0 flex-1 overflow-y-auto">
                  <nav className="space-y-1 px-2">
                    {navItems.map(item => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                          pathname === item.href
                            ? 'bg-dark-300 text-primary-400 dark:bg-dark-300 dark:text-primary-400'
                            : 'text-gray-300 hover:bg-dark-300 hover:text-primary-400 dark:text-gray-300 dark:hover:bg-dark-300 dark:hover:text-primary-400'
                        }`}
                      >
                        <span className="mr-3 h-5 w-5 flex-shrink-0 text-primary-500">
                          <i className={`fas fa-${item.icon}`}></i>
                        </span>
                        <span style={{ fontFamily: 'Roboto Mono, monospace' }}>{item.name}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r border-dark-300 bg-dark-400 dark:border-dark-300 dark:bg-dark-500">
            <div className="flex flex-shrink-0 items-center px-4 py-4">
              <h1 className="text-xl font-bold text-white dark:text-white neon-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>GainzBudget</h1>
            </div>
            <div className="mt-5 flex flex-1 flex-col overflow-y-auto">
              <nav className="flex-1 space-y-1 px-2 py-4">
                {navItems.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                      pathname === item.href
                        ? 'bg-dark-300 text-primary-400 dark:bg-dark-300 dark:text-primary-400'
                        : 'text-gray-300 hover:bg-dark-300 hover:text-primary-400 dark:text-gray-300 dark:hover:bg-dark-300 dark:hover:text-primary-400'
                    }`}
                  >
                    <span className="mr-3 h-5 w-5 flex-shrink-0 text-primary-500">
                      <i className={`fas fa-${item.icon}`}></i>
                    </span>
                    <span style={{ fontFamily: 'Roboto Mono, monospace' }}>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
        
        <div className="flex flex-1 flex-col lg:pl-64">
          {/* Top header */}
          <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-dark-300 bg-dark-400 dark:border-dark-300 dark:bg-dark-500">
            <button
              type="button"
              className="border-r border-dark-300 px-4 text-primary-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <i className="fas fa-bars h-6 w-6"></i>
            </button>
            
            <div className="flex flex-1 justify-between px-4">
              <div className="flex flex-1 items-center">
                {/* Only show the title in the header for pages that don't have their own title */}
                {pathname !== '/categories' && pathname !== '/reports' && pathname !== '/about' && (
                  <h2 className="text-xl font-semibold text-white dark:text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {navItems.find(item => item.href === pathname)?.name || 'GainzBudget'}
                  </h2>
                )}
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => {
                    // Show confirmation dialog
                    if (window.confirm('Are you sure you want to quit GainzBudget?')) {
                      console.log('Quitting application...');
                      
                      // Make a direct fetch request to the shutdown endpoint
                      try {
                        // Display a message to the user
                        const quitMessage = document.createElement('div');
                        quitMessage.style.position = 'fixed';
                        quitMessage.style.top = '50%';
                        quitMessage.style.left = '50%';
                        quitMessage.style.transform = 'translate(-50%, -50%)';
                        quitMessage.style.background = 'rgba(0, 0, 0, 0.8)';
                        quitMessage.style.color = '#00ff66';
                        quitMessage.style.padding = '20px';
                        quitMessage.style.borderRadius = '10px';
                        quitMessage.style.zIndex = '9999';
                        quitMessage.style.fontFamily = 'Orbitron, sans-serif';
                        quitMessage.style.boxShadow = '0 0 20px rgba(0, 255, 102, 0.5)';
                        quitMessage.innerHTML = 'Shutting down GainzBudget...';
                        document.body.appendChild(quitMessage);
                        
                        // Send the shutdown request
                        fetch('http://localhost:3099/shutdown', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ action: 'quit' })
                        }).catch(error => {
                          console.error('Error shutting down:', error);
                          // Try window.close as a fallback
                          window.close();
                        });
                      } catch (error) {
                        console.error('Error during shutdown:', error);
                        // Try window.close as a fallback
                        window.close();
                      }
                    }
                  }}
                  className="px-4 py-2 bg-transparent border border-red-500 text-red-400 rounded-md hover:bg-red-900/30 transition-all transform hover:scale-105 focus:outline-none shadow-[0_0_10px_rgba(255,0,0,0.3)] hover:shadow-[0_0_15px_rgba(255,0,0,0.5)]"
                  title="Quit GainzBudget"
                >
                  <i className="fas fa-power-off mr-2"></i>
                  Quit
                </button>
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <main className="flex-1 bg-dark-400 dark:bg-dark-500">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-dark-300 bg-dark-500 py-4 px-6">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-400 text-sm">
                  &copy; {new Date().getFullYear()} GainzBudget by Alexis Soto-Yanez
                </p>
                <p className="text-primary-400 text-sm italic mt-2 md:mt-0">
                  "The art is not in making money, but in keeping it." — Proverb
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}; 