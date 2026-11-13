# Vinoteca UTN — Frontend

Aplicación web de comercio electrónico de vinos, desarrollada como proyecto académico. Incluye catálogo público, autenticación, carrito, checkout y un área de gestión con acceso según roles.

## Tecnologías
- Angular 22 (componentes standalone), TypeScript, HTML y CSS.
- Angular Router, HttpClient, formularios reactivos y RxJS.
- Tailwind CSS 4 y variables CSS para la identidad visual.
- API REST externa (backend Spring Boot, repositorio separado).

## Requisitos e instalación
1. Instalar Node.js y npm compatibles con Angular 22.
2. Clonar el repositorio y ejecutar `npm install`.
3. Levantar el backend y su base de datos, verificando que la API esté disponible en `http://localhost:8081`.
4. Ejecutar `npm start` y abrir `http://localhost:4200`.

**Configuración:** en esta entrega las URL de la API están definidas en servicios Angular y en `src/app/interceptors/auth-interceptor.ts` con `http://localhost:8081`. Para desplegar en otro entorno hay que adaptar esas direcciones y configurar CORS en el backend. El frontend por sí solo no reemplaza la API ni la base de datos.

## Funcionalidades
- Inicio, catálogo, filtros y detalle de productos.
- Registro, ingreso, recuperación de contraseña y perfil.
- Carrito, checkout, órdenes y consultas de pedidos.
- Panel de gestión: productos, categorías, marcas, proveedores, movimientos de stock, usuarios, pedidos, pagos y notificaciones, según permisos.
- Interfaz responsive, tema claro/oscuro y transiciones visuales.

## Organización del código
- `src/app/pages/`: vistas y formularios organizados por dominio.
- `src/app/services/`: comunicación HTTP y estado de autenticación/tema.
- `src/app/models/`: tipos e interfaces de datos.
- `src/app/guards/`: control de acceso a rutas.
- `src/app/interceptors/`: incorporación del token de autenticación.
- `src/app/app.routes.ts`: definición de rutas públicas y restringidas.
- `src/styles.css`: estilos globales, variables de tema y animaciones.

## Autenticación y seguridad
El login solicita credenciales al backend y recibe un token JWT. `AuthService` administra el estado de sesión; el interceptor adjunta `Authorization: Bearer` a solicitudes dirigidas a la API, excepto login y registro. Los guards restringen la navegación por sesión y roles. **La autorización definitiva debe validarse en el backend**, no solamente en Angular.

## Comandos
- `npm start`: servidor de desarrollo.
- `npm run build`: compilación.
- `npm test`: pruebas unitarias.

## Documentación complementaria
Consultar `DOCUMENTACION_TECNICA.docx` para arquitectura, decisiones de diseño y recorrido funcional.

## Alcance
Este repositorio contiene el **frontend**. El backend, la persistencia y los servicios de negocio se ejecutan por separado. No se incluyen claves ni usuarios de prueba en este README.
