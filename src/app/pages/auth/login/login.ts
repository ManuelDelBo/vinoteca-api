import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  loginForm!: FormGroup

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    })
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      alert('Complete los campos.')
      return
    }

    const credenciales = this.loginForm.value

    this.authService.login(credenciales).subscribe({
      next: () => {
        alert('Inicio de sesión exitoso.');
        this.router.navigate(['/']);
      },
      error: (e) => {
        if (e.status === 401) {
          alert('Usuario o contraseña incorrectos.');
        } else {
          console.error(e);
          alert('No se pudo iniciar sesión. Verifique que el servidor esté funcionando.');
        }
      }
    })
  }
}
