import type { LucideProps } from 'lucide-react';

export interface Task {
  id: number;
  text: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;
  completed: boolean;
}

// A version of the Task type that is safe to pass to server actions.
export type PlainTask = Omit<Task, 'icon'>;

export interface CompletedShift {
  id: string;
  client: { id: string; name: string };
  caregiverName: string;
  startTime: string;
  endTime: string;
  completedTasks: PlainTask[];
  incompleteTasks: PlainTask[];
  notes: string;
}

export interface OnCallCaregiver {
  EmployeeID: number;
  FirstName: string;
  LastName: string;
  PhoneNumber: string;
}
