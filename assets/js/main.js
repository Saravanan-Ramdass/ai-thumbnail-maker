/* thumbnail maker - client side only
   Works in browser without backend: creates canvas, layers bg image/color and text
   Replace or extend with AI backend later (backendURL variable).
*/

const platformSelect = document.getElementById('platform');
const bgUpload = document.getElementById('bgUpload');
const bgColor = document.getElementById('bgColor');
const titleText = document.getElementById('titleText');
const subtitleText = document.getElementById('subtitleText');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const canvas = document.getElementById('thumbCanvas');
const ctx = canvas.getContext('2d');
const sizeLabel = document.getElementById('sizeLabel');
const styleButtons = document.querySelectorAll('.styleBtn');
let chosenStyle = 'clean';
let bgImage = null;

// optional backend (if you later add AI generation)
// const backendURL = "https://your-backend.example.com/generate";

const platformSizes = {
  youtube: {w:1280, h:720},
  instagram: {w:1080, h:1080},
  tiktok: {w:1024, h:1024}
};

styleButtons.forEach(b => b.addEventListener('click', () => {
  styleButtons.forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  chosenStyle = b.dataset.style;
}));

bgUpload.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    const img = new Image();
    img.onload = function(){ bgImage = img; }
    img.src = ev.target.result;
  };
  reader.readAsDataURL(f);
});

function setCanvasSizeForPlatform() {
  const platform = platformSelect.value;
  const s = platformSizes[platform];
  canvas.width = s.w;
  canvas.height = s.h;
  sizeLabel.textContent = `Size: ${s.w} × ${s.h}`;
}

// text wrap helper
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let testLine, metrics;
  for (let n = 0; n < words.length; n++) {
    testLine = line + words[n] + ' ';
    metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function render() {
  setCanvasSizeForPlatform();
  // background
  const platform = platformSelect.value;
  const s = platformSizes[platform];
  // draw background color
  ctx.fillStyle = bgColor.value;
  ctx.fillRect(0,0,canvas.width, canvas.height);

  // draw bg image if exists (cover)
  if (bgImage) {
    // calculate cover
    const img = bgImage;
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (canvas.width - w)/2;
    const y = (canvas.height - h)/2;
    ctx.drawImage(img, x, y, w, h);
  }

  // overlay styles
  if (chosenStyle === 'dramatic') {
    // dark gradient at bottom
    const g = ctx.createLinearGradient(0, canvas.height*0.4, 0, canvas.height);
    g.addColorStop(0, 'rgba(0,0,0,0.0)');
    g.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,canvas.width, canvas.height);
  } else if (chosenStyle === 'bold') {
    // subtle vignette
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0,0,canvas.width, canvas.height);
  }

  // big title
  const title = titleText.value.trim() || 'Your big clickable title';
  const subtitle = subtitleText.value.trim();

  // set fonts according to platform size
  let titleSize = Math.round(canvas.height * 0.18);
  if (platform === 'youtube') titleSize = Math.round(canvas.height * 0.18);
  if (platform === 'instagram') titleSize = Math.round(canvas.height * 0.14);
  if (platform === 'tiktok') titleSize = Math.round(canvas.height * 0.15);

  // text shadow / outline for readability
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  // title style
  if (chosenStyle === 'clean') {
    ctx.font = `bold ${titleSize}px Inter, Arial`;
    ctx.fillStyle = '#ffffff';
    // black stroke to improve contrast
    ctx.lineWidth = Math.max(3, Math.round(titleSize * 0.06));
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    // position
    const pad = Math.round(canvas.width * 0.05);
    const maxW = canvas.width - pad*2;
    // stroke & fill wrapped text
    ctx.lineJoin = 'round';
    // stroke + fill in multi-line
    // draw stroke then fill per line
    const lines = [];
    // simple wrap logic to compute lines
    ctx.font = `bold ${titleSize}px Inter, Arial`;
    let words = title.split(' ');
    let cur = '';
    for (let w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    let y = canvas.height - pad - (lines.length * titleSize) - (subtitle ? titleSize*0.6 : 0);
    // ensure not negative
    if (y < pad) y = pad;
    // draw lines
    ctx.font = `bold ${titleSize}px Inter, Arial`;
    ctx.lineWidth = Math.max(3, Math.round(titleSize * 0.06));
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.fillStyle = '#fff';
    for (let i=0;i<lines.length;i++) {
      const t = lines[i];
      ctx.strokeText(t, pad, y + i*titleSize);
      ctx.fillText(t, pad, y + i*titleSize);
    }

    // subtitle
    if (subtitle) {
      const subSize = Math.round(titleSize * 0.45);
      ctx.font = `600 ${subSize}px Inter, Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      const subY = y + lines.length*titleSize + Math.round(subSize*0.5);
      ctx.lineWidth = Math.max(2, Math.round(subSize * 0.04));
      ctx.strokeText(subtitle, pad, subY);
      ctx.fillText(subtitle, pad, subY);
    }
  } else {
    // bold/dramatic styles draw larger with colored subtitle box
    const pad = Math.round(canvas.width * 0.06);
    ctx.font = `bold ${titleSize}px Inter, Arial`;
    // shadow effect
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    const maxW = canvas.width - pad*2;

    // wrap and draw
    ctx.shadowBlur = 10;
    ctx.lineWidth = Math.max(4, Math.round(titleSize * 0.08));
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    let words = title.split(' ');
    let lines = [], cur='';
    for (let w of words) {
      const test = cur ? cur + ' ' + w : w;
      ctx.font = `bold ${titleSize}px Inter, Arial`;
      if (ctx.measureText(test).width > maxW) {
        lines.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) lines.push(cur);
    let y = pad;
    for (let i=0;i<lines.length;i++){
      ctx.strokeText(lines[i], pad, y + i*(titleSize*0.9));
      ctx.fillText(lines[i], pad, y + i*(titleSize*0.9));
    }

    // subtitle in colored pill
    if (subtitle) {
      const subSize = Math.round(titleSize * 0.36);
      ctx.font = `600 ${subSize}px Inter, Arial`;
      const pillW = ctx.measureText(subtitle).width + 28;
      const pillH = Math.round(subSize*1.4);
      const pillX = pad;
      const pillY = canvas.height - pad - pillH;
      // pill background
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(pillX, pillY, pillW, pillH);
      ctx.fillStyle = '#fff';
      ctx.fillText(subtitle, pillX + 12, pillY + (pillH - subSize)/2);
    }
    // reset shadow
    ctx.shadowBlur = 0;
  }
}

// wire up generate button
generateBtn.addEventListener('click', () => {
  // render preview
  render();
  downloadBtn.disabled = false;
});

// download
downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `thumbnail-${platformSelect.value}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// update canvas when platform changes to show correct preview size
platformSelect.addEventListener('change', () => {
  setCanvasSizeForPlatform();
  render();
});

// initialize
(function init(){
  // default style active
  document.querySelector('.styleBtn[data-style="clean"]').classList.add('active');
  setCanvasSizeForPlatform();
  // render sample initial
  ctx.fillStyle = '#111';
  ctx.fillRect(0,0,canvas.width, canvas.height);
  render();
})();
