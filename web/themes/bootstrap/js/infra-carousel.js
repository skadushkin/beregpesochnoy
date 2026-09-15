/**
 * Infra-carousel: pills = field_kategoriya, dots = слайды внутри категории.
 */
(function (Drupal, once) {
  'use strict';

  function isMobileOneSlide() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

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
      el.classList.add('is-dragging');
    }

    function onEnd(x, y) {
      if (!dragging) {
        return;
      }
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
      if (e.button !== 0) {
        return;
      }
      onStart(e.clientX, e.clientY);
      function move(ev) {
        if (!dragging) {
          return;
        }
        if (Math.abs(ev.clientX - startX) > 8) {
          ev.preventDefault();
        }
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

  function getItemCategoryKey(item) {
    var key = item.getAttribute('data-category');
    if (key) {
      return key;
    }
    return 'slide-' + (item.getAttribute('data-slide-id') || item.getAttribute('data-label') || '');
  }

  function getItemCategoryLabel(item) {
    return item.getAttribute('data-category-label') || item.getAttribute('data-label') || '';
  }

  function collectCategories(items) {
    var categories = [];
    var seen = {};
    items.forEach(function (item) {
      var key = getItemCategoryKey(item);
      if (!key || seen[key]) {
        return;
      }
      seen[key] = true;
      categories.push({
        key: key,
        label: getItemCategoryLabel(item) || key
      });
    });
    return categories;
  }

  function getVisibleItems(allItems, categoryKey) {
    var visible = [];
    allItems.forEach(function (item) {
      var match = getItemCategoryKey(item) === categoryKey;
      item.hidden = !match;
      item.classList.toggle('is-hidden', !match);
      if (match) {
        visible.push(item);
      }
    });
    return visible;
  }

  function buildCategoryControls(stage, pillsTrack, dotsTrack, categoryKey, activeIndex) {
    var allItems = stage.querySelectorAll('.infra-carousel__item');
    if (!allItems.length) {
      return { categoryKey: '', activeIndex: 0, categories: [], visibleItems: [] };
    }

    var categories = collectCategories(allItems);
    if (!categories.length) {
      return { categoryKey: '', activeIndex: 0, categories: [], visibleItems: [] };
    }

    if (!categoryKey || !categories.some(function (cat) { return cat.key === categoryKey; })) {
      categoryKey = categories[0].key;
    }

    var visibleItems = getVisibleItems(allItems, categoryKey);
    var idx = typeof activeIndex === 'number' ? activeIndex : 0;
    if (idx >= visibleItems.length) {
      idx = Math.max(0, visibleItems.length - 1);
    }
    if (idx < 0) {
      idx = 0;
    }

    if (pillsTrack && pillsTrack.hasAttribute('data-dynamic')) {
      pillsTrack.innerHTML = '';
      categories.forEach(function (cat) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'infra-pill' + (cat.key === categoryKey ? ' is-active' : '');
        btn.setAttribute('data-category', cat.key);
        btn.textContent = cat.label;
        pillsTrack.appendChild(btn);
      });
    }

    if (dotsTrack && dotsTrack.hasAttribute('data-dynamic')) {
      dotsTrack.innerHTML = '';
      visibleItems.forEach(function (item, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'dot' + (i === idx ? ' is-active' : '');
        dot.setAttribute('data-i', String(i));
        dotsTrack.appendChild(dot);
      });
    }

    return {
      categoryKey: categoryKey,
      activeIndex: idx,
      categories: categories,
      visibleItems: visibleItems
    };
  }

  function prefixFromStage(stage) {
    var id = stage.id || '';
    if (id.slice(-5) === 'Stage') {
      return id.slice(0, -5);
    }
    return '';
  }

  function initInfraCarousel(options) {
    var stage = document.getElementById(options.stageId);
    if (!stage || stage.getAttribute('data-infra-carousel-init') === '1') {
      return;
    }
    stage.setAttribute('data-infra-carousel-init', '1');

    var pillsTrack = document.getElementById(options.pillsTrackId);
    var dotsTrack = document.getElementById(options.dotsTrackId);
    var carousel = document.getElementById(options.carouselId) || stage.parentElement;
    var prev = document.getElementById(options.prevId);
    var next = document.getElementById(options.nextId);

    var initialCategoryIndex = typeof options.initialCategoryIndex === 'number' ? options.initialCategoryIndex : 0;
    var initialSlideIndex = typeof options.initialSlideIndex === 'number' ? options.initialSlideIndex : 0;

    var allItems = stage.querySelectorAll('.infra-carousel__item');
    var categories = collectCategories(allItems);
    var activeCategory = categories[initialCategoryIndex] ? categories[initialCategoryIndex].key : '';
    var state = buildCategoryControls(stage, pillsTrack, dotsTrack, activeCategory, initialSlideIndex);
    activeCategory = state.categoryKey;
    var active = state.activeIndex;
    var visibleItems = state.visibleItems;

    function refreshControls() {
      state = buildCategoryControls(stage, pillsTrack, dotsTrack, activeCategory, active);
      activeCategory = state.categoryKey;
      active = state.activeIndex;
      visibleItems = state.visibleItems;
    }

    function queryControls() {
      return {
        pills: document.querySelectorAll(options.pillsSelector),
        dots: document.querySelectorAll(options.dotsSelector)
      };
    }

    function circularOffset(index, center, n) {
      var d = (index - center + n) % n;
      if (d > n / 2) {
        d -= n;
      }
      return d;
    }

    function scrollActiveDotIntoView(smooth) {
      if (!dotsTrack) {
        return;
      }
      var activeDot = dotsTrack.querySelector('.dot.is-active');
      if (!activeDot) {
        return;
      }
      var target = activeDot.offsetLeft - (dotsTrack.clientWidth - activeDot.offsetWidth) / 2;
      dotsTrack.scrollTo({
        left: Math.max(0, target),
        behavior: smooth ? 'smooth' : 'auto'
      });
    }

    function syncControls() {
      var controls = queryControls();
      controls.pills.forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-category') === activeCategory);
      });
      controls.dots.forEach(function (d) {
        d.classList.toggle('is-active', parseInt(d.dataset.i, 10) === active);
      });
      scrollActiveDotIntoView(true);
    }

    function scrollToItem(index, smooth) {
      var item = visibleItems[index];
      if (!item || !stage) {
        return;
      }
      var target = item.offsetLeft - (stage.clientWidth - item.offsetWidth) / 2;
      stage.scrollTo({ left: Math.max(0, target), behavior: smooth ? 'smooth' : 'auto' });
    }

    function scrollPillIntoView(categoryKey, smooth) {
      if (!isMobileOneSlide() || !pillsTrack) {
        return;
      }
      var controls = queryControls();
      var pill = null;
      controls.pills.forEach(function (p) {
        if (p.getAttribute('data-category') === categoryKey) {
          pill = p;
        }
      });
      if (!pill) {
        return;
      }
      var target = pill.offsetLeft - (pillsTrack.clientWidth - pill.offsetWidth) / 2;
      pillsTrack.scrollTo({ left: Math.max(0, target), behavior: smooth ? 'smooth' : 'auto' });
    }

    function syncActiveFromScroll() {
      if (!isMobileOneSlide() || !visibleItems.length) {
        return;
      }
      var center = stage.scrollLeft + stage.clientWidth / 2;
      var best = 0;
      var bestDist = Infinity;
      visibleItems.forEach(function (item, i) {
        var itemCenter = item.offsetLeft + item.offsetWidth / 2;
        var dist = Math.abs(itemCenter - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      if (best !== active) {
        active = best;
        syncControls();
      }
    }

    function render() {
      if (!visibleItems.length) {
        return;
      }

      if (isMobileOneSlide()) {
        carousel.classList.add('infra-carousel--mobile-scroll');
        visibleItems.forEach(function (item) {
          item.removeAttribute('data-offset');
        });
        syncControls();
        return;
      }

      carousel.classList.remove('infra-carousel--mobile-scroll');
      var total = visibleItems.length;
      visibleItems.forEach(function (item, i) {
        var off = circularOffset(i, active, total);
        if (off >= -1 && off <= 1) {
          item.setAttribute('data-offset', String(off));
        } else {
          item.removeAttribute('data-offset');
        }
      });
      syncControls();
    }

    function goToSlide(index) {
      if (!visibleItems.length) {
        return;
      }
      if (index < 0) {
        index = visibleItems.length - 1;
      }
      if (index >= visibleItems.length) {
        index = 0;
      }
      active = index;
      if (isMobileOneSlide()) {
        syncControls();
        scrollToItem(active, true);
        return;
      }
      render();
    }

    function goToCategory(categoryKey) {
      if (categoryKey === activeCategory) {
        goToSlide(0);
        return;
      }
      activeCategory = categoryKey;
      active = 0;
      refreshControls();
      bindControlEvents();
      render();
      if (isMobileOneSlide()) {
        scrollToItem(active, false);
        scrollPillIntoView(activeCategory, true);
      }
    }

    function bindControlEvents() {
      var controls = queryControls();
      controls.pills.forEach(function (p) {
        p.addEventListener('click', function () {
          goToCategory(p.getAttribute('data-category'));
        });
      });
      controls.dots.forEach(function (d) {
        d.addEventListener('click', function () {
          goToSlide(parseInt(d.dataset.i, 10));
        });
      });
    }

    render();
    bindControlEvents();
    if (isMobileOneSlide()) {
      scrollToItem(active, false);
      scrollPillIntoView(activeCategory, false);
    }

    window.addEventListener('resize', function () {
      refreshControls();
      bindControlEvents();
      render();
      if (isMobileOneSlide()) {
        scrollToItem(active, false);
        scrollPillIntoView(activeCategory, false);
      }
    }, { passive: true });
    stage.addEventListener('scroll', syncActiveFromScroll, { passive: true });

    if (prev) {
      prev.addEventListener('click', function () {
        goToSlide(active - 1);
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        goToSlide(active + 1);
      });
    }

    if (!isMobileOneSlide()) {
      bindSwipe(carousel, function (dir) {
        goToSlide(active + dir);
      });
    }
  }

  function initInfraCarouselByPrefix(prefix, options) {
    options = options || {};
    initInfraCarousel({
      stageId: prefix + 'Stage',
      carouselId: prefix + 'Carousel',
      pillsTrackId: prefix + 'Pills',
      dotsTrackId: prefix + 'Dots',
      pillsSelector: '#' + prefix + 'Pills .infra-pill',
      dotsSelector: '#' + prefix + 'Dots .dot',
      prevId: prefix + 'Prev',
      nextId: prefix + 'Next',
      initialCategoryIndex: options.initialCategoryIndex,
      initialSlideIndex: options.initialSlideIndex
    });
  }

  Drupal.behaviors.bootstrapInfraCarousel = {
    attach: function (context) {
      once('bootstrap-infra-carousel', '.infra-carousel__stage[id$="Stage"]', context).forEach(function (stage) {
        if (!stage.querySelector('.infra-carousel__item')) {
          return;
        }
        var prefix = prefixFromStage(stage);
        if (!prefix) {
          return;
        }
        initInfraCarouselByPrefix(prefix);
      });
    }
  };

  window.BootstrapInfraCarousel = {
    init: initInfraCarousel,
    initByPrefix: initInfraCarouselByPrefix
  };
})(Drupal, once);
