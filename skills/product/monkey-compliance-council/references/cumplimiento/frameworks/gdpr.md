# GDPR — General Data Protection Regulation

`[VERIFICADO — búsqueda web 22 jul 2026]`

## Qué es
Regulación de protección de datos y privacidad de la Unión Europea, en vigor desde el 25 de mayo de 2018. Aplica a cualquier organización, esté donde esté, que procese datos personales de personas en la UE — no es solo para empresas europeas.

## Requisitos clave
- **Base legal documentada** para cada tratamiento de datos personales (consentimiento, interés legítimo, etc.); si es consentimiento, debe ser inequívoco, informado, sin casillas premarcadas.
- **Seguridad de datos**: medidas técnicas y organizativas apropiadas.
- **Notificación de brechas**: 72 horas para notificar a la autoridad de control (y en ciertos casos a los afectados).
- **Transparencia**: los titulares de los datos deben saber qué se recolecta y por qué.
- **Sanciones**: pueden alcanzar decenas de millones de euros o un porcentaje de la facturación global.

## Quién lo necesita típicamente
Cualquier empresa con usuarios, empleados o clientes en la UE, sin importar dónde esté constituida — relevante para el ICP secundario de Monkey en cuanto haya clientes con operación europea.

## Relación con NIS2 y DORA
GDPR protege datos personales; NIS2 y DORA (ver archivos correspondientes) regulan resiliencia operativa/ciberseguridad de sectores específicos — son complementarios, no sustitutos, y una empresa europea mediana puede necesitar los tres a la vez.

## Mapeo a controles atómicos de Monkey
GDPR introduce categorías de control que SOC 2/ISO 27001 no cubren de forma nativa con el mismo detalle: base legal de tratamiento, derechos del titular (acceso, rectificación, portabilidad, olvido), y evaluaciones de impacto (DPIA). Estos deberán modelarse como controles atómicos propios, no forzados dentro del catálogo de seguridad técnica existente.

## Fuentes
- [What is GDPR — GDPR.eu](https://gdpr.eu/what-is-gdpr/)
- [Data protection under GDPR — Your Europe (Comisión Europea)](https://europa.eu/youreurope/business/dealing-with-customers/data-protection/data-protection-gdpr/index_en.htm)
