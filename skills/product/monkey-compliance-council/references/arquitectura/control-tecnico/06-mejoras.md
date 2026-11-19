# Control técnico · Mejoras

Propuestas; lo aprobado pasa a `DT-n` o a una `D-n`. La deuda ya registrada está en
`deuda-tecnica/control-tecnico.md` y no se repite aquí.

| # | Mejora | Prio | Esfuerzo |
|---|---|---|---|
| M1 | Nadie dispara lo programado | A | M |
| M2 | Un fallo de la sonda se ve como «pendiente» | B | M |
| M3 | `check_results` y `evaluations` crecen sin parar | B | M |

## M1 · Nadie dispara lo programado

La frecuencia que el cliente programa en un activo de nube (`PUT /v1/assets/{id}/schedule`) se guarda, pero en `Backend/src/` ningún componente crea
ejecuciones a partir de ella: falta un planificador para la nube. Para los servidores con agente sí existe (`AgentReadingScheduler`, cada minuto,
solo encola; dos instancias a la vez son seguras por un índice único), y la purga de empresas vencidas también tiene el suyo.

## M2 · Un fallo de la sonda se ve como «pendiente»

`interpretTestResult` no produce `error`: lo que la sonda no pudo decidir se guarda como `pending` (`DT-50`). Es
coherente con «un fallo técnico no es un incumplimiento», pero la pantalla no puede distinguir «no se ha medido» de
«se intentó y falló». Mismo punto que [`../cumplimiento/06-mejoras.md`](../cumplimiento/06-mejoras.md) (M7).

## M3 · Tablas que solo crecen

`check_results` crece por (corrida × check × recurso) y `evaluations` por (corrida × control × prueba × activo). Con
la sonda corriendo a diario sobre muchos activos se vuelve el mayor volumen de la base. Particionar por mes y
definir retención (las de auditoría se conservan por SOC 2; los `check_results` antiguos pueden archivarse).
