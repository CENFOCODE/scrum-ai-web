/**
 * 🌐 Environment de Desarrollo
 * --------------------------------------------------------
 * Aquí configurás las URLs base que usa el frontend
 * para comunicarse con el backend (Spring Boot).
 *
 * ⚠️ En DESARROLLO:
 *   - Usá el túnel ngrok HTTPS si querés compartir con tu equipo.
 *   - Usá localhost:8080 si solo estás probando en tu PC.
 *
 * 🔧 CAMBIAR / QUITAR EN PRODUCCIÓN:
 *   - Sustituir por el dominio oficial del backend.
 */

export const environment = {
  production: false,
  apiUrl: 'https://frore-paz-comprehensibly.ngrok-free.dev',
  wsUrl: 'wss://frore-paz-comprehensibly.ngrok-free.dev/webrtc'
};


/**
 * 🚀 Environment de Producción
 * --------------------------------------------------------
 * Esta configuración se usa al compilar con:
 *   ng build --configuration production
 * 
 * ⚠️ CAMBIAR con el dominio real del backend en la nube.
 */

    // export const environment = {
    //   production: true,
    //   apiUrl: 'https://api.scrumai.com', // 🔒 Dominio real futuro
    //   wsUrl: 'wss://api.scrumai.com/webrtc'
    // };

