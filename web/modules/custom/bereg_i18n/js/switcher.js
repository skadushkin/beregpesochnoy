(function (Drupal, once) {
  Drupal.behaviors.beregLangSwitcher = {
    attach: function (context) {
      once('bereg-lang-switcher', 'body.lang-en, body.lang-ar, body.lang-ru', context);
    },
  };
})(Drupal, once);
