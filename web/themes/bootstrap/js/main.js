/**
 * Источник заявки для Bitrix (SOURCE_DESCRIPTION / TITLE).
 * TITLE — только название формы, никогда имя из поля «Имя».
 */
function normalizeFormTitle(raw) {
    return jQuery.trim(String(raw || '').replace(/\s+/g, ' '));
}

function isUserNameAsTitle(title, personName) {
    var titleNorm = normalizeFormTitle(title).toLowerCase();
    var nameNorm = normalizeFormTitle(personName).toLowerCase();
    if (!titleNorm) {
        return true;
    }
    if (!nameNorm) {
        return false;
    }
    return titleNorm === nameNorm
        || titleNorm === ('заявка с сайта: ' + nameNorm)
        || titleNorm === ('форма: ' + nameNorm);
}

function formTitleFromHeading($root) {
    var text = '';
    if (!$root || !$root.length) {
        return '';
    }
    $root.find('.popup-title, .banner1-form-title, .bp-modal__title, .cta__title, .ri-form > h3, .lead-form-title, h2, h3').each(function () {
        var candidate = normalizeFormTitle(jQuery(this).text());
        if (candidate && candidate.length >= 3 && candidate.length <= 90) {
            text = candidate;
            return false;
        }
    });
    return text;
}

function resolveLeadSource($context, explicitSource, personName) {
    var $scope = ($context && $context.length)
        ? $context.closest('.popup, .popup-mess, .bp-modal, .yana-popup, .banner-form1, .lead-form, .lead-form-ipoteka, .cta, .ri-hub, .ri-form, form, section')
        : jQuery();
    if ($context && $context.length && !$scope.length) {
        $scope = $context;
    }

    var source = normalizeFormTitle(explicitSource);
    if (isUserNameAsTitle(source, personName)) {
        source = '';
    }
    if (!source && $scope.length) {
        source = normalizeFormTitle($scope.find('input[name="source"]').first().val() || '');
        if (isUserNameAsTitle(source, personName)) {
            source = '';
        }
    }
    if (!source && $scope.length) {
        source = formTitleFromHeading($scope);
        if (isUserNameAsTitle(source, personName)) {
            source = '';
        }
    }
    if (!source) {
        var path = (location.pathname || '/').replace(/\/+$/, '') || '/';
        source = 'Берег Песочной' + (path !== '/' ? ' (' + path + ')' : '');
    }
    return source;
}

