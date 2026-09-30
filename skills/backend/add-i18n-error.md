---
id: add-i18n-error
name: Agregar un error manejado con i18n
description: Cómo agregar un error de negocio nuevo, con su error.code del contrato y su mensaje traducido, que recoge el filtro global de excepciones.
type: skill
applies_to: backend
---

# Skill: Agregar un error manejado con i18n

Los errores del API pasan por `src/common/filters/http-exception.filter.ts`, que arma el sobre de
error del contrato (`contracts/conventions.md`): `{ statusCode, message, data: null, error: { code, … } }`,
con `message` ya traducido según `Accept-Language` (`nestjs-i18n`, archivos en `i18n/es` e `i18n/en`).

## Pasos

1. Tomar el `error.code` de la tabla de errores del contrato del módulo
   (`contracts/modules/*.md`). Si no está, el contrato se actualiza primero.
2. Agregarlo al tipo `DomainErrorCode` en `src/common/errors/domain-error.ts` y a
   `DOMAIN_ERROR_CATALOG` en `domain-error.catalog.ts`, con su status HTTP y su clave i18n
   (`<archivo>.<clave>`, p. ej. `company.name_taken` → `i18n/<lang>/company.json`, clave `name_taken`).
3. Agregar la clave en **los dos** idiomas, con la misma estructura.
4. Lanzarlo desde el caso de uso: `throw new DomainError('COMPANY_NAME_TAKEN')`. Datos extra para el
   cliente van en el segundo argumento y salen dentro de `error` (p. ej. `retry_after_seconds`).

Los errores de validación de DTOs no se lanzan a mano: el `ValidationPipe` global devuelve `422
VALIDATION_FAILED` con **todos** los campos, cada uno con su código corto (`required`,
`email.invalid`…) traducido desde `i18n/<lang>/validation.json`. Un código de validación nuevo se
mapea en `src/common/errors/validation.exception.ts`.

## Restricciones

- No agregar mensajes en un solo idioma.
- No lanzar `HttpException` ni `Error` genérico desde un caso de uso: el caso de uso no sabe de HTTP.
- Un error nunca expone detalle interno (stack, SQL, nombre del proveedor de la sonda). Lo
  inesperado sale como `500 INTERNAL_ERROR` y el detalle solo queda en el log.
