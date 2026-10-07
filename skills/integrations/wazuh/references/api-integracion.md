# API de Wazuh e integración (MONKEY, dashboards)

## API RESTful (puerto 55000)

| Categoría | Endpoint base | Uso |
|---|---|---|
| Auth | `/security/user/authenticate` | Token JWT |
| Agentes | `/agents` | Gestión / filtro por grupo |
| Grupos | `/groups` | Gestión de grupos |
| SCA | `/sca/{agent_id}` y `/sca/{id}/checks/{policy}` | Resultados de checks |
| Syscollector | `/syscollector/{agent_id}` | Inventario |
| Vulnerabilidades | `/vulnerability/{agent_id}` | CVEs |
| Reglas / Decoders | `/rules`, `/decoders` | Configuración |
| Manager / Cluster | `/manager`, `/cluster` | Estado |

Docs interactivas: `https://localhost:55000/ui/`

## OpenSearch directo (puerto 9200)

Para agregaciones complejas, consultar el índice `wazuh-alerts-*`:

```json
POST /wazuh-alerts-*/_search
{ "query": { "match": { "agent.id": "001" } } }
```

## Syscollector — tablas SQLite por agente

Base por agente: `/var/ossec/queue/db/<id>.db`

| Tabla | Contenido |
|---|---|
| `sys_osinfo` | SO |
| `sys_hwinfo` | Hardware |
| `sys_programs` | Software instalado |
| `sys_processes` | Procesos |
| `sys_ports` | Puertos abiertos |
| `sys_netiface` | Interfaces de red |
| `sys_users` | Usuarios |

```bash
sudo sqlite3 /var/ossec/queue/db/003.db "SELECT * FROM sys_osinfo;"
```

## Campos de vulnerabilidades

`vulnerability.cve`, `vulnerability.severity` (Critical/High/Medium/Low), `vulnerability.package.name`, `vulnerability.package.version`, `vulnerability.status` (Active/Solved/Mitigated), `vulnerability.cvss.cvss3.base_score`.

## Patrones aprendidos de un conector anterior

Antes del backend actual existió un prototipo de conector (otra tecnología, ya descartada). Se conservan **solo las lecciones
operativas**, no su arquitectura:

- Wazuh reporta timestamps en UTC → se guardan en UTC y se convierten a la hora local solo para mostrar.
- Una consulta SCA de ~500 checks tarda segundos → **cachear siempre**, nunca consultarla en cada petición del usuario.
- Las credenciales de la API de Wazuh van cifradas o en variables de entorno, nunca en código ni en repos.
- El prototipo agrupaba por cliente con un grupo de agentes; **cómo se asigna hoy cada empresa a su grupo no está decidido**
  (P12 y DT-33 en `product/monkey-compliance-council/references/`).

El stack real del proyecto es NestJS 11 + Prisma 7 en el backend y dos apps Angular (ver `context/project-context.md`).

## Reglas del conector real de Monkey

Fuente: `conexion_api_wazuh_monkey.txt` (en `Monkey/`, fuera de este repo —
**contiene credenciales en texto plano, no copiarlo aquí**) y el código de
`monkey-cis-sync`. Inventario de fuentes en
`../../../product/monkey-compliance-council/references/datos/modelo-datos.md` §0.

- **Clave compuesta obligatoria de tres partes: `platform` + `policy_id` + `check_id`**
  (decisión D6, ver `modelo-datos.md` §3.3). Nunca solo `check_id`: el mismo ID significa
  cosas distintas entre políticas. Y los `policy_id` no son homogéneos entre agentes
  (hoy uno corre `cis_ubuntu22-04`).
- **Catálogo y resultado, separados.** En la base externa `prueba_wazuh` las PK son de dos
  partes — `cis_checks` (PK `policy_id + check_id`) vs
  `cis_check_results` (PK `agent_id + policy_id + check_id`) —; el modelo de Monkey añade
  `platform` como tercera parte (`checks` y `check_results`, §3.3 y §7.4). Antes el resultado
  vivía en el catálogo y dos agentes con la misma política se pisaban.
  **Pendiente:** esa tabla hace UPSERT sin timestamp, así que no guarda histórico.
- **`result` vacío = `not applicable`.** No es un fallo ni un error. Y `invalid` es
  un estado real y distinto — ver `../../../product/monkey-compliance-council/references/datos/modelo-datos.md` §3.3.
- **El mapeo a SOC 2 lo pone Monkey.** Las políticas Linux no traen la clave
  `soc_2`; hay scripts propios que lo rellenan con procedencia y confianza.
- **Usa el certificado, no `verify=False`.** El documento entrega `root-ca.pem`.
- **El token JWT vive ~900 s.** Manejar el 401 y re-autenticar.