function sendLeadToBitrix(name, email, phone, message, source, context) {
    var personName = normalizeFormTitle(name);
    var $context = context ? jQuery(context) : jQuery();
    var sourceLabel = resolveLeadSource($context, source, personName);
    if (isUserNameAsTitle(sourceLabel, personName)) {
        sourceLabel = 'Берег Песочной';
    }
    var emailValue = jQuery.trim(email || '');
    var hasEmail = emailValue !== '' && emailValue.indexOf('@') !== -1;
    var userMessage = jQuery.trim(String(message || ''));
    var commentParts = [];
    if (userMessage) {
      commentParts.push('Сообщение: ' + userMessage);
    }
    commentParts.push('Страница: ' + location.href);
    commentParts.push('Форма: ' + sourceLabel);
    var comments = commentParts.join('\n');
    var fields = {
      TITLE: 'Заявка с сайта: ' + sourceLabel,
      NAME: personName || 'Без имени',
      PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
      SOURCE_ID: 'WEB',
      SOURCE_DESCRIPTION: sourceLabel,
      COMMENTS: comments.replace(/\n/g, '<br>\n')
    };
    if (hasEmail) {
      fields.EMAIL = [{ VALUE: emailValue, VALUE_TYPE: 'WORK' }];
    }
    jQuery.ajax({
      url: 'https://oooagrokom.bitrix24.ru/rest/234/2ebwc1baokth23f1/crm.lead.add.json',
      type: 'POST',
      dataType: 'json',
      data: {
        fields: fields
      }
    });
}
window.sendLeadToBitrix = sendLeadToBitrix;
window.resolveLeadSource = resolveLeadSource;
  
  
  jQuery(document).ready(function () {
    // jQuery(".catlog-item").click(function () {
    //     let link = jQuery(this).find("a").attr("href");
    //     if (link) {
    //         window.location.href = link;
    //     }
    // });

    // jQuery(".catlog-item").each(function() {
    //     // Получаем ссылку из элемента <a> внутри .catlog-item
    //     let link = jQuery(this).find("a").attr("href");
        
    //     if (link) {
    //         // Оборачиваем весь блок в <a> с соответствующим href и target="_blank"
    //         jQuery(this).wrapInner('<a href="' + link + '" target="_blank" />');
    //     }
    // });

    // // Чтобы ссылки внутри блока работали корректно и не срабатывал клик на блок
    // jQuery(".catlog-item a").click(function (e) {
    //     e.stopPropagation();
    // });
    // function loadVideo() {
    //     if (jQuery(window).width() > 767) { // Показываем видео только на устройствах больше мобильных
    //         var video = jQuery('<video autoplay loop muted>')
    //             .attr('src', '/top.mp4')
    //             .append('<source src="/top.mp4" type="video/mp4">');

    //             jQuery('.video-background').append(video);
    //     } else {
    //         jQuery('.video-background').hide(); // Скрываем блок на мобильных
    //     }
    // }

    // jQuery(window).on('load', loadVideo);
});
jQuery(document).ready(function() {
    
    // Обработчик клика по вкладкам
    jQuery('.main-catalog-tabs').on('click', '.tab-link', function(e) {
        e.preventDefault(); // Отменяем переход по ссылке
        
        // Получаем ID нужной вкладки
        var tabId = jQuery(this).data('tab');
        
        // Убираем класс active у всех вкладок
        jQuery('.main-catalog-tabs .tab-link').removeClass('active');
        
        // Добавляем класс active текущей вкладке
        jQuery(this).addClass('active');
        
        // Скрываем все блоки контента
        jQuery('.catlog-items-ready.new-main-catalog').removeClass('active');
        
        // Показываем нужный блок контента
        jQuery('.catlog-items-ready.new-main-catalog[data-tab-content="' + tabId + '"]').addClass('active');
    });
    
    // Автоматическое переключение при загрузке (если нужно)
    // Ищем активную вкладку и показываем соответствующий контент
    var activeTab = jQuery('.main-catalog-tabs .tab-link.active').data('tab');
    if (activeTab) {
        jQuery('.catlog-items-ready.new-main-catalog[data-tab-content="' + activeTab + '"]').addClass('active');
    } else {
        // Если нет активной вкладки, делаем первую активной
        jQuery('.main-catalog-tabs .tab-link:first').addClass('active');
        var firstTabId = jQuery('.main-catalog-tabs .tab-link:first').data('tab');
        jQuery('.catlog-items-ready.new-main-catalog[data-tab-content="' + firstTabId + '"]').addClass('active');
    }

    var LOAD_MORE_STEP = 381;
    var LOAD_MORE_MAX = 5;

    function visLog(step, message, data) {
        if (typeof window.visDebugLog === 'function') {
            window.visDebugLog(step, message, data);
        } else {
            console.warn('[VIS]', step + ':', message, data !== undefined ? data : '');
        }
    }

    jQuery(document).on('click', '.catalog-show-mob', function(e) {
        e.preventDefault();
        var $btn = jQuery(this);
        var $scope = $btn.closest('.catalog, .view, section.bg1, .container_w');
        var $catalogRoot = $btn.closest('.catalog');
        if (!$catalogRoot.length) {
            $catalogRoot = $scope.find('.catalog').first();
        }

        visLog('click', '.catalog-show-mob', {
            scope: $scope.attr('class'),
            catalogRoot: $catalogRoot.length,
            pagersInScope: $scope.find('[data-drupal-views-infinite-scroll-pager]').length,
            nextLinks: $scope.find('[data-drupal-views-infinite-scroll-pager] a[rel=next], .js-pager__items a[rel=next]').length
        });

        // Реальный infinite scroll — только если есть ссылка pager.
        // Ложный content-wrapper без pager (katalog_gotovyh_domov) НЕ означает конец списка.
        var $pagerLink = $scope.find('[data-drupal-views-infinite-scroll-pager] a[rel="next"], .js-pager__items a[rel="next"]').first();
        if (!$pagerLink.length) {
            $pagerLink = $btn.closest('.catalog-items-showmore').find('a[rel="next"]').first();
        }
        if (!$pagerLink.length) {
            $pagerLink = jQuery('[data-drupal-views-infinite-scroll-pager] a[rel="next"], .js-pager__items a[rel="next"]').first();
        }
        if ($pagerLink.length) {
            visLog('click', 'Trigger pager AJAX', {
                href: $pagerLink.attr('href'),
                text: $pagerLink.text().trim()
            });
            $pagerLink[0].click();
            return;
        }

        visLog('click', 'No pager link — static expand');

        if (!$catalogRoot.length) {
            visLog('click', 'FAIL: no .catalog root');
            return;
        }

        var $items = $catalogRoot.find('.catalog-items').first();
        if (!$items.length) {
            visLog('click', 'FAIL: no .catalog-items');
            return;
        }

        var clicks = ($items.data('loadMoreClicks') || 0) + 1;
        $items.data('loadMoreClicks', clicks);

        var $cont = $items.closest('.catalog-items-cont');
        if ($cont.length) {
            $cont[0].style.setProperty('overflow', 'visible', 'important');
        }

        $items[0].style.setProperty('transform', 'none', 'important');
        $items[0].style.setProperty('display', 'flex', 'important');
        $items[0].style.setProperty('flex-direction', 'column', 'important');
        $items[0].style.setProperty('overflow', 'visible', 'important');

        var $hiddenItems = $items.find('.catlog-item').filter(function() {
            return window.getComputedStyle(this).display === 'none';
        });
        $hiddenItems.slice(0, 2).each(function() {
            this.style.setProperty('display', 'block', 'important');
        });

        var currentHeight = parseInt(window.getComputedStyle($items[0]).height, 10);
        if (isNaN(currentHeight) || currentHeight <= 0) {
            currentHeight = LOAD_MORE_STEP;
        }
        var nextHeight = currentHeight + LOAD_MORE_STEP;
        $items[0].style.setProperty('height', nextHeight + 'px', 'important');

        var stillHidden = $items.find('.catlog-item').filter(function() {
            return window.getComputedStyle(this).display === 'none';
        }).length;
        var fullyExpanded = stillHidden === 0 && $items[0].scrollHeight <= nextHeight + 4;

        if (clicks >= LOAD_MORE_MAX || fullyExpanded) {
            $items[0].style.setProperty('height', 'auto', 'important');
            $btn.hide();
        }

        visLog('click', 'Static expand done', {
            clicks: clicks,
            visibleItems: $items.find('.catlog-item:visible').length,
            hiddenItems: stillHidden,
            height: $items.css('height'),
            scrollHeight: $items[0].scrollHeight
        });
    });

    jQuery(document).ajaxComplete(function(event, xhr, settings) {
        if (!settings.url || settings.url.indexOf('views/ajax') === -1) {
            return;
        }

        jQuery('.views-infinite-scroll-content-wrapper').each(function() {
            var $wrapper = jQuery(this);
            var $items = $wrapper.closest('.catalog-items');
            var $cont = $wrapper.closest('.catalog-items-cont');

            if ($items.length) {
                $items.css({
                    height: 'auto',
                    transform: 'none',
                    flexWrap: 'wrap',
                    display: 'flex'
                });
            }
            if ($cont.length) {
                $cont.css('overflow', 'visible');
            }
        });
    });
});
// $ только как аргумент ready — в Drupal noConflict глобального $ нет
jQuery(document).ready(function ($) {
    function initGptTimeLayer() {
        if ($('#gpt_window').length && $('.top_info').length) {
            $('.top_info').prependTo('#gpt_window');
            $('.top_info').css('display', 'flex');
        }

        function getCurrentTime() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();

            return {
                time: `${hours}:${minutes}`,
                date: `${day}.${month}.${year}`
            };
        }

        function addTimeLayer() {
            if (!$('#gpt').length) {
                return;
            }
            const current = getCurrentTime();
            $('#gpt').append(
                `<div class="time-layer"><span class="time-value">${current.time}</span></div>`
            );
        }

        addTimeLayer();

        setInterval(function () {
            $('.time-layer .time-value').text(getCurrentTime().time);
        }, 1000);
    }

    if (document.readyState === 'complete') {
        initGptTimeLayer();
    } else {
        $(window).on('load', initGptTimeLayer);
    }
    // jQuery('.atelier-seven__left-item').on('click', function() {
    //     // Удаляем класс active у всех вкладок и статей
    //     jQuery('.atelier-seven__left-item').removeClass('active');
    //     jQuery('.atelier-cat-slider__tab').removeClass('active');
    //
    //     // Добавляем класс active к текущему элементу
    //     jQuery(this).addClass('active');
    //
    //     // Определяем индекс выбранного элемента
    //     let index = jQuery(this).index();
    //
    //     // Добавляем active к соответствующей статье
    //     jQuery('.atelier-cat-slider__tab').eq(index).addClass('active');
    // });
    jQuery(document).on('click', '.field--name-field-image .toc-title', function() {
        // Находим ближайший контейнер toc и работаем с его элементами
        var $toc = jQuery(this).closest('.toc');
        
        // Переключаем видимость содержимого
        $toc.find('.toc-links').toggleClass('visible');
        
        // Переключаем класс для иконки
        jQuery(this).toggleClass('active');
      });
      jQuery(document).on('click', '.mobiles-blog-cats .blogs-cats-title', function() {
        
        // Находим ближайший контейнер toc и работаем с его элементами
        var $toc = jQuery(this).closest('.blogs-cats');
        
        // Переключаем видимость содержимого
        $toc.find('.blogs-cats-items').toggleClass('visible');
        
        // Переключаем класс для иконки
        jQuery(this).toggleClass('active');
      });
    jQuery('.popup-close').click(function () {
        hidePopup();
    });

    jQuery('.shadow').click(function (e) {
        if (jQuery(e.target).hasClass('shadow')) {
            hidePopup();
        }
    });

    jQuery('#online .catalog-more a').click(function (e) {
        e.preventDefault();
        e.stopPropagation();

        var name = jQuery('#online input[name="name"]').val();
        var email = jQuery('#online input[name="email"]').val();
        var phone = jQuery('#online input[name="phone"]').val();
        var confirmation = jQuery('#confirmation').prop('checked');
        var valid = true;

        if (name.length == 0) {
            jQuery('#online input[name="name"]').parent().find('.online-notice').text('Вы не заполнили обязательное поле').css('visibility', 'visible');
            valid = false;
        } else {
            jQuery('#online input[name="name"]').parent().find('.online-notice').text('').css('visibility', 'hidden');
        }
//		if (email.length == 0 || !emailIsValid(email)) {
// 		if (!emailIsValid(email)) {
// 		  jQuery('#online input[name="email"]').parent().find('.online-notice').text('Возможно, при вводе данных была допущена ошибка').css('visibility', 'visible');
// 			valid = false;
// 		} else {
// 		  jQuery('#online input[name="email"]').parent().find('.online-notice').text('').css('visibility', 'hidden');
// 		}

        if (phone.length != 16) {
            valid = false;
            jQuery('#online input[name="phone"]').parent().find('.online-notice').text('Возможно, при вводе данных была допущена ошибка').css('visibility', 'visible');
        } else {
            jQuery('#online input[name="phone"]').parent().find('.online-notice').text('').css('visibility', 'hidden');
        }

        if (!valid) {
            return false;
        }

        var leadSource = resolveLeadSource(jQuery('#online'), jQuery('#online input[name="source"]').val(), name);
        var dataForRequest = {
            'name': name,
            'email': email,
            'phone': phone,
            'source': leadSource
        }

        sendLeadToBitrix(name, email, phone, '', leadSource, jQuery('#online'));

        jQuery.ajax({
            type: "POST",
            url: "/form-submit/common-form/",
            data: dataForRequest,
            success: function (msg) {
                hidePopup();
                showPopup('success', false);
                setTimeout(hidePopup, 3000);
                /*} else {
                  hidePopup();
                  showPopup('error', false);
                  setTimeout(hidePopup, 3000);
                }*/
            }
        });

        var ct_data = {
            'fio': name,
            'email': email,
            'phoneNumber': phone,
            'source': jQuery('#form-source').val(),
            requestUrl: location.href,
            sessionId: window.ct('calltracking_params','9spnkrv9').sessionId
        };
        console.log(ct_data);
        jQuery.ajax({
            url: 'https://api.calltouch.ru/calls-service/RestAPI/requests/59663/register/',
            dataType: 'json',
            type: 'POST',
            data: ct_data
        });

    });
    
    if (jQuery('.article-page').length) {
        var $contentBlock = jQuery('.article-page');
    
        // Создаем блок для оглавления
        var $toc = jQuery('<div class="toc"><h2 class="toc-title">Содержание<svg class="toc-icon" width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.09375 9.37756L8.0434 1.62238L15.001 9.37756" stroke="#917357" stroke-width="2" stroke-miterlimit="10"/></svg></h2><div class="toc-links"><ul></ul></div></div>');
    
        // Находим все заголовки H2 в блоке и добавляем якоря
        $contentBlock.find('h2').each(function (index) {
          var $heading = jQuery(this);
          var anchor = 'toc-anchor-' + index;
          $heading.attr('id', anchor);
    
          // Создаем элемент оглавления и добавляем ссылку на якорь
          var $tocItem = jQuery('<li><a href="#' + anchor + '">' + $heading.text() + '</a></li>');
          $toc.find('ul').append($tocItem);
        });
    
        // Вставляем блок оглавления в страницу
        jQuery('.field--name-field-image').append($toc);
    }
    jQuery('#yana-send').click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        var form = jQuery(this).closest('form');
        var checkbox = form.find('input[type="checkbox"]');
        var phone = form.find('input.phone-field-mask').val();
        var valid = true;
       
        if (phone.length != 16) {
            valid = false;
            console.log(phone.length);
            // jQuery('.popup-phone1').hide();
            form.find('input.phone-field-mask').parent().next('.online-notice').text('Возможно, при вводе данных была допущена ошибка').css('visibility', 'visible');
        } else {
            form.find('input.phone-field-mask').parent().next('.online-notice').text('').css('visibility', 'hidden');
        }
        if (!checkbox.is(':checked')) {
            valid = false;
            console.log(2);
            checkbox.parent().next('.online-notice').text('Подтвердите согласие с обработкой персональных данных').css('visibility', 'visible');
        } else {
            checkbox.parent().next('.online-notice').text('').css('visibility', 'hidden');
        }
        console.log(valid);
        if (!valid) {

            return false;
        }

        var leadSource = resolveLeadSource(form, form.find('input[name="source"]').val() || 'Получить консультацию', '');
        var dataForRequest = {
            'name': ' ',
            'email': ' ',
            'phone': phone,
            'source': leadSource
        }
        sendLeadToBitrix('', ' ', phone, '', leadSource, form);

        jQuery.ajax({
            type: "POST",
            url: "/form-submit/common-form/",
            data: dataForRequest,
            success: function (msg) {

                form.find('.popup-success').show();
                var _this = this;
                setTimeout(function() {
                    jQuery('.popup-success')
                        .hide();
                }.bind(this), 3000);
                
            }
        });

    });
    function getLv2LeadNotice(form, type) {
        if (type === 'name' || type === 'phone') {
            var input = type === 'name'
                ? form.find('input[name="name"]')
                : form.find('input.phone-field-mask');
            // CTA: .online-notice рядом с .cta__field внутри .cta__field-wrap
            var fieldWrap = input.closest('.cta__field-wrap');
            if (fieldWrap.length) {
                return fieldWrap.find('.online-notice').first();
            }
            // Модалка: .online-notice внутри .bp-modal__field
            var modalField = input.closest('.bp-modal__field');
            if (modalField.length) {
                return modalField.find('.online-notice').first();
            }
            var field = input.closest('.cta__field');
            if (field.length) {
                return field.next('.online-notice');
            }
            return input.next('.online-notice');
        }
        return form.find('input[type="checkbox"]').closest('.cta__agree, .bp-modal__agree').next('.online-notice');
    }

    function submitLv2LeadForm(form) {
        var checkbox = form.find('input[type="checkbox"]');
        var nameInput = form.find('input[name="name"]');
        var phoneInput = form.find('input.phone-field-mask');
        var name = jQuery.trim(nameInput.val());
        var phone = phoneInput.val();
        var valid = true;

        if (name.length === 0) {
            valid = false;
            getLv2LeadNotice(form, 'name').text('Вы не заполнили обязательное поле').css('visibility', 'visible');
        } else {
            getLv2LeadNotice(form, 'name').text('').css('visibility', 'hidden');
        }

        if (phone.length != 16) {
            valid = false;
            getLv2LeadNotice(form, 'phone').text('Возможно, при вводе данных была допущена ошибка').css('visibility', 'visible');
        } else {
            getLv2LeadNotice(form, 'phone').text('').css('visibility', 'hidden');
        }

        if (!checkbox.is(':checked')) {
            valid = false;
            getLv2LeadNotice(form, 'checkbox').text('Подтвердите согласие с обработкой персональных данных').css('visibility', 'visible');
        } else {
            getLv2LeadNotice(form, 'checkbox').text('').css('visibility', 'hidden');
        }

        if (!valid) {
            return false;
        }

        var leadSource = resolveLeadSource(form, form.find('input[name="source"]').val(), name);
        var dataForRequest = {
            'name': name,
            'email': ' ',
            'phone': phone,
            'source': leadSource
        };

        sendLeadToBitrix(name, ' ', phone, '', leadSource, form);

        jQuery.ajax({
            type: "POST",
            url: "/form-submit/common-form/",
            data: dataForRequest,
            success: function () {
                form.find('.popup-success').show();
                setTimeout(function () {
                    form.find('.popup-success').hide();
                    if (form.closest('#lv2TourModal').length) {
                        form[0].reset();
                        if (typeof window.lv2CloseTourModal === 'function') {
                            window.lv2CloseTourModal();
                        }
                    }
                }, 3000);
            }
        });

        return true;
    }

    jQuery('#lv2-cta-send, #lv2-tour-send').click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        submitLv2LeadForm(jQuery(this).closest('form'));
    });
    jQuery('.lead-form-input-btn').click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        var form = jQuery(this).closest('form');
        var checkbox = form.find('input[type="checkbox"]');
        var name = jQuery('.lead-form-input-name').val();
        var email = '';
        var phone = jQuery('.lead-form-input-number').val();
        var confirmation = jQuery('#confirmation').prop('checked');
        var valid = true;

        if (name.length == 0) {
            jQuery('.lead-form-input-name').next('.online-notice').text('Вы не заполнили обязательное поле').css('visibility', 'visible');
            valid = false;
        } else {
            jQuery('.lead-form-input-name').next('.online-notice').text('').css('visibility', 'hidden');
        }

        if (phone.length != 16) {
            valid = false;
            jQuery('.lead-form-input-number').next('.online-notice').text('Возможно, при вводе данных была допущена ошибка').css('visibility', 'visible');
        } else {
            jQuery('.lead-form-input-number').next('.online-notice').text('').css('visibility', 'hidden');
        }

        if (!checkbox.is(':checked')) {
            valid = false;
            checkbox.parent().next('.online-notice').text('Подтвердите согласие с обработкой персональных данных').css('visibility', 'visible');
        } else {
            checkbox.parent().next('.online-notice').text('').css('visibility', 'hidden');
        }

        if (!valid) {

            return false;
        }

        var leadSource = resolveLeadSource(form, form.find('input[name="source"]').val(), name);
        var dataForRequest = {
            'name': name,
            'email': email,
            'phone': phone,
            'source': leadSource
        }

        sendLeadToBitrix(name, email, phone, '', leadSource, form);

        jQuery.ajax({
            type: "POST",
            url: "/form-submit/common-form/",
            data: dataForRequest,
            success: function (msg) {

                form.find('.popup-success').show();
                var _this = this;
                setTimeout(function() {
                    jQuery('.popup-success')
                        .hide();
                }.bind(this), 3000);
                // hidePopup();
                // showPopup('success', false);
                // setTimeout(hidePopup, 3000);
                /*} else {
                  hidePopup();
                  showPopup('error', false);
                  setTimeout(hidePopup, 3000);
                }*/
            }
        });

        // var ct_data = {
        //     'fio': name,
        //     'email': email,
        //     'phoneNumber': phone,
        //     'source': jQuery('#form-source').val(),
        //     requestUrl: location.href,
        //     sessionId: window.ct('calltracking_params','9spnkrv9').sessionId
        // };
        // console.log(ct_data);
        // jQuery.ajax({
        //     url: 'https://api.calltouch.ru/calls-service/RestAPI/requests/59663/register/',
        //     dataType: 'json',
        //     type: 'POST',
        //     data: ct_data
        // });

    });


    jQuery(document).on('click', '.popup-btn', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var form = jQuery(this).closest('.popup-body');
        if (!form.length) {
            form = jQuery(this).closest('.popup, .fancybox__content, .fancybox-content');
        }

        var name = jQuery.trim(form.find('input[name="name"]').val() || '');
        if(form.find('input[name="email"]').val()) {
            var email = form.find('input[name="email"]').val().trim();
        } else {
            var email = '';
        }
        var phone = jQuery.trim(form.find('input[name="phone"]').val() || '');
        var mess = jQuery.trim(
            form.find('textarea[name="mess"]').val()
            || form.find('textarea').val()
            || ''
        );
        
        var checkbox = form.find('input[type="checkbox"]');
// console.log(checkbox.is(':checked'));
        var confirmation = jQuery('#confirmation').prop('checked');
        var valid = true;

        // Проверка имени
        if (name.length === 0) {
            form.find('input[name="name"]')
                .addClass('error-field')
                .next('.online-notice')
                .text('Вы не заполнили обязательное поле')
                .css('visibility', 'visible');
            valid = false;
        } else {
            form.find('input[name="name"]')
                .removeClass('error-field')
                .next('.online-notice')
                .text('')
                .css('visibility', 'hidden');
        }

        // Проверка телефона (длина 16 символов — маска?)
        if (phone.length !== 16) {
            form.find('input[name="phone"]')
                .addClass('error-field')
                .next('.online-notice')
                .text('Возможно, при вводе данных была допущена ошибка')
                .css('visibility', 'visible');
            valid = false;
        } else {
            form.find('input[name="phone"]')
                .removeClass('error-field')
                .next('.online-notice')
                .text('')
                .css('visibility', 'hidden');
        }

        if (!checkbox.is(':checked')) {
            console.log('notvalid');
            valid = false;
            checkbox.parent().next('.online-notice').text('Подтвердите согласие с обработкой персональных данных').css('visibility', 'visible');
        } else {
            console.log('valid');
            checkbox.parent().next('.online-notice').text('').css('visibility', 'hidden');
        }
        if (!valid) {

            return false;
        }

        var leadSource = resolveLeadSource(form, form.find('input[name="source"]').val(), name);
        var dataForRequest = {
            'name': name,
            'email': email,
            'phone': phone,
            'message': mess,
            'source': leadSource
        }

        sendLeadToBitrix(name, email, phone, mess, leadSource, form);

        jQuery.ajax({
            type: "POST",
            url: "/form-submit/common-form/",
            data: dataForRequest,
            success: function (msg) {
                // hidePopup();
                // showPopup('success', false);
                // alert(1);
                form.find('.popup-success').show();
                var _this = this;
                setTimeout(function() {
                    jQuery('.popup-success')
                        .hide();
                }.bind(this), 3000);

                
                /*} else {
                  hidePopup();
                  showPopup('error', false);
                  setTimeout(hidePopup, 3000);
                }*/
            }
        });


    });


    jQuery('.lead-form-input-number').mask("+7(999) 999-9999");
    jQuery('.popup-phone1').mask("+7(999) 999-9999");
    // Колесо фортуны (#phoneInput / #wheelFortunePhone) форматирует номер само —
    // глобальная маска +7 даёт 11 цифр и ломает его валидацию «ровно 10».
    jQuery('input[name=phone]').not('#phoneInput, #wheelFortunePhone').mask("+7(999) 999-9999");
    // jQuery('.lead-form-input-number').mask("+7(999) 999-9999");
    jQuery('.townhouses-first-catalog-left-nav .filter').on('click', function () {
        // Убираем активный класс со всех фильтров и добавляем его на выбранный
        jQuery('.townhouses-first-catalog-left-nav .filter').removeClass('active');
        jQuery(this).addClass('active');

        // Получаем выбранный фильтр
        var filter = jQuery(this).data('filter');

        // Фильтруем элементы каталога
        jQuery('.catlog-item').each(function () {
            var category = jQuery(this).data('category');

            if (filter === 'all' || category === filter) {
                jQuery(this).show(); // Показываем элемент
            } else {
                jQuery(this).hide(); // Скрываем элемент
            }
        });
    });

    jQuery('.town-mob-menu-item .filter').on('click', function () {
        // Убираем активный класс со всех фильтров и добавляем его на выбранный
        jQuery('.townhouses-first-catalog-left-nav .filter').removeClass('active');
        jQuery(this).addClass('active');

        // Получаем выбранный фильтр
        var filter = jQuery(this).data('filter');

        // Фильтруем элементы каталога
        jQuery('.catlog-item').each(function () {
            var category = jQuery(this).data('category');

            if (filter === 'all' || category === filter) {
                jQuery(this).show(); // Показываем элемент
            } else {
                jQuery(this).hide(); // Скрываем элемент
            }
        });
    });
    const $container = jQuery('.townhouses-first-catalog-left-btn');
    const $button = jQuery('.townhouses-first-catalog-left-btn a');

    jQuery(window).on('scroll', function () {
        if (document.querySelectorAll('.townhouses-first-catalog-left-btn').length > 0) {

            const containerOffset = $container.offset().top; // Верх контейнера
            const containerHeight = $container.outerHeight(); // Высота контейнера
            const windowScroll = jQuery(window).scrollTop(); // Текущая прокрутка страницы
            const buttonHeight = $button.outerHeight(); // Высота кнопки
            console.log(containerOffset + ' - ' + containerHeight + ' - ' + windowScroll + ' - ' + buttonHeight);
            // Верхняя граница
            if (windowScroll < containerOffset) {
                $button.css({
                    position: 'absolute',
                    top: '60px',
                });
            }
            // Нижняя граница
            else if (windowScroll > containerOffset + containerHeight - buttonHeight) {
                $button.css({
                    position: 'absolute',
                    top: `60px`,
                });
            }
            // Фиксируем кнопку
            else {
                $button.css({
                    position: 'fixed',
                    top: '60px',
                });
            }
        }

    });
    jQuery('#mortgage-form input').on('input', function() {
        mortgage();

    });
    jQuery('#mortgage-form input').on('change', function() {
        mortgage();

    });
    jQuery('.calc-item-btn').on('click', function(e) {
        e.preventDefault();
        mortgage();

    });
});




