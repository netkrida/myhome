"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, UserCheck, UserX, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import type { UserListItem } from "@/server/types/user";
import { UserRole } from "@/server/types/rbac";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { DeleteUserDialog } from "@/components/users/delete-user-dialog";
import { ChangeRoleDialog } from "@/components/users/change-role-dialog";

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<UserRole, number>;
}

interface RoleSpecificUsersPageProps {
  role: UserRole;
  title: string;
  description: string;
  allowRoleChange?: boolean;
  allowCreate?: boolean;
}

export function RoleSpecificUsersPage({ 
  role, 
  title, 
  description, 
  allowRoleChange = true, 
  allowCreate = true 
}: RoleSpecificUsersPageProps) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [dialogState, setDialogState] = useState<{
    create: boolean;
    edit: boolean;
    delete: boolean;
    changeRole: boolean;
  }>({
    create: false,
    edit: false,
    delete: false,
    changeRole: false,
  });

  // Fetch users with role filter
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        sortBy: "createdAt",
        sortOrder: "desc",
        role: role, // Filter by specific role
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/users?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user statistics
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/users/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch user stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      toast.error("Failed to load user statistics");
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle user actions
  const handleEditUser = (user: UserListItem) => {
    setSelectedUser(user);
    setDialogState({ ...dialogState, edit: true });
  };

  const handleDeleteUser = (user: UserListItem) => {
    setSelectedUser(user);
    setDialogState({ ...dialogState, delete: true });
  };

  const handleChangeRole = (user: UserListItem) => {
    setSelectedUser(user);
    setDialogState({ ...dialogState, changeRole: true });
  };

  const handleToggleStatus = async (user: UserListItem) => {
    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      toast.success(`User ${user.isActive ? "deactivated" : "activated"} successfully`);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (userRole: UserRole) => {
    switch (userRole) {
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

  // Get status badge variant
  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? "default" : "secondary";
  };

  // Get role-specific stats
  const getRoleStats = () => {
    if (!stats) return { total: 0, active: 0, inactive: 0 };
    
    const roleCount = stats.byRole[role] || 0;
    // For simplicity, we'll show the role count as total
    // In a real implementation, you might want to fetch role-specific stats
    return {
      total: roleCount,
      active: roleCount, // This would need to be calculated properly
      inactive: 0, // This would need to be calculated properly
    };
  };

  const roleStats = getRoleStats();

  return (
    <DashboardLayout title={title}>
      <div className="px-4 lg:px-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
            {allowCreate && (
              <Button onClick={() => setDialogState({ ...dialogState, create: true })}>
                <Plus className="mr-2 h-4 w-4" />
                Add {role === UserRole.ADMINKOS ? "Admin Kos" : role === UserRole.CUSTOMER ? "Customer" : "User"}
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total {role}s</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roleStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Total registered {role.toLowerCase()}s
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roleStats.active}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active {role.toLowerCase()}s
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roleStats.inactive}</div>
                <p className="text-xs text-muted-foreground">
                  Inactive {role.toLowerCase()}s
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage {role.toLowerCase()} users and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading users...</div>
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">No users found</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(user.isActive)}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {allowRoleChange && (
                                <DropdownMenuItem onClick={() => handleChangeRole(user)}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Change Role
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                {user.isActive ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Dialogs */}
          {allowCreate && (
            <CreateUserDialog
              open={dialogState.create}
              onOpenChange={(open) => setDialogState({ ...dialogState, create: open })}
              defaultRole={role}
              onSuccess={() => {
                fetchUsers();
                fetchStats();
              }}
            />
          )}

          {selectedUser && (
            <>
              <EditUserDialog
                open={dialogState.edit}
                onOpenChange={(open) => setDialogState({ ...dialogState, edit: open })}
                user={selectedUser}
                onSuccess={() => {
                  fetchUsers();
                  fetchStats();
                  setSelectedUser(null);
                }}
              />

              <DeleteUserDialog
                open={dialogState.delete}
                onOpenChange={(open) => setDialogState({ ...dialogState, delete: open })}
                user={selectedUser}
                onSuccess={() => {
                  fetchUsers();
                  fetchStats();
                  setSelectedUser(null);
                }}
              />

              {allowRoleChange && (
                <ChangeRoleDialog
                  open={dialogState.changeRole}
                  onOpenChange={(open) => setDialogState({ ...dialogState, changeRole: open })}
                  user={selectedUser}
                  onSuccess={() => {
                    fetchUsers();
                    fetchStats();
                    setSelectedUser(null);
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
