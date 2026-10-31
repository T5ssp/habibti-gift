/* Editable keepsakes. All personal data remains in the browser or downloaded gift. */
(() => {
  'use strict';

  function initializePersonalization() {
    const gift = window.GiftExtras;
    if (!gift) return;
    const $ = selector => document.querySelector(selector);
    const make = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const button = (text, className = 'extra-button secondary') => {
      const node = make('button', className, text);
      node.type = 'button';
      return node;
    };
    const asset = name => window.HabibtiAssets?.[name] || `assets/images/${name}.webp`;
    const limit = (text, length) => typeof text === 'string' ? text.slice(0, length) : '';
    const imageSafe = value => typeof value === 'string' && (
      /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 2200000 ||
      /^assets\/images\/(?:welcome|kingdom|forest|gramophone|memory-tree|memory-lantern|stars)\.webp$/.test(value)
    );
    const imageSource = value => /^assets\/images\//.test(value)
      ? asset(value.split('/').pop().replace('.webp', '')) : value;
    const defaults = [
      { date: '', title: 'البدايات الصغيرة', description: 'بعض الحكايات تبدأ بكلمة… ثم تصبح عالمًا كاملًا.', image: 'assets/images/memory-tree.webp' },
      { date: '', title: 'قمرٌ يشبهكِ', description: 'ولكل ليلة هادئة حكاية، ولكِ من كل حكاية أجملها.', image: 'assets/images/welcome.webp' },
      { date: '', title: 'بين الورد والضوء', description: 'تفاصيل صغيرة تبقى في القلب، مهما مرّ الوقت.', image: 'assets/images/memory-lantern.webp' },
      { date: '', title: 'والقادم أجمل', description: 'ما زال في الحكاية متّسع لذكريات جديدة معكِ.', image: 'assets/images/kingdom.webp' }
    ];
    const letterDefaults = [
      { title: 'إذا تعبتي', text: 'إذا يومكِ ثقيل، خذي لكِ نفس وراحة على مهلكِ. مو لازم تنجزين كل شيء اليوم، أنتِ غالية بكل حالاتكِ 🤍' },
      { title: 'إذا اشتقتِ', text: 'لو اشتقتِ لي، هذي حضنة صغيرة بالكلام. لكِ غلا كبير، حتى لو هالرسالة صغيرة ♡' },
      { title: 'إذا ودّك تضحكين', text: 'كنت بكتب لكِ قصيدة، بس القافية أخذت إجازة 😂 فقلت أجي بنفسي وأقول: أحبكِ يا أحلى من يلخبط كلامي.' },
      { title: 'إذا احتجتِ كلمة حلوة', text: 'أنتِ من تلك التفاصيل التي تجعل يومًا عاديًا أجمل. خذي هذه الكلمة معكِ: وجودكِ فرحة، وقلبكِ غالٍ جدًا.' },
      { title: 'إذا فرحتي', text: 'يا حلو فرحتكِ! أتمنى يطول هالشعور، وأن تحمل لكِ الأيام أشياء تشبه ضحكتكِ في حلاوتها ♡' },
      { title: 'قبل ما تنامين', text: 'اتركي تعب اليوم خلفكِ، ونامي وقلبكِ مطمئن. لكِ دعوة هادئة بليلة لطيفة وأحلام جميلة وصباح يشبهكِ 🤍' }
    ];
    if (!gift.data.cinematic || typeof gift.data.cinematic !== 'object') gift.data.cinematic = {};
    const config = gift.data.cinematic;
    config.memories = Array.isArray(config.memories) ? config.memories : [];
    config.letters = Array.isArray(config.letters) ? config.letters : [];
    config.book = Array.isArray(config.book) ? config.book : [];
    const customStatus = make('p', 'extra-copy cinematic-editor-status');
    customStatus.id = 'cinematicEditorStatus';
    customStatus.setAttribute('role', 'status');
    let albumIndex = 0;
    let currentMemories = [];
    let currentAlbum = [];
    let photoBusy = false;

    function save(message) {
      const persisted = gift.write('personal', gift.data);
      customStatus.textContent = persisted ? (message || 'حُفظت لمستكِ على هذا الجهاز ♡')
        : 'التعديل جاهز لهذه الزيارة، لكن مساحة التخزين غير متاحة. حمّلي نسخة الهدية قبل إغلاق الصفحة.';
      document.dispatchEvent(new CustomEvent('giftpersonalchange'));
      return persisted;
    }

    function openImage(image, caption) {
      const dialog = $('#giftMemoryDialog');
      if (!dialog) return;
      $('#giftMemoryLarge').src = imageSource(image);
      $('#giftMemoryLarge').alt = caption || 'صورة من عالمنا';
      $('#giftMemoryLargeCaption').textContent = caption || '';
      if (!dialog.open) dialog.showModal();
    }

    function heading(kicker, title, description) {
      const header = make('div', 'chapter-header');
      header.append(make('span', 'chapter-tag', kicker), make('h2', 'chapter-heading', title), make('p', 'chapter-desc', description));
      return header;
    }

    const timelineHost = $('#chapter-memories .chapter-container');
    const timeline = make('div', 'memory-timeline');
    timeline.id = 'memoryTimeline';
    const timelineNote = make('p', 'extra-copy timeline-note');
    const editTimeline = button('أضيفي لحظتنا الأولى ♡');
    editTimeline.id = 'editTimelineShortcut';
    if (timelineHost) {
      timelineHost.replaceChildren(heading('كل لحظة… فصل من حكايتنا', 'ذكرياتنا', 'أشياء لا يغيّرها مرور الوقت.'), timeline, timelineNote, editTimeline);
    }
    function memories() {
      return config.memoriesConfigured || config.memories.length ? config.memories : defaults;
    }
    function displayDate(value, fallback) {
      if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
      const date = new Date(value + 'T12:00:00');
      if (!Number.isFinite(date.getTime())) return fallback;
      return new Intl.DateTimeFormat('ar', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
    }
    function renderTimeline() {
      if (!timelineHost) return;
      currentMemories = memories();
      timeline.replaceChildren();
      currentMemories.forEach((memory, index) => {
        const article = make('article', 'memory-timeline-item');
        article.dataset.reveal = '';
        const marker = make('span', 'timeline-node');
        marker.setAttribute('aria-hidden', 'true');
        const copy = make('div', 'timeline-copy');
        const date = make('time', '', displayDate(memory.date, ['البداية', 'وما بين اللحظات', 'تفاصيل غالية', 'فصل جديد'][index % 4]));
        if (memory.date) date.dateTime = memory.date;
        copy.append(date, make('h3', '', memory.title), make('p', '', memory.description));
        const photoButton = button('', 'timeline-image-button');
        photoButton.setAttribute('aria-label', 'تكبير صورة ' + memory.title);
        const img = make('img');
        img.src = imageSource(imageSafe(memory.image) ? memory.image : defaults[index % defaults.length].image);
        img.alt = memory.title;
        img.loading = 'lazy';
        img.decoding = 'async';
        photoButton.append(img);
        photoButton.addEventListener('click', () => openImage(img.src, memory.description));
        article.append(marker, copy, photoButton);
        timeline.append(article);
      });
      const isIllustration = !config.memoriesConfigured && !config.memories.length;
      timelineNote.textContent = isIllustration
        ? 'مشاهد من عالم الحكاية… أضيفي صوركما وتواريخكما لتصبح هذه المساحة ذكرياتكما.'
        : currentMemories.length ? 'كل ذكرى هنا محفوظة على هذا الجهاز، وتدخل ضمن نسخة الهدية التي تحمّلينها.' : 'تبدأ الحكاية بلحظة… أضيفي أول ذكرى من إعدادات الهدية.';
      editTimeline.textContent = isIllustration || !currentMemories.length ? 'أضيفي لحظتنا الأولى ♡' : 'تعديل الذكريات ♡';
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible', 'reveal-visible');
            observer.unobserve(entry.target);
          }
        }), { threshold: .1 });
        timeline.querySelectorAll('article').forEach(node => observer.observe(node));
      }
    }

    const albumHost = $('#chapter-album .chapter-container');
    const album = make('div', 'cinema-album');
    const featured = button('', 'album-feature');
    featured.id = 'albumFeatured';
    const featuredImage = make('img');
    featuredImage.id = 'albumFeaturedImage';
    featuredImage.decoding = 'async';
    const featuredCaption = make('span', 'album-feature-caption');
    featured.append(featuredImage, featuredCaption);
    featured.addEventListener('click', () => {
      const photo = currentAlbum[albumIndex];
      if (photo) openImage(photo.image, photo.caption);
    });
    const thumbnails = make('div', 'album-thumbnails');
    thumbnails.setAttribute('role', 'group');
    thumbnails.setAttribute('aria-label', 'اختيار صورة الألبوم');
    const albumActions = make('div', 'extra-actions album-actions');
    const uploadPhotos = button('أضيفي صوركما ＋');
    uploadPhotos.id = 'albumUploadPhotos';
    uploadPhotos.addEventListener('click', () => {
      openSettings('#giftMemoryFiles');
      $('#giftMemoryFiles')?.click();
    });
    const editCaptions = button('تعديل الصور والوصف');
    editCaptions.id = 'albumEditCaptions';
    editCaptions.addEventListener('click', () => openSettings('#giftMemoryEditor'));
    albumActions.append(uploadPhotos, editCaptions);
    const albumNote = make('p', 'extra-copy album-note');
    if (albumHost) {
      album.append(featured, thumbnails);
      albumHost.replaceChildren(heading('أشياء نحتفظ بها… إلى الأبد', 'ألبوم الذكريات', 'صورة، ولحظة، وألف شعور.'), album, albumActions, albumNote);
    }
    function selectPhoto(index) {
      albumIndex = Math.max(0, Math.min(index, currentAlbum.length - 1));
      const photo = currentAlbum[albumIndex];
      if (!photo) return;
      featuredImage.src = imageSource(photo.image);
      featuredImage.alt = photo.caption || 'صورة من عالمنا';
      featuredCaption.textContent = photo.caption || 'لحظة قريبة من القلب ♡';
      featured.setAttribute('aria-label', 'فتح الصورة بالحجم الكامل: ' + (photo.caption || 'صورة من عالمنا'));
      thumbnails.querySelectorAll('button').forEach((node, i) => {
        node.classList.toggle('active', i === albumIndex);
        node.setAttribute('aria-pressed', String(i === albumIndex));
      });
    }
    function renderAlbum() {
      if (!albumHost) return;
      const personal = Array.isArray(gift.data.memories) ? gift.data.memories : [];
      const ownTimeline = config.memories.filter(memory => imageSafe(memory.image));
      currentAlbum = personal.length ? personal : ownTimeline.length
        ? ownTimeline.map(memory => ({ image: memory.image, caption: memory.title }))
        : defaults.map(memory => ({ image: memory.image, caption: memory.title }));
      thumbnails.replaceChildren();
      currentAlbum.forEach((photo, index) => {
        const tile = button('', 'album-tile');
        tile.setAttribute('aria-label', 'اختيار الصورة ' + (index + 1) + ': ' + (photo.caption || 'ذكرى غالية'));
        const image = make('img');
        image.src = imageSource(photo.image);
        image.alt = photo.caption || 'ذكرى غالية';
        image.loading = 'lazy';
        tile.append(image);
        tile.addEventListener('click', () => selectPhoto(index));
        thumbnails.append(tile);
      });
      selectPhoto(albumIndex);
      albumNote.textContent = personal.length || ownTimeline.length
        ? 'اضغطي على الصورة الكبيرة لعرضها كاملة. يمكنكِ تعديل الوصف أو حذف الصور من إعدادات الهدية.'
        : 'مشاهد صُمّمت لهذا العالم. أضيفي صوركما لتكتمل الحكاية بلمستكما.';
      editCaptions.hidden = !personal.length;
    }

    function renderLetters() {
      const grid = $('.open-when-grid');
      if (!grid) return;
      while (grid.children.length < 6) {
        const letter = make('details', 'open-when-letter cinema-envelope');
        letter.append(make('summary'), make('p'));
        grid.append(letter);
      }
      [...grid.children].slice(0, 6).forEach((letter, index) => {
        letter.classList.add('cinema-envelope');
        letter.id ||= 'letter-personal-' + index;
        const entry = config.letters[index] || letterDefaults[index];
        const summary = letter.querySelector('summary');
        const seal = make('span', 'envelope-seal', '♡');
        seal.setAttribute('aria-hidden', 'true');
        summary.replaceChildren(seal, make('span', 'envelope-label', 'افتحيني ' + entry.title));
        let text = letter.querySelector('p');
        if (!text) { text = make('p'); letter.append(text); }
        text.textContent = entry.text;
      });
      const tag = $('#chapter-letters .chapter-tag');
      if (tag) tag.textContent = 'ست رسائل… وكل واحدة في وقتها';
      const title = $('#openWhenTitle');
      if (title) title.textContent = 'رسائل الحب';
    }

    const settings = $('#gift-customize');
    function openSettings(selector) {
      if (!settings) return;
      settings.open = true;
      const target = $(selector) || settings;
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLButtonElement) target.focus({ preventScroll: true });
    }
    editTimeline.addEventListener('click', () => openSettings('#timelineEditor'));

    function field(labelText, value, options = {}) {
      const wrap = make('div', 'editor-field extra-field');
      const input = make(options.multiline ? 'textarea' : 'input');
      input.id = options.id || 'cinematicField' + field.count++;
      if (!options.multiline) input.type = options.type || 'text';
      if (options.multiline) input.rows = options.rows || 3;
      if (options.max) input.maxLength = options.max;
      if (options.required) input.required = true;
      input.value = value || '';
      const label = make('label', '', labelText);
      label.htmlFor = input.id;
      wrap.append(label, input);
      return { wrap, input };
    }
    field.count = 0;

    let memoryEditorList;
    function createMemoryEditor() {
      const editor = make('section', 'cinematic-editor');
      editor.id = 'timelineEditor';
      editor.append(make('h3', 'extra-title', 'ذكرياتنا… بتفاصيلنا'), make('p', 'extra-copy', 'أضيفي التاريخ والعنوان والصورة. تبقى البيانات على جهازكِ، وتُضمَّن في نسخة الهدية. حتى 12 ذكرى.'));
      memoryEditorList = make('div', 'timeline-editor-list');
      memoryEditorList.id = 'timelineEditorList';
      const form = make('form', 'memory-editor-card');
      form.id = 'newMemoryForm';
      const title = field('عنوان الذكرى', '', { id: 'newMemoryTitle', max: 120, required: true });
      const date = field('التاريخ (اختياري)', '', { id: 'newMemoryDate', type: 'date' });
      const description = field('حكاية هذه اللحظة', '', { id: 'newMemoryDescription', multiline: true, max: 1500 });
      const photo = field('صورة الذكرى (JPEG أو PNG أو WebP، حتى 10 ميغابايت)', '', { id: 'newMemoryImage', type: 'file' });
      photo.input.accept = 'image/jpeg,image/png,image/webp';
      const submit = button('إضافة ذكرى ♡', 'extra-button');
      submit.type = 'submit';
      form.append(make('h4', '', 'ذكرى جديدة'), title.wrap, date.wrap, description.wrap, photo.wrap, submit);
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (photoBusy) return;
        if (config.memories.length >= 12) { customStatus.textContent = 'وصلتِ إلى 12 ذكرى. يمكنكِ تعديل ذكرى موجودة أو حذفها.'; return; }
        if (!title.input.value.trim()) { title.input.focus(); return; }
        submit.disabled = true;
        try {
          const image = photo.input.files[0] ? await readPhoto(photo.input.files[0]) : defaults[config.memories.length % defaults.length].image;
          config.memories.push({ date: date.input.value, title: title.input.value.trim(), description: description.input.value.trim(), image });
          config.memoriesConfigured = true;
          save('أضفنا الذكرى إلى حكايتكما ♡');
          renderMemoryEditor();
          form.reset();
        } catch (error) { customStatus.textContent = error.message; }
        finally { submit.disabled = false; }
      });
      editor.append(memoryEditorList, form);
      return editor;
    }
    function renderMemoryEditor() {
      if (!memoryEditorList) return;
      memoryEditorList.replaceChildren();
      config.memories.forEach((memory, index) => {
        const row = make('fieldset', 'memory-editor-card');
        row.append(make('legend', '', 'الذكرى ' + (index + 1)));
        const title = field('عنوان الذكرى', memory.title, { id: 'memoryTitle' + index, max: 120 });
        const date = field('التاريخ', memory.date, { id: 'memoryDate' + index, type: 'date' });
        const description = field('الوصف', memory.description, { id: 'memoryDescription' + index, multiline: true, max: 1500 });
        const photo = field('استبدال الصورة', '', { id: 'memoryImage' + index, type: 'file' });
        photo.input.accept = 'image/jpeg,image/png,image/webp';
        const actions = make('div', 'extra-actions');
        const update = button('حفظ التعديل', 'extra-button');
        update.addEventListener('click', async () => {
          if (photoBusy) return;
          if (!title.input.value.trim()) { title.input.focus(); return; }
          update.disabled = true;
          try {
            const image = photo.input.files[0] ? await readPhoto(photo.input.files[0]) : memory.image;
            Object.assign(memory, { title: title.input.value.trim(), date: date.input.value, description: description.input.value.trim(), image });
            save('حُفظ تعديل الذكرى ♡');
            photo.input.value = '';
          } catch (error) { customStatus.textContent = error.message; }
          finally { update.disabled = false; }
        });
        const remove = button('حذف الذكرى');
        remove.addEventListener('click', () => {
          config.memories.splice(index, 1);
          config.memoriesConfigured = true;
          save('حُذفت الذكرى.');
          renderMemoryEditor();
          $('#newMemoryTitle')?.focus();
        });
        const moveUp = button('نقل للأعلى ↑');
        moveUp.disabled = index === 0;
        moveUp.addEventListener('click', () => {
          [config.memories[index - 1], config.memories[index]] = [config.memories[index], config.memories[index - 1]];
          save('تغيّر ترتيب الذكريات.');
          renderMemoryEditor();
        });
        actions.append(update, moveUp, remove);
        row.append(title.wrap, date.wrap, description.wrap, photo.wrap, actions);
        memoryEditorList.append(row);
      });
    }

    async function readPhoto(file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('اختاري صورة JPEG أو PNG أو WebP أصغر من 10 ميغابايت.');
      const exportButton = $('#downloadPersonalGift');
      const exportWasDisabled = exportButton?.disabled;
      if (exportWasDisabled) throw new Error('انتظري حتى تكتمل إضافة الملف الحالي، ثم جرّبي مرة أخرى.');
      photoBusy = true;
      const otherUploads = [...document.querySelectorAll('#giftMemoryFiles, #giftVoiceFile, #giftPuzzleFile')]
        .map(input => ({ input, disabled: input.disabled }));
      otherUploads.forEach(({ input }) => { input.disabled = true; });
      if (exportButton) exportButton.disabled = true;
      let bitmap;
      try {
        bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 1100 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#210914';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', .82);
      } catch (_) { throw new Error('تعذّر قراءة الصورة. جرّبي صورة أخرى.'); }
      finally {
        bitmap?.close();
        photoBusy = false;
        otherUploads.forEach(({ input, disabled }) => { input.disabled = disabled; });
        if (exportButton) exportButton.disabled = exportWasDisabled;
      }
    }

    function createLettersEditor() {
      const editor = make('section', 'cinematic-editor');
      editor.id = 'lettersEditor';
      editor.append(make('h3', 'extra-title', 'رسائل تُشبه صوتك'));
      const fields = [];
      letterDefaults.forEach((fallback, index) => {
        const letter = config.letters[index] || fallback;
        const row = make('details', 'letter-editor-row');
        row.append(make('summary', '', 'الظرف ' + (index + 1) + ' · ' + letter.title));
        const title = field('عنوان الظرف (مثلاً: إذا اشتقتِ)', letter.title, { id: 'letterTitle' + index, max: 100 });
        const text = field('الرسالة داخل الظرف', letter.text, { id: 'letterText' + index, multiline: true, rows: 4, max: 3000 });
        row.append(title.wrap, text.wrap);
        editor.append(row);
        fields.push({ title: title.input, text: text.input, summary: row.querySelector('summary') });
      });
      const saveLetters = button('حفظ رسائل الحب', 'extra-button');
      saveLetters.id = 'saveLoveLetters';
      saveLetters.addEventListener('click', () => {
        config.letters = fields.map((entry, index) => ({ title: entry.title.value.trim() || letterDefaults[index].title, text: entry.text.value.trim() || letterDefaults[index].text }));
        fields.forEach((entry, index) => { entry.summary.textContent = 'الظرف ' + (index + 1) + ' · ' + config.letters[index].title; });
        save('حُفظت الرسائل الستّ ♡');
      });
      editor.append(saveLetters);
      return editor;
    }

    function createStoryEditor() {
      const editor = make('section', 'cinematic-editor');
      editor.id = 'storyEditor';
      editor.append(make('h3', 'extra-title', 'اكتبا حكايتكما'));
      const pages = window.HabibtiBook?.pages || [];
      const fields = [];
      for (let index = 0; index < 4; index++) {
        const fallback = pages[index] || { label: 'الفصل ' + (index + 1), title: '', text: '', margin: '' };
        const page = config.book[index] || fallback;
        const row = make('details', 'story-editor-row');
        row.append(make('summary', '', 'الفصل ' + (index + 1)));
        const label = field('اسم الفصل', page.label, { id: 'storyLabel' + index, max: 120 });
        const title = field('عنوان الصفحة', page.title, { id: 'storyTitle' + index, max: 200 });
        const text = field('الحكاية', page.text, { id: 'storyText' + index, multiline: true, rows: 5, max: 5000 });
        const margin = field('هامش الكاتب السري', page.margin, { id: 'storyMargin' + index, multiline: true, max: 1000 });
        row.append(label.wrap, title.wrap, text.wrap, margin.wrap);
        editor.append(row);
        fields.push({ label: label.input, title: title.input, text: text.input, margin: margin.input });
      }
      const saveBook = button('حفظ فصول الحكاية', 'extra-button');
      saveBook.id = 'saveStoryChapters';
      saveBook.addEventListener('click', () => {
        config.book = fields.map((entry, index) => Object.fromEntries(Object.entries(entry).map(([key, input]) => [key, input.value.trim() || pages[index]?.[key] || ''])));
        save('حُفظت فصول الحكاية وهوامشها السرية ♡');
        window.HabibtiBook?.render(window.HabibtiBook.getCurrentIndex());
      });
      editor.append(saveBook);
      return editor;
    }

    function createFinalEditor() {
      const editor = make('section', 'cinematic-editor');
      editor.id = 'finalMessageEditor';
      editor.append(make('h3', 'extra-title', 'كلمتكِ الأخيرة… من القلب'));
      const message = field('الرسالة المختومة (اتركيها فارغة لاستخدام الرسالة الأصلية)', limit(config.finalMessage, 6000), { id: 'personalFinalMessage', multiline: true, rows: 6, max: 6000 });
      const saveFinal = button('حفظ الرسالة الأخيرة', 'extra-button');
      saveFinal.id = 'saveFinalMessage';
      saveFinal.addEventListener('click', () => {
        config.finalMessage = message.input.value.trim();
        save('حُفظت الرسالة المختومة ♡');
        window.HabibtiFinal?.set(config.finalMessage);
      });
      editor.append(message.wrap, saveFinal);
      return editor;
    }

    if (settings) {
      const section = make('div', 'cinematic-settings');
      section.id = 'cinematicSettings';
      section.append(createMemoryEditor(), createLettersEditor(), createStoryEditor(), createFinalEditor(), customStatus);
      settings.append(section);
      renderMemoryEditor();
    }
    document.addEventListener('giftpersonalchange', () => {
      renderTimeline();
      renderAlbum();
      renderLetters();
    });
    renderTimeline();
    renderAlbum();
    renderLetters();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializePersonalization, { once: true });
  else initializePersonalization();
})();
