import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ORDER_STATUS_LABELS, OrderStatus, OrderSummary } from '../../../models/order';
import { AuthService } from '../../../services/auth.service';
import { OrderService } from '../../../services/order.service';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-order-list',
  styleUrl: './order-list.css',
  templateUrl: './order-list.html',
})
export class OrderList implements OnInit {

  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  orders: OrderSummary[] = [];
  loading = false;
  errorMessage = '';

  get isStaff(): boolean {
    return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_EMPLOYEE');
  }

  get detailBase(): string {
    return this.isStaff ? '/management/orders' : '/orders';
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const operation = this.isStaff
      ? this.orderService.getAllOrders()
      : this.orderService.getMyOrders();

    operation.subscribe({
      next: orders => {
        this.orders = orders;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.loading = false;
        this.errorMessage = this.resolveError(error, 'No se pudieron cargar los pedidos.');
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

  orderNumber(id: string): string {
    return `#${id.slice(0, 8).toUpperCase()}`;
  }

  trackById(_index: number, order: OrderSummary): string {
    return order.id;
  }

  private resolveError(error: any, fallback: string): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    return error?.error?.message || fallback;
  }
}
