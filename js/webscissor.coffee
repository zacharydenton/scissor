class Scissor
  constructor: (@context) ->
    @tuna = new Tuna(@context)
    @output = @context.createGain()
    @delay = new @tuna.Delay()
    @delay.connect @output

    @voices = []
    @numSaws = 7
    @detune = 1

  noteOn: (note, time) ->
    return if @voices[note]?
    time ?= @context.currentTime
    freq = noteToFrequency note
    voice = new ScissorVoice(@context, freq, @numSaws, @detune)
    voice.connect @delay.input
    voice.start time
    @voices[note] = voice

  noteOff: (note, time) ->
    return unless @voices[note]?
    time ?= @context.currentTime
    @voices[note].stop time
    delete @voices[note]

  connect: (target) ->
    @output.connect target

class ScissorVoice
  constructor: (@context, @frequency, @numSaws, @detune) ->
    @output = @context.createGain()
    @maxGain = 1 / @numSaws
    @saws = []
    for i in [0...@numSaws]
      saw = @context.createOscillator()
      saw.type = saw.SAWTOOTH
      saw.frequency.value = @frequency
      saw.detune.value = (@detune * Math.floor(@numSaws / 2)) - i * @detune
      saw.start @context.currentTime
      saw.connect @output
      @saws.push saw

  start: (time) ->
    @output.gain.setValueAtTime @maxGain, time

  stop: (time) ->
    @output.gain.setValueAtTime 0, time
    setTimeout (=>
      # remove old saws
      @saws.forEach (saw) ->
        saw.disconnect()
    ), Math.floor((time - @context.currentTime) * 1000)

  connect: (target) ->
    @output.connect target

class VirtualKeyboard
  constructor: (params) ->
    @lowestNote = params.lowestNote ? 60
    @letters = params.letters ? "awsedftgyhujkolp;'".split ''
    @noteOn = params.noteOn ? (note) -> console.log "noteOn: #{note}"
    @noteOff = params.noteOff ? (note) -> console.log "noteOff: #{note}"
    @keysPressed = {}

    for letter, i in @letters
      do (letter, i) =>
        Mousetrap.bind letter, (=>
          note = @lowestNote + i
          return if note of @keysPressed
          @keysPressed[note] = true
          @noteOn note
        ), 'keydown'
        Mousetrap.bind letter, (=>
          note = @lowestNote + i
          return unless note of @keysPressed
          delete @keysPressed[note]
          @noteOff note
        ), 'keyup'

    Mousetrap.bind 'z', =>
      # shift one octave down
      @lowestNote -= 12
  
    Mousetrap.bind 'x', =>
      # shift one octave up
      @lowestNote += 12

noteToFrequency = (note) ->
  Math.pow(2, (note - 69) / 12) * 440.0

$ ->
  audioContext = new (AudioContext ? webkitAudioContext)
  masterGain = audioContext.createGain()
  masterGain.gain.value = 0.7
  masterGain.connect audioContext.destination

  window.scissor = new Scissor(audioContext)
  scissor.connect masterGain

  keyboard = new VirtualKeyboard
    noteOn: (note) ->
      scissor.noteOn note
    noteOff: (note) ->
      scissor.noteOff note
