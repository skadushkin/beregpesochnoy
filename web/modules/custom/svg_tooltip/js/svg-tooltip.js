(function (Drupal, $) {
  Drupal.behaviors.svgTooltip = {
    attach: function () {
      let tooltip = $('#tooltip');
      let lastOpenedPath = null;
      let currentLotContext = null;

      function refreshTooltip() {
        tooltip = $('#tooltip');
        return tooltip;
      }

      function isV2() {
        return document.querySelector('.genplan-embed--v2') !== null;
      }
      const specIconBase = '/themes/bootstrap/landing-v2/img/genplan-v2/tooltip/';
      const tooltipOffset = 16;

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      function isLandWithContract(data, $path) {
        if (data && (data.land_with_contract || data.type === 'lot')) {
          return true;
        }
        const nid = Number(($path && $path.data && $path.data('id')) || (data && data.nid) || 0);
        if (nid >= 983 && nid <= 1007) {
          return true;
        }
        if (!$path || !$path.length) {
          return false;
        }
        const fill = String($path.attr('fill') || '').toUpperCase();
        return fill === '#F6D100' && String(nid) !== '99999';
      }

      function isResidenceLot(data, $path) {
        if (data && data.residence_lot) {
          return true;
        }
        const nid = Number(($path && $path.data && $path.data('id')) || (data && data.nid) || 0);
        return [983, 984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 996, 997].indexOf(nid) !== -1;
      }

      const FAV_STORAGE_KEY = 'bereg_genplan_favorites';

      function heartSvg(filled) {
        return (
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<path d="M12 20.25S4.5 15.4 2.4 11.55C.85 8.85 1.55 4.9 5.05 3.65 7.5 2.75 9.7 3.6 12 6.7c2.3-3.1 4.5-3.95 6.95-3.05 3.5 1.25 4.2 5.2 2.65 7.9C19.5 15.4 12 20.25 12 20.25z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
          '</svg>'
        );
      }

      function readFavorites() {
        try {
          const list = JSON.parse(window.localStorage.getItem(FAV_STORAGE_KEY) || '[]');
          return Array.isArray(list) ? list : [];
        }
        catch (e) {
          return [];
        }
      }

      function writeFavorites(list) {
        window.localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(list));
        updateHeaderFavState();
      }

      function favoriteKey(item) {
        if (item == null) {
          return '';
        }
        if (typeof item !== 'object') {
          return String(item);
        }
        const nid = String(item.nid || '');
        const projectId = String(item.project_id || '');
        if (nid && projectId) {
          return nid + ':p:' + projectId;
        }
        return nid || String(item.id || '');
      }

      function isFavorite(itemOrNid, projectId) {
        const key = favoriteKey(
          typeof itemOrNid === 'object' && itemOrNid !== null
            ? itemOrNid
            : { nid: itemOrNid, project_id: projectId || '' }
        );
        if (!key) {
          return false;
        }
        return readFavorites().some(function (item) {
          return favoriteKey(item) === key;
        });
      }

      function favoritePayload(data) {
        return {
          nid: String(data.nid || ''),
          id: String(data.nid || ''),
          title: data.title || (data.lot_number ? ('Участок №' + data.lot_number) : ''),
          image: data.image || '',
          price: data.price || '',
          mortgage: data.mortgage || '',
          link: data.link || '',
          area: data.area || '',
          lot_area: data.lot_area || '',
          storeys: data.storeys || '',
          type: data.type || '',
          lot_number: data.lot_number || '',
        };
      }

      function lotProjectPayload(lot, project) {
        const lotName = lotLabel(lot);
        const projectTitle = project.title || '';
        return {
          nid: String(lot.nid || ''),
          id: String(project.id || project.nid || ''),
          project_id: String(project.id || project.nid || ''),
          title: [lotName, projectTitle].filter(Boolean).join(' · '),
          lot_title: lotName,
          project_title: projectTitle,
          image: project.image || lot.image || '',
          price: project.price || lot.price || '',
          mortgage: project.mortgage || lot.mortgage || '',
          link: project.link || '',
          area: project.area || '',
          lot_area: lot.lot_area || project.lot_area || '',
          storeys: project.storeys || '',
          type: 'lot_project',
          lot_number: lot.lot_number || '',
        };
      }

      function toggleFavorite(data) {
        const list = readFavorites();
        const key = favoriteKey(data);
        const index = list.findIndex(function (item) {
          return favoriteKey(item) === key;
        });
        if (index >= 0) {
          list.splice(index, 1);
          writeFavorites(list);
          return false;
        }
        const payload = data.project_id ? data : favoritePayload(data);
        list.unshift(payload);
        writeFavorites(list);
        return true;
      }

      function removeFavorite(keyOrNid) {
        const key = favoriteKey(keyOrNid);
        writeFavorites(readFavorites().filter(function (item) {
          return favoriteKey(item) !== key;
        }));
      }

      function updateHeaderFavState() {
        const count = readFavorites().length;
        $('[data-gp-open-favorites]').each(function () {
          const $btn = $(this);
          $btn.toggleClass('is-filled', count > 0);
          $btn.attr('aria-label', count ? ('Избранное, ' + count) : 'Избранное');
          const $count = $btn.find('.header-fav__count');
          if ($count.length) {
            $count.text(count > 0 ? String(count) : '').prop('hidden', count < 1);
          }
        });
      }

      function favButtonHtml(data) {
        const on = isFavorite(data.nid);
        return (
          '<button type="button" class="tooltip-fav' + (on ? ' is-active' : '') + '" data-gp-fav>' +
            heartSvg(on) +
            '<span>' + (on ? 'В избранном' : 'Добавить в избранное') + '</span>' +
          '</button>'
        );
      }

      function constructionFinishBadgeHtml(label) {
        if (!label) {
          return '';
        }
        return (
          '<div class="construction-finish-badge">' +
            '<span class="construction-finish-badge__icon" aria-hidden="true">' +
              '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M5 13.5L16 4.5L27 13.5V27H5V13.5Z" stroke="#765E50" stroke-width="2" stroke-linejoin="round"/>' +
                '<path d="M11.5 17.5L15 21L21.5 13" stroke="#765E50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
              '</svg>' +
            '</span>' +
            '<span class="construction-finish-badge__text">' +
              '<span class="construction-finish-badge__label">Окончание строительства:</span>' +
              '<span class="construction-finish-badge__value">' + escapeHtml(label) + '</span>' +
            '</span>' +
          '</div>'
        );
      }

      function ensureProjectModal() {
        let $modal = $('#genplan-project-modal');
        if ($modal.length) {
          return $modal;
        }

        const html = `
          <div id="genplan-project-modal" class="gp-project-modal" hidden aria-hidden="true">
            <div class="gp-project-modal__backdrop" data-gp-modal-close></div>
            <div class="gp-project-modal__shell">
              <button type="button" class="gp-project-modal__close" data-gp-modal-close>
                <span>Закрыть</span>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M0.353516 0.353577L17.3535 17.3536M0.646409 17.3536L17.6464 0.353577" stroke="#FFFBF3"/>
                </svg>
              </button>
              <div class="gp-project-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="gp-project-modal-title">
                <div class="gp-project-modal__head">
                  <h2 id="gp-project-modal-title" class="gp-project-modal__title">Выберите проект</h2>
                </div>
                <div class="gp-project-modal__body">
                  <div class="gp-project-modal__catalog" data-gp-modal-catalog>
                    <div class="gp-project-modal__loading" data-gp-modal-loading>Загружаем проекты…</div>
                    <div class="gp-project-modal__grid" data-gp-modal-grid hidden></div>
                    <button type="button" class="gp-project-modal__more" data-gp-modal-more hidden>Показать еще</button>
                    <div class="gp-project-modal__empty" data-gp-modal-empty hidden>Проекты пока недоступны.</div>
                  </div>
                  <form class="gp-project-modal__form" data-gp-modal-form hidden novalidate>
                    <button type="button" class="gp-project-modal__back" data-gp-modal-back>← Назад к проектам</button>
                    <p class="gp-project-modal__picked" data-gp-modal-picked></p>
                    <input type="hidden" name="source" value="Генплан: участок с подрядом">
                    <input type="hidden" name="lot_id" data-gp-form-lot-id>
                    <input type="hidden" name="project_id" data-gp-form-project-id>
                    <label class="gp-project-modal__field">
                      <input type="text" name="name" placeholder="Ваше имя" autocomplete="name" required>
                      <span class="online-notice"></span>
                    </label>
                    <label class="gp-project-modal__field">
                      <input type="tel" name="phone" class="phone-field-mask" placeholder="Ваш телефон" autocomplete="tel" required>
                      <span class="online-notice"></span>
                    </label>
                    <label class="gp-project-modal__agree">
                      <input type="checkbox" name="agree" required>
                      <span>Согласен с условиями <a href="/policy/" target="_blank">политики конфиденциальности</a></span>
                    </label>
                    <div class="online-notice" data-gp-form-agree-notice></div>
                    <button type="submit" class="gp-project-modal__submit">Отправить заявку</button>
                    <div class="popup-success" data-gp-form-success>
                      <svg width="25" height="24" viewBox="0 0 25 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.5 12L10.5 18L20.5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      Ваша заявка отправлена. Мы свяжемся с вами.
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        `;
        $('body').append(html);
        $modal = $('#genplan-project-modal');

        $modal.on('click', '[data-gp-modal-close]', function (e) {
          e.preventDefault();
          closeProjectModal();
        });

        $modal.on('click', '[data-gp-modal-back]', function (e) {
          e.preventDefault();
          showProjectCatalog($modal);
        });

        $modal.on('click', '[data-gp-choose-project-item]', function (e) {
          e.preventDefault();
          const $btn = $(this);
          openLeadForm($modal, {
            id: $btn.data('projectId'),
            title: $btn.data('projectTitle') || '',
            link: $btn.data('projectLink') || '',
          });
        });

        $modal.on('click', '[data-gp-modal-more]', function (e) {
          e.preventDefault();
          const visible = Number($modal.data('gpVisible') || 4) + 4;
          $modal.data('gpVisible', visible);
          renderProjectGrid($modal);
        });

        $modal.on('submit', '[data-gp-modal-form]', function (e) {
          e.preventDefault();
          submitLotProjectLead($(this));
        });

        $(document).on('keydown.gpProjectModal', function (e) {
          if (e.key === 'Escape' && $modal.is(':visible') && !$modal.attr('hidden')) {
            closeProjectModal();
          }
        });

        return $modal;
      }

      function openProjectModal(lotData) {
        const $modal = ensureProjectModal();
        const isResidence = isResidenceLot(lotData);
        currentLotContext = lotData || null;
        $modal.data('gpMode', isResidence ? 'residence' : 'project');

        $modal.data('gpItems', []);
        $modal.data('gpVisible', 4);
        $modal.find('[data-gp-modal-loading]').text(isResidence ? 'Загружаем резиденции…' : 'Загружаем проекты…').prop('hidden', false);
        $modal.find('[data-gp-modal-grid]').prop('hidden', true).empty();
        $modal.find('[data-gp-modal-more]').prop('hidden', true);
        $modal.find('[data-gp-modal-empty]').text(isResidence ? 'Резиденции пока недоступны.' : 'Проекты пока недоступны.').prop('hidden', true);
        showProjectCatalog($modal);

        $modal.prop('hidden', false).attr('aria-hidden', 'false').addClass('is-open');
        $('body').addClass('gp-project-modal-open');

        $.ajax({
          url: '/genplan/house-projects',
          method: 'GET',
          data: isResidence ? { kind: 'residence' } : {},
          success: function (response) {
            const items = (response && response.items) || [];
            $modal.data('gpItems', items);
            $modal.find('[data-gp-modal-loading]').prop('hidden', true);
            renderProjectGrid($modal);
          },
          error: function () {
            $modal.find('[data-gp-modal-loading]').prop('hidden', true);
            $modal.find('[data-gp-modal-empty]')
              .text(isResidence ? 'Не удалось загрузить резиденции.' : 'Не удалось загрузить проекты.')
              .prop('hidden', false);
          },
        });
      }

      function closeProjectModal() {
        const $modal = $('#genplan-project-modal');
        if (!$modal.length) {
          return;
        }
        $modal.prop('hidden', true).attr('aria-hidden', 'true').removeClass('is-open');
        $('body').removeClass('gp-project-modal-open');
        showProjectCatalog($modal);
      }

      function showProjectCatalog($modal) {
        const mode = $modal.data('gpMode');
        $modal.removeClass('gp-project-modal--form');
        $modal.find('[data-gp-modal-catalog]').prop('hidden', false);
        $modal.find('[data-gp-modal-form]').prop('hidden', true);
        if (mode === 'favorites') {
          $modal.find('#gp-project-modal-title').text('Избранное');
          return;
        }
        const isResidence = mode === 'residence';
        $modal.find('#gp-project-modal-title').text(isResidence ? 'Выберите резиденцию' : 'Выберите проект');
        $modal.find('[data-gp-modal-back]').text(isResidence ? '← Назад к резиденциям' : '← Назад к проектам');
      }

      function openFavoritesModal() {
        hideTooltip();
        const $modal = ensureProjectModal();
        const items = readFavorites();
        $modal.data('gpMode', 'favorites');
        $modal.data('gpItems', items);
        $modal.data('gpVisible', 4);
        $modal.find('[data-gp-modal-loading]').prop('hidden', true);
        $modal.find('[data-gp-modal-empty]').text('В избранном пока ничего нет.').prop('hidden', true);
        showProjectCatalog($modal);
        renderProjectGrid($modal);
        $modal.prop('hidden', false).attr('aria-hidden', 'false').addClass('is-open');
        $('body').addClass('gp-project-modal-open');
      }

      function lotLabel(lotData) {
        if (!lotData) {
          return '';
        }
        if (lotData.lot_number) {
          return 'Участок №' + lotData.lot_number;
        }
        return lotData.title || '';
      }

      function openLeadForm($modal, project) {
        const lot = currentLotContext || {};
        const lotName = lotLabel(lot);
        $modal.find('[data-gp-modal-catalog]').prop('hidden', true);
        const $form = $modal.find('[data-gp-modal-form]');
        $form.prop('hidden', false);
        $form.find('[data-gp-form-success]').hide();
        $form.find('.online-notice').text('').css('visibility', 'hidden');
        $form.find('input[name="name"], input[name="phone"]').val('');
        $form.find('input[name="agree"]').prop('checked', false);
        $form.find('[data-gp-form-lot-id]').val(lot.nid || '');
        $form.find('[data-gp-form-project-id]').val(project.id || '');
        $form.data('lotTitle', lotName);
        $form.data('projectTitle', project.title || '');
        $modal.find('#gp-project-modal-title').text('Оставить заявку');
        $modal.addClass('gp-project-modal--form');
        $modal.find('[data-gp-modal-picked]').text(
          [
            lotName ? ('Участок: ' + lotName) : '',
            project.title ? (($modal.data('gpMode') === 'residence' ? 'Резиденция: ' : 'Проект: ') + project.title) : '',
          ]
            .filter(Boolean)
            .join(' · ')
        );

        const $phone = $form.find('.phone-field-mask');
        if ($phone.length && $.fn && $.fn.mask) {
          $phone.mask('+7(999) 999-9999');
        }
      }

      function submitLotProjectLead($form) {
        const name = $.trim($form.find('input[name="name"]').val() || '');
        const $phone = $form.find('input[name="phone"]');
        const phone = $phone.val() || '';
        const agreed = $form.find('input[name="agree"]').is(':checked');
        let valid = true;

        const nameNotice = $form.find('input[name="name"]').siblings('.online-notice');
        if (!name) {
          valid = false;
          nameNotice.text('Вы не заполнили обязательное поле').css('visibility', 'visible');
        } else {
          nameNotice.text('').css('visibility', 'hidden');
        }

        const phoneNotice = $phone.siblings('.online-notice');
        if (phone.length !== 16) {
          valid = false;
          phoneNotice.text('Возможно, при вводе данных была допущена ошибка').css('visibility', 'visible');
        } else {
          phoneNotice.text('').css('visibility', 'hidden');
        }

        const agreeNotice = $form.find('[data-gp-form-agree-notice]');
        if (!agreed) {
          valid = false;
          agreeNotice.text('Подтвердите согласие с обработкой персональных данных').css('visibility', 'visible');
        } else {
          agreeNotice.text('').css('visibility', 'hidden');
        }

        if (!valid) {
          return;
        }

        const lotTitle = $form.data('lotTitle') || '';
        const projectTitle = $form.data('projectTitle') || '';
        const lotId = $form.find('[data-gp-form-lot-id]').val() || '';
        const projectId = $form.find('[data-gp-form-project-id]').val() || '';
        const isResidence = $('#genplan-project-modal').data('gpMode') === 'residence';
        const source = isResidence ? 'Генплан: резиденция' : 'Генплан: участок с подрядом';
        const message = [
          lotTitle ? ('Участок: ' + lotTitle) : '',
          lotId ? ('ID участка: ' + lotId) : '',
          projectTitle ? ((isResidence ? 'Резиденция: ' : 'Проект: ') + projectTitle) : '',
          projectId ? ('ID проекта: ' + projectId) : '',
        ].filter(Boolean).join('\n');

        if (typeof window.sendLeadToBitrix === 'function') {
          window.sendLeadToBitrix(name, ' ', phone, message, source, $form);
        }

        $.ajax({
          type: 'POST',
          url: '/form-submit/common-form/',
          data: {
            name: name,
            email: ' ',
            phone: phone,
            message: message,
            source: source,
          },
        });

        $form.find('[data-gp-form-success]').show();
        setTimeout(function () {
          closeProjectModal();
          hideTooltip();
        }, 2500);
      }

      function renderProjectGrid($modal) {
        const items = $modal.data('gpItems') || [];
        const visible = Number($modal.data('gpVisible') || 4);
        const $grid = $modal.find('[data-gp-modal-grid]');
        const $empty = $modal.find('[data-gp-modal-empty]');
        const $more = $modal.find('[data-gp-modal-more]');

        const cards = [];
        const mode = $modal.data('gpMode');
        const asFavorite = mode === 'favorites';
        const skipAtelier = mode === 'residence' || asFavorite;
        items.forEach(function (item, index) {
          if (!skipAtelier && index === 2) {
            cards.push(buildAtelierCard());
          }
          cards.push(buildProjectCard(item, asFavorite));
        });
        if (!skipAtelier && items.length < 3) {
          cards.push(buildAtelierCard());
        }

        if (!cards.length) {
          $grid.prop('hidden', true).empty();
          $more.prop('hidden', true);
          $empty.prop('hidden', false);
          return;
        }

        $empty.prop('hidden', true);
        $grid.empty();
        cards.slice(0, visible).forEach(function (html) {
          $grid.append(html);
        });
        $grid.prop('hidden', false);
        $more.prop('hidden', cards.length <= visible);
      }

      function buildAtelierCard() {
        return (
          '<article class="gp-project-card gp-project-card--atelier">' +
            '<div class="gp-project-card__media">' +
              '<img src="/themes/bootstrap/landing-v2/img/atelier-new2.png" alt="Архитектурное ателье" loading="lazy">' +
            '</div>' +
            '<div class="gp-project-card__body">' +
              '<h3 class="gp-project-card__title gp-project-card__title--lg">Архитектурное ателье</h3>' +
              '<p class="gp-project-card__lead">Спроектируем решение именно под ваш участок и задачи</p>' +
              '<a class="gp-project-card__more" href="/arhitekturnoe-atele">' +
                'Подробнее' +
                '<svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                  '<path d="M0 9h18.5M12.5 1.5L21 9l-8.5 7.5" stroke="#765E50" stroke-width="1"/>' +
                '</svg>' +
              '</a>' +
            '</div>' +
          '</article>'
        );
      }

      function buildProjectCard(item, asFavorite) {
        const href = escapeHtml(item.link || '#');
        const meta = [item.area, item.storeys, item.lot_area].filter(Boolean).map(escapeHtml).join('     ');
        const projectId = String(item.project_id || item.id || '');
        const favItem = asFavorite
          ? item
          : lotProjectPayload(currentLotContext || {}, item);
        const favKey = escapeHtml(favoriteKey(favItem));
        const on = asFavorite || isFavorite(favItem);
        const cardTitle = asFavorite && item.project_title
          ? item.project_title
          : (item.title || '');
        const lotLine = asFavorite && item.project_title
          ? (item.lot_title || (item.lot_number ? ('Участок №' + item.lot_number) : ''))
          : '';

        const priceText = item.price || 'Цена по запросу';
        const priceClass = /\d/.test(priceText)
          ? 'gp-project-card__price'
          : 'gp-project-card__price gp-project-card__price--plain';

        const action = asFavorite
          ? (item.link
            ? '<a class="gp-project-card__btn" href="' + href + '">Подробнее</a>'
            : '<a class="gp-project-card__btn" href="#" data-fancybox data-src="#mess">Записаться</a>')
          : ('<button type="button" class="gp-project-card__btn" data-gp-choose-project-item' +
              ' data-project-id="' + escapeHtml(item.id || '') + '"' +
              ' data-project-title="' + escapeHtml(item.title || '') + '"' +
              ' data-project-link="' + href + '">Выбрать</button>');

        const favBtn = asFavorite
          ? ('<button type="button" class="gp-project-card__fav is-active" data-gp-fav-remove data-fav-key="' + favKey + '" aria-label="Убрать из избранного">' +
              heartSvg(true) +
            '</button>')
          : ('<button type="button" class="gp-project-card__fav' + (on ? ' is-active' : '') + '" data-gp-fav-combo data-project-id="' + escapeHtml(projectId) + '" aria-label="' + (on ? 'Убрать из избранного' : 'Добавить в избранное') + '">' +
              heartSvg(on) +
            '</button>');

        return (
          '<article class="gp-project-card' + (asFavorite ? ' gp-project-card--fav' : '') + '">' +
            '<div class="gp-project-card__media">' +
              (item.image
                ? '<img src="' + escapeHtml(item.image) + '" alt="" loading="lazy">'
                : '<span class="gp-project-card__media--empty" aria-hidden="true"></span>') +
              favBtn +
            '</div>' +
            '<div class="gp-project-card__body">' +
              '<div class="gp-project-card__head">' +
                '<div class="gp-project-card__names">' +
                  (lotLine ? '<p class="gp-project-card__lot">' + escapeHtml(lotLine) + '</p>' : '') +
                  '<h3 class="gp-project-card__title">' + escapeHtml(cardTitle) + '</h3>' +
                '</div>' +
                (meta ? '<p class="gp-project-card__meta">' + meta + '</p>' : '') +
              '</div>' +
              '<div class="gp-project-card__price-block">' +
                '<p class="' + priceClass + '">' + escapeHtml(priceText) + '</p>' +
                (item.mortgage ? '<p class="gp-project-card__mortgage">' + escapeHtml(item.mortgage) + '</p>' : '') +
              '</div>' +
              action +
            '</div>' +
          '</article>'
        );
      }

      function positionTooltip() {
        refreshTooltip();
        if (!isV2()) {
          return;
        }

        const map = document.querySelector('.genplan-embed--v2 #image-container');
        if (!map || !tooltip.length) {
          return;
        }

        if (tooltip[0].parentElement !== map) {
          map.appendChild(tooltip[0]);
        }

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const maxHeight = Math.max(0, map.clientHeight - tooltipOffset * 2);

        tooltip.css({
          position: 'absolute',
          bottom: 'auto',
          maxHeight: maxHeight + 'px',
          overflow: 'hidden',
          left: isMobile ? tooltipOffset + 'px' : 'auto',
          right: tooltipOffset + 'px',
          width: isMobile ? 'auto' : '360px',
          maxWidth: isMobile ? 'none' : 'calc(100% - ' + (tooltipOffset * 2) + 'px)',
        });

        const tipHeight = tooltip.outerHeight();
        const top = Math.max(tooltipOffset, Math.round((map.clientHeight - tipHeight) / 2));
        tooltip.css('top', top + 'px');

        const actions = tooltip.find('.tooltip-actions');
        if (actions.length) {
          actions.css({ flexShrink: 0 });
        }
      }

      function buildSpecItem(icon, label) {
        return (
          '<div class="tooltip-spec">' +
            '<img class="tooltip-spec-icon" src="' + escapeHtml(icon) + '" alt="" aria-hidden="true">' +
            '<span class="tooltip-spec-label">' + escapeHtml(label) + '</span>' +
          '</div>'
        );
      }

      function buildSpecRows(data, onlyLot) {
        const items = onlyLot
          ? [
              { icon: specIconBase + 'spec-lot.svg', label: data.lot_area },
              { icon: specIconBase + 'spec-size.svg', label: data.dimensions },
            ]
          : [
              { icon: specIconBase + 'spec-area.svg', label: data.area },
              { icon: specIconBase + 'spec-lot.svg', label: data.lot_area },
              { icon: specIconBase + 'spec-size.svg', label: data.dimensions },
              { icon: specIconBase + 'spec-storeys.svg', label: data.storeys },
              { icon: specIconBase + 'spec-rooms.svg', label: data.rooms },
              { icon: specIconBase + 'spec-bathrooms.svg', label: data.bathrooms },
            ];

        const filtered = items.filter(function (item) {
          return Boolean(item.label);
        });

        if (!filtered.length) {
          return '';
        }

        const rows = [];
        for (let i = 0; i < filtered.length; i += 3) {
          const chunk = filtered.slice(i, i + 3);
          const cells = [];
          chunk.forEach(function (item, index) {
            if (index > 0) {
              cells.push('<div class="tooltip-spec-divider" aria-hidden="true"></div>');
            }
            cells.push(buildSpecItem(item.icon, item.label));
          });
          rows.push('<div class="tooltip-specs-row">' + cells.join('') + '</div>');
        }

        return '<div class="tooltip-specs">' + rows.join('') + '</div>';
      }

      function closeBtnHtml() {
        return `
          <button type="button" class="tooltip-close" id="tooltip-close" aria-label="Закрыть">
            <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M15 15.5L1 1.50003M15 1.5L1.00002 15.5" stroke="#917357" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        `;
      }

      /** Карточка участка с подрядом — Figma 7629:1940 */
      function buildV2LotContent(data) {
        const title = data.lot_number
          ? ('Участок №' + data.lot_number)
          : (data.title || 'Участок с подрядом');

        let media = '<div class="tooltip-media">';
        if (data.image) {
          media += '<div class="tooltip-img"><img src="' + escapeHtml(data.image) + '" alt=""></div>';
        } else {
          media += '<div class="tooltip-img tooltip-img--lot" aria-hidden="true"></div>';
        }
        media += '<div class="tooltip-badge-lot">Участок с подрядом</div>';
        media += closeBtnHtml();
        media += '</div>';

        let intro = '<div class="tooltip-intro">';
        intro += '<div class="tooltip-head"><div class="tooltip-title">' + escapeHtml(title) + '</div></div>';
        if (data.price || data.mortgage) {
          intro += '<div class="tooltip-price-block">';
          if (data.price) {
            intro += '<div class="tooltip-price">' + escapeHtml(data.price) + '</div>';
          }
          if (data.mortgage) {
            intro += '<div class="tooltip-mortgage">' + escapeHtml(data.mortgage) + '</div>';
          }
          intro += '</div>';
        }
        intro += '</div>';

        const specs = buildSpecRows(data, true);
        const finishBadge = constructionFinishBadgeHtml(data.construction_finish);

        const chooseLabel = isResidenceLot(data)
          ? 'Подобрать резиденцию'
          : 'Подобрать проект дома';
        const footer = `
          <div class="tooltip-actions tooltip-actions--lot">
            ${favButtonHtml(data)}
            <button type="button" class="tooltip-choose-project" data-gp-choose-project>${chooseLabel}</button>
            <a href="#" class="tooltip-viewing-link" data-fancybox data-src="#mess">Записаться на просмотр</a>
          </div>
        `;

        return media + '<div class="tooltip-content">' + intro + specs + finishBadge + '<div class="tooltip-footer">' + footer + '</div></div>';
      }

      function buildV2Content(data) {
        const houseLink = data.link ? escapeHtml(data.link) : '';
        let media = '<div class="tooltip-media">';
        if (data.image && houseLink) {
          media += '<a href="' + houseLink + '" class="tooltip-img-link">';
          media += '<div class="tooltip-img"><img src="' + escapeHtml(data.image) + '" alt=""></div>';
          media += '</a>';
        } else if (data.image) {
          media += '<div class="tooltip-img"><img src="' + escapeHtml(data.image) + '" alt=""></div>';
        } else {
          media += '<div class="tooltip-img tooltip-img--empty" aria-hidden="true"></div>';
        }
        if (data.house_under_construction) {
          media += '<div class="tooltip-underc">Дом строится</div>';
        }
        media += closeBtnHtml();
        media += '</div>';

        let intro = '<div class="tooltip-intro">';
        if (data.title) {
          intro += '<div class="tooltip-head"><div class="tooltip-title">' + escapeHtml(data.title) + '</div></div>';
        }
        if (data.price || data.mortgage) {
          intro += '<div class="tooltip-price-block">';
          if (data.price) {
            intro += '<div class="tooltip-price">' + escapeHtml(data.price) + '</div>';
          }
          if (data.mortgage) {
            intro += '<div class="tooltip-mortgage">' + escapeHtml(data.mortgage) + '</div>';
          }
          intro += '</div>';
        }
        intro += '</div>';

        const specs = buildSpecRows(data, false);
        const finishBadge = constructionFinishBadgeHtml(data.construction_finish);

        const footer = `
          <div class="tooltip-actions">
            ${favButtonHtml(data)}
            <div class="tooltip-actions__row">
              <a href="#" class="tooltip-viewing-link" data-fancybox data-src="#mess">Записаться на просмотр</a>
              <a href="${escapeHtml(data.link || '#')}" class="tooltip-more-link">Подробнее</a>
            </div>
          </div>
        `;

        return media + '<div class="tooltip-content">' + intro + specs + finishBadge + '<div class="tooltip-footer">' + footer + '</div></div>';
      }

      function buildClassicContent(data, isLot) {
        const closeBtn = `
          <div class="tooltip-close" id="tooltip-close" style="position:absolute; top:10px; right:5px; cursor:pointer;">
            <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 15.5L1 1.50003M15 1.5L1.00002 15.5" stroke="#917357" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        `;

        let content = closeBtn + '<div class="tooltip-content">';

        if (isLot) {
          content += '<div class="tooltip-underc" style="background:#F6D100;color:#3C3C3B;">Участок с подрядом</div>';
        } else if (data.house_under_construction) {
          content += '<div class="tooltip-underc">Дом строится</div>';
        }
        if (data.kn) {
          content += '<div class="tooltip-text">' + escapeHtml(data.kn) + '</div>';
        }
        if (data.title) {
          content += '<div class="tooltip-title">' + escapeHtml(data.title) + '</div>';
        }
        if (data.price) {
          content += '<div class="tooltip-price">' + escapeHtml(data.price) + '</div>';
        }
        if (data.image) {
          content += '<div class="tooltip-img"><img src="' + escapeHtml(data.image) + '" alt=""></div>';
        }

        if (isLot) {
          const chooseLabel = isResidenceLot(data)
            ? 'Подобрать резиденцию'
            : 'Подобрать проект дома';
          content += `
            <div class="tooltip-actions tooltip-actions--lot">
              <button type="button" class="tooltip-choose-project" data-gp-choose-project>${chooseLabel}</button>
              <a href="#" class="tooltip-viewing-link" data-fancybox data-src="#mess">Записаться на просмотр</a>
            </div>
          `;
        } else {
          content += `
            <div class="tooltip-more">
              <a href="${escapeHtml(data.link)}" class="tooltip-more-link">
                Подробнее
                <svg width="25" height="12" viewBox="0 0 25 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.1406 1.24316L24.2164 6.00267M24.2164 6.00267L19.1406 10.7568M24.2164 6.00267L0 6.0027" stroke="#AD9170" stroke-miterlimit="10"/>
                </svg>
              </a>
            </div>
          `;
        }

        content += '</div>';
        return content;
      }

      function bindTooltipActions(data) {
        refreshTooltip();
        $('#tooltip-close').on('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          hideTooltip();
        });

        tooltip.find('[data-gp-choose-project]').on('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          openProjectModal(data);
        });

        tooltip.find('[data-gp-fav]').on('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          const on = toggleFavorite(data);
          const $btn = $(this);
          $btn.toggleClass('is-active', on);
          $btn.find('span').text(on ? 'В избранном' : 'Добавить в избранное');
          $btn.find('svg').replaceWith(heartSvg(on));
        });
      }

      function showTooltip(event, $path) {
        refreshTooltip();
        if (!tooltip.length) {
          return;
        }

        const nodeId = $path.data('id');
        if (!nodeId && nodeId !== 0) {
          return;
        }

        if (lastOpenedPath && lastOpenedPath[0] !== $path[0]) {
          hideTooltip();
        }

        lastOpenedPath = $path;

        $.ajax({
          url: '/node-info/' + nodeId,
          method: 'GET',
          success: function (data) {
            refreshTooltip();
            if (!tooltip.length || data.error) {
              return;
            }

            data.nid = nodeId;
            const isLot = isLandWithContract(data, $path);
            let html;
            if (isV2()) {
              html = isLot ? buildV2LotContent(data) : buildV2Content(data);
            } else {
              html = buildClassicContent(data, isLot);
            }

            tooltip
              .html(html)
              .toggleClass('tooltip--lot', isLot)
              .removeClass('hidden')
              .addClass('visible animate-tooltip');

            if (isV2()) {
              positionTooltip();
              tooltip.find('img').one('load.gpTooltipPos', positionTooltip);
              window.requestAnimationFrame(positionTooltip);
            } else {
              tooltip.css({
                top: event.clientY + 'px',
                left: event.clientX + 'px',
                position: 'fixed',
              });
            }

            bindTooltipActions(data);
          },
        });
      }

      function hideTooltip() {
        refreshTooltip();
        if (!tooltip.length) {
          lastOpenedPath = null;
          return;
        }

        tooltip.removeClass('visible animate-tooltip tooltip--lot').addClass('hidden').html('');
        lastOpenedPath = null;

        const el = tooltip[0];
        if (isV2() && el && el.parentElement && el.parentElement.id !== 'image-container') {
          document.body.appendChild(el);
        }
      }

      $(document)
        .off('click.gpFavorites')
        .on('click.gpFavorites', '[data-gp-open-favorites]', function (event) {
          event.preventDefault();
          event.stopPropagation();
          openFavoritesModal();
        })
        .on('click.gpFavorites', '[data-gp-fav-combo]', function (event) {
          event.preventDefault();
          event.stopPropagation();
          const $modal = $('#genplan-project-modal');
          const projectId = String($(this).attr('data-project-id') || '');
          const items = $modal.data('gpItems') || [];
          const project = items.find(function (item) {
            return String(item.id || item.nid) === projectId;
          });
          if (!project || !currentLotContext) {
            return;
          }
          toggleFavorite(lotProjectPayload(currentLotContext, project));
          renderProjectGrid($modal);
        })
        .on('click.gpFavorites', '[data-gp-fav-remove]', function (event) {
          event.preventDefault();
          event.stopPropagation();
          const $modal = $('#genplan-project-modal');
          removeFavorite($(this).attr('data-fav-key') || $(this).data('nid'));
          $modal.data('gpItems', readFavorites());
          renderProjectGrid($modal);
        });

      updateHeaderFavState();

      $(window)
        .off('scroll.svgTooltip resize.svgTooltip')
        .on('scroll.svgTooltip resize.svgTooltip', function () {
          refreshTooltip();
          if (isV2() && tooltip.hasClass('visible')) {
            positionTooltip();
          } else if (!isV2()) {
            hideTooltip();
          }
        });

      $(document)
        .off('click.svgTooltipPath')
        .on('click.svgTooltipPath', '#overlay-image path[data-id]', function (event) {
          event.preventDefault();
          event.stopPropagation();
          showTooltip(event, $(this));
        });

      $(document)
        .off('click.svgTooltipOutside')
        .on('click.svgTooltipOutside', function (event) {
          const target = event.target;
          if (!target) {
            return;
          }
          if (target.closest && target.closest('#tooltip, #genplan-project-modal, [data-gp-open-favorites]')) {
            return;
          }
          if (target.closest && target.closest('#overlay-image path[data-id]')) {
            return;
          }
          hideTooltip();
        });
    },
  };
})(Drupal, jQuery);
