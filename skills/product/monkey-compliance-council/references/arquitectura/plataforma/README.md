# Plataforma

Responde: **¿qué le da el sistema a todos los módulos por igual?** Es lo transversal: el sobre de cada respuesta,
los errores, los idiomas, la paginación, el límite de peticiones, el correo, el almacenamiento de archivos y el
cifrado. Nada de esto es de un módulo; si lo fuera, cada uno lo haría distinto.

No tiene pantallas ni tablas. Tiene **contratos de forma** que todo el producto cumple.

## Qué posee

| Pieza | Dónde | Qué resuelve |
|---|---|---|
| Sobre de respuesta y errores | `common/dtos`, `common/errors`, `common/filters` | Toda respuesta tiene la misma forma, y todo error un `code` estable |
| Idiomas | `common/text`, `nestjs-i18n` (`/i18n/{en,es}`) | El mensaje se traduce en el servidor según `Accept-Language` |
| Paginación | `common/pagination` | Una sola forma de pedir y devolver páginas |
| Límite de peticiones | `common/rate-limit` | 100/min por usuario, 1000/min por empresa (SEG-19) |
| Correo | `infrastructure/mail` (Resend o log) | Puerto `Mailer` con plantilla de marca; lo usan la clave de acceso, las invitaciones (D102, D117) y la contraseña |
| Archivos | `infrastructure/storage` (S3, minio o `unavailable`) | Subida y descarga por enlace firmado, bucket no público |
| Cifrado y huellas | `infrastructure/security` | AES-256-GCM para credenciales, HMAC con *pepper* para tokens |
| Documentación de la API | `swagger.config.ts` | `/v1/docs`, **solo en local** con `API_DOCS_ENABLED=true` (SEG-62) |

Las guardas y el `TenantScope` también son transversales, pero tienen dueño propio:
[Roles y permisos](../roles-permisos/README.md) y [Aislamiento multi-tenant](../aislamiento-tenant/README.md).

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| El sobre, los códigos de error, i18n, fechas, paginación, multi-select | `contracts/conventions.md` |
| Variables de entorno de correo, S3 y cifrado | `datos/schema-implementacion.md` §4 |
| Requisitos de seguridad | [`seguridad/plataforma.md`](../../seguridad/plataforma.md): `SEG-19` · `SEG-24` · `SEG-25` · `SEG-32` · `SEG-43` · `SEG-44` · `SEG-59` · `SEG-60` · `SEG-62` |
| Decisiones (`D-n`) | [`datos/decisiones/plataforma.md`](../../datos/decisiones/plataforma.md): `D49` · `D106` · `D107` · `D108` · `D109` · `D125` |
| Pendientes del comité (`P-n`) | ninguno propio |
| Convenciones del código | `context/backend.md` |
| Deuda vigente (3 `DT-n`; los frontends, `DT-99`) | [`deuda-tecnica/plataforma.md`](../../deuda-tecnica/plataforma.md) |

## Contenido

[`01-c4.md`](01-c4.md) · [`03-flujos.md`](03-flujos.md) · [`04-historias.md`](04-historias.md) (historias de usuario) ·
[`05-casos-de-uso.md`](05-casos-de-uso.md) (casos de uso y su diagrama UML) · [`06-mejoras.md`](06-mejoras.md) ·
[`07-estudio.md`](07-estudio.md) (cómo aguantaría la API a 500 usuarios).

**Componentes:** [`infraestructura/`](infraestructura/README.md) (15.1): la VPS de desarrollo, sus contenedores, la red, el
despliegue, las métricas y las mejoras propuestas. Sin `02-modelo.md`: no tiene tablas.
