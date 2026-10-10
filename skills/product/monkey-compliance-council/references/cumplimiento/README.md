# Cumplimiento — qué exige cada marco

Un archivo por marco en [`frameworks/`](frameworks/), con **fuente y fecha de verificación**. No se inventan citas ni cifras de un
marco: si un dato no está ahí, se verifica antes de afirmarlo.

| Marco | Archivo | Fase en el roadmap |
|---|---|---|
| **SOC 2** | [`soc2.md`](frameworks/soc2.md) | **MVP — el único activo** (D37) |
| ISO 27001 · PCI DSS · HIPAA | [`iso27001.md`](frameworks/iso27001.md) · [`pci-dss.md`](frameworks/pci-dss.md) · [`hipaa.md`](frameworks/hipaa.md) | Fase 1 |
| NIST CSF · CIS Controls | [`nist-csf.md`](frameworks/nist-csf.md) · [`cis-controls.md`](frameworks/cis-controls.md) | Fase 2 |
| GDPR · NIS2 · DORA · LGPD | [`gdpr.md`](frameworks/gdpr.md) · [`nis2.md`](frameworks/nis2.md) · [`dora.md`](frameworks/dora.md) · [`lgpd.md`](frameworks/lgpd.md) | Fase 3 |
| FedRAMP · CMMC | [`fedramp.md`](frameworks/fedramp.md) · [`cmmc.md`](frameworks/cmmc.md) | Evaluados según demanda real (Fase 3) |
| SOC 1 · CCPA/CPRA | [`soc1.md`](frameworks/soc1.md) · [`ccpa-cpra.md`](frameworks/ccpa-cpra.md) | Sin fase asignada en el roadmap |

Fases según [`../producto/mvp-roadmap.md`](../producto/mvp-roadmap.md). Que el conocimiento de un marco esté escrito **no lo activa**
en el producto.

## Dónde está el resto del cumplimiento

- **Cómo se calcula** (los niveles dimensión → control → categoría → marco, las reglas R-01 a R-12, ejemplo resuelto; D62): [`../datos/modelo-datos.md`](../datos/modelo-datos.md) §9.
- **Cómo se modela** (marco → requisito → punto de enfoque → control; el control es atómico e independiente del marco): `modelo-datos.md` §3.
- **Cómo se mide el cumplimiento del cliente** (controles del cliente, riesgos, evidencias, evaluaciones): `modelo-datos.md` §7.
- **Cómo se le habla al usuario final** (readiness cualitativo, sin jerga, plantilla de 7 campos): [`../producto/philosophy.md`](../producto/philosophy.md).
