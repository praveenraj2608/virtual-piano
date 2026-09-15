/**
 * Virtual Piano Keyboard - Core JavaScript Logic
 * Pure client-side Web Audio API synthesizer, keyboard mapping, and UI controls.
 */

(() => {
  'use strict';

  // --- Configuration & Constants ---
  const DEFAULT_OCTAVE = 4;
  const MIN_OCTAVE = 2;
  const MAX_OCTAVE = 6;
  const DEFAULT_VOLUME = 75;

  // Semitone offsets from C (C = 0)
  const SEMITONE_MAP = {
    'C': 0,
    'C#': 1,
    'D': 2,
    'D#': 3,
    'E': 4,
    'F': 5,
    'F#': 6,
    'G': 7,
    'G#': 8,
    'A': 9,
    'A#': 10,
    'B': 11
  };

  // Keyboard mapping definition (lower-case key -> { note, octaveOffset })
  const KEY_MAPPINGS = {
    'a': { note: 'C', octaveOffset: 0 },
    'w': { note: 'C#', octaveOffset: 0 },
    's': { note: 'D', octaveOffset: 0 },
    'e': { note: 'D#', octaveOffset: 0 },
    'd': { note: 'E', octaveOffset: 0 },
    'f': { note: 'F', octaveOffset: 0 },
    't': { note: 'F#', octaveOffset: 0 },
    'g': { note: 'G', octaveOffset: 0 },
    'y': { note: 'G#', octaveOffset: 0 },
    'h': { note: 'A', octaveOffset: 0 },
    'u': { note: 'A#', octaveOffset: 0 },
    'j': { note: 'B', octaveOffset: 0 },
    'k': { note: 'C', octaveOffset: 1 }
  };

  // --- State ---
  let currentOctave = DEFAULT_OCTAVE;
  let currentVolume = DEFAULT_VOLUME / 100;
  let isMuted = false;

  // Active voices tracking: key identifier -> { stop: Function, noteName: string }
  const activeVoices = new Map();
  // Active computer keys set to avoid repeat triggers
  const pressedComputerKeys = new Set();

  // --- DOM Elements ---
  const pianoBoard = document.getElementById('pianoBoard');
  const pianoKeys = document.querySelectorAll('.key');
  const noteDisplay = document.getElementById('noteDisplay');
  const statusCard = document.getElementById('statusCard');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  const octaveDisplay = document.getElementById('octaveDisplay');
  const octaveDownBtn = document.getElementById('octaveDown');
  const octaveUpBtn = document.getElementById('octaveUp');
  const muteBtn = document.getElementById('muteBtn');
  const muteIcon = document.getElementById('muteIcon');
  const muteText = document.getElementById('muteText');
  const resetBtn = document.getElementById('resetBtn');

  // --- Audio Engine (Web Audio API) ---
  let audioCtx = null;
  let masterGain = null;

  /**
   * Initializes the Web Audio context and master gain node on user interaction.
   */
  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API is not supported in this browser.');
        return null;
      }
      audioCtx = new AudioContextClass();

      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : currentVolume, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    return audioCtx;
  }

  /**
   * Calculates the exact frequency in Hz for a given note and octave.
   * Standard pitch formula: A4 = 440Hz, MIDI 69
   * @param {string} note - Note name (e.g., 'C', 'F#')
   * @param {number} octave - Octave number (e.g., 4)
   * @returns {number} Frequency in Hertz
   */
  function getFrequency(note, octave) {
    const semitone = SEMITONE_MAP[note];
    if (semitone === undefined) return 440;
    // MIDI number formula: C4 is 60 (octave 4, semitone 0 -> (4+1)*12 + 0 = 60)
    const midiNumber = (octave + 1) * 12 + semitone;
    return 440 * Math.pow(2, (midiNumber - 69) / 12);
  }

  /**
   * Synthesizes and plays a piano-like tone using multi-oscillator harmonic blending
   * and an ADSR envelope.
   * @param {number} frequency - Note frequency in Hz
   * @returns {Function} Stop function that triggers the release phase
   */
  function playSynthTone(frequency) {
    const ctx = initAudioContext();
    if (!ctx || !masterGain) return () => {};

    const now = ctx.currentTime;

    // Voice master gain node (handles the ADSR volume envelope)
    const voiceGain = ctx.createGain();
    voiceGain.connect(masterGain);

    // Primary fundamental oscillator (triangle wave for acoustic warmth)
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(frequency, now);

    // Secondary oscillator (sine wave for deep fundamental support)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency, now);

    // Overtone oscillator (2nd harmonic for piano chime/sparkle)
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(frequency * 2, now);
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.25, now);
    osc3Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35); // quick harmonic decay
    osc3.connect(osc3Gain);
    osc3Gain.connect(voiceGain);

    osc1.connect(voiceGain);
    osc2.connect(voiceGain);

    // ADSR Envelope Configuration
    const attackTime = 0.008; // ~8ms instant strike
    const decayTime = 0.35;   // ~350ms initial decay
    const sustainLevel = 0.3; // Sustain volume ratio
    const peakGain = 0.85;

    // Attack phase: 0 -> peakGain
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(peakGain, now + attackTime);

    // Decay phase: peakGain -> sustainLevel
    voiceGain.gain.exponentialRampToValueAtTime(peakGain * sustainLevel, now + attackTime + decayTime);

    // Start oscillators
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    let isReleased = false;

    // Release function returned to stop the note naturally
    return function stopNote() {
      if (isReleased) return;
      isReleased = true;

      const releaseStart = ctx.currentTime;
      const releaseTime = 0.25; // ~250ms release tail

      // Cancel scheduled curves and ramp down smoothly to zero
      voiceGain.gain.cancelScheduledValues(releaseStart);
      voiceGain.gain.setValueAtTime(Math.max(voiceGain.gain.value, 0.0001), releaseStart);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, releaseStart + releaseTime);

      const stopTime = releaseStart + releaseTime + 0.05;
      osc1.stop(stopTime);
      osc2.stop(stopTime);
      osc3.stop(stopTime);

      setTimeout(() => {
        try {
          osc1.disconnect();
          osc2.disconnect();
          osc3.disconnect();
          osc3Gain.disconnect();
          voiceGain.disconnect();
        } catch (e) {
          // Ignored if already disconnected
        }
      }, (releaseTime + 0.1) * 1000);
    };
  }

  // --- Note Display Helpers ---
  function updateNoteDisplay() {
    if (activeVoices.size === 0) {
      noteDisplay.textContent = 'Press a key to play';
      statusCard.classList.remove('playing');
    } else {
      // Show the most recently triggered voice
      const lastVoice = Array.from(activeVoices.values()).pop();
      if (lastVoice) {
        noteDisplay.textContent = `Now Playing: ${lastVoice.noteName}`;
        statusCard.classList.add('playing');
      }
    }
  }

  function updateKeyLabels() {
    pianoKeys.forEach(keyEl => {
      const note = keyEl.dataset.note;
      const offset = parseInt(keyEl.dataset.octaveOffset || '0', 10);
      const noteOctave = currentOctave + offset;
      const labelSpan = keyEl.querySelector('.key-label');
      if (labelSpan) {
        labelSpan.innerHTML = `${note}<span class="octave-sub">${noteOctave}</span>`;
      }
      keyEl.setAttribute('aria-label', `${note}${noteOctave} piano key`);
    });
    octaveDisplay.textContent = currentOctave;
    octaveDownBtn.disabled = currentOctave <= MIN_OCTAVE;
    octaveUpBtn.disabled = currentOctave >= MAX_OCTAVE;
  }

  // --- Voice Trigger & Release Actions ---
  function startNote(keyIdentifier, note, octaveOffset, keyElement) {
    if (activeVoices.has(keyIdentifier)) return;

    const noteOctave = currentOctave + octaveOffset;
    const noteName = `${note}${noteOctave}`;
    const frequency = getFrequency(note, noteOctave);

    const stopFn = playSynthTone(frequency);

    activeVoices.set(keyIdentifier, {
      stop: stopFn,
      noteName: noteName,
      element: keyElement
    });

    if (keyElement) {
      keyElement.classList.add('active');
    }

    updateNoteDisplay();
  }

  function stopNote(keyIdentifier) {
    const voice = activeVoices.get(keyIdentifier);
    if (!voice) return;

    if (typeof voice.stop === 'function') {
      voice.stop();
    }

    if (voice.element) {
      voice.element.classList.remove('active');
    }

    activeVoices.delete(keyIdentifier);
    updateNoteDisplay();
  }

  function stopAllNotes() {
    activeVoices.forEach((voice, id) => {
      if (typeof voice.stop === 'function') {
        voice.stop();
      }
      if (voice.element) {
        voice.element.classList.remove('active');
      }
    });
    activeVoices.clear();
    pressedComputerKeys.clear();
    updateNoteDisplay();
  }

  // --- Event Listeners Setup ---

  // 1. Mouse & Touch interactions on piano keys
  pianoKeys.forEach(keyEl => {
    const note = keyEl.dataset.note;
    const offset = parseInt(keyEl.dataset.octaveOffset || '0', 10);
    const keyId = `mouse-${keyEl.id}`;

    // Mouse handlers
    keyEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startNote(keyId, note, offset, keyEl);
    });

    keyEl.addEventListener('mouseup', () => {
      stopNote(keyId);
    });

    keyEl.addEventListener('mouseleave', () => {
      stopNote(keyId);
    });

    // Touch handlers for mobile
    keyEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startNote(keyId, note, offset, keyEl);
    }, { passive: false });

    keyEl.addEventListener('touchend', (e) => {
      e.preventDefault();
      stopNote(keyId);
    }, { passive: false });

    keyEl.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      stopNote(keyId);
    }, { passive: false });
  });

  // Global mouseup failsafe
  window.addEventListener('mouseup', () => {
    pianoKeys.forEach(keyEl => {
      stopNote(`mouse-${keyEl.id}`);
    });
  });

  // 2. Computer Keyboard Controls
  window.addEventListener('keydown', (e) => {
    // Avoid triggering when focused on inputs/buttons
    if (e.target.tagName === 'INPUT') return;

    const key = e.key.toLowerCase();
    const mapping = KEY_MAPPINGS[key];

    if (!mapping) return;
    if (pressedComputerKeys.has(key)) return; // Prevent key repeat

    pressedComputerKeys.add(key);

    // Find corresponding visual piano key
    const keyElement = document.querySelector(`.key[data-key="${key}"]`);
    startNote(`kbd-${key}`, mapping.note, mapping.octaveOffset, keyElement);
  });

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (pressedComputerKeys.has(key)) {
      pressedComputerKeys.delete(key);
      stopNote(`kbd-${key}`);
    }
  });

  // Window blur failsafe to prevent stuck keys
  window.addEventListener('blur', () => {
    stopAllNotes();
  });

  // 3. Volume Control Slider
  volumeSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    currentVolume = val / 100;
    volumeValue.textContent = `${val}%`;

    if (masterGain && audioCtx) {
      if (!isMuted) {
        masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
      }
    }
  });

  // 4. Octave Steppers
  octaveDownBtn.addEventListener('click', () => {
    if (currentOctave > MIN_OCTAVE) {
      currentOctave--;
      updateKeyLabels();
    }
  });

  octaveUpBtn.addEventListener('click', () => {
    if (currentOctave < MAX_OCTAVE) {
      currentOctave++;
      updateKeyLabels();
    }
  });

  // 5. Mute Button
  muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    muteBtn.setAttribute('aria-pressed', isMuted ? 'true' : 'false');

    if (isMuted) {
      muteBtn.classList.add('muted');
      muteIcon.textContent = '🔇';
      muteText.textContent = 'Unmute';
      if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
      }
    } else {
      muteBtn.classList.remove('muted');
      muteIcon.textContent = '🔊';
      muteText.textContent = 'Mute';
      if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
      }
    }
  });

  // 6. Reset Button
  resetBtn.addEventListener('click', () => {
    // Reset all notes
    stopAllNotes();

    // Reset volume to 75%
    currentVolume = DEFAULT_VOLUME / 100;
    volumeSlider.value = DEFAULT_VOLUME;
    volumeValue.textContent = `${DEFAULT_VOLUME}%`;

    // Reset mute state
    isMuted = false;
    muteBtn.classList.remove('muted');
    muteBtn.setAttribute('aria-pressed', 'false');
    muteIcon.textContent = '🔊';
    muteText.textContent = 'Mute';

    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
    }

    // Reset octave to 4
    currentOctave = DEFAULT_OCTAVE;
    updateKeyLabels();
    updateNoteDisplay();
  });

  // Initial render
  updateKeyLabels();
  updateNoteDisplay();
})();
