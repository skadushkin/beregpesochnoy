(function (Drupal, once) {
  Drupal.behaviors.riChrome = {
    attach: function (context) {
      once('ri-chrome', 'body.is-dev2-inner', context).forEach(function () {
        var burger = document.getElementById('riBurger');
        var drawer = document.getElementById('riDrawer');
        if (!burger || !drawer) {
          return;
        }
        burger.addEventListener('click', function () {
          if (drawer.hasAttribute('hidden')) {
            drawer.removeAttribute('hidden');
          }
          else {
            drawer.setAttribute('hidden', '');
          }
        });
        drawer.querySelectorAll('a').forEach(function (link) {
          link.addEventListener('click', function () {
            drawer.setAttribute('hidden', '');
          });
        });
      });
    },
  };
})(Drupal, once);
