# GeneralStore FastAPI backend

## Requisitos

- Python 3.11+
- PostgreSQL 14+
- Redis 6+ (dos bases lógicas: `0` para sesiones, `1` para caché)

## Configuración

1. Crea un entorno virtual y activa:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
2. Instala dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Copia el archivo `.env.example` a `.env` y ajusta credenciales (Postgres, Redis y usuario admin).
4. Ejecuta el servidor:
   ```bash
   uvicorn app.main:app --reload
   ```

Al iniciar, se crean las tablas y se provisiona/actualiza el usuario administrador definido con `ADMIN_EMAIL`/`ADMIN_PASSWORD`. Las sesiones viven 14 días en Redis y el caché de listados se guarda en la segunda base.

## Ejecución con Docker Compose

1. Asegúrate de tener Docker Desktop activo.
2. Desde la raíz del repositorio ejecuta:
   ```bash
   docker compose up --build
   ```
3. El servicio backend quedará expuesto en `http://localhost:8000`, Postgres en `localhost:5432` y Redis en `localhost:6379`.

El archivo `docker-compose.yml` crea automáticamente Postgres (con la base `general_store`), Redis (dos bases lógicas 0 y 1) y construye la imagen del backend con el `backend/Dockerfile`. Ajusta credenciales o variables en `docker-compose.yml` si necesitas valores diferentes.
