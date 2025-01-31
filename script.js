// Variables globales para el seguimiento del mouse y estado del sistema
let mouseX = 0;        // Coordenada X actual del mouse
let mouseY = 0;        // Coordenada Y actual del mouse
let lastClick = 'Ningún clic registrado';  // Última posición de clic registrada
let batteryStatus = 'No disponible';  // Estado actual de la batería

// Objeto de etiquetas para la interfaz de usuario
// Mapea las claves de datos a sus nombres legibles en español
const labels = {
    // Browser labels
    browser: 'Navegador',
    userAgent: 'User Agent',
    cookiesEnabled: 'Cookies Habilitadas',
    onlineStatus: 'Estado de Conexión',
    vendor: 'Proveedor',

    // System labels
    os: 'Sistema Operativo',
    deviceType: 'Tipo de Dispositivo',
    timezone: 'Zona Horaria',
    language: 'Idioma',
    cores: 'Núcleos CPU',
    memoria: 'Memoria RAM',
    bateria: 'Estado de Batería',
    gpu: 'Tarjeta Gráfica',
    'preferencias.reduccionMovimiento': 'Prefiere Reducir Movimiento',
    'preferencias.modoOscuro': 'Prefiere Modo Oscuro',
    'preferencias.contrasteAlto': 'Prefiere Alto Contraste',

    // Screen labels
    screenResolution: 'Resolución de Pantalla',
    colorDepth: 'Profundidad de Color',
    windowSize: 'Tamaño de Ventana',
    touchScreen: 'Pantalla Táctil',
    pixelRatio: 'Ratio de Píxeles',
    numScreens: 'Número de Pantallas',
    orientation: 'Orientación',
    screenAvailable: 'Área Disponible',
    maxTouchPoints: 'Puntos Táctiles Máximos',
    fullscreenSupported: 'Soporta Pantalla Completa',

    // Mouse labels
    posicionX: 'Posición X',
    posicionY: 'Posición Y',
    ultimoClick: 'Último Click',

    // Network labels
    ip: 'Dirección IP',
    conexion: 'Tipo de Conexión',
    velocidad: 'Velocidad de Descarga'
};

/**
 * Genera el HTML para mostrar una sección de información
 * @param {Object} data - Objeto con los datos a mostrar
 * @param {Object} labels - Objeto con las etiquetas para cada dato
 * @returns {string} HTML generado con los datos formateados
 */
function createSectionHTML(data, labels) {
    return Object.entries(data)
        .map(([key, value]) => {
            if (typeof value === 'object') {
                return Object.entries(value)
                    .map(([subKey, subValue]) => {
                        const label = labels[`${key}.${subKey}`] || subKey;
                        return `<div class="info-item">
                            <span class="info-label">${label}:</span>
                            <span class="info-value">${subValue}</span>
                        </div>`;
                    })
                    .join('');
            } else {
                const label = labels[key] || key;
                return `<div class="info-item">
                    <span class="info-label">${label}:</span>
                    <span class="info-value">${value}</span>
                </div>`;
            }
        })
        .join('');
}

/**
 * Recopila toda la información del visitante
 * Incluye datos del navegador, sistema, pantalla, mouse y red
 * @returns {Object} Objeto con todas las categorías de información
 */
