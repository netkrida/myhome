import { withAuth } from "../lib/auth";
import { CustomerService } from "../services/customer.service";
import { forbidden } from "../types/result";
import type { Result } from "../types/result";
import type { CustomerProfileDetail } from "../types/customer";
import { UserRole } from "../types/rbac";

export class CustomerAPI {
  static getProfile = withAuth(async (userContext): Promise<Result<CustomerProfileDetail>> => {
    if (userContext.role !== UserRole.CUSTOMER) {
      return forbidden("Only customers can access this resource");
    }

    return CustomerService.getCustomerProfile(userContext.id);
  });
}