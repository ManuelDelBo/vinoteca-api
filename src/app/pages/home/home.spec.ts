import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product';
import { Home } from './home';

const makeProduct = (index: number, minPrice: number | null): Product => ({
  id: `prod-${index}`,
  name: `Vino ${index}`,
  description: null,
  active: true,
  supplierId: 'sup-1',
  supplierName: 'Bodega Test',
  categoryId: 'cat-1',
  categoryName: 'Tintos',
  brandId: 'brand-1',
  brandName: 'Marca Test',
  principalImagePath: null,
  images: [],
  minPrice
});

describe('Home featured products', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;

  const configure = async (products: Product[]) => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        {
          provide: ProductService,
          useValue: { getProducts: () => of(products) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('should render the four featured wines without user interaction', async () => {
    await configure([
      makeProduct(1, 1000),
      makeProduct(2, 2000),
      makeProduct(3, 3000),
      makeProduct(4, 4000),
      makeProduct(5, 5000)
    ]);

    const element = fixture.nativeElement as HTMLElement;
    const cards = element.querySelectorAll('.featured-card');

    expect(component.featuredProducts.length).toBe(4);
    expect(cards.length).toBe(4);
    expect(element.textContent).toContain('Descubrí nuestros');
    expect(element.querySelector('.featured-message')).toBeNull();
  });

  it('should display the backend minimum price and the consult state', async () => {
    await configure([
      makeProduct(1, 1500),
      makeProduct(2, null),
      makeProduct(3, 3500),
      makeProduct(4, 4500)
    ]);

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.featured-price strong').length).toBe(3);
    expect(element.textContent).toContain('Consultar opciones');
  });

  it('should only show active products', async () => {
    await configure([
      makeProduct(1, 1000),
      { ...makeProduct(2, 2000), active: false },
      makeProduct(3, 3000),
      makeProduct(4, 4000),
      makeProduct(5, 5000)
    ]);

    expect(component.featuredProducts.map(item => item.product.id))
      .toEqual(['prod-1', 'prod-3', 'prod-4', 'prod-5']);
  });
});
