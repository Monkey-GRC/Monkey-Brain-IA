# Enums — Roles y permisos

> Índice de todos los enums: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta (es/en) la resuelve i18n. Formato: [`README.md`](../README.md#formato-de-un-enum).

## `user_role`
**Columna:** `users.role` · **Qué puede hacer cada rol:** `modelo-datos.md` §5.5.

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `admin_monkey` | Administrador de Monkey | Equipo Monkey: empresas, catálogo y cupo de usuarios |
| `admin_empresa` | Administrador de la empresa | Experto en compliance de la empresa; crea al equipo y asigna el dueño de cada control |
| `responsable` | Responsable | Dueño de controles; da su primera aprobación y los delega en su equipo |
| `delegado` | Delegado | Miembro del equipo de un responsable; ejecuta |
| `auditor` | Auditor | Lee todo el cumplimiento de la empresa y escribe observaciones |
| `colaborador` | Colaborador | **Nuevo (D136, aún no en el Backend).** Lee y acepta los documentos que le asignan; no accede a controles, riesgos ni evidencia |

> **`funcional` desapareció (D102, 2026-11-03):** su lugar lo ocupan `responsable` y `delegado`.
> ⚠️ El schema anterior del Backend usaba `MONKEY_ADMIN`, `CLIENT_ADMIN`, `USER`, `VIEWER`. La API expone los del modelo, en minúscula.
