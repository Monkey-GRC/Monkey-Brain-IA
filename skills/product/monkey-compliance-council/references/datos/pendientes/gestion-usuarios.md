# Pendientes del comité — Gestión de usuarios

Preguntas abiertas que afectan a [Gestión de usuarios](../../arquitectura/gestion-usuarios/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

## P41 · Criterio de «sin ingreso reciente» en «Acceso y seguridad de cuentas» del Inicio

**Estado:** abierto desde 2026-11-10. Fuente: sesión de rediseño, desarrollo. Desarrollo fijó **30 días** (cuenta activa sin ingreso, o con último ingreso de hace más de 30 días); nadie del comité lo pidió.

1. **¿Lo valida el comité?** ¿Con qué plazo?
2. **Una cuenta recién creada que aún no ingresó:** ¿cuenta como «sin ingreso reciente» o no?
3. **¿Qué otras señales de seguridad de cuentas** quiere mostrar al administrador?

**Qué depende:** está construido de forma provisional (constante `STALE_LOGIN_DAYS`); no bloquea.

---

## P42 · Buscar personas y ver el detalle de una persona

**Estado:** abierto desde 2026-11-10. Fuente: sesión de rediseño, desarrollo. Hoy la lista de personas tiene filtros y un panel lateral de solo lectura (D109), sin buscador.

1. **¿Se agrega un parámetro `search` (nombre y correo) a `GET /v1/users`?**
2. **¿Hace falta un endpoint de detalle de persona (`GET /v1/users/{id}`)** con más datos que la lista (historial, controles asignados, grupo y responsable), o basta el panel de solo lectura de hoy?
3. **¿Qué ve el `responsable` de las personas de su equipo?**

**Qué depende:** el buscador de Personas y una futura página de perfil; no bloquea.

---

## P47 · Qué más hace `admin_monkey` con las cuentas y las empresas (mejoras futuras de Monkey Admin)

**Estado:** abierto desde 2026-11-13. Fuente: planificación de MD-215 con Rod. Son ideas de desarrollo; **ninguna la pidió el comité**. D117 deja resuelto invitar, desactivar y reactivar administradores; esto es lo que quedó fuera.

1. **¿Puede `admin_monkey` ver el equipo de una empresa** (personas, roles y estado, en solo lectura)? Hoy recibe `403` en todo `/v1/users` (`contracts/gestion-usuarios.md`) y solo ve el conteo para el cupo (`SEG-77`).
2. **Soporte a clientes:** reenviar la invitación o restablecer el segundo factor de una persona de una empresa desde Monkey Admin. D103 lo dejó como «rol de soporte» futuro sin definir: ¿lo hace cualquier `admin_monkey` o un rol aparte?
3. **¿Se exporta la lista de empresas a CSV** y se permiten acciones en lote (por ejemplo, subir el cupo a varias empresas a la vez)?
4. **Más roles administrativos:** cuáles, con qué permisos y quién los crea. D117 deja el rol como campo; hasta que se decida, solo existe `admin_monkey`.
5. **Corregir nombre o correo antes del canje de la clave y más de un correo administrativo** siguen en [`P2`](empresas.md#p2--el-flujo-de-la-clave-de-acceso--5-detalles-sin-definir) (c y e); se responden allí, no aquí.

**Qué depende:** no bloquea. Los puntos 1 y 2 ampliarían `contracts/gestion-usuarios.md` y `contracts/empresas.md`, y el 4 pide una `D` nueva.

---
