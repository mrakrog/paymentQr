// Test directo del bot de Telegram
const TELEGRAM_BOT_TOKEN = '8083680161:AAFw7sJh6ckiRHkgMS3WsC6J0Ya8Q5aPwE';
const TELEGRAM_CHAT_ID = '12075234';

async function testTelegram() {
  try {
    console.log('🧪 Probando bot de Telegram...');
    
    const testMessage = `🧪 <b>TEST DIRECTO</b>

⏰ <b>Hora:</b> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
🤖 <b>Bot:</b> webcamarabot
💬 <b>Chat ID:</b> ${TELEGRAM_CHAT_ID}

✅ ¡Test desde Node.js local!`;

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: testMessage,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ ¡Mensaje enviado a Telegram exitosamente!');
      console.log('Resultado:', result);
    } else {
      console.log('❌ Error enviando mensaje:');
      console.log(result);
    }
  } catch (error) {
    console.log('❌ Error crítico:', error);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  testTelegram();
}

module.exports = testTelegram; 