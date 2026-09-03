# ========
# Build
# ========
FROM node:26-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@11 && pnpm install --frozen-lockfile

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
