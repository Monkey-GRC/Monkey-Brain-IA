# API de la sonda y patrones de integración

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
- El prototipo agrupaba por cliente con un grupo de agentes; **cómo se asigna cada empresa a su grupo ya está decidido**
  (D54: un grupo por cliente y agente pre-registrado por Monkey; D71, D113 y SEG-45).

El stack real del proyecto es NestJS 11 + Prisma 7 en el backend y dos apps Angular (ver `context/backend.md` y `context/frontend.md`).

## Reglas del conector de Monkey

Viven en un solo sitio: [`wazuh.md`](wazuh.md) (clave de tres partes, cinco estados del check, mapeo a SOC 2 de Monkey, certificado,
JWT de ~900 s). No se repiten aquí.
