# Wazuh como motor de monitoreo y evidencia de Monkey

`[VERIFICADO — búsqueda web 22 de julio de 2026, ver fuentes al final]` para los hechos sobre Wazuh en sí. Todo lo demás en este archivo es recomendación de diseño del Consejo sobre cómo Monkey debe usarlo — no confundir ambas cosas.

## Por qué Wazuh y qué NO hay que reconstruir

Wazuh es un SIEM/XDR open source que **ya trae, de fábrica, ruleset pre-etiquetado con tags de compliance para PCI DSS, HIPAA, NIST 800-53, TSC (la base de SOC 2) y GDPR**, y su ruleset por defecto incluye además mapeo a ISO 27001 y GPG13. Una sola alerta (por ejemplo, un intento de login fallido) puede mapear simultáneamente a PCI DSS 10.2, HIPAA 164.312(b), ISO 27001 A.8.15 y GDPR Artículo 32 — Wazuh ya hace esa correlación internamente.

**Implicación de diseño directa**: Monkey no debe reconstruir un motor de correlación de eventos de seguridad ni un ruleset de compliance desde cero para todo lo que Wazuh ya cubre. El trabajo de Monkey es **consumir la salida ya etiquetada de Wazuh y traducirla al modelo de controles atómicos propio** (`architecture.md`) y luego al lenguaje de negocio (`philosophy.md`) — no reinventar la correlación. Esto acelera drásticamente el camino a valor y reduce superficie de mantenimiento.

## Arquitectura de Wazuh (lo que hay que integrar)

Wazuh tiene un agente multiplataforma y tres componentes centrales:

- **Agente**: se despliega en cada endpoint (servidor, workstation, VM) y recolecta/reenvía datos de seguridad al servidor Wazuh.
- **Servidor (manager)**: analiza los datos de los agentes vía decoders y reglas, usa inteligencia de amenazas para buscar indicadores de compromiso.
- **Indexer**: motor de búsqueda y analítica (basado en OpenSearch) que indexa y almacena las alertas generadas por el servidor.
- **Dashboard**: interfaz web de visualización.

Modelo de flujo: agente → servidor (análisis) → indexer (almacenamiento/búsqueda) → dashboard (visualización). Despliegue "todo en uno" para entornos pequeños, o multi-nodo (servidor y indexer en clúster) para alto volumen o alta disponibilidad.

## Módulo SCA (Security Configuration Assessment)

El módulo SCA corre benchmarks tipo CIS contra los endpoints y reporta gaps de hardening — es directamente relevante para CIS Controls y para cualquier control de "configuración segura" en el catálogo atómico de Monkey (p. ej. hardening de SO, políticas de contraseña, servicios innecesarios deshabilitados). Wazuh mantiene al administrador consciente de malas prácticas de configuración y su impacto en compliance.

## Cómo se integra en Monkey (recomendación del Consejo)

1. **Wazuh es la fuente de verdad para evidencia operativa y de endpoint** dentro de Monkey: logs de acceso, integridad de archivos, resultados de SCA, alertas de amenazas. El Motor de Evidencias de Monkey (`architecture.md`) trata cada alerta de Wazuh como evidencia "automática" con su timestamp e integridad ya garantizados por Wazuh.
2. **El Motor de Compliance de Monkey traduce los tags de Wazuh a controles atómicos propios**, no framework por framework de forma manual: si Wazuh etiqueta una alerta como PCI DSS 10.2 + HIPAA 164.312(b) + ISO 27001 A.8.15, Monkey la mapea una sola vez a su control atómico equivalente (p. ej. "registro y monitoreo de accesos"), y desde ahí hereda automáticamente la cobertura en todos los frameworks activos del tenant.
3. **Despliegue on-prem/híbrido**: el agente Wazuh es exactamente el patrón que `architecture.md` describe para el "agente ligero on-prem" de Monkey — Wazuh ya resuelve la recolección en Windows Server, Linux y (vía integraciones) VMware. En vez de construir un agente propio desde cero para estos casos, la recomendación del Consejo es **evaluar seriamente correr Wazuh como el motor de recolección on-prem de Monkey**, con Monkey como la capa de traducción/UX/IA por encima — coherente con la filosofía de no reconstruir lo que ya existe bien resuelto en open source.
4. **Modo cloud**: Wazuh también se puede desplegar contra infraestructura cloud (agentes en instancias EC2, contenedores, etc.), así que la misma pieza sirve para el ICP primario 100% cloud del MVP y para el ICP secundario híbrido/on-prem — sin dos motores de recolección distintos.
5. **Seguridad del propio agente**: el CISO y el especialista SIEM/XDR del Consejo exigen que, si Monkey empaqueta o distribuye Wazuh como su agente on-prem, se mantenga con el mismo rigor de un producto EDR — binario firmado, canal saliente cifrado, sin puertos entrantes, actualizaciones controladas.

## Clasificación MUST/SHOULD/LATER

| Elemento | Clasificación | Nota |
|---|---|---|
| Evaluar Wazuh como base del agente on-prem/híbrido (en vez de construir uno propio desde cero) | **MUST investigar en Fase 0-1** | Evita duplicar años de ruleset de compliance ya maduro; decisión de alto apalancamiento |
| Consumir alertas/tags de Wazuh como evidencia automática en el Motor de Evidencias | **MUST** cuando el conector Wazuh esté activo | Es exactamente el tipo de evidencia operativa que un auditor pide primero |
| Traducir tags de Wazuh a controles atómicos propios (no 1:1 por framework) | **MUST** | Coherente con el modelo de datos central de Monkey — ver `architecture.md` |
| Dashboard de compliance nativo de Wazuh (TSC, PCI, HIPAA, GDPR, NIST 800-53) como sustituto del dashboard de Monkey | **NO BUILD como reemplazo** | Sigue existiendo el "pecado original": el dashboard nativo de Wazuh es técnico, por framework, y no traduce a lenguaje de negocio — Monkey debe consumir los datos, no exponer esa UI directamente al usuario final |
| Módulo SCA como fuente de hallazgos de hardening/CIS | **SHOULD**, temprano en el roadmap on-prem | Alto valor para CIS Controls y para cualquier cliente con servidores propios |

