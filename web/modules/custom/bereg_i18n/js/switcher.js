(function (Drupal, once) {
  var SAMPLE =
    '.header-menu-item a, .header-menu-link, .ri-header__nav a, .tap-menu-top-item a';

  function applyColor(nav) {
    var root =
      nav.closest('.header-menu, .ri-header, .tap-menu-container') || document;
    var sample = root.querySelector(SAMPLE);
    if (!sample) {
      return;
    }
    var color = window.getComputedStyle(sample).color;
    if (!color) {
      return;
    }
    nav.style.color = color;
    var btn = nav.querySelector('.bereg-lang__btn');
    if (btn) {
      btn.style.color = color;
    }
  }

  function syncAll() {
    var navs = document.querySelectorAll('.bereg-lang');
    for (var i = 0; i < navs.length; i++) {
      applyColor(navs[i]);
    }
  }

  function closeNav(nav) {
    var btn = nav.querySelector('.bereg-lang__btn');
    var list = nav.querySelector('.bereg-lang__list');
    nav.classList.remove('is-open');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
    }
    if (list) {
      list.hidden = true;
    }
  }

  function closeAll(except) {
    var navs = document.querySelectorAll('.bereg-lang.is-open');
    for (var i = 0; i < navs.length; i++) {
      if (navs[i] !== except) {
        closeNav(navs[i]);
      }
    }
  }

  function toggleNav(nav) {
    var btn = nav.querySelector('.bereg-lang__btn');
    var list = nav.querySelector('.bereg-lang__list');
    if (!btn || !list) {
      return;
    }
    var open = btn.getAttribute('aria-expanded') === 'true';
    closeAll();
    if (!open) {
      nav.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      list.hidden = false;
    }
  }

  Drupal.behaviors.beregLangSwitcher = {
    attach: function (context) {
      var navs = once('bereg-lang-switcher', '.bereg-lang', context);
      for (var i = 0; i < navs.length; i++) {
        applyColor(navs[i]);
        var btn = navs[i].querySelector('.bereg-lang__btn');
        if (btn) {
          btn.addEventListener(
            'click',
            (function (nav) {
              return function (event) {
                event.preventDefault();
                event.stopPropagation();
                toggleNav(nav);
              };
            })(navs[i]),
          );
        }
      }
      once('bereg-lang-color-watch', 'html', document.documentElement).forEach(
        function () {
          window.addEventListener('scroll', syncAll, { passive: true });
          window.addEventListener('resize', syncAll);
          document.addEventListener('click', function () {
            closeAll();
          });
          document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
              closeAll();
            }
          });
        },
      );
      once('bereg-tap-menu-close', '.tap-menu-close', context).forEach(
        function (btn) {
          btn.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            var menu = document.querySelector('.tap-menu-container');
            if (menu) {
              menu.style.transform = 'translateX(100%)';
              menu.classList.remove('is-submenu-open');
            }
          });
        },
      );
    },
  };
})(Drupal, once);
