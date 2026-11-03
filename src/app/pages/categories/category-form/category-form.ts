import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category';

@Component({
    imports: [FormsModule],
    selector: 'app-category-form',
    styleUrl: './category-form.css',
    templateUrl: './category-form.html',
})
export class CategoryForm implements OnInit {

    category: Category = {
        id: '',
        name: '',
        active: true
    };

    editMode = false;

    constructor(
        private categoryService: CategoryService,
        private route: ActivatedRoute,
        private router: Router,
        private changeDetector: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.editMode = true;
            this.loadCategory(id);
        }
    }

    loadCategory(id: string): void {
        this.categoryService.getCategoryById(id).subscribe(data => {
            this.category = data;
            this.changeDetector.markForCheck();
        });
    }

    saveCategory(): void {
        if (!this.category.name.trim()) return;

        if (this.editMode) {
            this.categoryService.updateCategory(this.category).subscribe({
                next: () => {
                    this.router.navigate(['/management/categories']);
                }
            });
        } else {
            this.categoryService.addCategory(this.category).subscribe({
                next: () => {
                    this.router.navigate(['/management/categories']);
                }
            });
        }
    }

    cancel(): void {
        this.router.navigate(['/management/categories']);
    }
}
