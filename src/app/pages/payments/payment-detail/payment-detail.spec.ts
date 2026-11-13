import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Payment } from '../../../models/payment';
import { PaymentService } from '../../../services/payment.service';
import { PaymentDetail } from './payment-detail';

const payment: Payment = {
  id: 'payment-1',
  orderId: 'order-1',
  paymentMethod: 'CREDIT_CARD',
  amount: 4500,
  status: 'APPROVED',
  createdAt: '2026-01-10T12:00:00Z'
};

describe('PaymentDetail', () => {
  let fixture: ComponentFixture<PaymentDetail>;
  let component: PaymentDetail;

  const configure = async (orderId: string) => {
    await TestBed.configureTestingModule({
      imports: [PaymentDetail],
      providers: [
        provideRouter([]),
        {
          provide: PaymentService,
          useValue: { getByOrder: () => of(payment) }
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: orderId }) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('should load and render the payment of the order', async () => {
    await configure('order-1');

    const element = fixture.nativeElement as HTMLElement;

    expect(component.payment?.id).toBe('payment-1');
    expect(element.textContent).toContain('Aprobado');
    expect(element.textContent).toContain('Tarjeta de crédito');
    expect(element.textContent).toContain('order-1');
  });

  it('should report a missing order identifier', async () => {
    await configure('');

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toContain('No se indicó una orden');
  });
});
