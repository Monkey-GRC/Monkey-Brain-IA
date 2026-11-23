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
3. ~~¿Hay un tercer motor previsto (SaaS)?~~ **Respondida por la VF18 (D129):** el motor de nube cubre también los SaaS (Microsoft 365, Google Workspace, Okta, GitHub, Vercel, Cloudflare, MongoDB Atlas…), 20 plataformas en total.

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
1. ~~¿Se cargan al catálogo los 70 checks, o solo los que el comité elija?~~ **Respondida por la VF18 (D129):** se carga el catálogo completo (1.621 checks) y solo cuentan los vinculados en `TEST_CHECKS`.
2. El motor trae su propio mapeo a SOC 2. Si no coincide con el del comité, gana el del comité (regla del brain); ¿se guarda el otro como mapeo con procedencia?
3. Los `T-CLD-*` nombran a la sonda como herramienta (ver D70). ¿Se reescriben?
4. Estados del motor que no existen en el modelo: `MANUAL` ya se trata como `not_run` (confirmado). Falta el **silenciado**: propuesta, un silencio con justificación aprobada.

**E. Producto y legal**
1. Licencia y forma de uso del motor (redistribuir o ofrecer como servicio). No verificado.
2. Quién revisa el texto de IA antes de que llegue al cliente y quién responde por un falso positivo.

**Qué depende:** columnas nuevas de `check_results` (recurso, región, detalle), carga de checks, `Evaluation` en nube y el paso 3 del onboarding para nube (construido para AWS y GCP, D58 y D112).


---

## P49 · Los vínculos de la VF18 que no son checks, y la prioridad de una brecha sin severidad

**Estado:** abierto desde 2026-11-22 (D129). El resto de `TEST_CHECKS` está decidido y ratificado por el comité.

1. **19 vínculos con check ID `N/A`**: 16 son módulos de la sonda (detección de vulnerabilidades, monitoreo de integridad de archivos, inventario, detección de intrusiones y rootcheck) y 3 son puntajes globales (de la evaluación de configuración de la sonda, de la de bases de datos y del marco CIS del motor de nube). **Doce son Directos**, así que deciden el cumplimiento de su prueba. ¿Cuándo es PASS y cuándo FAIL cada uno? Hoy Monkey solo lee la evaluación de configuración de la sonda y los checks del motor de nube.
2. La fila «Detección de vulnerabilidades» es Directo en VUL-1 y en VUL-2, y `IN-07` pide que un atributo técnico sea Directo en un solo control. ¿Cuál de los dos es el dueño?
3. **La prioridad del mensaje de brecha** es la severidad del check por la criticidad del activo (D138), pero los checks de la sonda no traen severidad. ¿Qué se usa para ellos?

**Qué depende:** el rol de esos 19 vínculos (RC-04), el mensaje de brecha (RC-18) y D7 (las vulnerabilidades solo como insumo), que estos Directos cambiarían.

---
