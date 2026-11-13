import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../../../services/auth.service';
import { OrderService } from '../../../services/order.service';
import { OrderSummary } from '../../../models/order';
import { OrderList } from './order-list';

const order: OrderSummary = {
  id: 'order-12345678',
  total: 4500,
  status: 'PENDING_PAYMENT',
  createdAt: '2026-01-10T12:00:00Z',
  customerName: 'Ana Pérez'
};

describe('OrderList (customer filter)', () => {
  let fixture: ComponentFixture<OrderList>;
  let component: OrderList;
  let orderService: {
    getAllOrders: ReturnType<typeof vi.fn>;
    getOrdersByUser: ReturnType<typeof vi.fn>;
    getMyOrders: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const configure = async (
    params: Record<string, string>,
    permissions: { admin?: boolean; orderReadAll?: boolean } = {}
  ) => {
    orderService = {
      getAllOrders: vi.fn().mockReturnValue(of([order])),
      getOrdersByUser: vi.fn().mockReturnValue(of([order])),
      getMyOrders: vi.fn().mockReturnValue(of([order]))
    };

    router = { navigate: vi.fn().mockResolvedValue(true) };

    const roles = permissions.admin ? ['ROLE_ADMIN'] : ['ROLE_EMPLOYEE'];

    await TestBed.configureTestingModule({
      imports: [OrderList],
      providers: [
        { provide: OrderService, useValue: orderService },
        {
          provide: AuthService,
          useValue: {
            hasRole: (role: string) => roles.includes(role),
            hasPermission: (permission: string) =>
              permission === 'ORDER_READ_ALL' && !!permissions.orderReadAll
          }
        },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap(params)),
            snapshot: { queryParamMap: convertToParamMap(params) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('should load the orders of the selected customer', async () => {
    await configure({ userId: 'user-1', userName: 'Ana Pérez' }, { admin: true });

    expect(orderService.getOrdersByUser).toHaveBeenCalledWith('user-1');
    expect(component.hasUserFilter).toBe(true);

    const banner = fixture.nativeElement.querySelector('.context-banner');
    expect(banner?.textContent).toContain('Órdenes filtradas por cliente');
    expect(banner?.textContent).toContain('Ana Pérez');
  });

  it('should remove the customer filter and return to all orders', async () => {
    await configure({ userId: 'user-1', userName: 'Ana Pérez' }, { orderReadAll: true });

    component.removeUserFilter();

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: {} })
    );
  });

  it('should not offer to remove the filter without ORDER_READ_ALL', async () => {
    await configure({ userId: 'user-1', userName: 'Ana Pérez' });

    expect(component.canViewAllOrders).toBe(false);

    const button = fixture.nativeElement.querySelector('.context-banner .btn-clear');
    expect(button).toBeNull();
  });

  it('should keep the customer filter when navigating to the order detail', async () => {
    await configure({ userId: 'user-1', userName: 'Ana Pérez' }, { admin: true });

    expect(component.detailQueryParams).toEqual({
      userId: 'user-1',
      userName: 'Ana Pérez'
    });
  });

  it('should load all orders when no customer filter is present', async () => {
    await configure({}, { admin: true });

    expect(orderService.getAllOrders).toHaveBeenCalled();
    expect(component.hasUserFilter).toBe(false);
  });
});
