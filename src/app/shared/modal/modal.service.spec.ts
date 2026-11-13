import { TestBed } from '@angular/core/testing';

import { ModalService } from './modal.service';

describe('ModalService', () => {
  let service: ModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalService);
  });

  it('should open a confirmation with cancel and resolve true', async () => {
    const result = service.confirm({ title: 'Confirmar acción' });

    expect(service.current()?.showCancel).toBe(true);
    expect(service.current()?.variant).toBe('confirm');

    service.resolve(true);

    await expect(result).resolves.toBe(true);
    expect(service.current()).toBeNull();
  });

  it('should resolve false when cancelled', async () => {
    const result = service.confirm({ title: 'Confirmar acción' });

    service.resolve(false);

    await expect(result).resolves.toBe(false);
  });

  it('should open informational alerts without cancel', async () => {
    const result = service.alert({ title: 'Aviso' });

    expect(service.current()?.showCancel).toBe(false);
    expect(service.current()?.variant).toBe('info');

    service.resolve(true);

    await expect(result).resolves.toBe(true);
  });

  it('should expose semantic variants for success, error and warning', async () => {
    const success = service.success('Listo', 'Guardado');
    expect(service.current()?.variant).toBe('success');
    service.resolve(true);
    await success;

    const error = service.error('Error', 'Falló');
    expect(service.current()?.variant).toBe('error');
    service.resolve(true);
    await error;

    const warning = service.warning('Atención', 'Cuidado');
    expect(service.current()?.variant).toBe('warning');
    service.resolve(true);
    await warning;
  });

  it('should ignore resolve calls when no modal is open', () => {
    expect(() => service.resolve(true)).not.toThrow();
    expect(service.current()).toBeNull();
  });
});
