import { Sidebar } from "@/components/dashboard/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { requireCurrentOrg } from "@/lib/auth/current-org";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organization, userEmail } = await requireCurrentOrg();

  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar orgName={organization.name} userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}
