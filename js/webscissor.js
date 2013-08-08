(function() {
  $(function() {
    var audioContext;
    return audioContext = new (typeof AudioContext !== "undefined" && AudioContext !== null ? AudioContext : webkitAudioContext);
  });

}).call(this);
