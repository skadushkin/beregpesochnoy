<?php

// Пример твоего списка скриптов. Вставь свой актуальный список здесь:
$scripts = [
    "/core/assets/vendor/jquery/jquery.min.js?v=3.7.1",
    "/core/assets/vendor/underscore/underscore-min.js?v=1.13.7",
    "/core/assets/vendor/once/once.min.js?v=1.0.1",
    "/core/assets/vendor/backbone/backbone-min.js?v=1.6.0",
    "/sites/default/files/languages/ru_T82UDx5C3gkIAp2V9ZD5VXu_-Jwph5zD1Ix2zts6pl4.js?sugbmv",
    "/core/misc/drupalSettingsLoader.js?v=10.4.6",
    "/core/misc/drupal.js?v=10.4.6",
    "/core/misc/drupal.init.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/version-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/data-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/disable-selection-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/jquery-patch-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/scroll-parent-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/unique-id-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/focusable-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/keycode-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/plugin-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/widget-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/labels-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/widgets/controlgroup-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/form-reset-mixin-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/widgets/mouse-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/widgets/checkboxradio-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/widgets/draggable-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/widgets/resizable-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/widgets/button-min.js?v=10.4.6",
    "/core/assets/vendor/jquery.ui/ui/widgets/dialog-min.js?v=10.4.6",
    "/core/modules/contextual/js/contextual.js?v=10.4.6",
    "/core/modules/contextual/js/models/StateModel.js?v=10.4.6",
    "/core/modules/contextual/js/views/AuralView.js?v=10.4.6",
    "/core/modules/contextual/js/views/KeyboardView.js?v=10.4.6",
    "/core/modules/contextual/js/views/RegionView.js?v=10.4.6",
    "/core/modules/contextual/js/views/VisualView.js?v=10.4.6",
    "/core/assets/vendor/tabbable/index.umd.min.js?v=6.2.0",
    "/core/assets/vendor/tua-body-scroll-lock/tua-bsl.umd.min.js?v=10.4.6",
    "/core/misc/tabledrag.js?v=10.4.6",
    "/core/misc/progress.js?v=10.4.6",
    "/core/assets/vendor/loadjs/loadjs.min.js?v=4.3.0",
    "/core/misc/debounce.js?v=10.4.6",
    "/core/misc/announce.js?v=10.4.6",
    "/core/themes/olivero/js/navigation-utils.js?v=10.4.6",
    "/core/themes/olivero/js/checkbox.js?v=10.4.6",
    "/core/themes/olivero/js/messages.js?v=10.4.6",
    "/core/misc/message.js?v=10.4.6",
    "/core/themes/olivero/js/message.theme.js?v=10.4.6",
    "/core/misc/ajax.js?v=10.4.6",
    "/core/modules/big_pipe/js/big_pipe.js?v=10.4.6",
    "/core/misc/tabbingmanager.js?v=10.4.6",
    "/core/modules/contextual/js/contextual.toolbar.js?v=10.4.6",
    "/core/modules/contextual/js/toolbar/models/StateModel.js?v=10.4.6",
    "/core/modules/contextual/js/toolbar/views/AuralView.js?v=10.4.6",
    "/core/modules/contextual/js/toolbar/views/VisualView.js?v=10.4.6",
    "/core/misc/active-link.js?v=10.4.6",
    "/core/misc/form.js?v=10.4.6",
    "/core/misc/details-summarized-content.js?v=10.4.6",
    "/core/misc/details-aria.js?v=10.4.6",
    "/core/misc/details.js?v=10.4.6",
    "/core/misc/displace.js?v=10.4.6",
    "/core/misc/jquery.tabbable.shim.js?v=10.4.6",
    "/core/misc/position.js?v=10.4.6",
    "/core/misc/dialog/dialog-deprecation.js?v=10.4.6",
    "/core/misc/dialog/dialog.js?v=10.4.6",
    "/core/misc/dialog/dialog.position.js?v=10.4.6",
    "/core/misc/dialog/dialog.jquery-ui.js?v=10.4.6",
    "/core/modules/ckeditor5/js/ckeditor5.dialog.fix.js?v=10.4.6",
    "/core/misc/dialog/dialog.ajax.js?v=10.4.6",
    "/core/misc/states.js?v=10.4.6",
    "/core/themes/olivero/js/navigation.js?v=10.4.6",
    "/core/themes/olivero/js/second-level-navigation.js?v=10.4.6",
    "/core/themes/olivero/js/nav-resize.js?v=10.4.6",
    "/core/themes/olivero/js/search.js?v=10.4.6",
    "/modules/custom/svg_tooltip/js/svg-tooltip.js?v=1.x",
    "/core/modules/toolbar/js/toolbar.menu.js?v=10.4.6",
    "/core/modules/toolbar/js/toolbar.js?v=10.4.6",
    "/core/modules/toolbar/js/models/MenuModel.js?v=10.4.6",
    "/core/modules/toolbar/js/models/ToolbarModel.js?v=10.4.6",
    "/core/modules/toolbar/js/views/BodyVisualView.js?v=10.4.6",
    "/core/modules/toolbar/js/views/MenuVisualView.js?v=10.4.6",
    "/core/modules/toolbar/js/views/ToolbarAuralView.js?v=10.4.6",
    "/core/modules/toolbar/js/views/ToolbarVisualView.js?v=10.4.6",
    "/core/modules/toolbar/js/escapeAdmin.js?v=10.4.6",
    "/core/misc/jquery.form.js?v=4.3.0",
    "/core/misc/dropbutton/dropbutton.js?v=10.4.6",
    "/core/modules/views/js/base.js?v=10.4.6",
    "/core/modules/views/js/ajax_view.js?v=10.4.6",
    "/core/modules/views_ui/js/ajax.js?v=10.4.6",
    "/core/modules/views_ui/js/dialog.views.js?v=10.4.6",
    "/core/modules/views_ui/js/views-admin.js?v=10.4.6",
];

// Укажи путь до корня сайта
$drupalRoot = '/home/user/web/beregpesochnoy.ru/public_html/web'; // ← Заменить на актуальный путь до корня Drupal

$found = [];

foreach ($scripts as $script) {
    $script = explode('?',$script);
    // var_dump($script); exit;
  $fullPath = $drupalRoot . $script[0];
  
  if (!file_exists($fullPath)) {
    echo "⚠️  Не найден файл: $fullPath\n";
    continue;
  }

  $js = file_get_contents($fullPath);
  echo $fullPath.'<br>';
  if (preg_match('/\bDrupalDialogEvent\b/', $js)) {
    echo "✅ Найдено в: $script\n<br>";
    $found[] = $script;
  } else {
    echo "— Нет DrupalDialogEvent в: $script\n<br>";
  }
}

echo "\n🔍 Поиск завершён.\n";
if (count($found)) {
  echo "Найдено в:\n" . implode("\n", $found) . "\n";
} else {
  echo "❌ DrupalDialogEvent не найден ни в одном скрипте.\n<br>";
}