if (jQuery('.swiper-container-project').length) {
    var thumbCnt = jQuery('.swiper-container-thumbs .swiper-slide').length;
    var loop = true;
    var centeredSlides = false;
    if (thumbCnt <= 5) {
        loop = false;
        centeredSlides = false;
    }
    if (thumbCnt > 1) {
        const thumbsContainer = document.querySelector('.swiper-container-thumbs');
        const isMainThumbs = thumbsContainer.classList.contains('swiper-container-thumbs-main');
        
        var swiperCT = new Swiper(".swiper-container-thumbs", {
            //loop: loop,
            direction: isMainThumbs ? 'horizontal' : 'vertical',
            spaceBetween: 30,
            slidesPerView: isMainThumbs ? 1 : 5,
            // freeMode: true,
            watchSlidesVisibility: true,
            watchSlidesProgress: true,
            grid: isMainThumbs ? {
                rows: 2, // 👉 Две строки
                fill: 'row', // 👉 Заполнять по строкам
            } : undefined, // если не mainThumbs - без сетки
            // centeredSlides: centeredSlides,
            breakpoints: {
                // when window width is >= 320px
                320: {
                    direction: 'horizontal',
                    slidesPerView: 4,
                    spaceBetween: 5,
                },
                768: {
                    direction: 'horizontal',
                    slidesPerView: isMainThumbs ? 4 : 5,
                    spaceBetween: 5,
                },
                1200: {
                    direction: isMainThumbs ? 'horizontal' : 'vertical',
                    slidesPerView: isMainThumbs ? 4 : 5,
                    spaceBetween: 25,
                    //centeredSlides: isMainThumbs ? true : false,
                },
            }
        });
    }
    if (thumbCnt > 1) {
        var swiperCP = new Swiper(".swiper-container-project", {
            loop: loop,
            spaceBetween: 10,
            slidesPerView: 1,
            navigation: {
                nextEl: ".swiper-container-project .swiper-button-next",
                prevEl: ".swiper-container-project .swiper-button-prev",
            },
            thumbs: {
                swiper: swiperCT,
            },
            breakpoints: {
                // when window width is >= 320px
                320: {
                    pagination: {
                        el: '.swiper-container-project .swiper-pagination',
                        type: 'bullets',
                        clickable: true
                    }
                },
                768: {
                    pagination: false
                },
            }
        });
    } else {
        var swiperCP = new Swiper(".swiper-container-project", {
            loop: loop,
            spaceBetween: 10,
            slidesPerView: 1,
            navigation: {
                nextEl: ".swiper-button-prev",
                prevEl: ".swiper-button-next",
            },
            breakpoints: {
                // when window width is >= 320px
                320: {
                    pagination: {
                        el: '.swiper-container-project .swiper-pagination',
                        type: 'bullets',
                        clickable: true
                    }
                },
                768: {
                    pagination: false
                },
            }
        });
    }



}

