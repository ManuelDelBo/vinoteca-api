import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-payment-list',
  styleUrl: './payment-list.css',
  templateUrl: './payment-list.html',
})
export class PaymentList {

  private fb = inject(FormBuilder);
  private router = inject(Router);

  searchForm = this.fb.group({
    orderId: ['', Validators.required]
  });

  errorMessage = '';

  search(): void {
    this.searchForm.markAllAsTouched();

    if (this.searchForm.invalid) {
      this.errorMessage = 'Ingresá el identificador de la orden.';
      return;
    }

    const orderId = (this.searchForm.value.orderId ?? '').trim();

    if (!orderId) {
      this.errorMessage = 'Ingresá el identificador de la orden.';
      return;
    }

    this.errorMessage = '';
    this.router.navigate(['/management/payments', orderId]);
  }
}
