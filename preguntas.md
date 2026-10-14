## Cómo funciona

Un riesgo (por ejemplo, «alguien accede sin permiso a los datos de los clientes») nace de causas (por ejemplo, «contraseñas débiles» o «cuentas sin doble verificación»). Cada causa se reduce con controles (por ejemplo, «política de contraseñas» o «doble verificación obligatoria»).

Cuando los controles funcionan, el riesgo baja pero casi nunca desaparece. Lo que queda es el riesgo residual. Monkey mide cada riesgo con dos números del 1 al 5: la probabilidad (qué tan probable es) y el impacto (qué tan grave sería). Multiplicados dan un valor de 1 a 25.

## Las cinco preguntas

1. ¿Hasta qué nivel de riesgo se puede vivir, y quién lo decide?
   Aun con todos los controles funcionando, un riesgo puede quedarse en, por ejemplo, 12 de 25. Para decir si eso es aceptable hace falta una línea: «hasta 9 está bien; por encima, hay que reducirlo más». Esa línea se llama apetito de riesgo, y el comité propone 9 de 25.

Pregunta: ¿quién fija esa línea y quién la aprueba? ¿Es la misma para todas las empresas, la define cada empresa o cada servicio? ¿Cambia según el tipo de riesgo?
Importa porque: sin esto Monkey no puede decir «este riesgo es aceptable» o «hay que reducirlo».

2. Si una revisión automática falla por un problema técnico, ¿qué hacemos?
   Monkey revisa los servidores de forma automática. A veces la revisión no se completa porque el servidor no respondió o se cortó la conexión. Eso no significa que el servidor incumpla. Hoy queda en «error»: no cuenta como cumplido ni como incumplido, hasta que una nueva revisión funcione.

Pregunta: ¿cuántas veces y cada cuánto se reintenta? Si después de esos intentos sigue sin funcionar, ¿se queda en «error», pasa a «pendiente» o se considera «no cumple»?
Importa porque: define cuánto tiempo puede quedar algo sin medirse antes de afectar el resultado.


3. ¿Cuánto tiempo vale una evidencia y cada cuánto se repiten las pruebas?
Una evidencia, como una política firmada, no vale para siempre. Al pasar su vigencia se marca «vencida» y el control deja de estar en regla. Hoy la plataforma lee la nube cada 6 a 24 horas y los servidores de forma continua, pero no hay una regla de cuánto vale cada tipo de documento ni cada cuánto se repite cada prueba.

Pregunta: ¿cuánto dura como válido cada tipo de evidencia (una política aprobada, ¿12 meses?; un acta de revisión, ¿cada trimestre?) y cada cuánto se repite cada tipo de prueba?
Importa porque: sin esto Monkey no sabe cuándo avisar que algo venció.


4. ¿Quién da la probabilidad y el impacto de los 10 riesgos del catálogo?
El catálogo trae 10 riesgos y hace falta decir, para cada uno, qué tan probable es y qué tan grave sería. En la hoja Riesgos esas columnas están vacías y el prototipo usa valores de ejemplo. Habíamos entendido que los pone cada cliente, porque un mismo riesgo no es igual de grave para todas las empresas; el Excel pide diligenciarlos.

Pregunta: ¿los define el comité como un valor base del catálogo (que el cliente luego puede ajustar), o cada cliente desde cero?
Importa porque: sin probabilidad e impacto no hay riesgo inicial ni riesgo que queda.


5. ¿Qué controles reducen cada causa, y cómo?
Para calcular cuánto baja un riesgo hay que saber qué controles atacan cada causa, si ese control es imprescindible y si, al funcionar, vuelve el riesgo menos probable (la doble verificación evita accesos indebidos) o menos grave (el cifrado reduce el daño de una fuga). Hoy esto está definido solo para 4 de las 56 causas.

Pregunta: para las otras 52, ¿qué controles las reducen, cuáles son obligatorios y si cada uno reduce la probabilidad o el impacto?
Importa porque: es el dato que más pesa; sin él no se puede calcular el riesgo que queda para casi ningún riesgo.