if (jQuery('.swiper-container-rezident').length) {
    var swiperCP = new Swiper(".swiper-container-rezident", {
        loop: loop,
        spaceBetween: 10,
        slidesPerView: 1,
        navigation: {
            nextEl: ".swiper-container-rezident .swiper-button-prev",
            prevEl: ".swiper-container-rezident .swiper-button-next",
        },
        breakpoints: {
            // when window width is >= 320px
            320: {
                pagination: {
                    el: '.swiper-container-rezident .swiper-pagination',
                    type: 'bullets',
                    clickable: true
                }
            },
            768: {
                pagination: false
            },
        }
    });



}









document.addEventListener('DOMContentLoaded', function () {
    Fancybox.bind("[data-fancybox]", {
        // Your custom options
    });
    
    if(!document.getElementById('edit-type')) {
        return
    }
    const selectElement = document.getElementById('edit-type');
    const filterContainer = document.getElementById('dynamic-filter');
    const form = document.getElementById('views-exposed-form-gotovye-doma-block-1');
    const langMatch = (document.documentElement.getAttribute('lang') || '')
      || ((document.body.className.match(/lang-(\w+)/) || [])[1] || 'ru');
    const lang = String(langMatch).slice(0, 2);
    const filterLabels = {
        ru: { All: 'Все дома', 2: 'Готовые дома', 3: 'Строящиеся дома', 4: 'Участки с подрядом' },
        en: { All: 'All homes', 2: 'Ready homes', 3: 'Homes under construction', 4: 'Plots with construction' },
        ar: { All: 'كل المنازل', 2: 'منازل جاهزة', 3: 'منازل قيد الإنشاء', 4: 'قطع مع البناء' },
    };
    const labels = filterLabels[lang] || filterLabels.ru;

    // Создаем элементы списка <li> из опций <select>
    Array.from(selectElement.options).forEach(option => {
        const listItem = document.createElement('div');
        const anchor = document.createElement('a');
    
        anchor.href = '#';
        
        // Преобразуем текст вариантов
        const text = option.text.trim();
        if (text.includes('Участок') || text === 'Plot' || option.value === '4') {
            return;
        }
        anchor.textContent = labels[option.value] || text
            .replaceAll('Участок', labels[4] || 'Участки с подрядом')
            .replaceAll('Plot', labels[4] || 'Plots with construction')
            .replaceAll('Готовый дом', labels[2] || 'Готовые дома')
            .replaceAll('Готовые дома', labels[2] || 'Готовые дома')
            .replaceAll('Строящийся дом', labels[3] || 'Строящиеся дома')
            .replaceAll('Строящиеся дома', labels[3] || 'Строящиеся дома')
            .replaceAll('- Любой -', labels.All || 'Все дома')
            .replaceAll('- Any -', labels.All || 'All homes');
    
        anchor.classList.add('filter-option');
        anchor.dataset.value = option.value;
        
        if (option.selected) {
            listItem.classList.add('active');
        }
    
        listItem.appendChild(anchor);
        filterContainer.appendChild(listItem);
    });
    
    // Добавляем два новых пункта вручную
    // const additionalOptions = [
    //     { text: 'По своему проекту', value: '/arhitekturnoe-atele' },
    //     { text: 'VIP-резиденции', value: '/rezidents' }
    // ];
    
    // additionalOptions.forEach(item => {
    //     const listItem = document.createElement('div');
    //     const anchor = document.createElement('a');
    
    //     anchor.href = item.value;
    //     anchor.textContent = item.text;
    //     // anchor.classList.add('filter-option');
    //     // anchor.dataset.value = item.value;
    
    //     listItem.appendChild(anchor);
    //     filterContainer.appendChild(listItem);
    // });
    

    // Обработчик клика по пунктам списка
    filterContainer.addEventListener('click', function (e) {
        e.preventDefault();
        if (e.target.tagName === 'A') {
            // Устанавливаем активный элемент и обновляем значение <select>
            filterContainer.querySelectorAll('a').forEach(link => link.classList.remove('active'));
            e.target.classList.add('active');

            selectElement.value = e.target.dataset.value; // Обновляем значение <select>
            form.submit(); // Отправляем форму
        }
    });
});
document.querySelectorAll('.catlog-items-ready').forEach(catalogReady => {
    const itemsContainer = catalogReady.querySelector('.catalog-items');
    const items = catalogReady.querySelectorAll('.catlog-item');
    const prevBtn = catalogReady.querySelector('.catalog-top-block-btns .prev');
    const nextBtn = catalogReady.querySelector('.catalog-top-block-btns .next');
    if (!itemsContainer || !nextBtn || !prevBtn || !items.length) {
        return;
    }

    const topBlock = catalogReady.querySelector('.catalog-top-block');
    if (topBlock && window.getComputedStyle(topBlock).display === 'none') {
        return;
    }
    if (window.innerWidth <= 730) {
        return;
    }

    let index = 0;

    // Определяем ширину одного элемента и общее количество элементов
    const itemWidth = items[0].clientWidth + 20; // Учтите отступы, если они есть
    const totalItems = items.length;

    // Устанавливаем начальное положение
    itemsContainer.style.transform = `translateX(0px)`;

    // Рассчитываем максимальное значение для translateX
    const maxTranslateX = (totalItems - 1) * itemWidth;

    // Обновляем кнопки
    function updateButtons() {
        // Кнопка "назад" отключается, если индекс равен 0
        if (index <= 0) {
            prevBtn.disabled = true;
            prevBtn.classList.remove('active-btn-catalog');
        } else {
            prevBtn.disabled = false;
            prevBtn.classList.add('active-btn-catalog');
        }

        // Кнопка "вперед" отключается, если индекс равен максимальному значению
        if (index >= totalItems - 1) {
            nextBtn.disabled = true;
            nextBtn.classList.remove('active-btn-catalog');
        } else {
            nextBtn.disabled = false;
            nextBtn.classList.add('active-btn-catalog');
        }
    }

    // Перемещение вперед
    function moveToNextSlide() {
        if (index < totalItems - 1) {
            index++;
            const newTranslateX = -index * itemWidth;
            // Убедитесь, что translateX не выходит за пределы
            itemsContainer.style.transform = `translateX(${Math.max(newTranslateX, -maxTranslateX)}px)`;
            updateButtons();
        }
    }

    // Перемещение назад
    function moveToPrevSlide() {
        if (index > 0) {
            index--;
            const newTranslateX = -index * itemWidth;
            // Убедитесь, что translateX не выходит за пределы
            itemsContainer.style.transform = `translateX(${Math.max(newTranslateX, -maxTranslateX)}px)`;
            updateButtons();
        }
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', moveToNextSlide);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', moveToPrevSlide);
    }

    // Обновляем состояние кнопок при начальной загрузке
    updateButtons();
});
document.addEventListener('DOMContentLoaded', function () {
    if(!document.getElementById('edit-title--2') && !document.getElementById('edit-title')) {
        return
    }
    if(!document.getElementById('edit-title--2')) {
        var selectElement = document.getElementById('edit-title');
    } else {
        var selectElement = document.getElementById('edit-title--2');

    }
    const filterContainer = document.getElementById('dynamic-filter');
    const form = document.getElementById('views-exposed-form-gallery-gallery');

    // Создаем элементы списка <li> из опций <select>
    Array.from(selectElement.options).forEach(option => {

        const listItem = document.createElement('li');
        const anchor = document.createElement('a');

        anchor.href = '#';
        const text = option.text.trim(); // Убираем лишние пробелы
        console.log(text);
        anchor.textContent = text.includes('- Любой -') ? text.replaceAll('- Любой -', 'Все фото') : text;

        anchor.classList.add('filter-option');
        anchor.dataset.value = option.value;
        if (option.selected) {
            anchor.classList.add('active');
        }
        listItem.appendChild(anchor);
        filterContainer.appendChild(listItem);
    });

    // Обработчик клика по пунктам списка
    filterContainer.addEventListener('click', function (e) {
        e.preventDefault();
        if (e.target.tagName === 'A') {
            // Устанавливаем активный элемент и обновляем значение <select>
            filterContainer.querySelectorAll('a').forEach(link => link.classList.remove('active'));
            e.target.classList.add('active');

            selectElement.value = e.target.dataset.value; // Обновляем значение <select>
            form.submit(); // Отправляем форму
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('title')) {
        const defaultOption = filterContainer.querySelector('a[data-value="1"]');
        if (defaultOption) {
            defaultOption.click();
        }
    }

});

document.addEventListener("DOMContentLoaded", function() {
// Базовые углы

    // const baseAngles = [147, 160, 180, 200, 213, 240];
    const defaultAngle = 100; // Угол по умолчанию для неуказанных точек

    const radius = 500; // Радиус окружности
    const circ = document.querySelector('.header-slider-circ');
    const arrowUp = document.getElementById('arrowUp');
    const arrowDown = document.getElementById('arrowDown');
    // const imagesContainer = document.getElementById('images-container');
    // alert(jQuery(window).width());
    if (jQuery(window).width() > 767) { // Показываем видео только на устройствах больше мобильных
        // alert(1);
        var imagesContainer = document.getElementById('images-container');
        var baseAngles = [147, 160, 180, 200, 213, 240];
    } else {
        // alert(2);
        // alert(768);
        var baseAngles = [147];
        var imagesContainer = document.getElementById('images-container-mobile');
    }
    
    if(!imagesContainer) {
        return;
    }
    const images = imagesContainer.querySelectorAll('img'); // Получаем все изображения
    // console.log(images);
    const totalDots = images.length; // Общее количество точек равно количеству изображений
    const titleElement = document.querySelector('.header-slider-prev-title'); // Заголовок
    const dotsMobContainer = document.querySelector('.header-slider-dots-mob'); // Контейнер для точек моб
    let currentIndex = 0; // Индекс текущего слайда

    // Создаем массив углов, заполняя его значениями по умолчанию, если необходимо
    const angles = [
        ...baseAngles,
        ...Array(totalDots - baseAngles.length).fill(defaultAngle)
    ];

function createDots() {
    const totalImages = images.length;

    // Массив для хранения индексов изображений в нужном порядке
    const orderedIndices = [
        totalImages - 2, // Предпоследнее изображение
        totalImages - 1, // Последнее изображение
        ...Array.from({ length: totalImages - 2 }, (_, i) => i) // Остальные изображения с начала
    ];

    // Создаем точки для всех изображений в нужном порядке
    orderedIndices.forEach((imgIndex, index) => {
        const img = images[imgIndex];
        const dot = document.createElement('div');
        dot.className = 'header-slider-dot-elem';

        // Расчет угла для точки
        const angle = angles[index % angles.length]; // Используем индекс для определения угла

        const radians = angle * (Math.PI / 180);
        const x = radius * Math.cos(radians);
        const y = radius * Math.sin(radians);

        dot.style.left = `${radius + x}px`;
        dot.style.top = `${radius - y}px`; // Корректировка знака y

        // Добавление текста из атрибута alt
        const dotText = document.createElement('div');
        dotText.className = 'slider-dot-elem-text';
        dotText.textContent = img.alt;
        dot.appendChild(dotText);

        circ.appendChild(dot);
    });

    createMobileDots(); // Создаем точки для мобильной версии
    updateDotsPosition(); // Обновляем позиции сразу после создания
}

function createMobileDots() {
    dotsMobContainer.innerHTML = ''; // Очистка контейнера

    images.forEach((img, index) => {
        const mobDot = document.createElement('div');
        mobDot.className = 'header-slider-dot-mob';
        mobDot.textContent = img.alt;

        if (index === currentIndex) {
            mobDot.classList.add('active-mob-dot');
        }

        dotsMobContainer.appendChild(mobDot);
    });
}

function updateDotsPosition() {
    const dots = document.querySelectorAll('.header-slider-dot-elem');
    dots.forEach((dot, index) => {
        // Расчет угла для точки с учетом текущего слайда
        const angle = angles[(index - currentIndex + angles.length) % angles.length];

        const radians = angle * (Math.PI / 180);
        const x = radius * Math.cos(radians);
        const y = radius * Math.sin(radians);

        dot.style.left = `${radius + x}px`;
        dot.style.top = `${radius - y}px`; // Корректировка знака y

        // Проверка, является ли эта точка активной (в позиции 180 градусов)
        if (angle === 180) {
            dot.classList.add('active-dot');
        } else {
            dot.classList.remove('active-dot');
        }

        if (angle === 240 || angle === 100) {
            dot.classList.add('active-dot-invis');
            dot.style.top = `${radius - y + 50}px`;
            if (angle === 100) {
                dot.style.top = `${radius - y - 50}px`;
            }
        } else {
            dot.classList.remove('active-dot-invis');
        }


        // Проверка, является ли эта точка активной (в позиции 180 градусов)
        if (angle === 160) {
            dot.style.left = `${radius + x - 2}px`;
            dot.style.top = `${radius - y}px`; // Корректировка знака y
        }

        if (angle === 147) {
            dot.style.left = `${radius + x}px`;
            dot.style.top = `${radius - y}px`; // Корректировка знака y
        }

        if (angle === 200) {
            dot.style.left = `${radius + x - 8}px`;
            dot.style.top = `${radius - y}px`; // Корректировка знака y
        }

        if (angle === 213) {
            dot.style.left = `${radius + x - 15}px`;
            dot.style.top = `${radius - y}px`; // Корректировка знака y
        }
    });

    updateMobileDots(); // Обновляем мобильные точки
}

function updateMobileDots() {
    const mobDots = dotsMobContainer.querySelectorAll('.header-slider-dot-mob');
    let dopWidth = 0;
    mobDots.forEach((mobDot, index) => {
        if (index === currentIndex) {
            mobDot.classList.add('active-mob-dot');
            dopWidth = mobDot.offsetWidth / 2;
        } else {
            mobDot.classList.remove('active-mob-dot');
        }
    });

    // Ширина активной точки
    const dotWidth = mobDots[0].offsetWidth;
    const halfDotWidth = dotWidth / 2;

    // Центр экрана
    const screenWidth = window.innerWidth;
    const screenCenter = screenWidth / 2;

    // Позиция активного дота относительно левого края контейнера
    console.log('dopWidth');
    console.log(dopWidth);
    const activeDot = mobDots[currentIndex];
    const activeDotCenter = activeDot.offsetLeft + halfDotWidth + dopWidth;
    console.log('halfDotWidth');
    console.log(halfDotWidth);
    console.log('activeDot');
    console.log(activeDot);
    console.log('screenCenter');
    console.log(screenCenter);
    console.log('activeDotCenter');
    console.log(activeDotCenter);

    // Расчет смещения контейнера
    const newLeft = screenCenter - activeDotCenter;
    console.log('newLeft');
    console.log(newLeft);
    dotsMobContainer.style.transform = `translateX(${newLeft}px)`;
}



// Функция для смены слайда
function changeSlide(direction) {
    if (direction === 'down') {
        currentIndex = (currentIndex + 1) % images.length; // Изменение с `+1` вместо `-1`
    } else if (direction === 'up') {
        currentIndex = (currentIndex - 1 + images.length) % images.length; // Корректировка для перехода в прошлый слайд
    }
    updateSlides();
    updateDotsPosition();
}



function updateSlides() {
    images.forEach((img, index) => {
        if (index === currentIndex) {
            img.classList.add('active');
            setTimeout(() => {
                img.style.opacity = 1;
            }, 100); // Немедленно устанавливаем прозрачность на 1
        } else {
            img.style.opacity = 0;
            setTimeout(() => {
                img.classList.remove('active');
            }, 100); // Убираем класс с задержкой 500 мс (время для анимации исчезновения)
        }
    });
    titleElement.style.opacity = 0;
    setTimeout(() => {
                titleElement.textContent = images[currentIndex].alt; // Используем alt для заголовка
            }, 100);

    setTimeout(() => {
                titleElement.style.opacity = 1;
            }, 100);
}


    // Добавление обработчиков событий для кнопок
    arrowUp.addEventListener('click', () => changeSlide('down'));
    arrowDown.addEventListener('click', () => changeSlide('up'));

    // Создание точек и установка начального состояния
    createDots();
    updateSlides();
    updateDotsPosition();




// Инициализация слайдеров






    const scrollContainer = document.querySelector('.shorts-block-items');
    const scrollContent = document.querySelector('.short-block-items-container');
    const dotsContainer = document.querySelector('.short-navigation-dots');

    if (!scrollContainer) {
        // console.warn(`Slider with class ${sliderClass} not found or has no slide items.`);
        return;
    }

    const items = scrollContent.children;
    const itemWidth = items[0].getBoundingClientRect().width;

    let isDown = false;
    let startX;
    let scrollLeft;
    let currentX = 0;

    // Функция создания точек
    function scrollBlockCreateDots() {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < items.length; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.addEventListener('click', () => scrollBlockScrollToItem(i));
            dotsContainer.appendChild(dot);
        }
        scrollBlockUpdateDotsPosition();
    }

    // Функция обновления активной точки
    function scrollBlockUpdateDotsPosition() {
        const dots = dotsContainer.children;
        const activeIndex = Math.round(Math.abs(currentX) / itemWidth);
        for (let i = 0; i < dots.length; i++) {
            dots[i].classList.remove('active');
        }
        if (dots[activeIndex]) {
            dots[activeIndex].classList.add('active');
        }
    }

    // Функция прокрутки к элементу
    function scrollBlockScrollToItem(index) {
        currentX = -index * itemWidth;
        scrollContent.style.transform = `translateX(${currentX}px)`;
        scrollBlockUpdateDotsPosition();
    }

    // События прокрутки
    scrollContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        scrollContainer.classList.add('active');
        startX = e.pageX;
        scrollLeft = currentX;
        scrollContent.style.transition = `0s`;
    });

    scrollContainer.addEventListener('mouseleave', () => {
        isDown = false;
        scrollContainer.classList.remove('active');
    });

    scrollContainer.addEventListener('mouseup', () => {
        isDown = false;
        scrollContainer.classList.remove('active');
        scrollContent.style.transition = `0.2s`;
    });

    scrollContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - startX;
        currentX = scrollLeft + x;

        // Ограничение прокрутки
        const containerRect = scrollContainer.getBoundingClientRect();
        const contentRect = scrollContent.getBoundingClientRect();

        if (currentX > 0) {
            currentX = 0; // Не позволяем прокрутке идти дальше левой границы
        }

        if (currentX < containerRect.width - contentRect.width) {
            currentX = containerRect.width - contentRect.width; // Не позволяем прокрутке идти дальше правой границы
        }


        scrollContent.style.transform = `translateX(${currentX}px)`;


        scrollBlockUpdateDotsPosition();
    });

    // Инициализация точек
    scrollBlockCreateDots();
    scrollBlockUpdateDotsPosition();






