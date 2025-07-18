
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { HandHeart } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  pin: z.string().min(4, { message: '4 digit Pin is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      pin: '',
    },
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);

    const apiPayload = {
      email: data.email,
      pin: data.pin,
    };
    console.log('apiPayload', apiPayload);

    try {
      const response = await fetch('https://gps.spectrumvoice.com/api/caregiver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed. Please check your credentials.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Response was not JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const loginData = await response.json();
      console.log('loginData', loginData);

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('caregiverInfo', JSON.stringify(loginData));
      router.replace('/dashboard');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
        toast({
            variant: "destructive",
            title: "Login Error",
            description: errorMessage,
        })
    } finally {
      setIsLoading(false);
    }
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pin</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login with Teletrack'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
