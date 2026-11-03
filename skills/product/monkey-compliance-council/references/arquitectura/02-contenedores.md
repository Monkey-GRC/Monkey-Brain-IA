# C4 · Nivel 2 — Contenedores

Responde: **¿qué aplicaciones y bases de datos corren, y cómo se comunican?** Un "contenedor" aquí es
algo que se ejecuta por separado (una app, un proceso, una base), no necesariamente un contenedor Docker.

```mermaid
flowchart TB
    usuarioMonkey["admin_monkey"]
    usuarioCliente["admin_empresa · funcional · auditor"]

    subgraph monkey["MONKEY"]
        feAdmin["<b>Frontend</b><br/>Angular · panel de Monkey Admin"]
        fePlat["<b>Frontend-Platform</b><br/>Angular · aplicación del cliente"]

        api["<b>Backend (API)</b><br/>NestJS · /v1<br/>Monolito modular.<br/>Reglas, auth, auditoría."]

        runner["<b>Runner</b><br/>Mismo código y misma imagen del Backend,<br/>otro arranque (src/runner).<br/>Sin acceso a la base."]
        dproxy["<b>docker-proxy</b><br/>Filtra el socket de Docker:<br/>solo crear, iniciar, leer y borrar contenedores."]
        engine["<b>Motor de nube</b><br/>Contenedor efímero por escaneo."]

        db[("<b>PostgreSQL</b><br/>4 schemas: catalog · platform · tenant · audit<br/>Aislamiento por RLS")]
    end

    correo["Servicio de correo"]
    s3["Almacenamiento S3 / minio"]
    nubeCliente["Cuenta de nube del cliente"]

    usuarioMonkey --> feAdmin
    usuarioCliente --> fePlat
    feAdmin -- "HTTPS · JSON · cookies httpOnly" --> api
    fePlat -- "HTTPS · JSON · cookies httpOnly" --> api

    api -- "Prisma · rol monkey_app<br/>(sin BYPASSRLS)" --> db
    api --> correo
    api -- "archivos de evidencia" --> s3

    runner -- "/internal/runner<br/>red interna + RUNNER_TOKEN<br/>reclama trabajo, entrega resultado" --> api
    runner --> dproxy
    dproxy -- "lanza y lee" --> engine
    runner -- "asume rol de solo lectura (STS, 1 h)" --> nubeCliente
    engine -- "evalúa con las credenciales temporales" --> nubeCliente
```

## Qué mirar aquí

- **Un solo Backend, no microservicios** (vetado en el MVP, `architecture.md`). Los dos frontends
  hablan con la **misma API**: lo que cambia es el rol del usuario, no la puerta de entrada.
- **El Runner es la pieza de seguridad más delicada.** Está separado a propósito: no ve la base de datos,
  ni el JWT, ni la clave de cifrado. Solo recibe su `runner.env` y habla con el Backend por una API
  interna. Corre en modo de solo lectura, sin capacidades extra y con memoria limitada.
- **Por qué `docker-proxy`:** el Runner necesita lanzar el motor en un contenedor efímero, y dar acceso
  al socket de Docker completo sería dar control de la máquina. El proxy deja pasar solo lo necesario.
  Limitación conocida y su salida para producción: comentario del compose y `DT-43`.
- **El aislamiento entre clientes está en la base**, con RLS, además del código. Por eso toda consulta a
  una tabla de cliente va dentro de `withScope` (`context/backend.md`).
- **Frontend vs. Frontend-Platform:** `Frontend` es el panel de administración de Monkey;
  `Frontend-Platform` es lo que ve la empresa cliente.

## Lo que NO está dibujado (y por qué)

- **Cola de eventos, índice vectorial, base de grafos, motor de IA:** están en el diseño objetivo
  (`architecture.md`), pero hoy no existen como contenedores. Dibujarlos aquí sería mentir.
- **La sonda de servidores y bases:** el puerto `ConnectionProbe` existe con adaptadores `simulated`,
  `unavailable` y `runner`; la integración real para servidores y bases es provisional (`DT-32…36`).
- **Proxy inverso y despliegue (VPS, `proxy_net`, CI/CD):** van en un diagrama de despliegue aparte, aún
  no escrito. Base para escribirlo: `Diagramas/03-arquitectura-docker-y-variables.drawio` y
  `Backend/deploy/docker-compose.dev.yml`.

## Cómo verificarlo

- Servicios y redes: `Backend/deploy/docker-compose.dev.yml`.
- Runner: `Backend/src/runner/` y `skills/backend/add-cloud-engine.md`.
- Schemas de la base: `datasource` en `Backend/prisma/schema/schema.prisma`.
- Frontends: `Frontend/src/app`, `Frontend-Platform/src/app`.
