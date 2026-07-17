# VehiCost 🚐🚗🏍️€

Control de gastos de tus vehículos: repostajes y consumo, seguro, ITV, IVTM, mantenimientos, financiación, renting y leasing — todo en una Progressive Web App (PWA) instalable en Android, iPhone y ordenador.

Manual de uso completo: [MANUAL_USUARIO.md](MANUAL_USUARIO.md)

## Características

- Alta, edición y borrado de varios vehículos (coche, moto, quad, furgoneta, autocaravana, camión...).
- Registro de repostajes con cálculo automático de consumo (L/100km) y coste.
- Consulta, modificación y borrado individual de cada repostaje desde el listado.
- Consumo medio mensual/total y gasto medio mensual.
- Gastos generales por vehículo: seguro, ITV (con fecha de caducidad y avisos in-app a 1 mes y 15 días), IVTM, gastos de mantenimiento, financiación, renting y leasing.
- Gasto total anual acumulado, calculado automáticamente a partir de todos los gastos anteriores.
- Tema claro / oscuro.
- Instalable como app (PWA) con funcionamiento sin conexión.

## Tecnología

Aplicación 100% front-end: HTML, CSS y JavaScript vainilla, sin frameworks ni build step. Los datos se guardan en el `localStorage` del navegador (no requiere backend ni conexión a internet salvo la primera carga).

- `index.html` — estructura de la app.
- `styles.css` — estilos y temas (claro/oscuro).
- `app.js` — lógica de la aplicación.
- `manifest.json` / `service-worker.js` — configuración PWA (instalación y caché offline).
- `icons/` — iconos de la app.

## Uso en local

No requiere instalación de dependencias. Basta con servir la carpeta con cualquier servidor estático, por ejemplo:

```bash
npx http-server . -p 8900
```

Y abrir `http://localhost:8900` en el navegador.

## Despliegue

Al tratarse de una PWA estática, se puede publicar en cualquier hosting de archivos estáticos (por ejemplo GitHub Pages) subiendo el contenido de esta carpeta tal cual.

> ⚠️ Cada vez que subas cambios, incrementa el valor de `CACHE_NAME` en `service-worker.js`. Si no lo haces, los dispositivos que ya tengan la app instalada seguirán viendo la versión antigua por la caché offline.

## Aviso sobre los datos

Los datos se almacenan únicamente en el navegador/dispositivo donde se usa la app (no hay servidor ni cuenta de usuario), por lo que no se sincronizan entre distintos dispositivos o navegadores. Más detalles en el [manual de usuario](MANUAL_USUARIO.md).
