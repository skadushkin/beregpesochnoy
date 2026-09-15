(function (Drupal) {
  'use strict';

  function bindSwipe(el, onSwipe) {
    if (!el || typeof onSwipe !== 'function') {
      return;
    }
    var startX = 0;
    var startY = 0;
    var dragging = false;

    function onStart(x, y) {
      startX = x;
      startY = y;
      dragging = true;
    }

    function onEnd(x, y) {
      if (!dragging) {
        return;
      }
      dragging = false;
      var dx = startX - x;
      var dy = startY - y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        onSwipe(dx > 0 ? 1 : -1);
      }
    }

    el.addEventListener('touchstart', function (e) {
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      onEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }, { passive: true });
  }

  function initSlider(root, opts) {
    if (!root) {
      return;
    }
    var track = root.querySelector(opts.track);
    var items = track ? Array.prototype.slice.call(track.children) : [];
    if (!items.length) {
      return;
    }
    var perView = typeof opts.perView === 'function' ? opts.perView : function () { return opts.perView || 1; };
    var index = 0;
    var dots = root.querySelector(opts.dots);
    var prev = root.querySelector(opts.prev);
    var next = root.querySelector(opts.next);
    var nav = root.querySelector(opts.nav);

    function pages() {
      return Math.max(1, items.length - perView() + 1);
    }

    function renderDots() {
      if (!dots) {
        return;
      }
      dots.innerHTML = '';
      var n = pages();
      for (var i = 0; i < n; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ferma-dot' + (i === index ? ' is-active' : '');
        b.setAttribute('aria-label', 'Слайд ' + (i + 1));
        b.addEventListener('click', function (iCopy) {
          return function () {
            index = iCopy;
            render();
          };
        }(i));
        dots.appendChild(b);
      }
    }

    function render() {
      var view = perView();
      var max = Math.max(0, items.length - view);
      if (index > max) {
        index = max;
      }
      if (index < 0) {
        index = 0;
      }
      var first = items[0];
      var gap = 32;
      var step = first ? first.getBoundingClientRect().width + gap : 0;
      if (track) {
        track.style.transform = 'translateX(' + (-index * step) + 'px)';
      }
      items.forEach(function (el, i) {
        el.classList.toggle('is-active', i === index);
        el.classList.toggle('is-next', i === index + 1);
        el.classList.toggle('is-dim', i > index);
      });
      if (nav) {
        nav.hidden = items.length <= view;
      }
      renderDots();
    }

    function move(dir) {
      index += dir;
      var max = Math.max(0, items.length - perView());
      if (index < 0) {
        index = max;
      }
      if (index > max) {
        index = 0;
      }
      render();
    }

    if (prev) {
      prev.addEventListener('click', function () { move(-1); });
    }
    if (next) {
      next.addEventListener('click', function () { move(1); });
    }
    bindSwipe(root, move);
    window.addEventListener('resize', render);
    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSlider(document.querySelector('[data-ferma-products]'), {
      track: '.ferma-products__track',
      dots: '[data-ferma-products-dots]',
      prev: '[data-ferma-products-prev]',
      next: '[data-ferma-products-next]',
      nav: '.ferma-products__nav',
      perView: function () {
        return window.matchMedia('(max-width: 768px)').matches ? 1 : 1;
      }
    });

    initSlider(document.querySelector('[data-ferma-photos]'), {
      track: '.ferma-photos__track',
      dots: '[data-ferma-photos-dots]',
      prev: '[data-ferma-photos-prev]',
      next: '[data-ferma-photos-next]',
      nav: '.ferma-photos__nav',
      perView: function () {
        return window.matchMedia('(max-width: 768px)').matches ? 1 : 2;
      }
    });

    var modal = document.getElementById('lv2TourModal');
    if (modal) {
      var closeBtn = document.getElementById('closeLv2TourModal');
      var overlay = document.getElementById('closeLv2TourModalOverlay');
      var menuContainer = document.querySelector('.tap-menu-container');

      function closeTapMenu() {
        if (menuContainer) {
          menuContainer.style.transform = 'translateX(100%)';
        }
      }
      function closeModal() {
        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lv2-modal-open');
      }
      function openModal() {
        closeTapMenu();
        modal.classList.add('is-active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lv2-modal-open');
      }

      document.querySelectorAll('.open-lv2-tour-modal').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          openModal();
        });
      });
      document.querySelectorAll('a[href="#tour"], a[href="/#tour"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          openModal();
        });
      });
      if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
      }
      if (overlay) {
        overlay.addEventListener('click', closeModal);
      }
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('is-active')) {
          closeModal();
        }
      });
    }
  });
})(Drupal);
