# Seguridad

Aquí vive el **registro de requisitos de seguridad** y el mapa de dónde está documentado cada tema de seguridad del producto.

| Archivo | Qué es |
|---|---|
| [`requisitos.md`](requisitos.md) | Los requisitos (`SEG-n`): fuente, cómo se hace cumplir, la prueba que lo verifica y su **estado real**. Todo endpoint, tabla o flujo nuevo se revisa contra esa lista |

## Dónde vive hoy cada tema

La información de seguridad se escribió dentro de otros documentos antes de que existiera esta carpeta. Se deja donde está (para no romper
las citas) y este mapa dice dónde buscarla.

| Tema | Dónde está |
|---|---|
| **Aislamiento entre empresas** (RLS, variables de sesión, funciones previas al tenant) | [`../datos/modelo-datos.md`](../datos/modelo-datos.md) §4.3 y §4.4 · [`../datos/schema-implementacion.md`](../datos/schema-implementacion.md) §5 · D25, D29, D31 |
| **Identidad, sesión, contraseñas, MFA** | `modelo-datos.md` §5.3 (la política del comité) · `contracts/modules/auth.md` |
| **Roles y permisos** | `modelo-datos.md` §5.1 (los 5 roles; auditor y consultor son roles, D63, D64) y §5.5 (la matriz) · SEG-54 · P3 en [`../datos/modelo-datos-pendientes.md`](../datos/modelo-datos-pendientes.md) |
| **Cómo el modelo de usuarios sostiene SOC 2** | `modelo-datos.md` §5.6 |
| **Secretos y cifrado de credenciales** | `schema-implementacion.md` §4 · D46 · [`../deuda-tecnica/`](../deuda-tecnica/README.md) DT-5 |
| **Auditoría, inmutabilidad y retención** | D41 · `modelo-datos.md` §7.4 · P7 |
| **Confidencialidad del proveedor del motor** | `CLAUDE.md` · [`../producto/philosophy.md`](../producto/philosophy.md) · [`../control-tecnico/wazuh.md`](../control-tecnico/wazuh.md) · P11 |
| **Principios de arquitectura no negociables** (aislamiento fuerte, eventos inmutables, IA separada del plano de datos, API-first) | [`../arquitectura/architecture.md`](../arquitectura/architecture.md) |
| **La IA no certifica ni presenta inferencia como hecho** | `philosophy.md` |
| **Privacidad y leyes** | [`../cumplimiento/frameworks/`](../cumplimiento/README.md) (GDPR, LGPD, CCPA/CPRA, HIPAA…) y el catálogo de `regulations` (14, sembradas con `npm run reference:load`; ver `contracts/enums.md`) |
| **Despliegue, respaldos y migraciones** | `schema-implementacion.md` §7, §8 y §13 |

## Aún sin documentar

No se han escrito porque todavía no hay material ni decisión detrás: un **modelo de amenazas**, los **requisitos legales por país**
con su fuente, y un **plan de respuesta a incidentes**. Se crean cuando haya contenido real, no antes.
