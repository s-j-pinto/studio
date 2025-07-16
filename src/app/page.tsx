import { ShiftManager } from '@/components/ShiftManager';
import { HandHeart } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
        <nav className="flex w-full items-center gap-2 text-lg font-medium md:text-base">
          <a
            href="#"
            className="flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <HandHeart className="h-6 w-6 text-accent-foreground" />
            <span>Shift Notes</span>
          </a>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <ShiftManager />
      </main>
    </div>
  );
}
