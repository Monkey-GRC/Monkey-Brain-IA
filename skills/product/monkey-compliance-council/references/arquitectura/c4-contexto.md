# C4 · Nivel 1 — Contexto

Responde: **¿quién usa Monkey y con qué sistemas externos habla?** Monkey se ve como una sola caja.

```mermaid
flowchart TB
    adminMonkey["<b>admin_monkey</b><br/>Equipo de Monkey.<br/>Registra empresas y cura el catálogo."]
    adminEmpresa["<b>admin_empresa</b><br/>Experto en compliance del cliente.<br/>Valida, revisa evidencia, da veredictos."]
    funcional["<b>responsable / delegado</b><br/>Dueño y ejecutor de sus controles<br/>(suben evidencia, responden pruebas)."]
    auditor["<b>auditor</b><br/>Revisa. No califica (D96)."]

    monkey(["<b>MONKEY</b><br/>Plataforma de Continuous Compliance.<br/>Mide el cumplimiento de un servicio<br/>frente a los marcos contratados."])

    correo["<b>Servicio de correo</b><br/>Envía claves de acceso<br/>y códigos de activación."]
    almacen["<b>Almacenamiento de archivos</b><br/>S3 o compatible (minio).<br/>Guarda las evidencias."]
    nube["<b>Cuenta de nube del cliente</b><br/>Se evalúa con un rol de solo lectura."]
    servidores["<b>Servidores y bases del cliente</b><br/>Se miden con la sonda."]

    adminMonkey --> monkey
    adminEmpresa --> monkey
    funcional --> monkey
    auditor --> monkey

    monkey -- "envía correos" --> correo
    monkey -- "guarda y descarga evidencia" --> almacen
    monkey -- "evalúa con credenciales temporales" --> nube
    monkey -. "mide con la sonda<br/>(servidores Linux y Windows)" .-> servidores
```

## Qué mirar aquí

- **Hay dos tipos de usuario con aplicaciones distintas:** el personal de Monkey (`admin_monkey`) y los
  usuarios de cada empresa cliente (los otros tres roles). Roles y permisos: `datos/modelo/05-usuarios.md`.
- **Monkey solo lee del cliente.** Nunca escribe en su nube ni en sus servidores; entra con un rol de
  solo lectura y credenciales temporales (D57, D58).
- **La IA no aparece como actor ni como sistema externo** porque hoy no hay un componente de IA
  construido en el código. El diseño objetivo sí la prevé (`architecture.md`, capa de razonamiento).
- Los proveedores de la sonda y del motor de nube **no se nombran en el producto** (regla de
  confidencialidad de `CLAUDE.md`). En este mapa interno se llaman "la sonda" y "el motor de nube".

## Cómo verificarlo

- Roles: `Backend/prisma/schema/platform/` (enum de roles de usuario).
- Correo y almacenamiento: `Backend/src/infrastructure/mail`, `Backend/src/infrastructure/storage`
  y las variables `S3_*` de `Backend/.env.example`.
- Nube y sonda: `context/backend.md`, fila `technical-control`, y `control-tecnico/motores/README.md`.
