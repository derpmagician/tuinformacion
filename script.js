// Variables globales para el seguimiento del mouse y estado del sistema
let mouseX = 0;
let mouseY = 0;
let lastClick = 'Ningún clic registrado';
let batteryStatus = 'No disponible';

// Atajos de teclado
const KEYBOARD_SHORTCUTS = {
    TOGGLE_THEME: { key: 't', alt: true, description: 'Cambiar tema claro/oscuro' },
    // TOGGLE_ALL: { key: 'a', alt: true, description: 'Expandir/Colapsar todas las secciones' },
    TOGGLE_SECTION: { key: 'Enter', alt: false, description: 'Expandir/Colapsar sección actual' },
    // NEXT_SECTION: { key: 'ArrowDown', alt: true, description: 'Ir a la siguiente sección' },
    // PREV_SECTION: { key: 'ArrowUp', alt: true, description: 'Ir a la sección anterior' }
};

/**
 * Maneja los atajos de teclado globales
 * @param {KeyboardEvent} e - Evento del teclado
 */
function handleKeyboardShortcuts(e) {
    // Evitar conflictos con otros atajos del sistema
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    const { key, altKey } = e;
    const keyLower = key.toLowerCase();

    // Manejar atajos globales
    if (altKey) {
        if (keyLower === KEYBOARD_SHORTCUTS.TOGGLE_THEME.key) {
            e.preventDefault();
            toggleTheme();
        } 
        else if (keyLower === KEYBOARD_SHORTCUTS.TOGGLE_ALL.key) {
            e.preventDefault();
            toggleAllSections();
        }
        else if (key === 'ArrowDown') {
            e.preventDefault();
            navigateSections('next');
        }
        else if (key === 'ArrowUp') {
            e.preventDefault();
            navigateSections('prev');
        }
    }
    // Manejar Enter en secciones
    else if (key === 'Enter' && e.target.classList.contains('section-header')) {
        e.preventDefault();
        toggleSection(e.target.closest('.info-section'));
    }
}

/**
 * Navega entre secciones
 * @param {string} direction - Dirección de navegación ('next' o 'prev')
 */
