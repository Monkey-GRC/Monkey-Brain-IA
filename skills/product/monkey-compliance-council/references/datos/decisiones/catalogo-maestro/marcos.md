# Decisiones — Catálogo maestro · Marcos

Por qué este componente es como es. Lo vigente está en [`arquitectura/catalogo-maestro/marcos/`](../../../arquitectura/catalogo-maestro/marcos/README.md). Índice del módulo: [`README.md`](README.md).

## D37 · El MVP contempla solo SOC 2

**Decisión:** el MVP trabaja únicamente con **SOC 2**. ISO 27001, SOC 1, PCI DSS, HIPAA, NIST CSF y el resto
quedan para fases posteriores (`mvp-roadmap.md`: ISO 27001 pasa a la Fase 1).

**Qué implica:**
- `frameworks` tiene una sola fila (`soc2`, versión 2017) y el selector de marco del Componente 2 sale de esa
  tabla, no de una lista fija: un marco no sembrado no se puede elegir (la FK de `service_frameworks` lo
  rompería).
- El modelo sigue siendo multi-framework por diseño (el control es atómico): no se construye nada que
  impida sumar marcos después, pero tampoco se siembra ni se ofrece ninguno.
- No cambia `services.previous_certification` (es lo que el cliente ya tuvo, no lo que contrata) ni el
  catálogo `regulations` (leyes aplicables, no se puntúan: D10).
- `frameworks.type` conserva sus 4 valores; en el MVP solo se usa `attestation`.

**Por qué:** un selector con seis marcos y un catálogo con uno es una trampa: elegir cualquiera de los otros
cinco fallaba o dejaba al cliente sin nada que clonar. **Fuente:** decisión de Héctor, 2026-09-30.


---

## D50 · Todos los marcos se ofrecen, solo SOC 2 se contrata; cada marco con sus categorías

**Decisión** (comité, correcciones del 2026-10-05; categorías confirmadas por Carlos). Cuatro puntos:

1. **Se ofrecen 7 marcos y solo SOC 2 se puede contratar.** Monkey Admin y la pantalla del servicio muestran todos como
   gancho comercial (SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST CSF y SOC 1, en orden de demanda), pero **solo se habilita lo
   que está construido** (hoy, SOC 2) y, en el servicio, lo que la empresa contrató. Si el cliente toca un marco que no tiene
   contratado, no se selecciona: se abre un aviso que lo invita a hablar con mercadeo (mock, DT-41).
2. **`catalog.frameworks.availability`** (`available` | `coming_soon`, migración `20261005220000_correcciones_onboarding_d50_d51`): `soc2` es `available`; los otros seis se
   siembran con `npm run reference:load` como `coming_soon` y **sin requisitos ni controles**. El registro de empresa rechaza un
   `coming_soon` con `409 FRAMEWORK_NOT_AVAILABLE`. `GET /v1/catalogs/frameworks` los trae todos, con `availability`.
3. **Qué marcos y por qué esos.** Los más demandados hoy: SOC 2 es el estándar del SaaS B2B; ISO 27001 es la expansión más
   común (32 % de los clientes de Drata con SOC 2 la suman), seguida de HIPAA (20 %) y GDPR (19 %); PCI DSS lo exigen fintech y
   pagos; NIST CSF es el marco de referencia citado en Colombia; SOC 1 es el hermano financiero de SOC 2. Los siete tienen ficha
   en `frameworks/*.md`. Se dejan fuera CIS Controls (vetado) y FedRAMP, CMMC, DORA y NIS2 (nicho o de otra región).
4. **Categorías: cada marco usa las suyas (opción 2).** ISO 27001:2022 se organiza en 4 temas, PCI DSS en 12 requisitos y NIST
   CSF 2.0 en 6 funciones; forzarlas a las 5 categorías de SOC 2 (seguridad, disponibilidad, confidencialidad, integridad,
   privacidad) distorsiona la cobertura y la lectura del auditor, y ISO ni siquiera tiene un tema «disponibilidad». Es coherente
   con el principio de que el **control es atómico e independiente del marco**: los controles no cambian, solo cómo se agrupan
   los requisitos de cada marco. **La base actual no permite la opción 1** ni sin migrar: `requirements.trust_criterion_id` es una
   FK a un enum de 5 valores.

**Qué no se hizo y por qué:** no se migró el schema. Con SOC 2 como único marco construido, generalizar `trust_criteria` a
dominios por marco sería un cambio grande sin uso. Queda como **DT-38**, y se hace al sembrar el primer marco que no sea SOC 2:
`trust_criteria` → dominios con `framework_id`, `code`, `name` e `is_mandatory`, y `service_trust_criteria` →
`service_framework_domains` (la regla «seguridad siempre» pasa a ser `is_mandatory` del dominio).

**La pantalla del marco:** el texto dice **consultoría**, no auditoría (Monkey acompaña al cliente; no audita). Cada categoría de
SOC 2 trae qué significa y qué se revisará (sin códigos técnicos, `philosophy.md`). Si el cliente no selecciona todas las
categorías, se le avisa que lo recomendable es cubrirlas todas; si decide continuar, se respeta.

**Fuente:** correcciones del comité del 2026-10-05; Carlos confirmó la opción 2 y la lista de marcos. Demanda: Drata (clientes con
SOC 2), ACC 2025, guías sectoriales de cumplimiento.


---
