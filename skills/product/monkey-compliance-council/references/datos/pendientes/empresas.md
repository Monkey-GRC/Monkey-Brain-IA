# Pendientes del comité — Empresas

Preguntas abiertas que afectan a [Empresas](../../arquitectura/empresas/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

## P2 · El flujo de la clave de acceso — 5 detalles sin definir

La decisión de fondo está cerrada (D24: Monkey Admin registra el tenant, la clave se manda
al `admin_email`). Falta el detalle operativo, y **condiciona la pantalla del día 1-2 del
sprint de onboarding**:

| # | Pregunta |
|---|---|
| a | ¿La clave es un código que el cliente escribe a mano, o un link con token en la URL? Cambia qué pantalla hay que construir. *Hoy se implementó como código escrito a mano, en dos pasos (D51); no es una respuesta explícita del comité a esta pregunta* |
| b | ~~¿Cuánto dura antes de expirar, y puede `admin_monkey` regenerarla o reenviarla si el correo se perdió?~~ **Cerrada por D99 (2026-10-30)**: 7 días (`ACCESS_KEY_TTL_HOURS`); se reenvía con una clave nueva |
| c | Si `admin_monkey` se equivoca escribiendo el nombre de la empresa o el correo, ¿se puede corregir desde Monkey Admin antes de que el cliente entre? Importa porque ese nombre queda **bloqueado** en el Componente 1 |
| d | Si se marca "base de datos dedicada", ¿aprovisionarla es instantáneo o toma tiempo? Si toma tiempo, ¿se manda la clave de una vez o se espera? |
| e | ¿Puede haber más de un correo administrativo por empresa desde el registro, o el resto de usuarios se invita después desde adentro? |

Las más urgentes son **(a)** y **(c)**.

---

## P13 · Ratificar lo que desarrollo decidió en las correcciones del 2026-10-05 (D50, D51)

**Estado:** abierto desde 2026-10-06. No bloquea nada: todo está construido y funcionando; falta que el comité lo confirme.

1. **Lista de 7 marcos ofrecidos** (SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST CSF, SOC 1) y su orden. La armó desarrollo con datos de demanda de proveedores de cumplimiento (Drata, ACC 2025), no el comité. ¿Es la lista correcta para la oferta comercial?
2. **Lista de 18 normas de protección de datos** (DT-40): ¿se ratifica que salga PCI DSS, que HIPAA y GLBA se queden, y las 5 que entraron (Ley 21.719 CL, UY, EC, PA, CR)? ¿Faltan otras (p. ej. Ley 1266 de Colombia)?
3. **Categorías por marco** (D50, DT-38): confirmada la opción de que cada marco use las suyas. Falta que el comité entregue **cuáles son** las de cada marco (ISO 27001: ¿4 temas del Anexo A? PCI DSS: ¿12 requisitos? NIST CSF: ¿6 funciones?) y si «seguridad siempre obligatoria» se generaliza a un dominio obligatorio por marco.
4. **Contacto de ventas** (DT-41): ¿qué canal real recibe el interés cuando un cliente toca un marco que no contrató?
5. **Certificación previa:** ¿las 8 opciones son las correctas para una «certificación o evaluación» previa?