function navigateSections(direction) {
    const sections = Array.from(document.querySelectorAll('.info-section'));
    if (!sections.length) return;

    const currentSection = document.activeElement.closest('.info-section');
    let currentIndex = currentSection ? sections.indexOf(currentSection) : -1;
    
    // Si no hay sección activa o no se encontró, empezar desde el principio
    if (currentIndex === -1) {
        currentIndex = direction === 'next' ? -1 : sections.length;
    }
    
    // Calcular el siguiente índice
    let nextIndex;
    if (direction === 'next') {
        nextIndex = (currentIndex + 1) % sections.length;
    } else {
        nextIndex = (currentIndex - 1 + sections.length) % sections.length;
    }
    
    // Enfocar el encabezado de la siguiente sección
    const nextHeader = sections[nextIndex].querySelector('.section-header');
    if (nextHeader) {
        nextHeader.focus();
        // Hacer scroll a la sección si es necesario
        nextHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Alterna el estado de todas las secciones
 */
function toggleAllSections() {
    const sections = document.querySelectorAll('.info-section');
    if (!sections.length) return;

    // Contar secciones colapsadas
    const collapsedCount = Array.from(sections).filter(section => 
        section.querySelector('.info-content').classList.contains('collapsed')).length;
    
    // Si más de la mitad están colapsadas, expandir todas; si no, colapsar todas
    const shouldExpand = collapsedCount > sections.length / 2;
    console.log(shouldExpand);
    
    sections.forEach(section => {
        const content = section.querySelector('.info-content');
        const header = section.querySelector('.section-header');
        
        if (!content || !header) return;
        
        if (shouldExpand) {
            content.classList.remove('collapsed');
            header.setAttribute('aria-expanded', 'true');
            content.style.display = '';
        } else {
            content.classList.add('collapsed');
            header.setAttribute('aria-expanded', 'false');
            content.style.display = 'none';
        }
    });
    
    // Guardar estado en localStorage
    try {
        const sectionStates = Array.from(sections).reduce((acc, section) => {
            const id = section.id || section.querySelector('h2')?.textContent;
            if (id) {
                acc[id] = !section.querySelector('.info-content').classList.contains('collapsed');
            }
            return acc;
        }, {});
        
        localStorage.setItem('sectionStates', JSON.stringify(sectionStates));
    } catch (error) {
        console.warn('No se pudo guardar el estado de las secciones:', error);
    }
    
    // Anunciar cambio para lectores de pantalla
    announceToScreenReader(`${shouldExpand ? 'Expandidas' : 'Colapsadas'} todas las secciones`);
}

/**
 * Inicializa los controles de las secciones
 */
function initSectionControls() {
    document.querySelectorAll('.info-section').forEach(section => {
        const header = section.querySelector('h2');
        if (!header) return;

        header.classList.add('section-header');
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', 'button');
        header.setAttribute('aria-expanded', 'true');
        
        // Añadir icono de colapso
        const icon = document.createElement('span');
        icon.className = 'collapse-icon';
        icon.setAttribute('aria-hidden', 'true');
        header.appendChild(icon);
        
        // Añadir eventos de clic y teclado
        header.addEventListener('click', () => toggleSection(section));
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSection(section);
            }
        });
        
        // Restaurar estado guardado
        try {
            const savedStates = JSON.parse(localStorage.getItem('sectionStates'));
            if (savedStates) {
                const id = section.id || header.textContent;
                if (id && !savedStates[id]) {
                    const content = section.querySelector('.info-content');
                    if (content) {
                        content.classList.add('collapsed');
                        content.style.display = 'none';
                        header.setAttribute('aria-expanded', 'false');
                    }
                }
            }
        } catch (error) {
            console.warn('Error al restaurar estados de sección:', error);
        }
    });

    // Asegurarse de que el manejador de eventos esté registrado una sola vez
    document.removeEventListener('keydown', handleKeyboardShortcuts);
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

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
    velocidad: 'Velocidad de Descarga',

    // Performance labels
    'memoria.limiteJS': 'Límite de Memoria JS',
    'memoria.memoriaTotal': 'Memoria Total JS',
    'memoria.memoriaUsada': 'Memoria JS Usada',
    'tiempos.tiempoCarga': 'Tiempo de Carga',
    'tiempos.tiempoDNS': 'Tiempo DNS',
    'tiempos.tiempoConexion': 'Tiempo de Conexión',

    // Media labels
    'audio.mp3': 'Soporte MP3',
    'audio.wav': 'Soporte WAV',
    'audio.ogg': 'Soporte OGG',
    'video.mp4': 'Soporte MP4',
    'video.webm': 'Soporte WebM',
    'video.ogg': 'Soporte OGG Video',
    'webrtc': 'Soporte WebRTC',
    'mediaRecorder': 'Grabación Multimedia',

    // Storage labels
    'localStorage': 'LocalStorage',
    'sessionStorage': 'SessionStorage',
    'cookies': 'Cookies',
    'cuotaTotal': 'Cuota Total',
    'usado': 'Espacio Usado',
    'disponible': 'Espacio Disponible',

    // Permissions labels
    'geolocation': 'Ubicación',
    'notifications': 'Notificaciones',
    'microphone': 'Micrófono',
    'camera': 'Cámara',
    'clipboard-read': 'Lectura Portapapeles',
    'clipboard-write': 'Escritura Portapapeles'
};

/**
 * Maneja los atajos de teclado
 * @param {KeyboardEvent} e - Evento del teclado
 */
