# Enums — Roles y permisos

Los valores de los enums de este módulo. Índice de todos: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta la resuelve i18n.

### `user_role` — `users.role`
`admin_monkey` · `admin_empresa` · `funcional` · `auditor`.

⚠️ El schema actual del Backend usa `MONKEY_ADMIN`, `CLIENT_ADMIN`, `USER`, `VIEWER`. El modelo
nuevo manda estos cuatro en minúscula; la API expone los del modelo.
