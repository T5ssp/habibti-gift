/* YouTube's documented iframe postMessage protocol; no automatic playback.
 * UI state follows real player events. Native iframe controls remain available.
 */
(() => {
  'use strict';
  const ORIGIN = 'https://www.youtube-nocookie.com';
  const VIDEO = 'IPuWTXlSrTw';
  document.addEventListener('DOMContentLoaded', () => {
    const $ = selector => document.querySelector(selector);
    const iframe = $('#ytIframe');
    let loaded = false, ready = false, playing = false, duration = 0, current = 0;
    let requestedStart = 0, handshakeTimer, loadTimer;
    const status = $('#musicStatus');
    const format = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
    function command(func, args = []) {
      if (loaded && iframe.contentWindow) iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), ORIGIN);
    }
    function render() {
      $('#musicToggle').textContent = playing ? 'Ⅱ' : '▶';
      $('#musicToggle').setAttribute('aria-label', playing ? 'إيقاف الموسيقى مؤقتًا' : 'تشغيل الموسيقى');
      $('#musicToggle').setAttribute('aria-pressed', String(playing));
      $('#playRestartSongBtn').textContent = playing ? 'إيقاف أغنيتنا مؤقتًا Ⅱ' : 'تشغيل أغنيتنا ♫';
      $('#vinylDisc').classList.toggle('spinning', playing);
      $('#tonearm').classList.toggle('engaged', playing);
      $('#gramophoneStudio').classList.toggle('is-playing', playing);
      $('#musicCurrentTime').textContent = format(current);
      $('#musicDuration').textContent = duration ? format(duration) : '—:—';
      $('#musicSeek').disabled = !ready || !duration;
      if (duration) { $('#musicSeek').max = String(duration); $('#musicSeek').value = String(current); }
    }
    function listen() {
      iframe.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'habibti-player', channel: 'widget' }), ORIGIN);
    }
    function play(start) {
      if (typeof start === 'number') requestedStart = start;
      if (!loaded) {
        loaded = true;
        const params = new URLSearchParams({ enablejsapi: '1', autoplay: '1', playsinline: '1', rel: '0', controls: '1', start: String(requestedStart) });
        if (location.protocol === 'http:' || location.protocol === 'https:') params.set('origin', location.origin);
        iframe.src = `${ORIGIN}/embed/${VIDEO}?${params}`;
        status.textContent = 'نحمّل أغنيتنا… تحتاج اتصالًا بخدمة YouTube';
        handshakeTimer = setInterval(listen, 700);
        loadTimer = setTimeout(() => {
          clearInterval(handshakeTimer);
          if (!ready) status.textContent = 'لم يصل ردّ المشغّل. استخدمي أزرار الفيديو أو افتحي الأغنية على YouTube؛ قد تكون الخدمة محجوبة.';
        }, 12000);
      } else if (ready) {
        if (typeof start === 'number') command('seekTo', [start, true]);
        command('playVideo');
      } else {
        status.textContent = 'بانتظار مشغّل YouTube. يمكنكِ استخدام الفيديو أو الرابط المباشر.';
        listen();
      }
    }
    function toggle() {
      if (playing) command('pauseVideo');
      else play();
    }
    window.HabibtiMusic = { play, toggle };
    iframe.addEventListener('load', () => { if (loaded) listen(); });
    window.addEventListener('message', event => {
      if (event.source !== iframe.contentWindow || event.origin !== ORIGIN) return;
      let data;
      try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch (_) { return; }
      if (!data || typeof data !== 'object') return;
      if (data.event === 'onReady' || data.event === 'initialDelivery' || data.event === 'infoDelivery') {
        if (!ready) {
          ready = true;
          clearTimeout(loadTimer); clearInterval(handshakeTimer);
          command('addEventListener', ['onStateChange']);
          command('addEventListener', ['onError']);
          command('setVolume', [Number($('#musicVolume').value)]);
          if (requestedStart) command('seekTo', [requestedStart, true]);
          status.textContent = 'المشغّل جاهز؛ استخدمي زر التشغيل للاستماع';
        }
      }
      const info = data.info;
      const state = data.event === 'onStateChange' ? info : info?.playerState;
      if (typeof state === 'number') {
        playing = state === 1;
        status.textContent = state === 1 ? 'تُعزف الآن… أغنيتنا ♫' : state === 2 ? 'لحظة هدوء… أوقِفت الأغنية مؤقتًا' : state === 3 ? 'المشغّل يُحمّل الصوت…' : state === 0 ? 'انتهت الأغنية؛ نسمعها مرة ثانية؟' : 'أغنيتنا جاهزة للاستماع';
      }
      if (info && typeof info === 'object') {
        if (Number.isFinite(info.duration) && info.duration > 0) duration = info.duration;
        if (Number.isFinite(info.currentTime)) current = info.currentTime;
      }
      if (data.event === 'onError') {
        playing = false;
        status.textContent = 'تعذّر تشغيل الأغنية داخل الموقع. جرّبي رابط YouTube المباشر.';
      }
      render();
    });
    $('#musicToggle').addEventListener('click', toggle);
    $('#musicSeek').addEventListener('input', event => {
      current = Number(event.target.value);
      command('seekTo', [current, true]);
      render();
    });
    $('#musicVolume').addEventListener('input', event => command('setVolume', [Number(event.target.value)]));
    $('#musicBack').addEventListener('click', () => { if (ready) command('seekTo', [Math.max(0, current - 10), true]); });
    $('#musicForward').addEventListener('click', () => { if (ready) command('seekTo', [Math.min(duration || current, current + 10), true]); });
    window.addEventListener('pagehide', () => { clearTimeout(loadTimer); clearInterval(handshakeTimer); command('pauseVideo'); });
    render();
  }, { once: true });
})();
