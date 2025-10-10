"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock } from "lucide-react";
import { ProfileForm } from "./profile-form";
import { AvatarUploader } from "./avatar-uploader";
import { ChangePasswordForm } from "./change-password-form";

interface SettingsFormProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    phoneNumber?: string | null;
    provinceCode?: string | null;
    provinceName?: string | null;
    regencyCode?: string | null;
    regencyName?: string | null;
    districtCode?: string | null;
    districtName?: string | null;
    streetAddress?: string | null;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [currentUser, setCurrentUser] = React.useState(user);

  const handleProfileUpdate = () => {
    // Refresh user data after profile update
    fetch("/api/settings/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCurrentUser(data.data);
        }
      })
      .catch((error) => {
        console.error("Error refreshing user data:", error);
      });
  };

  const handleAvatarUpdate = (url: string) => {
    setCurrentUser((prev) => ({ ...prev, image: url }));
  };

  return (
    <div className="space-y-6">
      {/* Avatar Section - Always visible at top */}
      <AvatarUploader
        currentAvatar={currentUser.image}
        userName={currentUser.name}
        onSuccess={handleAvatarUpdate}
      />

      {/* Tabs for Profile and Password */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileForm
            initialData={{
              name: currentUser.name ?? undefined,
              email: currentUser.email ?? undefined,
              phoneNumber: currentUser.phoneNumber ?? undefined,
              provinceCode: currentUser.provinceCode ?? undefined,
              provinceName: currentUser.provinceName ?? undefined,
              regencyCode: currentUser.regencyCode ?? undefined,
              regencyName: currentUser.regencyName ?? undefined,
              districtCode: currentUser.districtCode ?? undefined,
              districtName: currentUser.districtName ?? undefined,
              streetAddress: currentUser.streetAddress ?? undefined,
            }}
            onSuccess={handleProfileUpdate}
          />
        </TabsContent>

        <TabsContent value="password" className="mt-6">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

