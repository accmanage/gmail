FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/user-frontend/package.json apps/user-frontend/package.json
COPY packages/types/package.json packages/types/package.json
RUN npm install --workspaces --include-workspace-root
COPY packages ./packages
COPY apps/user-frontend ./apps/user-frontend
RUN npm run build --workspace @secure-admin/types && npm run build --workspace @secure-admin/user-frontend

FROM nginx:1.27-alpine
COPY --from=build /app/apps/user-frontend/dist /usr/share/nginx/html
COPY docker/frontend-nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
