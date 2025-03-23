'use client';

import React from 'react';
import { Layout } from '@/components/Layout';

export default function AboutPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6 neon-text" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px #00ff66, 0 0 20px #00ff66' }}>
          About GainzBudget
        </h1>
        
        <div className="bg-dark-300 rounded-lg p-6 mb-8 border border-primary-500/30 shadow-lg">
          <h2 className="text-2xl font-bold text-primary-400 mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Your Financial Future, Secured
          </h2>
          <p className="text-gray-200 mb-4" style={{ fontFamily: 'Roboto Mono, monospace' }}>
            GainzBudget is a privacy-focused financial tracking application designed to help you manage your finances without compromising your data. Unlike cloud-based solutions, all your financial information stays securely on your device.
          </p>
          <p className="text-gray-200 mb-4" style={{ fontFamily: 'Roboto Mono, monospace' }}>
            Built with modern technology and a futuristic interface, GainzBudget provides powerful tools for tracking transactions, managing budgets, and visualizing your financial progress.
          </p>
          <div className="text-primary-400 italic mt-6" style={{ fontFamily: 'Roboto Mono, monospace' }}>
            "An investment in knowledge pays the best interest." - Benjamin Franklin
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-dark-300 rounded-lg p-6 border border-primary-500/30 shadow-lg">
            <h2 className="text-xl font-bold text-primary-400 mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <i className="fas fa-shield-alt mr-2"></i> Privacy Focused
            </h2>
            <p className="text-gray-200" style={{ fontFamily: 'Roboto Mono, monospace' }}>
              Your data never leaves your device. No servers, no tracking, just privacy. Take control of your financial information without worrying about data breaches or third-party access.
            </p>
          </div>
          
          <div className="bg-dark-300 rounded-lg p-6 border border-primary-500/30 shadow-lg">
            <h2 className="text-xl font-bold text-primary-400 mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <i className="fas fa-chart-line mr-2"></i> Powerful Analytics
            </h2>
            <p className="text-gray-200" style={{ fontFamily: 'Roboto Mono, monospace' }}>
              Visualize your spending patterns, track your budget progress, and gain insights into your financial habits with interactive charts and detailed reports.
            </p>
          </div>
          
          <div className="bg-dark-300 rounded-lg p-6 border border-primary-500/30 shadow-lg">
            <h2 className="text-xl font-bold text-primary-400 mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <i className="fas fa-laptop-code mr-2"></i> Modern Technology
            </h2>
            <p className="text-gray-200" style={{ fontFamily: 'Roboto Mono, monospace' }}>
              Built with Next.js, Electron, and Three.js for a responsive, immersive experience. The futuristic interface makes financial management engaging and intuitive.
            </p>
          </div>
          
          <div className="bg-dark-300 rounded-lg p-6 border border-primary-500/30 shadow-lg">
            <h2 className="text-xl font-bold text-primary-400 mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <i className="fas fa-rocket mr-2"></i> Always Evolving
            </h2>
            <p className="text-gray-200" style={{ fontFamily: 'Roboto Mono, monospace' }}>
              GainzBudget is continuously improving with new features and optimizations. Your financial companion is designed to grow alongside your financial journey.
            </p>
          </div>
        </div>
        
        <div className="text-center mt-12 mb-8">
          <p className="text-gray-400" style={{ fontFamily: 'Roboto Mono, monospace' }}>
            GainzBudget © 2025 | Version 1.0.0
          </p>
        </div>
      </div>
    </Layout>
  );
}
