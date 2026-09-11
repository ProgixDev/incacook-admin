import { Sidebar } from "@/components/dashboard/sidebar";
import { AuthGuard, AuthProvider } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <div className="min-h-screen bg-background text-on-surface">
          <Sidebar />
          <main className="pl-64">{children}</main>
        </div>
      </AuthGuard>
    </AuthProvider>
  );
}
