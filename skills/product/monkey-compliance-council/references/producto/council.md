# El Consejo — roster y forma de operar

Este es el panel de expertos simulado que diseñó a Monkey y que sigue asesorando su construcción. Cuando una decisión de producto o arquitectura tenga tensión real, invoca el punto de vista de quien corresponda en vez de dar una respuesta plana — así es como se llegó a las decisiones documentadas en `architecture.md` y `mvp-roadmap.md`, y así se debe seguir decidiendo.

## Estrategia
- **Fundador de un unicornio SaaS B2B** — presiona por velocidad de salida al mercado y por no construir nada que no le hayan pedido los primeros 20 clientes reales.
- **Venture Capital especializado en SaaS** — evalúa cada feature por su efecto en el ciclo de venta y en el costo de servir; su pregunta favorita es "¿esto reduce o aumenta cuánto necesitamos a un humano por cliente?".
- **Product Strategist** — dueño de la disciplina de alcance; su rol es decir "no todavía" más que nadie en el panel.
- **PM ex-Vanta, PM ex-Drata, PM ex-Secureframe** — conocen de primera mano por qué cada competidor construyó lo que construyó, y cuándo. Su aporte es evitar reinventar por ignorancia y evitar copiar por inercia.

## Compliance
- **Auditor SOC 2, Auditor ISO 27001** — el filtro final de cualquier feature relacionada con evidencia: "¿esto es lo primero que pediría un auditor?".
- **Especialista PCI DSS, HIPAA, NIST, CIS Controls** — dueños de la precisión framework por framework; consúltalos (vía los archivos en `cumplimiento/frameworks/`) antes de afirmar qué exige cada uno.
- **Especialista GRC, Compliance Officer** — vigilan que Monkey nunca cruce la línea de certificar cumplimiento por sí misma ni de sustituir el juicio de un auditor o abogado.

## Seguridad
- **CISO** — principio rector: "esta plataforma debe estar diseñada con el mismo rigor que le exige a sus clientes".
- **Security Architect, Cloud Security Architect** — diseño de aislamiento multi-tenant y de la superficie de ataque de cada conector.
- **DevSecOps Lead** — pipeline, secretos, gestión de llaves.
- **Especialista IAM, especialista Zero Trust** — nada de confianza implícita entre servicios ni privilegios de más en un conector.
- **Especialista SIEM/XDR** — la voz que mejor entiende a Wazuh, CrowdStrike y SentinelOne; consúltalo junto con `wazuh.md` para cualquier decisión de ingesta de eventos.

## Infraestructura
- **AWS / Azure / Google Cloud Solutions Architect** — conectores cloud, IAM nativo de cada proveedor.
- **Kubernetes Architect** — solo relevante cuando el roadmap llegue a clientes con clústeres propios (fase LATER).
- **On-Prem Infrastructure Expert, Windows Server Expert, Linux Infrastructure Expert** — la voz que sostiene que sin soporte on-prem real, Monkey pierde su diferenciador frente a los cuatro líderes cloud-native.

## Integraciones
- Especialistas en **Microsoft 365, Google Workspace, Okta, Entra ID, GitHub, GitLab, Jira, Slack, Wazuh, CrowdStrike, SentinelOne** — cada uno defiende la profundidad de su propio conector; el Product Strategist es quien decide el orden de construcción real.

## Software
- **Principal Software Architect** — vetó microservicios prematuros a favor de un monolito modular; sigue siendo el árbitro de cualquier propuesta que aumente la complejidad operativa sin presión de escala real que la justifique.
- **Staff Backend Engineer, Frontend Architect, Enterprise UX Lead, Data Architect** — el Data Architect es dueño del modelo de controles atómicos multi-framework, la decisión de modelado más importante del producto.

## Inteligencia Artificial
- **AI Architect, LLM Engineer** — diseño del motor de IA, RAG sobre el grafo de conocimiento del tenant, separación de modelos baratos/frecuentes vs. costosos/esporádicos.
- **AI Security Expert** — define el aislamiento de datos entre tenants en la capa de inferencia como el riesgo #1 de todo el producto.
- **AI Governance Expert** — dueño de la regla "human-in-the-loop" como decisión de producto permanente, no limitación temporal; exige que toda evidencia generada por IA quede etiquetada como tal.

## Experiencia de Usuario
- **UX Researcher, Enterprise UX Designer** — dueños de que la vista detallada tipo matriz nunca desaparezca (es la pantalla de los roles `auditor` y `consultor`, D63, D64), aunque el cliente no la vea.
- **Behavioral Designer** — dueño de que el dashboard responda siempre a 4 preguntas ("¿Estamos bien? ¿Qué es urgente? ¿Qué cambió? ¿Qué debemos hacer hoy?") y nunca se vea como una hoja de cálculo.

## Cómo el Consejo llega a una decisión

Para toda decisión de alcance (construir X ahora, después, o nunca), el patrón que ya se usó y que se debe repetir es:

1. **¿Por qué existe este problema?** (a qué dolor real responde, en quién)
2. **¿Qué complejidad introduce resolverlo?** (técnica, de UX, de superficie de ataque, operativa)
3. **¿Vale la pena para el MVP / para esta fase?**
4. **¿Qué haría Vanta / Drata / Secureframe / Sprinto?** (usa `cumplimiento/frameworks/` y el conocimiento de mercado ya reunido; si hace falta un dato más fresco, dilo y busca en vez de asumir)
5. **¿Qué haría una startup moderna (sin la ventaja de años de integraciones)?**
6. **¿Qué haríamos nosotros para hacerlo mejor?**
7. Clasificación final: **MUST / SHOULD / LATER / NO BUILD**, con una frase de justificación.

Cuando dos miembros del panel discrepen genuinamente (p. ej. infraestructura vs. Product Strategist sobre on-prem en el MVP), muestra ambas posturas y la resolución — no la ocultes detrás de una respuesta ya masticada. Es lo que hace creíble y útil al Consejo.
