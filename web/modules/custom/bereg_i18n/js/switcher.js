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
    var links = nav.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].style.color = color;
    }
  }

  function syncAll() {
    var navs = document.querySelectorAll('.bereg-lang');
    for (var i = 0; i < navs.length; i++) {
      applyColor(navs[i]);
    }
  }

  Drupal.behaviors.beregLangSwitcher = {
    attach: function (context) {
      var navs = once('bereg-lang-color', '.bereg-lang', context);
      for (var i = 0; i < navs.length; i++) {
        applyColor(navs[i]);
      }
      once('bereg-lang-color-watch', 'html', document.documentElement).forEach(
        function () {
          window.addEventListener('scroll', syncAll, { passive: true });
          window.addEventListener('resize', syncAll);
        },
      );
    },
  };
})(Drupal, once);
