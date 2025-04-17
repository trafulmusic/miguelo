// Función para mostrar mensajes de depuración
function debug(message) {
  console.log(message)
  const debugElement = document.getElementById("debug")
  if (debugElement) {
    debugElement.innerHTML += message + "<br>"
  }
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
  debug("DOM cargado")

  // Variables globales
  let audioContext = null
  let masterGainNode = null
  const activeOscillators = {}
  const activeGainNodes = {}
  let filterNode = null
  let delayNode = null
  let feedbackNode = null
  let lfoNode = null
  let lfoGainNode = null
  let analyserNode = null
  let visualizerCanvas = null
  let visualizerContext = null
  let animationFrameId = null
  let isAudioInitialized = false
  let currentOctave = 3
  let manualFrequencyMode = false
  let currentLanguage = "en"

  // Variables del arpegiador - Reimplementación completa
  let arpeggiatorEnabled = false
  let arpeggiatorNotes = []
  let arpeggiatorTimer = null
  let arpeggiatorIndex = 0
  let arpeggiatorRate = 200
  let arpeggiatorPattern = "up"
  let arpeggiatorOctaveRange = 1
  let arpeggiatorDirection = 1
  let arpeggiatorOctaveOffset = 0

  const pressedKeys = new Set()

  // Elementos del DOM
  const startOverlay = document.getElementById("start-overlay")
  const startButton = document.getElementById("start-button")
  const startText = document.getElementById("start-text")
  const migueloLogo = document.getElementById("miguelo-logo")
  const themeButton = document.getElementById("theme-button")
  const languageButton = document.getElementById("language-button")
  const waveformSelect = document.getElementById("waveform")
  const frequencySlider = document.getElementById("frequency")
  const frequencyValue = document.getElementById("frequency-value")
  const frequencyModeToggle = document.getElementById("frequency-mode-toggle")
  const filterSlider = document.getElementById("filter")
  const filterValue = document.getElementById("filter-value")
  const attackSlider = document.getElementById("distortion") // Reutilizamos el slider de distorsión
  const attackValue = document.getElementById("distortion-value") // Reutilizamos el valor de distorsión
  const delaySlider = document.getElementById("delay")
  const delayValue = document.getElementById("delay-value")
  const lfoFreqSlider = document.getElementById("lfo-freq")
  const lfoFreqValue = document.getElementById("lfo-freq-value")
  const lfoDepthSlider = document.getElementById("lfo-depth")
  const lfoDepthValue = document.getElementById("lfo-depth-value")
  const volumeSlider = document.getElementById("volume")
  const volumeValue = document.getElementById("volume-value")
  const presetButtons = document.querySelectorAll(".preset-btn")
  const pianoKeys = document.querySelectorAll(".piano-key")
  const octaveUpBtn = document.getElementById("octave-up")
  const octaveDownBtn = document.getElementById("octave-down")
  const currentOctaveDisplay = document.getElementById("current-octave")
  const arpToggleButton = document.getElementById("arp-toggle")
  const arpRateSlider = document.getElementById("arp-rate")
  const arpRateValue = document.getElementById("arp-rate-value")
  const arpPatternSelect = document.getElementById("arp-pattern")
  const arpOctaveSelect = document.getElementById("arp-octave")
  const arpNotesDisplay = document.getElementById("arp-notes-display")
  const stopButton = document.getElementById("stop-button")

  // Imágenes de Miguelo con rutas locales
  const migueloInactive = "./images/miguelo-inactive.png"
  const migueloActive = "./images/miguelo-active.png"

  // Configuración actual
  let currentSettings = {
    waveform: "sine",
    frequency: 440,
    filter: 20000,
    attack: 0,
    delay: 0,
    lfoFreq: 0,
    lfoDepth: 0,
    volume: 0.5,
  }

  // Presets - Modificados para tener delay en 0
  const presets = {
    "espacio-glitch": {
      waveform: "square",
      frequency: 220,
      filter: 2000,
      attack: 0,
      delay: 0, // Cambiado de 0.3 a 0
      lfoFreq: 5.5,
      lfoDepth: 70,
      volume: 0.4,
    },
    "robot-malvado": {
      waveform: "sawtooth",
      frequency: 110,
      filter: 800,
      attack: 0,
      delay: 0, // Cambiado de 0.2 a 0
      lfoFreq: 8,
      lfoDepth: 40,
      volume: 0.6,
    },
    "eco-alienigena": {
      waveform: "sine",
      frequency: 440,
      filter: 5000,
      attack: 0,
      delay: 0, // Cambiado de 0.5 a 0
      lfoFreq: 0.2,
      lfoDepth: 90,
      volume: 0.5,
    },
    "laser-funky": {
      waveform: "sawtooth",
      frequency: 880,
      filter: 3000,
      attack: 0,
      delay: 0, // Cambiado de 0.1 a 0
      lfoFreq: 2,
      lfoDepth: 60,
      volume: 0.45,
    },
    "ruido-caotico": {
      waveform: "square",
      frequency: 55,
      filter: 10000,
      attack: 0,
      delay: 0, // Cambiado de 0.4 a 0
      lfoFreq: 15,
      lfoDepth: 100,
      volume: 0.35,
    },
  }

  // Traducciones
  const translations = {
    es: {
      startText: "Haz clic para iniciar el sintetizador",
      startButton: "INICIAR",
      themeButton: {
        light: "MODO OSCURO",
        dark: "MODO CLARO",
      },
      waveformLabel: "FORMA DE ONDA",
      waveformOptions: {
        sine: "Senoidal",
        square: "Cuadrada",
        sawtooth: "Sierra",
        triangle: "Triangular",
      },
      frequencyLabel: "FRECUENCIA",
      frequencyMode: {
        notes: "MODO: NOTAS MUSICALES",
        manual: "MODO: FRECUENCIA MANUAL",
      },
      filterLabel: "FILTRO",
      attackLabel: "ATAQUE",
      delayLabel: "DELAY",
      volumeLabel: "VOLUMEN",
      lfoFreqLabel: "FRECUENCIA",
      lfoDepthLabel: "PROFUNDIDAD",
      arpeggiatorTitle: "ARPEGIADOR",
      arpToggle: {
        on: "ARPEGIADOR: ON",
        off: "ARPEGIADOR: OFF",
      },
      arpRateLabel: "VELOCIDAD",
      arpPatternLabel: "PATRÓN",
      arpPatternOptions: {
        up: "Ascendente",
        down: "Descendente",
        updown: "Arriba/Abajo",
        random: "Aleatorio",
      },
      arpOctaveLabel: "RANGO DE OCTAVAS",
      arpOctaveOptions: {
        one: "1 Octava",
        two: "2 Octavas",
        three: "3 Octavas",
      },
      arpNotesDisplay: "No hay notas activas",
      presetsTitle: "PRESETS",
      presetButtons: {
        space: "ESPACIO GLITCH",
        robot: "ROBOT MALVADO",
        alien: "ECO ALIENÍGENA",
        laser: "LÁSER FUNKY",
        noise: "RUIDO CAÓTICO",
      },
      visualizerTitle: "VISUALIZADOR",
      octaveDisplay: "Octava: ",
      footerText: "Powered by <a href='https://www.trafulmusic.com' target='_blank'>Traful</a>",
    },
    en: {
      startText: "Click to start the synthesizer",
      startButton: "START",
      themeButton: {
        light: "DARK MODE",
        dark: "LIGHT MODE",
      },
      waveformLabel: "WAVEFORM",
      waveformOptions: {
        sine: "Sine",
        square: "Square",
        sawtooth: "Sawtooth",
        triangle: "Triangle",
      },
      frequencyLabel: "FREQUENCY",
      frequencyMode: {
        notes: "MODE: MUSICAL NOTES",
        manual: "MODE: MANUAL FREQUENCY",
      },
      filterLabel: "FILTER",
      attackLabel: "ATTACK",
      delayLabel: "DELAY",
      volumeLabel: "VOLUME",
      lfoFreqLabel: "FREQUENCY",
      lfoDepthLabel: "DEPTH",
      arpeggiatorTitle: "ARPEGGIATOR",
      arpToggle: {
        on: "ARPEGIADOR: ON",
        off: "ARPEGIADOR: OFF",
      },
      arpRateLabel: "SPEED",
      arpPatternLabel: "PATTERN",
      arpPatternOptions: {
        up: "Ascending",
        down: "Descending",
        updown: "Up/Down",
        random: "Random",
      },
      arpOctaveLabel: "OCTAVE RANGE",
      arpOctaveOptions: {
        one: "1 Octave",
        two: "2 Octaves",
        three: "3 Octaves",
      },
      arpNotesDisplay: "No active notes",
      presetsTitle: "PRESETS",
      presetButtons: {
        space: "SPACE GLITCH",
        robot: "EVIL ROBOT",
        alien: "ALIEN ECHO",
        laser: "FUNKY LASER",
        noise: "CHAOTIC NOISE",
      },
      visualizerTitle: "VISUALIZER",
      octaveDisplay: "Octave: ",
      footerText: "Powered by <a href='https://www.trafulmusic.com' target='_blank'>Traful</a>",
    },
  }

  // Función para cambiar el idioma
  function changeLanguage(lang) {
    if (lang !== "es" && lang !== "en") return

    currentLanguage = lang
    languageButton.textContent = lang === "en" ? "ES" : "EN"
    updateUITexts()

    try {
      localStorage.setItem("migueloSynthLanguage", lang)
    } catch (e) {
      debug("Error al guardar preferencia de idioma: " + e.message)
    }
  }

  // Función para actualizar los textos de la interfaz
  function updateUITexts() {
    const texts = translations[currentLanguage]

    // Pantalla de inicio
    startText.textContent = texts.startText
    startButton.textContent = texts.startButton

    // Tema
    themeButton.textContent = document.body.classList.contains("dark-theme")
      ? texts.themeButton.dark
      : texts.themeButton.light

    // Actualizar el botón de idioma para mostrar el idioma al que cambiará
    languageButton.textContent = currentLanguage === "en" ? "ES" : "EN"

    // Controles principales
    document.getElementById("waveform-label").textContent = texts.waveformLabel
    document.getElementById("sine-option").textContent = texts.waveformOptions.sine
    document.getElementById("square-option").textContent = texts.waveformOptions.square
    document.getElementById("sawtooth-option").textContent = texts.waveformOptions.sawtooth
    document.getElementById("triangle-option").textContent = texts.waveformOptions.triangle

    document.getElementById("frequency-label").textContent = texts.frequencyLabel
    frequencyModeToggle.textContent = manualFrequencyMode ? texts.frequencyMode.manual : texts.frequencyMode.notes

    document.getElementById("filter-label").textContent = texts.filterLabel
    document.getElementById("distortion-label").textContent = texts.attackLabel
    document.getElementById("delay-label").textContent = texts.delayLabel
    document.getElementById("volume-label").textContent = texts.volumeLabel

    // LFO
    document.getElementById("lfo-freq-label").textContent = texts.lfoFreqLabel
    document.getElementById("lfo-depth-label").textContent = texts.lfoDepthLabel

    // Arpegiador
    document.getElementById("arpeggiator-title").textContent = texts.arpeggiatorTitle
    arpToggleButton.textContent = arpeggiatorEnabled ? texts.arpToggle.on : texts.arpToggle.off

    document.getElementById("arp-rate-label").textContent = texts.arpRateLabel
    document.getElementById("arp-pattern-label").textContent = texts.arpPatternLabel
    document.getElementById("up-option").textContent = texts.arpPatternOptions.up
    document.getElementById("down-option").textContent = texts.arpPatternOptions.down
    document.getElementById("updown-option").textContent = texts.arpPatternOptions.updown
    document.getElementById("random-option").textContent = texts.arpPatternOptions.random

    document.getElementById("arp-octave-label").textContent = texts.arpOctaveLabel
    document.getElementById("octave1-option").textContent = texts.arpOctaveOptions.one
    document.getElementById("octave2-option").textContent = texts.arpOctaveOptions.two
    document.getElementById("octave3-option").textContent = texts.arpOctaveOptions.three

    if (arpeggiatorNotes.length === 0) {
      arpNotesDisplay.textContent = texts.arpNotesDisplay
    }

    // Presets
    document.getElementById("presets-title").textContent = texts.presetsTitle
    document.getElementById("preset-space").textContent = texts.presetButtons.space
    document.getElementById("preset-robot").textContent = texts.presetButtons.robot
    document.getElementById("preset-alien").textContent = texts.presetButtons.alien
    document.getElementById("preset-laser").textContent = texts.presetButtons.laser
    document.getElementById("preset-noise").textContent = texts.presetButtons.noise

    // Visualizador
    document.getElementById("visualizer-title").textContent = texts.visualizerTitle

    // Octava
    currentOctaveDisplay.textContent = texts.octaveDisplay + currentOctave

    // Footer
    document.getElementById("footer-text").innerHTML = texts.footerText
  }

  // Función para convertir notas a frecuencias
  function noteToFrequency(note) {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    const octave = Number.parseInt(note.slice(-1))
    const noteName = note.slice(0, -1)

    const noteIndex = notes.indexOf(noteName)
    if (noteIndex === -1) return 440 // A4 por defecto

    // A4 = 440Hz, cada octava duplica la frecuencia
    const semitoneFromA4 = (octave - 4) * 12 + noteIndex - 9
    return 440 * Math.pow(2, semitoneFromA4 / 12)
  }

  // Inicializar el contexto de audio y los nodos
  function initAudio() {
    if (isAudioInitialized) return

    try {
      // Crear contexto de audio
      audioContext = new (window.AudioContext || window.webkitAudioContext)()

      // Crear nodo de ganancia principal
      masterGainNode = audioContext.createGain()
      masterGainNode.gain.value = currentSettings.volume
      masterGainNode.connect(audioContext.destination)

      // Crear nodo de filtro
      filterNode = audioContext.createBiquadFilter()
      filterNode.type = "lowpass"
      filterNode.frequency.value = currentSettings.filter
      filterNode.connect(masterGainNode)

      // Crear nodo de delay
      delayNode = audioContext.createDelay(5.0)
      delayNode.delayTime.value = currentSettings.delay

      // Crear nodo de feedback para el delay
      feedbackNode = audioContext.createGain()
      feedbackNode.gain.value = 0.3

      // Conectar la cadena de delay
      delayNode.connect(feedbackNode)
      feedbackNode.connect(delayNode)
      delayNode.connect(filterNode)

      // Crear nodo LFO
      lfoNode = audioContext.createOscillator()
      lfoNode.frequency.value = currentSettings.lfoFreq

      lfoGainNode = audioContext.createGain()
      lfoGainNode.gain.value = (currentSettings.lfoDepth / 100) * 5000

      lfoNode.connect(lfoGainNode)
      lfoGainNode.connect(filterNode.frequency)
      lfoNode.start()

      // Crear nodo analizador para el visualizador
      analyserNode = audioContext.createAnalyser()
      analyserNode.fftSize = 2048
      masterGainNode.connect(analyserNode)

      isAudioInitialized = true
      debug("Audio inicializado correctamente")

      return true
    } catch (error) {
      debug("Error al inicializar audio: " + error.message)
      return false
    }
  }

  // Inicializar el sintetizador
  function initSynth() {
    debug("Iniciando sintetizador...")

    if (!initAudio()) {
      alert("Error al inicializar el audio. Por favor, recarga la página.")
      return
    }

    // Ocultar el overlay de inicio
    startOverlay.style.display = "none"

    // Actualizar controles con valores iniciales
    updateControlsFromSettings()

    // Inicializar el visualizador
    initVisualizer()

    // Configurar los controles
    setupControls()

    // Configurar el arpegiador
    setupArpeggiator()

    // Actualizar las notas del teclado según la octava actual
    updateKeyboardNotes()

    // Reproducir un sonido de prueba
    playTestSound()

    debug("Sintetizador inicializado correctamente")
  }

  // Inicializar el visualizador
  function initVisualizer() {
    visualizerCanvas = document.getElementById("waveform-visualizer")
    if (!visualizerCanvas) {
      debug("Error: No se encontró el canvas del visualizador")
      return
    }

    visualizerContext = visualizerCanvas.getContext("2d")

    // Ajustar el tamaño del canvas
    const rect = visualizerCanvas.getBoundingClientRect()
    visualizerCanvas.width = rect.width
    visualizerCanvas.height = rect.height

    // Iniciar la animación
    drawWaveform()

    debug("Visualizador inicializado correctamente")
  }

  // Dibujar la forma de onda
  function drawWaveform() {
    if (!analyserNode || !visualizerContext || !visualizerCanvas) return

    // Cancelar cualquier frame de animación anterior
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    // Crear un array para almacenar los datos de la forma de onda
    const bufferLength = analyserNode.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    // Función de animación
    function animate() {
      animationFrameId = requestAnimationFrame(animate)

      // Obtener los datos de la forma de onda
      analyserNode.getByteTimeDomainData(dataArray)

      // Limpiar el canvas
      visualizerContext.fillStyle = document.body.classList.contains("dark-theme")
        ? "rgba(0, 0, 0, 0.2)"
        : "rgba(255, 255, 255, 0.2)"
      visualizerContext.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height)

      // Configurar el estilo de la línea
      visualizerContext.lineWidth = 2
      visualizerContext.strokeStyle = Object.keys(activeOscillators).length > 0 ? "#ffcc00" : "#999"

      // Dibujar la forma de onda
      visualizerContext.beginPath()

      const sliceWidth = visualizerCanvas.width / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0 // Convertir a un rango de 0-2
        const y = (v * visualizerCanvas.height) / 2

        if (i === 0) {
          visualizerContext.moveTo(x, y)
        } else {
          visualizerContext.lineTo(x, y)
        }

        x += sliceWidth
      }

      visualizerContext.lineTo(visualizerCanvas.width, visualizerCanvas.height / 2)
      visualizerContext.stroke()
    }

    // Iniciar la animación
    animate()
  }

  // Actualizar controles desde la configuración actual
  function updateControlsFromSettings() {
    waveformSelect.value = currentSettings.waveform

    frequencySlider.value = currentSettings.frequency
    frequencyValue.textContent = currentSettings.frequency + " Hz"

    filterSlider.value = currentSettings.filter
    filterValue.textContent = currentSettings.filter + " Hz"

    attackSlider.value = currentSettings.attack
    attackValue.textContent = currentSettings.attack + " ms"

    delaySlider.value = currentSettings.delay
    delayValue.textContent = currentSettings.delay + "s"

    lfoFreqSlider.value = currentSettings.lfoFreq
    lfoFreqValue.textContent = currentSettings.lfoFreq + " Hz"

    lfoDepthSlider.value = currentSettings.lfoDepth
    lfoDepthValue.textContent = currentSettings.lfoDepth + "%"

    volumeSlider.value = currentSettings.volume
    volumeValue.textContent = Math.round(currentSettings.volume * 100) + "%"
  }

  // Actualizar nodos de audio desde la configuración actual
  function updateAudioNodesFromSettings() {
    if (!isAudioInitialized) return

    // Actualizar filtro
    if (filterNode) {
      filterNode.frequency.value = currentSettings.filter
    }

    // Actualizar delay
    if (delayNode) {
      delayNode.delayTime.value = currentSettings.delay
    }

    // Actualizar LFO
    if (lfoNode) {
      lfoNode.frequency.value = currentSettings.lfoFreq
    }

    // Actualizar profundidad del LFO
    if (lfoGainNode) {
      lfoGainNode.gain.value = (currentSettings.lfoDepth / 100) * 5000
    }

    // Actualizar volumen
    if (masterGainNode) {
      masterGainNode.gain.value = currentSettings.volume
    }
  }

  // Reproducir un sonido de prueba
  function playTestSound() {
    debug("Reproduciendo sonido de prueba...")
    try {
      playNote("C4", 0.2)
      setTimeout(() => playNote("E4", 0.2), 300)
      setTimeout(() => playNote("G4", 0.2), 600)

      // Actualizar el logo
      migueloLogo.src = migueloActive
      setTimeout(() => {
        migueloLogo.src = migueloInactive
      }, 1000)

      debug("Sonido de prueba reproducido correctamente")
    } catch (error) {
      debug("Error al reproducir sonido de prueba: " + error.message)
    }
  }

  // Reproducir una nota
  function playNote(note, duration = null) {
    if (!isAudioInitialized) return

    try {
      // Obtener la frecuencia de la nota
      let frequency
      if (manualFrequencyMode) {
        frequency = currentSettings.frequency
      } else {
        frequency = typeof note === "string" ? noteToFrequency(note) : note
      }

      // Crear un oscilador
      const oscillator = audioContext.createOscillator()
      oscillator.type = currentSettings.waveform
      oscillator.frequency.value = frequency

      // Crear un nodo de ganancia para la envolvente
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0

      // Conectar el oscilador a la cadena de audio
      oscillator.connect(gainNode)
      gainNode.connect(delayNode)

      // Guardar referencias a los nodos activos
      activeOscillators[note] = oscillator
      activeGainNodes[note] = gainNode

      // Iniciar el oscilador
      oscillator.start()

      // Aplicar la envolvente de ataque
      const now = audioContext.currentTime
      const attackTime = currentSettings.attack / 1000 // Convertir ms a segundos

      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(1, now + attackTime)

      // Actualizar el logo
      migueloLogo.src = migueloActive

      // Si se especifica una duración, programar la detención
      if (duration) {
        setTimeout(() => {
          stopNote(note)
        }, duration * 1000)
      }

      return true
    } catch (error) {
      debug("Error al reproducir nota: " + error.message)
      return false
    }
  }

  // Detener una nota
  function stopNote(note) {
    if (!isAudioInitialized) return

    try {
      const oscillator = activeOscillators[note]
      const gainNode = activeGainNodes[note]

      if (oscillator && gainNode) {
        // Aplicar una pequeña rampa de salida para evitar clics
        const now = audioContext.currentTime
        gainNode.gain.setValueAtTime(gainNode.gain.value, now)
        gainNode.gain.linearRampToValueAtTime(0, now + 0.01)

        // Programar la detención del oscilador
        setTimeout(() => {
          try {
            oscillator.stop()
            oscillator.disconnect()
            gainNode.disconnect()

            // Eliminar las referencias
            delete activeOscillators[note]
            delete activeGainNodes[note]
          } catch (e) {
            // Ignorar errores si el oscilador ya se detuvo
          }
        }, 15)

        // Si no hay más notas activas, cambiar el logo
        if (Object.keys(activeOscillators).length === 1) {
          // Solo queda esta nota
          migueloLogo.src = migueloInactive
        }
      }
    } catch (error) {
      debug("Error al detener nota: " + error.message)
    }
  }

  // Detener todas las notas
  function stopAllNotes() {
    if (!isAudioInitialized) return

    // Detener todos los osciladores activos
    Object.keys(activeOscillators).forEach((note) => {
      try {
        const oscillator = activeOscillators[note]
        const gainNode = activeGainNodes[note]

        if (oscillator && gainNode) {
          // Silenciar inmediatamente
          gainNode.gain.cancelScheduledValues(audioContext.currentTime)
          gainNode.gain.setValueAtTime(0, audioContext.currentTime)

          // Detener y desconectar
          oscillator.stop()
          oscillator.disconnect()
          gainNode.disconnect()

          // Eliminar las referencias
          delete activeOscillators[note]
          delete activeGainNodes[note]
        }
      } catch (e) {
        debug("Error al detener oscilador: " + e.message)
      }
    })

    // Asegurarse de que el logo vuelva a inactivo
    migueloLogo.src = migueloInactive
  }

  // Aplicar un preset
  function applyPreset(presetName) {
    const preset = presets[presetName]
    if (!preset) return

    debug("Aplicando preset: " + presetName)

    // Detener todas las notas activas
    stopAllNotes()

    // Actualizar configuración actual
    currentSettings = { ...preset }

    // Actualizar controles
    updateControlsFromSettings()

    // Actualizar nodos de audio
    updateAudioNodesFromSettings()

    // Reproducir un sonido para demostrar el preset
    playNote(currentSettings.frequency, 0.5)
  }

  // ==================== INICIO DE LA REIMPLEMENTACIÓN DEL ARPEGIADOR ====================

  // Configurar el arpegiador
  function setupArpeggiator() {
    debug("Configurando arpegiador...")

    // Inicializar valores
    arpeggiatorNotes = []
    arpeggiatorEnabled = false
    arpeggiatorRate = Number.parseInt(arpRateSlider.value) || 200
    arpeggiatorPattern = arpPatternSelect.value || "up"
    const arpeggiatorOctaveRange = Number.parseInt(arpOctaveSelect.value) || 1

    // Actualizar el display de velocidad
    arpRateValue.textContent = arpeggiatorRate + " ms"

    // Configurar los event listeners
    arpToggleButton.addEventListener("click", toggleArpeggiator)
    arpRateSlider.addEventListener("input", updateArpeggiatorRate)
    arpPatternSelect.addEventListener("change", updateArpeggiatorPattern)
    arpOctaveSelect.addEventListener("change", updateArpeggiatorOctaveRange)

    // Inicializar el display de notas
    updateArpeggiatorDisplay()

    debug("Arpegiador configurado correctamente")
  }

  // Alternar el estado del arpegiador (activar/desactivar)
  function toggleArpeggiator() {
    arpeggiatorEnabled = !arpeggiatorEnabled

    // Actualizar el texto del botón
    arpToggleButton.textContent = arpeggiatorEnabled
      ? translations[currentLanguage].arpToggle.on
      : translations[currentLanguage].arpToggle.off

    // Actualizar la clase del botón
    arpToggleButton.classList.toggle("active", arpeggiatorEnabled)

    if (arpeggiatorEnabled) {
      // Si hay notas activas, iniciar el arpegiador
      if (arpeggiatorNotes.length > 0) {
        startArpeggiator()
      }
    } else {
      // Detener el arpegiador
      stopArpeggiator()
    }

    debug("Arpegiador: " + (arpeggiatorEnabled ? "activado" : "desactivado"))
  }

  // Actualizar la velocidad del arpegiador
  function updateArpeggiatorRate() {
    arpeggiatorRate = Number.parseInt(arpRateSlider.value)
    arpRateValue.textContent = arpeggiatorRate + " ms"

    // Si el arpegiador está activo, reiniciarlo con la nueva velocidad
    if (arpeggiatorEnabled && arpeggiatorTimer) {
      stopArpeggiator()
      startArpeggiator()
    }

    debug("Velocidad del arpegiador: " + arpeggiatorRate + " ms")
  }

  // Actualizar el patrón del arpegiador
  function updateArpeggiatorPattern() {
    arpeggiatorPattern = arpPatternSelect.value

    // Reiniciar índices
    arpeggiatorIndex = 0
    arpeggiatorDirection = 1
    arpeggiatorOctaveOffset = 0

    debug("Patrón del arpegiador: " + arpeggiatorPattern)
  }

  // Actualizar el rango de octavas del arpegiador
  function updateArpeggiatorOctaveRange() {
    arpeggiatorOctaveRange = Number.parseInt(arpOctaveSelect.value)

    // Reiniciar el offset de octava
    arpeggiatorOctaveOffset = 0

    debug("Rango de octavas del arpegiador: " + arpeggiatorOctaveRange)
  }

  // Iniciar el arpegiador
  function startArpeggiator() {
    // Verificar que el arpegiador esté habilitado y haya notas
    if (!arpeggiatorEnabled || arpeggiatorNotes.length === 0) {
      return
    }

    // Detener cualquier arpegio anterior
    stopArpeggiator()

    // Reiniciar índices
    arpeggiatorIndex = 0
    arpeggiatorOctaveOffset = 0
    arpeggiatorDirection = 1

    debug("Iniciando arpegiador con " + arpeggiatorNotes.length + " notas")

    // Reproducir la primera nota inmediatamente
    playArpeggiatorNote()

    // Configurar el temporizador para las siguientes notas
    arpeggiatorTimer = setInterval(() => {
      // Actualizar el índice para la siguiente nota
      updateArpeggiatorIndex()
      // Reproducir la nota
      playArpeggiatorNote()
    }, arpeggiatorRate)
  }

  // Detener el arpegiador
  function stopArpeggiator() {
    if (arpeggiatorTimer) {
      clearInterval(arpeggiatorTimer)
      arpeggiatorTimer = null

      // Detener cualquier nota que esté sonando
      stopAllNotes()

      debug("Arpegiador detenido")
    }
  }

  // Actualizar el índice del arpegiador según el patrón seleccionado
  function updateArpeggiatorIndex() {
    if (arpeggiatorNotes.length === 0) return

    switch (arpeggiatorPattern) {
      case "up":
        // Patrón ascendente
        arpeggiatorIndex = (arpeggiatorIndex + 1) % arpeggiatorNotes.length

        // Si volvemos al inicio, incrementar la octava
        if (arpeggiatorIndex === 0 && arpeggiatorOctaveRange > 1) {
          arpeggiatorOctaveOffset = (arpeggiatorOctaveOffset + 1) % arpeggiatorOctaveRange
        }
        break

      case "down":
        // Patrón descendente
        arpeggiatorIndex = (arpeggiatorIndex - 1 + arpeggiatorNotes.length) % arpeggiatorNotes.length

        // Si llegamos al final, decrementar la octava
        if (arpeggiatorIndex === arpeggiatorNotes.length - 1 && arpeggiatorOctaveRange > 1) {
          arpeggiatorOctaveOffset = (arpeggiatorOctaveOffset - 1 + arpeggiatorOctaveRange) % arpeggiatorOctaveRange
        }
        break

      case "updown":
        // Patrón arriba/abajo
        arpeggiatorIndex += arpeggiatorDirection

        // Cambiar dirección en los extremos
        if (arpeggiatorIndex >= arpeggiatorNotes.length - 1) {
          arpeggiatorDirection = -1

          // Si llegamos al final y hay más de una octava, incrementar octava
          if (arpeggiatorOctaveRange > 1 && arpeggiatorOctaveOffset < arpeggiatorOctaveRange - 1) {
            arpeggiatorOctaveOffset++
          }
        } else if (arpeggiatorIndex <= 0) {
          arpeggiatorDirection = 1

          // Si volvemos al inicio y no estamos en la octava base, decrementar octava
          if (arpeggiatorOctaveRange > 1 && arpeggiatorOctaveOffset > 0) {
            arpeggiatorOctaveOffset--
          }
        }
        break

      case "random":
        // Patrón aleatorio
        arpeggiatorIndex = Math.floor(Math.random() * arpeggiatorNotes.length)

        // Si hay más de una octava, elegir una octava aleatoria
        if (arpeggiatorOctaveRange > 1) {
          arpeggiatorOctaveOffset = Math.floor(Math.random() * arpeggiatorOctaveRange)
        }
        break
    }
  }

  // Reproducir la nota actual del arpegiador
  function playArpeggiatorNote() {
    if (arpeggiatorNotes.length === 0 || !arpeggiatorEnabled) return

    // Detener cualquier nota anterior
    stopAllNotes()

    // Obtener la nota base
    const baseNote = arpeggiatorNotes[arpeggiatorIndex]

    // Aplicar el desplazamiento de octava si es necesario
    let noteToPlay = baseNote
    if (arpeggiatorOctaveOffset > 0) {
      const noteName = baseNote.slice(0, -1)
      const octave = Number.parseInt(baseNote.slice(-1)) + arpeggiatorOctaveOffset
      noteToPlay = noteName + octave
    }

    // Reproducir la nota
    playNote(noteToPlay)

    // Resaltar la tecla correspondiente en el teclado
    highlightKey(noteToPlay)

    debug("Arpegiador tocando: " + noteToPlay)
  }

  // Resaltar una tecla en el teclado
  function highlightKey(note) {
    pianoKeys.forEach((key) => {
      if (key.dataset.note === note) {
        key.classList.add("active")

        // Quitar la clase después de un tiempo
        setTimeout(() => {
          key.classList.remove("active")
        }, arpeggiatorRate * 0.8)
      }
    })
  }

  // Actualizar el display de notas del arpegiador
  function updateArpeggiatorDisplay() {
    if (!arpNotesDisplay) return

    if (arpeggiatorNotes.length === 0) {
      arpNotesDisplay.textContent = translations[currentLanguage].arpNotesDisplay
    } else {
      const prefix = currentLanguage === "es" ? "Notas: " : "Notes: "
      arpNotesDisplay.textContent = prefix + arpeggiatorNotes.join(", ")
    }
  }

  // Añadir una nota al arpegiador
  function addNoteToArpeggiator(note) {
    // Evitar duplicados
    if (!arpeggiatorNotes.includes(note)) {
      arpeggiatorNotes.push(note)
      updateArpeggiatorDisplay()

      debug("Nota añadida al arpegiador: " + note)

      // Si el arpegiador está activo y esta es la primera nota, iniciarlo
      if (arpeggiatorEnabled && arpeggiatorNotes.length === 1) {
        startArpeggiator()
      }
    }
  }

  // Quitar una nota del arpegiador
  function removeNoteFromArpeggiator(note) {
    const index = arpeggiatorNotes.indexOf(note)
    if (index !== -1) {
      arpeggiatorNotes.splice(index, 1)
      updateArpeggiatorDisplay()

      debug("Nota eliminada del arpegiador: " + note)

      // Si no quedan notas, detener el arpegiador
      if (arpeggiatorNotes.length === 0) {
        stopArpeggiator()
      } else if (arpeggiatorEnabled) {
        // Reiniciar el arpegiador con las notas restantes
        stopArpeggiator()
        startArpeggiator()
      }
    }
  }

  // ==================== FIN DE LA REIMPLEMENTACIÓN DEL ARPEGIADOR ====================

  // Actualizar las notas del teclado según la octava actual
  function updateKeyboardNotes() {
    const whiteKeys = document.querySelectorAll(".white-key")
    const blackKeys = document.querySelectorAll(".black-key")

    // Actualizar las notas de las teclas blancas
    const whiteNoteNames = ["C", "D", "E", "F", "G", "A", "B", "C"]
    whiteKeys.forEach((key, index) => {
      if (index < whiteNoteNames.length) {
        const octaveToUse = index === whiteNoteNames.length - 1 ? currentOctave + 1 : currentOctave
        const newNote = whiteNoteNames[index] + octaveToUse
        key.dataset.note = newNote
      }
    })

    // Actualizar las notas de las teclas negras
    const blackNoteNames = ["C#", "D#", "F#", "G#", "A#"]
    blackKeys.forEach((key, index) => {
      if (index < blackNoteNames.length) {
        const newNote = blackNoteNames[index] + currentOctave
        key.dataset.note = newNote
      }
    })

    // Actualizar el display de octava
    currentOctaveDisplay.textContent = translations[currentLanguage].octaveDisplay + currentOctave

    // Actualizar el mapeo del teclado físico
    updateKeyboardMap()
  }

  // Actualizar el mapeo del teclado físico
  let keyboardMap = {}
  function updateKeyboardMap() {
    // Mapeo de teclas físicas a notas musicales
    keyboardMap = {
      a: "C" + currentOctave,
      w: "C#" + currentOctave,
      s: "D" + currentOctave,
      e: "D#" + currentOctave,
      d: "E" + currentOctave,
      f: "F" + currentOctave,
      t: "F#" + currentOctave,
      g: "G" + currentOctave,
      y: "G#" + currentOctave,
      h: "A" + currentOctave,
      u: "A#" + currentOctave,
      j: "B" + currentOctave,
      k: "C" + (currentOctave + 1),
    }
  }

  // Configurar los controles
  function setupControls() {
    debug("Configurando controles...")

    // Configurar el botón de idioma
    languageButton.addEventListener("click", () => {
      const newLang = currentLanguage === "es" ? "en" : "es"
      changeLanguage(newLang)
      debug("Idioma cambiado a: " + newLang)
    })

    // Configurar el botón de modo de frecuencia
    frequencyModeToggle.addEventListener("click", function () {
      manualFrequencyMode = !manualFrequencyMode
      this.textContent = manualFrequencyMode
        ? translations[currentLanguage].frequencyMode.manual
        : translations[currentLanguage].frequencyMode.notes
      this.classList.toggle("manual-mode", manualFrequencyMode)

      // Habilitar o deshabilitar el control de frecuencia según el modo
      frequencySlider.disabled = !manualFrequencyMode

      debug("Modo de frecuencia cambiado a: " + (manualFrequencyMode ? "Manual" : "Notas"))
    })

    // Waveform
    waveformSelect.addEventListener("change", function () {
      currentSettings.waveform = this.value
      debug("Tipo de onda cambiado a: " + this.value)

      // Actualizar los osciladores activos
      Object.values(activeOscillators).forEach((osc) => {
        osc.type = currentSettings.waveform
      })
    })

    // Frequency
    frequencySlider.addEventListener("input", function () {
      const freq = Number.parseInt(this.value)
      frequencyValue.textContent = freq + " Hz"
      currentSettings.frequency = freq
      debug("Frecuencia cambiada a: " + freq + " Hz")

      // Si estamos en modo manual y hay osciladores activos, actualizar su frecuencia
      if (manualFrequencyMode) {
        Object.values(activeOscillators).forEach((osc) => {
          osc.frequency.value = freq
        })
      }
    })

    // Filter
    filterSlider.addEventListener("input", function () {
      const freq = Number.parseInt(this.value)
      filterValue.textContent = freq + " Hz"
      currentSettings.filter = freq

      // Actualizar el filtro
      if (filterNode) {
        filterNode.frequency.value = freq
      }
    })

    // Attack
    attackSlider.addEventListener("input", function () {
      const attackMs = Number.parseInt(this.value)
      attackValue.textContent = attackMs + " ms"
      currentSettings.attack = attackMs
      debug("Tiempo de ataque cambiado a: " + attackMs + " ms")
    })

    // Delay
    delaySlider.addEventListener("input", function () {
      const time = Number.parseFloat(this.value)
      delayValue.textContent = time + "s"
      currentSettings.delay = time

      // Actualizar el delay
      if (delayNode) {
        delayNode.delayTime.value = time
      }
    })

    // LFO Frequency
    lfoFreqSlider.addEventListener("input", function () {
      const freq = Number.parseFloat(this.value)
      lfoFreqValue.textContent = freq + " Hz"
      currentSettings.lfoFreq = freq

      // Actualizar la frecuencia del LFO
      if (lfoNode) {
        lfoNode.frequency.value = freq
      }
    })

    // LFO Depth
    lfoDepthSlider.addEventListener("input", function () {
      const depth = Number.parseInt(this.value)
      lfoDepthValue.textContent = depth + "%"
      currentSettings.lfoDepth = depth

      // Actualizar la profundidad del LFO
      if (lfoGainNode) {
        lfoGainNode.gain.value = (depth / 100) * 5000
      }
    })

    // Volume
    volumeSlider.addEventListener("input", function () {
      const vol = Number.parseFloat(this.value)
      volumeValue.textContent = Math.round(vol * 100) + "%"
      currentSettings.volume = vol

      // Actualizar el volumen
      if (masterGainNode) {
        masterGainNode.gain.value = vol
      }
    })

    // Presets
    presetButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const presetName = this.dataset.preset
        applyPreset(presetName)
      })
    })

    // Configurar los botones de octava
    octaveUpBtn.addEventListener("click", () => {
      if (currentOctave < 8) {
        currentOctave++
        updateKeyboardNotes()
        debug("Octava subida a: " + currentOctave)
      }
    })

    octaveDownBtn.addEventListener("click", () => {
      if (currentOctave > 1) {
        currentOctave--
        updateKeyboardNotes()
        debug("Octava bajada a: " + currentOctave)
      }
    })

    // Configurar el botón de stop
    stopButton.addEventListener("click", () => {
      debug("Botón de stop presionado - Deteniendo sintetizador completamente")

      // Detener todas las notas activas
      stopAllNotes()

      // Detener el arpegiador si está activo
      if (arpeggiatorEnabled) {
        stopArpeggiator()
        // Mantener el arpegiador habilitado pero sin notas activas
        arpeggiatorNotes = []
        updateArpeggiatorDisplay()
      }

      // Detener y desconectar el LFO si existe
      if (lfoNode) {
        try {
          // Guardar referencia al nodo actual
          const currentLfoNode = lfoNode
          const currentLfoGainNode = lfoGainNode

          // Crear nuevos nodos
          lfoNode = audioContext.createOscillator()
          lfoNode.frequency.value = currentSettings.lfoFreq

          lfoGainNode = audioContext.createGain()
          lfoGainNode.gain.value = (currentSettings.lfoDepth / 100) * 5000

          // Conectar los nuevos nodos
          lfoNode.connect(lfoGainNode)
          lfoGainNode.connect(filterNode.frequency)
          lfoNode.start()

          // Detener y desconectar los nodos anteriores
          currentLfoNode.stop()
          currentLfoNode.disconnect()
          currentLfoGainNode.disconnect()
        } catch (e) {
          debug("Error al reiniciar LFO: " + e.message)
        }
      }

      // Suspender el contexto de audio para detener todo procesamiento de audio
      if (audioContext && audioContext.state === "running") {
        audioContext
          .suspend()
          .then(() => {
            debug("Contexto de audio suspendido")

            // Reanudar el contexto después de un breve momento para permitir futuras interacciones
            setTimeout(() => {
              audioContext.resume().then(() => {
                debug("Contexto de audio reanudado")
              })
            }, 100)
          })
          .catch((err) => {
            debug("Error al suspender contexto de audio: " + err.message)
          })
      }

      // Limpiar cualquier animación del visualizador
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        // Reiniciar la animación
        drawWaveform()
      }

      // Efecto visual para indicar que se ha detenido todo
      migueloLogo.src = migueloInactive

      // Quitar la clase active de todas las teclas del piano
      pianoKeys.forEach((key) => {
        key.classList.remove("active")
      })

      // Limpiar el conjunto de teclas presionadas
      pressedKeys.clear()

      debug("Sintetizador detenido completamente")
    })

    // Configurar eventos para cada tecla del piano
    pianoKeys.forEach((key) => {
      // Función para activar la tecla
      const activateKey = (note) => {
        key.classList.add("active")

        // Si el arpegiador está activado, añadir la nota al arpegiador
        if (arpeggiatorEnabled) {
          addNoteToArpeggiator(note)
        } else {
          playNote(note)
        }
      }

      // Función para desactivar la tecla
      const deactivateKey = (note) => {
        key.classList.remove("active")

        // Si el arpegiador está activado, quitar la nota del arpegiador
        if (arpeggiatorEnabled) {
          removeNoteFromArpeggiator(note)
        } else {
          stopNote(note)
        }
      }

      // Eventos de mouse
      key.addEventListener("mousedown", function () {
        const note = this.dataset.note
        activateKey(note)
      })

      key.addEventListener("mouseup", function () {
        const note = this.dataset.note
        deactivateKey(note)
      })

      key.addEventListener("mouseleave", function () {
        if (this.classList.contains("active")) {
          const note = this.dataset.note
          deactivateKey(note)
        }
      })

      // Eventos táctiles
      key.addEventListener("touchstart", function (e) {
        e.preventDefault()
        const note = this.dataset.note
        activateKey(note)
        debug("Tecla tocada: " + note)
      })

      key.addEventListener("touchend", function (e) {
        e.preventDefault()
        const note = this.dataset.note
        deactivateKey(note)
        debug("Tecla liberada: " + note)
      })

      key.addEventListener("touchcancel", function (e) {
        e.preventDefault()
        const note = this.dataset.note
        deactivateKey(note)
      })
    })

    // Eventos de teclado
    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase()

      if (keyboardMap[key] && !pressedKeys.has(key)) {
        pressedKeys.add(key)
        const note = keyboardMap[key]

        // Encontrar y activar la tecla visual correspondiente
        pianoKeys.forEach((keyElement) => {
          if (keyElement.dataset.note === note) {
            keyElement.classList.add("active")
          }
        })

        // Si el arpegiador está activado, añadir la nota al arpegiador
        if (arpeggiatorEnabled) {
          addNoteToArpeggiator(note)
        } else {
          playNote(note)
        }
      }
    })

    window.addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase()

      if (keyboardMap[key]) {
        pressedKeys.delete(key)
        const note = keyboardMap[key]

        // Encontrar y desactivar la tecla visual correspondiente
        pianoKeys.forEach((keyElement) => {
          if (keyElement.dataset.note === note) {
            keyElement.classList.remove("active")
          }
        })

        // Si el arpegiador está activado, quitar la nota del arpegiador
        if (arpeggiatorEnabled) {
          removeNoteFromArpeggiator(note)
        } else {
          stopNote(note)
        }
      }
    })

    // Cambio de tema
    themeButton.addEventListener("click", function () {
      document.body.classList.toggle("dark-theme")
      this.textContent = document.body.classList.contains("dark-theme")
        ? translations[currentLanguage].themeButton.dark
        : translations[currentLanguage].themeButton.light
    })

    // Redimensionar el visualizador cuando cambia el tamaño de la ventana
    window.addEventListener("resize", () => {
      if (visualizerCanvas) {
        const rect = visualizerCanvas.getBoundingClientRect()
        visualizerCanvas.width = rect.width
        visualizerCanvas.height = rect.height
      }
    })

    // Añadir un evento de visibilidad para limpiar cuando la página pierde el foco
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopAllNotes()
        if (arpeggiatorTimer) {
          clearInterval(arpeggiatorTimer)
          arpeggiatorTimer = null
        }
      }
    })

    debug("Controles configurados correctamente")
  }

  // Iniciar el sintetizador cuando se haga clic en el botón de inicio
  startButton.addEventListener("click", () => {
    debug("Botón de inicio presionado")
    initSynth()
  })

  // Deshabilitar el zoom en dispositivos móviles
  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    },
    { passive: false },
  )

  // Actualizar los textos de la interfaz con el idioma actual
  updateUITexts()

  debug("Script cargado completamente")
})
