# Requisitos de seguridad — Entrega

CI, despliegue, respaldos, red y rotación de secretos. **No es un módulo de producto.**

Tablero, estados y reglas de uso: [`README.md`](README.md). Cómo funciona el módulo: no aplica.

| ID | Estado | Requisito | Cómo se hace cumplir | Verificación | Fuente |
|---|---|---|---|---|---|
| **SEG-27** | ⚪ | Cifrado en tránsito: TLS 1.3 y HSTS | Lo da el proxy, no la app (la app no fija HSTS) | No verificable desde el repo | §5.3 (PCI DSS) |
| **SEG-28** | 🔴 | Conexión a la base con `sslmode=require` y firewall del 5432 restringido | — | — | `schema-implementacion.md` §9 |
| **SEG-30** | 🟡 | Ninguna credencial en texto plano en ningún repo (`conexion_api_wazuh_monkey.txt` incluida) | Regla del equipo | Sin escáner de secretos. Una búsqueda puntual no encontró las cadenas conocidas | `CLAUDE.md` |
| **SEG-31** | 🔴 | Rotar antes de producción: contraseña de `postgres`, `JWT_SECRET`, la de la API de la sonda y la contraseña del usuario de API de la sonda usado en las pruebas (se pegó en un chat el 2026-10-07), **las llaves del usuario IAM `monkey-audit` de la cuenta de AWS de pruebas y la contraseña SSH de la VPS de desarrollo (se pegaron en el chat el 2026-10-08)** | — | — | `schema-implementacion.md` §9 |
| **SEG-40** | ✅ | Lint, build, pruebas unitarias, migraciones desde cero, verificadores y pruebas de aislamiento corren en cada PR | `.github/workflows/ci.yml` | El propio CI | DT-20 |
| **SEG-41** | 🔴 `DT-46` | Un PR en rojo no se puede mergear, y un despliegue no sale si el CI falla | Exige el plan GitHub Team (protección de rama) o que el deploy dependa del CI | — | DT-46 |
| **SEG-42** | 🟡 | Las migraciones desplegadas se respaldan antes y no se editan una vez aplicadas | `scripts/deploy/migrate.sh` | Probado a mano, no en GitHub Actions | `schema-implementacion.md` §7 y §13 |

*Vienen de las secciones D., G. del registro anterior.*
