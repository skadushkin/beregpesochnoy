(function (Drupal, once) {
  'use strict';

  function initGenplanEmbed(embed) {
    if (embed.hasAttribute('data-genplan-init')) {
      return;
    }
    embed.setAttribute('data-genplan-init', '1');

    var VISIBLE_OPACITY = '0.4';
    var HIDDEN_OPACITY = '0';

    function setCategoryPathsOpacity(fillColor, opacity) {
      embed.querySelectorAll('#overlay-image path[fill="' + fillColor + '"]').forEach(function (path) {
        path.setAttribute('fill-opacity', opacity);
      });
    }

    embed.querySelectorAll('.category-item').forEach(function (item) {
      var label = item.querySelector('.category-label');
      var fillColor = item.dataset.fill;

      if (!label || !fillColor) {
        return;
      }

      item.dataset.categoryActive = '1';

      item.addEventListener('click', function () {
        var active = item.dataset.categoryActive !== '0';

        setCategoryPathsOpacity(fillColor, active ? VISIBLE_OPACITY : HIDDEN_OPACITY);

        item.dataset.categoryActive = active ? '0' : '1';
        item.classList.toggle('inactive', active);

        if (embed.classList.contains('genplan-embed--v2')) {
          var showAllBtn = embed.querySelector('#genplan-show-all');
          if (showAllBtn) {
            showAllBtn.classList.remove('is-active');
          }
        }
      });
    });

    function resetCategoryFilters() {
      embed.querySelectorAll('.category-item').forEach(function (item) {
        var fillColor = item.dataset.fill;
        if (!fillColor) {
          return;
        }

        item.dataset.categoryActive = '1';
        item.classList.remove('inactive');
        setCategoryPathsOpacity(fillColor, VISIBLE_OPACITY);
      });

      var showAllBtn = embed.querySelector('#genplan-show-all');
      if (showAllBtn) {
        showAllBtn.classList.add('is-active');
      }
    }

    var showAllBtn = embed.querySelector('#genplan-show-all');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', resetCategoryFilters);
      if (embed.classList.contains('genplan-embed--v2') && !embed.querySelector('.category-item.inactive')) {
        showAllBtn.classList.add('is-active');
      }
    }

    var panzoomElem = embed.querySelector('#panzoom');
    var imageContainer = embed.querySelector('#image-container');
    var mainImage = embed.querySelector('#main-image');
    var infraToggle = embed.querySelector('#infra-toggle');
    var infraImage = embed.querySelector('#infra-image');
    var zoomIn = embed.querySelector('#zoom-in');
    var zoomOut = embed.querySelector('#zoom-out');
    var fullscreenBtn = embed.querySelector('#fullscreen-btn');

    if (!panzoomElem || !imageContainer || !mainImage || typeof Panzoom === 'undefined') {
      return;
    }

    var isV2Embed = embed.classList.contains('genplan-embed--v2');

    var panzoomInstance = Panzoom(panzoomElem, {
      maxScale: 3,
      minScale: 1,
      contain: 'outside',
      startScale: 1,
      wheel: false,
      disableZoom: false,
    });

    panzoomElem.removeEventListener('wheel', panzoomInstance.zoomWithWheel);

    function centerImage() {
      var containerWidth = imageContainer.clientWidth;
      var containerHeight = imageContainer.clientHeight;
      var imageWidth = mainImage.clientWidth;
      var imageHeight = mainImage.clientHeight;

      if (!containerWidth || !containerHeight || !imageWidth || !imageHeight) {
        return;
      }

      panzoomInstance.zoom(1, { animate: false });
      panzoomInstance.pan(0, 0, { animate: false });
    }

    function updateOverlaySize() {
      var overlay = embed.querySelector('#overlay-image');
      var infra = embed.querySelector('#infra-image');

      if (!mainImage) {
        return;
      }

      var originalBaseWidth = 1198;
      var originalBaseHeight = 673;
      var isV2 = embed.classList.contains('genplan-embed--v2');
      var newBaseWidth = mainImage.clientWidth;
      var newBaseHeight = mainImage.clientHeight;
      var offsetX = 0;
      var offsetY = 0;

      if (isV2 && imageContainer) {
        var containerWidth = imageContainer.clientWidth;
        var containerHeight = imageContainer.clientHeight;
        var naturalWidth = mainImage.naturalWidth || originalBaseWidth;
        var naturalHeight = mainImage.naturalHeight || originalBaseHeight;
        var containerRatio = containerWidth / containerHeight;
        var imageRatio = naturalWidth / naturalHeight;

        if (imageRatio > containerRatio) {
          newBaseHeight = containerHeight;
          newBaseWidth = newBaseHeight * imageRatio;
          offsetX = (containerWidth - newBaseWidth) / 2;
          offsetY = 0;
        }
        else {
          newBaseWidth = containerWidth;
          newBaseHeight = newBaseWidth / imageRatio;
          offsetX = 0;
          offsetY = (containerHeight - newBaseHeight) / 2;
        }
      }

      var scaleX = newBaseWidth / originalBaseWidth;
      var scaleY = newBaseHeight / originalBaseHeight;

      if (overlay) {
        overlay.style.width = (916 * scaleX) + 'px';
        overlay.style.height = (523 * scaleY) + 'px';
        overlay.style.top = (149 * scaleY + offsetY) + 'px';
        overlay.style.left = (108 * scaleX + offsetX) + 'px';
      }

      if (infra) {
        infra.style.width = (1180 * scaleX) + 'px';
        infra.style.top = offsetY + 'px';
        infra.style.left = (10 * scaleX + offsetX) + 'px';
      }
    }

    updateOverlaySize();
    centerImage();

    var resizeHandler = function () {
      updateOverlaySize();
      centerImage();
    };
    window.addEventListener('resize', resizeHandler);

    imageContainer.addEventListener('wheel', function (event) {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        panzoomInstance.zoomWithWheel(event);
        return;
      }

      if (isV2Embed) {
        event.preventDefault();
        window.scrollBy({
          top: event.deltaY,
          left: event.deltaX,
          behavior: 'auto',
        });
        return;
      }

      event.preventDefault();
      panzoomInstance.zoomWithWheel(event);
    }, { passive: false });

    if (zoomIn) {
      zoomIn.addEventListener('click', function () {
        panzoomInstance.zoomIn({ animate: true, force: true });
      });
    }

    if (zoomOut) {
      zoomOut.addEventListener('click', function () {
        panzoomInstance.zoomOut({ animate: true, force: true });
      });
    }

    panzoomElem.addEventListener('touchstart', function (event) {
      if (event.touches.length === 2) {
        event.preventDefault();
      }
    }, { passive: false });

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', function () {
        var tooltip = document.getElementById('tooltip');

        if (!document.fullscreenElement) {
          var request = imageContainer.requestFullscreen ||
            imageContainer.mozRequestFullScreen ||
            imageContainer.webkitRequestFullscreen ||
            imageContainer.msRequestFullscreen;

          if (request) {
            request.call(imageContainer);
          }
          imageContainer.classList.add('fullscreen');
          if (tooltip) {
            imageContainer.appendChild(tooltip);
          }
        }
        else {
          var exit = document.exitFullscreen ||
            document.mozCancelFullScreen ||
            document.webkitExitFullscreen ||
            document.msExitFullscreen;

          if (exit) {
            exit.call(document);
          }
        }
      });
    }

    document.addEventListener('fullscreenchange', function () {
      var tooltip = document.getElementById('tooltip');

      if (!document.fullscreenElement) {
        imageContainer.classList.remove('fullscreen');
        if (tooltip) {
          document.body.appendChild(tooltip);
        }
      }
    });

    if (infraToggle && infraImage) {
      infraToggle.addEventListener('change', function () {
        infraImage.style.display = this.checked ? 'block' : 'none';
      });
    }

    var infraPanel = embed.querySelector('.genplan-infra-panel');
    if (infraPanel) {
      var infraClose = infraPanel.querySelector('[data-gp-infra-close]');
      if (!infraClose) {
        infraClose = document.createElement('button');
        infraClose.type = 'button';
        infraClose.className = 'genplan-infra-panel__close';
        infraClose.setAttribute('data-gp-infra-close', '');
        infraClose.setAttribute('aria-label', 'Закрыть');
        infraClose.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M0.353516 0.353577L17.3535 17.3536M0.646409 17.3536L17.6464 0.353577" stroke="#FFFBF3"/></svg>';
        infraPanel.insertBefore(infraClose, infraPanel.firstChild);
      }
      infraClose.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        infraPanel.setAttribute('hidden', '');
      });
    }

    if (!mainImage.complete) {
      mainImage.addEventListener('load', function () {
        updateOverlaySize();
        centerImage();
      });
    }

    var currentNid = embed.getAttribute('data-current-nid');
    if (currentNid) {
      var currentPath = embed.querySelector('#overlay-image path[data-id="' + currentNid + '"]');
      if (currentPath) {
        currentPath.setAttribute('fill-opacity', '1');
        currentPath.classList.add('is-current');
      }
    }
  }

  Drupal.behaviors.bootstrapGenplanMap = {
    attach: function (context) {
      once('genplan-map', '.genplan-embed', context).forEach(initGenplanEmbed);
    },
  };

  window.bootstrapInitGenplanMap = function (container) {
    var root = container || document;
    var embed = root.classList && root.classList.contains('genplan-embed')
      ? root
      : root.querySelector('.genplan-embed');

    if (embed) {
      initGenplanEmbed(embed);
    }
  };
})(Drupal, once);
