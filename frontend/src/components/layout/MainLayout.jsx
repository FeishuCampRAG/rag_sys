export default function MainLayout({ children }) {
  return (
    <div className="flex h-[calc(100vh-56px)]">
      {children}
    </div>
  );
}
