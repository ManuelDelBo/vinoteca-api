import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BrandService } from '../../../services/brand.service';
import { Brand } from '../../../models/brand';
import { ModalService } from '../../../shared/modal/modal.service';

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
    private changeDetector = inject(ChangeDetectorRef);
    private modal = inject(ModalService);

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
            this.changeDetector.markForCheck();
        });
    }

    saveBrand(): void {

        if (this.editMode) {
            this.brandService.updateBrand(this.brand).subscribe({
                next: async () => {
                    await this.modal.success('Marca actualizada', 'Los cambios se guardaron correctamente.');
                    this.router.navigate(['/management/brands']);
                },
                error: () => {
                    this.modal.error('No se pudo actualizar la marca', 'Intentá nuevamente en unos instantes.');
                }
            });

        } else {
            this.brandService.addBrand(this.brand).subscribe({
                next: async () => {
                    await this.modal.success('Marca creada', 'La marca se creó correctamente.');
                    this.router.navigate(['/management/brands']);
                },
                error: () => {
                    this.modal.error('No se pudo crear la marca', 'Intentá nuevamente en unos instantes.');
                }
            });
        }
    }

    cancel(): void {
        this.router.navigate(['/management/brands']);
    }
}
