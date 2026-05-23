# CartoLogger-Mobile

Una aplicación móvil para crear, editar y gestionar mapas interactivos con características geográficas personalizables.

## 📱 Descripción

CartoLogger-Mobile permite a los usuarios dibujar y gestionar mapas de forma intuitiva. La aplicación ofrece herramientas para crear elementos geográficos como marcadores, líneas y polígonos, asociándoles metadatos y búsqueda de lugares integrada.

### Funcionalidades Principales

- **Gestión de Mapas**: Crear, editar, visualizar y eliminar mapas
- **Dibujo de Características**: Marcar ubicaciones, trazo de líneas y creación de polígonos
- **Búsqueda de Lugares**: Integración con Nominatim para buscar direcciones y ubicaciones
- **Metadatos**: Agregar descripciones e imágenes a cada característica
- **Navegación**: Acceso directo a ubicaciones mediante Google Maps
- **Exportación**: Guardar mapas en formato JSON
- **Persistencia Local**: Almacenamiento en SQLite sin conexión requerida
- **Tema Personalizable**: Modo claro y oscuro
- **Ajustes de Mapas**: Pantalla para editar la región, capas y opciones de visualización
- **Rutas tipadas y navegación**: Navegación organizada mediante Expo Router con soporte de rutas tipadas
- **Componentes reutilizables**: Modales, burbujas y elementos del mapa para construir la interfaz
- **Hooks y contexto**: Gestión de estado y persistencia mediante hooks y un contexto global de tema

## 🛠️ Tecnologías

- **Framework**: React Native con Expo 54
- **Lenguaje**: TypeScript 5.9.2
- **UI**: React Native Paper (Material Design 3)
- **Mapas**: react-native-maps
- **Base de Datos**: SQLite (expo-sqlite)
- **Navegación**: Expo Router
- **Ubicación**: expo-location
- **Animaciones**: react-native-reanimated

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js instalado
- npm o yarn
- Expo CLI

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd pia

# Instalar dependencias
npm install

# Iniciar la aplicación en el emulador
npm start
```

### Comandos Disponibles

```bash
npm start              # Iniciar servidor de desarrollo
npm run android        # Compilar para Android
npm run ios            # Compilar para iOS
npm run web            # Ejecutar en navegador
npm run lint           # Validar código TypeScript
```

## 📁 Estructura del Proyecto

```
app/                   # Rutas y pantallas de la aplicación
├── (home)/            # Pantalla principal y configuración
└── (map)/             # Editor de mapas

components/            # Componentes reutilizables
context/              # Contexto global (tema)
hooks/                # Custom hooks
storage/              # Capa de base de datos SQLite
assets/               # Recursos (imágenes, fuentes)
styles/               # Estilos por componente
```

## 💾 Base de Datos

La aplicación utiliza SQLite para almacenamiento local con las siguientes tablas:

- **maps**: Información de mapas (nombre, descripción, región)
- **map_data**: Características geográficas (marcadores, líneas, polígonos)
- **settings**: Configuración de usuario (tema)

## 📍 Permisos

La aplicación requiere los siguientes permisos:

- **Ubicación**: Para obtener la posición actual del usuario
- **Cámara y Galería**: Para capturar o seleccionar imágenes en las características

## 📝 Notas Técnicas

- Implementado con TypeScript en modo strict para mayor seguridad de tipos
- Arquitectura modular con separación de responsabilidades
- Integración de servicios externos (Nominatim, Google Maps)
- Transacciones atómicas en base de datos para integridad de datos
