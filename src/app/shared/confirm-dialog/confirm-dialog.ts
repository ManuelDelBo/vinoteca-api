import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';

export type DialogVariant =
  | 'confirm'
  | 'danger'
  | 'success'
  | 'error'
  | 'warning'
  | 'info';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog implements AfterViewInit, OnDestroy {

  @Input({ required: true }) title = '';
  @Input() message = '';
  @Input() detail = '';
  @Input() warning = '';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';
  @Input() busy = false;
  @Input() showCancel = true;
  @Input() variant: DialogVariant = 'confirm';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('dialogCard') private dialogCard?: ElementRef<HTMLElement>;
  @ViewChild('confirmButton') private confirmButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('cancelButton') private cancelButton?: ElementRef<HTMLButtonElement>;

  private previousOverflow = '';

  get icon(): string {
    switch (this.variant) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'danger':
      case 'warning':
        return '!';
      case 'info':
        return 'i';
      default:
        return '?';
    }
  }

  ngAfterViewInit(): void {
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const target = this.variant === 'danger'
      ? this.cancelButton?.nativeElement
      : this.confirmButton?.nativeElement;

    target?.focus();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.previousOverflow;
  }

  onConfirm(): void {
    if (this.busy) {
      return;
    }

    this.confirmed.emit();
  }

  onCancel(): void {
    if (this.busy) {
      return;
    }

    this.cancelled.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onCancel();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    const card = this.dialogCard?.nativeElement;

    if (!card) {
      return;
    }

    const focusable = Array.from(
      card.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(element => element.offsetParent !== null);

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && (active === first || !card.contains(active))) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && (active === last || !card.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }
}