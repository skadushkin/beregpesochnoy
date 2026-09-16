(function () {
  var header = document.getElementById('riHeader');
  var burger = document.getElementById('riBurger');
  var drawer = document.getElementById('riDrawer');

  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-solid', window.scrollY > 40);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = drawer.hasAttribute('hidden');
      if (open) drawer.removeAttribute('hidden');
      else drawer.setAttribute('hidden', '');
    });
    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        drawer.setAttribute('hidden', '');
      });
    });
  }

  var tabs = document.querySelector('[data-lv2-catalog-tabs]');
  var panelsRoot = document.querySelector('[data-lv2-catalog-panels]');
  if (tabs && panelsRoot) {
    var buttons = tabs.querySelectorAll('[data-tab]');
    var panels = panelsRoot.querySelectorAll('[data-tab-panel]');
    var moreLink = document.querySelector('[data-lv2-catalog-more]');
    function activate(tab) {
      buttons.forEach(function (btn) {
        var on = btn.getAttribute('data-tab') === tab;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on && moreLink && btn.getAttribute('data-catalog-href')) {
          moreLink.setAttribute('href', btn.getAttribute('data-catalog-href'));
        }
      });
      panels.forEach(function (panel) {
        var match = panel.getAttribute('data-tab-panel') === tab;
        panel.hidden = !match;
        panel.classList.toggle('is-active', match);
      });
    }
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activate(btn.getAttribute('data-tab'));
      });
    });
  }

  var modal = document.getElementById('lv2TourModal');
  if (modal) {
    function closeModal() {
      modal.classList.remove('is-active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lv2-modal-open');
    }
    function openModal() {
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
    var closeBtn = document.getElementById('closeLv2TourModal');
    var overlay = document.getElementById('closeLv2TourModalOverlay');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
    window.lv2CloseTourModal = closeModal;
  }
})();
