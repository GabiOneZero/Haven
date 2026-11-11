# Plan de implementación: autenticación y sesión

## Objetivo

Conectar la vista de login existente con Supabase Auth para que los usuarios de
Haven puedan iniciar sesión en Android, conservar su sesión entre aperturas y
acceder a las vistas protegidas sin tener que autenticarse repetidamente.

La autenticación debe integrarse con la estructura actual de Angular, Ionic,
Capacitor y Supabase, y respetar las políticas RLS existentes. Este plan no
incluye cambios de implementación: describe las fases acordadas para realizarlas
progresivamente.

## Estado actual

- La vista de login es una maqueta: recoge correo y contraseña, pero no inicia
  sesión.
- `SupabaseService` crea el cliente compartido de Supabase con la configuración
  del entorno.
- Las rutas de login y tabs existen, pero las rutas de tabs todavía no están
  protegidas por autenticación.
- Home consulta información de moods y requiere un usuario autenticado, un
  perfil y una pertenencia válida al workspace.
- La navegación actual usa una barra de pestañas y todavía no ofrece una acción
  de cierre de sesión.
- El proyecto utiliza Capacitor 8 e incluye el proyecto Android.

Para el contexto de la funcionalidad de moods y sus dependencias de datos,
consultar [MOODS.md](./MOODS.md).

## Decisiones acordadas

### Cuentas y acceso

- El método inicial será correo electrónico y contraseña mediante
  `supabase.auth.signInWithPassword`.
- Las cuentas se crearán manualmente en Supabase; no habrá registro abierto en
  la aplicación.
- La recuperación de contraseña se resolverá manualmente en esta primera fase.
- Antes del primer inicio de sesión, se prepararán el perfil y la pertenencia
  del usuario al workspace.
- Si faltan esos datos, no se incorporará en esta fase un flujo de configuración
  de cuenta o workspace.

### Sesiones

- El objetivo es mantener la sesión hasta que el usuario cierre sesión o esta
  sea revocada.
- Se permitirán sesiones simultáneas de la misma cuenta en varios dispositivos.
- Cerrar sesión en el dispositivo actual no debe cerrar automáticamente las
  sesiones de otros dispositivos.
- Se investigará e integrará almacenamiento nativo cifrado para los tokens en
  Android.
- En navegador web, la sesión persistirá en `localStorage`; este almacenamiento
  no está cifrado y es accesible para JavaScript del mismo origen.
- Los fallos de almacenamiento deben comunicarse explícitamente; nunca se debe
  cambiar silenciosamente a otro tipo de almacenamiento.

### Plataformas y conectividad

- El login está disponible en Android y navegador web. En Android se usa el
  almacenamiento cifrado; en web se usa almacenamiento persistente del navegador.
- Sin conexión, se conservará la sesión local y no se obligará al usuario a
  autenticarse de nuevo por una caída temporal de red.
- No se promete acceso offline a los datos remotos. Las consultas deberán poder
  comunicar el estado de conexión y reintentarse al recuperarla.
- La caché offline de datos no forma parte de la primera fase.

### Seguridad

- La aplicación cliente utilizará únicamente la clave publicable de Supabase.
- No incluir claves `service_role` ni otros secretos en el cliente.
- Las políticas RLS seguirán siendo el control de acceso a los datos; la
  autenticación por sí sola no concede acceso a todos los registros.

## Fases de implementación

### 1. Validar el almacenamiento nativo seguro

Investigar una integración compatible con Capacitor 8, Android y el mecanismo
de almacenamiento de sesiones de Supabase. Elegirla antes de cambiar el flujo de
login.

Validar que:

- los tokens persisten después de cerrar y volver a abrir la aplicación;
- Supabase puede leer, actualizar y eliminar la sesión usando ese almacenamiento;
- la renovación de tokens funciona en Android;
- los errores del almacenamiento se notifican y no producen un fallback
  silencioso a almacenamiento no cifrado.

**Decisión aplicada:** se integró `@aparajita/capacitor-secure-storage` 8.0.1,
compatible con Capacitor 8. En Android cifra los datos con AES-GCM y una clave
del Android Keystore. Supabase utiliza un adaptador dedicado; en navegador web
el adaptador usa `localStorage`, y en ambas plataformas propaga los errores de
almacenamiento.

