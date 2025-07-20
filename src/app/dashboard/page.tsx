
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HandHeart, LogOut } from 'lucide-react';
import { CaregiverView } from '@/components/CaregiverView';
import { ManagerView } from '@/components/ManagerView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { CompletedShift } from '@/lib/types';
import { addShift, getShifts, updateShiftNotes as updateShiftNotesAction } from '@/lib/actions';

export default function DashboardPage() {
  const [completedShifts, setCompletedShifts] = useState<CompletedShift[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [caregiverName, setCaregiverName] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    setIsClient(true);
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated !== 'true') {
      router.replace('/');
      return;
    }
    try {
        const caregiverInfo = localStorage.getItem('caregiverInfo');
        if (caregiverInfo) {
            const parsedInfo = JSON.parse(caregiverInfo);
            setCaregiverName(parsedInfo.MyName || null);
            setCompanyName(parsedInfo.CompanyName || null);
        }
    } catch (error) {
        console.error('Failed to parse caregiver info from localStorage', error);
    }
  }, [router]);

  const fetchShifts = async () => {
    const shifts = await getShifts();
    setCompletedShifts(shifts);
  };

  useEffect(() => {
    if (isClient) {
      fetchShifts();
    }
  }, [isClient]);
  

  const addCompletedShift = async (shift: Omit<CompletedShift, 'id'>) => {
    await addShift(shift);
    await fetchShifts();
  };

  const updateShiftNotes = async (shiftId: string, notes: string) => {
    await updateShiftNotesAction(shiftId, notes);
    await fetchShifts();
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('caregiverInfo');
    // We don't remove completedShifts from localStorage anymore as it's not the source of truth
    router.replace('/');
  };

  if (!isClient) {
    // Render nothing or a loading spinner on the server to avoid flash of unauthenticated content
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
          <nav className="flex items-center gap-2 text-lg font-medium md:text-base">
            <a
              href="#"
              className="flex items-center gap-2 text-lg font-semibold text-foreground"
            >
              <HandHeart className="h-6 w-6" />
              <span>Shift Notes</span>
            </a>
          </nav>
          <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Logout</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Tabs defaultValue="caregiver" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
              <TabsTrigger value="caregiver">Caregiver View</TabsTrigger>
              <TabsTrigger value="manager">Manager View</TabsTrigger>
            </TabsList>
            <TabsContent value="caregiver">
              <CaregiverView caregiverName={caregiverName} companyName={companyName} onShiftComplete={addCompletedShift} />
            </TabsContent>
            <TabsContent value="manager">
              <ManagerView completedShifts={completedShifts} onUpdateNotes={updateShiftNotes} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  );
}
