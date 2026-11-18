# Plan de implementación: Google Calendar en Agenda

## Objetivo

Implementar en Haven una vista Agenda conectada a Google Calendar para consultar
y gestionar eventos del calendario principal personal de cada usuario y de un
calendario compartido por el workspace. Google será la fuente de verdad: las
operaciones realizadas en Haven se aplicarán a Google y los cambios externos se
verán al volver a cargar o refrescar.

Este documento describe el alcance, el estado del repositorio y una secuencia
de trabajo ejecutable. No incluye la implementación ni credenciales reales.

## Instrucciones para el agente que implemente

1. Leer este documento, `AUTH_IMPLEMENTATION_PLAN.md`, `MOODS.md`,
   `package.json` y los archivos actuales del alcance.
2. Comprobar el estado de Git; conservar cambios preexistentes y no editar
   cambios ajenos al trabajo.
3. Seguir los pasos y puertas de salida en orden. No empezar una fase si sus
   prerrequisitos no están satisfechos.
4. No implementar OAuth directamente en Angular ni guardar tokens Google en
   Angular, almacenamiento local, `SecureAuthStorageService` o metadatos de
   Supabase accesibles desde el cliente.
5. Antes de añadir dependencias, comprobar las capacidades actuales de Angular,
   Ionic, Capacitor, Supabase y las API nativas. Adoptar una biblioteca/plugin
   solo después de una prueba técnica acotada y de documentar por qué hace falta.
6. No asumir que el esquema remoto de Supabase coincide con el repositorio. La
   inspección remota debe ser de solo lectura y realizarse con autorización.
   No aplicar cambios a un proyecto remoto sin autorización explícita.
7. Si falta infraestructura, acceso remoto, cuentas de prueba o configuración
   externa, detenerse en la puerta correspondiente y reportar exactamente qué
   falta, quién debe proporcionarlo y qué trabajo queda bloqueado. No simular
   una integración terminada con datos falsos.
8. Al cerrar cada fase, entregar: resumen de cambios, archivos afectados,
   decisiones tomadas, pruebas ejecutadas con resultado y bloqueos pendientes.
   No afirmar que una fase está terminada si su criterio de salida no se cumple.
