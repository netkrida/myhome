import crypto from 'crypto';
import type {
  PaymentDTO,
  CreatePaymentDTO,
  MidtransSnapRequest,
  MidtransSnapResponse,
  MidtransNotification,
  BookingDTO
} from "../types/booking";
import {
  PaymentStatus,
  PaymentType
} from "../types/booking";

/**
 * Payment Domain Service
 * Pure business logic for payment processing and Midtrans integration
 */
export class PaymentService {

  /**
   * Generate unique Midtrans order ID
   */
  static generateOrderId(bookingId: string, paymentType: PaymentType): string {
    const timestamp = Date.now().toString(36);
    const typePrefix = paymentType === PaymentType.DEPOSIT ? 'DEP' : 'FULL';
    return `${typePrefix}-${bookingId.substring(0, 8)}-${timestamp}`.toUpperCase();
  }

  private static formatExpiryStartTime(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    const timezoneOffset = -date.getTimezoneOffset();
    const sign = timezoneOffset >= 0 ? '+' : '-';
    const offsetTotalMinutes = Math.abs(timezoneOffset);
    const offsetHours = pad(Math.floor(offsetTotalMinutes / 60));
    const offsetMinutes = pad(offsetTotalMinutes % 60);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${sign}${offsetHours}${offsetMinutes}`;
  }

  /**
   * Create Midtrans Snap request payload
   */
  static createSnapRequest(
    booking: BookingDTO,
    payment: PaymentDTO,
    user: { name?: string; email?: string; phoneNumber?: string }
  ): MidtransSnapRequest {
    const itemName = payment.paymentType === PaymentType.DEPOSIT 
      ? `Deposit - ${booking.room?.roomType} ${booking.room?.roomNumber}`
      : `Full Payment - ${booking.room?.roomType} ${booking.room?.roomNumber}`;

    const request: MidtransSnapRequest = {
      transaction_details: {
        order_id: payment.midtransOrderId,
        gross_amount: Math.round(payment.amount)
      },
      customer_details: {
        first_name: user.name || 'Customer',
        email: user.email || '',
        phone: user.phoneNumber
      },
      item_details: [
        {
          id: booking.roomId,
          price: Math.round(payment.amount),
          quantity: 1,
          name: itemName
        }
      ]
    };

    // Set expiry time (24 hours for deposit, 1 hour for full payment)
    const expiryDuration = payment.paymentType === PaymentType.DEPOSIT ? 24 : 1;
    request.expiry = {
      start_time: PaymentService.formatExpiryStartTime(new Date()),
      unit: 'hour',
      duration: expiryDuration
    };

    return request;
  }

  /**
   * Verify Midtrans notification signature
   */
  static verifySignature(notification: MidtransNotification, serverKey: string): boolean {
    const { order_id, status_code, gross_amount, signature_key } = notification;
    
    const signatureString = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const calculatedSignature = crypto
      .createHash('sha512')
      .update(signatureString)
      .digest('hex');

    return calculatedSignature === signature_key;
  }

  /**
   * Map Midtrans transaction status to PaymentStatus
   */
  static mapTransactionStatus(transactionStatus: string, fraudStatus?: string): PaymentStatus {
    switch (transactionStatus) {
      case 'capture':
        return fraudStatus === 'accept' ? PaymentStatus.SUCCESS : PaymentStatus.PENDING;
      case 'settlement':
        return PaymentStatus.SUCCESS;
      case 'pending':
        return PaymentStatus.PENDING;
      case 'deny':
      case 'cancel':
        return PaymentStatus.FAILED;
      case 'expire':
        return PaymentStatus.EXPIRED;
      case 'refund':
      case 'partial_refund':
        return PaymentStatus.REFUNDED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Validate payment creation
   */
  static validatePaymentCreation(
    paymentData: CreatePaymentDTO,
    booking: BookingDTO
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if booking exists and is valid
    if (!booking) {
      errors.push("Booking not found");
      return { isValid: false, errors };
    }

    // Check if payment type is valid for the booking
    if (paymentData.paymentType === PaymentType.DEPOSIT) {
      // Check if deposit is already paid
      const hasDepositPayment = booking.payments?.some(
        p => p.paymentType === PaymentType.DEPOSIT && p.status === PaymentStatus.SUCCESS
      );
      if (hasDepositPayment) {
        errors.push("Deposit has already been paid for this booking");
      }
    } else if (paymentData.paymentType === PaymentType.FULL) {
      // Check if full payment is already made
      const hasFullPayment = booking.payments?.some(
        p => p.paymentType === PaymentType.FULL && p.status === PaymentStatus.SUCCESS
      );
      if (hasFullPayment) {
        errors.push("Full payment has already been made for this booking");
      }
    }

    // Check booking status
    // UNPAID: initial booking, can create payment
    // DEPOSIT_PAID: deposit paid, can create full payment
    // CONFIRMED: full payment done, cannot create more payments
    const validStatusesForPayment = ['UNPAID', 'DEPOSIT_PAID', 'CONFIRMED'];
    if (!validStatusesForPayment.includes(booking.status)) {
      errors.push(`Cannot create payment for booking with status: ${booking.status}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate payment amount based on type
   */
  static calculatePaymentAmount(booking: BookingDTO, paymentType: PaymentType): number {
    if (paymentType === PaymentType.DEPOSIT) {
      return booking.depositAmount || 0;
    } else {
      // For full payment, check if deposit was already paid
      const depositPaid = booking.payments?.find(
        p => p.paymentType === PaymentType.DEPOSIT && p.status === PaymentStatus.SUCCESS
      );
      
      if (depositPaid) {
        // Return remaining amount after deposit
        return booking.totalAmount - depositPaid.amount;
      } else {
        // Return full amount
        return booking.totalAmount;
      }
    }
  }

  /**
   * Check if payment is expired
   */
  static isPaymentExpired(payment: PaymentDTO): boolean {
    if (!payment.expiryTime) return false;
    return new Date() > payment.expiryTime;
  }

  /**
   * Get payment method display name
   */
  static getPaymentMethodDisplayName(paymentMethod: string): string {
    const methodMap: Record<string, string> = {
      'credit_card': 'Credit Card',
      'bank_transfer': 'Bank Transfer',
      'echannel': 'Mandiri Bill',
      'bca_va': 'BCA Virtual Account',
      'bni_va': 'BNI Virtual Account',
      'bri_va': 'BRI Virtual Account',
      'permata_va': 'Permata Virtual Account',
      'other_va': 'Virtual Account',
      'gopay': 'GoPay',
      'shopeepay': 'ShopeePay',
      'qris': 'QRIS',
      'indomaret': 'Indomaret',
      'alfamart': 'Alfamart',
      'akulaku': 'Akulaku'
    };

    return methodMap[paymentMethod] || paymentMethod;
  }

  /**
   * Validate Midtrans notification
   */
  static validateNotification(notification: MidtransNotification): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!notification.order_id) {
      errors.push("Order ID is required");
    }

