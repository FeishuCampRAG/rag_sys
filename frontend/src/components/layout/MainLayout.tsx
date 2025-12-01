import { MainLayoutProps } from '../../types';

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-56px)]">
      {children}
    </div>
  );
}