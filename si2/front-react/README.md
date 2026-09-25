# FashionStore — frontend React

Réplica en React (Vite + JavaScript) del frontend Angular de `../frontend`: mismas vistas,
mismo estilo (Tailwind v4 con los tokens de `styles.css`) y mismas conexiones a la API FastAPI.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

La URL del backend y la clave pública de Stripe se configuran en `.env` (`VITE_API_URL`,
`VITE_STRIPE_PUBLISHABLE_KEY`), equivalentes a `environment.ts` del proyecto Angular.

## Equivalencias con Angular

| Angular | React |
| --- | --- |
| `app.routes.ts` + guards | `src/router/routes.jsx` + `src/router/guards/guards.jsx` |
| `HttpClient` + interceptores | `src/core/api/http.js` (axios) |
| Servicios con signals (`AuthService`, `CarritoService`...) | Stores de zustand en `src/core/stores` (mismas claves de localStorage) |
| Formularios reactivos | react-hook-form + `src/shared/utils/formularios.js` |
| Pipes `monedaBs`, `date`, `number` | `src/shared/utils/moneda-bs.js`, `src/shared/utils/formato.js` |
| `features/<feature>` | `src/features/<feature>` (misma organización) |