// const initialIndex = 0; // Начальный индекс слайда
// displaySlides(initialIndex);
// updateNavDots(initialIndex);








const lines = [
                {
                    selector: '.line1',
                    start: 10650,
                    end: 11250
                },
                {
                    selector: '.line2',
                    start: 9900,
                    end: 10600
                }
                // Добавьте дополнительные объекты для других линий
            ];

            const targetElement = document.getElementById('targetElement');

            lines.forEach(lineInfo => {
                const line = document.querySelector(lineInfo.selector);
                if (line) {
                    const length = line.getTotalLength();
                    line.style.strokeDasharray = length;
                    line.style.strokeDashoffset = length;
                }
            });

            window.addEventListener('scroll', () => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                const scrollPercent = Math.min(scrollTop / (documentHeight - windowHeight), 1);

                let firstLineStarted = false;

                lines.forEach(lineInfo => {
                    const line = document.querySelector(lineInfo.selector);
                    if (line) {
                        const length = line.getTotalLength();
                        const lineStart = lineInfo.start;
                        const lineEnd = lineInfo.end;
                        const animationHeight = lineEnd - lineStart;
                        const lineScrollPercent = Math.min(Math.max((scrollTop - lineStart) / animationHeight, 0), 1);
                        const offset = lineScrollPercent * length;

                        line.style.strokeDashoffset = length - offset;

                        // Проверяем начало анимации первой линии
                        if (lineInfo.selector === '.line2' && !firstLineStarted && scrollTop >= lineStart) {
                            targetElement.classList.add('active');
                            firstLineStarted = true;
                        }
                    }
                });

                // Удаляем класс, если прокрутка ушла за пределы диапазона
                if (scrollTop < lines[0].start || scrollTop > lines[0].end + 500) {
                    targetElement.classList.remove('active');
                }
            });
















