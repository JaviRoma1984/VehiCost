# Manual de usuario — VehiCost

VehiCost es una aplicación web (PWA) para controlar todos los gastos de tus vehículos: repostajes, consumo, seguro, ITV, IVTM, mantenimientos, financiación, renting y leasing. Funciona en el navegador de tu ordenador o smartphone y también se puede instalar como una app normal.

Todos los datos se guardan **únicamente en el dispositivo/navegador donde los introduces** (no hay servidor ni cuenta de usuario). Esto significa que:
- Los datos no se sincronizan entre distintos dispositivos ni navegadores.
- Si cambias de navegador (por ejemplo de Chrome a Brave) o borras los datos de navegación, perderás la información guardada.
- No es necesario estar conectado a internet para usar la app una vez cargada la primera vez.

---

## 1. Instalación

### Android
1. Abre la web de VehiCost en Chrome (o el navegador que uses).
2. Pulsa el botón **⬇ Instalar** que aparece en la cabecera (si el navegador no lo ofrece automáticamente, usa el menú del navegador → "Añadir a pantalla de inicio").
3. La app quedará instalada como una aplicación normal, con su propio icono.

### iPhone / iPad
1. Abre la web en Safari (obligatorio, Chrome en iOS no permite instalar PWAs).
2. Pulsa el botón de compartir (el cuadrado con la flecha hacia arriba).
3. Selecciona **"Añadir a pantalla de inicio"**.

### Ordenador (Windows/Mac)
1. Abre la web en Chrome o Edge.
2. Pulsa el botón **⬇ Instalar** en la cabecera, o el icono de instalación que aparece en la barra de direcciones.

---

## 2. Primeros pasos: elegir o crear un vehículo

Al abrir la app verás un desplegable **VEHÍCULO** en la pantalla principal.

- Si es la primera vez, la app trae 3 vehículos de ejemplo precargados para que puedas probarla.
- Para gestionar tus propios vehículos, pulsa el icono de menú **☰** (arriba a la derecha):
  - **➕ Crear vehículo**: abre un formulario con nombre, matrícula, marca, modelo, tipo de vehículo (🚗 Coche, 🏍️ Motocicleta, 🛺 Quad, 🚐 Furgoneta, 🚌 Autocaravana o 🚛 Camión), año, tipo de combustible y una descripción opcional. Pulsa **💾 Guardar** para darlo de alta.
  - **📋 Listar vehículos**: muestra todos tus vehículos, con botones para ✏️ editarlos o 🗑️ borrarlos (borrar un vehículo también borra todos sus repostajes).

En el desplegable, cada vehículo aparece como el icono de su tipo + nombre + matrícula (por ejemplo "🚗 Sedán Familiar - 1234ABC"); el tipo no se repite en texto porque ya lo indica el icono.

El desplegable recuerda el último vehículo consultado y lo vuelve a seleccionar automáticamente la próxima vez que abras la app.

---

## 3. Repostajes

Con un vehículo seleccionado, aparece un panel con:

- **⛽ Nuevo repostaje**: formulario para registrar km actuales, litros repostados, tipo de combustible, precio por litro (el coste total se calcula solo) y fecha/hora. Pulsa **💾 Guardar datos**.
- **📋 Listar repostajes**: histórico de todos los repostajes del vehículo, con la fecha, litros, precio, importe y el consumo (L/100km) calculado respecto al repostaje anterior. El consumo se muestra en verde si ha mejorado (o es el primer dato) y en rojo si ha empeorado.

Debajo también verás:
- **Consumo medio mensual** y **Consumo medio total** (L/100km).
- **Gasto medio mensual** (€), calculado a partir del histórico de repostajes.

### 3.1. Ver, modificar o borrar un repostaje concreto

Al pulsar sobre cualquier repostaje del listado, se abre un panel con todos sus datos completos (fecha y hora, km, tipo de combustible, litros, precio por litro, coste total y consumo). Desde ahí puedes:

- **✏️ Modificar**: el panel pasa a modo edición con los mismos campos que al crear un repostaje (km, litros, combustible, precio, fecha y hora). Pulsa **💾 Guardar cambios** para actualizarlo.
- **🗑️ Borrar**: pide confirmación ("¿Seguro que quieres borrar este repostaje?"); si aceptas se borra definitivamente, si cancelas no ocurre nada.

Como en el resto de la app, el botón **"Volver"** (arriba a la derecha) descarta cualquier cambio no guardado y te devuelve al listado.

