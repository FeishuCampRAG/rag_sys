import { MainLayoutProps } from '../../types';

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto lg:h-[calc(100vh-56px)] lg:flex-row lg:overflow-hidden">
      {children}
    </div>
  );
}
