# Despliegue en produccion

**URL:** https://redimensiona.devinventor.es

## Arquitectura

```
Internet -> Cloudflare (tunel) -> nginx (127.0.0.1:8080) -> contenedor "redimensiona" (127.0.0.1:3001)
```

- App: Node.js + Express (`src/servidor.js`), frontend en `public/`, API en `/api/imagenes`.
- Contenedor definido en `docker-compose.yml`, imagen construida desde `Dockerfile`.

## Comandos utiles

```bash
# Levantar / actualizar el servicio
docker compose up -d --build

# Estado
docker ps | grep redimensiona

# Logs
docker logs -f redimensiona
```

## Auto-deploy

Un cron revisa `origin/master` cada 5 minutos y, si detecta cambios, hace `git pull` y
`docker compose up -d --build` automaticamente.

- Script: `deploy.sh`
- Log: `/home/david/proyectos/deploy-redimensiona.log`
- Entrada cron: `*/5 * * * * /home/david/proyectos/formato-y-redimension/deploy.sh >> /home/david/proyectos/deploy-redimensiona.log 2>&1`

## Ubicaciones en el servidor

- Repo clonado: `/home/david/proyectos/formato-y-redimension`
- vhost nginx: `/home/david/nginx/conf.d/40-redimensiona.conf`
- Tunel Cloudflare: `/home/david/.cloudflared/config.yml`

## Variables de entorno

| Variable | Por defecto | Descripcion |
|---|---|---|
| `PUERTO` | `3000` | Puerto del servidor HTTP |
| `TAMANIO_MAXIMO_MB` | `20` | Limite de peso por archivo |
| `CARPETA_SUBIDAS` | `uploads` | Carpeta temporal de subidas |
