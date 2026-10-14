# ========
# Build
# ========
FROM node:26-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
# pnpm 版本与 package.json 的 packageManager 保持一致
RUN npm install -g pnpm@12.13.0 && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ========
# Runtime
# ========
FROM nginx:1.29-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
