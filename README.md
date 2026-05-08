# Vidas Remotas

Sitio estático premium para **vidasremotas.cl**, listo para publicar en **Cloudflare Pages** desde GitHub.

## Stack

- HTML5
- CSS puro, con estética tipo utility-first
- JavaScript vanilla
- SEO básico y accesibilidad inicial

## Estructura

```text
projects/vidasremotas-cl/
├── index.html
├── privacy.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── manifest.webmanifest
├── _headers
└── assets/
    ├── css/styles.css
    ├── js/main.js
    └── img/*.svg
```

## Cómo probar localmente

```bash
cd /Users/bophcir/.openclaw/workspace/projects/vidasremotas-cl
python3 -m http.server 8080
```

Abre: `http://localhost:8080`

## Despliegue en Cloudflare Pages

1. Sube esta carpeta a un repositorio GitHub.
2. En Cloudflare Pages, conecta el repo.
3. Configura:
   - **Framework preset:** None
   - **Build command:** vacío
   - **Build output directory:** `/`
4. Publica el proyecto.
5. Agrega el dominio personalizado `vidasremotas.cl`.

## Dominio

- Si el dominio ya está delegado a Cloudflare, solo asocia el custom domain en Pages.
- Si no, ajusta DNS según el flujo que indique Cloudflare.

## Formulario de contacto

El formulario ahora lo procesa una **Cloudflare Pages Function** en `/api/contact`.

Flujo:

- respuesta automática cordial al remitente
- copia interna a `Richard.poblete@gmail.com` si el mensaje parece comercial
- redirección a `/thanks.html`

Notas:

- Se usa **Resend** para el envío de correos
- El proyecto requiere el secreto `RESEND_API_KEY` en Cloudflare Pages
- Si más adelante quieres un resumen **2 veces al día**, conviene añadir almacenamiento + cron

## Recomendaciones de seguridad

- Mantener **HTTPS** activo
- Usar el `_headers` incluido
- Activar **CSP** y validar recursos externos
- Minimizar los campos del formulario
- No guardar datos personales en el frontend
- Añadir rate limiting o Turnstile si el formulario crece

## SEO inicial

- `title` y `meta description` ya definidos
- `canonical` configurado
- `robots.txt` y `sitemap.xml` incluidos
- `og:image` preparado

## Ajustes sugeridos antes de producción

- Reemplazar `bophcir@gmail.com` por una casilla de contacto definitiva si lo deseas
- Sustituir el endpoint `formspree` por el definitivo
- Si tienes fotos propias, reemplaza los SVG de galería por imágenes reales optimizadas WebP/AVIF
- Revisar la política de privacidad con asesoría legal
