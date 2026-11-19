# Cumplimiento · Mejoras

Responde: **¿qué conviene revisar en este módulo?** Son puntos para decidir, no bugs confirmados; ninguno está
cambiado. Lo que se apruebe pasa a `deuda-tecnica/` (`DT-n`) o a una decisión (`D-n`).

| # | Punto | Prio | Esfuerzo |
|---|---|---|---|
| M1 | Hay imports entre features | A | M |
| M2 | Cada lectura y cada escritura recalcula el servicio entero | A | M |
| M3 | `mandatory` y `active` de una prueba están fijos en `true` | B | S |
| M4 | Volver a revisar una evidencia reemplaza la revisión anterior | B | S |
| M5 | El archivo se sube antes de la transacción | C | M |
| M6 | Los cortes del semáforo están definidos dos veces | B | S |
| M7 | El motor tiene un estado que la base no puede guardar | B | M |

## M1 · Hay imports entre features

`context/backend.md` dice «no importar el interior de una feature desde otra». Hay cuatro casos:

| Desde | Hacia | Qué importa |
|---|---|---|
| `technical-control` | `compliance` | `captureControlStates`, `recordControlStateChanges` (en `scan.prisma.repository.ts`) |
| `services` | `onboarding` | `CloneCatalogService` |
| `companies` | `auth` | `StepUp` |
| `technical-control` | `catalogs` | `CapabilityOptionResponse` (un tipo de respuesta) |

El primero es el relevante aquí: Control Técnico depende del interior de Cumplimiento porque ambos registran el
cambio de estado cuando la sonda escribe un resultado. La solución natural es subir `captureControlStates` y
`recordControlStateChanges` a `common/` o `infrastructure/`, o exponerlas como un puerto.

Buscar la ruta `features/` **no los encuentra**, porque los imports son relativos (`../../../compliance/...`):

```bash
cd Backend/src/features
for d in */; do n=${d%/}
  grep -rnE "from '(\.\./)+[a-z-]+/(application|domain|infrastructure|presentation)/" "$n" --include='*.ts' \
   | grep -vE "from '(\.\./)+(application|domain|infrastructure|presentation)/" | grep -v '\.spec\.ts' \
   | while IFS= read -r l; do t=$(echo "$l" | sed -E "s/.*from '((\.\.\/)+)([a-z-]+)\/.*/\3/"); [ "$t" != "$n" ] && echo "$n -> $t :: $l"; done
done
```

## M2 · Cada lectura y cada escritura recalcula el servicio entero

`readControl` se ejecuta para **todos** los controles del servicio, incluso si la pantalla muestra una página o si
el usuario es un `funcional` que ve pocos. Y cada escritura toma **dos** fotos completas (antes y después), más una
tercera en el veredicto para devolver el estado de la prueba.

Hoy es razonable: evita el problema de N+1. Pero el costo crece con el tamaño del servicio y con el histórico de
`evaluations` (la lectura de «lo más reciente» usa `DISTINCT` sobre una tabla que solo crece). **No optimizar sin
medir**: corre el ejercicio 4 de [`07-estudio.md`](07-estudio.md) con un servicio grande y mira el tiempo.

Alternativas si hiciera falta (no decididas): paginar antes de calcular, o guardar el último resultado por
`(control, prueba, activo)` en una tabla aparte como optimización (sigue siendo derivable).

## M3 · `mandatory` y `active` de una prueba están fijos en `true`

En `service-snapshot.loader.ts`, al armar las pruebas de un control: `mandatory: true, active: true`, porque
`client_control_tests` todavía no guarda esos datos (D68). El motor ya sabe tratarlos (`control.ts` filtra por
ellos), pero hoy nunca llegan en otro valor.

## M4 · Volver a revisar una evidencia reemplaza la revisión anterior

`saveReview` hace `upsert` sobre la clave `(entrega, rol)`. La revisión anterior desaparece de `evidence_reviews`;
solo queda su rastro en `audit_logs`. Las evaluaciones, en cambio, nunca se pisan. Puede ser deliberado (una sola
revisión por entrega, D96), pero conviene saber que **el historial de revisiones vive en la auditoría, no en la
tabla**: evita buscar en el sitio equivocado ante un auditor.

## M5 · El archivo se sube antes de la transacción

`UploadEvidenceUseCase` hace `storage.put` y luego la transacción; si esta falla, borra el archivo. Si el proceso
muere entre medio, el archivo queda huérfano en el bucket, sin fila que lo apunte. Es el patrón habitual y el riesgo
es de espacio, no de integridad. Si importa, la solución es un barrido periódico de archivos sin fila.

## M6 · Los cortes del semáforo están definidos dos veces

`READY_CUTOFF` y `ALMOST_READY_CUTOFF` aparecen en `engine/asset-readiness.ts` y en `controls/control-readout.ts`,
y `overview` importa los del segundo (un comentario menciona `DT-66`). Si alguien cambia uno y no el otro, el
producto leería el mismo 80 % de dos maneras. Mejor una sola fuente.

## M7 · El motor tiene un estado que la base no puede guardar

El enum `evaluation_result` solo tiene `compliant`, `non_compliant`, `pending` y `not_applicable`. El motor trabaja
con `AssetResult`, que además incluye `error` y `excluded`:

- `excluded` sí se produce: es la superposición de una exclusión al leer ([`02-modelo.md`](02-modelo.md)).
- `error` **no se produce hoy**: `interpretTestResult` solo devuelve `non_compliant`, `pending`, `compliant` o
  `not_applicable`. Un resultado que la sonda no pudo decidir se guarda como `pending` (`DT-50`).

Consecuencia: el camino `error` de `automated-test.ts` y `control.ts` está escrito y probado, pero **no es
alcanzable con datos reales** mientras `DT-50` siga abierta. Para el usuario, un fallo de la sonda se ve como
«pendiente». Es coherente con el principio 5 de [`motor/reglas.md`](motor/reglas.md), pero la pantalla no
puede distinguir «no se ha medido» de «se intentó y falló».

## Cómo verificarlo

- M1: el comando de arriba. · M2: ejercicio 4 y `loadServiceSnapshot`. · M3: `service-snapshot.loader.ts`, buscar
  `mandatory: true`. · M4: `EvidencePrismaRepository.saveReview` (el `upsert`). · M5: `UploadEvidenceUseCase.execute`.
- M6: `grep -rn "READY_CUTOFF" Backend/src`. · M7: `interpretTestResult` y [`DT-50`](../../deuda-tecnica/control-tecnico.md).
