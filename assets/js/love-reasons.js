
document.addEventListener('DOMContentLoaded', () => {
(() => {
  'use strict';
  const gift = window.GiftExtras;
  if (!gift) return;

  const defaults = [
    'أحبكِ لأنكِ أنتِ… مو لازم يكون فيه سبب ثاني 🤍',
    'أحب إن كلمة «حبيبتي» صارت تعنيكِ أنتِ ♡',
    'أحب إن لكِ مكان بقلبي ما يشبه أحد.',
    'أحبكِ في أيامكِ الخفيفة، وأيامكِ اللي تحتاج راحة.',
    'أحب إن فيه أشياء صغيرة تخلّيني أفكّر فيكِ.',
    'أحبكِ مثل ما أنتِ، بكل تفاصيلكِ 🤍',
    'أحب فكرة إن هالهدية البسيطة بتوصل لكِ منّي.',
    'أحبكِ… وهذي كلمة تستاهل أقولها لكِ أكثر من مرة ♡'
  ];
  let reasons = [];
  let nextIndex = 0;
  const reasonText = document.getElementById('loveReasonText');
  const reasonCount = document.getElementById('loveReasonCount');
  const nextButton = document.getElementById('nextLoveReasonBtn');
  const digits = new Intl.NumberFormat('ar');

  function refreshReasons() {
    const supplied = gift.data && gift.data.reasons;
    const cleaned = Array.isArray(supplied)
      ? supplied.filter(value => typeof value === 'string').map(value => value.trim()).filter(Boolean)
      : [];
    // Repeated custom lines are still one reason, so each cycle stays distinct.
    reasons = Array.from(new Set(cleaned.length ? cleaned : defaults));
    nextIndex = 0;
    reasonText.hidden = true;
    reasonText.textContent = '';
    reasonCount.textContent = '';
    nextButton.textContent = 'اقرئي أول سبب ♡';
  }

  nextButton.addEventListener('click', () => {
    reasonText.hidden = false;
    reasonText.textContent = reasons[nextIndex];
    reasonCount.textContent = `كلمة ${digits.format(nextIndex + 1)} من ${digits.format(reasons.length)}`;
    nextIndex = (nextIndex + 1) % reasons.length;
    nextButton.textContent = 'وعندي سبب ثاني ♡';
    gift.celebrate(6);
  });
  document.addEventListener('giftpersonalchange', refreshReasons);
  refreshReasons();

  const couponNames = {
    coffee: 'قهوة عليّ',
    outing: 'طلعة على اختياركِ',
    movie: 'الفيلم على ذوقكِ'
  };
  const storageKey = 'affection-coupons-v1';
  const stored = gift.read(storageKey, {});
  const validStored = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  const selected = Object.fromEntries(Object.keys(couponNames).map(key => [key, validStored[key] === true]));
  const couponButtons = Array.from(document.querySelectorAll('#extra-coupons [data-coupon]'));
  const couponCount = document.getElementById('couponSelectionCount');

  function renderCoupons() {
    couponButtons.forEach(button => {
      const key = button.dataset.coupon;
      const chosen = selected[key];
      button.setAttribute('aria-pressed', String(chosen));
      button.setAttribute('aria-label', `${chosen ? 'إلغاء اختيار' : 'اختيار'} كوبون ${couponNames[key]}`);
      button.textContent = chosen ? 'إلغاء الاختيار ✓' : 'أختار هالكوبون';
      button.closest('.affection-coupon').dataset.selected = String(chosen);
    });
    const count = Object.values(selected).filter(Boolean).length;
    couponCount.textContent = count
      ? `اخترتِ ${digits.format(count)} من ${digits.format(couponButtons.length)} كوبونات. نرتّب وقتها سوا 🤍`
      : 'الكوبونات بانتظار اختياركِ ♡';
  }

  couponButtons.forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.coupon;
      selected[key] = !selected[key];
      const saved = gift.write(storageKey, selected);
      renderCoupons();
      if (selected[key]) gift.celebrate(8);
      if (!saved) gift.announce('اختياركِ موجود الحين، بس ما قدرنا نحفظه للجلسة القادمة.');
    });
  });
  renderCoupons();
})();

}, { once: true });
