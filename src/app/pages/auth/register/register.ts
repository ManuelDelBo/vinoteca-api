import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserRequest } from '../../../models/user';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register implements OnInit {
  registerForm!: FormGroup;

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

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      alert('Complete correctamente todos los campos.');
      return;
    }

    const userData: UserRequest = this.registerForm.value;

    this.authService.register(userData).subscribe({
      next: (usuario) => {
        alert(
          '¡Usuario creado exitosamente!\n\n' +
          'Nombre: ' + usuario.name + '\n' +
          'Apellido: ' + usuario.lastName + '\n' +
          'Email: ' + usuario.email + '\n'
        );

        this.router.navigate(['/']);
      },
      error: (e) => {
        console.error(e);

        if (e.status === 409) {
          alert('Ese correo electrónico ya está registrado.');
        } else if (e.status === 400) {
          alert('Los datos ingresados no son válidos.');
        } else {
          alert('No se pudo crear el usuario. Verifique que el servidor esté funcionando.');
        }
      }
    });
  }
}
