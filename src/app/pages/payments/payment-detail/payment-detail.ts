import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  Payment,
  PaymentMethod,
  PaymentStatus
} from '../../../models/payment';
import { PaymentService } from '../../../services/payment.service';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-payment-detail',
  styleUrl: './payment-detail.css',
  templateUrl: './payment-detail.html',
})
export class PaymentDetail implements OnInit {

  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);
  private cdr = inject(ChangeDetectorRef);

  payment: Payment | null = null;
  orderId = '';
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadPayment();
  }

  loadPayment(): void {
    if (!this.orderId) {
      this.loading = false;
      this.errorMessage = 'No se indicó una orden.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.paymentService.getByOrder(this.orderId).subscribe({
      next: payment => {
        this.payment = payment;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.loading = false;
        this.errorMessage = this.resolveError(error, 'No se pudo cargar el pago.');
        this.cdr.markForCheck();
      }
    });
  }

  statusLabel(status: PaymentStatus): string {
    return PAYMENT_STATUS_LABELS[status] ?? status;
  }

  methodLabel(method: PaymentMethod): string {
    return PAYMENT_METHOD_LABELS[method] ?? method;
  }

  private resolveError(error: any, fallback: string): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    return error?.error?.message || fallback;
  }
}
