/* The journey, keyboard interactions and quiet cinematic details. */
(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const $ = selector => document.querySelector(selector);
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const digits = [...document.querySelectorAll('.secret-digit')];
    const normalize = value => value.replace(/[٠-٩]/g, n => String(n.charCodeAt(0) - 1632))
      .replace(/[۰-۹]/g, n => String(n.charCodeAt(0) - 1776)).replace(/[^0-9]/g, '');

    function showLogin() {
      document.body.dataset.scene = 'login';
      $('#vaultScreen').hidden = false;
      $('#vaultScreen').style.display = '';
      window.scrollTo({ top: 0, behavior: 'instant' });
      digits[0].focus({ preventScroll: true });
    }
    $('#beginJourney').addEventListener('click', showLogin);
    $('#backToWelcome').addEventListener('click', () => {
      document.body.dataset.scene = 'welcome';
      $('#vaultScreen').hidden = true;
      $('#beginJourney').focus({ preventScroll: true });
    });
    digits.forEach((input, index) => {
      input.addEventListener('input', () => {
        input.value = normalize(input.value).slice(-1);
        input.removeAttribute('aria-invalid');
        $('#vaultLoginForm').classList.remove('wrong-code');
        if (input.value && index < 2) digits[index + 1].focus();
      });
      input.addEventListener('keydown', event => {
        if (event.key === 'Backspace' && !input.value && index > 0) digits[index - 1].focus();
        if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); digits[index - 1].focus(); }
        if (event.key === 'ArrowRight' && index < 2) { event.preventDefault(); digits[index + 1].focus(); }
      });
      input.addEventListener('paste', event => {
        const value = normalize(event.clipboardData.getData('text')).slice(0, 3);
        if (!value) return;
        event.preventDefault();
        [...value].forEach((digit, offset) => {
          if (digits[index + offset]) digits[index + offset].value = digit;
        });
        digits[Math.min(2, index + value.length)].focus();
      });
    });

    const drawer = $('#cinemaSidebar');
    const backdrop = $('#sidebarBackdrop');
    const opener = $('#openSideMenu');
    let previousFocus;
    let drawerFocusTimer;
    function closeDrawer(restore = true) {
      clearTimeout(drawerFocusTimer);
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.inert = true;
      backdrop.hidden = true;
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
      opener.setAttribute('aria-expanded', 'false');
      $('.app-shell').inert = false;
      document.body.classList.remove('drawer-open');
      if (restore && previousFocus) requestAnimationFrame(() => previousFocus.focus({ preventScroll: true }));
    }
    function openDrawer() {
      previousFocus = document.activeElement;
      drawer.inert = false;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      backdrop.hidden = false;
      backdrop.classList.add('is-open');
      backdrop.setAttribute('aria-hidden', 'false');
      opener.setAttribute('aria-expanded', 'true');
      $('.app-shell').inert = true;
      document.body.classList.add('drawer-open');
      // Inert and visibility transitions can settle on different frames when
      // opening after a long page scroll. Move focus as soon as the drawer is
      // focusable; never interrupt a user who has already focused a menu link.
      let focusAttempts = 0;
      function focusWhenVisible() {
        if (!drawer.classList.contains('is-open') || drawer.contains(document.activeElement)) return;
        $('#closeSideMenu').focus({ preventScroll: true });
        if (!drawer.contains(document.activeElement) && ++focusAttempts < 20) {
          drawerFocusTimer = setTimeout(focusWhenVisible, 50);
        }
      }
      clearTimeout(drawerFocusTimer);
      drawerFocusTimer = setTimeout(focusWhenVisible, 0);
    }
    opener.addEventListener('click', openDrawer);
    $('#closeSideMenu').addEventListener('click', () => closeDrawer());
    backdrop.addEventListener('click', () => closeDrawer());
    drawer.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeDrawer(false)));
    document.addEventListener('keydown', event => {
      if (!drawer.classList.contains('is-open')) return;
      if (event.key === 'Escape') { event.preventDefault(); closeDrawer(); }
      if (event.key === 'Tab') {
        const stops = [...drawer.querySelectorAll('a, button')].filter(node => node.getClientRects().length > 0);
        const first = stops[0], last = stops.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });

    // Make the original SVG constellation as accessible by keyboard as by touch.
    document.querySelectorAll('.star-hotspot').forEach(star => {
      star.setAttribute('tabindex', '0');
      star.setAttribute('role', 'button');
      star.setAttribute('aria-label', star.querySelector('text').textContent);
      star.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); star.dispatchEvent(new MouseEvent('click')); }
      });
    });

    const links = [...document.querySelectorAll('.cinema-nav-item, .sidebar-link, .dock-link')];
    if ('IntersectionObserver' in window) {
      const sectionObserver = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        links.forEach(link => {
          const active = link.getAttribute('href') === '#' + visible.target.id;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }, { rootMargin: '-20% 0px -45% 0px', threshold: [0, .1, .3] });
      document.querySelectorAll('#galaxyExperience > section').forEach(section => sectionObserver.observe(section));
    }

    // A handful of CSS petals, with no animation loop or motion when requested.
    const petals = document.createElement('div');
    petals.className = 'cinema-petals';
    petals.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 10; i++) {
      const petal = document.createElement('i');
      petal.style.cssText = `--x:${i * 10 + 3}%;--delay:${i * -2.7}s;--duration:${18 + i % 5 * 3}s;--drift:${i % 2 ? -70 : 90}px`;
      petals.append(petal);
    }
    document.body.append(petals);
    document.addEventListener('habibti:unlocked', () => {
      if (!reduceMotion.matches) document.body.classList.add('world-arrival');
    });
  }, { once: true });
})();
