# Plataforma · historias de usuario

Responde: **¿qué le pide el equipo de Monkey a lo transversal (respuestas, errores, idiomas, límites, correo, archivos,
cifrado) y a la operación del servidor (despliegue, respaldos, exposición), y cómo se comprueba que lo tiene?** Cada
historia dice quién, qué y para qué; sus criterios citan la regla que los fija. La forma de cada respuesta está en
[`contracts/conventions.md`](../../../../../../contracts/conventions.md); la secuencia, en [`03-flujos.md`](03-flujos.md);
el servidor, en [`infraestructura/`](infraestructura/README.md); los pasos de cada caso, en
[`05-casos-de-uso.md`](05-casos-de-uso.md).

**Jira:** épica [MD-322](https://rod2408.atlassian.net/browse/MD-322), una historia por fila. El cerebro manda: si una historia cambia, se actualiza aquí y después su issue.

**Actores.** Plataforma no tiene pantallas: sus historias son de **operación**. «Equipo de Monkey» = quien desarrolla y
opera el producto (los frontends consumen estas reglas); «Sistema» = el Backend o un proceso programado. `admin_monkey`
(D96) solo aparece cuando usa Monkey Admin. **Estado:** ✅ construida · 🟡 parcial · ⚪ por construir. Solo hay historias
de lo decidido: las mejoras propuestas ([`06-mejoras.md`](06-mejoras.md), [`infraestructura/`](infraestructura/README.md))
no son historias hasta que se decidan.

## Resumen

| ID | Historia | Rol | Estado | Reglas | Jira |
|---|---|---|---|---|---|
| HU-PLT-01 | Recibir toda respuesta con el mismo sobre | Equipo de Monkey | ✅ | `conventions.md` | MD-442 |
| HU-PLT-02 | Recibir cada error con un código estable y los campos señalados | Equipo de Monkey | ✅ | `conventions.md`, `VALIDATION_FAILED` | MD-443 |
| HU-PLT-03 | Que el mensaje llegue en el idioma de la persona | Equipo de Monkey | ✅ | D111, `conventions.md` | MD-444 |
| HU-PLT-04 | Paginar igual toda colección que crece | Equipo de Monkey | ✅ | `conventions.md` | MD-445 |
| HU-PLT-05 | Frenar el abuso por usuario y por empresa | Sistema | 🟡 | SEG-19, DT-37, D124 | MD-446 |
| HU-PLT-06 | Frenar por dirección las rutas públicas | Sistema | ⚪ | D124, DT-37 | MD-447 |
| HU-PLT-07 | Esperar una conexión libre en vez de fallar | Sistema | ✅ | D49 | MD-448 |
| HU-PLT-08 | Enviar correos con la marca y un servicio intercambiable | Sistema | ✅ | D99, D111, SEG-71 | MD-449 |
| HU-PLT-09 | Guardar y entregar archivos sin hacerlos públicos | Sistema | ✅ | SEG-44, SEG-59 | MD-450 |
| HU-PLT-10 | Aceptar un archivo solo si su contenido es lo que dice | Sistema | ✅ | SEG-43, SEG-60 | MD-451 |
| HU-PLT-11 | Guardar cifradas las credenciales del cliente | Sistema | ✅ | SEG-24, D46 | MD-452 |
| HU-PLT-12 | Rotar la llave de cifrado con un procedimiento | Equipo de Monkey | ⚪ | SEG-25, DT-5 | MD-453 |
| HU-PLT-13 | Ver la documentación de la API solo en local | Equipo de Monkey | ✅ | SEG-62 | MD-454 |
| HU-PLT-14 | Verificar cada cambio antes de fusionarlo | Equipo de Monkey | 🟡 | SEG-40, SEG-41, DT-46 | MD-455 |
| HU-PLT-15 | Desplegar al fusionar, con el entorno comprobado y la base respaldada | Equipo de Monkey | ✅ | SEG-42 | MD-456 |
| HU-PLT-16 | Respaldar la base cada noche y poder recuperarla | Equipo de Monkey | 🟡 | DT-84, SEG-35 | MD-457 |
| HU-PLT-17 | Mantener al día la base de ubicación | Sistema | ✅ | D123 | MD-458 |

---

### HU-PLT-01 · Recibir toda respuesta con el mismo sobre

**Como** equipo de Monkey, **quiero** que toda respuesta del Backend, correcta o con error, tenga la misma forma **para**
tener un solo manejador en cada frontend.

- Toda respuesta trae `statusCode` (repite el HTTP), `message` y `data`; un error añade `error` (`conventions.md`, Sobre).
- `data` es `null` en un error y en un `204`.
- Los campos viajan en `snake_case` inglés, las fechas en ISO 8601 UTC con `Z` y lo opcional como `null` explícito.
- `POST` responde `201` con el recurso; `DELETE`, `204`; un trabajo lento, `202` con su estado (`conventions.md`, Escritura).

### HU-PLT-02 · Recibir cada error con un código estable y los campos señalados

**Como** equipo de Monkey, **quiero** que cada error traiga un `error.code` que no cambie **para** decidir qué pantalla
mostrar sin leer el texto.

- `error.code` va en `SCREAMING_SNAKE_CASE` y no se traduce nunca.
- Un error de validación responde `422 VALIDATION_FAILED` con **todos** los campos que fallan a la vez en `error.fields`,
  cada uno con su nombre del request (`services[0].data_types`), su código corto y su mensaje traducido.
- Un recurso de otra empresa responde `404 NOT_FOUND`, no `403`.
- Un `500 INTERNAL_ERROR` nunca expone la traza ni el detalle interno.
- El caso de uso lanza un error de dominio sin saber de HTTP; el filtro lo traduce a su estado ([`03-flujos.md`](03-flujos.md) §2).

### HU-PLT-03 · Que el mensaje llegue en el idioma de la persona

**Como** equipo de Monkey, **quiero** que el Backend traduzca `message` y las etiquetas según `Accept-Language` **para**
que cada persona lea Monkey en su idioma sin traducir en cada pantalla.

- Con `Accept-Language: es` o `en`, `message` y los mensajes de cada campo llegan traducidos a ese idioma.
- `error.code` y los valores de los enums no se traducen: el frontend resuelve su etiqueta por i18n o con
  `GET /v1/catalogs/{enum}` y nunca hardcodea listas.
- Los textos de la base que no son catálogo del comité se traducen al responder, por código (D111 punto 4).

### HU-PLT-04 · Paginar igual toda colección que crece

**Como** equipo de Monkey, **quiero** una sola forma de pedir y devolver páginas **para** reutilizar la misma tabla en
todo el producto (D109).

- Se pide con `page`, `page_size` y `sort` (`-campo` para descendente); `page` arranca en 1.
- `page_size` vale 25 por defecto y como máximo 100.
- La respuesta trae `items`, `page`, `page_size`, `total` y `total_pages`.

### HU-PLT-05 · Frenar el abuso por usuario y por empresa

**Como** sistema, **quiero** limitar las peticiones de cada usuario y de cada empresa **para** que nadie degrade el
servicio de los demás.

- Más de 100 peticiones por minuto de un usuario, o 1000 de una empresa, responden `429 RATE_LIMITED` con `Retry-After`
  (SEG-19).
- Una petición rechazada no gasta cupo; otra empresa no se entera del tope de la primera.
- Los topes se configuran con `RATE_LIMIT_USER_PER_MINUTE` y `RATE_LIMIT_COMPANY_PER_MINUTE`.
- *Falta:* el contador vive en la memoria de cada instancia (DT-37); D124 decide compartirlo en Redis para correr varias
  instancias. Qué hacer si Redis no responde está por confirmar al implementarlo (D124 punto 5).

### HU-PLT-06 · Frenar por dirección las rutas públicas

**Como** sistema, **quiero** limitar por dirección de origen el ingreso y la recuperación de contraseña **para** frenar la
fuerza bruta antes de que haya sesión.

- Las rutas públicas de autenticación tienen tope por dirección, con el contador compartido en Redis (D124 puntos 1 y 2).
- Hoy no está: las rutas públicas no pasan por el límite general (DT-37).

### HU-PLT-07 · Esperar una conexión libre en vez de fallar

**Como** sistema, **quiero** que una petición espere hasta 10 s por una conexión del pool **para** que una ráfaga no
termine en errores con la base sana.

- `withScope` fija `maxWait` en 10 s; el límite de duración de la transacción no cambia (D49).
- Pasado ese plazo, la petición responde `500 INTERNAL_ERROR` sin detalle interno.

### HU-PLT-08 · Enviar correos con la marca y un servicio intercambiable

**Como** sistema, **quiero** enviar los correos por un puerto `Mailer` con la plantilla de marca **para** cambiar de servicio
de correo sin tocar los módulos.

- El servicio lo decide `MAIL_PROVIDER`: `resend` exige `MAIL_API_KEY` y `MAIL_FROM`; `log` (a la consola) solo fuera de
  producción. En producción el servidor no arranca sin un servicio real (D99, SEG-71).
- Todos comparten la plantilla de marca, con el logo incrustado en el mensaje y no como URL ([`03-flujos.md`](03-flujos.md) §5).
- Cada correo sale en el idioma de quien lo recibe cuando se sabe, y si no en el de quien lo envía (D111 punto 2).
- Un fallo del correo no deshace la operación que lo pidió: se informa y se puede reenviar.

### HU-PLT-09 · Guardar y entregar archivos sin hacerlos públicos

**Como** sistema, **quiero** guardar los archivos del cliente en un bucket privado y entregarlos con enlaces que vencen
**para** que ningún archivo quede expuesto por una URL.

- La llave del archivo va prefijada por empresa (`<empresa>/services/<servicio>/…`) (SEG-44).
- La descarga devuelve un enlace firmado de 5 minutos; firma alterada o vencida se rechaza (SEG-59, `npm run storage:smoke`).
- El bucket no tiene política pública y el backend usa una cuenta limitada a ese bucket (SEG-59).
- Sin almacenamiento configurado la aplicación arranca y la operación responde `503 STORAGE_UNAVAILABLE`; nunca finge que
  guardó.

### HU-PLT-10 · Aceptar un archivo solo si su contenido es lo que dice

**Como** sistema, **quiero** validar cada archivo subido por su contenido **para** no guardar algo que se hace pasar por otra
cosa.

- La descripción del sistema solo acepta PDF o `.docx` de hasta 25 MB (SEG-43); una evidencia, PDF, DOCX, XLSX, PNG o JPG
  de hasta 25 MB (SEG-60).
- El tipo se comprueba por la firma del contenido, no por la extensión ni por lo que dice el navegador; un DOCX o XLSX se
  reconoce por el directorio central del zip.
- El nombre no puede salirse de la ruta; se guarda la huella SHA-256 y una versión nueva nunca pisa la anterior (SEG-60).
- Si el registro de la fila falla, el archivo subido se borra ([`03-flujos.md`](03-flujos.md) §4).

### HU-PLT-11 · Guardar cifradas las credenciales del cliente

**Como** sistema, **quiero** cifrar las credenciales de los sistemas del cliente **para** que ni una respuesta ni la base las
revelen.

- Se guardan con AES-256-GCM en formato `v1.…` y nunca se devuelven: ni en el alta, ni en el detalle, ni en el listado
  (SEG-24).
- Los tokens se guardan como huella HMAC con *pepper*, no en claro.

### HU-PLT-12 · Rotar la llave de cifrado con un procedimiento

**Como** equipo de Monkey, **quiero** gestionar y rotar la llave de cifrado de las credenciales **para** limitar el daño si
se filtra.

- La llave vive en un gestor de secretos o KMS en producción, no en el `.env` (DT-5).
- Rotar re-cifra las credenciales con una versión nueva (`v2.…`) sin dejar ninguna ilegible (SEG-25).

### HU-PLT-13 · Ver la documentación de la API solo en local

**Como** equipo de Monkey, **quiero** la documentación de la API en mi máquina y en ningún dominio desplegado **para** no
revelar cada ruta, rol y error.

- `/v1/docs` y `/v1/docs-json` solo se registran con `API_DOCS_ENABLED=true`; si no, responden 404 (SEG-62).
- Con `NODE_ENV=production` siguen apagadas aunque la variable esté en `true`.

### HU-PLT-14 · Verificar cada cambio antes de fusionarlo

**Como** equipo de Monkey, **quiero** que cada PR pase lint, build, pruebas y migraciones desde cero **para** no desplegar algo
roto.

- Cada PR a `develop` o `main` corre lint, compilación, tipos, unitarias, migraciones desde cero, verificadores de catálogo,
  clonado y rastro de auditoría, y las pruebas de aislamiento entre empresas (SEG-40).
- *Falta:* un PR en rojo se puede fusionar y el despliegue no espera al CI (SEG-41, DT-46).

### HU-PLT-15 · Desplegar al fusionar, con el entorno comprobado y la base respaldada

**Como** equipo de Monkey, **quiero** que fusionar en `develop` despliegue solo **para** probar en el servidor sin pasos a
mano.

- Al fusionar, cada repo copia su código a la VPS y reconstruye su contenedor (`deploy-dev.yml`).
- En el Backend, antes de nada, `check-env.sh` detiene el despliegue si al `.env` o al `runner.env` del servidor les falta
  algo; los archivos de entorno viven solo en el servidor y el despliegue no los escribe.
- `migrate.sh` respalda la base antes de migrar y migra con el rol dueño, que no está en el `.env` del backend (SEG-42).
- Si un paso falla, el despliegue se aborta y el backend anterior sigue corriendo.

### HU-PLT-16 · Respaldar la base cada noche y poder recuperarla

**Como** equipo de Monkey, **quiero** un respaldo nocturno verificado y fuera del servidor **para** recuperar la base si se
pierde y cumplir la retención prometida (D97, D72).

- Cada noche se vuelca la base, se comprueba que el volcado se lee, se sube al almacenamiento y se verifica su tamaño;
  expira a los 30 días y quedan 7 copias locales (`backup-staging.sh`).
- *Falta:* nada comprueba que el respaldo corrió ni avisa si falla; producción no tiene respaldo con recuperación a un punto
  en el tiempo ni rotación de 35 días (DT-84, SEG-35).

### HU-PLT-17 · Mantener al día la base de ubicación

**Como** sistema, **quiero** actualizar cada semana la base local de ubicación por IP **para** mostrar la ciudad de un
dispositivo recordado sin enviar la IP a un tercero (D123).

- Un proceso semanal descarga la base, deja la anterior como copia y el Backend la relee sola en una hora como mucho
  (`geoip-update.sh`).
- Las credenciales del proveedor viven en su propio archivo del servidor, no en el `.env` del backend.