document.addEventListener('scroll', function() {
    // alert(1);
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Массив с параметрами для каждой линии
    const lines = [
        {
            selector: '.section-anim-line', // Селектор первой линии
            start: 0, // Начало прокрутки для первой линии
            end: 800 // Конец прокрутки для первой линии
        },
        {
            selector: '.section-anim-line2', // Селектор второй линии
            start: 4100, // Начало прокрутки для второй линии
            end: 4600 // Конец прокрутки для второй линии
        },
        {
            selector: '.section-anim-line3', // Селектор второй линии
            start: 9300, // Начало прокрутки для второй линии
            end: 10500 // Конец прокрутки для второй линии
        },
        {
            selector: '.section-anim-line4', // Селектор второй линии
            start: 12000, // Начало прокрутки для второй линии
            end: 12500 // Конец прокрутки для второй линии
        }
        // Добавьте дополнительные объекты для других линий
    ];

    lines.forEach(lineInfo => {
        const line = document.querySelector(lineInfo.selector);

        if (line) {
            // Вычисляем процент прокрутки для текущей линии
            const lineStart = lineInfo.start;
            const lineEnd = lineInfo.end;
            const animationHeight = lineEnd - lineStart;
            const scrollPercent = Math.min(Math.max((scrollTop - lineStart) / animationHeight, 0), 1);

            // Меняем ширину блока в зависимости от прокрутки
            line.style.width = `${100 * scrollPercent}%`;
        }
    });
});




});


