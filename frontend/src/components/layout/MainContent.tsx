import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  return (
    <div className="flex-1 flex flex-col pt-4 px-4 h-full">{children}</div>
  );
}
