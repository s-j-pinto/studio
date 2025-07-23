
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
  Trash2,
  AlertTriangle,
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
import type { Task, CompletedShift, OnCallCaregiver } from '@/lib/types';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { deleteAllShifts } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";

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
  onCallCaregivers: OnCallCaregiver[];
  onShiftsCleared: () => void;
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

export function ManagerView({ completedShifts, onUpdateNotes, onCallCaregivers, onShiftsCleared }: ManagerViewProps) {
  const [editingShift, setEditingShift] = useState<CompletedShift | null>(null);
  const [editedNotes, setEditedNotes] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string>("all");
  const pastWeeks = generatePastWeeks(12);
  const [selectedWeek, setSelectedWeek] = useState(pastWeeks[0]);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();
  console.log('onCallCaregivers data:', onCallCaregivers)
  
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
    let filteredShifts = completedShifts;

    if (selectedClientId && selectedClientId !== 'all') {
      filteredShifts = filteredShifts.filter(shift => shift.client.id === selectedClientId);
    }
    
    if (selectedCaregiverId !== 'all') {
        const selectedCaregiver = Array.isArray(onCallCaregivers) ? onCallCaregivers.find(c => c.EmployeeID.toString() === selectedCaregiverId) : undefined;
        if (selectedCaregiver) {
          const caregiverFullName = `${selectedCaregiver.FirstName} ${selectedCaregiver.LastName}`;
          filteredShifts = filteredShifts.filter(shift => shift.caregiverName === caregiverFullName);
        }
      }

    return filteredShifts
        .filter(shift => 
            isWithinInterval(new Date(shift.startTime), { start: startOfDay(selectedWeek.start), end: endOfWeek(selectedWeek.end) })
        )
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };
  
  const clientShifts = getWeeklyShiftsForClient();
  const weekDates = Array.from(new Set(clientShifts.map(s => startOfDay(new Date(s.startTime)).getTime())))
      .map(t => new Date(t))
      .sort((a,b) => a.getTime() - b.getTime());

  const handleExportPDF = () => {
    if (clientShifts.length === 0) return;

    const client = selectedClientId !== 'all' ? clients.find(c => c.id === selectedClientId) : null;
    const caregiver = (selectedCaregiverId !== 'all' && Array.isArray(onCallCaregivers)) ? onCallCaregivers.find(c => c.EmployeeID.toString() === selectedCaregiverId) : null;

    const doc = new jsPDF();
    
    let reportTitle = 'Weekly Shift Report';
    if(client) reportTitle += ` for ${client.name}`;
    if(caregiver) reportTitle += ` by ${caregiver.FirstName} ${caregiver.LastName}`;


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
            finalY += splitNotes.length * 5 + 7; // Adjust Y for next note
        }
    });

    // Save the PDF
    doc.save(`Shift-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
        await deleteAllShifts();
        toast({
            title: "Success",
            description: "All shift data has been cleared.",
        });
        onShiftsCleared();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to clear shift data.",
        });
    } finally {
        setIsClearing(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto grid gap-8">
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle>Weekly Shift History</CardTitle>
                <CardDescription>Select a caregiver, client, and week to view shift summary.</CardDescription>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All Data
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>
                        <AlertTriangle className="inline-block mr-2 text-destructive" /> Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all
                        shift data from the database.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllData} disabled={isClearing}>
                        {isClearing ? "Clearing..." : "Yes, delete everything"}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="caregiver-select">Caregiver</Label>
                      <Select onValueChange={setSelectedCaregiverId} value={selectedCaregiverId}>
                      <SelectTrigger id="caregiver-select">
                          <SelectValue placeholder="All Caregivers" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">All Caregivers</SelectItem>
                          {Array.isArray(onCallCaregivers) && onCallCaregivers.map((c) => (
                            <SelectItem key={c.EmployeeID} value={c.EmployeeID.toString()}>
                              {c.EmployeeID}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="client-select">Client</Label>
                      <Select onValueChange={setSelectedClientId} value={selectedClientId}>
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
