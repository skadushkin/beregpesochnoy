(function (Drupal, once) {
  function closeMega() {
    var mega = document.getElementById('bpMega');
    var btn = document.getElementById('bpMenuBtn');
    if (!mega) return;
    mega.setAttribute('hidden', '');
    document.body.classList.remove('bp-mega-open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

    function openMega() {
    var mega = document.getElementById('bpMega');
    var btn = document.getElementById('bpMenuBtn');
    var header = document.getElementById('bpHeader');
    if (!mega) return;
    mega.removeAttribute('hidden');
    document.body.classList.add('bp-mega-open');
    if (header) header.classList.add('is-solid');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  Drupal.behaviors.bpChrome = {
    attach: function (context) {
      once('bp-chrome', 'body', context).forEach(function () {
        var header = document.getElementById('bpHeader');
        var menuBtn = document.getElementById('bpMenuBtn');
        var mega = document.getElementById('bpMega');

        function onScroll() {
          if (!header) return;
          if (header.classList.contains('is-solid') && !document.querySelector('.bp-hero')) {
            return;
          }
          header.classList.toggle('is-solid', window.scrollY > 40 || !document.querySelector('.bp-hero'));
        }
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        if (menuBtn && mega) {
          menuBtn.addEventListener('click', function () {
            if (mega.hasAttribute('hidden')) openMega();
            else closeMega();
          });
          mega.querySelectorAll('[data-bp-mega-close]').forEach(function (el) {
            el.addEventListener('click', closeMega);
          });
          mega.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', closeMega);
          });
          document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeMega();
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
            closeMega();
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
      });
    },
  };
})(Drupal, once);
