/**
 * AdminKos Settings Page
 * Page for AdminKos to manage profile, avatar, and password
 */

import { requireRole } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SettingsForm } from "@/components/dashboard/settings/settings-form";
import { UserRepository } from "@/server/repositories/user.repository";
import { redirect } from "next/navigation";

export default async function AdminKosSettingsPage() {
  // Require AdminKos role
  const userContext = await requireRole([UserRole.ADMINKOS]);

  // Check if id exists
  if (!userContext?.id) {
    redirect("/auth/signin");
  }

  // Get user data
  const user = await UserRepository.findById(userContext.id);

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <DashboardLayout title="Pengaturan">
      <div className="px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
            <p className="text-muted-foreground">
              Kelola profil, foto, dan keamanan akun Anda
            </p>
          </div>

          {/* Settings Form */}
          <SettingsForm user={user} />
        </div>
      </div>
    </DashboardLayout>
  );
}

