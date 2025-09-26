"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, UserCheck, UserX, Shield, Eye } from "lucide-react";
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
// import { Pagination } from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import type { UserListItem } from "@/server/types/user";
import { UserRole } from "@/server/types/rbac";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { DeleteUserDialog } from "@/components/users/delete-user-dialog";
import { ChangeRoleDialog } from "@/components/users/change-role-dialog";
import { ViewUserDialog } from "@/components/users/view-user-dialog";

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<UserRole, number>;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [dialogState, setDialogState] = useState<{
    create: boolean;
    edit: boolean;
    delete: boolean;
    changeRole: boolean;
    view: boolean;
  }>({
    create: false,
    edit: false,
    delete: false,
    changeRole: false,
    view: false,
  });

  const pageSize = 10;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Reduced delay for smoother experience

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, roleFilter, statusFilter]);

  // Fetch users function with proper loading states
  const fetchUsers = useCallback(async () => {
    try {
      // Don't show full loading if it's just a search
      if (debouncedSearchTerm !== searchTerm) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (debouncedSearchTerm.trim()) params.append("search", debouncedSearchTerm);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/users?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
      setTotalUsers(data.pagination.total);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, roleFilter, statusFilter]);

  // Fetch user statistics
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/users/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch users when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Handle user status toggle
  const handleStatusToggle = async (user: UserListItem) => {
    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      toast.success(`User ${!user.isActive ? "activated" : "deactivated"} successfully`);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
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

  // Get status badge variant
  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? "default" : "secondary";
  };

  return (
    <DashboardLayout title="User Management">
      <div className="px-4 lg:px-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">
                Manage users, roles, and permissions across the platform
              </p>
            </div>
            <Button onClick={() => setDialogState({ ...dialogState, create: true })}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byRole.SUPERADMIN + stats.byRole.ADMINKOS}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-10"
                  disabled={loading}
                />
                {searchLoading && (
                  <div className="absolute right-8 top-2.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                )}
                {searchTerm && !searchLoading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7 p-0 hover:bg-muted"
                    onClick={() => setSearchTerm("")}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value={UserRole.SUPERADMIN}>Superadmin</SelectItem>
                <SelectItem value={UserRole.ADMINKOS}>Admin Kos</SelectItem>
                <SelectItem value={UserRole.RECEPTIONIST}>Receptionist</SelectItem>
                <SelectItem value={UserRole.CUSTOMER}>Customer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}>
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
          
          {/* Active Filters Display */}
          {(debouncedSearchTerm || roleFilter !== "all" || statusFilter !== "all") && (
            <div className="flex items-center gap-2 pt-4 mt-4 border-t">
              <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
              {debouncedSearchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{debouncedSearchTerm}"
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {roleFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Role: {roleFilter}
                  <button
                    onClick={() => setRoleFilter("all")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>A list of all users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading users...</div>
            </div>
          ) : (
            <>
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
                      <TableCell className="font-medium">
                        {user.name || "No name"}
                      </TableCell>
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
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setDialogState({ ...dialogState, view: true });
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setDialogState({ ...dialogState, edit: true });
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setDialogState({ ...dialogState, changeRole: true });
                              }}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusToggle(user)}
                            >
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
                              onClick={() => {
                                setSelectedUser(user);
                                setDialogState({ ...dialogState, delete: true });
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Permanently Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 0 && (
                <div className="mt-4 space-y-2">
                  {/* Results info */}
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div>
                      {loading ? (
                        "Loading..."
                      ) : (
                        <>
                          Showing {totalUsers === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to{' '}
                          {Math.min(currentPage * pageSize, totalUsers)} of{' '}
                          {totalUsers} result{totalUsers !== 1 ? 's' : ''}
                          {(debouncedSearchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                            <span className="ml-1 text-primary">
                              (filtered)
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {totalPages > 1 && (
                      <span>Page {currentPage} of {totalPages}</span>
                    )}
                  </div>

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1 || loading}
                        >
                          First
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1 || loading}
                        >
                          Previous
                        </Button>
                        
                        {/* Page numbers for small pagination */}
                        {totalPages <= 7 ? (
                          Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              disabled={loading}
                              className="min-w-[32px]"
                            >
                              {page}
                            </Button>
                          ))
                        ) : (
                          <>
                            {/* Show first few pages, current page area, and last few pages */}
                            {currentPage > 3 && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={loading}>1</Button>
                                {currentPage > 4 && <span className="px-2">...</span>}
                              </>
                            )}
                            
                            {Array.from({ length: 3 }, (_, i) => {
                              const page = Math.max(1, Math.min(totalPages, currentPage - 1 + i));
                              return (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  disabled={loading}
                                  className="min-w-[32px]"
                                >
                                  {page}
                                </Button>
                              );
                            })}
                            
                            {currentPage < totalPages - 2 && (
                              <>
                                {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={loading}>{totalPages}</Button>
                              </>
                            )}
                          </>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages || loading}
                        >
                          Next
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages || loading}
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog
        open={dialogState.create}
        onOpenChange={(open) => setDialogState({ ...dialogState, create: open })}
        onSuccess={() => {
          fetchUsers();
          fetchStats();
        }}
      />

      {selectedUser && (
        <>
          <ViewUserDialog
            open={dialogState.view}
            onOpenChange={(open) => setDialogState({ ...dialogState, view: open })}
            user={selectedUser}
          />

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
        </>
      )}
        </div>
      </div>
    </DashboardLayout>
  );
}
