(function() {
  var Scissor, ScissorVoice, VirtualKeyboard, noteToFrequency;

  Scissor = (function() {
    function Scissor(context) {
      this.context = context;
      this.tuna = new Tuna(this.context);
      this.output = this.context.createGain();
      this.delay = new this.tuna.Delay({
        cutoff: 3000
      });
      this.delay.connect(this.output);
      this.voices = [];
      this.numSaws = 3;
      this.detune = 12;
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
        saw.detune.value = -this.detune + i * 2 * this.detune / (this.numSaws - 1);
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
    function VirtualKeyboard($el, params) {
      var _ref, _ref1, _ref2, _ref3;
      this.$el = $el;
      this.lowestNote = (_ref = params.lowestNote) != null ? _ref : 48;
      this.letters = (_ref1 = params.letters) != null ? _ref1 : "awsedftgyhujkolp;'".split('');
      this.noteOn = (_ref2 = params.noteOn) != null ? _ref2 : function(note) {
        return console.log("noteOn: " + note);
      };
      this.noteOff = (_ref3 = params.noteOff) != null ? _ref3 : function(note) {
        return console.log("noteOff: " + note);
      };
      this.keysPressed = {};
      this.render();
      this.bindKeys();
      this.bindMouse();
    }

    VirtualKeyboard.prototype._noteOn = function(note) {
      if (note in this.keysPressed) {
        return;
      }
      $(this.$el.find('li').get(note - this.lowestNote)).addClass('active');
      this.keysPressed[note] = true;
      return this.noteOn(note);
    };

    VirtualKeyboard.prototype._noteOff = function(note) {
      if (!(note in this.keysPressed)) {
        return;
      }
      $(this.$el.find('li').get(note - this.lowestNote)).removeClass('active');
      delete this.keysPressed[note];
      return this.noteOff(note);
    };

    VirtualKeyboard.prototype.bindKeys = function() {
      var i, letter, _fn, _i, _len, _ref,
        _this = this;
      _ref = this.letters;
      _fn = function(letter, i) {
        Mousetrap.bind(letter, (function() {
          return _this._noteOn(_this.lowestNote + i);
        }), 'keydown');
        return Mousetrap.bind(letter, (function() {
          return _this._noteOff(_this.lowestNote + i);
        }), 'keyup');
      };
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        letter = _ref[i];
        _fn(letter, i);
      }
      Mousetrap.bind('z', function() {
        return _this.lowestNote -= 12;
      });
      return Mousetrap.bind('x', function() {
        return _this.lowestNote += 12;
      });
    };

    VirtualKeyboard.prototype.bindMouse = function() {
      var _this = this;
      return this.$el.find('li').each(function(i, key) {
        $(key).mousedown(function() {
          return _this._noteOn(_this.lowestNote + i);
        });
        return $(key).mouseup(function() {
          return _this._noteOff(_this.lowestNote + i);
        });
      });
    };

    VirtualKeyboard.prototype.render = function() {
      var $key, $ul, i, letter, _i, _len, _ref;
      this.$el.empty();
      $ul = $("<ul>");
      _ref = this.letters;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        letter = _ref[i];
        $key = $("<li>" + letter + "</li>");
        if (i === 1 || i === 3 || i === 6 || i === 8 || i === 10 || i === 13 || i === 15) {
          $key.addClass('accidental');
        }
        $ul.append($key);
      }
      return this.$el.append($ul);
    };

    return VirtualKeyboard;

  })();

  noteToFrequency = function(note) {
    return Math.pow(2, (note - 69) / 12) * 440.0;
  };

  $(function() {
    var audioContext, detuneKnob, keyboard, masterGain, sawsKnob, setDetune, setNumSaws;
    audioContext = new (typeof AudioContext !== "undefined" && AudioContext !== null ? AudioContext : webkitAudioContext);
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(audioContext.destination);
    window.scissor = new Scissor(audioContext);
    scissor.connect(masterGain);
    keyboard = new VirtualKeyboard($("#keyboard"), {
      noteOn: function(note) {
        return scissor.noteOn(note);
      },
      noteOff: function(note) {
        return scissor.noteOff(note);
      }
    });
    setNumSaws = function(numSaws) {
      return scissor.numSaws = numSaws;
    };
    setDetune = function(detune) {
      return scissor.detune = detune;
    };
    sawsKnob = new Knob($("#saws")[0], new Ui.P2());
    sawsKnob.changed = function() {
      Knob.prototype.changed.apply(this, arguments);
      return setNumSaws(this.value);
    };
    $("#saws").val(scissor.numSaws);
    sawsKnob.changed(0);
    detuneKnob = new Knob($("#detune")[0], new Ui.P2());
    detuneKnob.changed = function() {
      Knob.prototype.changed.apply(this, arguments);
      return setDetune(this.value);
    };
    $("#detune").val(scissor.detune);
    return detuneKnob.changed(0);
  });

}).call(this);
