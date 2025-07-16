
'use client';

import { useState, useEffect } from 'react';
import {
  Accessibility,
  Check,
  CheckCircle2,
  Circle,
  Clock,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { Task } from '@/components/TaskItem';
import { TaskItem } from '@/components/TaskItem';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const clients = [
    { id: '1', name: 'Eleanor Vance' },
    { id: '2', name: 'Arthur Pendelton' },
    { id: '3', name: 'Beatrice Miller' },
];

interface CompletedShift {
  id: string;
  client: { id: string; name: string };
  startTime: string;
  endTime: string;
  completedTasks: Task[];
  incompleteTasks: Task[];
  notes: string;
}

export function ShiftManager() {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(null);
  const [shiftEndTime, setShiftEndTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeShiftClient, setActiveShiftClient] = useState<{ id: string; name: string; } | null>(null);
  const [completedShifts, setCompletedShifts] = useState<CompletedShift[]>([]);
  const [viewingSummary, setViewingSummary] = useState(false);
  const [editingShift, setEditingShift] = useState<CompletedShift | null>(null);
  const [editedNotes, setEditedNotes] = useState('');
  
  useEffect(() => {
    try {
        const storedShifts = localStorage.getItem('completedShifts');
        if (storedShifts) {
            setCompletedShifts(JSON.parse(storedShifts));
        }
    } catch (error) {
        console.error("Failed to parse shifts from localStorage", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('completedShifts', JSON.stringify(completedShifts));
  }, [completedShifts]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isShiftActive && shiftStartTime) {
      intervalId = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - shiftStartTime.getTime();
        const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
        const m = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const s = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
        setElapsedTime(`${h}:${m}:${s}`);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isShiftActive, shiftStartTime]);

  const handleStartShift = () => {
    if (!selectedClientId) return;
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    setIsShiftActive(true);
    setShiftStartTime(new Date());
    setShiftEndTime(null);
    setActiveShiftClient(client);
    setTasks(initialTasks.map((task) => ({ ...task, completed: false })));
    setNotes('');
    setViewingSummary(false);
  };

  const handleEndShift = () => {
    const endTime = new Date();
    setShiftEndTime(endTime);
    setIsShiftActive(false);

    if (shiftStartTime && activeShiftClient) {
        const newShift: CompletedShift = {
            id: new Date().toISOString(),
            client: activeShiftClient,
            startTime: shiftStartTime.toISOString(),
            endTime: endTime.toISOString(),
            completedTasks: tasks.filter(t => t.completed),
            incompleteTasks: tasks.filter(t => !t.completed),
            notes,
        };
        setCompletedShifts(prev => [...prev, newShift]);
    }
    setViewingSummary(true);
  };

  const handleStartNewShift = () => {
    setShiftStartTime(null);
    setShiftEndTime(null);
    setElapsedTime('00:00:00');
    setSelectedClientId(null);
    setActiveShiftClient(null);
    setIsShiftActive(false);
    setViewingSummary(false);
  };
  
  const handleToggleTask = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleOpenEditDialog = (shift: CompletedShift) => {
    setEditingShift(shift);
    setEditedNotes(shift.notes);
  };

  const handleSaveNotes = () => {
    if (!editingShift) return;
    const updatedShifts = completedShifts.map(s => 
      s.id === editingShift.id ? { ...s, notes: editedNotes } : s
    );
    setCompletedShifts(updatedShifts);
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

  if (viewingSummary && shiftStartTime && shiftEndTime) {
    const completedTasks = tasks.filter((task) => task.completed);
    const incompleteTasks = tasks.filter((task) => !task.completed);
    
    return (
      <div className="w-full max-w-4xl mx-auto grid gap-8">
        <Card className="animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardTitle className="text-2xl">Shift Summary</CardTitle>
            <CardDescription>
              Report for {activeShiftClient?.name} on {format(shiftStartTime, 'PPP')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Start Time</span>
                <span className="font-semibold">{format(shiftStartTime, 'p')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">End Time</span>
                <span className="font-semibold">{format(shiftEndTime, 'p')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Total Duration</span>
                <span className="font-semibold">{formatDistanceStrict(shiftEndTime, shiftStartTime)}</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Completed Tasks ({completedTasks.length})</h3>
              <ul className="space-y-2">
                {completedTasks.map(task => (
                  <li key={task.id} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{task.text}</span>
                  </li>
                ))}
                 {completedTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks were completed.</p>}
              </ul>
            </div>
            {incompleteTasks.length > 0 && (
               <div>
                  <h3 className="font-semibold mb-2">Incomplete Tasks ({incompleteTasks.length})</h3>
                  <ul className="space-y-2">
                    {incompleteTasks.map(task => (
                      <li key={task.id} className="flex items-center gap-2 text-muted-foreground">
                        <Circle className="h-4 w-4 text-gray-400" />
                        <span>{task.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
            )}
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">{notes || 'No notes were added.'}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleStartNewShift}>Start New Shift</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto grid gap-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Shift Status</CardTitle>
            {isShiftActive && <Badge variant="secondary" className="flex items-center gap-2"><Clock className="h-4 w-4" />{elapsedTime}</Badge>}
          </div>
           <CardDescription>
            {isShiftActive && shiftStartTime ? `Shift for ${activeShiftClient?.name} started at ${format(shiftStartTime, 'p')}` : 'Select a client and start a new shift.'}
           </CardDescription>
        </CardHeader>
        <CardContent>
          {!isShiftActive ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
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
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Shift is currently active.
            </div>
          )}
        </CardContent>
        <CardFooter>
            {isShiftActive ? (
              <Button onClick={handleEndShift} variant="destructive" className="w-full md:w-auto">End Shift</Button>
            ) : (
              <Button onClick={handleStartShift} className="w-full md:w-auto" disabled={!selectedClientId}>Start Shift</Button>
            )}
        </CardFooter>
      </Card>

      {isShiftActive && (
        <>
          <Card className="animate-in fade-in-50 duration-500">
            <CardHeader>
              <CardTitle>Tasks Checklist</CardTitle>
              <CardDescription>Mark tasks as they are completed during the shift.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {tasks.map(task => (
                <TaskItem key={task.id} task={task} onToggle={handleToggleTask} />
              ))}
            </CardContent>
          </Card>

          <Card className="animate-in fade-in-50 duration-700">
            <CardHeader>
              <CardTitle>Shift Notes</CardTitle>
              <CardDescription>Add any relevant notes for this shift.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., Client was in good spirits, watched a movie together..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
              />
            </CardContent>
          </Card>
        </>
      )}

      {!isShiftActive && (
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
                                                     <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <task.icon className="h-5 w-5 mx-auto" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{task.text}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
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
      )}

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
