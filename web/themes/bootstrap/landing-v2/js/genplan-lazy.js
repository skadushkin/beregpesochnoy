(function (Drupal) {
  'use strict';

  function showError(block, loader, message) {
    block.classList.add('lv2-genplan--error');
    if (!loader) {
      return;
    }
    loader.removeAttribute('hidden');
    loader.innerHTML =
      '<div class="lv2-genplan__loader-inner">' +
      '<p class="lv2-genplan__error-text">' + message + '</p>' +
      '<button type="button" class="lv2-genplan__retry">Повторить</button>' +
      '</div>';
    var retry = loader.querySelector('.lv2-genplan__retry');
    if (retry) {
      retry.addEventListener('click', function () {
        block.classList.remove('lv2-genplan--error');
        loadGenplan(block);
      });
    }
  }

  function loadGenplan(block) {
    var url = block.dataset.genplanUrl || '/genplan/embed';
    var mount = block.querySelector('.lv2-genplan__mount');
    var loader = block.querySelector('.lv2-genplan__loader');

    if (!mount) {
      return;
    }

    block.classList.remove('lv2-genplan--loaded', 'lv2-genplan--error');
    if (loader) {
      loader.removeAttribute('hidden');
      loader.innerHTML =
        '<div class="lv2-genplan__loader-inner" aria-hidden="false">' +
        '<div class="lv2-genplan__spinner" aria-hidden="true"></div>' +
        '<p class="lv2-genplan__loader-text">Загружаем интерактивный генплан…</p>' +
        '</div>';
    }
    mount.innerHTML = '';
    mount.setAttribute('hidden', '');

    fetch(url, { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.text();
      })
      .then(function (html) {
        mount.innerHTML = html;
        mount.removeAttribute('hidden');
        block.classList.add('lv2-genplan--loaded');

        if (loader) {
          loader.setAttribute('hidden', '');
        }

        if (window.bootstrapInitGenplanMap) {
          window.bootstrapInitGenplanMap(mount);
        }
        Drupal.attachBehaviors(mount);

        var mainImage = mount.querySelector('#main-image');
        if (mainImage && !mainImage.complete) {
          mainImage.addEventListener('load', function () {
            window.dispatchEvent(new Event('resize'));
          }, { once: true });
        }
        else {
          window.dispatchEvent(new Event('resize'));
        }
      })
      .catch(function () {
        showError(block, loader, 'Не удалось загрузить генплан.');
      });
  }

  Drupal.behaviors.lv2GenplanLazy = {
    attach: function (context) {
      var block = context.querySelector
        ? context.querySelector('#lv2Genplan:not([data-lv2-genplan-scheduled])')
        : null;

      if (!block) {
        return;
      }

      block.setAttribute('data-lv2-genplan-scheduled', '1');

      var start = function () {
        loadGenplan(block);
      };

      if (document.readyState === 'complete') {
        window.setTimeout(start, 0);
      }
      else {
        window.addEventListener('load', start, { once: true });
      }
    },
  };
})(Drupal);
