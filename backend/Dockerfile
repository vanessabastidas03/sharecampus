# Etapa de build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia solo los package files primero (aprovecha caché de Docker)
COPY package*.json ./

# Instala dependencias de forma limpia
RUN npm ci

# Copia el resto del código
COPY . .

# Compila TypeScript a JavaScript
RUN npm run build

# ----------------------------
# Etapa de producción
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Copia solo el build compilado
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]