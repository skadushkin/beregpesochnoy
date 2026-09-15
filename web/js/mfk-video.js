(function (Drupal, once) {
  'use strict';

  function setItemPlaying(item, shouldPlay) {
    var video = item.querySelector('video.mfk-img__video');
    if (!video) {
      return;
    }

    if (shouldPlay) {
      video.play().catch(function () {});
      item.classList.add('is-visible');
    } else {
      video.pause();
      item.classList.remove('is-visible');
    }
  }

  Drupal.behaviors.mfkVideo = {
    attach: function (context) {
      once('mfk-video', '.mfk-item--has-video', context).forEach(function (item) {
        var video = item.querySelector('video.mfk-img__video');
        if (!video) {
          return;
        }

        if ('IntersectionObserver' in window) {
          var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.target === item) {
                setItemPlaying(item, entry.isIntersecting);
              }
            });
          }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
          observer.observe(item);
        } else {
          setItemPlaying(item, true);
        }
      });
    }
  };
})(Drupal, once);
