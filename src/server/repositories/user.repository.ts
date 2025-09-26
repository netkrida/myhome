import { type User, type Prisma } from "@prisma/client";
import { UserRole } from "../types/rbac";
import { prisma } from "../db/client";
import type { 
  CreateUserDTO, 
  UpdateUserDTO, 
  UserFilterParams,
  PaginationDTO 
} from "../types/user";

/**
 * User Repository
 * Data access layer for user operations
 */
export class UserRepository {
  /**
   * Find user by ID with optional profile data
   */
  static async findById(id: string, includeProfile: boolean = false): Promise<User | null> {
    const include = includeProfile ? {
      adminKosProfile: true,
      receptionistProfile: true,
      customerProfile: true,
    } : undefined;

    return prisma.user.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Get total count of all users
   */
  static async getTotalCount(): Promise<number> {
    return prisma.user.count({
      where: {
        isActive: true,
      },
    });
  }

  /**
   * Create a new user
   */
  static async create(userData: CreateUserDTO): Promise<User> {
    return prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        image: userData.image,
      },
    });
  }

  /**
   * Create user with profile data
   */
  static async createWithProfile(
    userData: CreateUserDTO,
    profileData?: {
      adminKos?: { businessName?: string; businessAddress?: string; businessPhone?: string; description?: string };
      receptionist?: { shift?: string; startDate?: Date };
      customer?: { dateOfBirth?: Date; gender?: string; emergencyContact?: string; emergencyPhone?: string };
    }
  ): Promise<User> {
    return prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          image: userData.image,
        },
      });

      // Create role-specific profile
      if (profileData?.adminKos && userData.role === "ADMINKOS") {
        await tx.adminKosProfile.create({
          data: {
            userId: user.id,
            businessName: profileData.adminKos.businessName,
            businessAddress: profileData.adminKos.businessAddress,
            businessPhone: profileData.adminKos.businessPhone,
            description: profileData.adminKos.description,
          },
        });
      }

      if (profileData?.receptionist && userData.role === "RECEPTIONIST") {
        await tx.receptionistProfile.create({
          data: {
            userId: user.id,
            shift: profileData.receptionist.shift,
            startDate: profileData.receptionist.startDate,
          },
        });
      }

      if (profileData?.customer && userData.role === "CUSTOMER") {
        await tx.customerProfile.create({
          data: {
            userId: user.id,
            dateOfBirth: profileData.customer.dateOfBirth,
            gender: profileData.customer.gender,
            emergencyContact: profileData.customer.emergencyContact,
            emergencyPhone: profileData.customer.emergencyPhone,
          },
        });
      }

      return user;
    });
  }

  /**
   * Update user
   */
  static async update(id: string, updateData: UpdateUserDTO): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Update user password
   */
  static async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * Update user role
   */
  static async updateRole(id: string, newRole: UserRole): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { role: newRole },
    });
  }

  /**
   * Soft delete user (deactivate)
   */
  static async deactivate(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Reactivate user
   */
  static async reactivate(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Hard delete user (permanent deletion with cascade)
   * This will delete the user and all associated data:
   * - User accounts, sessions, posts
   * - Role-specific profiles (AdminKos, Receptionist, Customer)
   * - All related data through cascade relationships
   */
  static async delete(id: string): Promise<User> {
    // Use transaction for safety
    return prisma.$transaction(async (tx) => {
      // First check if user exists
      const user = await tx.user.findUnique({
        where: { id },
        include: {
          adminKosProfile: true,
          receptionistProfile: true,
          customerProfile: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Delete user (cascade will handle related data)
      return tx.user.delete({
        where: { id },
      });
    });
  }

  /**
   * Find users with filtering and pagination
   */
  static async findMany(filters: UserFilterParams): Promise<{
    users: User[];
    pagination: PaginationDTO;
  }> {
    const {
      role,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
    } = filters;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by status (active/inactive)
    if (status) {
      where.isActive = status === 'active';
    }

    console.log('=== USER REPOSITORY: Query details ===', {
      filters,
      whereClause: where,
      willQueryWith: { where, skip: (page - 1) * limit, take: limit }
    });

    // Get total count
    const total = await prisma.user.count({ where });
    
    console.log('=== USER REPOSITORY: Total count ===', { total });

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Get users
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    console.log('=== USER REPOSITORY: Query results ===', {
      foundUsers: users.length,
      totalFromCount: total,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Find users by role
   */
  static async findByRole(role: UserRole): Promise<User[]> {
    return prisma.user.findMany({
      where: { role, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Count users by role
   */
  static async countByRole(role: UserRole): Promise<number> {
    return prisma.user.count({
      where: { role, isActive: true },
    });
  }

  /**
   * Soft delete user (set isActive to false)
   */
  static async softDelete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Change user status
   */
  static async changeStatus(id: string, isActive: boolean): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * Change user role
   */
  static async changeRole(id: string, role: UserRole): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  /**
   * Bulk update user status
   */
  static async bulkUpdateStatus(userIds: string[], isActive: boolean): Promise<{ count: number }> {
    return prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { isActive },
    });
  }



  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
  }> {
    const [total, active, inactive, roleStats] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
        where: { isActive: true },
      }),
    ]);

    const byRole = roleStats.reduce((acc, stat) => {
      acc[stat.role as UserRole] = stat._count.role;
      return acc;
    }, {} as Record<UserRole, number>);

    // Ensure all roles are represented
    Object.values(UserRole).forEach(role => {
      if (!(role in byRole)) {
        byRole[role] = 0;
      }
    });

    return {
      total,
      active,
      inactive,
      byRole,
    };
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const where: Prisma.UserWhereInput = { email };
    
    if (excludeUserId) {
      where.id = { not: excludeUserId };
    }

    const user = await prisma.user.findFirst({ where });
    return !!user;
  }

  /**
   * Find users managed by an AdminKos
   */
  static async findManagedUsers(adminKosId: string): Promise<User[]> {
    // This would need to be implemented based on the relationship structure
    // For now, we'll return users associated with properties owned by the AdminKos
    return prisma.user.findMany({
      where: {
        OR: [
          {
            role: "RECEPTIONIST",
            managedProperties: {
              some: {
                property: {
                  adminId: adminKosId,
                },
              },
            },
          },
          {
            role: "CUSTOMER",
            bookings: {
              some: {
                property: {
                  adminId: adminKosId,
                },
              },
            },
          },
        ],
      },
      include: {
        receptionistProfile: true,
        customerProfile: true,
      },
    });
  }

  /**
   * Find receptionists assigned to a property
   */
  static async findPropertyReceptionists(propertyId: string): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        role: "RECEPTIONIST",
        managedProperties: {
          some: {
            propertyId,
            isActive: true,
          },
        },
      },
      include: {
        receptionistProfile: true,
      },
    });
  }

  /**
   * Get user statistics
   */
  static async getStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<UserRole, number>;
  }> {
    const [totalUsers, activeUsers, roleStats] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
        where: { isActive: true },
      }),
    ]);

    const usersByRole = roleStats.reduce((acc, stat) => {
      acc[stat.role as UserRole] = stat._count.role;
      return acc;
    }, {} as Record<UserRole, number>);

    return {
      totalUsers,
      activeUsers,
      usersByRole,
    };
  }
}
