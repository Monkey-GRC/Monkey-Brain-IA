# Deuda técnica — Roles y permisos

Parches vigentes de [Roles y permisos](../arquitectura/roles-permisos/README.md). Tablero y reglas: [`README.md`](README.md).

## Quién puede qué en los frontends

### DT-112 · Los grupos de permiso por rol están repetidos en cada pantalla de Platform

🟡 Mejora

- **Qué está parchado:** el tipo `UserRole` es único (`core/domain/models/auth.models.ts:38`) y ya existe un sitio común (`shared/domain/utils/roles.ts`: `COMPANY_ADMIN_ROLE`, `TECHNICAL_VIEW_ROLES`), pero **qué roles pueden hacer cada cosa** sigue escrito a mano en unos 12 sitios de Frontend-Platform: las rutas (`app.routes.ts`, `roleGuard(...)`), el menú (`config/navigation.config.ts`), el detalle de control (`control-detail-panel.ts`, `EDITING_ROLES` y `UPLOADING_ROLES`), el equipo (`team-people.ts`, `team-invite-form.ts`, `team-org.ts`, `team-groups.ts`), las integraciones (`integrations-list.ts`, `integration-detail.ts`) y el inicio (`team-summary.ts`). Al estar tipados no admiten un rol mal escrito, pero dos pantallas pueden discrepar sobre quién puede qué si cambia la matriz
- **Por qué:** cada pantalla se construyó con su regla local; la antigua `DT-94` se cerró sin una ficha que dijera qué quedaba
- **Qué lo cierra:** una sola tabla de capacidades por rol en `core` (o `shared/domain/utils/roles.ts`), con nombre por acción (`canEditControl`, `canManageTeam`, `canSeeTechnicalView`…), alineada con la matriz de `datos/modelo/05-usuarios.md` §5.5; rutas, menú y pantallas la consumen. Una prueba unitaria fija la tabla contra la matriz. Ticket: **MD-262**

### DT-123 · Ejecutar pruebas solo lo puede el admin_empresa

🟡 Mejora

- **Qué está parchado:** la matriz (§5.5) da «ejecutar o relanzar una prueba» al `responsable` y al `delegado` (sus controles) y al `auditor` (solo lectura); hoy `POST assets/:id/executions` y la lectura de ejecuciones solo los admite el `admin_empresa`, y la matriz central lo declara pendiente (D150)
- **Por qué:** no está definido qué es «ejecutar» para cada rol ni qué es «ejecutar en solo lectura» para el auditor; no era necesario para la demo
- **Qué lo cierra:** definir el alcance con Rod o el comité y abrir esas filas de la matriz con su prueba por rol

### DT-124 · admin_monkey no ve ni gestiona los datos de una empresa

🟠 Importante

- **Qué está parchado:** la matriz (D136) le da a `admin_monkey` gestionar usuarios y asignaciones de una empresa y ver su cumplimiento, evidencia, resultados y conectores; hoy recibe `403` y la matriz central lo declara pendiente (D150)
- **Por qué:** el RLS aísla por la empresa de la sesión: hace falta elegir la empresa destino y una política de solo lectura que no abra la escritura
- **Qué lo cierra:** MD-146: cómo elige la empresa, la política de RLS y en qué app (Monkey Admin)
