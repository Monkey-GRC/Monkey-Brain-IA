# Enums — Empresas

Los valores de los enums de este módulo. Índice de todos: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta la resuelve i18n.

### `isolation_strategy` — `companies.isolation_strategy`
`shared` Compartida (RLS) · `dedicated` Dedicada

Lo marca `admin_monkey` al registrar la empresa. No se revierte sin migrar datos.

### `company_status` — `companies.status`
`active` Activa · `suspended` Suspendida · `deactivated` Archivada *(D97: sin acceso hasta el borrado definitivo; solo `admin_monkey`)*

### `company_deactivation_reason` — motivo al archivar una empresa (D97)
`non_payment` Falta de pago · `client_request` El cliente ya no desea el servicio · `other` Otro

### `access_key_status` — `access_keys.status`
`pending` Pendiente · `used` Usada · `expired` Expirada · `revoked` Revocada *(también el estado de los códigos de activación de cuentas, D95)*

### `access_key_delivery_status` — `access_key.delivery_status` (D99)
`sent` Enviada (el servicio de correo aceptó el mensaje) · `failed` No se pudo enviar *(no se guarda: viaja solo en la respuesta del registro y del reenvío)*
