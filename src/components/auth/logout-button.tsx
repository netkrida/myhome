"use client";

import { useState } from "react";
import { LogoutHandler } from "@/lib/logout-handler";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { IconLogout, IconLoader2 } from "@tabler/icons-react";

interface LogoutButtonProps {
  variant?: "button" | "dropdown" | "link";
  callbackUrl?: string;
  className?: string;
  children?: React.ReactNode;
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
}

/**
 * Comprehensive logout button component
 * Handles logout with proper error handling and loading states
 */
export function LogoutButton({
  variant = "button",
  callbackUrl = "/login",
  className = "",
  children,
  size = "default",
  showIcon = true,
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    console.log("🚪 LogoutButton - Initiating logout");

    try {
      await LogoutHandler.logoutWithCallback(callbackUrl);
    } catch (error) {
      console.error("❌ LogoutButton - Logout failed:", error);
      // The LogoutHandler already has fallback mechanisms
    } finally {
      // Note: This might not execute if page redirects
      setIsLoggingOut(false);
    }
  };

  const buttonContent = (
    <>
      {isLoggingOut ? (
        <IconLoader2 className={`${showIcon ? "mr-2" : ""} h-4 w-4 animate-spin`} />
      ) : (
        showIcon && <IconLogout className="mr-2 h-4 w-4" />
      )}
      {children || (isLoggingOut ? "Signing out..." : "Sign out")}
    </>
  );

  if (variant === "dropdown") {
    return (
      <DropdownMenuItem
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={className}
      >
        {buttonContent}
      </DropdownMenuItem>
    );
  }

  if (variant === "link") {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`text-sm font-medium transition-colors hover:text-primary ${className} ${
          isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {buttonContent}
      </button>
    );
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoggingOut}
      size={size}
      variant="ghost"
      className={className}
    >
      {buttonContent}
    </Button>
  );
}

/**
 * Quick logout button for emergency situations
 */
export function EmergencyLogoutButton({
  className = "",
  children = "Emergency Logout",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleEmergencyLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    console.log("🚨 EmergencyLogoutButton - Initiating emergency logout");

    try {
      await LogoutHandler.performEmergencyLogout("/login");
    } catch (error) {
      console.error("❌ EmergencyLogoutButton - Emergency logout failed:", error);
      // Force redirect as last resort
      window.location.href = "/login";
    }
  };

  return (
    <Button
      onClick={handleEmergencyLogout}
      disabled={isLoggingOut}
      variant="destructive"
      size="sm"
      className={className}
    >
      {isLoggingOut ? (
        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <IconLogout className="mr-2 h-4 w-4" />
      )}
      {isLoggingOut ? "Logging out..." : children}
    </Button>
  );
}
