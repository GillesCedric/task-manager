# =============================================================================
# Stage 1 — Builder: compile React/Vite application
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# ARGs injectés par la pipeline CI pour pointer vers l'API backend
ARG VITE_API_URL=https://api.task-manager.example.com
ENV VITE_API_URL=$VITE_API_URL

# Install deps — layer séparé pour cache optimal
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Build production
COPY . .
RUN npm run build

# =============================================================================
# Stage 2 — Runtime: Nginx minimal, sert uniquement le bundle Vite
# =============================================================================
FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="task-manager-frontend"
LABEL org.opencontainers.image.description="React 19 SPA — Task Manager"
LABEL org.opencontainers.image.source="https://github.com/${GITHUB_REPOSITORY}"

# ─── Security hardening ───────────────────────────────────────────────────────
# Supprimer les modules nginx inutiles et les fichiers par défaut
RUN rm -rf /etc/nginx/conf.d/default.conf \
    && rm -rf /usr/share/nginx/html/*

# Non-root: nginx écoute sur 8080 (port non-privilégié)
RUN sed -i 's|listen\s*80;|listen 8080;|g' /etc/nginx/nginx.conf 2>/dev/null || true

# ─── Configuration nginx ──────────────────────────────────────────────────────
COPY docker/nginx.conf /etc/nginx/conf.d/app.conf

# ─── Assets statiques ────────────────────────────────────────────────────────
COPY --from=builder /app/dist /usr/share/nginx/html

# ─── Security: run as non-root ────────────────────────────────────────────────
RUN addgroup -g 1001 -S app \
    && adduser -u 1001 -S app -G app \
    && chown -R app:app /usr/share/nginx/html \
    && chown -R app:app /var/cache/nginx \
    && chown -R app:app /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown app:app /var/run/nginx.pid

USER app

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/health.txt || exit 1

CMD ["nginx", "-g", "daemon off;"]
