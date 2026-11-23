# Decisiones — Documentos

Por qué Documentos es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/documentos/`](../../arquitectura/documentos/README.md) y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](README.md).

## D133 · Documentos: versiones, flujo de aprobación, aceptación del personal y una prueba documental por documento (2026-11-22)

**Decisión** (`MAP CALOR`, secciones 4 y 13; hoja `Documentos`; `Modelo de Gestión usuarios`, Tabla 2; `PE-DOC-01`):

1. **Módulo nuevo.** Las políticas, procedimientos, manuales, planes y matrices de la empresa se crean o se importan, se aprueban y se divulgan **dentro de Monkey**. Cada documento tiene **un solo responsable** (D-01), que asigna y cambia el `admin_empresa`; se sugiere el responsable del control principal.
2. **Versiones** (D-05, D-06): cada cambio crea una versión; hay una sola vigente; las anteriores se archivan y nunca se borran. Estados: borrador, en aprobación, rechazado, aprobado, vigente, por renovar, vencido y archivado. Una versión en aprobación no se edita: para cambiarla se cancela la solicitud.
3. **Flujo de aprobación**, que define el responsable del documento: hasta 5 pasos (PR-11) con hasta 3 aprobadores por paso (PR-12), en orden. Aprueban solo usuarios activos de la misma empresa con rol `admin_empresa` o `responsable` (D-02); quien envía el documento no puede ser su único aprobador (D-03, PR-13). La versión queda aprobada cuando aprueban todos; un rechazo exige motivo y la devuelve a borrador (D-04).
4. **Aceptación** (D-08, D-10, D-15): el responsable decide si lo aceptan todos los usuarios, solo los usuarios o grupos a los que aplica, o nadie; el plazo es de 30 días desde la asignación (PR-14) y quien entra después a un grupo asignado lo recibe con su propio plazo. Una versión con cambios de fondo pide nueva aceptación; una con cambios menores (ortografía, formato, logo), no. Un documento que no requiere aceptación queda **publicado** para quienes indique el responsable. Los **grupos** son los equipos de D102.
5. **Importar un documento ya aprobado fuera de Monkey** (D-07): el responsable registra los aprobadores, la fecha (obligatoria si hay aprobador) y el soporte, y la versión queda marcada «Aprobación importada»; la siguiente renovación pasa por el flujo de Monkey. **Los documentos externos** (D-11, como una póliza) no pasan por aprobación ni aceptación: se cargan con su emisor y sus fechas de vigencia.
6. **Renovación** (D-09): el documento se revisa y se aprueba de nuevo según su periodicidad de revisión aunque no cambie, con alerta previa (PR-06).
7. **Efecto en la evaluación** (D-12, T-01): la prueba documental del documento (`T-DOC`) es correcta con el documento vigente, o aprobado con la aceptación dentro del plazo, y con todo su contenido mínimo; sin aprobación completa o vencido es excepción y **el control no pasa de Débil** (R2); con el plazo vencido y alguien sin aceptar, observación (PR-15).
8. **Roles**: el `colaborador` (D136) ve y acepta solo los documentos que le asignan; el `auditor` consulta documentos, aprobaciones y aceptaciones sin aprobar ni aceptar. Cada acción queda en el registro de auditoría (D-13).

**Por qué.** Reemplaza a las plantillas de evidencia y a las políticas que solo tenían nombre (D36, D39): aprobar y divulgar un documento pasa a ser evidencia que Monkey genera, no un archivo que se sube aparte.

**Qué cambia.** Módulo nuevo `arquitectura/documentos/`, `contracts/documentos.md` (se escribe antes de construir, RC-09), §3, §7 y la matriz §5.5. Con D132, **reemplaza D88**: la prueba documental ya no se valida en cada control con la evidencia subida para ella; es una por documento y se resuelve con su flujo.

**Fuente:** comité funcional, VF18 (`MAP CALOR`, secciones 4 y 13; hojas `Documentos` y `PROCEDIMIENTOS`; `Modelo de Gestión usuarios`, Tabla 2), 2026-11-22. Que los grupos de la aceptación son los equipos de D102 lo interpretó desarrollo.
