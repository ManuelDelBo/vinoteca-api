import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors
} from '@angular/forms';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { Address, AddressRequest } from '../../models/address';
import { Role, User } from '../../models/user';
import { AddressService } from '../../services/address.service';
import { UserService } from '../../services/user.service';

const trimmedRequired = (control: AbstractControl): ValidationErrors | null => {
    return typeof control.value === 'string' && control.value.trim().length > 0
        ? null
        : { required: true };
};

@Component({
    imports: [ReactiveFormsModule, ConfirmDialog],
    selector: 'app-profile',
    styleUrl: './profile.css',
    templateUrl: './profile.html',
})
export class Profile implements OnInit {

    user = signal<User | null>(null);
    addresses = signal<Address[]>([]);

    loadingProfile = signal(true);
    loadingAddresses = signal(false);
    savingAddress = signal(false);
    deletingAddress = signal(false);

    profileError = signal('');
    addressError = signal('');
    addressSuccess = signal('');

    showAddressForm = signal(false);
    editingAddressId = signal<string | null>(null);
    pendingDeletion = signal<Address | null>(null);

    addressForm: FormGroup;

    private readonly roleLabels: Record<Role, string> = {
        ROLE_GUEST: 'Invitado',
        ROLE_CUSTOMER: 'Cliente',
        ROLE_EMPLOYEE: 'Empleado',
        ROLE_ADMIN: 'Administrador',
    };

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private addressService: AddressService,
        private cdr: ChangeDetectorRef
    ) {
        this.addressForm = this.buildAddressForm();
    }

    ngOnInit(): void {
        this.loadProfile();
    }

    get isCustomer(): boolean {
        return this.user()?.roles?.includes('ROLE_CUSTOMER') ?? false;
    }

    get isEditing(): boolean {
        return this.editingAddressId() !== null;
    }

    loadProfile(): void {
        this.loadingProfile.set(true);
        this.profileError.set('');

        this.userService.getMe().subscribe({
            next: user => {
                this.user.set(user);
                this.loadingProfile.set(false);

                if (this.isCustomer) {
                    this.loadAddresses(user.id);
                }

                this.cdr.markForCheck();
            },
            error: () => {
                this.loadingProfile.set(false);
                this.profileError.set('No se pudieron cargar tus datos. Intentá nuevamente.');
                this.cdr.markForCheck();
            }
        });
    }

    retryLoadProfile(): void {
        this.loadProfile();
    }

    loadAddresses(userExternalId: string): void {
        this.loadingAddresses.set(true);
        this.addressError.set('');

        this.addressService.getAddressesByUser(userExternalId).subscribe({
            next: addresses => {
                this.addresses.set(addresses);
                this.loadingAddresses.set(false);
                this.cdr.markForCheck();
            },
            error: () => {
                this.loadingAddresses.set(false);
                this.addressError.set('No se pudieron cargar tus direcciones.');
                this.cdr.markForCheck();
            }
        });
    }

    startCreate(): void {
        if (this.savingAddress()) {
            return;
        }

        this.editingAddressId.set(null);
        this.addressForm = this.buildAddressForm();
        this.addressError.set('');
        this.addressSuccess.set('');
        this.showAddressForm.set(true);
        this.cdr.markForCheck();
    }

    startEdit(address: Address): void {
        if (this.savingAddress()) {
            return;
        }

        this.editingAddressId.set(address.externalId);
        this.addressForm = this.buildAddressForm(address);
        this.addressError.set('');
        this.addressSuccess.set('');
        this.showAddressForm.set(true);
        this.cdr.markForCheck();
    }

    cancelForm(): void {
        if (this.savingAddress()) {
            return;
        }

        this.resetAddressForm();
        this.cdr.markForCheck();
    }

    saveAddress(): void {
        if (this.savingAddress()) {
            return;
        }

        this.addressForm.markAllAsTouched();

        if (this.addressForm.invalid) {
            this.addressError.set('Completá calle, número, ciudad y código postal.');
            this.cdr.markForCheck();
            return;
        }

        const request = this.buildRequest();
        const editingId = this.editingAddressId();

        this.addressError.set('');
        this.addressSuccess.set('');
        this.savingAddress.set(true);
        this.cdr.markForCheck();

        const operation = editingId
            ? this.addressService.updateAddress(editingId, request)
            : this.addressService.createAddress(request);

        operation.subscribe({
            next: () => {
                this.savingAddress.set(false);
                this.addressSuccess.set(
                    editingId
                        ? 'Dirección actualizada correctamente.'
                        : 'Dirección agregada correctamente.'
                );
                this.resetAddressForm();
                this.reloadAddresses();
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.savingAddress.set(false);
                this.addressError.set(
                    this.resolveError(error, 'No se pudo guardar la dirección.')
                );
                this.cdr.markForCheck();
            }
        });
    }

    requestDelete(address: Address): void {
        if (this.deletingAddress() || this.savingAddress()) {
            return;
        }

        this.addressError.set('');
        this.addressSuccess.set('');
        this.pendingDeletion.set(address);
        this.cdr.markForCheck();
    }

    confirmDelete(): void {
        const address = this.pendingDeletion();

        if (!address || this.deletingAddress()) {
            return;
        }

        this.deletingAddress.set(true);
        this.cdr.markForCheck();

        this.addressService.deleteAddress(address.externalId).subscribe({
            next: () => {
                this.deletingAddress.set(false);
                this.pendingDeletion.set(null);
                this.addressSuccess.set('Dirección eliminada correctamente.');

                if (this.editingAddressId() === address.externalId) {
                    this.resetAddressForm();
                }

                this.reloadAddresses();
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.deletingAddress.set(false);
                this.pendingDeletion.set(null);
                this.addressError.set(
                    this.resolveError(error, 'No se pudo eliminar la dirección.')
                );
                this.cdr.markForCheck();
            }
        });
    }

    cancelDelete(): void {
        if (this.deletingAddress()) {
            return;
        }

        this.pendingDeletion.set(null);
        this.cdr.markForCheck();
    }

    deleteMessage(address: Address): string {
        return `¿Querés eliminar la dirección "${this.addressLabel(address)}"?`;
    }

    addressLabel(address: Address): string {
        return `${address.street} ${address.streetNumber}, ${address.city}`;
    }

    showError(controlName: string): boolean {
        const control = this.addressForm.get(controlName);

        return !!control && control.invalid && (control.touched || control.dirty);
    }

    roleLabel(role: Role): string {
        return this.roleLabels[role] ?? role;
    }

    initials(user: User): string {
        const first = user.name?.trim().charAt(0) ?? '';
        const last = user.lastName?.trim().charAt(0) ?? '';
        const initials = `${first}${last}`.toUpperCase();

        return initials || user.email.charAt(0).toUpperCase();
    }

    private reloadAddresses(): void {
        const userId = this.user()?.id;

        if (userId) {
            this.loadAddresses(userId);
        }
    }

    private buildAddressForm(address?: Address): FormGroup {
        return this.fb.group({
            street: [address?.street ?? '', trimmedRequired],
            streetNumber: [address?.streetNumber ?? '', trimmedRequired],
            city: [address?.city ?? '', trimmedRequired],
            zipCode: [address?.zipCode ?? '', trimmedRequired],
            floor: [address?.floor ?? ''],
            apartmentNumber: [address?.apartmentNumber ?? ''],
        });
    }

    private buildRequest(): AddressRequest {
        const raw = this.addressForm.getRawValue();

        return {
            street: raw.street.trim(),
            streetNumber: raw.streetNumber.trim(),
            city: raw.city.trim(),
            zipCode: raw.zipCode.trim(),
            floor: this.cleanOptional(raw.floor),
            apartmentNumber: this.cleanOptional(raw.apartmentNumber),
        };
    }

    private resetAddressForm(): void {
        this.showAddressForm.set(false);
        this.editingAddressId.set(null);
        this.addressForm = this.buildAddressForm();
    }

    private cleanOptional(value: unknown): string | null {
        if (typeof value !== 'string') {
            return null;
        }

        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    private resolveError(error: any, fallback: string): string {
        if (typeof error?.error === 'string' && error.error.trim()) {
            return error.error;
        }

        return error?.error?.message || fallback;
    }
}