---

## 4. Otros gastos del vehículo

Pulsando **"Otros gastos del vehículo"** accedes al panel **Gastos generales**, donde puedes registrar:

| Campo | Dónde | Qué guarda |
|---|---|---|
| Gasto anual del seguro | Input directo | Importe anual del seguro |
| 🛂 ITV | Botón → panel propio | Cantidad, fecha de caducidad y avisos (ver más abajo) |
| IVTM anual (Viñeta) | Input directo | Importe anual del impuesto de circulación |
| Mantenimientos | Botón → menú propio | Gastos de mantenimiento (ver más abajo) |
| Financiación | Botón → panel propio | Cuota mensual de un préstamo/financiación y desde qué mes se paga |
| Renting | Botón → panel propio | Frecuencia (mensual/trimestral/anual), importe y mes de inicio |
| Leasing | Botón → panel propio | Igual que Renting |

Pulsa **💾 Guardar** en el panel de Gastos generales para guardar el seguro y la IVTM. Los sub-paneles (ITV, Mantenimientos, Financiación, Renting, Leasing) tienen cada uno su propio botón de guardado independiente.

> ⚠️ **Importante**: en todos estos paneles, el botón **"Volver"** descarta cualquier cambio no guardado y te devuelve a la pantalla anterior. Solo se guarda algo cuando pulsas expresamente el botón **💾 Guardar** de esa pantalla.

### 4.1. ITV
- Introduce la **cantidad** pagada (o a pagar) y la **fecha de caducidad** de la ITV (o la fecha de la primera ITV que te toque, si el vehículo aún no ha pasado ninguna).
- Puedes activar dos avisos independientes (con checkbox):
  - Aviso **1 mes antes** de la caducidad.
  - Aviso **15 días antes** de la caducidad.
- Cuando corresponda, verá un aviso en la pantalla principal (banner amarillo a partir de 30 días, rojo urgente a partir de 15 días o si ya ha caducado). Es un aviso **dentro de la app** (no es una notificación push del sistema), por lo que solo se muestra cuando abres VehiCost.

### 4.2. Mantenimientos
Desde el botón **Mantenimientos** se abre un menú con:
- **📋 Listar gastos**: ver todos los mantenimientos registrados (título, fecha e importe), con opción de ✏️ editar o 🗑️ borrar cada uno.
- **➕ Añadir**: formulario para dar de alta un nuevo gasto de mantenimiento (título del tipo de mantenimiento, por ejemplo "Cambio de aceite", y su importe).

### 4.3. Financiación, Renting y Leasing
- **Financiación**: cuota mensual fija + mes desde el que se está pagando.
- **Renting / Leasing**: importe + frecuencia de pago (mensual, trimestral o anual) + mes en que empezó a pagarse.

Estos tres gastos periódicos se contabilizan automáticamente en el total anual **solo por los pagos que realmente correspondan a ese año** según su frecuencia y mes de inicio (no se cuentan pagos futuros).

---

## 5. Gasto total anual acumulado

En la pantalla principal, debajo del botón "Otros gastos del vehículo", se muestra el **gasto total acumulado desde el 1 de enero hasta hoy** del vehículo seleccionado. Incluye:
- Todos los repostajes del año.
- Todos los mantenimientos del año.
- Seguro, IVTM e ITV (importe completo).
- Los pagos de financiación, renting y leasing que ya han vencido este año.

---

## 6. Tema claro / oscuro

El botón 🌙/☀️ de la cabecera cambia entre tema claro y oscuro. La preferencia se guarda y se mantiene la próxima vez que abras la app.

---

## 7. Preguntas frecuentes

**¿Puedo usar la app sin conexión?**
Sí, una vez cargada la primera vez, funciona sin internet gracias a que se instala como PWA.

**¿Mis datos se sincronizan entre mi móvil y mi ordenador?**
No. Cada dispositivo/navegador guarda sus propios datos de forma independiente.

**¿Cómo hago una copia de seguridad de mis datos?**
Actualmente no existe una función de exportar/importar datos; los datos residen solo en el almacenamiento local del navegador donde uses la app.

**Borré todos mis vehículos y volvieron a aparecer los de ejemplo, ¿por qué?**
Los vehículos de ejemplo solo se cargan automáticamente la primera vez que se usa la app en ese navegador, nunca más. Si los ves reaparecer no es un error de guardado, revisa que no estés en un navegador/perfil distinto.
