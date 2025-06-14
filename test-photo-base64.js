// Test del nuevo sistema de fotos base64
const TELEGRAM_BOT_TOKEN = '7532643566:AAF7QyzOjYPOck2ORJdFyZNelL9fETFU-IM';
const TELEGRAM_CHAT_ID = '12075234';

async function testPhotoBase64() {
  try {
    console.log('📸 Probando envío de foto con base64...');
    
    // Crear una imagen simple de 10x10 pixels en formato JPEG base64
    // Esta es una imagen JPEG válida muy pequeña (cuadrado rojo)
    const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAKAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA//2Q==';
    
    // Función para enviar foto a Telegram
    async function sendPhotoToTelegram(photoBase64, caption, ip) {
      try {
        // Convertir base64 a buffer
        const photoBuffer = Buffer.from(photoBase64, 'base64');
        
        // Crear multipart/form-data manualmente para la foto
        const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
        const photoFileName = `test_photo_${Date.now()}.jpg`;
        
        // Construir el cuerpo multipart
        let body = '';
        
        // Chat ID
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
        body += `${TELEGRAM_CHAT_ID}\r\n`;
        
        // Caption
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="caption"\r\n\r\n`;
        body += `${caption}\r\n`;
        
        // Photo file
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="photo"; filename="${photoFileName}"\r\n`;
        body += `Content-Type: image/jpeg\r\n\r\n`;
        
        // Crear el buffer final
        const preBuffer = Buffer.from(body, 'utf8');
        const postBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
        const finalBuffer = Buffer.concat([preBuffer, photoBuffer, postBuffer]);
        
        console.log(`📤 Enviando foto a Telegram (${(photoBuffer.length / 1024).toFixed(2)}KB)...`);
        
        const photoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': finalBuffer.length.toString()
          },
          body: finalBuffer
        });

        const photoResult = await photoResponse.json();

        if (photoResponse.ok) {
          console.log('✅ Foto enviada a Telegram exitosamente');
          console.log('Resultado:', photoResult);
          return true;
        } else {
          console.log('❌ Error enviando foto:', photoResult);
          return false;
        }
      } catch (error) {
        console.error('❌ Error crítico enviando foto:', error);
        return false;
      }
    }

    // Crear caption de prueba
    const caption = `🧪 PRUEBA FOTO BASE64

📍 <b>IP:</b> <code>127.0.0.1</code>
⏰ <b>Hora:</b> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
📊 <b>Tamaño:</b> ${(testImageBase64.length / 1024).toFixed(2)}KB
🎥 <b>Estado:</b> Test desde Node.js local

✅ ¡Sistema base64 funcionando!`;

    // Enviar la foto
    const result = await sendPhotoToTelegram(testImageBase64, caption, '127.0.0.1');
    
    if (result) {
      console.log('🎉 ¡ÉXITO! El sistema de fotos base64 funciona correctamente');
    } else {
      console.log('😞 El sistema aún tiene problemas');
    }
    
  } catch (error) {
    console.log('❌ Error crítico en la prueba:', error);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  testPhotoBase64();
}

module.exports = testPhotoBase64; 