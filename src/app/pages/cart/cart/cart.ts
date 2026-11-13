import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { Cart as CartModel, CartItem } from '../../../models/cart';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../shared/modal/modal.service';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-cart',
  styleUrl: './cart.css',
  templateUrl: './cart.html',
})
export class Cart implements OnInit {

  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private modal = inject(ModalService);

  cart: CartModel | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';
  updatingItemId: string | null = null;
  removingItemId: string | null = null;
  clearingCart = false;

  private subscription?: Subscription;

  get loggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get totalUnits(): number {
    return (this.cart?.cartItems ?? []).reduce((sum, item) => sum + item.quantity, 0);
  }

  ngOnInit(): void {
    if (!this.loggedIn) {
      this.loading = false;
      return;
    }

    this.subscription = this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cdr.markForCheck();
    });

    this.loadCart();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadCart(): void {
    this.loading = true;
    this.errorMessage = '';

    this.cartService.getCartOrNull().subscribe({
      next: cart => {
        this.loading = false;

        if (!cart) {
          this.errorMessage = '';
        }

        this.cdr.markForCheck();
      },
      error: error => {
        this.loading = false;
        this.errorMessage = this.resolveError(error, 'No se pudo cargar el carrito.');
        this.cdr.markForCheck();
      }
    });
  }

  changeQuantity(item: CartItem, delta: number): void {
    this.errorMessage = '';
    this.successMessage = '';

    const newQuantity = item.quantity + delta;

    if (newQuantity < 1) {
      this.errorMessage = 'La cantidad mínima es 1. Usá "Eliminar" para quitar el producto.';
      this.cdr.markForCheck();
      return;
    }

    this.updatingItemId = item.productVariantId;
    this.cdr.markForCheck();

    this.cartService.updateItemQuantity(item.productVariantId, Math.max(0, newQuantity)).subscribe({
      next: () => {
        this.updatingItemId = null;
        this.cdr.markForCheck();
      },
      error: error => {
        this.updatingItemId = null;
        this.errorMessage = this.resolveError(error, 'No se pudo actualizar la cantidad.');
        this.cdr.markForCheck();
      }
    });
  }

  setQuantity(item: CartItem, input: HTMLInputElement): void {
    const parsed = Number(input.value);

    if (!Number.isFinite(parsed) || parsed < 1) {
      this.errorMessage = 'La cantidad mínima es 1. Usá "Eliminar" para quitar el producto.';
      input.value = String(item.quantity);
      this.cdr.markForCheck();
      return;
    }

    const newQuantity = Math.floor(parsed);

    this.updatingItemId = item.productVariantId;
    this.cdr.markForCheck();

    this.cartService.updateItemQuantity(item.productVariantId, newQuantity).subscribe({
      next: () => {
        this.updatingItemId = null;
        this.cdr.markForCheck();
      },
      error: error => {
        this.updatingItemId = null;
        this.errorMessage = this.resolveError(error, 'No se pudo actualizar la cantidad.');
        this.cdr.markForCheck();
      }
    });
  }

  async removeItem(item: CartItem): Promise<void> {
    if (this.removingItemId || this.updatingItemId) {
      return;
    }

    const confirmed = await this.modal.confirm({
      title: 'Quitar producto',
      message: `¿Querés quitar "${item.productName}" del carrito?`,
      confirmLabel: 'Quitar',
      cancelLabel: 'Cancelar',
      variant: 'danger'
    });

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.removingItemId = item.productVariantId;
    this.cdr.markForCheck();

    this.cartService.removeItem(item.productVariantId).subscribe({
      next: cart => {
        this.removingItemId = null;
        this.cart = cart.cartItems.length > 0 ? cart : null;
        this.successMessage = 'Producto eliminado del carrito.';
        this.cdr.markForCheck();
      },
      error: error => {
        this.removingItemId = null;
        this.errorMessage = this.resolveError(error, 'No se pudo eliminar el producto.');
        this.cdr.markForCheck();
      }
    });
  }

  clearCart(): void {
    if (!this.cart || this.clearingCart) {
      return;
    }

    this.clearingCart = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.cartService.clearCart().subscribe({
      next: () => {
        this.clearingCart = false;
        this.cart = null;
        this.successMessage = 'Se vació el carrito.';
        this.cdr.markForCheck();
      },
      error: error => {
        this.clearingCart = false;
        this.errorMessage = this.resolveError(error, 'No se pudo vaciar el carrito.');
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

  private resolveError(error: any, fallback: string): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    return error?.error?.message || fallback;
  }
}
