import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Address } from '../../../models/address';
import { Cart as CartModel } from '../../../models/cart';
import { AddressService } from '../../../services/address.service';
import { CartService } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';
import { UserService } from '../../../services/user.service';
import { Checkout } from './checkout';

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

const address: Address = {
  externalId: 'addr-1',
  userExternalId: 'user-1',
  street: 'Av. Siempre Viva',
  streetNumber: '742',
  city: 'Buenos Aires',
  zipCode: '1000',
  floor: null,
  apartmentNumber: null
};

describe('Checkout', () => {
  let fixture: ComponentFixture<Checkout>;
  let component: Checkout;
  let cartService: {
    getCartOrNull: ReturnType<typeof vi.fn>;
    clearLocalState: ReturnType<typeof vi.fn>;
  };
  let orderService: { checkout: ReturnType<typeof vi.fn> };
  let router: Router;

  const configure = async (currentCart: CartModel | null, addresses: Address[] = []) => {
    cartService = {
      getCartOrNull: vi.fn().mockReturnValue(of(currentCart)),
      clearLocalState: vi.fn()
    };

    orderService = {
      checkout: vi.fn().mockReturnValue(of({
        order: { id: 'order-1' },
        replayed: false
      }))
    };

    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: cartService },
        { provide: OrderService, useValue: orderService },
        {
          provide: UserService,
          useValue: { getMe: () => of({ id: 'user-1' }) }
        },
        {
          provide: AddressService,
          useValue: { getAddressesByUser: () => of(addresses) }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('should render the cart summary', async () => {
    await configure(cart, [address]);

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Malbec Reserva');
    expect(component.totalUnits).toBe(2);
    expect(component.addresses.length).toBe(1);
  });

  it('should block the checkout when the cart is empty', async () => {
    await configure(null);

    component.confirm();

    expect(component.errorMessage).toContain('No hay productos');
    expect(orderService.checkout).not.toHaveBeenCalled();
  });

  it('should require an address for delivery orders', async () => {
    await configure(cart, []);

    component.confirm();

    expect(component.showAddressError).toBe(true);
    expect(component.errorMessage).toContain('Seleccioná una dirección');
    expect(orderService.checkout).not.toHaveBeenCalled();
  });

  it('should confirm the checkout with an idempotency key', async () => {
    await configure(cart, [address]);
    component.form.patchValue({ deliveryType: 'DELIVERY', addressId: 'addr-1' });

    component.confirm();

    expect(orderService.checkout).toHaveBeenCalledWith(
      { deliveryType: 'DELIVERY', addressId: 'addr-1' },
      expect.any(String)
    );
    expect(cartService.clearLocalState).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/orders', 'order-1'],
      expect.objectContaining({ queryParams: { created: '1' } })
    );
  });

  it('should send a pickup order without an address', async () => {
    await configure(cart, []);
    component.form.patchValue({ deliveryType: 'PICKUP', addressId: '' });

    component.confirm();

    expect(orderService.checkout).toHaveBeenCalledWith(
      { deliveryType: 'PICKUP', addressId: null },
      expect.any(String)
    );
  });
});