function handleKeyboardShortcuts(e) {
    const { key, altKey } = e;
    
    // Manejar atajos globales
    if (altKey && key.toLowerCase() === KEYBOARD_SHORTCUTS.TOGGLE_THEME.key) {
        e.preventDefault();
        toggleTheme();
    } else if (altKey && key.toLowerCase() === KEYBOARD_SHORTCUTS.TOGGLE_ALL.key) {
        e.preventDefault();
        toggleAllSections();
    } else if (altKey && key === KEYBOARD_SHORTCUTS.NEXT_SECTION.key) {
        e.preventDefault();
        navigateSections('next');
    } else if (altKey && key === KEYBOARD_SHORTCUTS.PREV_SECTION.key) {
        e.preventDefault();
        navigateSections('prev');
    }
    
    // Manejar tecla Enter en secciones
    if (key === KEYBOARD_SHORTCUTS.TOGGLE_SECTION.key && 
        e.target.classList.contains('section-header')) {
        e.preventDefault();
        toggleSection(e.target.closest('.info-section'));
    }
}

/**
 * Navega entre secciones
 * @param {string} direction - Dirección de navegación ('next' o 'prev')
 */
function navigateSections(direction) {
    const sections = Array.from(document.querySelectorAll('.info-section'));
    const currentSection = document.activeElement.closest('.info-section');
    let index = currentSection ? sections.indexOf(currentSection) : -1;
    
    if (direction === 'next') {
        index = (index + 1) % sections.length;
    } else {
        index = (index - 1 + sections.length) % sections.length;
    }
    
    sections[index].querySelector('.section-header').focus();
}

/**
 * Alterna el estado de todas las secciones
 * @returns {void}
 */
function toggleAllSections() {
    const sections = document.querySelectorAll('.info-section');
    if (!sections.length) return;

    // Contar secciones colapsadas para determinar la acción
    const collapsedCount = Array.from(sections).filter(section => 
        section.querySelector('.info-content').classList.contains('collapsed')).length;
    
    // Si más de la mitad están colapsadas, expandir todas; si no, colapsar todas
    const shouldExpand = collapsedCount > sections.length / 2;
    
    sections.forEach(section => {
        const content = section.querySelector('.info-content');
        const header = section.querySelector('.section-header');
        
        if (!content || !header) return;
        
        if (shouldExpand) {
            content.classList.remove('collapsed');
            header.setAttribute('aria-expanded', 'true');
            // Asegurar que el contenido sea visible
            content.style.display = '';
        } else {
            content.classList.add('collapsed');
            header.setAttribute('aria-expanded', 'false');
            // Ocultar el contenido
            content.style.display = 'none';
        }
    });
    
    // Guardar estado en localStorage
    try {
        const sectionStates = Array.from(sections).reduce((acc, section) => {
            const id = section.id || section.querySelector('h2')?.textContent;
            if (id) {
                acc[id] = !section.querySelector('.info-content').classList.contains('collapsed');
            }
            return acc;
        }, {});
        
        localStorage.setItem('sectionStates', JSON.stringify(sectionStates));
    } catch (error) {
        console.warn('No se pudo guardar el estado de las secciones:', error);
    }
    
    // Anunciar cambio para lectores de pantalla
    announceToScreenReader(`${shouldExpand ? 'Expandidas' : 'Colapsadas'} todas las secciones`);
    
    // Enfocar la primera sección si se expandieron todas
    if (shouldExpand) {
        const firstHeader = sections[0].querySelector('.section-header');
        if (firstHeader) {
            firstHeader.focus();
        }
    }
}

/**
 * Alterna el estado de una sección específica
 * @param {HTMLElement} section - Elemento de la sección
 */
function toggleSection(section) {
    const content = section.querySelector('.info-content');
    const header = section.querySelector('.section-header');
    const isCollapsed = content.classList.toggle('collapsed');
    
    header.setAttribute('aria-expanded', !isCollapsed);
    announceToScreenReader(`Sección ${header.textContent} ${isCollapsed ? 'colapsada' : 'expandida'}`);
}

/**
 * Anuncia un mensaje a los lectores de pantalla
 * @param {string} message - Mensaje a anunciar
 */
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'visually-hidden';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
}

