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
      this.bindKeys();
      this.render();
    }

    VirtualKeyboard.prototype.bindKeys = function() {
      var i, letter, _fn, _i, _len, _ref,
        _this = this;
      _ref = this.letters;
      _fn = function(letter, i) {
        Mousetrap.bind(letter, (function() {
          var note;
          note = _this.lowestNote + i;
          if (note in _this.keysPressed) {
            return;
          }
          $(_this.$el.find('li').get(i)).addClass('active');
          _this.keysPressed[note] = true;
          return _this.noteOn(note);
        }), 'keydown');
        return Mousetrap.bind(letter, (function() {
          var note;
          note = _this.lowestNote + i;
          if (!(note in _this.keysPressed)) {
            return;
          }
          $(_this.$el.find('li').get(i)).removeClass('active');
          delete _this.keysPressed[note];
          return _this.noteOff(note);
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
    var audioContext, i, keyboard, masterGain, _i, _ref, _results;
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
    _results = [];
    for (i = _i = 0, _ref = scissor.numSaws; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      _results.push($("#tubes").append('<div>'));
    }
    return _results;
  });

}).call(this);
