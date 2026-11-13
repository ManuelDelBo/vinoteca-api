import { CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';

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
        this.cdr.markForCheck();

        this.productService.getProducts().subscribe({
            next: products => {
                this.featuredProducts = products
                    .filter(product => product.active)
                    .slice(0, 4)
                    .map(product => ({
                        product,
                        minPrice: product.minPrice
                    }));

                this.loadingProducts = false;
                this.cdr.markForCheck();
            },
            error: error => {
                console.error('Error cargando productos destacados:', error);
                this.featuredProducts = [];
                this.productsError = true;
                this.loadingProducts = false;
                this.cdr.markForCheck();
            }
        });
    }
}
