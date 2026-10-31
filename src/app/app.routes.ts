import { Routes } from '@angular/router';
import { guestOnlyGuard } from './guards/guest-only-guard';
import { managementGuard } from './guards/management-guard';
import { customerGuard } from './guards/customer-guard';
import { adminGuard } from './guards/admin-guard';

// Home
import { Home } from './pages/home/home';

// Authentication
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { ForgotPassword } from './pages/auth/forgot-password/forgot-password';

// Products
import { ProductList } from './pages/products/product-list/product-list';
import { ProductForm } from './pages/products/product-form/product-form';
import { ProductDetail } from './pages/products/product-detail/product-detail';

// Categories
import { CategoryList } from './pages/categories/category-list/category-list';
import { CategoryForm } from './pages/categories/category-form/category-form';

// Brands
import { BrandList } from './pages/brands/brand-list/brand-list';
import { BrandForm } from './pages/brands/brand-form/brand-form';

// Suppliers
import { SupplierList } from './pages/suppliers/supplier-list/supplier-list';
import { SupplierForm } from './pages/suppliers/supplier-form/supplier-form';
import { SupplierDetail } from './pages/suppliers/supplier-detail/supplier-detail';

// Stock
import { StockMovementList } from './pages/stock/stock-movement-list/stock-movement-list';
import { StockMovementForm } from './pages/stock/stock-movement-form/stock-movement-form';

// Users
import { UserList } from './pages/users/user-list/user-list';
import { UserForm } from './pages/users/user-form/user-form';
import { UserDetail } from './pages/users/user-detail/user-detail';

// Orders
import { OrderList } from './pages/orders/order-list/order-list';
import { OrderDetail } from './pages/orders/order-detail/order-detail';

// Cart
import { Cart } from './pages/cart/cart/cart';

// Payments
import { PaymentList } from './pages/payments/payment-list/payment-list';
import { PaymentDetail } from './pages/payments/payment-detail/payment-detail';

// Notifications
import { NotificationList } from './pages/notifications/notification-list/notification-list';

//Management
import { ManagementHome } from './pages/management/management-home/management-home';

export const routes: Routes = [

    // Public pages
    { path: '', component: Home, pathMatch: 'full' },
    { path: 'home', component: Home },

    // Authentication
    { path: 'login', component: Login, canActivate: [guestOnlyGuard] },
    { path: 'register', component: Register, canActivate: [guestOnlyGuard] },
    { path: 'forgot-password', component: ForgotPassword },

    // Public catalog
    { path: 'products', component: ProductList },
    { path: 'products/:id', component: ProductDetail },

    // Shopping cart
    {
        path: 'cart',
        component: Cart,
        canActivate: [customerGuard]
    },

    // Internal management
    {
        path: 'management',
        canActivate: [managementGuard],
        children: [
            { path: '', component: ManagementHome, pathMatch: 'full' },

            // Products
            { path: 'products', component: ProductList },
            { path: 'products/new', component: ProductForm },
            { path: 'products/:id/edit', component: ProductForm },

            // Categories
            { path: 'categories', component: CategoryList },
            { path: 'categories/new', component: CategoryForm },
            { path: 'categories/:id/edit', component: CategoryForm },

            // Brands
            { path: 'brands', component: BrandList },
            { path: 'brands/new', component: BrandForm },
            { path: 'brands/:id/edit', component: BrandForm },

            // Suppliers
            { path: 'suppliers', component: SupplierList },
            { path: 'suppliers/new', component: SupplierForm },
            { path: 'suppliers/:id/edit', component: SupplierForm },
            { path: 'suppliers/:id', component: SupplierDetail },

            // Stock movements
            { path: 'stock-movements', component: StockMovementList },
            { path: 'stock-movements/new', component: StockMovementForm },

            // Users
            {
                path: 'users',
                component: UserList,
                canActivate: [adminGuard]
            },
            {
                path: 'users/new',
                component: UserForm,
                canActivate: [adminGuard]
            },
            {
                path: 'users/:id/edit',
                component: UserForm,
                canActivate: [adminGuard]
            },
            {
                path: 'users/:id',
                component: UserDetail,
                canActivate: [adminGuard]
            },

            // Orders
            { path: 'orders', component: OrderList },
            { path: 'orders/:id', component: OrderDetail },

            // Payments
            { path: 'payments', component: PaymentList },
            { path: 'payments/:id', component: PaymentDetail },

            // Notifications
            { path: 'notifications', component: NotificationList }
        ]
    },

    // Unknown routes
    { path: '**', redirectTo: '' }
];


