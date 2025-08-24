'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/components/providers/FirebaseAuthProvider';
import { getUserInfo, getUserId } from '@/lib/user-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function UserDataDebug() {
  const { data: session } = useSession();
  const { user: firebaseUser } = useAuth();
  
  const userInfo = getUserInfo(firebaseUser, session?.user || null);
  const userId = getUserId(firebaseUser, session?.user || null);
  
  const [localStorageData, setLocalStorageData] = React.useState<Record<string, any>>({});

  const scanLocalStorage = () => {
    const data: Record<string, any> = {};
    
    // Get all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            // Try to parse JSON, otherwise store as string
            try {
              data[key] = JSON.parse(value);
            } catch {
              data[key] = value;
            }
          }
        } catch (error) {
          data[key] = 'Error reading value';
        }
      }
    }
    
    setLocalStorageData(data);
  };

  const clearUserData = () => {
    if (confirm('This will clear ALL localStorage data. Are you sure?')) {
      localStorage.clear();
      alert('All localStorage data cleared!');
      scanLocalStorage();
    }
  };

  const clearCurrentUserData = () => {
    if (confirm(`This will clear data for user: ${userId}. Are you sure?`)) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.endsWith(`_${userId}`)) {
          localStorage.removeItem(key);
        }
      });
      alert(`Data cleared for user: ${userId}`);
      scanLocalStorage();
    }
  };

  React.useEffect(() => {
    scanLocalStorage();
  }, []);

  // Filter keys that belong to current user
  const currentUserKeys = Object.keys(localStorageData).filter(key => 
    key.endsWith(`_${userId}`)
  );
  
  // Filter keys that belong to other users
  const otherUserKeys = Object.keys(localStorageData).filter(key => 
    key.includes('_firebase_') || key.includes('_nextauth_') || key.includes('_email_') || key.includes('_demo_')
  ).filter(key => !key.endsWith(`_${userId}`));

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 max-h-96 overflow-auto">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            User Data Debug
            <Button variant="outline" size="sm" onClick={scanLocalStorage}>
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-4">
          {/* Current User Info */}
          <div>
            <h4 className="font-medium mb-2">Current User:</h4>
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
              <div><strong>ID:</strong> {userId}</div>
              <div><strong>Name:</strong> {userInfo.name}</div>
              <div><strong>Email:</strong> {userInfo.email}</div>
              <div><strong>Provider:</strong> {userInfo.provider}</div>
            </div>
          </div>

          {/* Current User Data */}
          <div>
            <h4 className="font-medium mb-2">Your Data ({currentUserKeys.length} items):</h4>
            <div className="space-y-1 max-h-32 overflow-auto">
              {currentUserKeys.length > 0 ? (
                currentUserKeys.map(key => (
                  <div key={key} className="bg-blue-50 dark:bg-blue-900/20 p-1 rounded text-xs">
                    <div className="font-mono">{key.replace(`_${userId}`, '')}</div>
                    <div className="text-gray-600 dark:text-gray-400 truncate">
                      {typeof localStorageData[key] === 'object' 
                        ? `${Object.keys(localStorageData[key]).length} properties`
                        : String(localStorageData[key]).substring(0, 50)
                      }
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No data found for current user</div>
              )}
            </div>
          </div>

          {/* Other Users Data */}
          {otherUserKeys.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Other Users ({otherUserKeys.length} items):</h4>
              <div className="space-y-1 max-h-24 overflow-auto">
                {otherUserKeys.map(key => (
                  <div key={key} className="bg-yellow-50 dark:bg-yellow-900/20 p-1 rounded text-xs">
                    <div className="font-mono truncate">{key}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Global Data */}
          <div>
            <h4 className="font-medium mb-2">Global Data:</h4>
            <div className="space-y-1 max-h-24 overflow-auto">
              {Object.keys(localStorageData)
                .filter(key => !key.includes('_firebase_') && !key.includes('_nextauth_') && !key.includes('_email_') && !key.includes('_demo_'))
                .map(key => (
                  <div key={key} className="bg-gray-50 dark:bg-gray-700 p-1 rounded text-xs">
                    <div className="font-mono truncate">{key}</div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearCurrentUserData}
              className="w-full text-xs"
            >
              Clear My Data
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={clearUserData}
              className="w-full text-xs"
            >
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}