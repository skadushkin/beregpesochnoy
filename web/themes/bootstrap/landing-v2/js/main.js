document.addEventListener('DOMContentLoaded', function () {

  function bindSwipe(el, onSwipe) {
    if (!el || typeof onSwipe !== 'function') return;
    var startX = 0;
    var startY = 0;
    var dragging = false;

    function onStart(x, y) {
      startX = x;
      startY = y;
      dragging = true;
      el.classList.add('is-dragging');
    }

    function onEnd(x, y) {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-dragging');
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

    el.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      onStart(e.clientX, e.clientY);
      function move(ev) {
        if (!dragging) return;
        if (Math.abs(ev.clientX - startX) > 8) ev.preventDefault();
      }
      function up(ev) {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        onEnd(ev.clientX, ev.clientY);
      }
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
  }

  /* Шапка при скролле (после hero) */
  var header = document.querySelector('.site-header');
  var hero = document.querySelector('.hero');
  if (header && hero) {
    window.addEventListener('scroll', function () {
      var threshold = hero.offsetHeight - 120;
      if (window.scrollY > threshold) {
        header.classList.add('is-scrolled');
        header.removeAttribute('aria-hidden');
      } else {
        header.classList.remove('is-scrolled');
        header.setAttribute('aria-hidden', 'true');
      }
    }, { passive: true });
  }

  /* Бургер */
  var burger = document.getElementById('burgerBtn');
  if (burger) {
    burger.addEventListener('click', function () {
      document.querySelector('.hdr-nav')?.classList.toggle('is-open');
    });
  }

  function isMobileOneSlide() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function buildDynamicGalleryControls(stage, dotsTrack) {
    var items = stage.querySelectorAll('.gallery-carousel__item');
    if (!items.length) return -1;
    var idx = items.length - 1;

    if (dotsTrack && dotsTrack.hasAttribute('data-dynamic')) {
      dotsTrack.innerHTML = '';
      items.forEach(function (item, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'dot' + (i === idx ? ' is-active' : '');
        dot.setAttribute('data-i', String(i));
        dotsTrack.appendChild(dot);
      });
    }

    return idx;
  }

  /* Галерея «01 /» — карусель с 5 видимыми кадрами */
  (function () {
    var stage = document.getElementById('galleryStage');
    if (!stage) return;

    var dotsTrack = document.getElementById('galleryDots');
    var active = buildDynamicGalleryControls(stage, dotsTrack);
    if (active < 0) return;

    var items = stage.querySelectorAll('.gallery-carousel__item');
    var dots = document.querySelectorAll('#galleryDots .dot');
    var prev = document.getElementById('galleryPrev');
    var next = document.getElementById('galleryNext');
    var carousel = document.getElementById('galleryCarousel') || stage.parentElement;
    var total = items.length;
    var caption = document.getElementById('galleryCaption');
    var numEl = document.getElementById('galleryNumVal');
    var noteEl = document.getElementById('galleryNote');

    function padNum(i) {
      return (i + 1 < 10 ? '0' : '') + (i + 1);
    }

    function updateCaption() {
      if (!numEl || !items[active]) return;
      var text = items[active].dataset.caption || '';
      if (caption) caption.classList.add('is-fading');
      window.setTimeout(function () {
        numEl.textContent = padNum(active);
        if (noteEl) noteEl.textContent = text;
        if (caption) caption.classList.remove('is-fading');
      }, caption ? 180 : 0);
    }

    function circularOffset(index, center, n) {
      var d = (index - center + n) % n;
      if (d > n / 2) d -= n;
      return d;
    }

    function render() {
      var mobile = isMobileOneSlide();
      items.forEach(function (item, i) {
        var off = mobile ? (i === active ? 0 : null) : circularOffset(i, active, total);
        if (off !== null && (mobile || (off >= -2 && off <= 2))) {
          item.setAttribute('data-offset', String(off));
        } else {
          item.removeAttribute('data-offset');
        }
      });
      dots.forEach(function (dot) {
        dot.classList.toggle('is-active', parseInt(dot.dataset.i, 10) === active);
      });
      updateCaption();
    }

    function goTo(i) {
      if (i < 0) i = total - 1;
      if (i >= total) i = 0;
      active = i;
      render();
    }

    render();
    window.addEventListener('resize', render, { passive: true });
    if (prev) prev.addEventListener('click', function () { goTo(active - 1); });
    if (next) next.addEventListener('click', function () { goTo(active + 1); });
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        goTo(parseInt(dot.dataset.i, 10));
      });
    });

    bindSwipe(carousel, function (dir) { goTo(active + dir); });
  })();

  /* Семья — мозаика на десктопе / слайдер на мобиле + видео */
  (function () {
    var section = document.querySelector('.section.family');
    var slider = document.getElementById('familySlider');
    var track = document.getElementById('familyTrack');
    var dotsTrack = document.getElementById('familyDots');
    var prev = document.getElementById('familyPrev');
    var next = document.getElementById('familyNext');
    if (!section || !slider || !track) return;

    var videos = Array.prototype.slice.call(
      section.querySelectorAll('video.family__img[data-src]')
    );
    var active = 0;
    var sectionOn = false;

    function getSlides() {
      return Array.prototype.slice.call(track.querySelectorAll('.family__item'));
    }

    function buildDots(slides) {
      if (!dotsTrack) return;
      dotsTrack.innerHTML = '';
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'dot' + (i === active ? ' is-active' : '');
        dot.setAttribute('data-i', String(i));
        dot.setAttribute('aria-label', 'Слайд ' + (i + 1));
        dotsTrack.appendChild(dot);
      });
    }

    function loadVideo(video) {
      if (!video || video.dataset.loaded) return;
      var src = video.getAttribute('data-src');
      if (!src) return;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.preload = 'auto';
      video.src = src;
      video.dataset.loaded = '1';
      video.load();
    }

    function playWhenReady(video) {
      if (!video || !video.dataset.loaded) return;
      var attempt = function () {
        if (!sectionOn) return;
        if (isMobileOneSlide()) {
          var slide = video.closest('.family__item');
          var slides = getSlides();
          var idx = slides.indexOf(slide);
          if (idx !== active) return;
        }
        video.muted = true;
        var p = video.play();
        if (p && typeof p.catch === 'function') p.catch(function () {});
      };
      if (video.readyState >= 2) {
        attempt();
        return;
      }
      video.addEventListener('loadeddata', attempt, { once: true });
      video.addEventListener('canplay', attempt, { once: true });
    }

    function syncPlayback() {
      var mobile = isMobileOneSlide();
      var slides = getSlides();
      videos.forEach(function (video) {
        if (!sectionOn) {
          if (video.dataset.loaded) video.pause();
          return;
        }
        loadVideo(video);
        if (!mobile) {
          playWhenReady(video);
          return;
        }
        var slide = video.closest('.family__item');
        var idx = slides.indexOf(slide);
        if (idx === active) {
          playWhenReady(video);
        } else if (video.dataset.loaded) {
          video.pause();
        }
      });
    }

    function renderSlider() {
      var slides = getSlides();
      if (!slides.length) return;

      if (!isMobileOneSlide()) {
        track.style.removeProperty('transform');
        slider.classList.remove('is-mobile-slider');
        syncPlayback();
        return;
      }

      if (active >= slides.length) active = 0;
      slider.classList.add('is-mobile-slider');
      track.style.transform = 'translate3d(-' + (active * 100) + '%, 0, 0)';

      if (dotsTrack) {
        dotsTrack.querySelectorAll('.dot').forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === active);
        });
      }
      syncPlayback();
    }

    function goTo(i) {
      var slides = getSlides();
      if (!slides.length || !isMobileOneSlide()) return;
      if (i < 0) i = slides.length - 1;
      if (i >= slides.length) i = 0;
      active = i;
      renderSlider();
    }

    function setSectionVisible(visible) {
      sectionOn = visible;
      section.classList.toggle('is-visible', visible);
      if (visible) {
        // Сначала грузим все src, затем синхронизируем play (со сдвигом — меньше отказа браузера).
        videos.forEach(loadVideo);
        videos.forEach(function (video, i) {
          window.setTimeout(function () {
            if (!sectionOn) return;
            playWhenReady(video);
          }, i * 120);
        });
      } else {
        videos.forEach(function (video) {
          if (video.dataset.loaded) video.pause();
        });
      }
      renderSlider();
    }

    buildDots(getSlides());
    renderSlider();

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          setSectionVisible(entry.isIntersecting);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
      observer.observe(section);
    } else {
      setSectionVisible(true);
    }

    window.addEventListener('resize', function () {
      buildDots(getSlides());
      renderSlider();
    }, { passive: true });

    if (prev) prev.addEventListener('click', function () { goTo(active - 1); });
    if (next) next.addEventListener('click', function () { goTo(active + 1); });

    if (dotsTrack) {
      dotsTrack.addEventListener('click', function (e) {
        var dot = e.target.closest('.dot');
        if (!dot) return;
        goTo(parseInt(dot.dataset.i, 10));
      });
    }

    var viewport = slider.querySelector('.family__viewport');
    bindSwipe(viewport, function (dir) { goTo(active + dir); });
  })();

  /* Каталог: пиллы как табы — Figma 7559:2002 */
  (function () {
    var tabs = document.querySelector('[data-lv2-catalog-tabs]');
    var panelsRoot = document.querySelector('[data-lv2-catalog-panels]');
    if (!tabs || !panelsRoot) return;

    var buttons = tabs.querySelectorAll('[data-tab]');
    var panels = panelsRoot.querySelectorAll('[data-tab-panel]');
    var moreLink = document.querySelector('[data-lv2-catalog-more]');
    var ALL_LIMIT = 4;

    function resetAllCards() {
      panelsRoot.querySelectorAll('.product-card').forEach(function (card) {
        card.classList.remove('is-all-hidden');
      });
    }

    function limitAllCards() {
      var cards = panelsRoot.querySelectorAll('.product-card');
      cards.forEach(function (card, index) {
        card.classList.toggle('is-all-hidden', index >= ALL_LIMIT);
      });
    }

    function activate(tab) {
      var isAll = tab === 'all';
      panelsRoot.classList.toggle('is-showing-all', isAll);
      resetAllCards();

      buttons.forEach(function (btn) {
        var on = btn.getAttribute('data-tab') === tab;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on && moreLink) {
          var href = btn.getAttribute('data-catalog-href');
          if (href) moreLink.setAttribute('href', href);
        }
      });

      panels.forEach(function (panel) {
        var match = isAll || panel.getAttribute('data-tab-panel') === tab;
        panel.hidden = !match;
        panel.classList.toggle('is-active', match);
      });

      if (isAll) {
        limitAllCards();
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activate(btn.getAttribute('data-tab') || '2');
      });
    });
  })();

  /* Попап «Записаться на экскурсию» */
  (function () {
    var modal = document.getElementById('lv2TourModal');
    if (!modal) return;

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

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-active')) {
        closeModal();
      }
    });

    if (window.location.hash === '#tour') {
      openModal();
    }

    window.lv2CloseTourModal = closeModal;
  })();

});
