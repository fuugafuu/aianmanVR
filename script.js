const leftCam = document.getElementById('leftCam');
const rightCam = document.getElementById('rightCam');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const statusText = document.getElementById('statusText');

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  leftCam.srcObject = stream;
  rightCam.srcObject = stream;
}

async function setupObjectDetection() {
  const model = await cocoSsd.load();
  detectFrame(leftCam, model);
}

async function detectFrame(video, model) {
  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;

  const predictions = await model.detect(video);
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  let personDetected = false;

  predictions.forEach(pred => {
    if (pred.class === 'person') {
      personDetected = true;
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 4;
      ctx.strokeRect(...pred.bbox);
      ctx.font = '20px sans-serif';
      ctx.fillStyle = 'yellow';
      ctx.fillText('ロックオン', pred.bbox[0], pred.bbox[1] > 20 ? pred.bbox[1] - 5 : 20);
    }
  });

  statusText.textContent = personDetected ? '人をロックオン中！' : '監視中…';
  requestAnimationFrame(() => detectFrame(video, model));
}

function setupVoiceCommands() {
  if (!('webkitSpeechRecognition' in window)) {
    alert('このブラウザは音声認識に対応していません');
    return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'ja-JP';
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = function(event) {
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        const command = event.results[i][0].transcript.trim();
        console.log('音声コマンド:', command);
        if (command.includes('ロックオン')) {
          statusText.textContent = '音声: ロックオン指令受信！';
          statusText.style.background = 'rgba(255, 0, 0, 0.7)';
        }
        if (command.includes('ズーム')) {
          statusText.textContent = '音声: ズーム指令受信！';
          statusText.style.background = 'rgba(0, 0, 255, 0.7)';
        }
      }
    }
  };
  recognition.start();
}

startCamera().then(() => {
  setupObjectDetection();
  setupVoiceCommands();
});