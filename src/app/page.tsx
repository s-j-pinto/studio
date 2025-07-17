
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { HandHeart } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleLogin = () => {
    setIsLoading(true);
    // In a real application, this would involve redirecting to
    // Teletrack and handling the callback.
    // For this prototype, we'll simulate a successful login.
    localStorage.setItem('isAuthenticated', 'true');
    router.replace('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
            <div
                className="flex items-center gap-2 text-lg font-semibold text-foreground"
            >
                <HandHeart className="h-6 w-6" />
                <span>Shift Notes</span>
            </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Caregiver Login</CardTitle>
            <CardDescription>
              Login using your Teletrack from Spectrum account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
                {isLoading ? 'Redirecting...' : 'Login with Teletrack'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
