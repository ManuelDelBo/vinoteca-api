import { CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';
import { ProductVariantService } from '../../services/product-variant.service';

interface FeaturedProduct {
    product: Product;
    minPrice: number | null;
}

@Component({
    selector: 'app-home',
    imports: [RouterLink, CurrencyPipe],
    templateUrl: './home.html',
    styleUrl: './home.css',
})
export class Home implements OnInit {
    private productService = inject(ProductService);
    private variantService = inject(ProductVariantService);
    private cdr = inject(ChangeDetectorRef);

    featuredProducts: FeaturedProduct[] = [];
    loadingProducts = true;
    productsError = false;

    ngOnInit(): void {
        this.loadFeaturedProducts();
    }

    private loadFeaturedProducts(): void {
        this.loadingProducts = true;
        this.productsError = false;

        this.productService.getProducts().pipe(
            map(products => products.filter(product => product.active).slice(0, 4)),
            switchMap(products => {
                if (products.length === 0) {
                    return of([] as FeaturedProduct[]);
                }

                return forkJoin(products.map(product =>
                    this.variantService.getVariantsByProduct(product.id).pipe(
                        map(variants => {
                            const prices = variants
                                .filter(variant => variant.active && variant.price > 0)
                                .map(variant => variant.price);

                            return {
                                product,
                                minPrice: prices.length > 0 ? Math.min(...prices) : null
                            } as FeaturedProduct;
                        }),
                        catchError(() => of({ product, minPrice: null } as FeaturedProduct))
                    )
                ));
            })
        ).subscribe({
            next: products => {
                this.featuredProducts = products;
                this.loadingProducts = false;
                this.cdr.detectChanges();
            },
            error: error => {
                console.error('Error cargando productos destacados:', error);
                this.productsError = true;
                this.loadingProducts = false;
                this.cdr.detectChanges();
            }
        });
    }
}
