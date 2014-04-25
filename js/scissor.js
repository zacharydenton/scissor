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
      this.isMobile() ? this.bindTouch() : this.bindMouse();
    }


    VirtualKeyboard.prototype.isMobile = function() { // mobile devices check
      var check = false;
      (function(a){if(/(android|ipad|playbook|silk|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
      return check;
    };

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

    VirtualKeyboard.prototype.bindTouch = function(){
      var _this = this;
      return this.$el.find('li').each(function(i, key){
        $(key).bind('touchstart', function(){
          return _this._noteOn(_this.lowestNote + i);
        });
        $(key).bind('touchend', function(){
          return _this._noteOff(_this.lowestNote + i);
        });
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