**Pendiente de validar en dispositivo/emulador:** persistencia tras reiniciar la
app, renovación de tokens y eliminación de la sesión. Las pruebas unitarias
cubren el adaptador y los errores, pero no sustituyen esa verificación nativa.

### 2. Centralizar autenticación y configuración

Ampliar la integración compartida de Supabase y crear un servicio de
autenticación que centralice las operaciones y el estado de sesión.

Responsabilidades previstas:

- iniciar sesión con correo y contraseña;
- exponer el estado de autenticación para las vistas y la navegación;
- observar los cambios de sesión de Supabase;
- cerrar la sesión local y comunicar errores de forma explícita.

Evitar duplicar la gestión de sesión en componentes individuales.

### 3. Conectar el formulario existente

Conectar la vista actual a la operación de inicio de sesión sin cambiar su
diseño visual salvo lo necesario para comunicar estados.

Comportamiento previsto:

- validar los campos requeridos;
- mostrar estado de carga y evitar envíos duplicados;
- mostrar mensajes comprensibles para credenciales incorrectas, problemas de
  conexión y otros errores;
- al iniciar sesión correctamente, navegar a Home;
- no registrar contraseñas ni tokens en logs.

### 4. Restaurar y proteger la sesión

Proteger las rutas autenticadas y definir el destino inicial según el estado de
sesión:

- un usuario autenticado podrá entrar en Tabs;
- un usuario no autenticado será dirigido al login;
- una sesión persistida se restaurará antes de permitir el acceso a las vistas
  protegidas;
- el usuario autenticado que abra la ruta de login será dirigido a la
  aplicación.

La navegación no debe interpretar un error temporal de red como una sesión
cerrada. Debe distinguir entre la sesión restaurada/local y los errores al
consultar datos remotos.

### 5. Integrar Android y el cierre de sesión

Comprobar el comportamiento de renovación y persistencia de tokens al pasar la
aplicación a segundo plano, volver al primer plano y reiniciar el proceso.

Añadir una acción visible para cerrar sesión en un lugar coherente con la
navegación existente. Al cerrarla:

- eliminar la sesión persistida en el dispositivo actual;
- dirigir al usuario al login;
- impedir el acceso posterior a rutas protegidas;
- no cerrar las sesiones de otros dispositivos de la misma cuenta.

### 6. Verificar el flujo completo

Realizar pruebas unitarias con Supabase simulado y pruebas en un dispositivo o
emulador Android.

Casos mínimos:

- login correcto;
- credenciales incorrectas;
- error de red durante el login;
- estado de carga y prevención de envíos duplicados;
- restauración de la sesión después de cerrar y abrir la aplicación;
- acceso directo a una ruta protegida con y sin sesión;
- cierre de sesión y eliminación de la sesión local;
- recuperación de conexión sin forzar un nuevo login;
- sesión revocada o expirada;
- acceso de Home a los datos permitidos por RLS para el usuario y su workspace.

Verificar que las pruebas no dependen de credenciales reales ni modifican el
proyecto remoto de Supabase.

## Criterios de aceptación

- Un usuario creado manualmente en Supabase puede iniciar sesión desde Android.
- Un usuario puede iniciar sesión desde navegador web; la sesión se conserva en
  el almacenamiento del navegador y no está cifrada como en Android.
- Las credenciales y los errores se muestran sin exponer información sensible.
- La sesión persiste entre aperturas; Android usa almacenamiento nativo cifrado
  y web usa `localStorage`, que no está cifrado.
- Las rutas autenticadas están protegidas y el usuario vuelve al login al cerrar
  sesión.
- Un fallo temporal de conexión no elimina ni invalida por sí solo la sesión
  local.
- Home puede cargar los datos permitidos por RLS cuando hay conexión y la
  cuenta tiene su perfil y workspace preparados.
- No hay registro abierto, recuperación automatizada ni caché offline de datos
  en el alcance inicial.
- No se incluye ningún secreto privilegiado en el cliente.

## Fuera del alcance inicial

- Registro abierto de usuarios.
- Recuperación automatizada de contraseña.
- Creación automática de perfiles o asignación a workspaces.
- Restricción a una sola sesión por cuenta.
- Soporte de login en navegador web.
- Acceso a datos previamente cargados mientras no haya conexión.
- Cambios a políticas RLS salvo que las pruebas identifiquen un problema
  relacionado directamente con esta integración.
