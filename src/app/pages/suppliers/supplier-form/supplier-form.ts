import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupplierService } from '../../../services/supplier.service';
import { Supplier } from '../../../models/supplier';

@Component({
    imports: [FormsModule],
    selector: 'app-supplier-form',
    styleUrl: './supplier-form.css',
    templateUrl: './supplier-form.html',
})
export class SupplierForm implements OnInit {

    supplier: Supplier = {
        id: '',
        name: '',
        contact: '',
        active: true
    };

    editMode = false;

    constructor(
        private supplierService: SupplierService,
        private route: ActivatedRoute,
        private router: Router,
        private changeDetector: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.editMode = true;
            this.loadSupplier(id);
        }
    }

    loadSupplier(id: string): void {
        this.supplierService.getSupplierById(id).subscribe(data => {
            this.supplier = data;
            this.changeDetector.markForCheck();
        });
    }

    saveSupplier(): void {
        if (!this.supplier.name.trim() || !this.supplier.contact.trim()) return;

        if (this.editMode) {
            this.supplierService.updateSupplier(this.supplier).subscribe({
                next: () => {
                    this.router.navigate(['/management/suppliers']);
                }
            });
        } else {
            this.supplierService.addSupplier(this.supplier).subscribe({
                next: () => {
                    this.router.navigate(['/management/suppliers']);
                }
            });
        }
    }

    cancel(): void {
        this.router.navigate(['/management/suppliers']);
    }
}
