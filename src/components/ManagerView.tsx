
'use client';

import { useState } from 'react';
import {
  Accessibility,
  Check,
  Circle,
  Edit,
  Pill,
  ShowerHead,
  Sparkles,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { format, formatDistanceStrict, startOfWeek, isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { Task, CompletedShift } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const initialTasks: Omit<Task, 'completed'>[] = [
  { id: 1, text: 'Medication Reminder', icon: Pill },
  { id: 2, text: 'Meal Preparation', icon: UtensilsCrossed },
  { id: 3, text: 'Personal Care', icon: ShowerHead },
  { id: 4, text: 'Light Housekeeping', icon: Sparkles },
  { id: 5, text: 'Companionship', icon: Users },
  { id: 6, text: 'Mobility Assistance', icon: Accessibility },
];

interface ManagerViewProps {
  completedShifts: CompletedShift[];
  onUpdateNotes: (shiftId: string, notes: string) => void;
}

export function ManagerView({ completedShifts, onUpdateNotes }: ManagerViewProps) {
  const [editingShift, setEditingShift] = useState<CompletedShift | null>(null);
  const [editedNotes, setEditedNotes] = useState('');

  const handleOpenEditDialog = (shift: CompletedShift) => {
    setEditingShift(shift);
    setEditedNotes(shift.notes);
  };

  const handleSaveNotes = () => {
    if (!editingShift) return;
    onUpdateNotes(editingShift.id, editedNotes);
    setEditingShift(null);
    setEditedNotes('');
  };

  const getWeeklyShiftsByClient = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weeklyShifts = completedShifts.filter(shift => 
        isWithinInterval(new Date(shift.startTime), { start: weekStart, end: weekEnd })
    ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return weeklyShifts.reduce((acc, shift) => {
        const clientName = shift.client.name;
        if (!acc[clientName]) {
            acc[clientName] = [];
        }
        acc[clientName].push(shift);
        return acc;
    }, {} as Record<string, CompletedShift[]>);
  };
  
  const weeklyShiftsByClient = getWeeklyShiftsByClient();

  return (
    <div className="w-full max-w-4xl mx-auto grid gap-8">
        <Card>
            <CardHeader>
              <CardTitle>Weekly Shift History</CardTitle>
              <CardDescription>A summary of all shifts recorded this week, grouped by client.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {Object.keys(weeklyShiftsByClient).length > 0 ? (
                    Object.entries(weeklyShiftsByClient).map(([clientName, shifts]) => (
                        <div key={clientName}>
                            <h3 className="text-lg font-semibold mb-4">{clientName}</h3>
                             <TooltipProvider>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Duration</TableHead>
                                            {initialTasks.map(task => (
                                                <TableHead key={task.id} className="text-center">
                                                     {task.text}
                                                </TableHead>
                                            ))}
                                            <TableHead className="w-[100px] text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shifts.map(shift => (
                                            <TableRow key={shift.id}>
                                                <TableCell>{format(new Date(shift.startTime), 'eee, PP')}</TableCell>
                                                <TableCell>{formatDistanceStrict(new Date(shift.endTime), new Date(shift.startTime))}</TableCell>
                                                {initialTasks.map(task => {
                                                    const isCompleted = shift.completedTasks.some(ct => ct.id === task.id);
                                                    return (
                                                        <TableCell key={task.id} className="text-center">
                                                            {isCompleted ? <Check className="h-5 w-5 mx-auto text-green-500" /> : <Circle className="h-5 w-5 mx-auto text-muted-foreground/50" />}
                                                        </TableCell>
                                                    )
                                                })}
                                                <TableCell className="text-center">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(shift)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Edit Notes</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </TooltipProvider>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground text-center">No shifts recorded this week.</p>
                )}
            </CardContent>
        </Card>

      <Dialog open={!!editingShift} onOpenChange={(isOpen) => !isOpen && setEditingShift(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shift Notes</DialogTitle>
            <DialogDescription>
              Update the notes for the shift with {editingShift?.client.name} on {editingShift && format(new Date(editingShift.startTime), 'PP')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              rows={6}
              placeholder="Add your notes here..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingShift(null)}>Cancel</Button>
            <Button onClick={handleSaveNotes}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