    if (!notification.transaction_status) {
      errors.push("Transaction status is required");
    }

    if (!notification.signature_key) {
      errors.push("Signature key is required");
    }

    if (!notification.gross_amount) {
      errors.push("Gross amount is required");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if payment can be refunded
   */
  static canRefundPayment(payment: PaymentDTO): boolean {
    return payment.status === PaymentStatus.SUCCESS && 
           payment.paymentType === PaymentType.DEPOSIT;
  }

  /**
   * Calculate refund amount
   */
  static calculateRefundAmount(payment: PaymentDTO, refundPercentage: number = 100): number {
    if (!this.canRefundPayment(payment)) {
      return 0;
    }

    return Math.round((payment.amount * refundPercentage) / 100);
  }

  /**
   * Get payment status display
   */
  static getPaymentStatusDisplay(status: PaymentStatus): { text: string; color: string } {
    const statusMap: Record<PaymentStatus, { text: string; color: string }> = {
      [PaymentStatus.PENDING]: { text: 'Pending', color: 'yellow' },
      [PaymentStatus.SUCCESS]: { text: 'Success', color: 'green' },
      [PaymentStatus.FAILED]: { text: 'Failed', color: 'red' },
      [PaymentStatus.EXPIRED]: { text: 'Expired', color: 'gray' },
      [PaymentStatus.REFUNDED]: { text: 'Refunded', color: 'blue' }
    };

    return statusMap[status] || { text: status, color: 'gray' };
  }

  /**
   * Get payment type display
   */
  static getPaymentTypeDisplay(type: PaymentType): string {
    return type === PaymentType.DEPOSIT ? 'Deposit' : 'Full Payment';
  }

  /**
   * Check if booking payment is complete
   */
  static isBookingPaymentComplete(booking: BookingDTO): boolean {
    const payments = booking.payments || [];
    
    // Check if there's a successful full payment
    const hasFullPayment = payments.some(
      p => p.paymentType === PaymentType.FULL && p.status === PaymentStatus.SUCCESS
    );
    
    if (hasFullPayment) return true;

    // Check if deposit is paid and it covers the full amount
    const depositPayment = payments.find(
      p => p.paymentType === PaymentType.DEPOSIT && p.status === PaymentStatus.SUCCESS
    );
    
    if (depositPayment && booking.depositAmount && booking.depositAmount >= booking.totalAmount) {
      return true;
    }

    return false;
  }

  /**
   * Get next required payment type
   */
  static getNextRequiredPaymentType(booking: BookingDTO): PaymentType | null {
    const payments = booking.payments || [];
    
    const hasSuccessfulDeposit = payments.some(
      p => p.paymentType === PaymentType.DEPOSIT && p.status === PaymentStatus.SUCCESS
    );
    
    const hasSuccessfulFull = payments.some(
      p => p.paymentType === PaymentType.FULL && p.status === PaymentStatus.SUCCESS
    );

    if (hasSuccessfulFull) {
      return null; // Payment complete
    }

    if (!hasSuccessfulDeposit && booking.depositAmount && booking.depositAmount > 0) {
      return PaymentType.DEPOSIT;
    }

    return PaymentType.FULL;
  }
}
