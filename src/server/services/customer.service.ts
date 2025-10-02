import type { CustomerProfileDetail } from "../types/customer";
import type { Result } from "../types/result";
import { CustomerRepository } from "../repositories/customer.repository";

export class CustomerService {
  static async getCustomerProfile(userId: string): Promise<Result<CustomerProfileDetail>> {
    return CustomerRepository.getProfileByUserId(userId);
  }
}