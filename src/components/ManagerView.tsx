
'use client';

import { useState } from 'react';
import {
  Accessibility,
  Check,
  Edit,
  Pill,
  ShowerHead,
  Sparkles,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { format, startOfWeek, isWithinInterval, isEqual, startOfDay } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const initialTasks: Omit<Task, 'completed'>[] = [
  { id: 1, text: 'Medication Reminder', icon: Pill },
  { id: 2, text: 'Meal Preparation', icon: UtensilsCrossed },
  { id: 3, text: 'Personal Care', icon: ShowerHead },
  { id: 4, text: 'Light Housekeeping', icon: Sparkles },
  { id: 5, text: 'Companionship', icon: Users },
  { id: 6, text: 'Mobility Assistance', icon: Accessibility },
];

const clients = [
    { id: '1', name: 'Eleanor Vance' },
    { id: '2', name: 'Arthur Pendelton' },
    { id: '3', name: 'Beatrice Miller' },
];

interface ManagerViewProps {
  completedShifts: CompletedShift[];
  onUpdateNotes: (shiftId: string, notes: string) => void;
}

export function ManagerView({ completedShifts, onUpdateNotes }: ManagerViewProps) {
  const [editingShift, setEditingShift] = useState<CompletedShift | null>(null);
  const [editedNotes, setEditedNotes] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

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

  const getWeeklyShiftsForClient = () => {
    if (!selectedClientId) return [];
    
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return completedShifts
        .filter(shift => 
            shift.client.id === selectedClientId &&
            isWithinInterval(new Date(shift.startTime), { start: weekStart, end: weekEnd })
        )
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };
  
  const clientShifts = getWeeklyShiftsForClient();
  const weekDates = Array.from(new Set(clientShifts.map(s => startOfDay(new Date(s.startTime)).getTime())))
      .map(t => new Date(t))
      .sort((a,b) => a.getTime() - b.getTime());


  return (
    <div className="w-full max-w-4xl mx-auto grid gap-8">
        <Card>
            <CardHeader>
              <div>
                <CardTitle>Weekly Shift History</CardTitle>
                <CardDescription>Select a client to view their shift summary for the week.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid gap-2 max-w-sm">
                    <Label htmlFor="client-select">Client</Label>
                    <Select onValueChange={setSelectedClientId} value={selectedClientId ?? undefined}>
                      <SelectTrigger id="client-select">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                
                {selectedClientId ? (
                  clientShifts.length > 0 ? (
                    <div>
                      <TooltipProvider>
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead className="w-[200px]">Task</TableHead>
                                      {weekDates.map(date => (
                                          <TableHead key={date.toISOString()} className="text-center">
                                              {format(date, 'eee, dd')}
                                          </TableHead>
                                      ))}
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {initialTasks.map(task => (
                                      <TableRow key={task.id}>
                                          <TableCell className="font-medium">{task.text}</TableCell>
                                          {weekDates.map(date => {
                                              const shiftOnDate = clientShifts.find(s => isEqual(startOfDay(new Date(s.startTime)), date));
                                              if (!shiftOnDate) {
                                                return <TableCell key={date.toISOString()} className="text-center"></TableCell>;
                                              }
                                              const isCompleted = shiftOnDate.completedTasks.some(ct => ct.id === task.id);
                                              return (
                                                  <TableCell key={date.toISOString()} className="text-center">
                                                      {isCompleted && <Check className="h-5 w-5 mx-auto text-green-500" />}
                                                  </TableCell>
                                              )
                                          })}
                                      </TableRow>
                                  ))}
                                  <TableRow>
                                      <TableCell className="font-medium">Start Time</TableCell>
                                      {weekDates.map(date => {
                                          const shiftOnDate = clientShifts.find(s => isEqual(startOfDay(new Date(s.startTime)), date));
                                          return (
                                              <TableCell key={date.toISOString()} className="text-center text-xs text-muted-foreground">
                                                  {shiftOnDate ? format(new Date(shiftOnDate.startTime), 'p') : '-'}
                                              </TableCell>
                                          )
                                      })}
                                  </TableRow>
                                   <TableRow>
                                      <TableCell className="font-medium">Actions</TableCell>
                                       {weekDates.map(date => {
                                          const shiftOnDate = clientShifts.find(s => isEqual(startOfDay(new Date(s.startTime)), date));
                                          return (
                                              <TableCell key={date.toISOString()} className="text-center">
                                                  {shiftOnDate ? (
                                                      <Tooltip>
                                                          <TooltipTrigger asChild>
                                                              <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(shiftOnDate)}>
                                                                  <Edit className="h-4 w-4" />
                                                              </Button>
                                                          </TooltipTrigger>
                                                          <TooltipContent>
                                                              <p>Edit Notes</p>
                                                          </TooltipContent>
                                                      </Tooltip>
                                                  ): null}
                                              </TableCell>
                                          )
                                      })}
                                  </TableRow>
                              </TableBody>
                          </Table>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center">No shifts recorded for this client this week.</p>
                  )
                ) : (
                    <p className="text-muted-foreground text-center">Please select a client to see their weekly shift history.</p>
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
