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

## Arquitectura MONKEY (Compliance Engine)

Stack: **FastAPI + Python** backend, **PostgreSQL** (cache de checks y credenciales cifradas), frontend **Streamlit** (MVP) → React + Recharts (producción), hosting en el mismo VPS Contabo.

Flujo de datos:

```
1. Cron cada hora → extrae alertas/checks por tenant vía API Wazuh
2. Procesa y calcula scores → guarda en PostgreSQL
3. Dashboard consulta la API propia (no Wazuh directamente)
4. Cliente ve: score global, score por control, top alertas, tendencia 30 días
```

Endpoints propios:

```
/api/v1/agents                    → agentes del cliente (tenant_id)
/api/v1/agents/{id}/compliance    → score ISO/SOC2
/api/v1/agents/{id}/alerts        → alertas recientes
/api/v1/dashboard/summary         → resumen ejecutivo
```

Consideraciones aprendidas:
- Wazuh reporta timestamps en UTC → MONKEY convierte a hora Colombia (UTC-5) para mostrar.
- Consultas SCA de ~500 checks tardan segundos → cachear siempre.
- Credenciales de la API de Wazuh cifradas en PostgreSQL, nunca en código ni repos.
- Auth de clientes con JWT + roles por tenant.
