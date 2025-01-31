// Variables globales para el seguimiento del mouse
let mouseX = 0;
let mouseY = 0;
let lastClick = 'Ningún clic registrado';

// Función para obtener la información del visitante
function getVisitorInfo() {
    // Detectar navegador
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

    // Detectar sistema operativo de manera moderna
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
        bateria: 'Verificando...',
        gpu: 'Verificando...',
        preferencias: {
            reduccionMovimiento: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Sí' : 'No',
            modoOscuro: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Sí' : 'No',
            contrasteAlto: window.matchMedia('(prefers-contrast: high)').matches ? 'Sí' : 'No'
        }
    };

    // Obtener información de la batería si está disponible
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            systemData.bateria = `${(battery.level * 100).toFixed(0)}% - ${battery.charging ? 'Cargando' : 'No cargando'}`;
        });
    } else {
        systemData.bateria = 'No disponible';
    }

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

// Función para mostrar la información
function displayVisitorInfo() {
    const data = getVisitorInfo();
    
    // Función helper para crear el HTML de cada sección
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

    // Labels para cada sección
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

    // Actualizar cada sección
    document.getElementById('browserData').innerHTML = createSectionHTML(data.browserData, labels);
    document.getElementById('systemData').innerHTML = createSectionHTML(data.systemData, labels);
    document.getElementById('screenData').innerHTML = createSectionHTML(data.screenData, labels);
    document.getElementById('mouseData').innerHTML = createSectionHTML(data.mouseData, labels);
    document.getElementById('networkData').innerHTML = createSectionHTML(data.networkData, labels);
}

// Theme switcher functionality
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

// Event Listeners para el mouse
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

document.addEventListener('click', (e) => {
    lastClick = `X: ${e.clientX}, Y: ${e.clientY}`;
});

// Iniciar la actualización de información y el tema
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    displayVisitorInfo();
    // Actualizar la información cada 15 segundos
    setInterval(displayVisitorInfo, 15000);
});