/**
 * Alterna el tema de la aplicación
 */
function toggleTheme() {
    const toggleSwitch = document.querySelector('#checkbox');
    toggleSwitch.checked = !toggleSwitch.checked;
    toggleSwitch.dispatchEvent(new Event('change'));
}

/**
 * Maneja la accesibilidad del teclado
 * @param {KeyboardEvent} e - Evento del teclado
 */
function handleKeyboardShortcuts(e) {
    // Alt + T para cambiar el tema
    if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        const toggleSwitch = document.querySelector('#checkbox');
        toggleSwitch.checked = !toggleSwitch.checked;
        toggleSwitch.dispatchEvent(new Event('change'));
    }
}

/**
 * Actualiza el texto de las etiquetas ARIA
 * @param {boolean} isDark - Si el tema es oscuro
 */
function updateAriaLabels(isDark) {
    const themeLabel = document.getElementById('theme-label');
    const checkbox = document.querySelector('#checkbox');
    const newTheme = isDark ? 'oscuro' : 'claro';
    
    themeLabel.textContent = `Modo ${isDark ? 'Oscuro' : 'Claro'}`;
    checkbox.setAttribute('aria-label', `Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`);
}

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
                        return `<div class="info-item" role="listitem" tabindex="0">
                            <span class="info-label">${label}:</span>
                            <span class="info-value" aria-label="${label}: ${subValue}">${subValue}</span>
                        </div>`;
                    })
                    .join('');
            } else {
                const label = labels[key] || key;
                return `<div class="info-item" role="listitem" tabindex="0">
                    <span class="info-label">${label}:</span>
                    <span class="info-value" aria-label="${label}: ${value}">${value}</span>
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
async function getVisitorInfo() {
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

    // Datos de rendimiento
    const performanceData = getPerformanceInfo();

    // Datos de capacidades multimedia
    const mediaData = getMediaCapabilities();

    // Datos de almacenamiento
    const storageData = await getStorageInfo();

    // Datos de permisos
    const permissionsData = await getPermissionsStatus();

    return {
        browserData,
        systemData,
        screenData,
        mouseData,
        networkData,
        performanceData,
        mediaData,
        storageData,
        permissionsData
    };
}

/**
 * Obtiene información sobre el rendimiento del navegador
 * @returns {Object} Datos de rendimiento
 */
function getPerformanceInfo() {
    const performance = window.performance || {};
    const memory = performance.memory || {};
    const timing = performance.timing || {};
    
    return {
        memoria: {
            limiteJS: memory.jsHeapSizeLimit ? `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB` : 'No disponible',
            memoriaTotal: memory.totalJSHeapSize ? `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB` : 'No disponible',
            memoriaUsada: memory.usedJSHeapSize ? `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB` : 'No disponible'
        },
        tiempos: {
            tiempoCarga: timing.loadEventEnd - timing.navigationStart ? `${timing.loadEventEnd - timing.navigationStart}ms` : 'No disponible',
            tiempoDNS: timing.domainLookupEnd - timing.domainLookupStart ? `${timing.domainLookupEnd - timing.domainLookupStart}ms` : 'No disponible',
            tiempoConexion: timing.connectEnd - timing.connectStart ? `${timing.connectEnd - timing.connectStart}ms` : 'No disponible'
        }
    };
}

/**
 * Obtiene información sobre las capacidades multimedia
 * @returns {Object} Datos de capacidades multimedia
 */
function getMediaCapabilities() {
    const audioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    const checkMediaSupport = (type) => {
        const elem = type.startsWith('audio') ? document.createElement('audio') : document.createElement('video');
        return elem.canPlayType(type) || 'No soportado';
    };

    return {
        audio: Object.fromEntries(audioTypes.map(type => [type.split('/')[1], checkMediaSupport(type)])),
        video: Object.fromEntries(videoTypes.map(type => [type.split('/')[1], checkMediaSupport(type)])),
        webrtc: 'RTCPeerConnection' in window ? 'Soportado' : 'No soportado',
        mediaRecorder: 'MediaRecorder' in window ? 'Soportado' : 'No soportado'
    };
}

/**
 * Obtiene información sobre el almacenamiento
 * @returns {Promise<Object>} Datos de almacenamiento
 */
async function getStorageInfo() {
    const storage = {
        localStorage: 'localStorage' in window ? 'Disponible' : 'No disponible',
        sessionStorage: 'sessionStorage' in window ? 'Disponible' : 'No disponible',
        cookies: navigator.cookieEnabled ? 'Habilitadas' : 'Deshabilitadas'
    };

    if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
            const estimate = await navigator.storage.estimate();
            storage.cuotaTotal = `${(estimate.quota / 1024 / 1024).toFixed(2)} MB`;
            storage.usado = `${(estimate.usage / 1024 / 1024).toFixed(2)} MB`;
            storage.disponible = `${((estimate.quota - estimate.usage) / 1024 / 1024).toFixed(2)} MB`;
        } catch (e) {
            console.log('Error al obtener estimación de almacenamiento:', e);
        }
    }

    return storage;
}

/**
 * Obtiene el estado de los permisos del navegador
 * @returns {Promise<Object>} Estado de los permisos
 */
async function getPermissionsStatus() {
    const permissions = {};
    
    if ('permissions' in navigator) {
        const permissionQueries = [
            'geolocation',
            'notifications',
            'microphone',
            'camera',
            'clipboard-read',
            'clipboard-write'
        ];

        for (const permission of permissionQueries) {
            try {
                const result = await navigator.permissions.query({ name: permission });
                permissions[permission] = result.state;
            } catch (e) {
                permissions[permission] = 'No soportado';
            }
        }
    }

    return permissions;
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
            
            const updateStatus = () => {
                const batteryInfo = {
                    systemData: {
                        battery: {
                            nivel: `${Math.round(battery.level * 100)}%`,
                            cargando: battery.charging ? 'Sí' : 'No',
                            tiempoRestante: battery.charging
                                ? `${Math.round(battery.chargingTime / 60)} minutos para carga completa`
                                : `${Math.round(battery.dischargingTime / 60)} minutos restantes`
                        }
                    }
                };
                
                batteryStatus = batteryInfo.systemData.battery;
                
                const batterySection = document.getElementById('systemData');
                if (batterySection) {
                    const batteryHTML = createSectionHTML({ battery: batteryStatus }, labels);
                    const batteryElement = batterySection.querySelector('.info-item:last-child');
                    if (batteryElement) {
                        batteryElement.outerHTML = batteryHTML;
                    } else {
                        batterySection.insertAdjacentHTML('beforeend', batteryHTML);
                    }
                }
            };

            // Actualizar estado inicial
            updateStatus();

            // Escuchar cambios en la batería
            battery.addEventListener('levelchange', updateStatus);
            battery.addEventListener('chargingchange', updateStatus);
            battery.addEventListener('chargingtimechange', updateStatus);
            battery.addEventListener('dischargingtimechange', updateStatus);
        } else {
            batteryStatus = {
                nivel: 'No disponible',
                cargando: 'No disponible',
                tiempoRestante: 'No disponible'
            };
        }
    } catch (error) {
        console.warn('Error al obtener información de la batería:', error);
        batteryStatus = {
            nivel: 'Error',
            cargando: 'Error',
            tiempoRestante: 'Error'
        };
    }
}

/**
 * Actualiza solo la información dinámica (mouse y batería)
 */
function updateDynamicInfo() {
    const mouseData = document.getElementById('mouseData');
    const batterySection = document.getElementById('systemData');
    
    if (mouseData) {
        const mouseInfo = {
            position: {
                x: mouseX,
                y: mouseY
            },
            lastClick: lastClick
        };
        mouseData.innerHTML = createSectionHTML(mouseInfo, labels);
    }
    
    if (batterySection && batteryStatus && typeof batteryStatus === 'object') {
        const batteryHTML = createSectionHTML({ battery: batteryStatus }, labels);
        const batteryElement = batterySection.querySelector('.info-item:last-child');
        if (batteryElement) {
            batteryElement.outerHTML = batteryHTML;
        } else {
            batterySection.insertAdjacentHTML('beforeend', batteryHTML);
        }
    }
}

/**
 * Muestra toda la información del visitante en la interfaz
 * Actualiza cada sección de la página con los datos correspondientes
 */
async function displayVisitorInfo() {
    try {
        const visitorInfo = await getVisitorInfo();
        
        // Actualizar cada sección con su información correspondiente
        Object.entries(visitorInfo).forEach(([sectionId, data]) => {
            const section = document.getElementById(sectionId);
            if (section) {
                // Si es la sección del mouse o sistema, solo actualizar si es la primera vez
                if (sectionId === 'mouseData' || 
                    (sectionId === 'systemData' && batteryStatus !== 'No disponible')) {
                    if (!section.hasChildNodes()) {
                        section.innerHTML = createSectionHTML(data, labels);
                    }
                } else {
                    section.innerHTML = createSectionHTML(data, labels);
                }
            }
        });
        
        // Restaurar estados de colapso después de actualizar
        document.querySelectorAll('.info-section').forEach(section => {
            const header = section.querySelector('.section-header');
            const content = section.querySelector('.info-content');
            if (header && header.getAttribute('aria-expanded') === 'false') {
                content.classList.add('collapsed');
            }
        });
        
    } catch (error) {
        console.error('Error al obtener información del visitante:', error);
    }
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
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Establecer tema inicial
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            toggleSwitch.checked = true;
        }
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleSwitch.checked = true;
    }

    // Actualizar ARIA labels iniciales
    updateAriaLabels(toggleSwitch.checked);

    // Manejar cambios de tema
    toggleSwitch.addEventListener('change', function(e) {
        const isDark = e.target.checked;
        const theme = isDark ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateAriaLabels(isDark);
        
        // Anunciar cambio de tema
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'visually-hidden';
        announcement.textContent = `Tema cambiado a modo ${isDark ? 'oscuro' : 'claro'}`;
        document.body.appendChild(announcement);
        
        // Eliminar el anuncio después de que se haya leído
        setTimeout(() => announcement.remove(), 1000);
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
 * Maneja la accesibilidad del teclado
 */
document.addEventListener('keydown', handleKeyboardShortcuts);

/**
 * Inicialización cuando el DOM está listo
 * - Configura el tema inicial
 * - Muestra la información del visitante
 * - Inicia el monitoreo de la batería
 * - Configura la actualización periódica
 */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    displayVisitorInfo(); // Mostrar toda la información inicial
    updateBatteryInfo();
    initSectionControls();
    
    // Mostrar atajos de teclado en el footer
    const shortcutsHtml = Object.entries(KEYBOARD_SHORTCUTS)
        .map(([name, { key, alt, description }]) => 
            `<kbd>${alt ? 'Alt + ' : ''}${key}</kbd>: ${description}`
        ).join(' | ');
    
    const footer = document.querySelector('footer');
    const updateInfo = document.createElement('p');
    updateInfo.textContent = 'Posición del mouse y estado de batería se actualizan cada 15 segundos';
    footer.insertBefore(updateInfo, footer.firstChild);
    footer.innerHTML += `<p class="keyboard-shortcuts">${shortcutsHtml}</p>`;
    
    // Actualizar solo la información dinámica cada 15 segundos
    setInterval(updateDynamicInfo, 15000);
});

/**
 * Detectar preferencias de reducción de movimiento
 */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('reduce-motion');
}

/**
 * Detectar preferencias de alto contraste
 */
if (window.matchMedia('(prefers-contrast: high)').matches) {
    document.documentElement.classList.add('high-contrast');
}
