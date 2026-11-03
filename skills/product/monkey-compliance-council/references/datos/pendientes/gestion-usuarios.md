# Pendientes del comité — Gestión de usuarios

Preguntas abiertas que afectan a [Gestión de usuarios](../../arquitectura/gestion-usuarios/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

## P38 · La cadena de asignación de controles: `admin_empresa` → `funcional` → responsable

**Estado:** abierto desde 2026-11-01. Lo trajo Héctor al planear el sprint 3 (módulo de usuarios). **Reabre parte de D96 (punto 5) y de D98 (puntos 1 y 2)**, que reparten el trabajo **por dimensión**; D98 ya dejaba esta puerta como «Pendiente (Carlos, luego): cómo asignar trabajo a personas concretas». Hay que reunir al comité antes de planear el sprint; al cerrarse, se escribe **D102**.

**Lo que se quiere (palabras de Héctor, 2026-11-01).**
- El `admin_empresa` es el líder de compliance y tiene a su cargo **todos** los controles clonados a la empresa por el onboarding y la evaluación de riesgos (ej. 130).
- Crea a sus `funcional` y les reparte **controles concretos**, no dimensiones: con 3 funcionales, p. ej. 50 / 40 / el resto.
- Cada `funcional` crea su **grupo de responsables** (nivel nuevo, no contemplado) y reparte entre ellos sus controles (p. ej. 50 controles entre 4 personas).
- La cadena sirve para **asignar y dar seguimiento**; **la empresa entera sigue siendo responsable** de cumplir. El administrador, los `funcional` y los responsables reciben notificaciones y se mantienen informados (ver P39).

**Lo que dice el cerebro hoy** (`modelo/05-usuarios.md` §5.1, `contracts/gestion-usuarios.md`): 4 roles fijos, sin roles personalizados; el `funcional` tiene **especialidades** (dimensiones) y atiende todo lo de ellas en todos los servicios, sin asignación (D98); el responsable principal por servicio y dimensión (`service_dimension_owners`) y la excepción por control (`user_control_assignments`, que ya apunta a `client_controls` y lleva `dimension`) existen en la base y la API pero la interfaz los tiene apagados. D96 eligió dimensión porque un control mezcla pruebas de varias dimensiones (~600 pares control–dimensión). **El término «responsable» ya está tomado:** `organization_responsibles` son los **cargos** que responden ante el auditor (COO, CISO…, D30), distintos de una persona con cuenta.

### A. La cadena
1. **Nombre del tercer nivel.** *Recomendación: «responsable» en pantalla, y llamar «cargos de la organización» a `organization_responsibles` para que no choquen.* ¿Cómo se llama, y qué pasa con el nombre de los cargos?
2. **¿Quinto rol o atributo?** *Recomendación: un rol nuevo, porque tiene permisos distintos (ejecuta, no reparte).* Hoy son 4 roles fijos (D96).
3. **¿La cadena es siempre de tres niveles?** ¿El responsable no crea a nadie? ¿Puede el `admin_empresa` crear responsables directamente?
4. **¿Quién crea a los responsables y a qué `funcional` pertenecen?** ¿Uno solo o puede estar en varios equipos?
5. **¿El `admin_empresa` puede asignar un control directo a un responsable, saltándose al `funcional`?**
6. **¿Cuántos dueños tiene un control?** *Recomendación: un `funcional` dueño y un responsable ejecutor por control.*
7. **¿La unidad de asignación es el control completo?** Un control tiene pruebas de varias dimensiones: si se asigna entero, ¿esa persona hace todas sus pruebas, o dentro del control sigue habiendo reparto por dimensión?
8. **¿Se asigna por servicio × marco o por empresa?** Con dos servicios, ¿se asigna dos veces el mismo control, o el control clonado es único por empresa?
9. **¿Qué pasa con la especialidad del `funcional`?** ¿Desaparece, queda como etiqueta o sigue limitando qué controles se le pueden asignar (`USER_LACKS_DIMENSION`, `DIMENSION_IN_USE`)?
10. **Controles sin dueño.** *Recomendación: quedan con el `admin_empresa`, y hay un tablero de «sin asignar».*
11. **¿Un `funcional` puede reasignar un control suyo a otro `funcional`, o solo el `admin_empresa`?**

### B. Reparto, volumen y reglas
12. **Asignación masiva.** Con 130 controles, ¿qué filtros ayudan a repartir (dimensión, categoría, requisito, estado)? ¿Hace falta un reparto equitativo automático?
13. **Controles nuevos.** Si se contrata otro marco o se crea otro servicio y se clonan controles, ¿llegan sin dueño o heredan el del mismo control ya asignado?
14. **Baja de un `funcional` o responsable.** ¿Sus controles vuelven al nivel superior, o se bloquea la baja hasta reasignar? Hoy desactivar a un responsable deja controles «sin responsable efectivo activo» (pendiente de decisión). ¿Qué pasa con su historial?
15. **Carga de trabajo.** ¿Se muestra cuántos controles tiene cada persona y su avance? ¿Hay un tope?
16. **Ausencias.** ¿Existe delegación temporal?

### C. Qué ve y qué puede hacer cada nivel
17. **Visibilidad.** Si «toda la empresa es responsable», ¿cada `funcional` y responsable ve el cumplimiento de todos los controles en solo lectura y edita solo los suyos, o ve únicamente los suyos? Hoy el `funcional` ve solo lo suyo (SEG-66): esa regla cambiaría.
18. **Evidencia y validación.** ¿El responsable sube evidencia? ¿Quién valida: el `funcional` primero y el `admin_empresa` al final, o sigue siendo una sola revisión del administrador (D96)? Afecta a P34 (quien sube es quien valida).
19. **Veredicto de las pruebas manuales no documentales:** ¿sigue siendo solo del `admin_empresa`?
20. **¿El responsable ve la vista técnica?** Hoy es de `auditor` y `admin_empresa` (D81, D96).
21. **MFA.** ¿Se exige TOTP al responsable? (D66, D96: los 4 roles; el Excel dejaba «No» al `funcional`.)
22. **¿El `auditor` ve la cadena de asignación** (quién es dueño de cada control)? ¿Sus observaciones llegan al dueño del control y a quien lo ejecuta?
23. **Permisos por pantalla (P3).** ¿Se espera el Excel del comité o se planea con la matriz de §5.5 extendida?

### D. Lo ya construido
24. **¿Se migra o se reescribe?** `user_dimensions`, `service_dimension_owners` y `user_control_assignments` (con `dimension`) existen. ¿Se eliminan, se conservan como sugerencia inicial de reparto o se convierten en asignaciones por control?
25. **¿Hay empresas reales con asignaciones por dimensión** que migrar, o todo es de desarrollo?
26. **Pantalla «Mi trabajo».** Hoy el `funcional` ve Cumplimiento filtrado, sin bandeja propia. ¿Entra en el sprint 3?

### E. Para el equipo (no del comité)
27. Fechas, duración y capacidad del sprint 3.
28. Tickets viejos del épico MD-153 (MD-131, 132, 134, 143, 158, 94, 175…): varios dicen «Por hacer» aunque `contracts/gestion-usuarios.md` los da por construidos, y otros están marcados `sin-objeto-d96`. ¿Se cierran, se reescriben o se reutiliza el épico? *Recomendación: épicos nuevos «Sprint 3» y MD-153 como histórico.*
29. Convenciones de Jira y GitHub: clave del ticket (`MD-n`) en rama, commit y título del PR; un ticket por repo (Backend o Frontend) con contrato primero; regla de automatización que mueva el ticket al abrir el PR y al hacer merge. Estimación (¿puntos?) y etiquetas.
30. ¿Los contratos y D102 entran como tickets del sprint? ¿Quién ratifica el modelo: el comité, Nelson o el equipo? (D98 salió de una prueba de Carlos.)

**Qué depende:** todo el sprint 3 de usuarios; `contracts/gestion-usuarios.md`, `contracts/cumplimiento/controles.md` y `contracts/cumplimiento/README.md` (quién ve qué); `modelo/05-usuarios.md` §5.1, §5.2 y §5.5; `enums.md` (si hay un rol nuevo); SEG-66. **Las más bloqueantes: 1, 2, 7, 8, 17 y 18.**

---

---

## P40 · Cuentas de Monkey Admin y seguridad de la gestión de usuarios

**Estado:** abierto desde 2026-11-01. Héctor pide definir también el módulo de usuarios «para los Admin Monkey». Hoy `admin_monkey` registra empresas y su primer administrador, administra el catálogo y **no** crea ni desactiva cuentas de una empresa (D43, D96); restablece el segundo factor del `admin_empresa` por script (D94).

1. **¿Qué se quiere gestionar de Monkey?** Crear, desactivar y listar otros `admin_monkey` · roles internos de Monkey (soporte, comercial) · ver el equipo de cada empresa en solo lectura.
2. **MD-143:** la gestión de usuarios heredada de Monkey Admin, ¿se retira o se reescribe?
3. **MD-146:** ¿`admin_monkey` ve el equipo y el estado de cada empresa en solo lectura?
4. **Segundo factor.** Restablecer el del `admin_empresa` es un script (D94, punto 8): ¿pasa a pantalla?
5. **Empresa sin administrador activo.** ¿Cómo se recupera el acceso y quién lo hace?
6. **Rastro.** ¿Cada asignación, reasignación y baja de la cadena (P38) queda en `audit_logs` y en una vista de «historial de asignaciones»?
7. **SOC 2.** CC6.1 y CC6.2 se alimentan de este módulo: ¿se ofrece un reporte exportable de quién tiene acceso a qué, para el auditor?
8. **Límites.** ¿Hay un máximo de usuarios por empresa o por plan?
9. **Perfil.** ¿Qué puede editar cada persona de su perfil (nombre, idioma, zona horaria)?

**Qué depende:** el alcance de MD-143 y MD-146 en el sprint 3 y, si hay roles internos, `enums.md` y la matriz de §5.5.

---
