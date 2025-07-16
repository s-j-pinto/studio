'use client';

import { useState, useEffect } from 'react';
import {
  Accessibility,
  CheckCircle2,
  Circle,
  Clock,
  Pill,
  ShowerHead,
  Sparkles,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { format, formatDistanceStrict } from 'date-fns';
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

export function ShiftManager() {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(null);
  const [shiftEndTime, setShiftEndTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeShiftClient, setActiveShiftClient] = useState<{ id: string; name: string; } | null>(null);

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
  };

  const handleEndShift = () => {
    setIsShiftActive(false);
    setShiftEndTime(new Date());
  };

  const handleStartNewShift = () => {
    setShiftStartTime(null);
    setShiftEndTime(null);
    setElapsedTime('00:00:00');
    setSelectedClientId(null);
    setActiveShiftClient(null);
    setIsShiftActive(false);
  };
  
  const handleToggleTask = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  if (shiftStartTime && shiftEndTime) {
    const completedTasks = tasks.filter((task) => task.completed);
    const incompleteTasks = tasks.filter((task) => !task.completed);
    
    return (
      <Card className="w-full max-w-4xl mx-auto animate-in fade-in-50 duration-500">
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
    </div>
  );
}
