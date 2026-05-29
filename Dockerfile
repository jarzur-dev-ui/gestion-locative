ARG NODE_VERSION
ARG VITE_APP_URL
FROM node:${NODE_VERSION:-26}-alpine AS builder

ENV CI=true
RUN npm install -g corepack@latest pnpm@latest && corepack enable && corepack prepare pnpm@latest --activate
RUN mkdir /packaged_app
WORKDIR /packaged_app
ADD . /packaged_app/
RUN pnpm install --frozen-lockfile && VITE_APP_URL=${VITE_APP_URL:https://gestion-locative.zeleph.fr} pnpm build

FROM nginx:stable-alpine AS runner

COPY --from=builder /packaged_app/dist /usr/share/nginx/html
RUN sed -i '9 a try_files $uri $uri/ /index.html;' /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["/bin/sh", "-c", "nginx -g \"daemon off;\""]
