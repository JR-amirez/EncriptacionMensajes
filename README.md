# CriptoMensajes

Juego educativo de encriptación y desencriptación de mensajes utilizando cifrados clásicos (César, Atbash y Vigenère). Desarrollado con **Ionic React** y empaquetado para **Android** mediante **Capacitor**.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) (v18 o superior)
- npm (incluido con Node.js)
- PowerShell (disponible por defecto en Windows)

> **Nota:** No se requiere Android Studio ni el SDK de Android para generar el ZIP base. Estos solo son necesarios si se desea compilar el APK final.

---

## Archivo de configuración

La aplicación carga su configuración en tiempo de ejecución desde el archivo:

```
public/config/encriptacion-config.json
```

Este archivo **se elimina automáticamente** del build de Android durante el proceso de limpieza (`clean:assets`), ya que está pensado para que cada usuario lo cree manualmente con sus propios datos antes de compilar el APK.

### Crear el archivo de configuración

1. Navegar a la carpeta `public/config/`.
2. Crear un archivo llamado `encriptacion-config.json`.
3. Copiar y adaptar la siguiente estructura:

```json
{
  "nivel": "basico",
  "version": "1.0",
  "fecha": "2025-12-02",
  "descripcion": "Juego de encriptación y desencriptación de mensajes usando cifrados clásicos",
  "nombreApp": "CriptoMensajes",
  "plataformas": ["android"]
}
```

> Tambien se incluye un archivo de ejemplo en `public/config/encriptacion-config-example.json` con la estructura lista para usar.

### Opciones disponibles

| Propiedad      | Tipo       | Requerido | Descripcion                                                             |
| -------------- | ---------- | --------- | ----------------------------------------------------------------------- |
| `nivel`        | `string`   | No        | Nivel de dificultad inicial. Valores: `"basico"`, `"intermedio"`, `"avanzado"` |
| `version`      | `string`   | No        | Version de la aplicación (ej. `"1.0"`, `"2.3"`)                        |
| `fecha`        | `string`   | No        | Fecha de creación en formato ISO (`"YYYY-MM-DD"`)                      |
| `descripcion`  | `string`   | No        | Descripcion breve del juego mostrada en la pantalla de inicio          |
| `nombreApp`    | `string`   | No        | Nombre personalizado de la aplicación (por defecto: `"STEAM-G"`)       |
| `plataformas`  | `string[]` | No        | Plataformas soportadas (ej. `["android"]`, `["android", "web"]`)       |

Todas las propiedades son opcionales. Si el archivo no existe o alguna propiedad no se incluye, la aplicación usa valores por defecto.

### Niveles de dificultad

| Nivel          | Cifrado utilizado | Ejercicios | Puntos por acierto | Tiempo (seg) |
| -------------- | ----------------- | ---------- | ------------------- | ------------ |
| `basico`       | César             | 8          | 10                  | 120          |
| `intermedio`   | Atbash            | 6          | 15                  | 150          |
| `avanzado`     | Vigenère          | 5          | 20                  | 180          |

---

## Build (generar el ZIP)

El comando principal para construir el proyecto completo es:

```bash
npm run build
```

Este comando ejecuta la siguiente secuencia de pasos en orden:

### 1. `build:web` — Compilación web

```bash
npm run build:web
```

Compila el proyecto Ionic/React con Vite. Transpila TypeScript, empaqueta los módulos, minifica el código y genera los assets estáticos en la carpeta `dist/`.

### 2. `build:android` — Agregar plataforma Android

```bash
npm run build:android
```

Si la carpeta `android/` no existe, ejecuta `npx cap add android` para crear el proyecto nativo de Android con Capacitor.

### 3. `build:android:sync` — Sincronizar con Android

```bash
npm run build:android:sync
```

Copia el contenido de `dist/` hacia `android/app/src/main/assets/public/`, sincronizando la aplicación web con el proyecto Android.

### 4. `patch:capacitor` — Parchear Gradle

```bash
npm run patch:capacitor
```

Ejecuta el script `scripts/patch-capacitor-gradle.cjs` que modifica los archivos de Gradle para utilizar las dependencias de Capacitor desde Maven en lugar de proyectos locales. Esto permite que el proyecto compile sin necesidad de tener los módulos de Capacitor como subproyectos.

### 5. `clean:assets` — Limpieza de archivos innecesarios

```bash
npm run clean:assets
```

Elimina archivos y carpetas que no son necesarios para el proyecto base, reduciendo significativamente el tamaño del ZIP final. Se eliminan:

**Cache y artefactos de compilación:**
- `android/.gradle/` — Cache de Gradle
- `android/app/build/` — Artefactos de compilación de la app
- `android/build/` — Artefactos de compilación raíz
- `android/capacitor-cordova-android-plugins/build/` — Build de plugins

**Metadatos del IDE:**
- `android/.idea/` — Archivos de configuración de Android Studio (caches, libraries, modules, XMLs de configuración)

**Archivos locales:**
- `android/local.properties` — Rutas locales del SDK (específicas de cada máquina)

**Tests de Android:**
- `android/app/src/androidTest/` — Tests instrumentados
- `android/app/src/test/` — Tests unitarios

**Archivos de configuración de la app:**
- `android/app/src/main/assets/public/config/encriptacion-config.json`
- `android/app/src/main/assets/public/config/encriptacion-config-example.json`

> Los archivos de configuración se eliminan para que el ZIP distribuible sea genérico. Cada usuario debe crear su propio `encriptacion-config.json` antes de compilar el APK.

### 6. `zip:android` — Generar ZIP

```bash
npm run zip:android
```

Comprime la carpeta `android/` en el archivo `android-base.zip` usando PowerShell. Este ZIP contiene el proyecto Android listo para abrir en Android Studio, agregar la configuración personalizada y compilar el APK.

---

## Flujo completo resumido

```
npm run build
    |
    ├── build:web              → Compila React/Ionic → dist/
    ├── build:android          → Crea android/ si no existe
    ├── build:android:sync     → Copia dist/ → android/assets/
    ├── patch:capacitor        → Parchea Gradle para Maven
    ├── clean:assets           → Elimina archivos innecesarios
    └── zip:android            → Genera android-base.zip
```
