(function (Drupal) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
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

    window.lv2CloseTourModal = closeModal;
  });
})(Drupal);
