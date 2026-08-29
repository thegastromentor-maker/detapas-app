# De Tapas con Chencho - App

Una Progressive Web App (PWA) para descubrir los mejores bares de tapas en Sevilla.

## Características

- 🗺️ **Mapa interactivo** con más de 678 establecimientos
- 🔍 **Buscador** por zona y categoría de comida
- 📰 **Último artículo** publicado en la web
- 📱 **Instalable** en pantalla de inicio (iOS y Android)
- 🔌 **Funciona offline** (con datos cacheados)
- 🔄 **Actualización automática** con nuevos bares y artículos

## Instalación

### En iPhone/iPad (Safari)
1. Abre esta app en Safari
2. Toca el botón "Compartir" (cuadro con flecha)
3. Desplázate y selecciona "Añadir a pantalla de inicio"
4. ¡Listo!

### En Android (Chrome)
1. Toca el menú (tres puntos) en la esquina superior derecha
2. Selecciona "Instalar app" o "Agregar a pantalla de inicio"
3. ¡Listo!

## Desarrollo Local

```bash
# No hay build necesario, solo necesitas un servidor web
python3 -m http.server 8000

# Luego abre http://localhost:8000 en tu navegador
```

## Deploy en GitHub Pages

```bash
# 1. Crear repo en GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/detapas-app.git
git branch -M main
git push -u origin main

# 2. Habilitar GitHub Pages
# En el repo → Settings → Pages
# Selecciona "Deploy from a branch" y elige "main"
```

## Archivos

- `index.html` - Estructura HTML principal
- `styles.css` - Estilos de la app
- `app.js` - Lógica principal (carga de datos, navegación, filtros)
- `service-worker.js` - Service Worker para funcionalidad offline
- `manifest.json` - Configuración de PWA

## Tecnologías

- HTML5
- CSS3
- Vanilla JavaScript
- Leaflet.js (mapas)
- Service Workers (offline)

## Datos

Los datos se obtienen directamente desde:
- https://www.detapasconchencho.es/mapa/

La app accede a los datos en tiempo real cada vez que se abre, garantizando que siempre tengas la información más actualizada.

## Licencia

Esta app es un proyecto no oficial basado en De Tapas con Chencho.
