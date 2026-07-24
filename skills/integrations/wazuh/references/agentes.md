# Agentes y multi-tenancy

## Qué puede ser un agente

Cualquier endpoint con SO soportado: PCs Windows 10/11, macOS, Linux; servidores Windows Server / Ubuntu / CentOS / RHEL; VMs (VMware, Hyper-V); VPS cloud (AWS/Azure/DO); hosts Docker; IoT con Linux embebido.

No requieren segmentación obligatoria, pero SIEMPRE organizarlos por **grupos** para reglas diferenciadas:

```
Grupo "servidores"    → reglas estrictas, alertas nivel 7+
Grupo "workstations"  → reglas de usuario, USB, software
Grupo "cloud"         → reglas AWS/Azure, accesos remotos
```

## Multi-tenancy (modelo del negocio)

Un grupo por cliente:

```bash
# En el manager
/var/ossec/bin/agent_groups -a -g cliente_empresa_abc
```

Cada grupo tiene su `agent.conf` propio en `/var/ossec/etc/shared/<grupo>/agent.conf`, aplicado automáticamente a todos sus agentes. Los dashboards se filtran por `agent.group`.

Grupos existentes conocidos: `SERVERSMONKEY` (servidores bajo MONKEY), grupos por cliente según convención `cliente_<nombre>`.

## Instalación por escenario

| Escenario | Método |
|---|---|
| 20–100 Windows en dominio AD | GPO |
| Servidores Linux mixtos | Ansible |
| VMs cloud | User Data / Cloud-init |
| Sin AD ni automatización | Script PowerShell/bash manual |
| Mixto grande | Ansible con inventario por OS |

### Windows (manual, PowerShell como admin)

```powershell
Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-4.12.0-1.msi -OutFile $env:tmp\wazuh-agent.msi; msiexec.exe /i $env:tmp\wazuh-agent.msi /q WAZUH_MANAGER='161.97.157.83' WAZUH_AGENT_NAME='<nombre-equipo>' WAZUH_REGISTRATION_SERVER='161.97.157.83' WAZUH_AGENT_GROUP='<grupo_cliente>'
NET START WazuhSvc
```

### Linux (Debian/Ubuntu)

```bash
curl -so /tmp/wazuh-agent.deb \
  https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.12.0-1_amd64.deb
WAZUH_MANAGER="161.97.157.83" WAZUH_AGENT_GROUP="<grupo_cliente>" dpkg -i /tmp/wazuh-agent.deb
systemctl enable wazuh-agent && systemctl start wazuh-agent
```

Para RHEL/CentOS: `wazuh-agent-4.12.0-1.x86_64.rpm` vía yum con las mismas variables de entorno.

### macOS

Paquetes: `wazuh-agent-4.12.0-1.arm64.pkg` (Apple Silicon) o `.intel.pkg`. Existe instalador con marca MONKEY (`install_monkey_agent_macos.sh`) que detecta arquitectura, pide servidor/grupo/hostname y despliega el agente Wazuh renombrado como "MONKEY Security Agent".

### Cloud (AWS EC2 User Data)

El mismo script de Linux pegado en User Data al lanzar la instancia — cada VM se registra sola con su grupo.

### Ansible (playbook base)

Playbook con variables `wazuh_manager` y `cliente_grupo`, tareas condicionadas por `ansible_os_family` (Debian → apt deb, RedHat → yum rpm), habilitando el servicio al final. Ejecutar:

```bash
ansible-playbook -i inventario_cliente.ini playbook-wazuh.yml -e "cliente_grupo=cliente_empresa_abc"
```

## Verificación post-despliegue

```bash
/var/ossec/bin/agent_control -l
# o via API:
curl -k -X GET "https://161.97.157.83:55000/agents?group=<grupo>" -H "Authorization: Bearer $TOKEN"
```

## Proceso de onboarding por cliente

1. Firma de contrato + acuerdo de confidencialidad
2. Creación del grupo en Wazuh con políticas por tipo de endpoint
3. Instalación de agentes (Windows/Linux/macOS/servidores)
4. Configuración de bot Telegram o canal WhatsApp para alertas
5. Reglas personalizadas y umbrales de alerta
6. Reunión de bienvenida + capacitación básica (1 hora)

## Generar actividad de prueba (para validar alertas TSC)

Windows (PowerShell):
```powershell
runas /user:fakeuser cmd    # logins fallidos → CC6
echo test > C:\Windows\Temp\testfile.txt ; del C:\Windows\Temp\testfile.txt  # FIM → CC8
```

Linux:
```bash
su fakeuser ; su admin      # logins fallidos
sudo cat /etc/shadow        # eventos sudo
```

Esperar ~5 minutos y revisar el módulo TSC con rango "Last 24 hours".
