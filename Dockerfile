FROM node:22-bookworm-slim

WORKDIR /app

# Dependencias (con lockfile)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Codigo
COPY src ./src
COPY public ./public

ENV NODE_ENV=production
ENV PUERTO=3000
ENV TAMANIO_MAXIMO_MB=20
ENV CARPETA_SUBIDAS=/tmp/uploads

RUN mkdir -p /tmp/uploads && chown -R node:node /tmp/uploads

USER node
EXPOSE 3000

CMD ["npm", "start"]
