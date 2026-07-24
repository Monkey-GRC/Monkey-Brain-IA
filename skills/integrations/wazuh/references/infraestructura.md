# Infraestructura — VPS Contabo + Wazuh 4.12

> Los pasos de instalación, hardening y la tabla de puertos son
> **arquitectura genérica de Wazuh** (aplican a cualquier despliegue). La
> tabla "Datos del servidor" es el **caso aplicado específico** del SOC
> gestionado de Bryan (IP, SSH, capacidad de ese VPS puntual) — no asumir
> esos valores para un despliegue distinto.

## Datos del servidor (caso aplicado — VPS de Bryan)

| Ítem | Valor |
|---|---|
| Proveedor | Contabo (Miami) |
| IP pública (IPv4) | 161.97.157.83 |
| SO | Ubuntu 22.04 LTS |
| SSH | Puerto **2222** (no 22) |
| Recursos | 4 vCPU, 8 GB RAM, 75 GB NVMe, 200 Mbit/s |
| Wazuh | 4.12 all-in-one (Indexer + Manager + Dashboard en el mismo nodo) |
| Dashboard | `https://161.97.157.83` (cert autofirmado, usuario `admin`) |
| Capacidad | 30–40 agentes sin degradación; retención ~90 días con rotación |

Umbral de escalamiento: >40 agentes o disco al 70% → migrar a VPS 16 GB RAM o agregar nodo indexer.

## Hardening base del VPS (aplicado / a replicar)

```bash
apt update && apt full-upgrade -y && apt autoremove -y

# Usuario no-root con sudo
adduser socadmin && usermod -aG sudo socadmin

# SSH: sin root, sin password, llaves ed25519
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Firewall — solo lo necesario
ufw default deny incoming
ufw allow 2222/tcp    # SSH (puerto personalizado)
ufw allow 443/tcp     # Dashboard
ufw allow 1514/tcp    # Agentes (eventos)
ufw allow 1515/tcp    # Registro de agentes
ufw enable
```

## Instalación all-in-one (procedimiento verificado)

```bash
curl -sO https://packages.wazuh.com/4.12/wazuh-install.sh
curl -sO https://packages.wazuh.com/4.12/config.yml

cat > config.yml << 'EOF'
nodes:
  indexer:
    - name: node-1
      ip: "161.97.157.83"
  server:
    - name: wazuh-1
      ip: "161.97.157.83"
  dashboard:
    - name: dashboard
      ip: "161.97.157.83"
EOF

bash wazuh-install.sh --generate-config-files
bash wazuh-install.sh --wazuh-indexer node-1
bash wazuh-install.sh --wazuh-server wazuh-1
bash wazuh-install.sh --wazuh-dashboard dashboard

# Verificación
systemctl status wazuh-manager wazuh-indexer wazuh-dashboard | grep -E "Active|wazuh"
cat wazuh-passwords.txt   # credenciales admin del dashboard
```

Notas:
- El VPS solo entrega IPv6 con `ifconfig.me`; usar `curl -s https://api.ipify.org` para la IPv4.
- Con 8 GB RAM el swap es opcional pero recomendable como red de seguridad: el Indexer (OpenSearch) es el componente más hambriento de memoria y sin swap el kernel puede matarlo bajo picos de ingesta.

## Puertos de Wazuh

| Puerto | Uso |
|---|---|
| 1514/tcp | Eventos de agentes |
| 1515/tcp | Registro (enrollment) de agentes |
| 1516/tcp | Cluster de managers |
| 55000/tcp | API RESTful de Wazuh |
| 9200/tcp | Wazuh Indexer (OpenSearch) |
| 443/tcp | Dashboard |
| 514/udp | Syslog externo |

## Diagnóstico rápido

```bash
# Estado general
systemctl status wazuh-manager wazuh-indexer wazuh-dashboard

# Agentes conectados
/var/ossec/bin/agent_control -l

# Puertos escuchando
ss -tlnp | grep -E '443|9200|1514|1515|55000'

# Logs del manager
tail -f /var/ossec/logs/ossec.log
```
