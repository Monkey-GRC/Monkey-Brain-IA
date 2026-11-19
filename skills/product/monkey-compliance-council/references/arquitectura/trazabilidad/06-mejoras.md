# Trazabilidad · Mejoras

Propuestas; lo aprobado pasa a `DT-n` o a una `D-n`.

| # | Mejora | Prio | Esfuerzo |
|---|---|---|---|
| M1 | Particionar por mes y definir qué se archiva | B | M |
| M2 | La retención de 7 años no está garantizada | A | M |
| M3 | Los intentos denegados no se registran todos | B | S |
| M4 | No hay pantalla para consultar el rastro | C | M |

## M1 · Tablas que solo crecen
`audit_logs` y `compliance_events` son de solo anexar y se conservan años. Particionar por mes mantiene las
consultas rápidas (siempre son «de esta empresa, en este rango») y permite archivar particiones viejas sin tocar
las vivas. El mismo problema con `evaluations` y `check_results` está en
[`control-tecnico/06-mejoras.md`](../control-tecnico/06-mejoras.md) (M3).

## M2 · La retención es un requisito abierto
`SEG-35` está en 🟠: los respaldos generales rotan a 35 días y no sostienen los 7 años que pide SOC 2. Depende de
`DT-84` y `D72`. Es lo primero que pregunta un auditor sobre el rastro.

## M3 · `CC7.2` y `CC7.3` a medias
`SEG-37` está en 🟠: se registran el login fallido y el canje fallido, pero no todos los accesos denegados (un
`403` de un recurso ajeno, por ejemplo). SOC 2 pide detectar actividad no autorizada, y hoy esa señal no queda.

## M4 · El rastro no tiene interfaz
Existe en la base y se consulta por SQL. La matriz de permisos (§5.5) ya dice quién puede ver el rastro, pero no
hay endpoint ni pantalla. Un auditor lo va a pedir exportable.
