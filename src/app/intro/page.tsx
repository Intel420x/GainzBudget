'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IntroScreen } from '@/components/IntroScreen';

export default function IntroPage() {
  const router = useRouter();
  
  // Handle intro completion
  const handleIntroComplete = () => {
    // Navigate to the dashboard after intro completes
    router.push('/');
  };
  
  return (
    <IntroScreen 
      onComplete={handleIntroComplete}
      skipIntro={false}
    />
  );
}