function getVisitorInfo() {
    /**
     * Detecta el navegador actual basado en el User Agent
     * @returns {string} Nombre del navegador detectado
     */
    const browserInfo = (function() {
        const ua = navigator.userAgent;
        let browser = "Desconocido";
        if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Safari")) browser = "Safari";
        else if (ua.includes("Edge")) browser = "Edge";
        else if (ua.includes("Opera")) browser = "Opera";
        return browser;
    })();

    /**
     * Detecta el sistema operativo del usuario
     * Primero intenta usar la API moderna userAgentData
     * Si no está disponible, usa el análisis del User Agent
     * @returns {string} Nombre del sistema operativo detectado
     */
    const getOperatingSystem = () => {
        const userAgent = navigator.userAgent;
        if (navigator.userAgentData?.platform) {
            return navigator.userAgentData.platform;
        } else if (userAgent.indexOf("Win") !== -1) {
            return "Windows";
        } else if (userAgent.indexOf("Mac") !== -1) {
            return "MacOS";
        } else if (userAgent.indexOf("Linux") !== -1) {
            return "Linux";
        } else if (userAgent.indexOf("Android") !== -1) {
            return "Android";
        } else if (userAgent.indexOf("iOS") !== -1) {
            return "iOS";
        }
        return "Sistema Operativo Desconocido";
    };

    // Datos del navegador
    const browserData = {
        browser: browserInfo,
        userAgent: navigator.userAgent,
        cookiesEnabled: navigator.cookieEnabled ? 'Sí' : 'No',
        onlineStatus: navigator.onLine ? 'Conectado' : 'Desconectado',
        vendor: navigator.vendor || 'No disponible'
    };

    // Datos del sistema
    const systemData = {
        os: getOperatingSystem(),
        deviceType: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Móvil' : 'Escritorio',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language || navigator.userLanguage,
        cores: navigator.hardwareConcurrency || 'No disponible',
        memoria: navigator.deviceMemory ? navigator.deviceMemory + 'GB' : 'No disponible',
        bateria: batteryStatus,  // Usar el estado global de la batería
        gpu: 'No disponible',
        preferencias: {
            reduccionMovimiento: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Sí' : 'No',
            modoOscuro: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Sí' : 'No',
            contrasteAlto: window.matchMedia('(prefers-contrast: high)').matches ? 'Sí' : 'No'
        }
    };

    // Obtener información de la GPU
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        systemData.gpu = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'No disponible';
    }

    // Datos de pantalla
    const screenData = {
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        colorDepth: window.screen.colorDepth + ' bits',
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        touchScreen: 'ontouchstart' in window ? 'Sí' : 'No',
        pixelRatio: window.devicePixelRatio.toFixed(2) + 'x',
        numScreens: window.screen.availWidth < window.screen.width ? '2 o más' : '1',
        orientation: screen.orientation ? screen.orientation.type : 'No disponible',
        screenAvailable: `${window.screen.availWidth}x${window.screen.availHeight}`,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        fullscreenSupported: document.fullscreenEnabled ? 'Sí' : 'No'
    };

    // Datos del mouse
    const mouseData = {
        posicionX: mouseX,
        posicionY: mouseY,
        ultimoClick: lastClick
    };

    // Datos de red
    const networkData = {
        ip: '192.168.1.1', // Placeholder IP
        conexion: navigator.connection ? 
            navigator.connection.effectiveType || 'No disponible' : 
            'No disponible',
        velocidad: navigator.connection ? 
            (navigator.connection.downlink ? navigator.connection.downlink + ' Mbps' : 'No disponible') : 
            'No disponible'
    };

    return {
        browserData,
        systemData,
        screenData,
        mouseData,
        networkData
    };
}

/**
 * Gestiona la información de la batería del dispositivo
 * Utiliza la API getBattery para obtener y monitorear el estado
 * Actualiza la interfaz cuando hay cambios en la batería
 * @async
 */
async function updateBatteryInfo() {
    try {
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            
            // Función para actualizar el estado de la batería
            const updateStatus = () => {
                batteryStatus = `${(battery.level * 100).toFixed(0)}% - ${battery.charging ? 'Cargando' : 'No cargando'}`;
                const systemSection = document.getElementById('systemData');
                if (systemSection) {
                    const data = getVisitorInfo();
                    systemSection.innerHTML = createSectionHTML(data.systemData, labels);
                }
            };

            // Actualización inicial
            updateStatus();

            // Configurar listeners para cambios en la batería
            battery.addEventListener('levelchange', updateStatus);
            battery.addEventListener('chargingchange', updateStatus);
        }
    } catch (error) {
        console.log('Error al obtener información de la batería:', error);
        batteryStatus = 'No disponible';
        const systemSection = document.getElementById('systemData');
        if (systemSection) {
            const data = getVisitorInfo();
            systemSection.innerHTML = createSectionHTML(data.systemData, labels);
        }
    }
}

/**
 * Muestra toda la información del visitante en la interfaz
 * Actualiza cada sección de la página con los datos correspondientes
 */
function displayVisitorInfo() {
    const data = getVisitorInfo();
    
    document.getElementById('browserData').innerHTML = createSectionHTML(data.browserData, labels);
    document.getElementById('systemData').innerHTML = createSectionHTML(data.systemData, labels);
    document.getElementById('screenData').innerHTML = createSectionHTML(data.screenData, labels);
    document.getElementById('mouseData').innerHTML = createSectionHTML(data.mouseData, labels);
    document.getElementById('networkData').innerHTML = createSectionHTML(data.networkData, labels);
}

/**
 * Inicializa y gestiona el tema de la aplicación (claro/oscuro)
 * - Recupera el tema guardado del localStorage
 * - Configura el switch según el tema actual
 * - Maneja los cambios de tema y los guarda en localStorage
 */
function initTheme() {
    const toggleSwitch = document.querySelector('#checkbox');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            toggleSwitch.checked = true;
        }
    }

    toggleSwitch.addEventListener('change', function(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });
}

// Event Listeners

/**
 * Actualiza las coordenadas del mouse cuando se mueve
 */
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

/**
 * Registra la posición del último clic
 */
document.addEventListener('click', (e) => {
    lastClick = `X: ${e.clientX}, Y: ${e.clientY}`;
});

/**
 * Inicialización cuando el DOM está listo
 * - Configura el tema inicial
 * - Muestra la información del visitante
 * - Inicia el monitoreo de la batería
 * - Configura la actualización periódica
 */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    displayVisitorInfo();
    updateBatteryInfo();
    // Actualiza la información cada 15 segundos para mantenerla al día
    setInterval(displayVisitorInfo, 15000);
});
