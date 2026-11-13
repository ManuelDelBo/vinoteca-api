import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { BrandService } from '../../../services/brand.service';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { SupplierService } from '../../../services/supplier.service';
import { ModalService } from '../../../shared/modal/modal.service';
import { Product } from '../../../models/product';
import { ProductList } from './product-list';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  name: 'Malbec Reserva',
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
  minPrice: 1500,
  ...overrides
});

describe('ProductList', () => {
  let fixture: ComponentFixture<ProductList>;
  let component: ProductList;
  let productService: {
    getProducts: ReturnType<typeof vi.fn>;
    getInactiveProducts: ReturnType<typeof vi.fn>;
    deleteProduct: ReturnType<typeof vi.fn>;
    activateProduct: ReturnType<typeof vi.fn>;
  };
  let router: { url: string; navigate: ReturnType<typeof vi.fn> };

  const configure = async (
    params: Record<string, string>,
    products: Product[] = [makeProduct()]
  ) => {
    productService = {
      getProducts: vi.fn().mockReturnValue(of(products)),
      getInactiveProducts: vi.fn().mockReturnValue(of(products)),
      deleteProduct: vi.fn(),
      activateProduct: vi.fn()
    };

    router = {
      url: '/products',
      navigate: vi.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [ProductList],
      providers: [
        { provide: ProductService, useValue: productService },
        {
          provide: CategoryService,
          useValue: {
            getCategories: () => of([
              { id: 'cat-1', name: 'Tintos', active: true }
            ])
          }
        },
        {
          provide: BrandService,
          useValue: {
            getBrands: () => of([
              { id: 'brand-1', name: 'Marca Test', active: true }
            ])
          }
        },
        {
          provide: SupplierService,
          useValue: {
            getSuppliers: () => of([
              { id: 'sup-1', name: 'Bodega Test', active: true }
            ])
          }
        },
        { provide: ModalService, useValue: { confirm: vi.fn() } },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(params) },
            queryParamMap: of(convertToParamMap(params)),
            navigate: vi.fn()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('should request products filtered by supplier when supplierId is present', async () => {
    await configure({ supplierId: 'sup-1', supplierName: 'Bodega Test' });

    expect(productService.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ supplierId: 'sup-1' })
    );
    expect(component.hasEntityFilter).toBe(true);
    expect(component.contextLabel).toContain('Bodega Test');

    const banner = fixture.nativeElement.querySelector('.context-banner');
    expect(banner?.textContent).toContain('Mostrando productos filtrados por');
    expect(banner?.textContent).toContain('Quitar filtro');
  });

  it('should request products filtered by category and brand', async () => {
    await configure({ categoryId: 'cat-1', brandId: 'brand-1' });

    expect(productService.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-1', brandId: 'brand-1' })
    );
    expect(component.contextLabel).toContain('Categoría: Tintos');
    expect(component.contextLabel).toContain('Marca: Marca Test');
  });

  it('should clear the entity filter and reload the catalog', async () => {
    await configure({ supplierId: 'sup-1', supplierName: 'Bodega Test' });
    productService.getProducts.mockClear();

    component.removeContextFilter();

    expect(component.hasEntityFilter).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: {} })
    );
    expect(productService.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ supplierId: undefined })
    );
  });

  it('should render the backend minimum price and the unavailable state', async () => {
    await configure({}, [
      makeProduct({ id: 'a', name: 'Con precio', minPrice: 2500 }),
      makeProduct({ id: 'b', name: 'Sin stock', minPrice: null })
    ]);

    const priceValues = fixture.nativeElement.querySelectorAll('.price-value');
    const unavailable = fixture.nativeElement.querySelectorAll('.price-unavailable');

    expect(priceValues.length).toBe(1);
    expect(priceValues[0].textContent?.trim().length).toBeGreaterThan(0);
    expect(unavailable.length).toBe(1);
    expect(unavailable[0].textContent).toContain('Sin variantes disponibles');
  });

  it('should sort products by minimum price without breaking null prices', async () => {
    await configure({}, [
      makeProduct({ id: 'a', name: 'Caro', minPrice: 3000 }),
      makeProduct({ id: 'b', name: 'Sin precio', minPrice: null }),
      makeProduct({ id: 'c', name: 'Barato', minPrice: 1000 })
    ]);

    component.sortBy = 'price-asc';

    expect(component.sortedProducts.map(product => product.id)).toEqual(['c', 'a', 'b']);
  });
});
