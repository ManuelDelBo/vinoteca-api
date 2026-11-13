import { Component, inject } from '@angular/core';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-modal-host',
  standalone: true,
  imports: [ConfirmDialog],
  template: `
    @if (modal.current(); as state) {
      <app-confirm-dialog
        [title]="state.title"
        [message]="state.message ?? ''"
        [detail]="state.detail ?? ''"
        [warning]="state.warning ?? ''"
        [confirmLabel]="state.confirmLabel ?? (state.showCancel === false ? 'Entendido' : 'Confirmar')"
        [cancelLabel]="state.cancelLabel ?? 'Cancelar'"
        [showCancel]="state.showCancel !== false"
        [variant]="state.variant ?? 'confirm'"
        (confirmed)="modal.resolve(true)"
        (cancelled)="modal.resolve(false)" />
    }
  `,
})
export class ModalHost {
  readonly modal = inject(ModalService);
}
