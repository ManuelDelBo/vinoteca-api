import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { AddressService } from '../../services/address.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user';
import { Profile } from './profile';

const customer: User = {
  id: 'user-1',
  email: 'ana@test.com',
  name: 'Ana',
  lastName: 'Pérez',
  roles: ['ROLE_CUSTOMER'],
  active: true
};

const employee: User = {
  ...customer,
  id: 'user-2',
  email: 'empleado@test.com',
  roles: ['ROLE_EMPLOYEE']
};

describe('Profile (CUSTOMER self edition)', () => {
  let fixture: ComponentFixture<Profile>;
  let component: Profile;
  let userService: {
    getMe: ReturnType<typeof vi.fn>;
    updateMyProfile: ReturnType<typeof vi.fn>;
  };
  let authService: { logout: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const configure = async (
    user: User,
    queryParams: Record<string, string> = {}
  ) => {
    userService = {
      getMe: vi.fn().mockReturnValue(of(user)),
      updateMyProfile: vi.fn().mockImplementation((payload: any) =>
        of({ ...user, ...payload })
      )
    };

    authService = { logout: vi.fn() };
    router = { navigate: vi.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        { provide: UserService, useValue: userService },
        {
          provide: AddressService,
          useValue: {
            getAddressesByUser: () => of([]),
            createAddress: () => of({}),
            updateAddress: () => of({}),
            deleteAddress: () => of(void 0)
          }
        },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(queryParams) },
            queryParamMap: of(convertToParamMap(queryParams))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('should show the edit action only for customers', async () => {
    await configure(customer);

    const editButton = fixture.nativeElement.querySelector('.profile-edit-btn');
    expect(editButton).not.toBeNull();
    expect(editButton.textContent).toContain('Editar perfil');
  });

  it('should not allow employees to edit their profile', async () => {
    await configure(employee);

    expect(fixture.nativeElement.querySelector('.profile-edit-btn')).toBeNull();

    component.startProfileEdit();
    fixture.detectChanges();

    expect(component.editingProfile()).toBe(false);
  });

  it('should open the edit form directly when ?edit=1 is present', async () => {
    await configure(customer, { edit: '1' });

    expect(component.editingProfile()).toBe(true);
    expect(fixture.nativeElement.querySelector('.profile-form')).not.toBeNull();
  });

  it('should update name, lastName and email through the self profile endpoint', async () => {
    await configure(customer);
    component.startProfileEdit();

    component.profileForm.patchValue({
      name: 'Ana María',
      lastName: 'Pérez',
      email: 'ana@test.com'
    });

    component.saveProfile();

    expect(userService.updateMyProfile).toHaveBeenCalledWith({
      name: 'Ana María',
      lastName: 'Pérez',
      email: 'ana@test.com'
    });
    expect(component.profileSuccess()).toContain('Perfil actualizado correctamente');
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should force a re-login when the email changes', async () => {
    await configure(customer);
    component.startProfileEdit();

    component.profileForm.patchValue({
      name: 'Ana',
      lastName: 'Pérez',
      email: 'nueva@test.com'
    });

    component.saveProfile();

    expect(userService.updateMyProfile).toHaveBeenCalledWith({
      name: 'Ana',
      lastName: 'Pérez',
      email: 'nueva@test.com'
    });
    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/login'],
      expect.objectContaining({ queryParams: { emailChanged: '1' } })
    );
  });

  it('should reject invalid fields before calling the API', async () => {
    await configure(customer);
    component.startProfileEdit();

    component.profileForm.patchValue({
      name: '   ',
      lastName: 'Pérez',
      email: 'no-es-email'
    });

    component.saveProfile();

    expect(userService.updateMyProfile).not.toHaveBeenCalled();
    expect(component.profileFormError()).toContain('Revisá los datos');
  });
});
