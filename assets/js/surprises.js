
document.addEventListener('DOMContentLoaded', () => {
(() => {
  'use strict';
  const G = window.GiftExtras;
  if (!G) return;
  const $ = selector => document.querySelector(selector);
  const arabic = n => n.toLocaleString('ar');
  // Rejection sampling keeps each surprise equally likely.
  function randomInt(limit) {
    const values = new Uint32Array(1);
    const ceiling = Math.floor(4294967296 / limit) * limit;
    do { crypto.getRandomValues(values); } while (values[0] >= ceiling);
    return values[0] % limit;
  }

  const surprises = [
    'غزل لكِ: حتى يومكِ العادي، أنتِ عندي شيء مميّز ♡',
    'حضن لكِ: لو أقدر أحطّه داخل الشاشة، كان وصل الحين 🤍',
    'وردة لكِ: هذي وردة صغيرة من شخص يحبكِ 🌷',
    'ضحكة لكِ: كنت بكتب بيت شعر… بس البيت طلب إجازة 😂',
    'دلع لكِ: خذي دقيقة لكِ، وشيء تحبينه، وكلمة: أحبكِ 🤍',
    'قلب لكِ: ♡ هذا صغير بالشاشة، وغلاكِ أكبر منه بكثير.'
  ];
  let angle = 0;
  let spinning = false;
  $('#spinAffectionWheel').addEventListener('click', () => {
    if (spinning) return;
    spinning = true;
    const button = $('#spinAffectionWheel');
    button.disabled = true;
    button.textContent = 'تدور لكِ… ✨';
    $('#affectionWheelResult').textContent = 'لحظة… المفاجأة بالطريق ♡';
    const chosen = randomInt(surprises.length);
    const target = (360 - (chosen * 60 + 30)) % 360;
    const current = ((angle % 360) + 360) % 360;
    angle += 1440 + (target - current + 360) % 360;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    $('#affectionWheelDisc').style.transform = `rotate(${angle}deg)`;
    function finish() {
      $('#affectionWheelResult').textContent = surprises[chosen];
      button.disabled = false;
      button.textContent = 'لفة ثانية؟ 🎡';
      spinning = false;
      G.celebrate(10);
    }
    if (reduced) finish();
    else setTimeout(finish, 2900);
  });

  let pieces = [];
  let selected = null;
  let solved = false;
  function usablePhoto() {
    const photo = G.data.puzzleImage;
    return typeof photo === 'string' && /^data:image\/(?:jpeg|png|webp);base64,/.test(photo) ? photo : '';
  }
  let photo = usablePhoto();
  const board = $('#lovePuzzleBoard');
  function renderPuzzle(focusIndex) {
    board.replaceChildren();
    pieces.forEach((piece, index) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'love-puzzle-tile';
      tile.dataset.piece = String(piece);
      tile.dataset.position = String(index);
      tile.setAttribute('aria-pressed', String(index === selected));
      tile.setAttribute('aria-label', `القطعة ${arabic(piece + 1)}، المكان ${arabic(index + 1)}`);
      const label = document.createElement('span');
      label.textContent = photo ? arabic(piece + 1) : `${['♡', '♥', '🤍'][piece % 3]} ${arabic(piece + 1)}`;
      label.setAttribute('aria-hidden', 'true');
      tile.appendChild(label);
      if (photo) {
        tile.classList.add('has-photo');
        tile.style.backgroundImage = `url("${photo}")`;
        tile.style.backgroundPosition = `${(piece % 3) * 50}% ${Math.floor(piece / 3) * 50}%`;
      }
      tile.addEventListener('click', () => {
        if (solved) return;
        if (selected === null) {
          selected = index;
          $('#lovePuzzleResult').textContent = 'اختاري قطعة ثانية عشان يتبدّلون ♡';
        } else if (selected === index) {
          selected = null;
          $('#lovePuzzleResult').textContent = 'اختاري أي قطعتين لتبديل مكانهما.';
        } else {
          [pieces[selected], pieces[index]] = [pieces[index], pieces[selected]];
          selected = null;
          solved = pieces.every((value, position) => value === position);
          $('#lovePuzzleResult').textContent = solved ? 'اكتمل البازل! وكل القطع تقول: أحبكِ 🤍' : 'حلو! كم قطعة وبنشوفها كاملة ♡';
          if (solved) G.celebrate(18);
        }
        renderPuzzle(index);
      });
      board.appendChild(tile);
    });
    if (Number.isInteger(focusIndex)) board.children[focusIndex].focus({ preventScroll: true });
  }
  function shufflePuzzle() {
    pieces = Array.from({ length: 9 }, (_, i) => i);
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    if (pieces.every((value, index) => value === index)) [pieces[0], pieces[1]] = [pieces[1], pieces[0]];
    selected = null;
    solved = false;
    $('#lovePuzzleInstructions').textContent = photo
      ? 'اختاري قطعتين لتبديل مكانهما، ورتّبي الصورة من ١ إلى ٩، من اليسار لليمين.'
      : 'اختاري قطعتين لتبديل مكانهما، ورتّبي القلوب من ١ إلى ٩، من اليسار لليمين. لو أضفتي صورة من التخصيص، بتصير هي البازل.';
    $('#lovePuzzleResult').textContent = 'كل قطعة لها مكانها… مثل غلاكِ بالقلب ♡';
    renderPuzzle();
  }
  $('#shuffleLovePuzzle').addEventListener('click', shufflePuzzle);
  document.addEventListener('giftpersonalchange', () => {
    const newPhoto = usablePhoto();
    if (newPhoto !== photo) {
      photo = newPhoto;
      shufflePuzzle();
    }
  });
  shufflePuzzle();

  const flowers = ['🌷', '🌹', '🌼', '🌸', '🌻'];
  const savedGarden = G.read('gardenFlowers', []);
  let garden = (Array.isArray(savedGarden) ? savedGarden : []).filter(flower => (
    flower && Number.isFinite(flower.x) && flower.x >= 5 && flower.x <= 95 &&
    Number.isFinite(flower.y) && flower.y >= 20 && flower.y <= 92 &&
    Number.isInteger(flower.kind) && flower.kind >= 0 && flower.kind < flowers.length
  )).slice(0, 30);
  const plot = $('#littleGardenPlot');
  function renderGarden() {
    plot.querySelectorAll('.little-garden-flower').forEach(flower => flower.remove());
    garden.forEach(flower => {
      const bloom = document.createElement('span');
      bloom.className = 'little-garden-flower';
      bloom.textContent = flowers[flower.kind];
      bloom.style.left = `${flower.x}%`;
      bloom.style.top = `${flower.y}%`;
      plot.appendChild(bloom);
    });
    $('#littleGardenHint').hidden = garden.length > 0;
    $('#littleGardenCount').textContent = garden.length === 30
      ? 'اكتملت باقتكِ بثلاثين وردة 🌷 تقدرين تبدئين حديقة جديدة متى حبيتي.'
      : `في حديقتكِ ${arabic(garden.length)} من ٣٠ وردة 🌷`;
    $('#plantGardenFlower').disabled = garden.length >= 30;
    $('#clearLittleGarden').disabled = garden.length === 0;
  }
  function plant(x, y) {
    if (garden.length >= 30) return;
    garden.push({ x: Math.max(5, Math.min(95, x)), y: Math.max(20, Math.min(92, y)), kind: randomInt(flowers.length) });
    const retained = G.write('gardenFlowers', garden);
    renderGarden();
    if (!retained) G.announce('زرعنا وردتكِ هنا، لكن جهازكِ ما قدر يحفظ الحديقة للمرة الجاية.');
  }
  plot.addEventListener('click', event => {
    const bounds = plot.getBoundingClientRect();
    if (bounds.width > 0 && bounds.height > 0) plant((event.clientX - bounds.left) / bounds.width * 100, (event.clientY - bounds.top) / bounds.height * 100);
  });
  $('#plantGardenFlower').addEventListener('click', () => plant(8 + randomInt(85), 32 + randomInt(57)));
  $('#clearLittleGarden').addEventListener('click', () => {
    garden = [];
    const retained = G.write('gardenFlowers', garden);
    renderGarden();
    if (!retained) G.announce('مسحنا الورد هنا، لكن جهازكِ ما قدر يحفظ التغيير للمرة الجاية.');
  });
  renderGarden();
})();

}, { once: true });
