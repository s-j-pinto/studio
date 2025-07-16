'use client';

import { Checkbox } from '@/components/ui/checkbox';
import type { Task } from '@/lib/types';


interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
}

export function TaskItem({ task, onToggle }: TaskItemProps) {
  const Icon = task.icon;
  return (
    <div
      key={task.id}
      className={`flex items-center space-x-4 p-3 rounded-lg transition-all duration-300 ${task.completed ? 'bg-muted/50' : 'bg-transparent'}`}
    >
      <Checkbox
        id={`task-${task.id}`}
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        aria-label={`Mark ${task.text} as ${task.completed ? 'incomplete' : 'complete'}`}
        className="h-5 w-5"
      />
      <label
        htmlFor={`task-${task.id}`}
        className={`flex-1 flex items-center gap-3 cursor-pointer transition-colors ${
          task.completed ? 'text-muted-foreground line-through' : 'text-card-foreground'
        }`}
      >
        <Icon className={`h-6 w-6 transition-colors ${task.completed ? 'text-muted-foreground' : 'text-accent-foreground'}`} />
        <span className="font-medium text-sm">{task.text}</span>
      </label>
    </div>
  );
}
