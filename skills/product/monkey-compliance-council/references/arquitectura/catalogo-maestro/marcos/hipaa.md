# HIPAA Security Rule

`[VERIFICADO — búsqueda web 22 jul 2026]`

## Qué es
Ley federal de EE. UU. (parte de HIPAA) que establece estándares nacionales para proteger la **información de salud electrónica protegida (e-PHI)** creada, recibida, usada o mantenida por una entidad cubierta o su asociado de negocio. Es un requisito legal, no un framework voluntario — lo hace cumplir la Office for Civil Rights (OCR) de HHS, con actividades de cumplimiento voluntario y sanciones civiles.

## Estructura
Exige salvaguardas **administrativas, físicas y técnicas** para asegurar confidencialidad, integridad y disponibilidad de la e-PHI. Nota importante: la Security Rule solo cubre PHI en formato **electrónico** — PHI transmitida oralmente o en papel cae bajo la Privacy Rule, no la Security Rule.

## Quién lo necesita típicamente
Proveedores de salud, aseguradoras de salud, cámaras de compensación de salud, y sus "business associates" (cualquier proveedor de software/servicios que procese e-PHI en su nombre — este es el caso típico de un cliente SaaS de Monkey en el sector salud).

## Nota de cambio regulatorio en curso
Hay una propuesta de actualización de la Security Rule ("HIPAA Security Rule To Strengthen the Cybersecurity of Electronic Protected Health Information", Federal Register, enero 2025) que endurece varios requisitos — al asesorar sobre HIPAA, verificar el estado más reciente de esta propuesta con WebSearch antes de dar certeza sobre requisitos específicos, ya que puede haber cambiado desde la fecha de esta nota.

## Mapeo a controles atómicos de Monkey
Las salvaguardas técnicas (control de acceso, controles de auditoría, integridad, autenticación) se solapan fuertemente con los mismos controles atómicos de acceso/autenticación usados para SOC 2 y PCI DSS.

## Wazuh
Ruleset pre-etiquetado para HIPAA de fábrica, con dashboard dedicado — ver `../../control-tecnico/motores/wazuh.md`.

## Fuentes
- [Summary of the HIPAA Security Rule — HHS.gov](https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html)
- [The Security Rule — HHS.gov](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [HIPAA Security Rule To Strengthen the Cybersecurity of ePHI — Federal Register](https://www.federalregister.gov/documents/2025/01/06/2024-30983/hipaa-security-rule-to-strengthen-the-cybersecurity-of-electronic-protected-health-information)
