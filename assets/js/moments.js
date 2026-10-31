
document.addEventListener('DOMContentLoaded', () => {
(() => {
  'use strict';
  const gift = window.GiftExtras;
  const $ = selector => document.querySelector(selector);
  const dailyMessages = [
    'بس حبيت أذكّركِ اليوم: وجودكِ غالي عندي، حتى في الأيام العادية 🤍',
    'لو هاليوم مزدحم، خذي هاللحظة الصغيرة لكِ… ومعها حب كثير ♡',
    'أحب ضحكتكِ، وأحبكِ بكل حالاتكِ. مو لازم تكونين مبسوطة طول الوقت 🤍',
    'وردة اليوم لكِ 🌷 ومعها أمنية إن يمرّ عليكِ شيء حلو بدون ترتيب.',
    'هذي رسالة صغيرة تقول لكِ: أنتِ في بالي، ولكِ في قلبي مكان كبير ♡',
    'أتمنى تلقين اليوم وقت لشيء تحبينه، حتى لو كوب قهوة بهدوء ☕🤍',
    'أهلًا بحبيبتي مرة ثانية… هالقلب الصغير كان ينتظر مروركِ ♡',
    'ما عندي مناسبة اليوم، عندي بس كلمة: أحبكِ 🤍',
    'خذي يومكِ على مهلكِ، ما يحتاج كل شيء يصير كامل عشان يكون حلو 🌷',
    'شكراً لأنكِ أنتِ… بكل تفاصيلكِ العفوية اللي أحبها ♡',
    'حضن بالكلام، ووردة من القلب، ورسالة كلها لكِ 🤍🌷',
    'لو لهالرسالة صوت، كان قالت لكِ بهدوء: يا حلو وجودكِ ♡',
    'أحيانًا ألطف هدية هي تذكير صغير: لكِ غلا كبير عندي 🤍',
    'عدّى يوم وجا يوم، وهذي كلمة حب جديدة لكِ يا حبيبتي 🌷'
  ];
  function localDay(now) {
    return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  }
  function openDailyEnvelope() {
    const now = new Date();
    const message = dailyMessages[((localDay(now) % dailyMessages.length) + dailyMessages.length) % dailyMessages.length];
    $('#dailyEnvelopeDate').textContent = new Intl.DateTimeFormat('ar', { dateStyle: 'full' }).format(now);
    $('#dailyEnvelopeMessage').hidden = false;
    $('#dailyEnvelopeMessage').textContent = message;
    $('#dailyEnvelopeBtn').textContent = 'رسالة اليوم لكِ… افتحيها متى حبيتي 💌';
  }
  $('#dailyEnvelopeBtn').addEventListener('click', openDailyEnvelope);
  $('#dailyEnvelopeDate').textContent = new Intl.DateTimeFormat('ar', { dateStyle: 'full' }).format(new Date());

  const moods = {
    upset: 'إذا اليوم مو على مزاجكِ، خذي لكِ راحة على مهلكِ. ما يحتاج تشرحين شيء عشان تستاهلين كلمة حلوة وحضن 🤍',
    missing: 'هذي حضنة صغيرة بالكلام، لين نلقى وقتنا مع بعض. وأنا أحبكِ، حتى لو هالزر ما يعرف يقولها بصوتي ♡',
    happy: 'يا حلو فرحتكِ ☀️ خذي هالقلب الصغير يشارككِ اللحظة، وأتمنى يطول هالشعور الحلو معكِ 🤍'
  };
  function chooseMood(mood, save = true) {
    if (!Object.prototype.hasOwnProperty.call(moods, mood)) return;
    $('#moodGiftCard').dataset.mood = mood;
    document.querySelectorAll('[data-gift-mood]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.giftMood === mood));
    });
    $('#moodGiftMessage').hidden = false;
    $('#moodGiftMessage').textContent = moods[mood];
    if (save) gift.write('moodChoice', mood);
  }
  document.querySelectorAll('[data-gift-mood]').forEach(button => {
    button.addEventListener('click', () => chooseMood(button.dataset.giftMood));
  });
  chooseMood(gift.read('moodChoice', ''), false);

  const ideas = {
    coffee: { title: 'قهوة وحكي', description: 'قهوة على مزاجكِ، ووقت نسولف فيه بدون استعجال.' },
    walk: { title: 'مشي على الهادي', description: 'مشوار خفيف بمكان تحبينه، وكلام عفوي بعيد عن الزحمة.' },
    dinner: { title: 'عشاء على ذوقكِ', description: 'اختاري الأكلة اللي بخاطركِ، ونرتّب لنا وقتًا حلوًا على راحتنا.' }
  };
  let selectedIdea = 'coffee';
  let countdownTimer = null;
  let savedPlan = null;
  const whenInput = $('#dateGiftWhen');
  function localInputValue(date) {
    const pad = number => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function parseLocalDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && localInputValue(date) === value ? date : null;
  }
  function refreshMinimum() {
    whenInput.min = localInputValue(new Date(Date.now() + 60000));
  }
  function selectIdea(idea) {
    if (!Object.prototype.hasOwnProperty.call(ideas, idea)) return;
    selectedIdea = idea;
    document.querySelectorAll('[data-date-idea]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.dateIdea === idea));
    });
    $('#dateIdeaDescription').textContent = ideas[idea].description;
  }
  document.querySelectorAll('[data-date-idea]').forEach(button => {
    button.addEventListener('click', () => selectIdea(button.dataset.dateIdea));
  });
  function stopCountdown() {
    if (countdownTimer !== null) window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
  function renderCountdown() {
    if (!savedPlan) return;
    const date = parseLocalDate(savedPlan.when);
    const remaining = date ? date.getTime() - Date.now() : 0;
    if (remaining <= 0) {
      stopCountdown();
      $('#dateGiftCountdown').hidden = true;
      $('#dateGiftStatus').textContent = 'الوقت اللي حفظتيه مرّ. إذا ودّك، اختاري وقتًا جديدًا ونتفق عليه مع بعض 🤍';
      return;
    }
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const n = new Intl.NumberFormat('ar');
    $('#dateGiftCountdown').hidden = false;
    $('#dateGiftCountdown').textContent = `باقي للاقتراح: ${n.format(days)} يوم، ${n.format(hours)} ساعة، ${n.format(minutes)} دقيقة، ${n.format(seconds)} ثانية 🤍`;
  }
  function showSavedPlan(plan, persistent) {
    savedPlan = plan;
    selectIdea(plan.idea);
    whenInput.value = plan.when;
    const date = parseLocalDate(plan.when);
    const formatted = new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    $('#dateGiftStatus').textContent = `${persistent ? 'محفوظ على هذا الجهاز' : 'اختياركِ جاهز لهذه الزيارة فقط'}: ${ideas[plan.idea].title}، ${formatted}. هذا اقتراح، ولا يُرسل تلقائيًا.`;
    stopCountdown();
    renderCountdown();
    if (date.getTime() > Date.now()) countdownTimer = window.setInterval(renderCountdown, 1000);
  }
  $('#dateGiftForm').addEventListener('submit', event => {
    event.preventDefault();
    refreshMinimum();
    const date = parseLocalDate(whenInput.value);
    if (!date || date.getTime() <= Date.now()) {
      $('#dateGiftStatus').textContent = 'اختاري وقتًا قادمًا يناسبكِ، ثم احفظي الاقتراح 🤍';
      whenInput.focus();
      return;
    }
    const plan = { idea: selectedIdea, when: whenInput.value };
    const persistent = gift.write('datePlan', plan);
    showSavedPlan(plan, persistent);
    gift.announce('اختياركِ جاهز، ونتفق على تفاصيله مع بعض 🤍');
  });
  $('#dateGiftClear').addEventListener('click', () => {
    stopCountdown();
    savedPlan = null;
    gift.write('datePlan', null);
    whenInput.value = '';
    selectIdea('coffee');
    $('#dateGiftCountdown').hidden = true;
    $('#dateGiftStatus').textContent = 'تم مسح الاقتراح. اختاري فكرة ووقتًا جديدًا متى حبيتي.';
  });
  whenInput.addEventListener('focus', refreshMinimum);
  whenInput.addEventListener('input', () => whenInput.setCustomValidity(''));
  whenInput.addEventListener('invalid', () => {
    whenInput.setCustomValidity('اختاري تاريخًا ووقتًا قادمين يناسبانكِ.');
    $('#dateGiftStatus').textContent = 'نحتاج تاريخًا ووقتًا قادمين عشان نبدأ العدّ التنازلي 🤍';
  });
  refreshMinimum();
  const priorPlan = gift.read('datePlan', null);
  if (priorPlan && Object.prototype.hasOwnProperty.call(ideas, priorPlan.idea) && parseLocalDate(priorPlan.when)) {
    showSavedPlan({ idea: priorPlan.idea, when: priorPlan.when }, true);
  }
  window.addEventListener('pagehide', stopCountdown);
  window.addEventListener('pageshow', event => {
    if (!event.persisted || !savedPlan) return;
    stopCountdown();
    renderCountdown();
    if (parseLocalDate(savedPlan.when).getTime() > Date.now()) countdownTimer = window.setInterval(renderCountdown, 1000);
  });
})();

}, { once: true });
