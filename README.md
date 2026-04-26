# ShareCampus 🎓

Plataforma de economía colaborativa para estudiantes universitarios.
Intercambia, presta y dona materiales académicos con tu comunidad.

## 🚀 Demo

API en producción: https://sharecampus.onrender.com
Documentación Swagger: https://sharecampus.onrender.com/api/docs

## 🛠 Stack tecnológico

- **Backend:** NestJS, TypeScript, PostgreSQL, Redis, Firebase
- **Mobile:** React Native (Expo), TypeScript
- **Infra:** Docker, Render, Cloudinary, Sentry, Firebase

## 📦 Módulos implementados

- ✅ Autenticación con email institucional + JWT
- ✅ Perfil de usuario con foto via Cloudinary
- ✅ Publicación de ítems con hasta 5 fotos
- ✅ Búsqueda y filtros combinados
- ✅ Chat en tiempo real via Firebase
- ✅ Código de confirmación de entrega
- ✅ Notificaciones push + fallback email
- ✅ Lista de deseos con alertas
- ✅ Sistema de reportes y moderación

## 🔧 Instalación local

1. Clona el repositorio
2. Copia `backend/.env.example` a `backend/.env` y completa las variables
3. Levanta Docker: `docker compose --env-file backend/.env up -d`
4. Instala dependencias: `cd backend && npm install`
5. Arranca el servidor: `npm run start:dev`

## 🧪 Tests

`npm run test` — tests unitarios
`k6 run test/load-test.js` — test de carga