const port = chrome.runtime.connect({name: 'zebra'});
const images = [];
port.onMessage.addListener((dataURL) => {
  images.forEach((image) => {
    image.src = dataURL;
  });
});

const drawFrame = (ctx, video) => {
  // Draw the underlying video
  ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

  // Draw our zebra on top
  if (image.src) {
    ctx.drawImage(image, 0, 0, video.videoWidth, video.videoHeight);
  }

  requestAnimationFrame(drawFrame.bind(null, ctx, video));
};

document.body.querySelectorAll('video').forEach(video => {
  const image = document.createElement('img');

  const positionImage = () => {
    const rect = video.getBoundingClientRect();
    image.width = rect.width || 640;
    image.height = rect.height || 360;
    image.style.position = 'absolute';
    image.style.left = rect.left + window.scrollX + 'px';
    image.style.top = rect.top + window.scrollY + 'px';
    image.style.pointerEvents = 'none';
  };
  positionImage();
  window.addEventListener('resize', positionImage);

  document.body.appendChild(image);
  image.style.zIndex = 99999;
  images.push(image);
});
