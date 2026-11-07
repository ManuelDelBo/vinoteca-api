import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {

  @Input({ required: true }) title = '';
  @Input() message = '';
  @Input() detail = '';
  @Input() warning = '';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';
  @Input() busy = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onCancel(): void {
    if (this.busy) {
      return;
    }

    this.cancelled.emit();
  }

  onConfirm(): void {
    if (this.busy) {
      return;
    }

    this.confirmed.emit();
  }
}
