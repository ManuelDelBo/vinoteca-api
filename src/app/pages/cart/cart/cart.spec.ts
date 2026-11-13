import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';

import { Cart as CartModel } from '../../../models/cart';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { ModalService } from '../../../shared/modal/modal.service';
import { Cart } from './cart';

const cart: CartModel = {
  id: 'cart-1',
  userId: 'user-1',
  lastUpdated: '2026-01-10T12:00:00Z',
  totalAmount: 3000,
  cartItems: [
    {
      id: 'item-1',
      productVariantId: 'variant-1',
      productName: 'Malbec Reserva',
      variantAttribute: '750 ml',
      quantity: 2,
      unitPrice: 1500
    }
  ]
};

describe('Cart', () => {
  let fixture: ComponentFixture<Cart>;
  let component: Cart;
  let cartService: {
    cart$: Observable<CartModel | null>;
    getCartOrNull: ReturnType<typeof vi.fn>;
    updateItemQuantity: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clearCart: ReturnType<typeof vi.fn>;
    clearLocalState: ReturnType<typeof vi.fn>;
  };
  let modal: { confirm: ReturnType<typeof vi.fn> };

  const configure = async (currentCart: CartModel | null) => {
    cartService = {
      cart$: of(currentCart),
      getCartOrNull: vi.fn().mockReturnValue(of(currentCart)),
      updateItemQuantity: vi.fn().mockReturnValue(of(cart)),
      removeItem: vi.fn().mockReturnValue(of({ ...cart, cartItems: [] })),
      clearCart: vi.fn().mockReturnValue(of(void 0)),
      clearLocalState: vi.fn()
    };

    modal = { confirm: vi.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [Cart],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: cartService },
        { provide: AuthService, useValue: { isLoggedIn: () => true } },
        { provide: ModalService, useValue: modal }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Cart);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('should render the cart items and totals', async () => {
    await configure(cart);

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Malbec Reserva');
    expect(element.querySelectorAll('.cart-item').length).toBe(1);
    expect(component.totalUnits).toBe(2);
  });

  it('should show the empty state when there are no products', async () => {
    await configure(null);

    expect(fixture.nativeElement.textContent).toContain('Tu carrito está vacío');
  });

  it('should ask for confirmation before removing an item', async () => {
    await configure(cart);

    await component.removeItem(cart.cartItems[0]);

    expect(modal.confirm).toHaveBeenCalled();
    expect(cartService.removeItem).toHaveBeenCalledWith('variant-1');
    expect(component.successMessage).toContain('Producto eliminado');
  });

  it('should not remove the item when the confirmation is cancelled', async () => {
    await configure(cart);
    modal.confirm.mockResolvedValue(false);

    await component.removeItem(cart.cartItems[0]);

    expect(cartService.removeItem).not.toHaveBeenCalled();
  });
});
