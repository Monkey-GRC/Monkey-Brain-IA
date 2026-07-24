---
id: add-i18n-error
name: Agregar un error manejado con i18n
description: Cómo agregar un mensaje de error nuevo traducido y que sea recogido por el filtro global de excepciones.
type: skill
applies_to: backend
---

# Skill: Agregar un error manejado con i18n

Los errores del API pasan por `src/common/filters/http-exception.filter.ts`,
que traduce el mensaje usando `nestjs-i18n` y las claves definidas en
`/i18n/en` y `/i18n/es`.

## Pasos

1. Elegir/crear la clave de traducción en ambos archivos de locale:
   - `i18n/en/<archivo>.json`
   - `i18n/es/<archivo>.json`

   Usar la misma estructura de clave en ambos idiomas.

2. Lanzar la excepción en el use-case o servicio correspondiente usando las
   excepciones estándar de Nest (`BadRequestException`, `NotFoundException`,
   `ConflictException`, etc.), pasando la clave de i18n como mensaje — **no**
   texto hardcodeado en español o inglés directo en el código.

3. Verificar que `http-exception.filter.ts` resuelve esa clave correctamente
   (usa el servicio de i18n para traducir según el header `Accept-Language`
   o el mecanismo configurado en el módulo).

4. Confirmar que la respuesta de error mantiene el formato estándar
   (`ResponseDto` / estructura de error consistente con el resto del API).

## Restricciones

- No agregar mensajes de error solo en un idioma.
- No lanzar excepciones genéricas (`Error`) — usar las clases HTTP de Nest para
  que el filtro global las mapee al status code correcto.
