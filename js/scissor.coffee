class Scissor
  constructor: (@context) ->
    @tuna = new Tuna(@context)
    @output = @context.createGain()
    @delay = new @tuna.Delay(cutoff: 3000)
    @delay.connect @output

    @voices = []
    @numSaws = 3
    @detune = 12

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
      saw.detune.value = -@detune + i * 2 * @detune / (@numSaws - 1)
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
  constructor: (@$el, params) ->
    @lowestNote = params.lowestNote ? 48
    @letters = params.letters ? "awsedftgyhujkolp;'".split ''
    @noteOn = params.noteOn ? (note) -> console.log "noteOn: #{note}"
    @noteOff = params.noteOff ? (note) -> console.log "noteOff: #{note}"
    @keysPressed = {}
    @render()
    @bindKeys()
    @bindMouse()

  _noteOn: (note) ->
    return if note of @keysPressed
    $(@$el.find('li').get(note - @lowestNote)).addClass 'active'
    @keysPressed[note] = true
    @noteOn note

  _noteOff: (note) ->
    return unless note of @keysPressed
    $(@$el.find('li').get(note - @lowestNote)).removeClass 'active'
    delete @keysPressed[note]
    @noteOff note

  bindKeys: ->
    for letter, i in @letters
      do (letter, i) =>
        Mousetrap.bind letter, (=>
          @_noteOn (@lowestNote + i)
        ), 'keydown'
        Mousetrap.bind letter, (=>
          @_noteOff (@lowestNote + i)
        ), 'keyup'

    Mousetrap.bind 'z', =>
      # shift one octave down
      @lowestNote -= 12
  
    Mousetrap.bind 'x', =>
      # shift one octave up
      @lowestNote += 12

  bindMouse: ->
    @$el.find('li').each (i, key) =>
      $(key).mousedown =>
        @_noteOn (@lowestNote + i)
      $(key).mouseup =>
        @_noteOff (@lowestNote + i)

  render: ->
    @$el.empty()
    $ul = $("<ul>")
    for letter, i in @letters
      $key = $("<li>#{letter}</li>")
      if i in [1, 3, 6, 8, 10, 13, 15]
        $key.addClass 'accidental'
      $ul.append $key
    @$el.append $ul

noteToFrequency = (note) ->
  Math.pow(2, (note - 69) / 12) * 440.0

$ ->
  audioContext = new (AudioContext ? webkitAudioContext)
  masterGain = audioContext.createGain()
  masterGain.gain.value = 0.7
  masterGain.connect audioContext.destination
  window.scissor = new Scissor(audioContext)
  scissor.connect masterGain

  keyboard = new VirtualKeyboard $("#keyboard"),
    noteOn: (note) ->
      scissor.noteOn note
    noteOff: (note) ->
      scissor.noteOff note

  setNumSaws = (numSaws) ->
    scissor.numSaws = numSaws

  setDetune = (detune) ->
    scissor.detune = detune

  sawsKnob = new Knob($("#saws")[0], new Ui.P2())
  sawsKnob.changed = ->
    Knob.prototype.changed.apply this, arguments
    setNumSaws @value
  $("#saws").val scissor.numSaws
  sawsKnob.changed 0

  detuneKnob = new Knob($("#detune")[0], new Ui.P2())
  detuneKnob.changed = ->
    Knob.prototype.changed.apply this, arguments
    setDetune @value
  $("#detune").val scissor.detune
  detuneKnob.changed 0
