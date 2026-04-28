# ShareCampus

Plataforma de economía colaborativa estudiantil. Permite a universitarios publicar, buscar e intercambiar artículos académicos (libros, calculadoras, materiales de laboratorio, etc.) con otros estudiantes de su institución.

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Tecnologías](#tecnologías)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Backend — NestJS](#backend--nestjs)
6. [Mobile — React Native / Expo](#mobile--react-native--expo)
7. [Variables de Entorno](#variables-de-entorno)
8. [Cómo Compilar y Ejecutar](#cómo-compilar-y-ejecutar)
9. [API Docs (Swagger)](#api-docs-swagger)
10. [Base de Datos](#base-de-datos)
11. [Servicios Externos](#servicios-externos)
12. [Scripts Útiles](#scripts-útiles)

---

## Descripción General

ShareCampus es una aplicación móvil + API REST que conecta a estudiantes universitarios para que puedan intercambiar artículos académicos de forma segura. Solo acepta correos institucionales (`.edu`, `.edu.co`) para garantizar que todos los usuarios pertenezcan a una comunidad estudiantil.

**Flujo principal:**
1. El estudiante se registra con su correo universitario y verifica su cuenta por email.
2. Publica artículos con fotos y descripción.
3. Otros estudiantes pueden solicitar un intercambio a través del chat.
4. El dueño acepta o rechaza la solicitud.
5. Al entregar el artículo, el dueño genera un código de confirmación de 4 dígitos que el receptor introduce para completar el intercambio.

**Demo:**
- API en producción: `https://sharecampus.onrender.com`
- Documentación Swagger: `https://sharecampus.onrender.com/api/docs`

---

## Arquitectura

```
sharecampus/
├── backend/          # API REST — NestJS + PostgreSQL + Firebase
├── mobile/           # App móvil — React Native (Expo)
├── docker-compose.yml
└── README.md
```

El backend se despliega en [Render](https://render.com) y la base de datos PostgreSQL puede correr localmente o en la nube. Firebase Realtime Database se usa exclusivamente para los mensajes de chat en tiempo real. Las notificaciones push se envían con Firebase Cloud Messaging (FCM).

---

## Tecnologías

### Backend
| Tecnología | Versión | Rol |
|---|---|---|
| Node.js | >= 20 | Runtime |
| NestJS | 11 | Framework HTTP |
| TypeORM | 0.3 | ORM |
| PostgreSQL | 16 | Base de datos principal |
| Firebase Admin SDK | 13 | Chat en tiempo real + Push |
| Cloudinary | 2 | Almacenamiento de imágenes |
| Passport / JWT | — | Autenticación |
| bcrypt | 6 | Hash de contraseñas |
| Nodemailer | 8 | Emails de verificación y recuperación |
| Helmet | 8 | Cabeceras de seguridad HTTP |
| Swagger / OpenAPI | 11 | Documentación automática de la API |
| Sentry | 10 | Monitoreo de errores en producción |
| class-validator | 0.15 | Validación de DTOs |

### Mobile
| Tecnología | Versión | Rol |
|---|---|---|
| React Native | 0.83 | Framework móvil |
| Expo | 55 | Toolchain y servicios nativos |
| React Navigation | 7 | Navegación entre pantallas |
| Axios | 1.13 | Cliente HTTP |
| AsyncStorage | 2.2 | Persistencia local del token JWT |
| @react-native-firebase | 23 | Firebase (Realtime DB + Messaging) |
| expo-notifications | 55 | Notificaciones push |
| expo-image-picker | 55 | Selección de fotos |

---

## Estructura del Proyecto

```
sharecampus/
├── backend/
│   ├── src/
│   │   ├── auth/               # Registro, login, JWT, recuperación de contraseña
│   │   ├── users/              # Entidad y servicio de usuarios
│   │   ├── profile/            # Actualización de perfil y foto
│   │   ├── items/              # CRUD de artículos + imágenes Cloudinary
│   │   ├── chats/              # Chat (metadatos en Postgres, mensajes en Firebase)
│   │   ├── notifications/      # Push FCM + device tokens
│   │   ├── wishlist/           # Lista de deseos
│   │   ├── reports/            # Reportes de usuarios/artículos + panel admin
│   │   ├── firebase/           # Módulo singleton de Firebase Admin SDK
│   │   ├── cloudinary/         # Módulo de Cloudinary
│   │   ├── config/             # Configuración global
│   │   ├── migrations/         # Migraciones TypeORM
│   │   ├── data-source.ts      # DataSource para CLI de TypeORM
│   │   ├── instrument.ts       # Inicialización de Sentry (se importa antes del bootstrap)
│   │   └── main.ts             # Bootstrap de la aplicación
│   ├── test/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/
│   ├── src/
│   │   ├── screens/            # Todas las pantallas de la app
│   │   ├── navigation/         # AppNavigator (tabs + stacks)
│   │   ├── context/            # AuthContext — estado global de autenticación
│   │   ├── hooks/              # usePushNotifications
│   │   ├── services/           # api.ts — cliente Axios con interceptores JWT
│   │   ├── components/         # Componentes reutilizables
│   │   ├── theme/              # Colores, tipografía
│   │   ├── types/              # Tipos TypeScript compartidos
│   │   └── utils/              # Funciones auxiliares
│   ├── assets/                 # Iconos, splash screen
│   ├── app.json                # Configuración Expo
│   ├── firebase.config.ts      # Configuración de Firebase para el cliente
│   ├── google-services.json    # Credenciales FCM Android
│   ├── GoogleService-Info.plist # Credenciales FCM iOS
│   ├── index.ts                # Entry point
│   └── package.json
│
├── docker-compose.yml          # PostgreSQL + Redis + API en contenedores
└── backup_20260426.sql         # Backup de la base de datos
```

---

## Backend — NestJS

### Módulos

| Módulo | Ruta base | Descripción |
|---|---|---|
| `AuthModule` | `/auth` | Registro con email institucional, login, verificación por email, recuperación de contraseña |
| `UsersModule` | interno | Entidad User, búsqueda, actualización |
| `ProfileModule` | `/profile` | Ver y actualizar perfil, subir foto de perfil a Cloudinary |
| `ItemsModule` | `/items` | Crear, listar, buscar, editar y eliminar artículos; subida de imágenes a Cloudinary |
| `ChatsModule` | `/chats` | Crear chats, enviar mensajes, aceptar/rechazar solicitudes, código de confirmación de entrega |
| `NotificationsModule` | `/notifications` | Registrar device tokens, enviar notificaciones push vía FCM |
| `WishlistModule` | `/wishlist` | Agregar/quitar artículos de lista de deseos, notificar cuando un artículo deseado esté disponible |
| `ReportsModule` | `/reports` | Reportar usuarios o artículos, panel de administración, suspensión automática |
| `FirebaseModule` | interno | Instancia única de Firebase Admin SDK (Realtime DB) |
| `CloudinaryModule` | interno | Cliente de Cloudinary para subida de archivos |

### Seguridad

- Todos los endpoints protegidos usan `JwtAuthGuard` (Bearer token).
- Las contraseñas se almacenan con bcrypt (10 rondas).
- Solo se aceptan correos con dominio `.edu` o `.edu.co`.
- Helmet agrega cabeceras HTTP de seguridad.
- Validación global de DTOs con `class-validator` (whitelist + forbidNonWhitelisted).

### Chat — arquitectura híbrida

Los metadatos del chat (quién habla con quién, estado, código de confirmación) se guardan en **PostgreSQL**. Los mensajes individuales se escriben directamente en **Firebase Realtime Database** para latencia mínima. La app móvil escucha el nodo `chats/{chatId}/messages` en tiempo real.

---

## Mobile — React Native / Expo

### Pantallas

| Pantalla | Descripción |
|---|---|
| `LoginScreen` | Inicio de sesión con email y contraseña |
| `RegisterScreen` | Registro con validación de email institucional |
| `ForgotPasswordScreen` | Solicitud de recuperación de contraseña |
| `HomeScreen` | Feed principal de artículos disponibles |
| `ItemDetailScreen` | Detalle de un artículo, botón para iniciar intercambio |
| `CreateItemScreen` | Formulario para publicar un artículo con foto |
| `MyItemsScreen` | Artículos publicados por el usuario actual |
| `ChatsScreen` | Lista de todos los chats activos |
| `ChatDetailScreen` | Conversación en tiempo real (Firebase) |
| `ConfirmationScreen` | Ingreso del código de 4 dígitos para confirmar entrega |
| `WishlistScreen` | Lista de deseos del usuario |
| `ProfileScreen` | Perfil público del usuario |
| `EditProfileScreen` | Editar nombre, bio y foto de perfil |

### Autenticación

`AuthContext` (`src/context/AuthContext.tsx`) maneja el token JWT. Al iniciar la app verifica si hay un token guardado en `AsyncStorage` y mantiene al usuario logueado entre sesiones. En cada petición, el interceptor de Axios agrega automáticamente el header `Authorization: Bearer <token>`.

### Notificaciones Push

`usePushNotifications` registra el device token de Expo en el backend al hacer login. Las notificaciones se envían desde el backend usando FCM cuando ocurre un evento relevante (nuevo chat, mensaje, item de wishlist disponible).

---

## Variables de Entorno

### Backend (`backend/.env`)

```env
# Base de datos
DATABASE_URL=postgresql://usuario:contraseña@host:5432/sharecampus_db

# JWT
JWT_SECRET=tu_secreto_aqui

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Firebase (base64 del archivo serviceAccountKey.json)
FIREBASE_CREDENTIALS_BASE64=

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Sentry
SENTRY_DSN=

# Entorno
NODE_ENV=production
PORT=3000
```

### Mobile

La URL base de la API se configura en `mobile/src/services/api.ts`:
```ts
const BASE_URL = 'https://sharecampus.onrender.com';
```
Para desarrollo local cámbiala por la IP de tu máquina: `http://192.168.x.x:3000`.

---

## Cómo Compilar y Ejecutar

### Requisitos previos

- Node.js >= 20
- npm >= 10
- PostgreSQL 16 (local o Docker)
- Cuenta de Firebase con Realtime Database habilitada
- Cuenta de Cloudinary

---

### Opción A — Ejecución local (desarrollo)

#### 1. Backend

```bash
# Ir a la carpeta del backend
cd backend

# Instalar dependencias
npm install

# Crear y editar el archivo de variables de entorno
cp .env.example .env

# Correr migraciones (crea las tablas en PostgreSQL)
npm run migration:run

# Iniciar en modo desarrollo con hot-reload
npm run start:dev

# La API estará en: http://localhost:3000
# Swagger UI en:   http://localhost:3000/api/docs
```

#### 2. Mobile

```bash
cd mobile

# Instalar dependencias
npm install

# Iniciar Expo (muestra un QR en la terminal)
npm start

# Para Android (necesita Android Studio / emulador)
npm run android

# Para iOS (solo macOS, necesita Xcode)
npm run ios
```

> Para probar en dispositivo físico instala la app **Expo Go** y escanea el QR.
> Para notificaciones push y Firebase Native es obligatorio usar un **development build** (`expo run:android` o `expo run:ios`), no Expo Go.

---

### Opción B — Docker Compose (backend + base de datos)

```bash
# Desde la raíz del proyecto
# Asegúrate de tener backend/.env.docker con DATABASE_URL apuntando al host 'db'

docker compose up --build -d

# Ver logs del backend en vivo
docker compose logs -f api

# Detener todo
docker compose down
```

El `docker-compose.yml` levanta tres servicios:
- `db` — PostgreSQL 16 en el puerto 5432
- `redis` — Redis 7 en el puerto 6379 (reservado para caché futura)
- `api` — El backend NestJS en el puerto 3000

---

### Opción C — Build de producción

#### Backend

```bash
cd backend

# Compilar TypeScript a JavaScript en /dist
npm run build

# Ejecutar el servidor compilado
npm run start:prod
# Equivalente a: node dist/main
```

#### Mobile — APK / IPA con EAS Build

ShareCampus usa Expo. Para generar binarios de producción se usa **EAS Build** (Expo Application Services):

```bash
# Instalar EAS CLI globalmente (solo la primera vez)
npm install -g eas-cli

cd mobile

# Iniciar sesión en Expo
eas login

# Configurar el proyecto (genera eas.json si no existe)
eas build:configure

# Build para Android (genera .apk o .aab)
eas build --platform android

# Build para iOS (genera .ipa — requiere cuenta Apple Developer)
eas build --platform ios

# Build para ambas plataformas a la vez
eas build --platform all
```

Para builds locales sin EAS:

```bash
# Android
npx expo run:android --variant release

# iOS
npx expo run:ios --configuration Release
```

---

## API Docs (Swagger)

Con el backend corriendo, la documentación interactiva está disponible en:

```
http://localhost:3000/api/docs          (local)
https://sharecampus.onrender.com/api/docs  (producción)
```

---

## Base de Datos

### Entidades principales

| Tabla | Descripción |
|---|---|
| `user` | Usuarios registrados (email, contraseña hash, nombre, estado, conteo de intercambios) |
| `item` | Artículos publicados (título, descripción, categoría, imágenes, usuario dueño) |
| `chat` | Chats de intercambio (sender, receiver, item, estado, código de confirmación) |
| `device_token` | Tokens FCM por usuario para push notifications |
| `wishlist` | Relación usuario ↔ artículo deseado |
| `report` | Reportes de contenido inapropiado o usuarios |

### Comandos de migraciones

```bash
# Generar una migración nueva desde los cambios en las entidades
npm run migration:generate -- src/migrations/NombreDeLaMigracion

# Aplicar migraciones pendientes
npm run migration:run

# Revertir la última migración aplicada
npm run migration:revert
```

> En desarrollo, `synchronize: true` sincroniza el esquema automáticamente.
> En producción se recomienda desactivarlo y usar migraciones explícitas.

---

## Servicios Externos

| Servicio | Uso | Variable de entorno clave |
|---|---|---|
| PostgreSQL | Base de datos principal | `DATABASE_URL` |
| Firebase Realtime Database | Mensajes de chat en tiempo real | `FIREBASE_CREDENTIALS_BASE64` |
| Firebase Cloud Messaging | Notificaciones push | `google-services.json` / `GoogleService-Info.plist` |
| Cloudinary | Imágenes de artículos y fotos de perfil | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Nodemailer / SMTP | Verificación de cuenta y recuperación de contraseña | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` |
| Sentry | Monitoreo de errores y performance en producción | `SENTRY_DSN` |
| Render | Hosting del backend | Deploy automático desde GitHub |

---

## Scripts Útiles

### Backend

```bash
npm run start:dev       # Desarrollo con hot-reload
npm run start:prod      # Producción (requiere build previo)
npm run build           # Compilar TypeScript a /dist
npm run test            # Tests unitarios
npm run test:cov        # Tests con reporte de cobertura
npm run lint            # Lint + autofix con ESLint
npm run migration:run   # Aplicar migraciones pendientes
```

### Mobile

```bash
npm start               # Iniciar servidor Expo
npm run android         # Correr en Android
npm run ios             # Correr en iOS
npm run web             # Correr en navegador (funcionalidad limitada)
```

### Docker

```bash
docker compose up -d          # Levantar todos los servicios en background
docker compose down           # Detener y eliminar contenedores
docker compose logs -f api    # Ver logs del backend en vivo
```

---

## Equipo

Proyecto académico desarrollado en la **Universidad Cooperativa de Colombia**.

Contacto: vanessa.bastidas@campusucc.edu.co
