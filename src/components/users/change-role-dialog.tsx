"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { UserListItem } from "@/server/types/user";
import { UserRole } from "@/server/types/rbac";

const changeRoleSchema = z.object({
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: "Please select a role" }) }),
});

type ChangeRoleFormData = z.infer<typeof changeRoleSchema>;

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListItem;
  onSuccess: () => void;
}

export function ChangeRoleDialog({ open, onOpenChange, user, onSuccess }: ChangeRoleDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ChangeRoleFormData>({
    resolver: zodResolver(changeRoleSchema),
    defaultValues: {
      role: UserRole.CUSTOMER,
    },
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        role: user.role,
      });
    }
  }, [user, form]);

  const onSubmit = async (data: ChangeRoleFormData) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/users/${user.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change user role");
      }

      toast.success("User role changed successfully");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error changing user role:", error);
      toast.error(error instanceof Error ? error.message : "Failed to change user role");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Change the role for this user. This will affect their permissions and access level.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Name:</span>
                <span className="text-sm">{user.name || "No name"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Role:</span>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserRole.CUSTOMER}>Customer</SelectItem>
                        <SelectItem value={UserRole.RECEPTIONIST}>Receptionist</SelectItem>
                        <SelectItem value={UserRole.ADMINKOS}>Admin Kos</SelectItem>
                        <SelectItem value={UserRole.SUPERADMIN}>Superadmin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("role") !== user.role && (
                <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Changing the user role will immediately affect their access permissions. 
                    Make sure this change is intended.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || form.watch("role") === user.role}
                >
                  {loading ? "Changing..." : "Change Role"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
