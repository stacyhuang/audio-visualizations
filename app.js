$(function() {
  // define variables
  var audioCtx = new window.AudioContext() || new window.webkitAudioContext;
  var source;
  var playbackRateControl = $("#playback-rate");
  var volumeControl = $("#volume");

  // create a gain node and connect to the audio context
  var volume = audioCtx.createGain();
  volume.connect(audioCtx.destination);

  // create a analyser node to extract data from the audio source
  // connect the analyser node to the gain node
  var analyser = audioCtx.createAnalyser();
  analyser.connect(volume)

  // use XHR to load an audio track, and
  // decodeAudioData to decode it and stick it in a buffer
  // then we put the buffer into the source
  function loadAudio() {
    source = audioCtx.createBufferSource();

    var request = new XMLHttpRequest();
    request.open("GET", "sound/demo.mp3", true);
    request.responseType = "arraybuffer";

    request.onload = function() {
      audioCtx.decodeAudioData(request.response, function(buffer) {
        source.buffer = buffer;
        source.playbackRate.value = playbackRateControl.val();
        source.connect(analyser);
      });
    }
    request.send();
  }

  // set up canvas context for visualizer
  var frequencyCanvas = $(".frequency")[0];
  var frequencyCanvasCtx = frequencyCanvas.getContext("2d");
  var waveformCanvas = $(".waveform")[0];
  var waveformCanvasCtx = waveformCanvas.getContext("2d");

  function visualizeFrequency() {
    WIDTH = frequencyCanvas.width;
    HEIGHT = frequencyCanvas.height;

    // set up the buffer
    analyser.fftSize = 256;
    // an unsigned long value half that of the fft size
    // equates to the number of data points we
    // will play with for the visualization
    var bufferLength = analyser.frequencyBinCount;

    // Uint8Array with the same length as the frequencyBinCount
    var dataArray = new Uint8Array(bufferLength);

    // clear the canvas of what had been drawn on it before
    // to get ready for the new visualization display
    frequencyCanvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {
      // set up a loop so that the displayed data keeps updating,
      // and clearing the display with each animation frame
      drawVisual = requestAnimationFrame(draw);

      // copies the current frequency data into the Uint8Array passed into it
      analyser.getByteFrequencyData(dataArray);

      // full the canvas with a solid color
      frequencyCanvasCtx.fillStyle = "rgb(0, 0, 0)";
      frequencyCanvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      // set barWidth to be the canvas width divided by the number of bars
      // Multiply by 2.5 to avoid loads of empty bars because most of the
      // frequencies we hear are in a certain lower frequeny range
      var barWidth = (WIDTH / bufferLength) * 2.5;
      var barHeight;
      var x = 0;

      // cycle through each value in the dataArray. For each one,
      // make the barHeight eqaul to the array value / 2 (to fit the canvas better),
      // set a fill color based on the barHeight (taller bars are brighter),
      // and draw a bar at x pixels across the canvas
      for(var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        frequencyCanvasCtx.fillStyle = "rgb(" + (barHeight + 100) + ", 50, 50)";
        frequencyCanvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  }

  function visualizeWaveform() {
    WIDTH = waveformCanvas.width;
    HEIGHT = waveformCanvas.height;

    // set up the buffer
    analyser.fftSize = 2048;
    // an unsigned long value half that of the fft size
    // equates to the number of data points we
    // will play with for the visualization
    var bufferLength = analyser.frequencyBinCount;

    // Uint8Array with the same length as the frequencyBinCount
    var dataArray = new Uint8Array(bufferLength);

    // clear the canvas of what had been drawn on it before
    // to get ready for the new visualization display
    waveformCanvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {
      // set up a loop so that the displayed data keeps updating,
      // and clearing the display with each animation frame
      drawVisual = requestAnimationFrame(draw);

      // copies the time domain data into the Uint8Array passed into it
      analyser.getByteTimeDomainData(dataArray);

      // full the canvas with a solid color
      waveformCanvasCtx.fillStyle = "rgb(200, 200, 200)";
      waveformCanvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      // set a line width and stroke color for the wave
      waveformCanvasCtx.lineWidth = 2;
      waveformCanvasCtx.strokeStyle = 'rgb(0, 0, 0)';

      // begin drawing a path
      waveformCanvasCtx.beginPath();

      // determine the width of each segment of the line by diving the
      // canvas width by the array length (the frequencyBinCount)
      var sliceWidth = WIDTH * 1.0 / bufferLength;
      // the position to move to
      var x = 0;

      // run through a loop, defining the position of a small segment
      // of the wave for each point in the buffer at a certain height
      // based on the data point value from the array, then moving the line
      // across to the place where the next wave segment should be drawn
      for(var i = 0; i < bufferLength; i++) {
        var v = dataArray[i] / 128.0;
        var y = v * HEIGHT/2;

        if(i === 0) {
          waveformCanvasCtx.moveTo(x, y);
        } else {
          waveformCanvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      // finish the line in the middle of the right hand side of the canvas
      waveformCanvasCtx.lineTo(waveformCanvas.width, waveformCanvas.height/2);
      // draw the stroke
      waveformCanvasCtx.stroke();
    };
    draw();
  }

  $("#play").on("click", function() {
    loadAudio();
    source.start(0);
  });

  $("#stop").on("click", function() {
    source.stop(0);
  })

  volumeControl.on("input", function() {
    volume.gain.value = volumeControl.val();
  });

  playbackRateControl.on("input", function() {
    source.playbackRate.value = playbackRateControl.val();
  });

  visualizeFrequency();
  visualizeWaveform();
});
