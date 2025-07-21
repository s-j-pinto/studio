
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

const Logo = () => (
    <svg width="150" height="40" viewBox="0 0 250 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="M26.2,42.2C15.9,37.3,7,28.2,0,16.1c3.1,13.2,9.9,25.4,19.8,32.9c-2.3-3.1-4.2-6.5-5.8-10.1 C18.3,28.2,22.9,19.2,29.3,13c-2.7,4.8-4.3,10.2-4.5,15.8c6.9-5.1,12-12.2,14.8-20.7c-1.8,11.8-8.3,22.3-17.7,28.1 c13.4-3,24.3-13.8,28.3-27.1C44.7,23.1,36.5,35,26.2,42.2z" fill="#93C572"/>
      </g>
      <text x="75" y="32" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold">
        <tspan fill="#006A3A">First</tspan>
        <tspan fill="#FDB913">Light</tspan>
      </text>
      <line x1="75" y1="38" x2="225" y2="38" stroke="#006A3A" strokeWidth="1.5" />
      <text x="130" y="52" fontFamily="Arial, sans-serif" fontSize="12" fill="#869C7E">
        HOME CARE
      </text>
      <text x="228" y="24" fontFamily="Arial, sans-serif" fontSize="10" fill="#000">®</text>
    </svg>
  );

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
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="flex items-center gap-2 text-lg font-semibold text-foreground"
            >
              <HandHeart className="h-6 w-6" />
              <span>Shift Notes</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Logo />
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
          </div>
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
