# Requisitos de seguridad — Notificaciones

Que un aviso solo lo vea su destinatario y no saque información del sistema por error.

Tablero, estados y reglas de uso: [`README.md`](README.md). Cómo funciona el módulo: [`arquitectura/notificaciones/`](../arquitectura/notificaciones/README.md).

| ID | Estado | Requisito | Cómo se hace cumplir | Verificación | Fuente |
|---|---|---|---|---|---|
| **SEG-87** | ✅ MD-515 | Un aviso solo lo lee y marca su destinatario: ni otra persona de la misma empresa, ni el `admin_empresa`, ni otra empresa (`404`) | RLS por persona en `platform.notifications` (`app.tenant_id` y `app.user_id`); contenido inmutable (solo `read_at` y `emailed_at`); el canal en vivo solo publica a la sesión del destinatario | **MD-515 (2026-11-25).** `test/notificaciones/aislamiento-avisos.e2e-spec.ts` (conectada como `monkey_app`: cada persona ve solo lo suyo, ni el administrador ni `admin_monkey` ni otra empresa; contenido inmutable; sin borrado por sesión; el destinatario debe ser de la empresa del aviso) y `test/notificaciones/tiempo-real.e2e-spec.ts` (el canal solo publica a la persona destinataria) | D143, D151 |
