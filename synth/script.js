// Función para mostrar mensajes de depuración
function debug(message) {
  console.log(message)
  const debugElement = document.getElementById("debug")
  debugElement.innerHTML += message + "<br>"
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
  debug("DOM cargado")

  // Elementos del DOM
  const startOverlay = document.getElementById("start-overlay")
  const startButton = document.getElementById("start-button")
  const migueloLogo = document.getElementById("miguelo-logo")
  const themeButton = document.getElementById("theme-button")
  const waveformSelect = document.getElementById("waveform")
  const frequencySlider = document.getElementById("frequency")
  const frequencyValue = document.getElementById("frequency-value")
  const filterSlider = document.getElementById("filter")
  const filterValue = document.getElementById("filter-value")
  const distortionSlider = document.getElementById("distortion")
  const distortionValue = document.getElementById("distortion-value")
  const delaySlider = document.getElementById("delay")
  const delayValue = document.getElementById("delay-value")
  const lfoFreqSlider = document.getElementById("lfo-freq")
  const lfoFreqValue = document.getElementById("lfo-freq-value")
  const lfoDepthSlider = document.getElementById("lfo-depth")
  const lfoDepthValue = document.getElementById("lfo-depth-value")
  const volumeSlider = document.getElementById("volume")
  const volumeValue = document.getElementById("volume-value")
  const presetButtons = document.querySelectorAll(".preset-btn")

  // Elementos del nuevo teclado táctil
  const pianoKeys = document.querySelectorAll(".piano-key")
  const octaveUpBtn = document.getElementById("octave-up")
  const octaveDownBtn = document.getElementById("octave-down")
  const currentOctaveDisplay = document.getElementById("current-octave")

  // Elementos del arpegiador
  const arpToggleButton = document.getElementById("arp-toggle")
  const arpRateSlider = document.getElementById("arp-rate")
  const arpRateValue = document.getElementById("arp-rate-value")
  const arpPatternSelect = document.getElementById("arp-pattern")
  const arpOctaveSelect = document.getElementById("arp-octave")
  const arpNotesDisplay = document.getElementById("arp-notes-display")

  // Ocultar el botón de guardar preset si existe
  const savePresetButton = document.getElementById("save-preset-btn")
  if (savePresetButton) {
    savePresetButton.style.display = "none"
  }

  // Imágenes de Miguelo con rutas locales
  const migueloInactive = "./images/miguelo-inactive.png"
  const migueloActive = "./images/miguelo-active.png"

  // Variables para Web Audio API
  let audioContext = null
  let oscillator = null
  let gainNode = null
  let filterNode = null
  let distortionNode = null
  let delayNode = null
  let feedbackNode = null
  let lfoNode = null
  let lfoGainNode = null
  let analyserNode = null
  let visualizerCanvas = null
  let visualizerContext = null
  let animationFrameId = null
  let isPlaying = false

  // Configuración actual
  let currentSettings = {
    waveform: "sine",
    frequency: 440,
    filter: 20000,
    distortion: 0,
    delay: 0,
    lfoFreq: 0,
    lfoDepth: 0,
    volume: 0.5,
  }

  // Modo de frecuencia manual (usar la frecuencia del control en lugar de la nota)
  let manualFrequencyMode = false

  // Variable para la octava actual (4 es la octava por defecto)
  let currentOctave = 4

  // Variables para el arpegiador
  let arpeggiatorEnabled = false
  let arpeggiatorRate = 200 // ms entre notas
  let arpeggiatorPattern = "up" // up, down, updown, random
  let arpeggiatorOctaveRange = 1 // Número de octavas que abarca el arpegiador
  const arpeggiatorNotes = [] // notas actualmente presionadas
  let arpeggiatorIndex = 0 // índice actual en el arpegio
  let arpeggiatorTimer = null // temporizador para el arpegiador
  let arpeggiatorDirection = 1 // Dirección del arpegiador (1 = arriba, -1 = abajo)
  let arpeggiatorOctaveOffset = 0 // Desplazamiento de octava actual

  // Presets
  const presets = {
    "espacio-glitch": {
      waveform: "square",
      frequency: 220,
      filter: 2000,
      distortion: 30,
      delay: 0,
      lfoFreq: 5.5,
      lfoDepth: 70,
      volume: 0.4,
    },
    "robot-malvado": {
      waveform: "sawtooth",
      frequency: 110,
      filter: 800,
      distortion: 80,
      delay: 0,
      lfoFreq: 8,
      lfoDepth: 40,
      volume: 0.6,
    },
    "eco-alienigena": {
      waveform: "sine",
      frequency: 440,
      filter: 5000,
      distortion: 10,
      delay: 0,
      lfoFreq: 0.2,
      lfoDepth: 90,
      volume: 0.5,
    },
    "laser-funky": {
      waveform: "sawtooth",
      frequency: 880,
      filter: 3000,
      distortion: 20,
      delay: 0,
      lfoFreq: 2,
      lfoDepth: 60,
      volume: 0.45,
    },
    "ruido-caotico": {
      waveform: "square",
      frequency: 55,
      filter: 10000,
      distortion: 90,
      delay: 0,
      lfoFreq: 15,
      lfoDepth: 100,
      volume: 0.35,
    },
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

  // Función para crear una curva de distorsión
  function createDistortionCurve(amount) {
    if (amount <= 0) return null

    const samples = 44100
    const curve = new Float32Array(samples)
    const deg = Math.PI / 180
    const distortionAmount = (amount / 100) * 50 // Ajustar el rango

    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1
      curve[i] = ((3 + distortionAmount) * x * 20 * deg) / (Math.PI + distortionAmount * Math.abs(x))
    }

    return curve
  }

  // Inicializar el sintetizador
  function initSynth() {
    debug("Iniciando sintetizador...")

    try {
      // Crear contexto de audio
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      debug("Contexto de audio creado correctamente")

      // Crear nodos de audio
      gainNode = audioContext.createGain()
      gainNode.gain.value = currentSettings.volume
      gainNode.connect(audioContext.destination)

      filterNode = audioContext.createBiquadFilter()
      filterNode.type = "lowpass"
      filterNode.frequency.value = currentSettings.filter
      filterNode.connect(gainNode)

      distortionNode = audioContext.createWaveShaper()
      distortionNode.curve = createDistortionCurve(currentSettings.distortion)
      distortionNode.connect(filterNode)

      delayNode = audioContext.createDelay(5.0)
      delayNode.delayTime.value = currentSettings.delay
      delayNode.connect(distortionNode)

      feedbackNode = audioContext.createGain()
      feedbackNode.gain.value = currentSettings.delay * 0.5
      delayNode.connect(feedbackNode)
      feedbackNode.connect(delayNode)

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
      gainNode.connect(analyserNode)

      // Inicializar el visualizador
      initVisualizer()

      debug("Sintetizador inicializado correctamente")

      // Ocultar el overlay de inicio
      startOverlay.style.display = "none"

      // Actualizar controles con valores iniciales
      updateControlsFromSettings()

      // Reproducir un sonido de prueba
      playTestSound()

      // Configurar los controles
      setupControls()

      // Añadir un botón para alternar entre modo manual y modo de notas
      addFrequencyModeToggle()

      // Configurar el arpegiador
      setupArpeggiator()

      // Actualizar las notas del teclado según la octava actual
      updateKeyboardNotes()

      // Ocultar el botón de guardar preset si existe
      const savePresetButton = document.getElementById("save-preset-btn")
      if (savePresetButton) {
        savePresetButton.style.display = "none"
      }
    } catch (error) {
      debug("Error al inicializar el sintetizador: " + error.message)
      alert("Error al inicializar el sintetizador. Por favor, recarga la página.")
    }
  }

  // Inicializar el visualizador de forma de onda
  function initVisualizer() {
    visualizerCanvas = document.getElementById("waveform-visualizer")
    if (!visualizerCanvas) {
      debug("Error: No se encontró el canvas del visualizador")
      return
    }

    visualizerContext = visualizerCanvas.getContext("2d")

    // Ajustar el tamaño del canvas para que coincida con su tamaño en pantalla
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
      visualizerContext.strokeStyle = isPlaying ? "#ffcc00" : "#999"

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

  // Configurar el arpegiador
  function setupArpeggiator() {
    // Inicializar los valores del arpegiador
    arpRateValue.textContent = arpeggiatorRate + " ms"

    // Configurar los event listeners
    arpToggleButton.addEventListener("click", () => {
      arpeggiatorEnabled = !arpeggiatorEnabled
      arpToggleButton.textContent = arpeggiatorEnabled ? "ARPEGIADOR: ON" : "ARPEGIADOR: OFF"
      arpToggleButton.classList.toggle("active", arpeggiatorEnabled)

      if (arpeggiatorEnabled) {
        startArpeggiator()
      } else {
        stopArpeggiator()
      }

      debug("Arpegiador: " + (arpeggiatorEnabled ? "activado" : "desactivado"))
    })

    arpRateSlider.addEventListener("input", () => {
      arpeggiatorRate = Number.parseInt(arpRateSlider.value)
      arpRateValue.textContent = arpeggiatorRate + " ms"

      // Si el arpegiador está activo, reiniciarlo con la nueva velocidad
      if (arpeggiatorEnabled && arpeggiatorNotes.length > 0) {
        stopArpeggiator()
        startArpeggiator()
      }

      debug("Velocidad del arpegiador: " + arpeggiatorRate + " ms")
    })

    arpPatternSelect.addEventListener("change", () => {
      arpeggiatorPattern = arpPatternSelect.value

      // Si el arpegiador está activo, reiniciar el índice
      if (arpeggiatorEnabled) {
        arpeggiatorIndex = 0
        arpeggiatorOctaveOffset = 0
      }

      debug("Patrón del arpegiador: " + arpeggiatorPattern)
    })

    arpOctaveSelect.addEventListener("change", () => {
      arpeggiatorOctaveRange = Number.parseInt(arpOctaveSelect.value)

      // Si el arpegiador está activo, reiniciar el índice
      if (arpeggiatorEnabled) {
        arpeggiatorIndex = 0
        arpeggiatorOctaveOffset = 0
      }

      debug("Rango de octavas del arpegiador: " + arpeggiatorOctaveRange)
    })

    // Inicializar el display de notas
    updateArpeggiatorDisplay()
  }

  // Iniciar el arpegiador
  function startArpeggiator() {
    if (!arpeggiatorEnabled || arpeggiatorNotes.length === 0) return

    stopArpeggiator() // Detener cualquier arpegio anterior

    arpeggiatorIndex = 0
    arpeggiatorOctaveOffset = 0
    playArpeggiatorNote()

    arpeggiatorTimer = setInterval(() => {
      updateArpeggiatorIndex()
      playArpeggiatorNote()
    }, arpeggiatorRate)
  }

  // Detener el arpegiador
  function stopArpeggiator() {
    if (arpeggiatorTimer) {
      clearInterval(arpeggiatorTimer)
      arpeggiatorTimer = null
    }

    // Detener cualquier nota que esté sonando
    stopNote()
  }

  // Actualizar el índice del arpegiador según el patrón
  function updateArpeggiatorIndex() {
    if (arpeggiatorNotes.length === 0) return

    switch (arpeggiatorPattern) {
      case "up":
        arpeggiatorIndex = (arpeggiatorIndex + 1) % arpeggiatorNotes.length
        if (arpeggiatorIndex === 0) {
          arpeggiatorOctaveOffset = (arpeggiatorOctaveOffset + 1) % arpeggiatorOctaveRange
        }
        break
      case "down":
        arpeggiatorIndex = (arpeggiatorIndex - 1 + arpeggiatorNotes.length) % arpeggiatorNotes.length
        if (arpeggiatorIndex === arpeggiatorNotes.length - 1) {
          arpeggiatorOctaveOffset = (arpeggiatorOctaveOffset - 1 + arpeggiatorOctaveRange) % arpeggiatorOctaveRange
        }
        break
      case "updown":
        // Implementación de arriba/abajo
        if (arpeggiatorIndex >= arpeggiatorNotes.length - 1 && arpeggiatorDirection === 1) {
          if (arpeggiatorOctaveOffset < arpeggiatorOctaveRange - 1) {
            arpeggiatorOctaveOffset++
          } else {
            arpeggiatorDirection = -1
          }
        } else if (arpeggiatorIndex <= 0 && arpeggiatorDirection === -1) {
          if (arpeggiatorOctaveOffset > 0) {
            arpeggiatorOctaveOffset--
          } else {
            arpeggiatorDirection = 1
          }
        }
        arpeggiatorIndex += arpeggiatorDirection
        break
      case "random":
        arpeggiatorIndex = Math.floor(Math.random() * arpeggiatorNotes.length)
        if (arpeggiatorOctaveRange > 1) {
          arpeggiatorOctaveOffset = Math.floor(Math.random() * arpeggiatorOctaveRange)
        }
        break
    }
  }

  // Reproducir la nota actual del arpegiador
  function playArpeggiatorNote() {
    if (arpeggiatorNotes.length === 0) return

    const note = arpeggiatorNotes[arpeggiatorIndex]

    // Aplicar el desplazamiento de octava
    if (arpeggiatorOctaveOffset > 0) {
      const noteName = note.slice(0, -1)
      const octave = Number.parseInt(note.slice(-1)) + arpeggiatorOctaveOffset
      const transposedNote = noteName + octave
      playNote(transposedNote)

      // Resaltar la tecla correspondiente (aunque no esté visible en el teclado)
      debug("Arpegiador tocando: " + transposedNote)
    } else {
      playNote(note)

      // Resaltar la tecla correspondiente
      pianoKeys.forEach((key) => {
        if (key.dataset.note === note) {
          key.classList.add("active")
          setTimeout(() => {
            key.classList.remove("active")
          }, arpeggiatorRate * 0.8) // Quitar la clase active un poco antes de la siguiente nota
        }
      })
    }
  }

  // Actualizar el display de notas del arpegiador
  function updateArpeggiatorDisplay() {
    if (!arpNotesDisplay) return

    if (arpeggiatorNotes.length === 0) {
      arpNotesDisplay.textContent = "No hay notas activas"
    } else {
      arpNotesDisplay.textContent = "Notas: " + arpeggiatorNotes.join(", ")
    }
  }

  // Añadir una nota al arpegiador
  function addNoteToArpeggiator(note) {
    if (!arpeggiatorNotes.includes(note)) {
      arpeggiatorNotes.push(note)
      updateArpeggiatorDisplay()

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

  // Añadir un botón para alternar entre modo manual y modo de notas
  function addFrequencyModeToggle() {
    const toggleButton = document.createElement("button")
    toggleButton.textContent = manualFrequencyMode ? "MODO: FRECUENCIA MANUAL" : "MODO: NOTAS MUSICALES"
    toggleButton.style.padding = "10px 15px"
    toggleButton.style.backgroundColor = manualFrequencyMode ? "#ffcc00" : "#43e8d8"
    toggleButton.style.color = "#000"
    toggleButton.style.border = "none"
    toggleButton.style.borderRadius = "5px"
    toggleButton.style.fontFamily = "Orbitron, sans-serif"
    toggleButton.style.fontSize = "14px"
    toggleButton.style.cursor = "pointer"
    toggleButton.style.margin = "0 auto 15px auto"
    toggleButton.style.display = "block"
    toggleButton.style.width = "fit-content"

    toggleButton.addEventListener("click", function () {
      manualFrequencyMode = !manualFrequencyMode
      this.textContent = manualFrequencyMode ? "MODO: FRECUENCIA MANUAL" : "MODO: NOTAS MUSICALES"
      this.style.backgroundColor = manualFrequencyMode ? "#ffcc00" : "#43e8d8"
      debug("Modo de frecuencia cambiado a: " + (manualFrequencyMode ? "Manual" : "Notas"))
    })

    // Insertar el botón justo antes del contenedor del teclado
    const keyboardContainer = document.querySelector(".keyboard-container")
    if (keyboardContainer) {
      keyboardContainer.insertBefore(toggleButton, keyboardContainer.firstChild)
    } else {
      // Si no se encuentra el contenedor del teclado, añadirlo al contenedor del sintetizador
      document.querySelector(".synth-container").appendChild(toggleButton)
    }
  }

  // Actualizar las notas del teclado según la octava actual
  function updateKeyboardNotes() {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C"]
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
    currentOctaveDisplay.textContent = "Octava: " + currentOctave

    // Actualizar el mapeo del teclado físico
    updateKeyboardMap()
  }

  // Inicializar el mapeo del teclado físico
  let keyboardMap = {}

  // Actualizar el mapeo del teclado físico
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

  // Actualizar controles desde la configuración actual
  function updateControlsFromSettings() {
    waveformSelect.value = currentSettings.waveform

    frequencySlider.value = currentSettings.frequency
    frequencyValue.textContent = currentSettings.frequency + " Hz"

    filterSlider.value = currentSettings.filter
    filterValue.textContent = currentSettings.filter + " Hz"

    distortionSlider.value = currentSettings.distortion
    distortionValue.textContent = currentSettings.distortion + "%"

    delaySlider.value = currentSettings.delay
    delayValue.textContent = currentSettings.delay + "s"

    lfoFreqSlider.value = currentSettings.lfoFreq
    lfoFreqValue.textContent = currentSettings.lfoFreq + " Hz"

    lfoDepthSlider.value = currentSettings.lfoDepth
    lfoDepthValue.textContent = currentSettings.lfoDepth + "%"

    volumeSlider.value = currentSettings.volume
    volumeValue.textContent = Math.round(currentSettings.volume * 100) + "%"
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

  // Función para tocar una nota
  function playNote(note, duration = null) {
    if (!audioContext) return

    // Si ya hay un oscilador sonando, detenerlo
    stopNote()

    try {
      // Crear un nuevo oscilador
      oscillator = audioContext.createOscillator()

      // Aplicar la configuración actual al oscilador
      oscillator.type = currentSettings.waveform

      // Establecer la frecuencia según el modo
      let noteFreq

      if (manualFrequencyMode) {
        // Usar la frecuencia del control deslizante
        noteFreq = currentSettings.frequency
        debug("Usando frecuencia manual: " + noteFreq + " Hz")
      } else {
        // Usar la frecuencia de la nota
        if (typeof note === "string") {
          noteFreq = noteToFrequency(note)
        } else if (typeof note === "number") {
          noteFreq = note
        } else {
          noteFreq = currentSettings.frequency
        }
        debug("Usando frecuencia de nota: " + noteFreq + " Hz")
      }

      oscillator.frequency.value = noteFreq

      // Conectar el oscilador a la cadena de efectos
      oscillator.connect(delayNode)

      // Iniciar el oscilador
      oscillator.start()
      isPlaying = true

      // Actualizar el logo
      migueloLogo.src = migueloActive

      // Si se especifica una duración, programar la detención
      if (duration) {
        setTimeout(() => {
          stopNote()
        }, duration * 1000)
      }
    } catch (error) {
      debug("Error al reproducir nota: " + error.message)
    }
  }

  // Función para detener la nota actual
  function stopNote() {
    if (oscillator && isPlaying) {
      try {
        oscillator.stop()
        oscillator.disconnect()
        oscillator = null
        isPlaying = false

        // Volver al logo inactivo
        migueloLogo.src = migueloInactive
      } catch (error) {
        debug("Error al detener nota: " + error.message)
      }
    }
  }

  // Aplicar un preset
  function applyPreset(presetName) {
    const preset = presets[presetName]
    if (!preset) return

    debug("Aplicando preset: " + presetName)

    // Actualizar configuración actual
    currentSettings = { ...preset }

    // Forzar delay a 0 como solicitado
    currentSettings.delay = 0

    // Actualizar controles
    updateControlsFromSettings()

    // Actualizar nodos de audio
    updateAudioNodesFromSettings()

    // Reproducir un sonido para demostrar el preset
    playNote(currentSettings.frequency, 0.3)
  }

  // Actualizar nodos de audio desde la configuración actual
  function updateAudioNodesFromSettings() {
    if (!audioContext) return

    // Actualizar filtro
    if (filterNode) {
      filterNode.frequency.value = currentSettings.filter
    }

    // Actualizar distorsión
    if (distortionNode) {
      distortionNode.curve = createDistortionCurve(currentSettings.distortion)
    }

    // Actualizar delay
    if (delayNode) {
      delayNode.delayTime.value = currentSettings.delay
    }

    // Actualizar feedback del delay
    if (feedbackNode) {
      feedbackNode.gain.value = currentSettings.delay * 0.5
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
    if (gainNode) {
      gainNode.gain.value = currentSettings.volume
    }
  }

  // Configurar los controles
  function setupControls() {
    debug("Configurando controles...")

    // Waveform
    waveformSelect.addEventListener("change", function () {
      // Actualizar la configuración actual
      currentSettings.waveform = this.value
      debug("Tipo de onda cambiado a: " + this.value)

      // Si hay un oscilador activo, actualizar su tipo
      if (oscillator) {
        oscillator.type = this.value
      }
    })

    // Frequency
    frequencySlider.addEventListener("input", function () {
      const freq = Number.parseInt(this.value)
      frequencyValue.textContent = freq + " Hz"

      // Actualizar la configuración actual
      currentSettings.frequency = freq
      debug("Frecuencia cambiada a: " + freq + " Hz")

      // Si hay un oscilador activo y estamos en modo manual, actualizar su frecuencia
      if (oscillator && manualFrequencyMode) {
        oscillator.frequency.value = freq
      }
    })

    // Filter
    filterSlider.addEventListener("input", function () {
      const freq = Number.parseInt(this.value)
      filterValue.textContent = freq + " Hz"

      // Actualizar la configuración actual
      currentSettings.filter = freq

      // Actualizar el filtro
      if (filterNode) {
        filterNode.frequency.value = freq
      }
    })

    // Distortion
    distortionSlider.addEventListener("input", function () {
      const amount = Number.parseInt(this.value)
      distortionValue.textContent = amount + "%"

      // Actualizar la configuración actual
      currentSettings.distortion = amount

      // Actualizar la distorsión
      if (distortionNode) {
        distortionNode.curve = createDistortionCurve(amount)
      }
    })

    // Delay
    delaySlider.addEventListener("input", function () {
      const time = Number.parseFloat(this.value)
      delayValue.textContent = time + "s"

      // Actualizar la configuración actual
      currentSettings.delay = time

      // Actualizar el delay
      if (delayNode) {
        delayNode.delayTime.value = time
      }

      // Actualizar el feedback del delay
      if (feedbackNode) {
        feedbackNode.gain.value = time * 0.5
      }
    })

    // LFO Frequency
    lfoFreqSlider.addEventListener("input", function () {
      const freq = Number.parseFloat(this.value)
      lfoFreqValue.textContent = freq + " Hz"

      // Actualizar la configuración actual
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

      // Actualizar la configuración actual
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

      // Actualizar la configuración actual
      currentSettings.volume = vol

      // Actualizar el volumen
      if (gainNode) {
        gainNode.gain.value = vol
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
          stopNote()
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

    // Inicializar el mapeo del teclado físico
    updateKeyboardMap()

    const pressedKeys = new Set()

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
        }

        // Si no hay más teclas presionadas y el arpegiador no está activado, detener el sonido
        if (pressedKeys.size === 0 && !arpeggiatorEnabled) {
          stopNote()
        }
      }
    })

    // Cambio de tema
    themeButton.addEventListener("click", function () {
      document.body.classList.toggle("dark-theme")
      this.textContent = document.body.classList.contains("dark-theme") ? "MODO CLARO" : "MODO OSCURO"
    })

    // Redimensionar el visualizador cuando cambia el tamaño de la ventana
    window.addEventListener("resize", () => {
      if (visualizerCanvas) {
        const rect = visualizerCanvas.getBoundingClientRect()
        visualizerCanvas.width = rect.width
        visualizerCanvas.height = rect.height
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

  debug("Script cargado completamente")
})