9. Ejecutar las pruebas relevantes de cada fase y los comandos finales de
   [Verificación](#verificación). Registrar y distinguir fallos preexistentes
   de los introducidos por el cambio.

## Decisiones de producto acordadas

- Google Calendar es una conexión **separada** del inicio de sesión de Haven.
  Los usuarios seguirán autenticándose en Haven con el mecanismo actual de
  Supabase.
- Cada usuario de Haven autoriza su propia cuenta de Google. Ambos usuarios
  tienen acceso, desde sus respectivas cuentas, al mismo calendario compartido.
- Se consideran dos fuentes: el **calendario principal personal** de cada
  cuenta y un **calendario compartido** configurado para el workspace.
- En Agenda habrá tres filtros con estos literales exactos:
  - **Personal**: solo el calendario principal personal del usuario actual.
  - **Compartido**: solo el calendario compartido del workspace.
  - **Ambos**: personal más compartido.
- Home muestra eventos de ambos calendarios, independientemente del filtro de
  Agenda.
- Haven podrá crear, modificar y borrar eventos en ambos calendarios. El
  borrado de un evento compartido también lo elimina en Google para el otro
  usuario y requiere confirmación explícita.
- Google es la fuente de verdad. No se crea una copia independiente de los
  eventos en Haven en la primera versión.
- Se actualiza al abrir la vista o mediante acción manual de refresco. No se
  incluye sincronización periódica, segundo plano ni push en esta fase.
- La primera versión incluye título, fecha/hora de inicio y fin, zona horaria,
  eventos de día completo, recurrencia y recordatorios. No incluye gestión de
  invitados/respuestas.
- Plataformas iniciales: navegador web y Android.
- Reducir al mínimo los inicios de sesión/consentimientos repetidos de Google.
  El acceso debe poder renovarse de forma segura mientras Google lo permita;
  no se promete una autorización permanente ni evitar solicitudes de
  reautenticación después de una revocación, expiración o requisito de Google.
- La conexión y desconexión de Google se administran en Ajustes. La vista Agenda
  puede comunicar si la conexión está activa, pero no ofrece la acción de
  desconexión.

## Referencia visual y comportamiento esperado

La muestra compartida por el usuario sirve como guía de composición, no como
especificación de píxeles:

1. Encabezado **Agenda**.
2. Selector de tres pestañas: **Personal**, **Compartido**, **Ambos**. En la
   muestra aparecen pestañas compactas; deben adaptarse a móvil y mantener
   etiquetas legibles.
3. Indicador discreto del estado de Google Calendar, sin acción de desconexión.
4. Calendario mensual con controles para mes anterior/siguiente, nombre del mes
   y año en español, días de la semana, selección visible del día y marcas en
   los días con eventos.
5. Agenda debajo del mes para el día seleccionado: fecha, estado de eventos
   programados y tarjetas en orden cronológico con hora y título.
6. Respetar el tema oscuro, las variables/tokens visuales existentes, las áreas
   seguras de Ionic/Capacitor, diseño adaptable y accesibilidad.

El mes y los eventos de la captura son ilustrativos; no deben codificarse como
datos reales ni como valores iniciales fijos. No se incluyen las secciones
«Próximos eventos» o «Fechas especiales»: las tres pestañas son filtros por
origen de calendario. No asumir el significado de iconos/contadores decorativos
de la captura si no existe un requisito asociado.

### Comportamientos de Agenda

- Al abrir Agenda, seleccionar el mes y la fecha actual, y usar por defecto
  **Ambos**. Si la implementación opta por otro valor inicial por razones de
  UX, documentar el motivo y mantener una única selección predeterminada.
- Cambiar de pestaña filtra los puntos del mes y los eventos de la agenda del
  día sin cambiar mes ni fecha seleccionados.
- Navegar entre meses actualiza los puntos y el conjunto de datos consultado.
- Seleccionar un día muestra sus eventos; el estado vacío debe ser claro y
  permitir crear un evento en ese día.
- Al crear un evento con **Ambos** seleccionado, pedir el calendario destino
  explícitamente; nunca elegir silenciosamente personal o compartido.
- En edición y borrado operar sobre el calendario que contiene el evento. Al
  borrar un evento compartido, indicar que también se eliminará para los demás
  usuarios del calendario.
- En la primera versión no se prometen actualizaciones instantáneas de cambios
  hechos en Google u otro dispositivo; ofrecer refresco manual y recargar al
  volver a la vista según los ciclos de vida existentes.

## Estado actual

- [calendar.page.ts](./src/app/views/calendar/page/calendar.page.ts) es un
  componente Angular standalone prácticamente vacío.
- [calendar.page.html](./src/app/views/calendar/page/calendar.page.html)
  solo muestra el encabezado «Calendario» y el texto placeholder
  `Calendar content goes here.`
- [calendar.page.scss](./src/app/views/calendar/page/calendar.page.scss) no
  contiene actualmente estilos específicos.
- [calendar.page.spec.ts](./src/app/views/calendar/page/calendar.page.spec.ts)
  es una prueba obsoleta: importa `Tab2Page` desde `../tab2.page` en vez de
  probar `CalendarPage`.
- [home.page.ts](./src/app/views/home/page/home.page.ts) contiene tres eventos
  de ejemplo hardcodeados en memoria.
- [day-schedule-card.component.ts](./src/app/views/home/components/day-schedule-card/day-schedule-card.component.ts)
  filtra y ordena `DayEvent`; la plantilla asociada representa la tarjeta de
  Home. Estos datos deben provenir del servicio compartido, no de la vista
  Calendar.
- [auth.service.ts](./src/app/shared/services/auth.service.ts) implementa la
  autenticación actual de Haven mediante email/contraseña y Supabase.
- [supabase.service.ts](./src/app/shared/services/supabase.service.ts) mantiene
  un cliente Supabase compartido. No se observa integración con Google OAuth ni
  Google Calendar en el código existente.
- [secure-auth-storage.service.ts](./src/app/shared/services/secure-auth-storage.service.ts)
  almacena la sesión de Haven (Keystore en Android y `localStorage` en web);
  **no debe convertirse en almacén de tokens de Google**.
- [navbar.routes.ts](./src/app/shared/navbar/navbar.routes.ts) protege las rutas
  de las pestañas mediante la sesión de Haven.
- No se observa en el repositorio una carpeta de Supabase Functions,
  migraciones SQL ni pantalla de Ajustes dedicada. La integración backend y el
  lugar de Ajustes deberán comprobarse/definirse antes de implementarlos.
- La aplicación usa Angular 22, Ionic 9, Capacitor 8 y `@supabase/supabase-js`.
  Revisar las versiones exactas del `package.json` antes de seleccionar
  bibliotecas.

## Arquitectura recomendada

### Separar frontend, autenticación de Haven y credenciales de Google

Usar Supabase Auth únicamente para identificar al usuario de Haven. El frontend
llama a una API backend autenticada con la sesión de Supabase; el backend valida
esa identidad, aplica autorización de workspace y realiza las llamadas a Google
Calendar.

Recomendación inicial: Supabase Edge Functions u otro backend confiable del
proyecto. Antes de implementarlo, verificar cómo se despliegan Functions,
migraciones y secrets para este proyecto; actualmente no hay estructura de
backend Supabase en el repositorio. Si se usa otra plataforma backend, debe
respetar los mismos requisitos.

El backend debe:

- ejecutar el flujo de autorización/intercambio OAuth y la renovación de
  credenciales;
- guardar los refresh tokens cifrados y fuera del alcance de lectura del
  cliente, usando almacenamiento/secret management apto para credenciales
  persistentes;
- validar en cada operación el usuario Supabase, el workspace y que el
  calendario destino sea el principal personal autorizado o el calendario
  compartido configurado;
- validar y sanear los parámetros de las operaciones; no aceptar un `calendarId`
  arbitrario del cliente como autorización;
- no devolver refresh tokens, client secrets ni credenciales de backend;
- registrar errores útiles sin registrar access tokens, refresh tokens, códigos
  OAuth ni datos sensibles de eventos.

No usar `service_role` ni client secret en el bundle Angular. No guardar tokens
Google en `localStorage`, `SecureAuthStorageService` ni metadatos de perfil
consultables directamente por el usuario. Cualquier tabla de conexión debe
tener RLS y no permitir que el cliente lea o escriba secretos. La identidad
Google vinculada debe asociarse al usuario de Haven autenticado y cada usuario
debe autorizar su propia cuenta.

### OAuth web y Android

- Usar el flujo recomendado por Google para aplicaciones web y móviles; en
  Android abrir el agente externo de usuario (navegador del sistema o mecanismo
  nativo recomendado), no un WebView embebido.
- Proteger el flujo con `state`, PKCE cuando aplique, verificación de redirect
  URI y manejo de cancelación/errores.
- Diseñar y probar retorno/deep link a Android con Capacitor y la URL de retorno
  web. La configuración actual no muestra un deep link de OAuth.
- Solicitar acceso offline para poder renovar sin pedir login a cada apertura,
  siguiendo las reglas vigentes de Google para obtener y renovar tokens. No
  solicitar consentimiento en cada inicio. La renovación y revocación deben
  estar gestionadas en backend.
- Preparar correctamente la pantalla de consentimiento, usuarios de prueba,
  dominios/redirect URIs y verificación de Google antes de publicar. Confirmar
  en la prueba técnica qué scopes concretos exige el alcance y las obligaciones
  de revisión/verificación asociadas.
- Minimizar scopes. La aplicación necesita descubrir calendarios permitidos y
  leer/escribir eventos en los dos calendarios configurados. Determinar en la
  prueba técnica el conjunto mínimo vigente (por ejemplo, lectura de lista de
  calendarios y alcance de eventos), no solicitar permisos de administración
  de Google Calendar ni de toda la cuenta.
- Mostrar al usuario por qué se solicitan permisos y cómo desconectar la cuenta.

### Calendario compartido y workspace

Cada usuario conecta Google por separado, pero ambos necesitan permiso Google
para el mismo calendario compartido. Configurar el calendario compartido una
vez a nivel del workspace y verificar que cada usuario autorizado puede
acceder al ID configurado. No inferir que compartir en Haven concede acceso en
Google.

Si no existe ya una configuración de workspace adecuada, diseñar una migración
para almacenar el ID del calendario compartido. Debe ser visible solo a miembros
del workspace que tengan permiso de aplicación, y el backend debe comprobar el
acceso Google de cada conexión antes de habilitarlo. Definir qué hacer cuando
ambos usuarios están conectados, pero uno no tiene acceso: mostrar un estado de
configuración incompleta y permitir reintentar o corregir el acceso, sin
presentar un calendario vacío como si no hubiera eventos.

No replicar inicialmente títulos, descripciones, ubicaciones ni otros datos de
eventos Google en tablas compartidas de Haven. Solo persistir en backend los
metadatos necesarios para conexión, autorización y configuración. Evaluar
caché o sincronización incremental solo si una necesidad demostrada de
rendimiento/cuota lo justifica.

### Modelo de dominio recomendado

Definir tipos independientes de los modelos UI y de las respuestas crudas de
Google. Como mínimo:

- **GoogleConnection**: usuario Haven, estado, identidad Google no secreta,
  fechas de conexión/actualización y estado de autorización.
- **WorkspaceCalendarConfig**: workspace e ID del calendario compartido.
- **CalendarSource**: `personal` o `shared`, ID Google, nombre, zona horaria y
  permisos observados.
- **CalendarEvent**: ID de evento, ID de calendario, origen, título, inicio y
  fin tipados para fecha/hora o evento de día completo, zona horaria, recurrencia
  y recordatorios.

La identidad de un evento debe incluir como mínimo `(calendarId, eventId)`:
los IDs de eventos no se deben tratar como globalmente únicos entre
calendarios. Conservar los campos originales necesarios para las escrituras sin
exponerlos sin necesidad al componente.

## Ruta de implementación paso a paso

Esta ruta define el orden obligatorio de ejecución. Las secciones posteriores
describen el alcance técnico por área; no se deben interpretar como un orden
alternativo. Cada paso tiene prerrequisitos y una puerta de salida. Si falta un
requisito externo, detenerse en esa puerta y reportar el bloqueo en lugar de
simular resultados.

### Paso 0 — Establecer la línea base y descubrir el entorno

**Prerrequisitos:** acceso al repositorio. La inspección del proyecto remoto de
Supabase requiere autorización y debe ser de solo lectura.

1. Revisar `git status` y registrar los cambios preexistentes ajenos a esta
   tarea. No revertirlos ni incluirlos en los cambios de Calendar.
2. Leer `package.json`, `AUTH_IMPLEMENTATION_PLAN.md`, `MOODS.md`, rutas,
   `SupabaseService`, `AuthService`, `SecureAuthStorageService`, Home y Calendar.
3. Ejecutar las comprobaciones mínimas disponibles como línea base. Confirmar
   si `calendar.page.spec.ts` falla por importar `Tab2Page`; no atribuir ese
   fallo a la integración nueva.
4. Con autorización, inspeccionar el esquema y las políticas remotas de
   usuarios, perfiles, workspaces y `calendar_events`. `MOODS.md` menciona
   `calendar_events`; no crear otra estructura ni inferir su finalidad sin
   verificarla.
5. Confirmar si existen despliegue de Supabase Functions, migraciones,
   almacenamiento seguro de secretos y una pantalla/ruta de Ajustes no visible
   en la estructura inicial del repositorio.

**Puerta de salida**

- Informe de línea base: comandos, resultados y fallos preexistentes.
- Inventario confirmado del esquema remoto y del backend disponible, o lista
  explícita de accesos que faltan.
- Prueba obsoleta de Calendar identificada para corregirse antes de usarla
  como validación de UI.

**Bloqueo:** no diseñar migraciones, relaciones ni políticas basándose en un
esquema remoto no verificado; no modificar proyectos remotos sin autorización.

### Paso 1 — Resolver arquitectura y validar OAuth

**Prerrequisitos:** Paso 0 terminado y acceso a los responsables de Google
Cloud/backend para las pruebas necesarias.

1. Elegir el backend que hará de frontera de confianza: Supabase Edge Functions
   u otro servicio ya desplegado. Verificar autenticación de la sesión Haven,
   despliegue y configuración por entorno.
2. Documentar el flujo OAuth vigente recomendado por Google para navegador y
   Android: tipo de cliente OAuth, agente externo, callback, `state`, PKCE
   cuando aplique, cancelación y retorno a la aplicación. No asumir que web y
   Android usan el mismo tipo de cliente o callback.
3. Hacer una prueba técnica acotada en ambas plataformas: autorización,
   retorno, lectura mínima de Calendar API y renovación. No añadir una
   biblioteca/plugin antes de demostrar que hace falta.
4. Determinar scopes mínimos, requisitos de consentimiento/verificación y
   callbacks por entorno. Registrar nombres de configuración, nunca secretos,
   códigos OAuth o tokens.
5. Elegir y demostrar el almacenamiento persistente cifrado de refresh tokens:
   clave gestionada fuera de la base de datos, acceso restringido, estrategia
   de rotación/recuperación y ausencia de acceso desde el cliente. Una variable
   de entorno efímera no es almacenamiento persistente de tokens de usuarios.
6. Confirmar dos usuarios Haven de prueba en el mismo workspace y dos cuentas
   Google con acceso al mismo calendario compartido.
7. Registrar la decisión de backend, flujo, librerías, límites conocidos y
   alternativas descartadas.

**Puerta de salida**

- Prueba repetible documentada para web y Android.
- Decisión de arquitectura aprobada, con descripción del flujo OAuth y dónde
  persiste cada dato.
- Matriz de configuración externa con `nombre`, `entorno`, `responsable`,
  `estado` y `uso`; sin valores secretos.
- Lista de scopes y justificación de cada uno.

**Bloqueo:** no avanzar a producción OAuth si no se pueden almacenar y renovar
credenciales fuera del cliente, o no existe un flujo viable para alguna
plataforma inicial.

### Paso 2 — Definir contratos, datos y autorización

**Prerrequisitos:** Pasos 0 y 1 terminados; esquema remoto inspeccionado.

1. Definir tablas/configuración a partir del esquema real, sin duplicar
   `calendar_events` ni otras estructuras existentes. Separar metadatos no
   secretos, credenciales cifradas y configuración del calendario compartido.
2. Definir quién administra el ID del calendario compartido y qué permiso de
   Haven necesita. Si hace falta migración, incluirla en el repositorio y
   documentar aplicación por entorno; no aplicarla a producción sin
   autorización.
3. Determinar, según esquema y producto, si el workspace admite exactamente
   dos miembros o cualquier cantidad. No inferir cardinalidad a partir de
   ejemplos de prueba.
4. Especificar contratos backend para inicio/completado OAuth, estado,
   verificación de calendarios, lectura, mutaciones y desconexión. Derivar la
   identidad de la sesión Haven validada; no confiar en `userId`,
   `workspaceId` o `calendarId` del cliente como autorización.
5. Definir errores tipados estables: no conectado, autorización revocada, falta
   de permiso compartido, entrada inválida, conflicto de versión, cuota/límite,
   fallo temporal Google y fallo interno. No devolver mensajes crudos del
   proveedor ni secretos al cliente.
6. Definir auditoría mínima: operación, resultado y correlación; nunca tokens,
   códigos OAuth, secretos ni contenido innecesario de eventos.
7. Definir ciclo de vida de conexión: vincular, renovar, reconectar,
   desconectar, revocar cuando sea posible y limpiar credenciales/metadatos sin
   cerrar la sesión Haven.

**Puerta de salida**

- Esquema, contratos y reglas RLS documentados.
- Para cada operación se especifican actor autorizado, entradas, respuesta y
  errores.
- Está definido quién administra el calendario compartido y cómo se verifica
  que cada conexión Google tiene acceso.

### Paso 3 — Implementar backend y ciclo de conexión

**Prerrequisitos:** Paso 2 aprobado y configuración externa de desarrollo
disponible.

1. Crear migraciones y RLS para los metadatos mínimos, respetando el esquema
   existente. Verificar que el cliente no puede leer ni escribir credenciales
   cifradas.
2. Implementar Functions/endpoints para iniciar/completar OAuth, consultar
   estado, validar acceso a calendarios, renovar credenciales y
   desconectar/revocar.
3. Autorizar cada operación por usuario Haven, workspace, conexión y calendario
   permitido. Rechazar IDs de calendario arbitrarios.
4. Persistir y recuperar refresh tokens mediante el mecanismo cifrado decidido.
   No exponer tokens en respuestas, logs ni telemetría.
5. Implementar errores tipados y manejo de límites/reintentos. No reintentar
   indefinidamente operaciones no idempotentes.
6. Añadir la interfaz mínima de Ajustes para conectar, mostrar cuenta/estado,
   reconectar y desconectar. Si no existe un patrón de Ajustes, añadir un punto
   de entrada mínimo consistente con la navegación; no mezclar con login o
   cierre de sesión Haven.
7. Configurar callbacks web y deep links Android. Probar callback malformado,
   `state` incorrecto, cancelación, callback duplicado, arranque en frío y
   retorno con la app suspendida.
8. Configurar el calendario compartido con comprobación del permiso del
   administrador y del acceso Google de cada conexión. Un fallo de acceso
   produce estado de configuración incompleta, no una lista vacía.

**Puerta de salida**

- Conectar, volver a abrir, renovar y desconectar funciona en entorno de prueba
  sin exponer secretos.
- Pruebas backend cubren usuario no autenticado, usuario ajeno, workspace no
  permitido, calendario inválido y errores del proveedor.
- Conectar/desconectar Google no altera la sesión de Haven.

### Paso 4 — Crear modelo de dominio y lectura de extremo a extremo

**Prerrequisitos:** Paso 3 terminado; cuenta de prueba conectada y con permisos.

1. Definir tipos independientes de Google/UI: `GoogleConnection`,
   `WorkspaceCalendarConfig`, `CalendarSource` y `CalendarEvent`. La identidad
   de cada evento es `(calendarId, eventId)`.
2. Crear un único servicio Angular para estado y operaciones de Calendar.
   Centralizar adaptadores y errores; no llamar a Google desde componentes ni
   duplicar consultas en Home.
3. Implementar primero solo lectura por rango, paginación completa y
   normalización. Consultar el rango visible del mes, incluidos los días
   adyacentes que aparecen en la cuadrícula.
4. Aplicar semántica temporal consistente:
   - Mes, día seleccionado y rango visible se calculan en la zona local del
     dispositivo.
   - Eventos con hora se muestran en esa zona; al editar/guardar se conserva
     la zona horaria original del evento.
   - Eventos de día completo permanecen como fechas civiles con fin exclusivo;
     no convertirlos a instantes UTC.
   - Las consultas usan inicio inclusivo y fin exclusivo con conversión
     explícita al formato requerido por Google.
5. Definir el tratamiento de recurrencias y excepciones según el endpoint
   elegido. Preservar identificador de serie y ocurrencia; una mutación no debe
   afectar eventos fuera del ámbito elegido.
6. Combinar **Ambos** por `(calendarId, eventId)` y ordenar de forma
   determinista. Los eventos de día completo preceden a eventos con hora en la
   misma fecha.
7. Tratar resultados parciales por origen: si falla Personal o Compartido,
   identificar la fuente fallida y conservar los resultados válidos; no
   presentar el fallo parcial como agenda vacía.
8. Evitar respuestas obsoletas al navegar rápido: cancelar solicitudes cuando
   sea posible o descartar resultados de rangos que ya no están seleccionados.
9. Diferenciar carga, no conectado, autorización revocada, falta de acceso
   compartido, error temporal, cuota, error parcial y vacío. Si se conservan
   resultados previos en memoria tras un fallo, indicar que no están
   actualizados.

**Puerta de salida**

- Una cuenta Haven de prueba puede conectar Google y consultar eventos
  personales y compartidos por rango.
- Pruebas cubren paginación, rango, zonas horarias, días completos,
  recurrencias/excepciones, duplicados, orden, errores parciales y respuestas
  obsoletas.
- No se presentan datos hardcodeados como eventos reales.

### Paso 5 — Implementar Agenda de solo lectura

**Prerrequisitos:** Paso 4 terminado.

1. Reemplazar el placeholder de `calendar.page.html` siguiendo composición,
   tokens, tema oscuro, áreas seguras y accesibilidad existentes.
2. Corregir `calendar.page.spec.ts` para importar y probar `CalendarPage`.
3. Implementar encabezado, estado de conexión, filtros **Personal**,
   **Compartido** y **Ambos**, navegación mensual y agenda del día.
4. Abrir en hoy y filtro **Ambos**. Cambiar filtro conserva mes/día; cambiar
   mes actualiza rango y puntos; seleccionar día muestra eventos y acción de
   crear.
5. Marcar los días con eventos según el filtro. Si se distinguen fuentes con
   colores, utilizar una convención accesible y consistente.
6. Implementar estados de carga, vacío, desconectado, configuración
   incompleta, error parcial y error total con acciones de recuperación claras.

**Puerta de salida**

- Pruebas de UI cubren filtros, selección de día, navegación mensual, puntos y
  estados con datos simulados del servicio.
- La UI es usable en móvil y escritorio y conserva mes/día al cambiar filtro.

### Paso 6 — Añadir creación, edición y borrado

**Prerrequisitos:** Paso 5 terminado y endpoints de mutación seguros probados.

1. Implementar formularios accesibles de título, inicio/fin, día completo, zona
   horaria, repetición y recordatorio. Validar título, fechas, fin posterior al
   inicio y restricciones conocidas de Google.
2. Con **Ambos**, exigir destino Personal o Compartido. Con un filtro específico,
   preseleccionar solo esa fuente si está conectada y tiene permiso de
   escritura; si no, explicar el bloqueo.
3. Editar solo los campos administrados por Haven. Usar actualización parcial
   para preservar descripción, ubicación, asistentes y demás campos no
   gestionados.
4. Usar ETag/versión si está disponible. Ante conflicto, recargar y ofrecer
   reintento; nunca sobrescribir cambios externos silenciosamente.
5. Para recurrencias, permitir solo ámbitos implementados y probados
   (ocurrencia, ocurrencias futuras, serie). Pedir elección explícita cuando
   corresponda; no inferir el ámbito ni degradar a edición de serie.
6. Antes de borrar un evento compartido, confirmar que se eliminará en Google y
   dejará de estar disponible para otros usuarios del calendario.
7. Tras éxito, refrescar el rango afectado sin perder fecha/filtro. Ante error,
   preservar el formulario y comunicar el motivo.

**Puerta de salida**

- Pruebas cubren destino correcto, validación, preservación de campos,
  conflictos, ocurrencias recurrentes y confirmación de borrado compartido.
- Crear/editar/borrar se verifica en Google con cuentas de prueba.

### Paso 7 — Integrar Home

**Prerrequisitos:** Paso 4 y lectura de Agenda terminados.

1. Sustituir los eventos hardcodeados de `home.page.ts` por el servicio
   compartido, conservando el contrato visual de la tarjeta cuando sea posible.
2. Mostrar siempre eventos Personal y Compartido, independientemente del filtro
   de Agenda. Respetar el rango que utiliza actualmente la tarjeta.
3. Adaptar día completo, hora local, origen e identidad compuesta
   `(calendarId, eventId)`; no usar `eventId` como identificador global.
4. Hacer que la acción de crear abra Agenda en la fecha apropiada; nunca crear
   un evento sin destino explícito.
5. Representar por separado carga, error total/parcial, conexión ausente y
   lista vacía.

**Puerta de salida**

- Home usa el servicio compartido, muestra ambos orígenes y conserva el
  comportamiento existente salvo cambios documentados.
- Pruebas verifican orden, día completo, fuentes y error parcial.

### Paso 8 — Regresión y preparación de publicación

**Prerrequisitos:** pasos anteriores terminados y entorno/cuentas de prueba
disponibles.

1. Completar la matriz de [Verificación](#verificación) y corregir regresiones
   relacionadas con esta integración.
2. Probar navegador y Android, incluyendo OAuth con app terminada/suspendida,
   cancelación, callback inválido y recuperación de conexión.
3. Verificar con dos usuarios Haven y dos cuentas Google el aislamiento de
   conexiones y el acceso al calendario compartido.
4. Revisar scopes, consentimiento/verificación, cuotas, URLs por entorno,
   privacidad, retención y revocación antes de publicar.
5. Ejecutar comandos finales y registrar resultados exactos. No usar cuentas
   personales ni OAuth real en CI.

**Puerta de salida**

- Pruebas automatizadas y manuales relevantes completadas.
- Bloqueos externos restantes tienen responsable y pasos de resolución.
- Build, lint y typecheck terminan correctamente, o los fallos preexistentes
  quedan identificados explícitamente y no se reportan como éxito.

## Decisiones de implementación pendientes

Las siguientes decisiones de bajo nivel no cambian el alcance acordado. Usar
estos valores por defecto si no existe un patrón o requisito mejor documentado:

1. **Filtro inicial:** `Ambos`.
2. **Fecha inicial:** hoy en la zona horaria local del dispositivo.
3. **Creación con recurrencia:** usar el modelo recurrente de Google; al editar
   una recurrencia, ofrecer “esta ocurrencia”, “esta y las siguientes” y “toda
   la serie” solo si el endpoint/SDK seleccionado soporta correctamente los
   tres casos. Si no, bloquear acciones no soportadas en vez de aplicar un
   cambio ambiguo.
4. **Recordatorios:** configurar y editar recordatorios Google compatibles;
   no duplicarlos con notificaciones locales de Capacitor en esta fase.
5. **Zona horaria:** el mes, el día seleccionado y la agenda se calculan en la
   zona local del dispositivo. Mostrar eventos con hora en esa zona, pero
   conservar la zona original del evento al editar/guardar. Los eventos de día
   completo son fechas civiles con fin exclusivo, no instantes convertidos por
   UTC. Probar cambios de horario de verano y eventos que cruzan medianoche.
6. **Cambios externos:** se reflejan al volver a abrir/recargar manualmente; no
   mantener un stream o sincronización en segundo plano.
7. **Offline:** no permitir escrituras offline ni mostrar datos caducados como
   actuales. Se puede conservar brevemente la última respuesta en memoria para
   navegación, siempre indicando cuándo la carga falla y sin afirmar que sea
   fresca.
8. **Desconexión de Google:** solo elimina/desautoriza la conexión, no eventos
   Google ni la cuenta de Haven.
9. **Diseño:** aproximar la muestra dentro de los estilos/tokens actuales;
   evitar fijar el calendario al mes de octubre de 2025, colores decorativos o
   contadores sin definición funcional.

## Verificación

### Pruebas unitarias

- Servicio: conexión desconectada/conectada, error de red, permiso revocado,
  falta de acceso a calendario compartido, cuota y respuestas inesperadas.
- OAuth: callback válido, `state` incorrecto, cancelación, callback duplicado y
  fallo de intercambio/renovación.
- Eventos: paginación, rango mensual, cruces de medianoche, día completo,
  recurrencias/excepciones, zonas horarias, orden, solapamientos, duplicados por
  calendario y conflicto de versión.
- Mutaciones: alta/edición/borrado en el destino correcto; campos no gestionados
  preservados; confirmación para borrado compartido.
- Agenda: pestañas filtran calendario, cambian puntos/eventos, mantienen
  selección de fecha/mes; mes anterior/siguiente; días sin eventos; carga/error;
  validación de formulario y refresco.
- Home: muestra ambos orígenes, conserva el comportamiento de hoy/próximos y
  representa correctamente día completo y error de carga.
- Seguridad backend: identidad Haven obligatoria, conexión aislada por usuario,
  acceso de workspace validado y calendario no autorizado rechazado.

### Pruebas de integración/manuales

Con dos usuarios Haven del mismo workspace y dos cuentas Google de prueba con
acceso al mismo calendario compartido:

1. Conectar cada cuenta Google en navegador y Android; cerrar/reabrir la app y
   verificar que no hay login repetido mientras la autorización siga vigente.
2. Verificar los tres filtros, calendario mensual y agenda del día.
3. Crear, editar y borrar un evento personal; verificarlo en Google.
4. Crear, editar y borrar un evento compartido; verificarlo en Google y en la
   cuenta/instalación del segundo usuario tras refrescar.
5. Cambiar un evento directamente en Google; verificar que Haven lo refleja al
   refrescar.
6. Verificar que un usuario sin acceso Google al calendario compartido recibe un
   estado de error/acción correctiva y no ve una lista vacía engañosa.
7. Revocar autorización desde Google, desconectar desde Ajustes, cancelar OAuth,
   perder red durante carga/escritura y probar recuperación.
8. Comprobar retorno OAuth en web y Android, incluyendo proceso detenido,
   app suspendida y callback inválido.
9. Verificar que cerrar sesión de Haven no expone ni conserva una conexión
   inaccesible, y que desconectar Google no cierra sesión de Haven.

### Comandos del proyecto

Usar scripts definidos en `package.json`; como mínimo, ejecutar:

```text
npm run test:unit
npm run typecheck:e2e
npm run lint
npm run build
```

En el `package.json` actual, `typecheck:e2e` comprueba el proyecto E2E y no es
un typecheck completo de Angular. `npm run lint` incluye ESLint,
`typecheck:e2e` y la comprobación de formato configurada; `npm run build`
verifica la compilación Angular. Reportar cada comando y su resultado por
separado.

Añadir/ejecutar pruebas E2E solo cuando la integración de UI o el entorno OAuth
de prueba estén preparados; no iniciar OAuth real contra cuentas personales en
CI.

## Criterios de aceptación

- La vista Agenda sigue la composición acordada y funciona en web y Android.
- Las pestañas **Personal**, **Compartido** y **Ambos** aplican exactamente los
  filtros definidos; Home siempre agrega personal y compartido.
- Dos usuarios Haven pueden conectar cuentas Google distintas y ver/gestionar
  el mismo calendario compartido cuando Google concede acceso a ambas cuentas.
- Crear, editar y borrar en Haven actualiza Google. Al refrescar aparecen
  cambios externos. Los conflictos no se resuelven sobrescribiendo a ciegas.
- Incluye hora, zona horaria, día completo, recurrencias y recordatorios de
  Google; no incluye asistentes/respuestas.
- Conectar/desconectar Google en Ajustes no altera el inicio/cierre de sesión
  Haven. El consentimiento no se solicita repetidamente sin necesidad mientras
  la autorización siga válida.
- Tokens de renovación y secretos OAuth permanecen fuera del cliente; cada
  acción backend valida identidad, workspace, conexión y calendario destino.
- La configuración incompleta, permiso revocado, errores y estados vacíos se
  distinguen claramente.
- Las pruebas de Calendar ya prueban `CalendarPage`; los eventos hardcodeados de
  Home dejan de ser la fuente funcional.
- Lint, typecheck, build y pruebas relevantes terminan sin errores.

## Fuera del alcance de la primera versión

- Login de Haven mediante Google.
- Sincronización en segundo plano, push, notificaciones de cambios o resolución
  automática continua entre Google y una base de datos propia.
- Copia persistente de todos los datos de Google Calendar en Haven.
- Gestión de invitados, respuestas, videoconferencias o permisos de Google.
- Calendarios propios secundarios arbitrarios: el filtro Personal representa el
  calendario principal; el filtro Compartido representa el calendario
  configurado para el workspace.
- Calendarios/fechas especiales propios de Haven.
- Acceso offline o escrituras pendientes de sincronización.
- iOS en la primera entrega.
