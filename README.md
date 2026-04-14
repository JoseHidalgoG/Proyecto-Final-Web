# Proyecto-Final-Web
Repositorio para el proyecto final de la materia Programacion Web (CSTI-1910-5488) impartida por el profesor Carlos Camacho

## Docker

Antes de levantar los contenedores, crea el archivo `.env` en la raiz del proyecto tomando `.env.example` como base:

```bash
cp .env.example .env
```

Configura estas variables:

```bash
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/encuestas?retryWrites=true&w=majority&appName=ProyectoFinalWeb
JWT_SECRET=cambia-esta-clave-secreta
```

Arrancar todo:

```bash
docker compose up --build
```

Puertos:

- Frontend: `http://localhost:5173`
- Backend REST: `http://localhost:7070`
- gRPC: `localhost:9090`

Detener:

```bash
docker compose down
```