## Fuentes

- [Architecture — Getting started with Wazuh · Wazuh documentation](https://documentation.wazuh.com/current/getting-started/architecture.html)
- [Components — Getting started with Wazuh · Wazuh documentation](https://documentation.wazuh.com/current/getting-started/components/index.html)
- [Regulatory compliance - Use cases · Wazuh documentation](https://documentation.wazuh.com/current/getting-started/use-cases/regulatory-compliance.html)
- [Regulatory compliance · Wazuh documentation](https://documentation.wazuh.com/current/compliance/index.html)
- [Using Wazuh for TSC compliance - Regulatory compliance · Wazuh documentation](https://documentation.wazuh.com/current/compliance/tsc/index.html)
- [Wazuh for Compliance with NIST 800-53 — Wazuh blog](https://wazuh.com/blog/complying-nist-800-53-with-wazuh/)
- [Regulatory Compliance. Security Standards — Wazuh](https://wazuh.com/resources/use-cases/regulatory-compliance/)

**Nota de veracidad**: estas fuentes incluyen documentación oficial de Wazuh (documentation.wazuh.com, wazuh.com) y también análisis de terceros (Medium, blogs especializados) usados para contexto de mercado — para detalles de configuración exactos al momento de implementar, consulta siempre la documentación oficial vigente, ya que Wazuh cambia de versión con frecuencia.

## Material fuente del proyecto (leer antes de tocar el conector)

Lo de arriba es diseño del Consejo. Lo que sigue son **hechos operativos del
entorno real de Monkey**, documentados por el equipo funcional. Fuentes en
`../../../../assets/README.md`:

- **`conexion_api_wazuh_monkey.txt`** — endpoints, flujo del conector y las reglas
  de destino. Contiene credenciales en texto plano: no copiarlo a ningún repo.
- **`soc2_detalle.py`** — el extractor que invierte la relación `check → marcos` a
  `requisito → checks`.

Las reglas que hay que respetar y que no son negociables:

| Regla | Por qué |
|---|---|
| **Clave compuesta `policy_id + check_id`** | *"Nunca solo check_id: el mismo ID significa cosas distintas entre Windows y Ubuntu"*. Y los `policy_id` **no son homogéneos entre agentes** — hoy un agente corre `cis_ubuntu14-04`, la política antigua. Usar el SO como discriminante no alcanza (ver pendiente D6). |
| **Cinco estados de resultado, no dos** | `passed`, `failed`, `invalid`, `not applicable` (llega como `result` vacío) y `not run`. `invalid` es real y frecuente (el idioma del sistema tumba reglas en Windows), y **no** puede colapsarse con "no aplica" — ver el tercer estado en `modelo-datos.md` §7. |
| **El mapeo a SOC 2 lo pone Monkey, no Wazuh** | Las políticas Linux no traen la clave `soc_2`. Del catálogo real: 869 checks, 646 con mapeo nativo, 223 inferidos por Monkey, con procedencia y confianza (`wazuh_native` vs `ai_inferred_final`, `high`/`medium`/`low`). Un mapeo inferido nunca se presenta como dato de la sonda. |
| **Tres orígenes de check conviven** | `tsc` (benchmark CIS de fábrica), `soc_2` (política propia de Monkey, `monkey_soc2_win11.yml`) y `nelson` (umbrales del auditor, más estrictos que CIS). El origen es un atributo del check. |
| **Validador único: no hay segunda sonda** | El comité **evaluó** usar otro proveedor (Prowler) para la dimensión Nube y **decidió lo contrario**: *"Wazuh SCA/Cloud Security como validador único"*, barriendo todas las menciones a Prowler del catálogo. Wazuh cubre servidores, BD **y nube**. El modelo mantiene `proveedor` como atributo por extensibilidad, no porque hoy haya dos. |
| **La nube todavía no tiene checks** | De los 61 TEST del catálogo, los **11 de nube no tienen ni un check asociado** (igual que los 26 documentales). Es decir: la decisión de que Wazuh cubra nube está tomada, pero la cobertura no está construida — ver pendiente D13. |
| **Seis categorías de conexión, no dos** | El catálogo del comité (AC-01…AC-06) incluye servicios cloud gestionados por API/OAuth, servidores y BD en nube y on-prem, y **endpoints/estaciones de trabajo**. Las plataformas reales de los checks van mucho más allá de Ubuntu y Windows: AlmaLinux, Oracle Linux, macOS, HP-UX, AIX, Solaris, PostgreSQL, MySQL, SQL Server, Oracle, MongoDB, Apache, NGINX, IIS, PHP. |
| **OpenSearch no sirve para el inventario puntual** | El puerto 9200 solo tiene el flujo de cambios. Para el estado actual completo, la API 55000. Por eso el histórico hay que construirlo nosotros. |
| **La dependencia de Wazuh es confidencial frente al cliente final** | Ver `philosophy.md`. En el producto: "sonda", nunca el nombre del proveedor. |
