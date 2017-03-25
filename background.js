chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript(null, {file: "zebra.js"});
});

// Create our hidden zebra video which we inject into all the videos
const zebraVideo = document.createElement('video');
const zebraCanvas = document.createElement('canvas');
const zebraCtx = zebraCanvas.getContext('2d');
const tmpCanvas = document.createElement('canvas');
const tmpCtx = tmpCanvas.getContext('2d');
let ports = [];
let drawingTimeout;
zebraVideo.addEventListener('loadedmetadata', () => {
  zebraCanvas.width = tmpCanvas.width = zebraVideo.videoWidth;
  zebraCanvas.height = tmpCanvas.height = zebraVideo.videoHeight;
  zebraVideo.currentTime = Math.random() * zebraVideo.duration;
});
zebraVideo.src = chrome.extension.getURL('zebra.mp4');
zebraVideo.loop = true;
zebraVideo.play();

const drawZebra = () => {
  zebraCtx.drawImage(zebraVideo, 0, 0, zebraCanvas.width, zebraCanvas.height);

  const imgData = zebraCtx.getImageData(0, 0, zebraCanvas.width, zebraCanvas.height);
  const zebraData = new Uint8ClampedArray(imgData.data.length);
  for (let i = 0; i < imgData.data.length; i += 4) {
    let r = imgData.data[i];
    let g = imgData.data[i + 1];
    let b = imgData.data[i + 2];
    if (g > (r * 1.2) && g > (b * 1.2) && g > 50) {
      // this is green, hide it
      zebraData[i] = zebraData[i + 1] = zebraData[i + 2] = zebraData[i + 3] = 0;
    } else {
      zebraData[i] = imgData.data[i];
      zebraData[i + 1] = imgData.data[i + 1];
      zebraData[i + 2] = imgData.data[i + 2];
      zebraData[i + 3] = imgData.data[i + 3];
    }
   }

   let zebraImageData = new ImageData(zebraData, zebraCanvas.width, zebraCanvas.height);
   tmpCtx.putImageData(zebraImageData, 0, 0);
   ports.forEach((port) => {
     port.postMessage(tmpCanvas.toDataURL());
   });
   drawingTimeout = setTimeout(drawZebra);
};

const stopDrawing = () => {
  clearTimeout(drawingTimeout);
  drawingTimeout = null;
};

chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name == 'zebra');
  ports.push(port);
  if (!drawingTimeout) {
    drawZebra();
  }
  port.onDisconnect.addListener((port) => {
    ports = ports.filter((p) => p !== port);
    if (ports.length === 0) {
      stopDrawing();
    }
  });
});
