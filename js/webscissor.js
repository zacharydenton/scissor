(function() {
  var Scissor, ScissorVoice, VirtualKeyboard, noteToFrequency;

  Scissor = (function() {
    function Scissor(context) {
      this.context = context;
      this.tuna = new Tuna(this.context);
      this.output = this.context.createGain();
      this.delay = new this.tuna.Delay();
      this.delay.connect(this.output);
      this.voices = [];
      this.numSaws = 7;
      this.detune = 1;
    }

    Scissor.prototype.noteOn = function(note, time) {
      var freq, voice;
      if (this.voices[note] != null) {
        return;
      }
      if (time == null) {
        time = this.context.currentTime;
      }
      freq = noteToFrequency(note);
      voice = new ScissorVoice(this.context, freq, this.numSaws, this.detune);
      voice.connect(this.delay.input);
      voice.start(time);
      return this.voices[note] = voice;
    };

    Scissor.prototype.noteOff = function(note, time) {
      if (this.voices[note] == null) {
        return;
      }
      if (time == null) {
        time = this.context.currentTime;
      }
      this.voices[note].stop(time);
      return delete this.voices[note];
    };

    Scissor.prototype.connect = function(target) {
      return this.output.connect(target);
    };

    return Scissor;

  })();

  ScissorVoice = (function() {
    function ScissorVoice(context, frequency, numSaws, detune) {
      var i, saw, _i, _ref;
      this.context = context;
      this.frequency = frequency;
      this.numSaws = numSaws;
      this.detune = detune;
      this.output = this.context.createGain();
      this.maxGain = 1 / this.numSaws;
      this.saws = [];
      for (i = _i = 0, _ref = this.numSaws; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        saw = this.context.createOscillator();
        saw.type = saw.SAWTOOTH;
        saw.frequency.value = this.frequency;
        saw.detune.value = (this.detune * Math.floor(this.numSaws / 2)) - i * this.detune;
        saw.start(this.context.currentTime);
        saw.connect(this.output);
        this.saws.push(saw);
      }
    }

    ScissorVoice.prototype.start = function(time) {
      return this.output.gain.setValueAtTime(this.maxGain, time);
    };

    ScissorVoice.prototype.stop = function(time) {
      var _this = this;
      this.output.gain.setValueAtTime(0, time);
      return setTimeout((function() {
        return _this.saws.forEach(function(saw) {
          return saw.disconnect();
        });
      }), Math.floor((time - this.context.currentTime) * 1000));
    };

    ScissorVoice.prototype.connect = function(target) {
      return this.output.connect(target);
    };

    return ScissorVoice;

  })();

  VirtualKeyboard = (function() {
    function VirtualKeyboard(params) {
      var i, letter, _fn, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4,
        _this = this;
      this.lowestNote = (_ref = params.lowestNote) != null ? _ref : 60;
      this.letters = (_ref1 = params.letters) != null ? _ref1 : "awsedftgyhujkolp;'".split('');
      this.noteOn = (_ref2 = params.noteOn) != null ? _ref2 : function(note) {
        return console.log("noteOn: " + note);
      };
      this.noteOff = (_ref3 = params.noteOff) != null ? _ref3 : function(note) {
        return console.log("noteOff: " + note);
      };
      this.keysPressed = {};
      _ref4 = this.letters;
      _fn = function(letter, i) {
        Mousetrap.bind(letter, (function() {
          var note;
          note = _this.lowestNote + i;
          if (note in _this.keysPressed) {
            return;
          }
          _this.keysPressed[note] = true;
          return _this.noteOn(note);
        }), 'keydown');
        return Mousetrap.bind(letter, (function() {
          var note;
          note = _this.lowestNote + i;
          if (!(note in _this.keysPressed)) {
            return;
          }
          delete _this.keysPressed[note];
          return _this.noteOff(note);
        }), 'keyup');
      };
      for (i = _i = 0, _len = _ref4.length; _i < _len; i = ++_i) {
        letter = _ref4[i];
        _fn(letter, i);
      }
      Mousetrap.bind('z', function() {
        return _this.lowestNote -= 12;
      });
      Mousetrap.bind('x', function() {
        return _this.lowestNote += 12;
      });
    }

    return VirtualKeyboard;

  })();

  noteToFrequency = function(note) {
    return Math.pow(2, (note - 69) / 12) * 440.0;
  };

  $(function() {
    var audioContext, keyboard, masterGain;
    audioContext = new (typeof AudioContext !== "undefined" && AudioContext !== null ? AudioContext : webkitAudioContext);
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(audioContext.destination);
    window.scissor = new Scissor(audioContext);
    scissor.connect(masterGain);
    return keyboard = new VirtualKeyboard({
      noteOn: function(note) {
        return scissor.noteOn(note);
      },
      noteOff: function(note) {
        return scissor.noteOff(note);
      }
    });
  });

}).call(this);
