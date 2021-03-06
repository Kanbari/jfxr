jfxrApp.service('context', [function() {
  return new AudioContext();
}]);

jfxrApp.service('Player', ['$rootScope', '$timeout', 'context', function(
      $rootScope, $timeout, context) {
  var Player = function() {
    this.position = 0;

    this.playing = false;

    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.5;
    this.analyser.connect(context.destination);

    this.frequencyData = new Float32Array(this.analyser.frequencyBinCount);
    for (var i = 0; i < this.frequencyData.length; i++) {
      this.frequencyData[i] = -100;
    }

    // Make sure that the AnalyserNode is tickled at a regular interval,
    // even if we paint the canvas at irregular intervals. This is needed
    // because smoothing is applied only when the data is requested.
    this.script = context.createScriptProcessor(1024);
    this.script.onaudioprocess = function(e) {
      this.analyser.getFloatFrequencyData(this.frequencyData);
    }.bind(this);
    // Feed zeros into the analyser because otherwise it freezes up as soon
    // as the sound stops playing.
    this.script.connect(this.analyser);
  };

  Player.prototype.play = function(buffer) {
    if (this.playing) {
      this.stop();
    }
    this.source = context.createBufferSource();
    this.source.connect(this.analyser);
    this.source.buffer = buffer;
    this.source.start(0);
    this.source.onended = function() {
      this.playing = false;
      $rootScope.$apply();
    }.bind(this);
    this.playing = true;
  };

  Player.prototype.stop = function() {
    if (!this.playing) {
      return;
    }
    this.source.stop(0);
    this.source.onended = null;
    this.source = null;
    this.playing = false;
  };

  Player.prototype.getFrequencyData = function() {
    return this.frequencyData;
  };

  return Player;
}]);
