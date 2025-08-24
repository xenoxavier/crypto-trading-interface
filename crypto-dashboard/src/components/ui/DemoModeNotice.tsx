'use client';

import React, { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useAuth } from '@/components/providers/FirebaseAuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Info, 
  X, 
  LogIn, 
  Save,
  Users,
  Crown
} from 'lucide-react';

export function DemoModeNotice() {
  const { data: session } = useSession();
  const { user: firebaseUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Only show for demo users (not authenticated)
  if (session || firebaseUser || dismissed) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700">
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🚀 You're in Demo Mode - Using Free AI Models
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
              Your portfolio data is <strong>temporarily stored</strong> in your browser. 
              AI signals use <strong>Microsoft Phi-3 (free model)</strong> with daily limits. 
              Sign in and add your OpenRouter API key for premium AI models and permanent storage.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="sm" 
                onClick={() => signIn('google')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In for Full Access
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => signIn('google')}
                className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
              >
                <Users className="h-4 w-4 mr-2" />
                Join Community
              </Button>
            </div>
            <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 flex items-center">
              <Crown className="h-3 w-3 mr-1" />
              <span>Get free OpenRouter API key for AI signals - no credit card needed!</span>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}