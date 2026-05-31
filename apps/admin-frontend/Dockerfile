FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/admin-frontend/package.json apps/admin-frontend/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm install --workspaces --include-workspace-root
COPY packages ./packages
COPY apps/admin-frontend ./apps/admin-frontend
RUN npm run build --workspace @secure-admin/types && npm run build --workspace @secure-admin/ui && npm run build --workspace @secure-admin/admin-frontend

FROM nginx:1.27-alpine
COPY --from=build /app/apps/admin-frontend/dist /usr/share/nginx/html
COPY docker/frontend-nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
