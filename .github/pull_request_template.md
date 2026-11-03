## Qué cambia

<!-- Una o dos frases. Enlaza el ticket de Jira (MD-n). -->

## Antes de pedir revisión (STANDARD.md §5)

Un cambio no termina hasta que actualiza todo lo que toca, en este mismo PR. Marca lo que aplique y borra lo que no.

- [ ] **Decisión (`D-n`)**: si se decidió algo, está en `datos/decisiones/README.md` con su fuente (quién y cuándo)
- [ ] **Pendiente (`P-n`)**: si cierra o abre una pregunta, `datos/pendientes/README.md` está al día (y el ticket de Jira lo dice)
- [ ] **Deuda (`DT-n`)**: si usa un atajo, está registrada en `deuda-tecnica/`; si cierra una, se borró
- [ ] **Seguridad (`SEG-n`)**: si hay un requisito nuevo o cambia el estado de uno, [`seguridad/`](../skills/product/monkey-compliance-council/references/seguridad/README.md) lo refleja
- [ ] **Contrato**: el endpoint o formulario está en `contracts/` (y `conventions.md` / `enums.md` si toca el sobre, un error o un enum)
- [ ] **Documentos afectados**: `modelo-datos.md` y su módulo, `context/`, el roadmap; cada dato vive en un solo archivo y los demás lo enlazan
- [ ] **Confidencialidad**: ninguna pantalla, texto o contrato nombra al proveedor de la sonda ni copia credenciales
