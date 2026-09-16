(function (Drupal, once) {
  function digits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function noticeFor(input, type) {
    if (type === 'agree') {
      var agree = input.closest('form').querySelector('.bp-form__agree');
      return agree ? agree.nextElementSibling : null;
    }
    var label = input.closest('label');
    return label && label.nextElementSibling && label.nextElementSibling.classList.contains('online-notice')
      ? label.nextElementSibling
      : null;
  }

  function showNotice(el, text) {
    if (!el) return;
    el.textContent = text || '';
    el.style.visibility = text ? 'visible' : 'hidden';
  }

  function submitLead(form) {
    var nameInput = form.querySelector('input[name="name"]');
    var phoneInput = form.querySelector('input[name="phone"]');
    var agree = form.querySelector('input[name="agree"]');
    var valid = true;
    var name = (nameInput && nameInput.value || '').trim();
    var phone = phoneInput ? phoneInput.value : '';

    if (!name) {
      valid = false;
      showNotice(noticeFor(nameInput, 'name'), 'Вы не заполнили обязательное поле');
    } else {
      showNotice(noticeFor(nameInput, 'name'), '');
    }

    if (digits(phone).length < 11) {
      valid = false;
      showNotice(noticeFor(phoneInput, 'phone'), 'Проверьте номер телефона');
    } else {
      showNotice(noticeFor(phoneInput, 'phone'), '');
    }

    if (agree && !agree.checked) {
      valid = false;
      showNotice(noticeFor(agree, 'agree'), 'Подтвердите согласие с обработкой персональных данных');
    } else if (agree) {
      showNotice(noticeFor(agree, 'agree'), '');
    }

    if (!valid) return;

    var sourceInput = form.querySelector('input[name="source"]');
    var typeInput = form.querySelector('select[name="object_type"]');
    var source = (sourceInput && sourceInput.value) || 'TEST2';
    if (typeInput && typeInput.value) {
      source += ' / ' + typeInput.value;
    }

    var body = new URLSearchParams({
      name: name,
      email: ' ',
      phone: phone,
      source: source
    });

    fetch('/form-submit/common-form/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body.toString(),
      credentials: 'same-origin'
    }).then(function () {
      var ok = form.querySelector('.popup-success');
      if (ok) ok.style.display = 'block';
      setTimeout(function () {
        if (ok) ok.style.display = 'none';
        if (form.closest('#lv2TourModal') && typeof window.lv2CloseTourModal === 'function') {
          form.reset();
          window.lv2CloseTourModal();
        }
      }, 3000);
    });
  }

  Drupal.behaviors.bpLanding = {
    attach: function (context) {
      once('bp-landing', '.landing-dev2-root', context).forEach(function (root) {
        var tabs = root.querySelector('[data-lv2-catalog-tabs]');
        var panelsRoot = root.querySelector('[data-lv2-catalog-panels]');
        if (tabs && panelsRoot) {
          var buttons = tabs.querySelectorAll('[data-tab]');
          var panels = panelsRoot.querySelectorAll('[data-tab-panel]');
          var moreLink = root.querySelector('[data-lv2-catalog-more]');
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

        var fsBtn = root.querySelector('[data-bp-genplan-fs]');
        if (fsBtn) {
          fsBtn.addEventListener('click', function () {
            var inner = document.querySelector('#lv2Genplan #fullscreen-btn');
            if (inner) inner.click();
            else {
              var box = document.getElementById('lv2Genplan');
              if (box && box.requestFullscreen) box.requestFullscreen();
            }
          });
        }

        var gallery = root.querySelector('[data-bp-gallery]');
        if (gallery) {
          var slides = Array.prototype.slice.call(gallery.querySelectorAll('.bp-gallery__slide'));
          var counter = gallery.querySelector('[data-bp-gallery-counter]');
          var filters = root.querySelector('[data-bp-gallery-filters]');
          var activeCat = 'all';
          var index = 0;

          function visible() {
            return slides.filter(function (slide) {
              return activeCat === 'all' || slide.getAttribute('data-cat') === activeCat;
            });
          }

          function render() {
            var list = visible();
            if (!list.length) return;
            if (index >= list.length) index = 0;
            if (index < 0) index = list.length - 1;
            slides.forEach(function (slide) { slide.classList.remove('is-active'); });
            list[index].classList.add('is-active');
            if (counter) {
              var n = index + 1;
              counter.textContent = (n < 10 ? '0' : '') + n + ' / ' + (list.length < 10 ? '0' : '') + list.length;
            }
          }

          gallery.querySelectorAll('[data-dir]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              index += parseInt(btn.getAttribute('data-dir'), 10);
              render();
            });
          });

          var startX = 0;
          gallery.addEventListener('touchstart', function (e) {
            startX = e.changedTouches[0].clientX;
          }, { passive: true });
          gallery.addEventListener('touchend', function (e) {
            var dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 40) {
              index += dx < 0 ? 1 : -1;
              render();
            }
          }, { passive: true });

          if (filters) {
            filters.querySelectorAll('[data-cat]').forEach(function (btn) {
              btn.addEventListener('click', function () {
                filters.querySelectorAll('[data-cat]').forEach(function (b) { b.classList.remove('is-active'); });
                btn.classList.add('is-active');
                activeCat = btn.getAttribute('data-cat');
                index = 0;
                render();
              });
            });
          }

          var lightbox = document.getElementById('bpLightbox');
          slides.forEach(function (slide) {
            slide.addEventListener('click', function () {
              if (!lightbox) return;
              lightbox.querySelector('img').src = slide.getAttribute('data-src');
              lightbox.querySelector('img').alt = slide.querySelector('img').alt;
              lightbox.querySelector('p').textContent = slide.getAttribute('data-caption') || '';
              lightbox.removeAttribute('hidden');
            });
          });
          if (lightbox) {
            lightbox.querySelector('[data-bp-lightbox-close]').addEventListener('click', function () {
              lightbox.setAttribute('hidden', '');
            });
            lightbox.addEventListener('click', function (e) {
              if (e.target === lightbox) lightbox.setAttribute('hidden', '');
            });
          }
          render();
        }

        root.querySelectorAll('.bp-lead-send').forEach(function (btn) {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            submitLead(btn.closest('form'));
          });
        });

        if ('IntersectionObserver' in window) {
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add('bp-reveal');
                io.unobserve(entry.target);
              }
            });
          }, { threshold: 0.12 });
          root.querySelectorAll('section').forEach(function (section) {
            io.observe(section);
          });
        }
      });
    },
  };
})(Drupal, once);
