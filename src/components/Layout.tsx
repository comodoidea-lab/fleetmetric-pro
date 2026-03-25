import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopNav />
      <Sidebar />
      <main className="pt-16 lg:pl-64 pb-20 lg:pb-0 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
