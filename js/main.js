// Prefijo obligatorio que debe contener la orden para ser aceptada (por ejemplo, "ALEXA")
const ordenPrefijo = "ALEXA";

// Espera a que el documento HTML esté completamente cargado antes de ejecutar el script
// Se utiliza para asegurar que todos los elementos del DOM estén disponibles
document.addEventListener("DOMContentLoaded", () => {
  // Referencias a los elementos del DOM
  const startBtn = document.getElementById("startBtn");         // Botón para iniciar reconocimiento
  const outputText = document.getElementById("outputText");     // Área de salida del texto reconocido
  const msgText = document.getElementById("msgText");           // Área para mostrar mensajes de error

  let recognition;             // Objeto para reconocimiento de voz
  let escuchando = false;      // Controla si ya se está escuchando
  let detenidoManual = false; // Bandera para saber si el usuario detuvo manualmente

  // Verificar si el navegador soporta reconocimiento de voz (webkitSpeechRecognition)
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition(); // Crear instancia
    recognition.lang = "es-ES";                  // Establecer idioma en español
    recognition.continuous = true;               // Reconocimiento continuo
    recognition.interimResults = false;          // No mostrar resultados parciales
  } else {
    alert("Tu navegador no soporta reconocimiento de voz.");
    return;
  }

  // Función que inicia el reconocimiento de voz
  function iniciarReconocimiento() {
    // MODIFICACIÓN PARA EXAMEN
    const name = document.getElementById("userName").value.trim();
    if (!name) {
      alert("⚠ Ingresar un nombre");
      return;
    }

    if (escuchando) return;

    escuchando = true;
    detenidoManual = false;
    startBtn.disabled = true;
    startBtn.textContent = "🎤 Escuchando...";
    msgText.innerHTML = "";
    outputText.innerHTML = "Escuchando...";

    recognition.start();
  }

  // Asocia el botón al evento para iniciar reconocimiento
  startBtn.addEventListener("click", iniciarReconocimiento);

  // Evento cuando se recibe una orden de voz
  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toUpperCase();
    console.log("🔊 Frase reconocida:", transcript);
    outputText.innerHTML = `🗣️ Frase detectada: <strong>${transcript}</strong>`;

    // ✅ Acepta frases que COMIENCEN con "ALEXA"
    if (transcript.startsWith(ordenPrefijo)) {
      enviarComando(transcript);
    } else {
      outputText.innerHTML += "<br><span class='text-warning'>Debes comenzar con 'ALEXA'.</span>";
    }
  };

  // Evento cuando ocurre un error
  recognition.onerror = (event) => {
    console.error("❌ Error:", event.error);

    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      msgText.innerHTML = "❌ Permiso denegado para usar el micrófono.";
    } else if (event.error === "network") {
      msgText.innerHTML = "❌ Error de red al usar el reconocimiento.";
    } else {
      msgText.innerHTML = "❌ Error en el reconocimiento de voz.";
    }

    if (!detenidoManual) {
      recognition.stop(); // detener primero para reiniciar limpio
      setTimeout(() => recognition.start(), 1000);
    } else {
      reiniciarBoton();
    }
  };

  // Evento cuando finaliza el reconocimiento de voz
  recognition.onend = () => {
    if (!detenidoManual) {
      msgText.innerHTML = "🎤 El reconocimiento se detuvo. Esperando tu voz nuevamente...";
      recognition.start(); // Reanuda automáticamente
    }
  };

  // Función para restablecer el botón
  function reiniciarBoton() {
    escuchando = false;
    startBtn.disabled = false;
    startBtn.textContent = "🎙️ Iniciar Reconocimiento";
  }

  // Función para enviar la orden a la API
  function enviarComando(frase) {
    const name = document.getElementById("userName").value.trim();
    // url
    fetch("https://18.232.168.76/api-gpt-php/endpoints/chat.php", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: frase, name: name })
    })
      .then(res => res.json())
      .then(data => {
        const respuesta = data.data.reply || "No se recibió respuesta.";
        outputText.innerHTML += `<br>🤖 <strong>${respuesta}</strong>`;

        const voz = new SpeechSynthesisUtterance(respuesta);
        voz.lang = "es-ES";
        voz.rate = 1;

        // Cancelar posibles voces anteriores
        speechSynthesis.cancel();
        speechSynthesis.speak(voz);

        voz.onend = () => {
          if (escuchando && !detenidoManual) {
            recognition.start(); // Reanudar después de hablar
          }
        };
      })
      .catch(err => {
        console.error("❌ Error al enviar a la API:", err);
        msgText.innerHTML = "No se pudo conectar con la API.";
        reiniciarBoton();
      });
  }
});
