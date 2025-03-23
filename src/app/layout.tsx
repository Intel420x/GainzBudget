import React from 'react';
import '@/styles/globals.css';

export const metadata = {
  title: 'GainzBudget - Futuristic Financial Tracking',
  description: 'A privacy-focused futuristic budgeting application that runs entirely locally',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Roboto+Mono:wght@300;400;500&display=swap"
        />
        <script src="/preload.js" defer></script>
      </head>
      <body className="min-h-screen bg-dark-500">
        {children}
      </body>
    </html>
  );
} 