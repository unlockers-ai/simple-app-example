# Image de production : l'API Node sert aussi le front compilé.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci
COPY frontend frontend
ARG VITE_OIDC_AUTHORITY
ARG VITE_OIDC_CLIENT_ID=simple-app-frontend
RUN npm run build -w frontend

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --omit=dev -w backend
COPY backend/src backend/src
COPY --from=build /app/frontend/dist frontend/dist
ENV STATIC_DIR=/app/frontend/dist
WORKDIR /app/backend
USER node
EXPOSE 3000
CMD ["node", "src/server.ts"]
