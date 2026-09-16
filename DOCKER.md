# Ejecutar la API con Docker

Levanta dos contenedores: `tienda_nest_api` (la API) y `tienda_nest_db` (PostgreSQL 16).

## Puesta en marcha

1. Copiar el `.env`:

   ```bash
   cp .env.example .env
   ```

2. Poner un `JWT_SECRET` (es la única variable obligatoria):

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

3. Construir y levantar:

   ```bash
   docker compose up --build -d
   ```

4. Probar: <http://localhost:3000/> y la documentación en <http://localhost:3000/docs>.

Al arrancar se aplican las migraciones y se crea el usuario administrador
(`ADMIN_USERNAME` / `ADMIN_PASSWORD`, por defecto `admin` / `admin123`).

## Comandos

```bash
docker compose up -d          # levantar
docker compose down           # apagar, conservando los datos
docker compose down -v        # apagar y borrar la base y las imágenes
docker compose logs -f api    # ver los logs de la API
docker compose up --build -d  # reconstruir tras cambiar el código
```

## Autenticación

1. `POST /auth/login` con `{ "username": "admin", "password": "admin123" }`.
2. Usar el `access_token` de la respuesta en la cabecera `Authorization: Bearer <token>`.

## Puertos

La API se publica en el 3000 y la base en el 5435. Se cambian con `API_PORT` y `DB_PORT` en
el `.env`.
