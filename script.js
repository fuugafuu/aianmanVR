const video = document.getElementById('camera');
const statusText = document.getElementById('statusText');
const faceCanvas = document.getElementById('faceOverlay');
const faceCtx = faceCanvas.getContext('2d');

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  video.srcObject = stream;
}

async function setupFaceDetection() {
  const faceDetection = new FaceDetection({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}` });
  faceDetection.setOptions({ modelSelection: 1, minDetectionConfidence: 0.5 });
  faceDetection.onResults(onFaceResults);

  async function detectFaces() {
    faceCanvas.width = video.videoWidth;
    faceCanvas.height = video.videoHeight;
    const canvasCtx = faceCanvas.getContext('2d');

    const sendFrame = async () => {
      await faceDetection.send({ image: video });
      requestAnimationFrame(sendFrame);
    };
    sendFrame();
  }
  detectFaces();
}

function onFaceResults(results) {
  faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  if (results.detections) {
    results.detections.forEach(detection => {
      const box = detection.boundingBox;
      faceCtx.strokeStyle = 'red';
      faceCtx.lineWidth = 4;
      faceCtx.strokeRect(box.xCenter * faceCanvas.width - box.width * faceCanvas.width / 2,
                         box.yCenter * faceCanvas.height - box.height * faceCanvas.height / 2,
                         box.width * faceCanvas.width,
                         box.height * faceCanvas.height);
    });
  }
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

  recognition.onresult = async function(event) {
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        const command = event.results[i][0].transcript.trim();
        console.log('音声コマンド:', command);
        if (command.includes('分析')) {
          statusText.textContent = 'AI分析実行中...';
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          const imageBase64 = canvas.toDataURL('image/jpeg');

          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageBase64, prompt: command })
          });
          const result = await response.json();
          statusText.textContent = 'AI結果: ' + result.description;
        }
      }
    }
  };
  recognition.start();
}

startCamera().then(() => {
  setupFaceDetection();
  setupVoiceCommands();
});