const video = document.getElementById('camera');
const analyzeBtn = document.getElementById('analyzeBtn');
const statusText = document.getElementById('statusText');

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  video.srcObject = stream;
}

analyzeBtn.addEventListener('click', async () => {
  statusText.textContent = '画像送信中...';
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  const imageBase64 = canvas.toDataURL('image/jpeg');

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 })
  });
  const result = await response.json();
  statusText.textContent = 'AI結果: ' + result.description;
});

startCamera();