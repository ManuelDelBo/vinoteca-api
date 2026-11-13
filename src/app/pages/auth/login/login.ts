import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../shared/modal/modal.service';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  loginForm!: FormGroup

  private modal = inject(ModalService);

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
      this.loginForm.markAllAsTouched();
      return
    }

    const credenciales = this.loginForm.value

    this.authService.login(credenciales).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (e) => {
        if (e.status === 401) {
          this.modal.error(
            'No pudimos iniciar sesión',
            'El usuario o la contraseña son incorrectos. Revisá los datos e intentá nuevamente.'
          );
        } else {
          console.error(e);
          this.modal.error(
            'No pudimos iniciar sesión',
            'Verificá que el servidor esté funcionando e intentá nuevamente.'
          );
        }
      }
    })
  }
}
