# Cumplimiento · Para estudiar

Responde: **¿cómo compruebo que entendí el módulo?** Siete ejercicios en orden; cada uno debería tomar menos de
media hora. Lo que conviene revisar (cosas raras del código) está en [`06-mejoras.md`](06-mejoras.md).

## Ejercicios

1. **Dibuja de memoria** la cadena activo → prueba → control → categoría → marco, y al lado qué archivo del motor
   hace cada paso. Compara con [`motor/reglas.md`](motor/reglas.md).
2. **Predice, después comprueba.** Escribe en papel el estado de un control con 3 pruebas (una `compliant`, una
   `evaluating`, una `expired`). Luego abre `domain/engine/control.spec.ts` y busca el caso. ¿Acertaste el orden de
   prioridad?
3. **Rompe una regla a propósito.** En una rama que no vas a subir, cambia en `control.ts` el orden de dos
   condiciones y corre `cd Backend && npx jest src/features/compliance/domain`. ¿Qué test falla y qué te dice del negocio?
4. **Sigue una petición real.** Levanta el Backend y la base en local, pon un `console.log` en `readControl` y abre
   la pantalla de Controles. ¿Cuántas veces se llama? ¿Una vez por control?
5. **Mira el aislamiento funcionar.** En `psql`, conéctate como `monkey_app` sin fijar `app.tenant_id` y haz
   `select count(*) from tenant.client_controls`. Luego fija un tenant con
   `select set_config('app.tenant_id', '<uuid>', false)` y repite. Eso es lo que `withScope` hace por ti.
6. **Provoca un evento de cambio de estado.** Da un veredicto desde la pantalla y mira la tabla
   `audit.compliance_events`: ¿qué hay en `previous_value` y `new_value`?
7. **Agrega algo mínimo:** un estado imaginario de prueba (`waived`, por ejemplo) y recorre todo lo que habría que
   tocar: motor, `control-readout`, contrato, `enums.md`, frontend. Es la mejor forma de entender el alcance de un cambio.

## Las preguntas que nos podrían hacer

Si puedes responderlas en voz alta, entiendes el módulo. Todas tienen respuesta en estos documentos.

1. ¿Por qué el cumplimiento no se guarda en una columna?
2. ¿Cómo evitan que un cliente vea los datos de otro? ¿Y si un desarrollador olvida el filtro?
3. ¿Qué pasa si falla el registro de auditoría en medio de un veredicto?
4. ¿Por qué un control con 45 de 50 servidores conformes no «casi cumple»?
5. ¿Por qué el porcentaje no decide el cumplimiento?
6. ¿Cómo evitan que la IA certifique algo?
7. ¿Cómo agregarían un marco nuevo (ISO 27001) sin reconstruir?
8. ¿Qué pasa cuando la sonda falla? ¿Cuenta como incumplimiento?
9. ¿Cómo sabría un auditor qué cambió el estado de un control y cuándo?
10. ¿Cómo escala esto con diez veces más controles o activos?

La 10 es la más difícil y es donde [`06-mejoras.md`](06-mejoras.md) aporta.
