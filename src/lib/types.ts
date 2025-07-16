import type { LucideProps } from 'lucide-react';

export interface Task {
  id: number;
  text: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;
  completed: boolean;
}

export interface CompletedShift {
  id: string;
  client: { id: string; name: string };
  startTime: string;
  endTime: string;
  completedTasks: Task[];
  incompleteTasks: Task[];
  notes: string;
}
