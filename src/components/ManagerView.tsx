
'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Accessibility,
  Check,
  Edit,
  Pill,
  ShowerHead,
  Sparkles,
  Users,
  UtensilsCrossed,
  FileDown,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval, isEqual, startOfDay, subWeeks } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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

const generatePastWeeks = (count: number) => {
    const today = new Date();
    const weeks = [];
    for (let i = 0; i < count; i++) {
        const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
        weeks.push({
            start: weekStart,
            end: weekEnd,
            label: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
        });
    }
    return weeks;
}

export function ManagerView({ completedShifts, onUpdateNotes }: ManagerViewProps) {
  const [editingShift, setEditingShift] = useState<CompletedShift | null>(null);
  const [editedNotes, setEditedNotes] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedCaregiverName, setSelectedCaregiverName] = useState<string | null>(null);
  const pastWeeks = generatePastWeeks(12);
  const [selectedWeek, setSelectedWeek] = useState(pastWeeks[0]);

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

  const caregivers = Array.from(new Set(completedShifts.map(shift => shift.caregiverName).filter(Boolean)));

  const getWeeklyShiftsForClient = () => {
    let filteredShifts = completedShifts;

    if (selectedClientId) {
      filteredShifts = filteredShifts.filter(shift => shift.client.id === selectedClientId);
    }
    
    if (selectedCaregiverName) {
      filteredShifts = filteredShifts.filter(shift => shift.caregiverName === selectedCaregiverName);
    }

    return filteredShifts
        .filter(shift => 
            isWithinInterval(new Date(shift.startTime), { start: selectedWeek.start, end: selectedWeek.end })
        )
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };
  
  const clientShifts = getWeeklyShiftsForClient();
  const weekDates = Array.from(new Set(clientShifts.map(s => startOfDay(new Date(s.startTime)).getTime())))
      .map(t => new Date(t))
      .sort((a,b) => a.getTime() - b.getTime());

  const handleExportPDF = () => {
    if (clientShifts.length === 0) return;

    const client = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;
    const caregiver = selectedCaregiverName;

    const doc = new jsPDF();
    
    let reportTitle = 'Weekly Shift Report';
    if(client) reportTitle += ` for ${client.name}`;
    if(caregiver) reportTitle += ` by ${caregiver}`;


    // Add title
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Week: ${selectedWeek.label}`, 14, 30);

    // Prepare table data
    const tableHead = [['Task', ...weekDates.map(d => format(d, 'eee, dd'))]];
    const tableBody = initialTasks.map(task => {
        const row = [task.text];
        weekDates.forEach(date => {
            const shiftOnDate = clientShifts.find(s => isEqual(startOfDay(new Date(s.startTime)), date));
            const isCompleted = shiftOnDate ? shiftOnDate.completedTasks.some(ct => ct.id === task.id) : false;
            row.push(isCompleted ? 'Yes' : '');
        });
        return row;
    });

    // Add table to PDF
    (doc as any).autoTable({
        startY: 35,
        head: tableHead,
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [38, 43, 61] }
    });
    
    // Add notes section
    let finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(14);
    doc.text('Shift Notes', 14, finalY + 15);
    
    clientShifts.forEach(shift => {
        if (shift.notes) {
            finalY += 10;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`${format(new Date(shift.startTime), 'eeee, PPP')}:`, 15, finalY);
            doc.setFont('helvetica', 'normal');
            const splitNotes = doc.splitTextToSize(shift.notes, 180);
            doc.text(splitNotes, 15, finalY + 7);
            finalY += splitNotes.length * 5; // Adjust Y for next note
        }
    });

    // Save the PDF
    doc.save(`Shift-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto grid gap-8">
        <Card>
            <CardHeader>
              <div>
                <CardTitle>Weekly Shift History</CardTitle>
                <CardDescription>Select a caregiver, client, and week to view shift summary.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="caregiver-select">Caregiver</Label>
                      <Select onValueChange={setSelectedCaregiverName} value={selectedCaregiverName ?? undefined}>
                        <SelectTrigger id="caregiver-select">
                          <SelectValue placeholder="All Caregivers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Caregivers</SelectItem>
                          {caregivers.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="client-select">Client</Label>
                      <Select onValueChange={setSelectedClientId} value={selectedClientId ?? undefined}>
                        <SelectTrigger id="client-select">
                          <SelectValue placeholder="All Clients" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Clients</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                   <div className="grid gap-2">
                      <Label htmlFor="week-select">Week</Label>
                      <Select 
                        value={selectedWeek.label}
                        onValueChange={(value) => {
                            const week = pastWeeks.find(w => w.label === value);
                            if (week) setSelectedWeek(week);
                        }}
                      >
                        <SelectTrigger id="week-select">
                          <SelectValue placeholder="Select a week" />
                        </SelectTrigger>
                        <SelectContent>
                          {pastWeeks.map((week) => (
                            <SelectItem key={week.label} value={week.label}>
                              {week.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                </div>
                
                {clientShifts.length > 0 ? (
                  <div>
                    <TooltipProvider>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Task</TableHead>
                                    {weekDates.map(date => (
                                        <TableHead key={format(date, 'yyyy-MM-dd')} className="text-center">
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
                                              return <TableCell key={format(date, 'yyyy-MM-dd')} className="text-center"></TableCell>;
                                            }
                                            const isCompleted = shiftOnDate.completedTasks.some(ct => ct.id === task.id);
                                            return (
                                                <TableCell key={format(date, 'yyyy-MM-dd')} className="text-center">
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
                                            <TableCell key={format(date, 'yyyy-MM-dd')} className="text-center text-xs text-muted-foreground">
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
                                            <TableCell key={format(date, 'yyyy-MM-dd')} className="text-center">
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
                  <p className="text-muted-foreground text-center py-8">No shifts recorded for the selected criteria.</p>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleExportPDF} disabled={clientShifts.length === 0}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export PDF Report
                </Button>
            </CardFooter>
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

    

    