const menuContainer = document.querySelector('.tap-menu-container');
const openMenuButton = document.getElementById('menu-open');
const closeMenuButton = document.querySelector('.tap-menu-close');

function resetTapMenuStack(stack) {
    if (!stack) return;
    const root = stack.querySelector('[data-tap-menu-level="root"]');
    const subs = stack.querySelectorAll('[data-tap-menu-level="sub"]');
    if (root) {
        root.hidden = false;
        root.classList.add('is-active');
    }
    subs.forEach(function (panel) {
        panel.hidden = true;
        panel.classList.remove('is-active');
    });
    stack.querySelectorAll('[data-tap-menu-open]').forEach(function (btn) {
        btn.setAttribute('aria-expanded', 'false');
    });
}

function resetTapMenuLevels() {
    if (!menuContainer) return;
    menuContainer.querySelectorAll('[data-tap-menu-stack]').forEach(resetTapMenuStack);
    menuContainer.classList.remove('is-submenu-open');
}

function openTapMenuSub(panelId, fromEl) {
    if (!menuContainer || !panelId) return;
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const stack = (fromEl && fromEl.closest && fromEl.closest('[data-tap-menu-stack]'))
        || panel.closest('[data-tap-menu-stack]');
    if (!stack) return;

    const root = stack.querySelector('[data-tap-menu-level="root"]');
    if (root) {
        root.hidden = true;
        root.classList.remove('is-active');
    }
    stack.querySelectorAll('[data-tap-menu-level="sub"]').forEach(function (sub) {
        const on = sub === panel;
        sub.hidden = !on;
        sub.classList.toggle('is-active', on);
    });
    stack.querySelectorAll('[data-tap-menu-open]').forEach(function (btn) {
        btn.setAttribute('aria-expanded', btn.getAttribute('data-tap-menu-open') === panelId ? 'true' : 'false');
    });
    menuContainer.classList.add('is-submenu-open');
}

if (menuContainer) {
    menuContainer.addEventListener('click', function (event) {
        const openBtn = event.target.closest('[data-tap-menu-open]');
        if (openBtn && menuContainer.contains(openBtn)) {
            event.preventDefault();
            openTapMenuSub(openBtn.getAttribute('data-tap-menu-open'), openBtn);
            return;
        }

        const backBtn = event.target.closest('[data-tap-menu-back]');
        if (backBtn && menuContainer.contains(backBtn)) {
            event.preventDefault();
            resetTapMenuLevels();
            return;
        }

        const wheelLink = event.target.closest('a[href*="#koleso"], a[href*="#wheel"]');
        if (wheelLink && menuContainer.contains(wheelLink)) {
            menuContainer.style.transform = 'translateX(100%)';
            resetTapMenuLevels();
        }

        if (event.target === menuContainer) {
            menuContainer.style.transform = 'translateX(100%)';
            resetTapMenuLevels();
        }
    });

    // Открыть меню
    if (openMenuButton) {
        openMenuButton.addEventListener('click', function (event) {
            event.stopPropagation();
            menuContainer.style.transform = 'translateX(0%)';
        });
    }

    // Закрыть меню при клике на .tap-menu-close
    if (closeMenuButton) {
        closeMenuButton.addEventListener('click', function () {
            menuContainer.style.transform = 'translateX(100%)';
            resetTapMenuLevels();
        });
    }

    // Закрыть меню при клике вне меню
    document.addEventListener('click', function (event) {
        if (!menuContainer.contains(event.target) && event.target !== openMenuButton) {
            menuContainer.style.transform = 'translateX(100%)';
            resetTapMenuLevels();
        }
    });
}



document.querySelectorAll('.faq-bot-item').forEach(item => {
    item.addEventListener('click', function() {
        const wasOpen = this.classList.contains('is-open');
        document.querySelectorAll('.faq-bot-item').forEach(el => {
            el.classList.remove('is-open');
        });
        if (!wasOpen) {
            this.classList.add('is-open');
        }
    });
});






function toggleVisibility(element) {
            if (window.innerWidth <= 600) {
                const items = element.querySelector('.footer-col-items');
                if (element.classList.contains('visible')) {
                    element.classList.remove('visible');
                } else {
                    element.classList.add('visible');
                }
            }
        }





// Функция для инициализации слайдера
function initializeSlider(sliderSelector) {

    const slideElements = document.querySelectorAll(`${sliderSelector} .profit-price-img-block`);
    const slideElementsImage = document.querySelector(`${sliderSelector} .profit-price-images-container`);
    if(!slideElements) {
        return;
    }
    const navigationDots = document.querySelectorAll(`${sliderSelector} .dots-container .dot`);
    const visibleSlides = 1; // Количество видимых слайдов
    let startX = 0;
    let currentTranslate = 0;
    let currentIndex = 0;

    // Функция для отображения слайдов
    function showSlides(index) {
        if(!slideElements[0]) {
            return;
        }
        const maxIndex = slideElements.length - visibleSlides;
        const currentIndex = Math.max(0, Math.min(index, maxIndex));

        let slideWidth;
        if (window.innerWidth < 730) {
            slideWidth = slideElements[0].offsetWidth + 10; // Ширина блока плюс отступ 10
        } else {
            slideWidth = slideElements[0].offsetWidth + 20; // Ширина блока плюс отступ 20
        }

        // Рассчитать смещение
        const offset = -currentIndex * slideWidth;
        document.querySelector(`${sliderSelector} .profit-price-images`).style.transform = `translateX(${offset}px)`;

        updateNavigationDots(currentIndex);
    }

    // Функция для обновления состояния точек навигации
    function updateNavigationDots(currentIndex) {
        const dotsContainer = document.querySelector(`${sliderSelector} .dots-container`);
        const dots = dotsContainer.querySelectorAll('.dot');

        // Удаляем класс active у всех точек
        dots.forEach(dot => dot.classList.remove('active'));

        // Добавляем класс active только к выбранной точке
        dots[Math.min(currentIndex, dots.length - 1)].classList.add('active');
    }

    // Функция для перехода к слайду
    function goToSlide(index) {
        showSlides(index);
        currentIndex = index;
        console.log(currentIndex);
    }

    // Функция для обработки кликов по точкам навигации
    function navigateToSlide(index) {
        goToSlide(index);
    }
    // Привязка кликов к точкам навигации
    const dots = document.querySelectorAll(`${sliderSelector} .dots-container .dot`);
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => navigateToSlide(index));
    });

    function touchStart(event) {
        startX = event.touches[0].clientX;
    }

    function touchMove(event) {
        let touchX = event.touches[0].clientX;
        let diff = startX - touchX;
        let slideWidth = slideElements[0].offsetWidth + (window.innerWidth < 730 ? 10 : 20);

        if (Math.abs(diff) > slideWidth / 4) {
            if (diff > 0 && currentIndex < slideElements.length - visibleSlides) {
                goToSlide(currentIndex + 1);
            } else if (diff < 0 && currentIndex > 0) {
                goToSlide(currentIndex - 1);
            }
            document.removeEventListener("touchmove", touchMove);
        } else {
        }

    }

    function touchEnd() {
        console.log("touchend сработал");
        document.removeEventListener("touchmove", touchMove);
    }

    // Добавляем обработчики событий
    const slider = document.getElementById(sliderSelector);
    if (slideElementsImage) {
        slideElementsImage.addEventListener("touchstart", touchStart);
        slideElementsImage.addEventListener("touchmove", touchMove);
        slideElementsImage.addEventListener("touchend", touchEnd);
    } else {
        // console.error(`Элемент с id "${sliderSelector}" не найден.`);
    }


    // Инициализируем первый показ слайдов
    showSlides(0);
}

