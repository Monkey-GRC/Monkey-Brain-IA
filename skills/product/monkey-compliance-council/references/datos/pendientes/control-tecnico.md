# Pendientes del comité — Control técnico

Preguntas abiertas que afectan a [Control técnico](../../arquitectura/control-tecnico/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

## P14 · Motores de evaluación: rol de cada uno y cómo se relacionan con el modelo

**Estado:** abierto desde 2026-10-07. Nace de una prueba real: un escaneo de configuración de una cuenta de AWS
(292 hallazgos, 70 checks, 8 servicios, 17 regiones) hecho con una herramienta distinta de la sonda. **A1 y A2 se cerraron en D100 (2026-10-31)**: Prowler maneja la nube; Wazuh sigue con servidores, BD y endpoints. Siguen abiertas B, C, D y E. Bloquean el
cálculo de cobertura en nube; no bloquean el módulo de Cumplimiento.

**Decidido (D100):** el catálogo, los checks y su mapeo a controles son de Monkey; los motores son adaptadores que solo entregan resultados crudos en un formato único (`check_results`). Prowler cubre la nube; Wazuh, servidores, BD y endpoints (configuración, amenazas en tiempo real e incidentes).

**A. Rol de los motores**
1. ~~¿Se acepta que un motor distinto cubra la nube?~~ **Cerrada en D100:** Prowler maneja la nube; Wazuh sigue con servidores, BD y endpoints.
2. ~~¿Cómo se llama ese motor frente al cliente?~~ **Cerrada en D100:** ninguno se nombra (D70).
3. ¿Hay un tercer motor previsto (SaaS)? Azure y GCP los cubre Prowler.

**B. Unidad de evaluación** *(B1 y B3 respondidas en D53: el activo es la cuenta y se evalúan solo las regiones declaradas)*
2. Una instancia en la nube es también un servidor (`ac_02`). ¿Se enlaza el recurso hallado con el activo del servidor, o son cosas separadas?
4. Un check que falla en 3 de 5 discos, ¿es 1 evaluación fallida o 3?

**C. Conexión y credenciales**
1. ¿Rol entre cuentas sin llaves guardadas en producción (propuesta), en vez de usuario con llaves estáticas?
2. Permisos mínimos que se piden al cliente y quién los crea.
3. ¿Dónde corre el motor? Hoy en el mismo servidor que la sonda y con llaves del cliente guardadas allí.
4. Frecuencia, duración y coste en llamadas a la API (`ac_01` fija 6-24 h).
5. ¿Azure y GCP producen el mismo formato de salida y alguien los probó? *(Medido para GCP el 2026-11-12: mismo formato, ver `cruce-nube-gcp.md`. Azure sigue sin probar.)*

**D. Catálogo y mapeo**
1. ¿Se cargan al catálogo los 70 checks, o solo los que el comité elija, y con qué `origin`?
2. El motor trae su propio mapeo a SOC 2. Si no coincide con el del comité, gana el del comité (regla del brain); ¿se guarda el otro como mapeo con procedencia?
3. Los `T-CLD-*` nombran a la sonda como herramienta (ver D70). ¿Se reescriben?
4. Estados del motor que no existen en el modelo: `MANUAL` ya se trata como `not_run` (confirmado). Falta el **silenciado**: propuesta, un silencio con justificación aprobada.

**E. Producto y legal**
1. Licencia y forma de uso del motor (redistribuir o ofrecer como servicio). No verificado.
2. Quién revisa el texto de IA antes de que llegue al cliente y quién responde por un falso positivo.

**Qué depende:** columnas nuevas de `check_results` (recurso, región, detalle), carga de checks, `Evaluation` en nube y el paso 3 del onboarding para nube (construido para AWS y GCP, D58 y D112).

---

## P15 · Cómo se mapean los checks de nube que quedan fuera

**Estado:** abierto desde 2026-10-08 (D56). No bloquea nada: lo que no tiene la cadena completa **no cuenta** hasta que el comité responda.

Del catálogo de 662 checks de AWS, lo que no llega a un control:

1. **104 checks sin prueba**: no encajan en ninguna `T-CLD`. ¿A qué prueba van, o se descartan? (Lista: los que no aparecen en `test_checks` tras `npm run cloud:load`.)
2. **Las pruebas `T-CLD-004` a `007` no tienen ningún check.** ¿Se cubren con checks que aún no se han buscado o quedan manuales por activo?
3. **Seis requisitos que el motor cita** no los alcanza ninguna prueba de nube: CC1.3, CC3.1, CC3.2, CC5.2, CC7.3 y CC7.5. ¿Se añade el vínculo o quedan como cobertura no alcanzada?
4. **Ratificar las 569 asignaciones propuestas** (`monkey_proposed`): se pide por prueba (11 `T-CLD`), no check por check.
5. **GCP** (2026-11-12, `cruce-nube-gcp.md`): ratificar las asignaciones propuestas para 98 de sus 110 checks (incluidas siete reglas propias de GCP) y decidir los **12 checks sin prueba** (parámetros de SQL Server y MySQL, comportamiento de VMs, ciclo de vida de buckets, contactos esenciales).

**Qué depende:** que esos checks cuenten para el cumplimiento (§9) y la cobertura técnica real de la nube.
