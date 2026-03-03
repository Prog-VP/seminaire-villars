import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SettingsProvider } from "@/features/settings/context";
import { UserRoleProvider } from "@/features/users/context";
import { NotificationProvider } from "@/features/notifications/context";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <UserRoleProvider>
      <SettingsProvider>
        <NotificationProvider>
          <DashboardShell>{children}</DashboardShell>
        </NotificationProvider>
      </SettingsProvider>
    </UserRoleProvider>
  );
}
