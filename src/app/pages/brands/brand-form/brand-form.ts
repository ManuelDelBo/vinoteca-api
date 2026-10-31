import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BrandService } from '../../../services/brand.service';
import { Brand } from '../../../models/brand';

@Component({
    imports: [FormsModule],
    selector: 'app-brand-form',
    styleUrl: './brand-form.css',
    templateUrl: './brand-form.html',
})
export class BrandForm implements OnInit {

    private brandService = inject(BrandService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    brand: Brand = {
        id: '',
        name: '',
        active: true
    };

    editMode = false;

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.editMode = true;
            this.loadBrand(id);
        }
    }

    loadBrand(id: string): void {
        this.brandService.getBrandById(id).subscribe(data => {
            this.brand = data;
        });
    }

    saveBrand(): void {

        if (this.editMode) {
            this.brandService.updateBrand(this.brand).subscribe(() => {
                alert('Marca actualizada correctamente');
                this.router.navigate(['/management/brands']);
            });

        } else {
            this.brandService.addBrand(this.brand).subscribe(() => {
                alert('Marca creada correctamente');
                this.router.navigate(['/management/brands']);
            });
        }
    }

    cancel(): void {
        this.router.navigate(['/management/brands']);
    }
}
