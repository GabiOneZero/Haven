# Plan de implementación: Organizar → Listas

## Contexto actual

Ya hay una ruta para Organizar y una vista que todavía es un cascarón en `src/app/views/organize/page/organize.page.ts`. La tarjeta de compra de Home todavía muestra un resumen fijo y no navega en `src/app/views/home/components/shopping-card/shopping-card.component.html`. La navegación existente está definida en `src/app/shared/navbar/navbar.routes.ts`.

El servicio de Supabase existente está en `src/app/shared/services/supabase.service.ts`. El código ya consulta el workspace compartido —por ejemplo, en `src/app/shared/services/mood.service.ts`—, pero las migraciones del repositorio no parecen incluir el esquema base de workspaces y membresías.

## Decisiones acordadas

- Organizar muestra las pestañas **Tareas / Listas / Notas**; Listas es la activa y funcional. Tareas y Notas quedan deshabilitadas con «Próximamente».
- Las dos listas iniciales son **Compra** e **Ideas para el viaje**. Se muestran en un grid adaptable, sin scroll horizontal.
- Las listas admiten crear, renombrar y eliminar. **Compra** es la lista predeterminada de Home y no se puede renombrar ni eliminar.
- Los elementos admiten añadir, editar, marcar/desmarcar y eliminar. Los completados siguen visibles y se muestra el contador.
- El carrito permite eliminar los completados con confirmación; «no mostrar de nuevo» se guarda en el dispositivo.
- Ambas listas y sus elementos se sincronizan entre los miembros del workspace. También se permiten cambios offline, que se encolan y sincronizan al reconectar.
- Los conflictos sobre un mismo elemento siguen la política **última operación aceptada por el servidor gana**.
- Datos iniciales:
  - **Compra**: «Mantequila Lorenzana» (escritura indicada por el usuario) y «pavo».
  - **Ideas para el viaje**: tres ejemplos, por ejemplo «Sitios que visitar», «Restaurantes por probar» y «Qué llevar».

## Fases de trabajo

### 1. Verificar las convenciones existentes

- Confirmar en Supabase las tablas `workspaces` y `workspace_members`, las políticas/helper de membresía y cualquier mecanismo de almacenamiento local reutilizable.
- No duplicar la infraestructura de workspace ni acoplar la lógica de listas a `MoodService`.
- Revisar el estado inicial de la base de datos configurada y comprobar si hay migraciones previas fuera del repositorio.

### 2. Añadir el modelo y migración de Supabase

- Crear tablas de listas y elementos, con UUID, workspace, orden estable, autor y timestamps.
- Los elementos también deben tener estado de completado y borrado. Usar claves foráneas e integridad que impidan asociar un elemento a una lista de otro workspace.
- Añadir índices, `updated_at` gestionado por el servidor y políticas RLS que permitan leer y modificar solo datos del workspace del usuario autenticado.
- Configurar Supabase Realtime para ambas tablas.
- La lista predeterminada Compra debe tener una identidad estable y estar protegida también en la capa de datos, no solo en la interfaz.
- Sembrar Compra e Ideas para el viaje —incluidos los ejemplos acordados— **una sola vez por workspace**, de forma atómica e idempotente para evitar duplicados si ambos usuarios entran a la vez.
- Renombrar o eliminar Ideas para el viaje no debe hacer que reaparezca al recargar.

### 3. Implementar un servicio compartido de listas

- Añadir un servicio tipado para:
  - Resolver el workspace actual.
  - Obtener listas y elementos.
  - Crear, renombrar y eliminar listas.
  - Añadir, editar, completar/descompletar y eliminar elementos.
  - Calcular el resumen de Compra.
  - Gestionar la suscripción Realtime y su ciclo de vida.
- Mantener la lógica de dominio en el servicio para que Organizar y Home usen la misma fuente de datos.
- Gestionar explícitamente estados de carga, error y reconexión.

### 4. Resolver el uso offline

- Usar IndexedDB —o el mecanismo local equivalente si ya existe— para conservar datos y encolar operaciones sin conexión, sin incorporar una dependencia nueva innecesaria.
- Asignar IDs estables a las operaciones para que puedan reintentarse sin duplicar registros.
- Aplicar los cambios remotos sin sobrescribir mutaciones que todavía estén pendientes localmente y reconciliar los datos al reconectar.
- Para que los borrados offline no hagan reaparecer elementos en otros dispositivos, la eliminación se presenta como permanente en la interfaz pero se sincroniza mediante un tombstone (`deleted_at`) hasta que sea seguro purgarla.
- **Límite de conflicto:** el servidor no puede conocer el orden real de dos cambios realizados offline; «último gana» se refiere al orden en que acepta las operaciones al sincronizar.

### 5. Construir la interfaz de Organizar

- Completar `src/app/views/organize/page/organize.page.html` y sus estilos tomando la captura como referencia:
  - Fondo oscuro y selector superior segmentado.
  - Lista clara con esquinas redondeadas.
  - Checkboxes y elementos completados tachados.
  - Entrada para añadir elementos.
- Reemplazar las chips desplazables por una cuadrícula adaptable de listas, sin scroll horizontal.
- Mostrar Tareas y Notas deshabilitadas con «Próximamente».
- Añadir estados vacíos, feedback de guardado/sincronización, errores y controles accesibles para las pestañas deshabilitadas y las acciones de cada elemento.
- Mantener el orden estable de listas y elementos; no añadir reordenamiento manual salvo que se acuerde como alcance adicional.

### 6. Conectar la tarjeta de Home

- Actualizar `src/app/views/home/components/shopping-card/shopping-card.component.ts` y su plantilla para mostrar el resumen real de Compra, en lugar del texto fijo actual.
- Al tocarla, navegar a Organizar con **Listas → Compra** seleccionada.
- La navegación normal a Organizar también debe abrir Listas primero; la selección de otra lista puede conservarse mientras dure la sesión.
- El resumen de Home se actualiza al recibir cambios Realtime, al sincronizar operaciones offline y al refrescar los datos.

### 7. Añadir pruebas enfocadas y validar

- Cubrir el servicio y las interacciones principales:
  - Carga de listas y contadores.
  - Crear/editar/marcar elementos.
  - Protección de la lista Compra.
  - Limpieza de elementos completados.
  - Encolado y reconciliación de cambios offline.
  - Recepción de cambios Realtime.
  - Actualización del resumen de Home y navegación desde la tarjeta.
- Añadir pruebas de UI para selección, formularios, estados vacíos/error y navegación.
- Validar con pruebas unitarias dirigidas, build y lint del proyecto.

## Criterios de aceptación

- Los dos usuarios del workspace ven y modifican las mismas listas; sus cambios conectados aparecen en el otro dispositivo sin refresco manual.
- Sin conexión, las listas cargadas siguen disponibles, los cambios se encolan y se sincronizan al reconectar.
- Compra siempre existe y Home muestra su resumen actualizado; tocar la tarjeta abre esa lista.
- No hay scroll horizontal en el selector de listas.
- Los completados se pueden limpiar con la confirmación acordada y no reaparecen al sincronizar.
- Los cambios respetan RLS y los errores se muestran sin presentar fallos como si fueran operaciones exitosas.
