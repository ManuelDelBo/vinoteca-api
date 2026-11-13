import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { PaymentList } from './payment-list';

describe('PaymentList', () => {
  let fixture: ComponentFixture<PaymentList>;
  let component: PaymentList;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentList],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(PaymentList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should require an order identifier', () => {
    component.search();

    expect(component.errorMessage).toContain('Ingresá el identificador');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to the payment detail of the order', () => {
    component.searchForm.setValue({ orderId: 'order-123' });

    component.search();

    expect(router.navigate).toHaveBeenCalledWith([
      '/management/payments',
      'order-123'
    ]);
  });
});
