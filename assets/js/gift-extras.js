
(() => {
  'use strict';
  const prefix = 'habibti.extra.v1.';
  const read = (key, fallback) => {
    try { const raw = localStorage.getItem(prefix + key); return raw === null ? fallback : JSON.parse(raw); }
    catch (_) { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(prefix + key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  };
  const $ = selector => document.querySelector(selector);
  const imageData = value => typeof value === 'string' && value.length < 2200000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
  const audioData = value => typeof value === 'string' && value.length < 4500000 && /^data:audio\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/i.test(value);
  const text = (value, limit = 500) => typeof value === 'string' ? value.slice(0, limit) : '';
  function cleanCinematic(value) {
    const c = value && typeof value === 'object' ? value : {};
    const safeImage = value => imageData(value) || /^assets\/images\/(welcome|kingdom|forest|memory-tree|memory-lantern|stars|gramophone)\.webp$/.test(value) ? value : '';
    return {
      memoriesConfigured: c.memoriesConfigured === true,
      memories: Array.isArray(c.memories) ? c.memories.slice(0, 24).filter(x => x && typeof x === 'object').map(x => ({date:text(x.date, 30),title:text(x.title, 120),description:text(x.description,1500),image:safeImage(x.image)})) : [],
      letters: Array.isArray(c.letters) ? c.letters.slice(0,6).map(x => ({title:text(x?.title,100),text:text(x?.text,3000)})) : [],
      book: Array.isArray(c.book) ? c.book.slice(0,4).map(x => ({label:text(x?.label,120),title:text(x?.title,200),text:text(x?.text,5000),margin:text(x?.margin,1000)})) : [],
      finalMessage:text(c.finalMessage,6000)
    };
  }
  const clean = value => {
    const source = value && typeof value === 'object' ? value : {};
    return {
      version: 1,
      cinematic: cleanCinematic(source.cinematic),
      memories: Array.isArray(source.memories) ? source.memories.filter(item => item && imageData(item.image)).slice(0, 6).map(item => ({ image: item.image, caption: typeof item.caption === 'string' ? item.caption.slice(0, 240) : '' })) : [],
      voice: audioData(source.voice) ? source.voice : null,
      reasons: Array.isArray(source.reasons) ? source.reasons.filter(item => typeof item === 'string' && item.trim()).slice(0, 30).map(item => item.trim().slice(0, 240)) : [],
      puzzleImage: imageData(source.puzzleImage) ? source.puzzleImage : null,
      customPuzzle: source.customPuzzle === true
    };
  };
  let embedded = {};
  try { embedded = JSON.parse($('#giftPersonalData').textContent); } catch (_) { /* use safe empty data */ }
  const shared = document.documentElement.dataset.giftShared === 'true';
  const data = clean(shared ? embedded : read('personal', embedded));
  let sourceHTML = '';
  let uploadBusy = false;
  let downloadURL;
  function announce(message) { $('#giftExtrasStatus').textContent = message; }
  function celebrate(count = 12) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < Math.min(30, count); i++) {
      const heart = document.createElement('span');
      heart.className = 'floating-symbol';
      heart.textContent = i % 2 ? '♡' : '♥';
      heart.setAttribute('aria-hidden', 'true');
      heart.style.left = Math.random() * 94 + 'vw';
      heart.style.fontSize = (18 + Math.random() * 16) + 'px';
      document.body.append(heart);
      setTimeout(() => heart.remove(), 6000);
    }
  }
  window.GiftExtras = { data, read, write, announce, celebrate };

  function editorStatus(text) { $('#giftCustomizeStatus').textContent = text; }
  function savePersonal(message = 'حفظنا لمستكِ 🤍') {
    if (!data.customPuzzle) data.puzzleImage = data.memories[0]?.image || null;
    const saved = write('personal', data);
    renderMemories();
    document.dispatchEvent(new CustomEvent('giftpersonalchange'));
    editorStatus(saved ? message : 'الإضافة جاهزة هنا، لكن المتصفح ما قدر يحفظها. حمّل نسخة الهدية قبل إغلاق الصفحة.');
  }
  function renderMemories() {
    const gallery = $('#memoryGiftGallery');
    gallery.replaceChildren();
    $('#memoriesEmpty').hidden = data.memories.length > 0;
    data.memories.forEach((memory, index) => {
      const figure = document.createElement('figure');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'memory-photo-button';
      button.setAttribute('aria-label', 'عرض الذكرى ' + (index + 1));
      const image = document.createElement('img');
      image.src = memory.image;
      image.alt = memory.caption || 'ذكرى من القلب ' + (index + 1);
      image.loading = 'lazy';
      button.append(image);
      button.addEventListener('click', () => {
        $('#giftMemoryLarge').src = memory.image;
        $('#giftMemoryLarge').alt = image.alt;
        $('#giftMemoryLargeCaption').textContent = memory.caption;
        $('#giftMemoryDialog').showModal();
      });
      const caption = document.createElement('figcaption');
      caption.textContent = memory.caption || 'ذكرى غالية 🤍';
      figure.append(button, caption);
      gallery.append(figure);
    });
  }
  function renderMemoryEditor() {
    const editor = $('#giftMemoryEditor');
    editor.replaceChildren();
    data.memories.forEach((memory, index) => {
      const row = document.createElement('div');
      row.className = 'memory-editor-item';
      const label = document.createElement('label');
      label.htmlFor = 'giftCaption' + index;
      label.textContent = 'كلامك على الصورة ' + (index + 1);
      const caption = document.createElement('input');
      caption.id = label.htmlFor;
      caption.maxLength = 240;
      caption.value = memory.caption;
      caption.addEventListener('change', () => { memory.caption = caption.value.trim(); savePersonal(); });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'extra-button secondary';
      remove.textContent = 'حذف الصورة ' + (index + 1);
      remove.addEventListener('click', () => {
        data.memories.splice(index, 1);
        savePersonal('حذفنا الصورة.');
        renderMemoryEditor();
        $('#giftMemoryFiles').focus();
      });
      row.append(label, caption, remove);
      editor.append(row);
    });
  }
  function renderVoice() {
    const audio = $('#personalVoiceAudio');
    audio.pause();
    audio.removeAttribute('src');
    if (data.voice) audio.src = data.voice;
    audio.load();
    audio.hidden = !data.voice;
    $('#playVoiceGift').disabled = !data.voice;
    $('#voiceGiftEmpty').hidden = Boolean(data.voice);
    $('#removeGiftVoice').hidden = !data.voice;
    $('#playVoiceGift').textContent = 'اسمعي رسالتي ♡';
    $('#voiceGiftStatus').textContent = '';
  }
  async function fileAsData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('ما قدرنا نقرأ الملف، جرّب تختاره مرة ثانية.'));
      reader.readAsDataURL(file);
    });
  }
  async function resizePhoto(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      throw new Error('اختر صورة JPEG أو PNG أو WebP، حجمها أقل من 10 ميغابايت.');
    }
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff8f0';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', .8);
    } catch (_) { throw new Error('ما قدرنا نفتح الصورة. جرّب صورة ثانية.'); }
    finally { bitmap?.close(); }
  }
  async function upload(action) {
    if (uploadBusy) { editorStatus('انتظر لحظة لين تكتمل الإضافة الحالية.'); return; }
    uploadBusy = true;
    $('#downloadPersonalGift').disabled = true;
    try { editorStatus('لحظة، نجهّز الإضافة…'); await action(); }
    catch (error) { editorStatus(error.message); }
    finally { uploadBusy = false; $('#downloadPersonalGift').disabled = false; }
  }
  function saveReasons() {
    data.reasons = $('#giftReasonsInput').value.split('\n').map(line => line.trim()).filter(Boolean).slice(0, 30).map(line => line.slice(0, 240));
    $('#giftReasonsInput').value = data.reasons.join('\n');
  }
  function downloadGift() {
    if (uploadBusy) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    saveReasons();
    savePersonal();
    const snapshot = new DOMParser().parseFromString(sourceHTML, 'text/html');
    snapshot.documentElement.dataset.giftShared = 'true';
    snapshot.querySelector('#giftPersonalData').textContent = JSON.stringify(clean(data)).replace(/</g, String.fromCharCode(92) + 'u003c');
    const file = new Blob(['<!DOCTYPE html>\n' + snapshot.documentElement.outerHTML], { type: 'text/html;charset=utf-8' });
    if (downloadURL) URL.revokeObjectURL(downloadURL);
    downloadURL = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = downloadURL;
    link.download = 'هدية_لحبيبتي.html';
    document.body.append(link);
    link.click();
    link.remove();
    editorStatus('نسخة الهدية جاهزة، وتضم الصور والصوت والكلام اللي أضفته. ما نُشرت على الإنترنت.');
  }
  function initialize() {
    sourceHTML = window.HabibtiStandaloneSource || ('<!DOCTYPE html>\n' + document.documentElement.outerHTML);
    renderMemories();
    renderMemoryEditor();
    renderVoice();
    $('#giftReasonsInput').value = data.reasons.join('\n');
    $('#removeGiftPuzzle').hidden = !data.customPuzzle;
    $('#giftMemoryFiles').addEventListener('change', event => {
      const files = Array.from(event.target.files);
      upload(async () => {
        if (files.length + data.memories.length > 6) throw new Error('نقدر نضيف 6 صور. احذف صورة قديمة إذا تبي تبدّلها.');
        const additions = [];
        for (const file of files) additions.push({ image: await resizePhoto(file), caption: '' });
        data.memories.push(...additions);
        savePersonal('أضفنا الصور. تقدر تكتب تعليقك تحت كل وحدة.');
        renderMemoryEditor();
      }).finally(() => { event.target.value = ''; });
    });
    $('#giftVoiceFile').addEventListener('change', event => {
      const file = event.target.files[0];
      if (!file) return;
      upload(async () => {
        if (!file.type.startsWith('audio/') || file.size > 3 * 1024 * 1024) throw new Error('اختر تسجيلًا صوتيًا حجمه أقل من 3 ميغابايت.');
        const voice = await fileAsData(file);
        if (!audioData(voice)) throw new Error('صيغة التسجيل مو مدعومة. جرّب MP3 أو WAV.');
        data.voice = voice;
        renderVoice();
        savePersonal('أضفنا صوتك. جرّب تشغيله من بطاقة الرسالة الصوتية 🤍');
      }).finally(() => { event.target.value = ''; });
    });
    $('#giftPuzzleFile').addEventListener('change', event => {
      const file = event.target.files[0];
      if (!file) return;
      upload(async () => {
        data.puzzleImage = await resizePhoto(file);
        data.customPuzzle = true;
        $('#removeGiftPuzzle').hidden = false;
        savePersonal('أضفنا صورة البازل.');
      }).finally(() => { event.target.value = ''; });
    });
    $('#removeGiftPuzzle').addEventListener('click', () => {
      data.customPuzzle = false;
      $('#removeGiftPuzzle').hidden = true;
      savePersonal('البازل يستخدم أول صورة من الذكريات، أو قلوب إذا ما فيه صور.');
    });
    $('#removeGiftVoice').addEventListener('click', () => { data.voice = null; renderVoice(); savePersonal('حذفنا التسجيل.'); });
    $('#saveGiftReasons').addEventListener('click', () => { saveReasons(); savePersonal('حفظنا كلامك 🤍'); });
    $('#downloadPersonalGift').addEventListener('click', downloadGift);
    const audio = $('#personalVoiceAudio');
    $('#playVoiceGift').addEventListener('click', async () => {
      if (!data.voice) return;
      if (!audio.paused) { audio.pause(); return; }
      try { await audio.play(); }
      catch (_) { $('#voiceGiftStatus').textContent = 'ما قدر المتصفح يشغّل التسجيل. جرّب ملف MP3 أو WAV.'; }
    });
    audio.addEventListener('play', () => { $('#playVoiceGift').textContent = 'إيقاف الرسالة مؤقتًا ♡'; });
    audio.addEventListener('pause', () => { $('#playVoiceGift').textContent = 'اسمعي رسالتي ♡'; });
    audio.addEventListener('error', () => { if (data.voice) $('#voiceGiftStatus').textContent = 'صيغة التسجيل ما اشتغلت على هالمتصفح. جرّب MP3 أو WAV.'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
