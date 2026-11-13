import { Injectable, signal } from '@angular/core';
import { DialogVariant } from '../confirm-dialog/confirm-dialog';

export interface ModalOptions {
  title: string;
  message?: string;
  detail?: string;
  warning?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  variant?: DialogVariant;
}

interface ModalState extends ModalOptions {
  resolve: (value: boolean) => void;
}

/**
 * Servicio de alertas y confirmaciones modales reutilizables.
 * Renderiza un único diálogo mediante <app-modal-host>.
 */
@Injectable({ providedIn: 'root' })
export class ModalService {

  private readonly state = signal<ModalState | null>(null);
  readonly current = this.state.asReadonly();

  confirm(options: ModalOptions): Promise<boolean> {
    return this.open({
      ...options,
      showCancel: options.showCancel !== false,
      variant: options.variant ?? 'confirm'
    });
  }

  alert(options: ModalOptions): Promise<boolean> {
    return this.open({
      ...options,
      showCancel: false,
      variant: options.variant ?? 'info'
    });
  }

  success(title: string, message?: string): Promise<boolean> {
    return this.alert({ title, message, variant: 'success' });
  }

  error(title: string, message?: string): Promise<boolean> {
    return this.alert({ title, message, variant: 'error' });
  }

  warning(title: string, message?: string): Promise<boolean> {
    return this.alert({ title, message, variant: 'warning' });
  }

  info(title: string, message?: string): Promise<boolean> {
    return this.alert({ title, message, variant: 'info' });
  }

  resolve(value: boolean): void {
    const current = this.state();

    if (!current) {
      return;
    }

    this.state.set(null);
    current.resolve(value);
  }

  private open(options: ModalOptions): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.state.set({ ...options, resolve });
    });
  }
}
