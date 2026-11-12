import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  DELIVERY_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  DeliveryType,
  Order,
  OrderStatus
} from '../../../models/order';
import { OrderItem } from '../../../models/order-item';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  Payment,
  PaymentMethod,
  PaymentStatus
} from '../../../models/payment';
import { AuthService } from '../../../services/auth.service';
import { OrderService } from '../../../services/order.service';
import { PaymentService } from '../../../services/payment.service';
import { ProductVariantService } from '../../../services/product-variant.service';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-order-detail',
  styleUrl: './order-detail.css',
  templateUrl: './order-detail.html',
})
export class OrderDetail implements OnInit {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private variantService = inject(ProductVariantService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  order: Order | null = null;
  payment: Payment | null = null;

  loading = true;
  paying = false;
  cancelling = false;

  errorMessage = '';
  paymentError = '';
  successMessage = '';

  created = false;
  replayed = false;

  private orderId = '';

  paymentForm = this.fb.group({
    paymentMethod: ['CREDIT_CARD' as PaymentMethod, Validators.required]
  });

  paymentMethods = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(value => ({
    value,
    label: PAYMENT_METHOD_LABELS[value]
  }));

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') ?? '';
    this.created = this.route.snapshot.queryParamMap.get('created') === '1';
    this.replayed = this.route.snapshot.queryParamMap.get('replayed') === '1';

    this.loadOrder();
  }

  get isStaff(): boolean {
    return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_EMPLOYEE');
  }

  get listPath(): string {
    return this.isStaff ? '/management/orders' : '/orders';
  }

  get canPay(): boolean {
    return this.order?.status === 'PENDING_PAYMENT'
      && !this.payment
      && this.authService.hasPermission('PAYMENT_CREATE');
  }

  get canCancel(): boolean {
    return this.order?.status === 'PENDING_PAYMENT'
      && this.authService.hasAnyPermission(['ORDER_CANCEL_OWN', 'ORDER_CANCEL_ANY']);
  }

  loadOrder(showLoading = true): void {
    if (showLoading) {
      this.loading = true;
    }

    this.errorMessage = '';
    this.cdr.markForCheck();

    const operation = this.isStaff
      ? this.orderService.getAdminOrderById(this.orderId)
      : this.orderService.getOrderById(this.orderId);

    operation.subscribe({
      next: order => {
        this.order = order;
        this.loading = false;
        this.enrichItems(order);
        this.loadPayment(order.id);
        this.cdr.markForCheck();
      },
      error: error => {
        this.loading = false;
        this.errorMessage = this.resolveError(error, 'No se pudo cargar el pedido.');
        this.cdr.markForCheck();
      }
    });
  }

  pay(): void {
    if (!this.order || this.paying) {
      return;
    }

    this.paymentForm.markAllAsTouched();

    if (this.paymentForm.invalid) {
      return;
    }

    this.paying = true;
    this.paymentError = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.paymentService.pay({
      orderId: this.order.id,
      paymentMethod: this.paymentForm.value.paymentMethod as PaymentMethod
    }).subscribe({
      next: payment => {
        this.paying = false;
        this.payment = payment;
        this.successMessage = payment.status === 'APPROVED'
          ? 'El pago fue aprobado. Tu pedido quedó confirmado.'
          : 'El pago fue rechazado y el pedido quedó cancelado.';
        this.loadOrder(false);
        this.cdr.markForCheck();
      },
      error: error => {
        this.paying = false;
        this.paymentError = this.resolveError(error, 'No se pudo procesar el pago.');
        this.cdr.markForCheck();
      }
    });
  }

  cancelOrder(): void {
    if (!this.order || this.cancelling) {
      return;
    }

    const confirmed = confirm('¿Querés cancelar este pedido? Esta acción no se puede deshacer.');

    if (!confirmed) {
      return;
    }

    this.cancelling = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.orderService.cancelOrder(this.order.id).subscribe({
      next: () => {
        this.cancelling = false;
        this.successMessage = 'El pedido fue cancelado.';
        this.loadOrder(false);
        this.cdr.markForCheck();
      },
      error: error => {
        this.cancelling = false;
        this.errorMessage = this.resolveError(error, 'No se pudo cancelar el pedido.');
        this.cdr.markForCheck();
      }
    });
  }

  statusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] ?? status;
  }

  statusClass(status: OrderStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  deliveryLabel(deliveryType: DeliveryType): string {
    return DELIVERY_TYPE_LABELS[deliveryType] ?? deliveryType;
  }

  paymentStatusLabel(status: PaymentStatus): string {
    return PAYMENT_STATUS_LABELS[status] ?? status;
  }

  paymentMethodLabel(method: PaymentMethod): string {
    return PAYMENT_METHOD_LABELS[method] ?? method;
  }

  orderNumber(id: string): string {
    return `#${id.slice(0, 8).toUpperCase()}`;
  }

  itemTitle(item: OrderItem): string {
    return item.productName || `Variante ${item.productVariantId.slice(0, 8).toUpperCase()}`;
  }

  trackByItem(_index: number, item: OrderItem): string {
    return item.id;
  }

  private enrichItems(order: Order): void {
    for (const item of order.items) {
      this.variantService.getVariantById(item.productVariantId).subscribe({
        next: variant => {
          item.productName = variant.productName;
          item.variantAttribute = variant.attribute;
          this.cdr.markForCheck();
        },
        error: () => {
          // La orden conserva los datos económicos aunque la variante ya no exista.
        }
      });
    }
  }

  private loadPayment(orderId: string): void {
    if (!this.authService.hasPermission('PAYMENT_READ')) {
      this.payment = null;
      return;
    }

    this.paymentService.getByOrder(orderId).subscribe({
      next: payment => {
        this.payment = payment;
        this.cdr.markForCheck();
      },
      error: error => {
        if (error?.status !== 404) {
          // No bloquea la vista del pedido: el pago es información complementaria.
          console.error('No se pudo obtener el pago del pedido:', error);
        }

        this.payment = null;
        this.cdr.markForCheck();
      }
    });
  }

  private resolveError(error: any, fallback: string): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    return error?.error?.message || fallback;
  }
}
