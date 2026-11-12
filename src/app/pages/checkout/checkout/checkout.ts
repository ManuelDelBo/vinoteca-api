import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Address } from '../../../models/address';
import { Cart as CartModel, CartItem } from '../../../models/cart';
import { CheckoutRequest, DeliveryType } from '../../../models/order';
import { AddressService } from '../../../services/address.service';
import { CartService } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';
import { UserService } from '../../../services/user.service';

const IDEMPOTENCY_STORAGE_KEY = 'vinoteca.checkout.idempotency';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-checkout',
  styleUrl: './checkout.css',
  templateUrl: './checkout.html',
})
export class Checkout implements OnInit {

  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private addressService = inject(AddressService);
  private userService = inject(UserService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  form = this.fb.group({
    deliveryType: ['DELIVERY' as DeliveryType, Validators.required],
    addressId: ['']
  });

  cart: CartModel | null = null;
  addresses: Address[] = [];

  loading = true;
  loadingAddresses = false;
  submitting = false;

  errorMessage = '';
  showAddressError = false;

  ngOnInit(): void {
    this.form.get('deliveryType')?.valueChanges.subscribe(() => {
      if (this.isDelivery && !this.form.value.addressId && this.addresses.length > 0) {
        this.form.patchValue({ addressId: this.addresses[0].externalId });
      }

      this.cdr.markForCheck();
    });

    this.form.get('addressId')?.valueChanges.subscribe(() => {
      this.showAddressError = false;
      this.cdr.markForCheck();
    });

    this.loadCart();
    this.loadAddresses();
  }

  get isDelivery(): boolean {
    return this.form.value.deliveryType === 'DELIVERY';
  }

  get totalUnits(): number {
    return (this.cart?.cartItems ?? []).reduce((sum, item) => sum + item.quantity, 0);
  }

  loadCart(): void {
    this.loading = true;
    this.errorMessage = '';

    this.cartService.getCartOrNull().subscribe({
      next: cart => {
        this.cart = cart;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.loading = false;
        this.errorMessage = this.resolveError(error, 'No se pudo cargar el carrito.');
        this.cdr.markForCheck();
      }
    });
  }

  loadAddresses(): void {
    this.loadingAddresses = true;

    this.userService.getMe().subscribe({
      next: user => {
        this.addressService.getAddressesByUser(user.id).subscribe({
          next: addresses => {
            this.addresses = addresses;
            this.loadingAddresses = false;

            if (this.isDelivery && !this.form.value.addressId && addresses.length > 0) {
              this.form.patchValue({ addressId: addresses[0].externalId });
            }

            this.cdr.markForCheck();
          },
          error: () => {
            this.loadingAddresses = false;
            this.addresses = [];
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        this.loadingAddresses = false;
        this.addresses = [];
        this.cdr.markForCheck();
      }
    });
  }

  lineTotal(item: CartItem): number {
    return item.unitPrice * item.quantity;
  }

  trackByVariant(_index: number, item: CartItem): string {
    return item.productVariantId;
  }

  trackByAddress(_index: number, address: Address): string {
    return address.externalId;
  }

  confirm(): void {
    if (this.submitting) {
      return;
    }

    this.errorMessage = '';
    this.showAddressError = false;

    if (!this.cart || this.cart.cartItems.length === 0) {
      this.errorMessage = 'No hay productos para confirmar.';
      this.cdr.markForCheck();
      return;
    }

    if (this.isDelivery && !this.form.value.addressId) {
      this.showAddressError = true;
      this.errorMessage = 'Seleccioná una dirección de entrega.';
      this.cdr.markForCheck();
      return;
    }

    const request: CheckoutRequest = {
      deliveryType: this.form.value.deliveryType as DeliveryType,
      addressId: this.isDelivery ? this.form.value.addressId : null
    };

    const idempotencyKey = this.resolveIdempotencyKey(request);

    this.submitting = true;
    this.cdr.markForCheck();

    this.orderService.checkout(request, idempotencyKey).subscribe({
      next: outcome => {
        this.submitting = false;
        this.clearIdempotencyKeys();
        this.cartService.clearLocalState();

        this.router.navigate(['/orders', outcome.order.id], {
          queryParams: outcome.replayed
            ? { replayed: '1' }
            : { created: '1' }
        });
      },
      error: error => {
        this.submitting = false;

        if (error?.status === 409) {
          const backendMessage = this.resolveError(error, '');

          if (backendMessage.toLowerCase().includes('idempotency-key')) {
            this.discardIdempotencyKey(request);
            this.errorMessage = 'La operación cambió respecto del intento anterior. Volvé a confirmar el pedido.';
          } else {
            this.errorMessage = backendMessage || 'No se pudo confirmar el pedido. Revisá el carrito y volvé a intentarlo.';
          }
        } else {
          this.errorMessage = this.resolveError(error, 'No se pudo confirmar el pedido.');
        }

        this.cdr.markForCheck();
      }
    });
  }

  private resolveIdempotencyKey(request: CheckoutRequest): string {
    const signature = this.signature(request);
    const keys = this.readIdempotencyKeys();

    if (keys[signature]) {
      return keys[signature];
    }

    const key = this.generateKey();
    keys[signature] = key;
    this.writeIdempotencyKeys(keys);

    return key;
  }

  private discardIdempotencyKey(request: CheckoutRequest): void {
    const keys = this.readIdempotencyKeys();
    delete keys[this.signature(request)];
    this.writeIdempotencyKeys(keys);
  }

  private signature(request: CheckoutRequest): string {
    return `${request.deliveryType}|${request.addressId ?? ''}`;
  }

  private readIdempotencyKeys(): Record<string, string> {
    try {
      const raw = sessionStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
      return raw ? JSON.parse(raw) as Record<string, string> : {};
    } catch {
      return {};
    }
  }

  private writeIdempotencyKeys(keys: Record<string, string>): void {
    try {
      sessionStorage.setItem(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(keys));
    } catch {
      // Si el navegador bloquea sessionStorage, la clave igual se reutiliza
      // durante la vida de esta instancia del componente.
    }
  }

  private clearIdempotencyKeys(): void {
    try {
      sessionStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
    } catch {
      // Sin acción: no hay nada que limpiar.
    }
  }

  private generateKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

  private resolveError(error: any, fallback: string): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    return error?.error?.message || fallback;
  }
}
