import Navbar from "@/components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-900">
      <Navbar />
      {/* Chừa khoảng trống cho thanh điều hướng cố định cao 48px. */}
      <main className="min-h-0 flex-1 pt-12">
        {children}
      </main>
    </div>
  );
}
