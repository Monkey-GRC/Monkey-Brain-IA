# La sonda de servidores: manager, agentes y grupos

Cómo se opera el manager y cómo llegan los agentes. Las reglas de diseño y lo que no se negocia están en [`wazuh.md`](wazuh.md); la
API, en [`wazuh-api.md`](wazuh-api.md). **Todo el producto habla de «sonda»: ningún texto de aquí sale al cliente.**

## Cómo corre hoy (desarrollo, D55)

Un solo manager, `wazuh/wazuh-manager:4.14.6`, **sin indexador ni dashboard**, en un contenedor de la VPS de desarrollo (~0,5 GB en
reposo, límite 2 GB). La API (55000) escucha solo en `127.0.0.1`; solo el puerto de agentes (1514) está publicado. Monkey solo necesita
la API: el indexador y el dashboard no hacen falta. Dónde se aloja producción: D72 (la base, separada de la app).

## Puertos

| Puerto | Uso | ¿Se publica? |
|---|---|---|
| 1514/tcp | Eventos de los agentes | Sí |
| 1515/tcp | Registro abierto de agentes (*enrollment*) | **No**: Monkey pre-registra (D54) |
| 55000/tcp | API RESTful | No: solo local |
| 9200/tcp | Indexador (OpenSearch) | No se usa para el inventario puntual (`wazuh-api.md`) |
| 1516/tcp · 514/udp | Cluster de managers · syslog externo | No aplican hoy |

## Un manager, un grupo por cliente (D54)

El aislamiento entre clientes **no lo da la sonda** (la clave de inscripción es global y un agente puede declarar su grupo): lo impone
Monkey. Flujo verificado contra la API real (2026-10-08):

1. Monkey crea el grupo del cliente (`POST /groups`).
2. Monkey **pre-registra** el agente (`POST /agents/insert`): la API devuelve su `id` y su `key`.
3. Monkey le asigna el grupo (`PUT /agents/{id}/group/{grupo}`).
4. El cliente recibe un comando de instalación que lleva esa clave; el agente no se inscribe por su cuenta ni elige su grupo.
5. Al sincronizar, Monkey solo acepta resultados de agentes cuyo grupo corresponde al `tenant_id` (`SEG-45`).

Cada grupo tiene su `agent.conf` en `/var/ossec/etc/shared/<grupo>/agent.conf`. **Pendiente (DT-57):** el comando de instalación exacto, la
expiración de la clave y qué se promete para sistemas sin evaluación real (`DT-34`).

## Qué puede ser un agente

Servidores y estaciones con SO soportado (Windows, Linux, macOS), VMs y VPS en la nube. **Cobertura real de configuración hoy:** Ubuntu
22.04, Ubuntu 14.04 y Windows 11 (`DT-34`); el catálogo trae 18 plataformas, pero solo esas tienen pruebas.

## Instalación por escenario

| Escenario | Método |
|---|---|
| Pocos equipos, sin automatización | Comando manual (PowerShell o bash) con la clave pre-registrada |
| Servidores Linux mixtos | Ansible con inventario por SO |
| VMs en la nube | User Data / cloud-init |
| Muchas estaciones Windows en un dominio | GPO |

La versión del agente debe coincidir con la del manager (4.14.6 hoy). Los paquetes salen de `packages.wazuh.com`; los comandos
exactos dependen de la versión: se toman de la documentación oficial vigente, no de aquí.

## Verificar y diagnosticar

```bash
/var/ossec/bin/agent_control -l                          # agentes conectados
ss -tlnp | grep -E '1514|55000'                          # puertos escuchando
tail -f /var/ossec/logs/ossec.log                        # log del manager
```

Para validar que llegan alertas de un marco, genera actividad de prueba (inicios de sesión fallidos, un `sudo cat /etc/shadow`, crear y
borrar un archivo en una ruta vigilada), espera unos 5 minutos y revisa el módulo del marco.
