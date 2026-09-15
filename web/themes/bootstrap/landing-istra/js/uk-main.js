(function (Drupal) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var pills = document.querySelector('[data-uk-pills]');
    var grid = document.querySelector('[data-uk-services]');
    if (pills && grid) {
      var buttons = pills.querySelectorAll('[data-filter]');
      var cards = grid.querySelectorAll('[data-category]');

      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var filter = btn.getAttribute('data-filter') || 'all';
          buttons.forEach(function (b) {
            b.classList.toggle('is-active', b === btn);
          });
          cards.forEach(function (card) {
            var cat = card.getAttribute('data-category');
            var show = filter === 'all' || cat === filter;
            card.classList.toggle('is-hidden', !show);
          });
        });
      });
    }

    var modal = document.getElementById('lv2TourModal');
    if (!modal) {
      return;
    }

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
  });
})(Drupal);