document.addEventListener("DOMContentLoaded", function() {
    function initializeSliderG(sliderClass, hasMargin = false, initialSlide = 0) {
        // alert('initializeSliderG');
        const sliderItems = document.querySelectorAll(`.${sliderClass}-item`);
        const prevButton = document.querySelector(`.${sliderClass}-btns .prev-btn`);
        const nextButton = document.querySelector(`.${sliderClass}-btns .next-btn`);
        const descTitle = document.querySelector(`.${sliderClass}-desc .${sliderClass}-desc-title`);
        const descText = document.querySelector(`.${sliderClass}-desc .${sliderClass}-desc-desc`);
        const sliderContainer = document.querySelector(`.${sliderClass}`);

        if (!sliderContainer || sliderItems.length === 0) {
            // console.warn(`Slider with class ${sliderClass} not found or has no slide items.`);
            return;
        }

        let currentIndex = initialSlide;

        function updateDescription(index) {
            const activeSlide = sliderItems[index];
            const slideDesc = activeSlide.querySelector(`.${sliderClass}-item-desc`);

            descText.style.opacity = "0";
            descTitle.style.opacity = "0";

            setTimeout(() => {
                descTitle.textContent = slideDesc.querySelector(`.${sliderClass}-item-desc-title`).textContent;
                descText.textContent = slideDesc.querySelector(`.${sliderClass}-item-desc-desc`).textContent;
                descText.style.opacity = "1";
                descTitle.style.opacity = "1";
            }, 200);
        }

        // function updateVisibilitySlider1(index) {
        //     sliderItems.forEach((slide, i) => {
        //         if (i === index) {
        //             slide.classList.add('active');
        //             slide.classList.remove('visible', 'inactive');
        //         } else if (i === index - 1 || i === index + 1 || (index === 0 && i === 1) || (index === sliderItems.length - 1 && i === sliderItems.length - 2)) {
        //             slide.classList.add('visible');
        //             slide.classList.remove('active', 'inactive');
        //         } else {
        //             slide.classList.add('inactive');
        //             slide.classList.remove('active', 'visible');
        //         }
        //     });
        // }
        //
        // function updateVisibilitySlider2(index) {
        //     sliderItems.forEach((slide, i) => {
        //         slide.classList.remove('visible-left', 'active', 'visible', 'inactive', 'visible-right');
        //         if (i === index) {
        //             slide.classList.add('active');
        //         } else if (i === index - 1 || (index === 0 && i === sliderItems.length - 1)) {
        //             slide.classList.add('visible', 'visible-left');
        //         } else if (i === index + 1 || (index === sliderItems.length - 1 && i === 0)) {
        //             slide.classList.add('visible', 'visible-right');
        //         } else {
        //             slide.classList.add('inactive');
        //         }
        //     });
        // }

        function updateVisibilitySlider1(index) {
            sliderItems.forEach((slide, i) => {
                slide.classList.remove('active', 'visible', 'inactive');

                if (i === index) {
                    slide.classList.add('active');
                } else if (
                    i === (index - 1 + sliderItems.length) % sliderItems.length ||
                    i === (index + 1) % sliderItems.length ||
                    i === (index - 2 + sliderItems.length) % sliderItems.length ||
                    i === (index + 2) % sliderItems.length
                ) {
                    slide.classList.add('visible');
                } else {
                    slide.classList.add('inactive');
                }
            });
        }

        function updateVisibilitySlider2(index) {
            // alert(index)
            // index = index + 1;
            sliderItems.forEach((slide, i) => {

                slide.classList.remove('visible-left', 'active', 'visible', 'inactive', 'visible-right');
                slide.classList.add('iiiii' + i);
                if (i === index) {
                    slide.classList.add('active');
                } else if (i === (index - 1 + sliderItems.length) % sliderItems.length) {
                    slide.classList.add('visible-left', 'visible');
                } else if (i === (index + 1) % sliderItems.length) {
                    console.log(`Current i: ${i}`);
                    console.log(`Current index: ${index}`);
                    console.log(`Prev index: ${(index - 1 + sliderItems.length) % sliderItems.length}`);
                    console.log(`Next index: ${(index + 1) % sliderItems.length}`);
                    slide.classList.add('visible-right', 'visible');
                } else if (i === (index - 2 + sliderItems.length) % sliderItems.length || i === (index + 2) % sliderItems.length) {
                    slide.classList.add('inactive');
                } else {
                    slide.classList.add('inactive');
                }
            });
        }





        function showSlide(index) {
            const slideWidth = sliderItems[0].clientWidth;
            const marginRight = hasMargin ? parseInt(window.getComputedStyle(sliderItems[0]).marginRight) : 0;
            // alert(marginRight);
            const newTransform = -(index * (slideWidth + marginRight * 2));
            // alert(newTransform);
            sliderContainer.style.transform = `translateX(${newTransform}px)`;

            updateDescription(index);
            if (sliderClass === 'info-slider1') {
                updateVisibilitySlider1(index);
            } else if (sliderClass === 'info-slider2') {
                updateVisibilitySlider2(index);
            } else if (sliderClass === 'info-slider3') {
                updateVisibilitySlider1(index);
            }
        }
        // prevButton.addEventListener('click', () => showSlide(currentIndex - 1));
        // nextButton.addEventListener('click', () => showSlide(currentIndex + 1));

        prevButton.addEventListener('click', () => {
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : sliderItems.length - 1;
            showSlide(currentIndex);
        });

        nextButton.addEventListener('click', () => {
            currentIndex = (currentIndex < sliderItems.length - 1) ? currentIndex + 1 : 0;
            showSlide(currentIndex);
        });

        // Инициализация слайда
        showSlide(currentIndex);
    }

// alert('initializeSliderG222')
    initializeSliderG('info-slider1');
    initializeSliderG('info-slider3');
initializeSliderG('info-slider2', true, 1); // Второй аргумент указывает, что нужно учитывать отступы, третий указывает начальный слайд
});


// Инициализация всех слайдеров
const sliderSelectors = ['#slider1', '#slider2']; // Селекторы ваших слайдеров
sliderSelectors.forEach(selector => initializeSlider(selector));





var timer;
function mortgage() {
    clearTimeout(timer);
    timer = setTimeout(function() {
        var mortgageAmount = jQuery('#mortgage-amount').val();
        var downPayment = jQuery('#down-payment').val();
        var years = jQuery('#years').val();

        if (mortgageAmount !== '' && downPayment !== '' && years !== '') {
            var formData = jQuery('#mortgage-form').serialize();
            jQuery.ajax({
                type: 'POST',
                url: '/calculate.php',
                data: formData,
                dataType: 'json',
                success: function (result) {
                    jQuery('#monthlyPayment').html(result.monthlyPayment.toLocaleString() + ' ₽');
                    jQuery('#monthlyPayment2').html(result.monthlyPayment2.toLocaleString() + ' ₽');
                    jQuery('#totalPayment').html(result.totalPayment.toLocaleString() + ' ₽');
                    jQuery('#totalPayment2').html(result.totalPayment2.toLocaleString() + ' ₽');
                    jQuery('.pereplata1').html(result.pereplata1.toLocaleString());
                    jQuery('.pereplata2').html(result.pereplata2.toLocaleString());
                },
                // error: function() {
                // 	alert('Ошибка расчета ипотеки');
                // }
            });
        }
    }, 100);
}