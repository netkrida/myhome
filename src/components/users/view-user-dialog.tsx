"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CalendarDays, Mail, Phone, MapPin, Shield, Clock, User } from "lucide-react";
import type { UserListItem } from "@/server/types/user";
import { UserRole } from "@/server/types/rbac";

interface UserDetails extends UserListItem {
  emailVerified?: Date | null;
  provinceCode?: string;
  provinceName?: string;
  regencyCode?: string;
  regencyName?: string;
  districtCode?: string;
  districtName?: string;
  streetAddress?: string;
  adminKosProfile?: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  receptionistProfile?: {
    id: string;
    shift?: string;
    startDate?: Date;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  customerProfile?: {
    id: string;
    dateOfBirth?: Date;
    gender?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

interface ViewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListItem;
}

export function ViewUserDialog({ open, onOpenChange, user }: ViewUserDialogProps) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch detailed user data when dialog opens
  useEffect(() => {
    if (open && user.id) {
      fetchUserDetails();
    }
  }, [open, user.id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const data = await response.json();
      setUserDetails(data);
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPERADMIN:
        return "destructive";
      case UserRole.ADMINKOS:
        return "default";
      case UserRole.RECEPTIONIST:
        return "secondary";
      case UserRole.CUSTOMER:
        return "outline";
      default:
        return "outline";
    }
  };

  // Format date
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Not set";
    try {
      return new Date(date).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  // Format address
  const formatAddress = (details: UserDetails) => {
    const parts = [];
    if (details.streetAddress) parts.push(details.streetAddress);
    if (details.districtName) parts.push(details.districtName);
    if (details.regencyName) parts.push(details.regencyName);
    if (details.provinceName) parts.push(details.provinceName);
    
    return parts.length > 0 ? parts.join(", ") : "Address not provided";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about the selected user
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading user details...</div>
          </div>
        ) : userDetails ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Name:</span>
                      <span className="text-sm">{userDetails.name || "No name provided"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Email:</span>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{userDetails.email}</span>
                      </div>
                    </div>
                    {userDetails.phoneNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Phone:</span>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{userDetails.phoneNumber}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Role:</span>
                      <Badge variant={getRoleBadgeVariant(userDetails.role)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {userDetails.role}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant={userDetails.isActive ? "default" : "secondary"}>
                        {userDetails.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Email Verified:</span>
                      <Badge variant={userDetails.emailVerified ? "default" : "outline"}>
                        {userDetails.emailVerified ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{formatAddress(userDetails)}</p>
                {(userDetails.provinceCode || userDetails.regencyCode || userDetails.districtCode) && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    {userDetails.provinceCode && (
                      <div>Province Code: {userDetails.provinceCode}</div>
                    )}
                    {userDetails.regencyCode && (
                      <div>Regency Code: {userDetails.regencyCode}</div>
                    )}
                    {userDetails.districtCode && (
                      <div>District Code: {userDetails.districtCode}</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role-specific Information */}
            {userDetails.adminKosProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    AdminKos Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    AdminKos profile created on {formatDate(userDetails.adminKosProfile.createdAt)}
                  </p>
                </CardContent>
              </Card>
            )}

            {userDetails.receptionistProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Receptionist Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {userDetails.receptionistProfile.shift && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Shift:</span>
                      <Badge variant="outline">{userDetails.receptionistProfile.shift}</Badge>
                    </div>
                  )}
                  {userDetails.receptionistProfile.startDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Start Date:</span>
                      <span className="text-sm">{formatDate(userDetails.receptionistProfile.startDate)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Profile Created:</span>
                    <span className="text-sm">{formatDate(userDetails.receptionistProfile.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {userDetails.customerProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {userDetails.customerProfile.dateOfBirth && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Date of Birth:</span>
                      <span className="text-sm">{formatDate(userDetails.customerProfile.dateOfBirth)}</span>
                    </div>
                  )}
                  {userDetails.customerProfile.gender && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Gender:</span>
                      <span className="text-sm">{userDetails.customerProfile.gender}</span>
                    </div>
                  )}
                  {userDetails.customerProfile.emergencyContact && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Emergency Contact:</span>
                      <span className="text-sm">{userDetails.customerProfile.emergencyContact}</span>
                    </div>
                  )}
                  {userDetails.customerProfile.emergencyPhone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Emergency Phone:</span>
                      <span className="text-sm">{userDetails.customerProfile.emergencyPhone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User ID:</span>
                  <span className="text-sm font-mono text-muted-foreground">{userDetails.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{formatDate(userDetails.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Updated:</span>
                  <span className="text-sm">{formatDate(userDetails.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Failed to load user details</div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}