(function (Drupal) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    /* Lifestyle — видео вместо постеров при появлении секции (как family на 838) */
    (function () {
      var section = document.querySelector('.section.ponton-lifestyle');
      if (!section) {
        return;
      }

      var videos = section.querySelectorAll('video.ponton-lifestyle__img[data-src]');
      if (!videos.length) {
        return;
      }

      function setPlaying(shouldPlay) {
        videos.forEach(function (video) {
          if (shouldPlay) {
            if (!video.dataset.loaded) {
              video.src = video.getAttribute('data-src');
              video.dataset.loaded = '1';
              video.load();
            }
            video.play().catch(function () {});
          } else if (video.dataset.loaded) {
            video.pause();
          }
        });
      }

      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            section.classList.toggle('is-visible', entry.isIntersecting);
            setPlaying(entry.isIntersecting);
          });
        }, { threshold: 0.2, rootMargin: '0px 0px -5% 0px' });
        observer.observe(section);
      } else {
        section.classList.add('is-visible');
        setPlaying(true);
      }
    })();

    /* Попап «Записаться на экскурсию» */
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

      if (window.location.hash === '#tour') {
        openModal();
      }

      window.lv2CloseTourModal = closeModal;
    }
  });
})(Drupal);
