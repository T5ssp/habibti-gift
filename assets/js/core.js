
(() => {
  const SECRET_CODE = "262";
  const YT_VIDEO_ID = "IPuWTXlSrTw";
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  /* ==========================================
     0. INTERACTIVE STARDUST CANVAS & REWARDS
     ========================================== */
  const starCanvas = $('#stardustCanvas');
  const sCtx = starCanvas.getContext('2d');
  let particles = [];
  let pointer = { x: -500, y: -500 };

  function resizeStarCanvas() {
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeStarCanvas);
  resizeStarCanvas();

  for (let i = 0; i < 75; i++) {
    particles.push({
      x: Math.random() * starCanvas.width,
      y: Math.random() * starCanvas.height,
      r: 0.8 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      alpha: 0.25 + Math.random() * 0.65,
      dAlpha: 0.004 + Math.random() * 0.008,
      gold: Math.random() > 0.35
    });
  }

  window.addEventListener('pointermove', e => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  }, { passive: true });

  function animateStardust() {
    if (document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) { setTimeout(animateStardust, 500); return; }
    sCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += p.dAlpha;
      if (p.alpha > 0.92 || p.alpha < 0.2) p.dAlpha *= -1;
      if (p.x < 0) p.x = starCanvas.width;
      if (p.x > starCanvas.width) p.x = 0;
      if (p.y < 0) p.y = starCanvas.height;
      if (p.y > starCanvas.height) p.y = 0;

      // Subtle attraction/glow near pointer
      const dx = pointer.x - p.x;
      const dy = pointer.y - p.y;
      const dist = Math.hypot(dx, dy);

      sCtx.beginPath();
      sCtx.arc(p.x, p.y, dist < 110 ? p.r * 1.45 : p.r, 0, Math.PI * 2);
      sCtx.fillStyle = p.gold
        ? `rgba(217, 187, 126, ${p.alpha})`
        : `rgba(215, 160, 173, ${p.alpha})`;
      sCtx.fill();
    }
    requestAnimationFrame(animateStardust);
  }
  animateStardust();

  // Toast Helper
  let toastTimeout;
  function showToast(msg) {
    const host = $('#toastContainer');
    host.innerHTML = '';
    const t = document.createElement('div');
    t.className = 'royal-toast';
    t.textContent = msg;
    host.appendChild(t);
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => t.remove(), 3200);
  }

  // Floating Hearts/Sparkles Burst
  function burstSymbols(count = 16, icons = ['♡', '♥', '✦', '✧']) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    count = Math.min(count, innerWidth < 600 ? 8 : 20);
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'floating-symbol';
      el.textContent = icons[Math.floor(Math.random() * icons.length)];
      el.style.left = Math.random() * 96 + 'vw';
      el.style.fontSize = (14 + Math.random() * 18) + 'px';
      el.style.animationDuration = (3.4 + Math.random() * 2.2) + 's';
      el.style.color = Math.random() > 0.45 ? '#d9bb7e' : '#d7a0ad';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 5800);
    }
  }

  // Smile & Spoiling Meter Progression
  let smileProgress = 15;
  function boostSmileMeter(amount = 10) {
    smileProgress = Math.min(100, smileProgress + amount);
    $('#smileBarFill').style.width = smileProgress + '%';
    $('#smilePercentText').textContent = smileProgress + '%';
    if (smileProgress === 100) {
      showToast('وصل مؤشر الابتسامة والدلع إلى 100%! أنتِ رسمياً أسعد ملكة في هالمجرّة 👑♡');
    }
  }

  // Time-Aware Dynamic Greeting
  const greetingsList = [
    'سهرانة لهالحزة؟ القمر المفروض ينام ولا يسهر على هالمجرّة؟ 🌙😂',
    'صباح النور يا أجمل بداية ليومي ☀️♡',
    'طاب يومكِ يا أحلى تفصيلة في هالعالم 🌤️',
    'مساء الورد والهدوء لصاحبة المكان الحلو 🌙✨'
  ];
  let greetingIdx = 0;
  function detectInitialTimeGreeting() {
    const h = new Date().getHours();
    if (h >= 0 && h < 5) greetingIdx = 0;
    else if (h >= 5 && h < 12) greetingIdx = 1;
    else if (h >= 12 && h < 17) greetingIdx = 2;
    else greetingIdx = 3;
    $('#timeGreetingLabel').textContent = greetingsList[greetingIdx];
  }
  detectInitialTimeGreeting();

  $('#timeGreetingBtn').addEventListener('click', () => {
    greetingIdx = (greetingIdx + 1) % greetingsList.length;
    $('#timeGreetingLabel').textContent = greetingsList[greetingIdx];
    burstSymbols(6);
  });

  /* ==========================================
     1. BESPOKE ASTROLABE LOCK LOGIC (262)
     ========================================== */
  let enteredDigits = [];
  let failedTries = 0;
  const wittyLockErrors = [
    'مو هذي الشيفرة يا حلوة… النجوم تقول جرّبي مرة ثانية 🤍',
    'تلميح فلكي: ٣ أرقام تبدأ بـ 2 وتنتهي بـ 2… واللي بالنص بينهم 😌',
    'ركّزي شوي يا ذكية! الرقم اللي بالوسط هو 6 😂',
    'خلاص الشيفرة هي 262! اضغطيها أو اضغطي زر الفتح الفوري تحت 😭♡'
  ];

  function updateAstrolabeDisplay() {
    for (let i = 0; i < 3; i++) {
      const slot = $('#slot' + i);
      const star = $('#lockStar' + i);
      if (enteredDigits[i] !== undefined) {
        slot.textContent = enteredDigits[i];
        slot.classList.add('filled');
        star.classList.add('active');
      } else {
        slot.textContent = '·';
        slot.classList.remove('filled');
        star.classList.remove('active');
      }
    }
    $('#lockLine1').classList.toggle('active', enteredDigits.length >= 2);
    $('#lockLine2').classList.toggle('active', enteredDigits.length >= 3);

    if (enteredDigits.length === 3) {
      const candidate = enteredDigits.join('');
      setTimeout(() => verifyVaultCode(candidate), 180);
    }
  }

  function verifyVaultCode(code) {
    if (code === SECRET_CODE) {
      unlockGalaxyExperience();
    } else {
      const msg = wittyLockErrors[Math.min(failedTries, wittyLockErrors.length - 1)];
      $('#vaultFeedback').textContent = msg;
      document.querySelectorAll('.secret-digit').forEach(input => { input.value = ''; input.setAttribute('aria-invalid','true'); });
      $('#secretDigit0').focus();
      $('#vaultLoginForm').classList.remove('wrong-code');
      requestAnimationFrame(() => $('#vaultLoginForm').classList.add('wrong-code'));
      failedTries++;
      if (failedTries >= 2) {
        $('#vaultQuickOpenBtn').hidden = false;
      }
      enteredDigits = [];
      updateAstrolabeDisplay();
    }
  }

  function unlockGalaxyExperience() {
    if ($('#vaultScreen').style.display === 'none') return;
    $('#vaultScreen').style.display = 'none';
    document.body.dataset.scene = 'world';
    document.dispatchEvent(new CustomEvent('habibti:unlocked'));
    $('#galaxyExperience').classList.add('unlocked');
    $('#floatingDock').hidden = false;
    $('#giftWelcomeTitle').focus({ preventScroll: true });
    burstSymbols(26);
    boostSmileMeter(15);
    showToast('هذي لكِ يا حبيبتي… بكل حبّ 🤍');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $('#vaultLoginForm').addEventListener('submit', event => {
    event.preventDefault();
    const code = Array.from(document.querySelectorAll('.secret-digit')).map(input => input.value).join('');
    verifyVaultCode(code);
  });

  $('#vaultCodeToggle').addEventListener('click', () => {
    const game = $('#vaultCodeGame');
    game.hidden = !game.hidden;
    $('#vaultCodeToggle').setAttribute('aria-expanded', String(!game.hidden));
  });

  const smileNotes = [
    'لو أقدر أرسل لكِ حضن مع هالزر، كان وصل قبل الكلام 🤍',
    'تنبيه لطيف: فيه شخص يبتسم من يسمع اسمكِ. إي، أنا 😌',
    'حتى بيومكِ العادي، أنتِ عندي شيء مميّز ♡',
    'أحب ضحكتكِ، وأحبكِ بكل حالاتكِ 🤍'
  ];
  let smileNoteIndex = 0;
  $('#smileNoteBtn').addEventListener('click', () => {
    const note = $('#smileNoteText');
    note.hidden = false;
    note.textContent = smileNotes[smileNoteIndex];
    smileNoteIndex = (smileNoteIndex + 1) % smileNotes.length;
    $('#smileNoteBtn').textContent = 'وعندي لكِ كلمة ثانية 🤍';
    burstSymbols(8);
  });

  $('#hugGiftBtn').addEventListener('click', () => {
    const note = $('#hugGiftText');
    note.hidden = false;
    note.textContent = 'لو كنت جنبكِ، كان هذي حضنة بدل الزر 🤍';
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      burstSymbols(20, ['♡', '♥', '🤍']);
    }
  });

  $$('.key-btn[data-digit]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (enteredDigits.length < 3) {
        enteredDigits.push(btn.dataset.digit);
        updateAstrolabeDisplay();
      }
    });
  });

  $('#keyClear').addEventListener('click', () => {
    enteredDigits = [];
    updateAstrolabeDisplay();
  });

  $('#keyBackspace').addEventListener('click', () => {
    enteredDigits.pop();
    updateAstrolabeDisplay();
  });

  // Physical Keyboard support on Vault Screen
  window.addEventListener('keydown', e => {
    if ($('#vaultScreen').style.display === 'none' || $('#vaultCodeGame').hidden || e.target.matches('input,textarea')) return;
    if (e.key >= '0' && e.key <= '9') {
      if (enteredDigits.length < 3) {
        enteredDigits.push(e.key);
        updateAstrolabeDisplay();
      }
    } else if (e.key === 'Backspace') {
      enteredDigits.pop();
      updateAstrolabeDisplay();
    }
  });

  $('#vaultHintBtn').addEventListener('click', () => {
    const msg = wittyLockErrors[Math.min(failedTries, wittyLockErrors.length - 1)];
    $('#vaultFeedback').textContent = msg;
    failedTries++;
    $('#vaultQuickOpenBtn').hidden = false;
  });

  $('#vaultQuickOpenBtn').addEventListener('click', () => {
    enteredDigits = ['2', '6', '2'];
    updateAstrolabeDisplay();
  });

  /* ==========================================
     2. CHAPTER 1: STAR OBSERVATORY (5 STARS)
     ========================================== */
  const starData = [
    {
      badge: 'STAR 01 · الكوكبة الأولى',
      title: 'نجمة الضحكة اللي تغيّر الجو',
      body: 'أول نجمة في هالمجرّة سُمّيت على اسم ضحكتكِ… لأنها ببساطة تقدر تمسح تعب يوم كامل في ثواني، وتخلّي الواحد ينسى هو ليش كان متضايق أصلاً.',
      whisper: '✦ ملاحظة الفلكي: حتى لو كانت نكتتي سامجة، مجرد إنكِ تبتسمين مجاملة لي يُعتبر انتصاراً فلكياً عظيماً 😂🤍'
    },
    {
      badge: 'STAR 02 · الكوكبة الثانية',
      title: 'نجمة الحنان واللطف العفوي',
      body: 'هالنجمة تضيء لأن قلبكِ أرقّ وأطيب مما تتخيلين. طريقتكِ في الاهتمام والتفاصيل الصغيرة اللي ما ينتبه لها غيركِ تخلّي وجودكِ نعمة حقيقية.',
      whisper: '✦ سرّ فلكي: لا تنسين تعطين نفسكِ نصيب من الحنان اللي توزعينه على الكل دائماً ♡'
    },
    {
      badge: 'STAR 03 · الكوكبة الثالثة',
      title: 'نجمة الاستهبال والمشاغبة',
      body: 'اعتراف رسمي مسجّل في السجلّات الفلكية: إيه نعم، أتعمد أحياناً أرفع ضغطكِ بالمزح بس عشان أشوف ردة فعلكِ اللطيفة وأنتِ تحاولين تصيرين جادة!',
      whisper: '✦ تنبيه: جميع حقوق المشاغبة محفوظة، ولا تُقبل أي اعتراضات لدى محكمة المجرّة 😌😂'
    },
    {
      badge: 'STAR 04 · الكوكبة الرابعة',
      title: 'نجمة الأمان وراحة البال',
      body: 'بعض الناس وجودهم يشبه هدوء الليل بعد يوم صاخب… وأنتِ بالضبط هالمكان المريح اللي يلقى فيه القلب طمأنينته بدون تكلف ولا تصنّع.',
      whisper: '✦ إشعار: وجودكِ لحاله يختصر مسافة طويلة من الكلام الحلو 🤍'
    },
    {
      badge: 'STAR 05 · نجمة المركز',
      title: 'نجمة القلب المكتمل ♡',
      body: 'حين تجتمع كل هالنجوم مع بعض، ترسم في السماء قلباً واحداً يدلّ عليكِ… لأنكِ أنتِ المحور اللي تدور حوله كل الكلمات اللطيفة في هالموقع.',
      whisper: '✦ اكتملت الكوكبة: كل النجوم تشهد إن مكانكِ بالقلب ثابت ما يتغير أبد 👑♡'
    }
  ];

  const discoveredStars = new Set(['0']);

  function activateStarNode(indexStr) {
    const idx = Number(indexStr);
    const info = starData[idx];
    $('#starBadgeNum').textContent = info.badge;
    $('#starReadingTitle').textContent = info.title;
    $('#starReadingBody').textContent = info.body;
    $('#starReadingWhisper').textContent = info.whisper;

    const hotspot = $(`.star-hotspot[data-star="${idx}"]`);
    if (hotspot) hotspot.classList.add('discovered');

    if (!discoveredStars.has(indexStr)) {
      discoveredStars.add(indexStr);
      boostSmileMeter(10);
      burstSymbols(8);
    }

    // Light up constellation lines progressively
    const count = discoveredStars.size;
    $('#starsCounterText').textContent = `أضأتي ${count} من 5 نجوم ✦`;
    for (let i = 0; i < count; i++) {
      const line = $('#cLine' + i);
      if (line) line.classList.add('lit');
    }
    if (count === 5) {
      $('#cLine5').classList.add('lit');
      showToast('اكتمل رسم كوكبة القلب الذهبي في سماء مرصدكِ! ✨♡');
    }
  }

  $$('.star-hotspot').forEach(node => {
    node.addEventListener('click', () => {
      activateStarNode(node.dataset.star);
    });
  });

  $('#lightAllStarsBtn').addEventListener('click', () => {
    ['0', '1', '2', '3', '4'].forEach(s => activateStarNode(s));
  });

  /* ==========================================
     3. CHAPTER 2: GILDED PARCHMENT FLIP-BOOK
     ========================================== */
  const bookPages = [
    {
      label: 'الفصل الأول · بداية الحكاية',
      title: 'حين سقطت القلاع من غير معركة',
      text: 'تقول المخطوطات القديمة إن صاحب هذا القصر كان يظن نفسه خبيراً في بناء الأسوار العالية والهدوء الثقيل… حتى مرّت طيفُ ابتسامتكِ بالصدفة، فانهارت كل الحصون الدفاعية في لحظة واحدة، وسلّم الحرّاس مفاتيح القلعة طوعاً وقالوا: أهلاً بسيّدة المكان الجديدة.',
      margin: 'بيني وبينك؟ الحصون ما صمدت حتى ثلاث دقايق، بس لزوم الهيبة الأدبية كتبتها كأنها ملحمة تاريخية 😂🤍'
    },
    {
      label: 'الفصل الثاني · الدستور الملكي',
      title: 'قانون الضحكة وضريبة القهوة',
      text: 'في اليوم الأول لجلوسها على عرش المجرّة، أصدرت الملكة مرسوماً يقضي بمنع الزعل منعاً باتاً، وفرض ضريبة يومية من الدلال والكلام الحلو وكوب قهوة مضبوط المزاج… ومن يتأخر في السداد يُحكم عليه بكتابة موقع كامل يعتذر فيه بطريقته الخاصة.',
      margin: 'طبعاً أنا الحين جالس أسدد الضريبة مقدماً بهالموقع عشان أضمن رضا جلالتكِ 😌👑'
    },
    {
      label: 'الفصل الثالث · مسافة الصفر',
      title: 'حين تلاشت الخرائط والمسافات',
      text: 'حاول علماء الفلك والجغرافيا قياس المسافة بين مدينتين على الخريطة، لكنهم اكتشفوا أن كل الأرقام تسقط وتتحول إلى صفرٍ مطلق حين يكون الشخص ساكناً في البال والقلب طوال الوقت.',
      margin: 'يعني علمياً وفلكياً: أنتِ أقرب للقلب من أي مكان ثاني، انتهى النقاش 🤍'
    },
    {
      label: 'الفصل الرابع · الخاتمة المفتوحة',
      title: 'بطلة كل الفصول القادمة',
      text: 'وهكذا طُويت الصفحة الرابعة من كتاب العرش الأبدي على وعدٍ واحد لا يتغير: أن تظلّ أيامكِ محفوفة باللطف والفرح، وأن تبقين أنتِ البطلة الوحيدة التي تُكتب لأجلها أجمل الحكايات.',
      margin: 'انتهى الكتاب، بس حكاية دلعكِ ما لها صفحة أخيرة أبد ♡'
    }
  ];

  let currentPage = 0;
  const arabicNums = ['١', '٢', '٣', '٤'];

  function renderBookPage(idx) {
    currentPage = idx;
    const custom = window.GiftExtras?.data.cinematic?.book?.[idx];
    const p = custom ? {...bookPages[idx], ...custom} : bookPages[idx];
    const content = $('.royal-book');
    content.classList.remove('page-turning');
    void content.offsetWidth;
    content.classList.add('page-turning');
    if ($('#bookIllustrationImage')) {
      const names=['welcome','kingdom','forest','memory-tree'];
      const name=names[idx];
      $('#bookIllustrationImage').src=window.HabibtiAssets?.[name] || `assets/images/${name}.webp`;
    }
    $('#bookPageIndicator').textContent = `صفحة ${arabicNums[idx]} من ٤`;
    $('#bookChapterLabel').textContent = p.label;
    $('#bookPageTitle').textContent = p.title;
    $('#bookPageText').textContent = p.text;
    $('#marginSecretBox').textContent = p.margin;
    $('#marginSecretBox').hidden = true;

    $$('.page-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    boostSmileMeter(5);
  }

  window.HabibtiBook = {pages:bookPages, render:renderBookPage, getCurrentIndex:() => currentPage};

  $('#prevPageBtn').addEventListener('click', () => {
    const prev = (currentPage - 1 + bookPages.length) % bookPages.length;
    renderBookPage(prev);
  });

  $('#nextPageBtn').addEventListener('click', () => {
    const next = (currentPage + 1) % bookPages.length;
    renderBookPage(next);
  });

  $$('.page-dot').forEach(dot => {
    dot.addEventListener('click', () => renderBookPage(Number(dot.dataset.page)));
  });

  $('#toggleMarginNoteBtn').addEventListener('click', () => {
    const box = $('#marginSecretBox');
    box.hidden = !box.hidden;
    if (!box.hidden) {
      burstSymbols(6);
      boostSmileMeter(5);
    }
  });

  /* ==========================================
     4. CHAPTER 3: MOOD APOTHECARY (POTIONS)
     ========================================== */
  const potionsCatalog = {
    laugh: {
      code: 'PRESCRIPTION #262-LAUGH',
      name: 'وصفة: إكسير الضحك الفوري 😂',
      diagnosis: 'نقص حاد في جرعة الاستهبال اليومية، واحتمال وجود جدّية زائدة تحتاج تدخلاً سريعاً.',
      dosage: 'ابتسامة واحدة الحين، مع السماح لصاحب الموقع بإلقاء ٣ نكات بايخة بدون مقاطعة أو شكاوى رسمية.',
      sideEffects: 'ضحكة تطلع فجأة بنص اليوم لما تتذكرين إن فيه شخص مسوّي صيدلية كاملة بملف كود عشان يفرّحكِ 🤍'
    },
    royal: {
      code: 'PRESCRIPTION #262-ROYAL',
      name: 'وصفة: جرعة الدلال الملكي 👑',
      diagnosis: 'الحاجة الفورية لتذكير رسمي بأنكِ أغلى وألطف إنسانة في هالمجرّة كلها.',
      dosage: 'تُؤخذ جرعة مركّزة من الكلام الحلو صباحاً ومساءً، مع إعفاء كامل من أي شيء يعكّر مزاجكِ اليوم.',
      sideEffects: 'زيادة ملحوظة في الدلال، وشعور دافئ بأن مكانكِ بالقلب محفوظ فوق الكل ♡'
    },
    calm: {
      code: 'PRESCRIPTION #262-CALM',
      name: 'وصفة: كبسولة الهدوء والغيم ☁️',
      diagnosis: 'إرهاق خفيف بسبب يوم طويل وزحمة مهام ما تنتهي.',
      dosage: 'خذي نفساً عميقاً، اشربي شيئاً تحبينه، واتركي كل الأشياء تنتظر… راحتكِ أهم من كل الجداول والمواعيد.',
      sideEffects: 'سكينة هادئة تغمر قلبكِ، وطمأنينة تذكّركِ إنكِ مو مطالبة تكونين قوية طول الوقت 🤍'
    },
    longing: {
      code: 'PRESCRIPTION #262-HEART',
      name: 'وصفة: إكسير الشوق الطارئ ✦',
      diagnosis: 'مرور طيفكِ على البال بشكل متكرر وغير قابل للسيطرة البرمجية.',
      dosage: 'تُصرف هذه الوصفة فوراً عبر قراءة هالسطور ومعرفة إنكِ دائماً في البال مهما انشغلنا.',
      sideEffects: 'ابتسامة هادئة وشعور بأن المسافات مجرد أرقام على ورق ♡'
    }
  };

  $$('.potion-vial-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('.potion-vial-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const p = potionsCatalog[card.dataset.potion];
      $('#rxCode').textContent = p.code;
      $('#rxName').textContent = p.name;
      $('#rxDiagnosis').textContent = p.diagnosis;
      $('#rxDosage').textContent = p.dosage;
      $('#rxSideEffects').textContent = p.sideEffects;
      burstSymbols(8);
      boostSmileMeter(8);
    });
  });

  $('#dispenseRxBtn').addEventListener('click', () => {
    burstSymbols(18);
    boostSmileMeter(10);
    showToast('تم صرف الوصفة وتفعيل مفعولها في المجرّة فوراً! 🧪♡');
  });

  /* ==========================================
     5. CHAPTER 4: RIGGED QUIZ & RUNAWAY BUTTON
     ========================================== */
  const quizQuestions = [
    {
      q: 'من هي صاحبة المركز الأول في هالمجرّة بدون أي منافس؟',
      options: [
        'أنا طبعاً (بكل تواضع 😌)',
        'اللي فتحت القفل برمز 262 ♡',
        'الخيار الأول والثاني مع بعض!'
      ],
      reply: 'إجابة صحيحة ١٠٠٪! أصلاً كل الخيارات تشير لكِ أنتِ وحدكِ 👑🤍'
    },
    {
      q: 'وش يصير لو حاولتِ تزعلين أو تعبّسين لمدة خمس دقايق؟',
      options: [
        'تُعلن حالة الطوارئ في المجرّة فوراً 🚨',
        'تنهال عليكِ نكات سامجة لين تضحكين غصب 😂',
        'تُصرف لكِ جرعة دلال مضاعفة من الصيدلية ♡'
      ],
      reply: 'صح عليكِ! النظام هنا مبرمج إنه ما يسمح للزعل يطوّل عندكِ ولا دقيقة 😂✨'
    },
    {
      q: 'كم نسبة الغلاوة المسجلة باسمكِ في قاعدة بيانات القلب؟',
      options: [
        '100% قابلة للزيادة كل يوم',
        'فوق قدرة الآلة الحاسبة على العدّ ∞',
        'كل المساحة المتوفرة محجوزة بالكامل ♡'
      ],
      reply: 'العلامة الكاملة! ختمتِ الاختبار بنجاح باهر كالعادة 😌🤍'
    }
  ];

  let quizIdx = 0;

  function renderQuizQuestion(idx) {
    quizIdx = idx;
    const item = quizQuestions[idx];
    const arStep = ['١', '٢', '٣'][idx];
    $('#quizStepBadge').textContent = `السؤال ${arStep} من ٣`;
    $('#quizQuestionText').textContent = item.q;
    $('#quizReplyBox').hidden = true;

    const box = $('#quizOptionsBox');
    box.innerHTML = '';
    item.options.forEach(optText => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-opt-btn';
      b.textContent = optText;
      b.addEventListener('click', () => {
        const reply = $('#quizReplyBox');
        reply.textContent = item.reply;
        reply.hidden = false;
        burstSymbols(8);
        boostSmileMeter(8);
      });
      box.appendChild(b);
    });
  }
  renderQuizQuestion(0);

  $('#nextQuizBtn').addEventListener('click', () => {
    renderQuizQuestion((quizIdx + 1) % quizQuestions.length);
  });

  // Runaway Button ("الزر الهارب")
  const runawayBtn = $('#runawayBtn');
  const dodgeTexts = [
    'الزر هذا معطّل بأمر ملكي 😌',
    'حاولي مرة ثانية يا ذكية 😂',
    'قسم الشكاوى في إجازة مفتوحة 🤍',
    'ما فيه إلا زر الموافقة صدقيني 😭',
    'هربت منكِ! اضغطي موافقة وارتاحي 😂♡'
  ];
  let dodgeCount = 0;

  function dodgeRunawayButton() {
    const xOffset = (Math.random() * 130 - 65).toFixed(0);
    const yOffset = (Math.random() * 64 - 32).toFixed(0);
    runawayBtn.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    runawayBtn.textContent = dodgeTexts[dodgeCount % dodgeTexts.length];
    dodgeCount++;
  }

  runawayBtn.addEventListener('pointerenter', dodgeRunawayButton);
  runawayBtn.addEventListener('click', e => {
    e.preventDefault();
    dodgeRunawayButton();
  });

  $('#approveForeverBtn').addEventListener('click', () => {
    $('#vipDecreePass').hidden = false;
    $('#approveForeverBtn').textContent = 'تم التوقيع والموافقة للأبد ✓♡';
    runawayBtn.hidden = true;
    burstSymbols(28);
    boostSmileMeter(20);
    showToast('تم اعتماد الموافقة الملكية وإغلاق باب الشكاوى للأبد! 😂👑');
  });

  /* ==========================================
     6. CHAPTER 5: GOLDEN GRAMOPHONE & YOUTUBE
     ========================================== */
  function loadYoutubeTrack(autoplay = true, startSec = 0) {
    if (autoplay) window.HabibtiMusic?.play(startSec);
  }

  const audioModesInfo = {
    full: {
      title: 'أغنيتكِ الخاصة في هالمجرّة ♡',
      desc: 'خذي نفساً هادياً، اسمعيها من البداية، واعتبري هالدقايق فاصل لطيف لكِ وحدكِ.',
      start: 0
    },
    chorus: {
      title: 'المقطع الأقرب للقلب (عند الثانية 0:45) ✦',
      desc: 'انتقلنا مباشرة للمقطع المميز في الأغنية… لأن هالكلمات بالذات تشبه شعوري لما تخطرين على بالي.',
      start: 45
    },
    whisper: {
      title: 'همسة صوتية مكتوبة (تخيّليها بصوتي 😂) 🎙️',
      desc: '« لو كنت أسجل لكِ رسالة صوتية الحين مع هالأغنية، كنت بقول: شكراً لأنكِ تخلين الأيام أخفّ وأحلى بوجودكِ… وخلاص لا تدققين في نبرة الرومانسية الزايدة 😭🤍 »',
      start: 0
    }
  };

  $$('[data-audiomode]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('[data-audiomode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const modeKey = btn.dataset.audiomode;
      const m = audioModesInfo[modeKey];
      $('#audioTrackTitle').textContent = m.title;
      $('#audioTrackDesc').textContent = m.desc;
      if (modeKey === 'chorus') {
        loadYoutubeTrack(true, m.start);
        showToast('بدأنا التشغيل من المقطع المميز (0:45) ✦');
      }
      burstSymbols(8);
      boostSmileMeter(8);
    });
  });

  $('#playRestartSongBtn').addEventListener('click', () => {
    window.HabibtiMusic?.toggle();
  });

  $('#dockQuickPlayBtn').addEventListener('click', () => {
    $('#chapter-sound').scrollIntoView({ behavior: 'smooth' });
    loadYoutubeTrack(true, 0);
  });

  $('#toggleStudioAuraBtn').addEventListener('click', () => {
    const studio = $('#gramophoneStudio');
    studio.classList.toggle('aura-rose');
    studio.classList.toggle('aura-gold');
    burstSymbols(6);
  });

  /* ==========================================
     7. CHAPTER 6: WAX SEAL & KEEPSAKE CANVAS
     ========================================== */
  const finalHeartfeltMessage =
    'يا حبيبتي،\n\n' +
    'ما فيه مناسبة اليوم، بس طريتي على بالي وقلت أسوي لكِ شيء صغير يفرّحكِ.\n\n' +
    'أحبكِ، وأتمنى يكون يومكِ خفيف على قلبكِ. وإذا هالهدية طلّعت منكِ ولو ابتسامة صغيرة، فهذا أحلى شيء عندي.\n\n' +
    'دمتِ لقلبي حبيبتي، بكل أيامكِ 🤍';

  let sealTypingTimer = null;
  window.HabibtiFinal = {
    set(message) {
      clearInterval(sealTypingTimer);
      const box = $('#finalScrollLetter');
      if (!box.hidden) box.textContent = message || finalHeartfeltMessage;
    }
  };
  $('#breakWaxSealBtn').addEventListener('click', () => {
    const btn = $('#breakWaxSealBtn');
    const box = $('#finalScrollLetter');
    if (!box.hidden) return;
    btn.style.transform = 'scale(0.82)';
    btn.style.opacity = '0.45';
    $('#waxHintText').textContent = 'انفضّ الختم الشمعي… تُكتب لكِ الرسالة الآن بحبر القلب ♡';
    box.hidden = false;
    box.textContent = '';
    btn.closest('.wax-scroll-card').classList.add('is-open');
    const message = window.GiftExtras?.data.cinematic?.finalMessage || finalHeartfeltMessage;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { box.textContent=message; return; }

    let i = 0;
    clearInterval(sealTypingTimer);
    sealTypingTimer = setInterval(() => {
      box.textContent += message.charAt(i);
      i++;
      if (i >= message.length) {
        clearInterval(sealTypingTimer);
      }
    }, 22);

    burstSymbols(28);
    boostSmileMeter(20);
  });

  // High-Resolution Canvas Keepsake Card Studio
  const cardQuotes = [
    {
      subtitle: '✦  رسالة خاصة من القلب · 262  ✦',
      heading: 'لحبيبتي، بدون مناسبة 🤍',
      body: 'مو لازم مناسبة عشان أقول لكِ أحبكِ.\n\nهذي هدية صغيرة، ومعها أمنية إن يومكِ يكون خفيف على قلبكِ ومليان أشياء حلوة تشبهكِ.',
      footer: 'هديتي بسيطة، والغلا لكِ كبير ♡'
    },
    {
      subtitle: '✦  ميثاق العرش الأبدي · 262  ✦',
      heading: 'سيّدة المجرّة بلا منافس 👑',
      body: 'تقول سجلّات الفلك إن كل المسافات تتلاشى وتتحول إلى صفرٍ مطلق حين يكون الشخص ساكناً في القلب.\n\nوهذه الوثيقة تشهد أن جميع النجوم والكواكب هنا تدور في فلك ابتسامتكِ وحدكِ للأبد ✨',
      footer: 'ختم المرصد الملكي · شيفرة القلوب: 262'
    },
    {
      subtitle: '✦  اعتراف رسمي موثّق · 262  ✦',
      heading: 'تصريح دلال ومشاغبة مفتوح 😂♡',
      body: 'أعترف رسمياً أني أتعمد أحياناً أزعجكِ بالمزح والاستهبال، بس لأن ضحكتكِ بعدها تسوى الدنيا وما فيها.\n\nحصلتِ بموجب هذه البطاقة على حصانة ملكية مدى الحياة ضد الزعل، مع صلاحية طلب قهوة وكلام حلو في أي وقت!',
      footer: 'صُنعت لكِ بمحبة وشيء بسيط من الاستهبال ♥'
    }
  ];

  let activeQuoteIdx = 0;
  const keepsakeArt = new Image();
  keepsakeArt.onload = () => drawKeepsakeCard(activeQuoteIdx);
  keepsakeArt.src = window.HabibtiAssets?.welcome || 'assets/images/welcome.webp';

  function wrapCanvasLines(ctx, text, maxWidth) {
    const paragraphs = text.split('\n');
    const lines = [];
    paragraphs.forEach(p => {
      if (!p.trim()) {
        lines.push('');
        return;
      }
      const words = p.split(' ');
      let current = words[0];
      for (let i = 1; i < words.length; i++) {
        const test = current + ' ' + words[i];
        if (ctx.measureText(test).width > maxWidth) {
          lines.push(current);
          current = words[i];
        } else {
          current = test;
        }
      }
      lines.push(current);
    });
    return lines;
  }

  function drawKeepsakeCard(quoteIndex = 0) {
    const canvas = $('#keepsakeCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const q = cardQuotes[quoteIndex];

    // Background Gradient in exact palette (--plum, --night2, --night)
    const grad = ctx.createRadialGradient(W / 2, H * 0.28, 50, W / 2, H / 2, H * 0.85);
    grad.addColorStop(0, '#3b1020');
    grad.addColorStop(0.52, '#210914');
    grad.addColorStop(1, '#09060b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if (keepsakeArt.complete && keepsakeArt.naturalWidth) {
      const scale=Math.max(W/keepsakeArt.width,H/keepsakeArt.height);
      ctx.drawImage(keepsakeArt,(W-keepsakeArt.width*scale)/2,(H-keepsakeArt.height*scale)/2,keepsakeArt.width*scale,keepsakeArt.height*scale);
      ctx.fillStyle='rgba(9,6,11,.76)';ctx.fillRect(0,0,W,H);
    }

    // Ornamental Starfield
    for (let i = 0; i < 70; i++) {
      const sx = (i * 197) % W;
      const sy = (i * 251) % H;
      const sr = (i % 3) + 1;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(217, 187, 126, 0.42)' : 'rgba(215, 160, 173, 0.35)';
      ctx.fill();
    }

    // Double Royal Gold & Rose Borders
    ctx.strokeStyle = '#d9bb7e';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(46, 46, W - 92, H - 92);

    ctx.strokeStyle = 'rgba(215, 160, 173, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(68, 68, W - 136, H - 136);

    // Top Astrolabe Emblem
    ctx.beginPath();
    ctx.arc(W / 2, 185, 52, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(217, 187, 126, 0.12)';
    ctx.fill();
    ctx.strokeStyle = '#d9bb7e';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.direction = 'rtl';
    ctx.textAlign = 'center';

    ctx.fillStyle = '#d9bb7e';
    ctx.font = '46px "Amiri", Georgia, serif';
    ctx.fillText('♡', W / 2, 202);

    // Subtitle
    ctx.fillStyle = '#d9bb7e';
    ctx.font = '600 22px "IBM Plex Sans Arabic", sans-serif';
    ctx.fillText(q.subtitle, W / 2, 290);

    // Heading
    ctx.fillStyle = '#fff8f0';
    ctx.font = '700 60px "Amiri", Georgia, serif';
    ctx.fillText(q.heading, W / 2, 380);

    // Golden Line
    ctx.strokeStyle = 'rgba(217, 187, 126, 0.45)';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 180, 425);
    ctx.lineTo(W / 2 + 180, 425);
    ctx.stroke();

    // Body Text
    ctx.fillStyle = '#e9d8dd';
    ctx.font = '40px "Amiri", Georgia, serif';
    const lines = wrapCanvasLines(ctx, q.body, W - 230);
    let y = 520;
    lines.forEach(line => {
      if (line === '') {
        y += 34;
      } else {
        ctx.fillText(line, W / 2, y);
        y += 66;
      }
    });

    // Footer Signoff
    ctx.fillStyle = '#d9bb7e';
    ctx.font = 'italic 38px "Amiri", Georgia, serif';
    ctx.fillText(q.footer, W / 2, H - 175);

    ctx.fillStyle = '#cdbac9';
    ctx.font = '22px "IBM Plex Sans Arabic", sans-serif';
    ctx.fillText('مجرّتكِ الخاصة · نسخة مصممة من الصفر · 262', W / 2, H - 115);
  }

  // Render initial card once fonts are ready
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => drawKeepsakeCard(0));
  } else {
    setTimeout(() => drawKeepsakeCard(0), 300);
  }

  $$('[data-cardquote]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('[data-cardquote]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeQuoteIdx = Number(btn.dataset.cardquote);
      drawKeepsakeCard(activeQuoteIdx);
      burstSymbols(6);
    });
  });

  $('#downloadCardBtn').addEventListener('click', () => {
    drawKeepsakeCard(activeQuoteIdx);
    try {
      const dataUrl = $('#keepsakeCanvas').toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `مجرتك_الخاصة_262_${activeQuoteIdx + 1}.png`;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      a.remove();
      burstSymbols(22);
      boostSmileMeter(15);
      showToast('تم تحميل بطاقة الذكرى بجودة عالية في جهازكِ 📥♡');
    } catch (e) {
      showToast('البطاقة جاهزة أمامكِ، يمكنكِ حفظها مباشرة 🤍');
    }
  });

  $('#sendBurstHeartsBtn').addEventListener('click', () => {
    burstSymbols(35);
    boostSmileMeter(10);
    showToast('امتلأت سماء المجرّة بقلوبكِ الافتراضية! ♡✨');
  });

})();
