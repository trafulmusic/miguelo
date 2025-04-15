/**
 * Tone.js
 * Versión mínima para el sintetizador Miguelo
 */

// Crear un namespace global para Tone
window.Tone = {};

// AudioContext
Tone.context = new (window.AudioContext || window.webkitAudioContext)();

// Clase base para todos los nodos de audio
Tone.ToneAudioNode = class {
    constructor() {
        this.output = Tone.context.createGain();
    }
    
    connect(destination) {
        this.output.connect(destination instanceof Tone.ToneAudioNode ? destination.input : destination);
        return destination;
    }
    
    toDestination() {
        this.connect(Tone.context.destination);
        return this;
    }
};

// Oscilador
Tone.Oscillator = class extends Tone.ToneAudioNode {
    constructor(frequency = 440, type = 'sine') {
        super();
        this.oscillator = Tone.context.createOscillator();
        this.oscillator.type = type;
        this.oscillator.frequency.value = frequency;
        this.oscillator.connect(this.output);
        this._type = type;
        this._frequency = frequency;
        this.input = this.oscillator;
    }
    
    start() {
        this.oscillator.start();
        return this;
    }
    
    stop() {
        this.oscillator.stop();
        return this;
    }
    
    get type() {
        return this._type;
    }
    
    set type(value) {
        this._type = value;
        this.oscillator.type = value;
    }
    
    get frequency() {
        return {
            value: this._frequency,
            setValueAtTime: (value, time) => {
                this._frequency = value;
                this.oscillator.frequency.setValueAtTime(value, time);
            }
        };
    }
    
    set frequency(value) {
        this._frequency = value;
        this.oscillator.frequency.value = value;
    }
};

// Gain (Volumen)
Tone.Gain = class extends Tone.ToneAudioNode {
    constructor(gain = 1) {
        super();
        this.gain = Tone.context.createGain();
        this.gain.gain.value = gain;
        this.input = this.gain;
        this.output = this.gain;
    }
    
    get value() {
        return this.gain.gain.value;
    }
    
    set value(value) {
        this.gain.gain.value = value;
    }
};

// Envelope (para controlar ADSR)
Tone.Envelope = class extends Tone.ToneAudioNode {
    constructor(attack = 0.1, decay = 0.2, sustain = 0.5, release = 0.8) {
        super();
        this.attack = attack;
        this.decay = decay;
        this.sustain = sustain;
        this.release = release;
        this.gain = new Tone.Gain(0);
        this.input = this.gain.input;
        this.output = this.gain.output;
    }
    
    triggerAttack(time = Tone.context.currentTime) {
        this.gain.gain.cancelScheduledValues(time);
        this.gain.gain.setValueAtTime(0, time);
        this.gain.gain.linearRampToValueAtTime(1, time + this.attack);
        this.gain.gain.linearRampToValueAtTime(this.sustain, time + this.attack + this.decay);
        return this;
    }
    
    triggerRelease(time = Tone.context.currentTime) {
        this.gain.gain.cancelScheduledValues(time);
        this.gain.gain.setValueAtTime(this.gain.gain.value, time);
        this.gain.gain.linearRampToValueAtTime(0, time + this.release);
        return this;
    }
};

// Sintetizador básico
Tone.Synth = class extends Tone.ToneAudioNode {
    constructor(options = {}) {
        super();
        this.oscillator = new Tone.Oscillator(440, options.oscillator?.type || 'sine');
        this.envelope = new Tone.Envelope(
            options.envelope?.attack || 0.005,
            options.envelope?.decay || 0.1,
            options.envelope?.sustain || 0.3,
            options.envelope?.release || 1
        );
        this.output = Tone.context.createGain();
        this.oscillator.connect(this.envelope);
        this.envelope.connect(this.output);
        this.input = this.oscillator.input;
        this._frequency = 440;
    }
    
    triggerAttack(note, time = Tone.context.currentTime) {
        // Convertir nota a frecuencia si es una cadena (ej: "A4")
        let freq = note;
        if (typeof note === 'string') {
            freq = this._noteToFrequency(note);
        }
        
        this._frequency = freq;
        this.oscillator.frequency.value = freq;
        
        if (!this._started) {
            this.oscillator.start();
            this._started = true;
        }
        
        this.envelope.triggerAttack(time);
        return this;
    }
    
    triggerRelease(time = Tone.context.currentTime) {
        this.envelope.triggerRelease(time);
        return this;
    }
    
    triggerAttackRelease(note, duration, time = Tone.context.currentTime) {
        this.triggerAttack(note, time);
        this.triggerRelease(time + duration);
        return this;
    }
    
    get frequency() {
        return {
            value: this._frequency,
            setValueAtTime: (value, time) => {
                this._frequency = value;
                this.oscillator.frequency.setValueAtTime(value, time);
            }
        };
    }
    
    set frequency(value) {
        this._frequency = value;
        this.oscillator.frequency.value = value;
    }
    
    get oscillator() {
        return this._oscillator;
    }
    
    set oscillator(osc) {
        this._oscillator = osc;
    }
    
    _noteToFrequency(note) {
        // Implementación básica para convertir notas a frecuencias
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = parseInt(note.slice(-1));
        const noteName = note.slice(0, -1);
        
        const noteIndex = notes.indexOf(noteName);
        if (noteIndex === -1) return 440; // A4 por defecto
        
        // A4 = 440Hz, cada octava duplica la frecuencia
        const semitoneFromA4 = (octave - 4) * 12 + noteIndex - 9;
        return 440 * Math.pow(2, semitoneFromA4 / 12);
    }
};

// Función para iniciar el contexto de audio (debe ser llamada después de interacción del usuario)
Tone.start = function() {
    if (Tone.context.state !== 'running') {
        return Tone.context.resume();
    }
    return Promise.resolve();
};

// Función para obtener el tiempo actual
Tone.now = function() {
    return Tone.context.currentTime;
};

// Destino de audio (salida principal)
Tone.Destination = Tone.context.destination;

// Función para convertir ganancia a dB
Tone.gainToDb = function(gain) {
    return 20 * Math.log10(gain);
};

// Función para convertir dB a ganancia
Tone.dbToGain = function(db) {
    return Math.pow(10, db / 20);
};