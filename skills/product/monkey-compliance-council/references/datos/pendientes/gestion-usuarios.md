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
