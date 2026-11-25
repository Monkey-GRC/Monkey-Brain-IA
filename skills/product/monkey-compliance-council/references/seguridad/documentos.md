# Requisitos de seguridad — Documentos

Que la aceptación de un documento sirva como evidencia: inmutable y de quien la hizo.

Tablero, estados y reglas de uso: [`README.md`](README.md). Cómo funciona el módulo: [`arquitectura/documentos/`](../arquitectura/documentos/README.md).

| ID | Estado | Requisito | Cómo se hace cumplir | Verificación | Fuente |
|---|---|---|---|---|---|
| **SEG-88** | ✅ MD-503 | La aceptación de un documento es inmutable: no se edita ni se borra, para ningún rol de la base, salvo la purga de una empresa archivada | `REVOKE UPDATE, DELETE` a `monkey_app` y trigger que solo deja borrar durante la purga (patrón de SEG-83); índice único por versión y persona | **MD-503 (2026-11-25).** `test/documentos/inmutabilidad.e2e-spec.ts`: conectada como `monkey_app` y como dueño, la aceptación no se edita, no se borra ni se vacía la tabla (triggers), una sola por persona y versión, y solo la purga de una empresa archivada la borra | D133, D152 |
