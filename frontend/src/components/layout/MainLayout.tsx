import { MainLayoutProps } from '../../types';

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden lg:h-[calc(100vh-56px)] lg:flex-row">
      {children}
    </div>
  );
}
