# Pendientes del comité — Control técnico

Preguntas abiertas que afectan a [Control técnico](../../arquitectura/control-tecnico/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

## P14 · Motores de evaluación: rol de cada uno y cómo se relacionan con el modelo

**Estado:** abierto desde 2026-10-07. Nace de una prueba real: un escaneo de configuración de una cuenta de AWS
(292 hallazgos, 70 checks, 8 servicios, 17 regiones) hecho con una herramienta distinta de la sonda. **A1 y A2 se cerraron en D100 (2026-10-31)**: Prowler maneja la nube; Wazuh sigue con servidores, BD y endpoints. Siguen abiertas B, C, D y E. Bloquean el
cálculo de cobertura en nube. **B sí afecta a Cumplimiento** (2026-11-26): de su respuesta depende qué activos cuentan en una prueba; mientras tanto rige D160.

**Decidido (D100):** el catálogo, los checks y su mapeo a controles son de Monkey; los motores son adaptadores que solo entregan resultados crudos en un formato único (`check_results`). Prowler cubre la nube; Wazuh, servidores, BD y endpoints (configuración, amenazas en tiempo real e incidentes).

**A. Rol de los motores**
1. ~~¿Se acepta que un motor distinto cubra la nube?~~ **Cerrada en D100:** Prowler maneja la nube; Wazuh sigue con servidores, BD y endpoints.
2. ~~¿Cómo se llama ese motor frente al cliente?~~ **Cerrada en D100:** ninguno se nombra (D70).
3. ~~¿Hay un tercer motor previsto (SaaS)?~~ **Respondida por la VF18 (D129):** el motor de nube cubre también los SaaS (Microsoft 365, Google Workspace, Okta, GitHub, Vercel, Cloudflare, MongoDB Atlas…), 20 plataformas en total.

**B. Unidad de evaluación** *(B1 y B3 respondidas en D53: el activo es la cuenta y se evalúan solo las regiones declaradas)*
2. Una instancia en la nube es también un servidor (`ac_02`). ¿Se enlaza el recurso hallado con el activo del servidor, o son cosas separadas? *(Mientras tanto, D160: son dos activos y cada uno cuenta con su resultado; el mismo equipo se cuenta dos veces en la cobertura. La misma duda vale para una BD instalada en un servidor: hoy su resultado queda en el servidor.)*
4. Un check que falla en 3 de 5 discos, ¿es 1 evaluación fallida o 3? *(Mientras tanto, D160: cada recurso que el servicio eligió es un activo con su resultado; lo demás cuenta en la cuenta. Por ratificar.)*
5. **Por ratificar (D160):** ¿un servicio SaaS conectado (Microsoft 365, Google Workspace, Okta, GitHub) es una «aplicación en alcance» de las pruebas de Aplicación, además de un servicio en nube? El libro vincula sus checks a pruebas de Aplicación, Nube y Endpoint; hoy la conexión cuenta en toda prueba que tenga Directos de su plataforma.
6. Las pruebas de **Endpoint** decididas por una política de la organización (`T-MOV-1-01`: «Cliente conecta Microsoft 365 y administra los dispositivos con Intune»; `T-EQU-2-01`): ¿la población son los equipos o la organización? ¿Quién declara que se usa Intune? Hoy no se evalúan (`DT-135`).
7. La columna «Automatización» de `TEST` y el paso a paso no siempre coinciden: `T-IDA-4-01` dice «Automático» y su paso 4 es manual («la aplicación propia»). ¿Cuál manda? Hoy manda la columna (D160 punto 4): esa prueba la deciden solo sus checks. ¿Y basta el resultado del responsable para cubrir la parte manual de una Semiautomática, o hace falta una declaración aparte de «no tengo»?

**C. Conexión y credenciales**
1. ¿Rol entre cuentas sin llaves guardadas en producción (propuesta), en vez de usuario con llaves estáticas?
2. Permisos mínimos que se piden al cliente y quién los crea.
3. ¿Dónde corre el motor? Hoy en el mismo servidor que la sonda y con llaves del cliente guardadas allí.
4. Frecuencia, duración y coste en llamadas a la API (`ac_01` fija 6-24 h).
5. ¿Azure y GCP producen el mismo formato de salida y alguien los probó? *(Medido para GCP el 2026-11-12: mismo formato, ver `cruce-nube-gcp.md`. Azure sigue sin probar.)* *(Microsoft 365 usa otro proveedor del motor, `m365`: su salida es la misma OCSF y solo se leyó el código del motor el 2026-11-22; falta medirla con un tenant real, `DT-138`.)*

**D. Catálogo y mapeo**
1. ~~¿Se cargan al catálogo los 70 checks, o solo los que el comité elija?~~ **Respondida por la VF18 (D129):** se carga el catálogo completo (1.621 checks) y solo cuentan los vinculados en `TEST_CHECKS`.
2. El motor trae su propio mapeo a SOC 2. Si no coincide con el del comité, gana el del comité (regla del brain); ¿se guarda el otro como mapeo con procedencia?
3. Los `T-CLD-*` nombran a la sonda como herramienta (ver D70). ¿Se reescriben?
4. Estados del motor que no existen en el modelo: `MANUAL` ya se trata como `not_run` (confirmado). Falta el **silenciado**: propuesta, un silencio con justificación aprobada.

**E. Producto y legal**
1. Licencia y forma de uso del motor (redistribuir o ofrecer como servicio). No verificado.
2. Quién revisa el texto de IA antes de que llegue al cliente y quién responde por un falso positivo.

**Qué depende:** columnas nuevas de `check_results` (recurso, región, detalle), carga de checks, `Evaluation` en nube y el paso 3 del onboarding para nube (construido para AWS y GCP, D58 y D112).
