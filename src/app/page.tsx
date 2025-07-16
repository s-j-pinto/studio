
'use client';

import { useState, useEffect } from 'react';
import { HandHeart } from 'lucide-react';
import { CaregiverView } from '@/components/CaregiverView';
import { ManagerView } from '@/components/ManagerView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CompletedShift, Task } from '@/lib/types';

export default function Home() {
  const [completedShifts, setCompletedShifts] = useState<CompletedShift[]>([]);

  useEffect(() => {
    try {
      const storedShifts = localStorage.getItem('completedShifts');
      if (storedShifts) {
        setCompletedShifts(JSON.parse(storedShifts));
      }
    } catch (error) {
      console.error('Failed to parse shifts from localStorage', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('completedShifts', JSON.stringify(completedShifts));
  }, [completedShifts]);

  const addCompletedShift = (shift: CompletedShift) => {
    setCompletedShifts(prev => [...prev, shift]);
  };

  const updateShiftNotes = (shiftId: string, notes: string) => {
    setCompletedShifts(prev =>
      prev.map(s => (s.id === shiftId ? { ...s, notes } : s))
    );
  };


  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
        <nav className="flex w-full items-center gap-2 text-lg font-medium md:text-base">
          <a
            href="#"
            className="flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <HandHeart className="h-6 w-6 text-accent-foreground" />
            <span>Shift Notes</span>
          </a>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs defaultValue="caregiver" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="caregiver">Caregiver View</TabsTrigger>
            <TabsTrigger value="manager">Manager View</TabsTrigger>
          </TabsList>
          <TabsContent value="caregiver">
            <CaregiverView onShiftComplete={addCompletedShift} />
          </TabsContent>
          <TabsContent value="manager">
            <ManagerView completedShifts={completedShifts} onUpdateNotes={updateShiftNotes} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
