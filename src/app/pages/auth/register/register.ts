import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserRequest } from '../../../models/user';
import { ModalService } from '../../../shared/modal/modal.service';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register implements OnInit {
  registerForm!: FormGroup;

  private modal = inject(ModalService);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['ROLE_CUSTOMER', Validators.required]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const userData: UserRequest = this.registerForm.value;

    this.authService.register(userData).subscribe({
      next: async (usuario) => {
        await this.modal.success(
          '¡Cuenta creada!',
          `Bienvenido/a ${usuario.name} ${usuario.lastName}. Ya podés comenzar a comprar con ${usuario.email}.`
        );

        this.router.navigate(['/']);
      },
      error: (e) => {
        console.error(e);

        if (e.status === 409) {
          this.modal.error(
            'Email ya registrado',
            'Ese correo electrónico ya está registrado. Probá con otro o iniciá sesión.'
          );
        } else if (e.status === 400) {
          this.modal.error(
            'Datos inválidos',
            'Los datos ingresados no son válidos. Revisá el formulario e intentá nuevamente.'
          );
        } else {
          this.modal.error(
            'No pudimos crear tu cuenta',
            'Verificá que el servidor esté funcionando e intentá nuevamente.'
          );
        }
      }
    });
  }
}
