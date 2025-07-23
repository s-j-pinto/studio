
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

function MyDropdownComponent() {
  // Define the array of data for the dropdown
  const optionsArray = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
  ];

  // State to manage the selected value
  const [selectedValue, setSelectedValue] = useState('');

  // Event handler for when the dropdown value changes
  const handleChange = (event) => {
    setSelectedValue(event.target.value);
  };

  return (
    <div>
      <label htmlFor="my-select">Choose a fruit:</label>
      <select id="my-select" value={selectedValue} onChange={handleChange}>
        <option value="">-- Select an option --</option> {/* Optional default option */}
        {optionsArray.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {selectedValue && <p>You selected: {selectedValue}</p>}
    </div>
  );
}
export default MyDropdownComponent;




