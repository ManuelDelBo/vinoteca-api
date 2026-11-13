import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<ConfirmDialog>;
  let component: ConfirmDialog;

  const create = async (inputs: Record<string, unknown> = {}) => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('title', 'Título de prueba');
    fixture.componentRef.setInput('message', 'Mensaje de prueba');

    Object.entries(inputs).forEach(([key, value]) => {
      fixture.componentRef.setInput(key, value);
    });

    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  afterEach(() => {
    fixture?.destroy();
    fixture?.nativeElement.remove();
    document.body.style.overflow = '';
  });

  it('should not close when clicking the backdrop or the card', async () => {
    await create();

    const cancelled = vi.fn();
    component.cancelled.subscribe(cancelled);

    (fixture.nativeElement.querySelector('.dialog-backdrop') as HTMLElement).click();
    (fixture.nativeElement.querySelector('.dialog-card') as HTMLElement).click();

    expect(cancelled).not.toHaveBeenCalled();
  });

  it('should emit cancelled only from the explicit cancel button', async () => {
    await create();

    const cancelled = vi.fn();
    component.cancelled.subscribe(cancelled);

    (fixture.nativeElement.querySelector('.btn-cancel') as HTMLButtonElement).click();

    expect(cancelled).toHaveBeenCalledTimes(1);
  });

  it('should emit confirmed from the confirm button', async () => {
    await create({ confirmLabel: 'Eliminar', variant: 'danger' });

    const confirmed = vi.fn();
    component.confirmed.subscribe(confirmed);

    const button = fixture.nativeElement.querySelector('.btn-confirm') as HTMLButtonElement;
    expect(button.textContent).toContain('Eliminar');

    button.click();

    expect(confirmed).toHaveBeenCalledTimes(1);
  });

  it('should hide the cancel button for informational alerts', async () => {
    await create({ showCancel: false, variant: 'success' });

    expect(fixture.nativeElement.querySelector('.btn-cancel')).toBeNull();
    expect(fixture.nativeElement.querySelector('.dialog-icon')?.textContent).toContain('✓');
  });

  it('should focus the safe action for danger confirmations', async () => {
    await create({ variant: 'danger' });

    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('.btn-cancel')
    );
  });

  it('should close with Escape when it is not busy', async () => {
    await create();

    const cancelled = vi.fn();
    component.cancelled.subscribe(cancelled);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(cancelled).toHaveBeenCalledTimes(1);
  });

  it('should ignore Escape and actions while busy', async () => {
    await create({ busy: true });

    const cancelled = vi.fn();
    const confirmed = vi.fn();
    component.cancelled.subscribe(cancelled);
    component.confirmed.subscribe(confirmed);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    (fixture.nativeElement.querySelector('.btn-confirm') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.btn-cancel') as HTMLButtonElement).click();

    expect(cancelled).not.toHaveBeenCalled();
    expect(confirmed).not.toHaveBeenCalled();
  });
});
