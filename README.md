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

El formulario está preparado para conectar con un proveedor serverless.

Endpoint activo:

- `https://formspree.io/f/xgodnezw`
- Redirección post-envío: `https://vidasremotas.cl/thanks.html`

Opciones recomendadas:

- **Formspree**: endpoint ya conectado en `index.html`.
- **Cloudflare Pages Function**: si prefieres recibir y validar el POST dentro de Cloudflare.
- **Turnstile**: añadirlo si esperas tráfico no deseado o spam.

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
