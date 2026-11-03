# Plataforma · Mejoras

Propuestas; lo aprobado pasa a `DT-n` o a una `D-n`. Las cifras de carga son estimaciones hasta que exista la
prueba de [`07-estudio.md`](07-estudio.md).

| # | Mejora | Prio | Esfuerzo |
|---|---|---|---|
| M1 | Dimensionar y vigilar el pool de conexiones | A | S |
| M2 | Pruebas de carga y métricas en el pipeline | A | M |
| M3 | Subir archivos sin cargarlos en memoria | B | M |
| M4 | Límite de peticiones por IP en las rutas públicas | A | M |
| M5 | Claves UUID ordenables (v7) en tablas grandes | C | M |

## M1 · Pool de conexiones sin dimensionar
`PrismaPg` se crea solo con `connectionString`, así que usa el pool por defecto de `pg`. Conviene fijar `max`, los
tiempos de espera y de inactividad por variable de entorno, y registrar cuántas conexiones están en uso. Más
conexiones no arregla una consulta lenta: solo mueve la cola. Cuentas en [`07-estudio.md`](07-estudio.md).

## M2 · No hay prueba de carga ni métricas
Hay pruebas de aislamiento y unitarias, pero nada que mida latencia p95, errores 429/500 o conexiones agotadas. Sin
eso, cualquier cifra de capacidad es un supuesto. Propuesta: k6 contra un entorno con datos realistas, y métricas
(`/metrics` o `pg_stat_statements`) en el pipeline.

## M3 · Los archivos pasan por la memoria del Backend
`FileInterceptor` sin almacenamiento en disco guarda el archivo en memoria durante la petición (con tope por
`EVIDENCE_UPLOAD_LIMIT_BYTES`). Con muchas subidas simultáneas la memoria sube. Salida: subir directo a S3 con URL
prefirmada y registrar la entrega después, como ya se hace con la descarga. Afecta a
[`cumplimiento/evidencia/`](../cumplimiento/evidencia/README.md) y a la descripción del sistema.

## M4 · Las rutas públicas no tienen límite
`RateLimitGuard` corre después de la sesión, así que login y recuperación de contraseña no están limitados: haría
falta la IP real detrás del proxy (`DT-37`). Es la mitad de
[`autenticacion/06-mejoras.md`](../autenticacion/06-mejoras.md) (M2); la otra mitad es compartir el contador entre
instancias.

## M5 · UUID v4 en tablas grandes
Las claves aleatorias dispersan las inserciones por el índice y lo fragmentan. En tablas de alto volumen
(`evaluations`, `check_results`, `audit_logs`) un UUID ordenable en el tiempo reduce ese costo. Solo vale la pena
con volumen real.

## Lo que ya está bien (para no tocarlo)

Un solo sobre de respuesta para todo; el error de dominio separado del HTTP; los puertos con adaptador
`unavailable` en vez de fingir que funcionaron; el bucket no público con enlace firmado; la documentación de la API
apagada fuera de local.
