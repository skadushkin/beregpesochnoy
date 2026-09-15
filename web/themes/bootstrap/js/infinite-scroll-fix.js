/**
 * @file
 * Fixes Views Infinite Scroll append for custom list wrappers (gallery, catalog).
 */
(function ($, Drupal, once, drupalSettings) {
  'use strict';

  var NS = '[VIS]';
  var contentWrapperSelector = '[data-drupal-views-infinite-scroll-content-wrapper]';
  var pagerSelector = '[data-drupal-views-infinite-scroll-pager]';
  var patched = false;

  function log(step, message, data) {
    if (data === undefined) {
      console.warn(NS, step + ':', message);
      return;
    }
    console.warn(NS, step + ':', message, data);
  }

  window.visDebugLog = log;
  window.visDebugEnabled = function () { return true; };

  log('boot', 'infinite-scroll-fix.js loaded');

  function safeSnippet($nodes, max) {
    max = max || 500;
    if (!$nodes || !$nodes.length) {
      return null;
    }
    try {
      var html = '';
      $nodes.each(function (_, node) {
        if (node && node.nodeType === 1 && node.outerHTML) {
          html += node.outerHTML;
        }
      });
      if (!html && $nodes.html) {
        html = $nodes.html() || '';
      }
      return html ? html.substring(0, max) : null;
    } catch (e) {
      return null;
    }
  }

  function countItems($el) {
    return $el.find('.gallery-item, .catlog-item, .views-row, .product-card').length;
  }

  function getItemKey($item) {
    var $el = $($item);
    var $link = $el.find('a[href*="/node/"]').first();
    if ($link.length) {
      var match = ($link.attr('href') || '').match(/\/node\/(\d+)/);
      if (match) {
        return 'node:' + match[1];
      }
    }
    // Каталог домов использует алиасы (/house/..., /construction/...), не /node/.
    $link = $el.find('a[href]').first();
    if ($link.length) {
      var href = ($link.attr('href') || '').split('#')[0].split('?')[0];
      if (href && href !== '#' && href !== '/') {
        return 'href:' + href;
      }
    }
    var id = $el.attr('id');
    if (id) {
      return 'id:' + id;
    }
    return null;
  }

  function findListContainer($scope) {
    if (!$scope || !$scope.length) {
      return $();
    }
    if ($scope.is('.gallery-items, .catalog-items')) {
      return $scope.first();
    }
    return $scope.find('.gallery-items, .catalog-items').first();
  }

  function collectItemKeys($container) {
    var keys = {};
    $container.find('.gallery-item, .catlog-item, .views-row, .product-card').each(function () {
      var key = getItemKey(this);
      if (key) {
        keys[key] = true;
      }
    });
    return keys;
  }

  function filterDuplicateItems($items, $target) {
    var keys = collectItemKeys($target);
    return $items.filter(function () {
      var key = getItemKey(this);
      return !key || !keys[key];
    });
  }

  function hideLoadMoreControls($view) {
    $view.find(pagerSelector).remove();
    $view.find('.catalog-items-showmore').remove();
    $view.closest('.catalog, .view, section.bg1, .container_w').find('.catalog-show-mob').hide();
  }

  function syncPager($view, $existingPager, $newPager) {
    var $nextLink = $newPager.length ? $newPager.find('a[rel=next]') : $();

    if ($nextLink.length) {
      if ($existingPager.length) {
        $existingPager.replaceWith($newPager);
      } else {
        $view.append($newPager);
      }
      return;
    }

    hideLoadMoreControls($view);
  }

  function snapshotView($view) {
    if (!$view || !$view.length) {
      return null;
    }
    return {
      classes: $view.attr('class') || '',
      wrappers: $view.find(contentWrapperSelector).length,
      pagers: $view.find(pagerSelector).length,
      galleryItems: $view.find('.gallery-item').length,
      catalogItems: $view.find('.catlog-item').length,
      pagerHref: $view.find(pagerSelector + ' a[rel=next]').attr('href') || null
    };
  }

  function resetCatalogLayout($view) {
    $view.find('.catalog-items').css({
      height: 'auto',
      transform: 'none',
      flexWrap: 'wrap',
      display: 'flex',
      overflow: 'visible'
    });
    $view.find('.catalog-items-cont').css('overflow', 'visible');
  }

  function rebindFancybox($context) {
    if (typeof Fancybox === 'undefined' || !$context) {
      return;
    }
    Fancybox.bind($context.querySelectorAll('[data-fancybox]'));
  }

  function findAppendTarget($view) {
    var selectors = [
      '.catalog-items',
      '.gallery-items',
      '.views-element-container',
      contentWrapperSelector,
      '.view-content'
    ];
    var $best = null;
    var bestCount = 0;

    selectors.forEach(function (selector) {
      $view.find(selector).each(function () {
        var $el = $(this);
        var count = $el.find('.catlog-item, .gallery-item, .views-row, .product-card').length;
        if (count > bestCount) {
          bestCount = count;
          $best = $el;
        }
      });
    });

    if ($best && $best.length) {
      return $best;
    }

    return $view.find('.townhouses-first-catalog-right, .catlog-items-ready').first();
  }

  function extractNewItems($scope) {
    var $targetContainer = findListContainer($scope);
    if ($targetContainer.length) {
      var $items = $targetContainer.find('.gallery-item, .catlog-item, .views-row, .product-card');
      if ($items.length) {
        return { $target: $targetContainer, $items: $items };
      }
      return { $target: $targetContainer, $items: $targetContainer.children() };
    }

    var $items = $scope.find('.gallery-item, .catlog-item, .views-row, .product-card');
    if ($items.length) {
      var $fallbackTarget = findListContainer($scope);
      return {
        $target: $fallbackTarget.length ? $fallbackTarget : $scope,
        $items: $items
      };
    }

    return null;
  }

  function mergeInfiniteScrollContent(view, $newView) {
    var $existingWrapper = view.$view.find(contentWrapperSelector);
    var $newWrapper = $newView.find(contentWrapperSelector);
    var $newPager = $newView.find(pagerSelector);
    var $existingPager = view.$view.find(pagerSelector);

    log('merge', 'start', {
      existingWrapper: $existingWrapper.length,
      newWrapper: $newWrapper.length,
      viewBefore: snapshotView(view.$view)
    });

    var $existingTarget = null;
    var $newItems = null;

    if ($existingWrapper.length && $newWrapper.length) {
      $existingTarget = findListContainer($existingWrapper);
      var extracted = extractNewItems($newWrapper);
      if (extracted && extracted.$items.length) {
        if (!$existingTarget.length) {
          $existingTarget = $existingWrapper;
        }
        $newItems = extracted.$items;
      }
    }

    if (!$newItems || !$newItems.length) {
      var fallback = extractNewItems($newView);
      if (fallback && fallback.$items.length) {
        $existingTarget = findAppendTarget(view.$view);
        $newItems = fallback.$items;
      }
    }

    if (!$existingTarget || !$existingTarget.length) {
      $existingTarget = findAppendTarget(view.$view);
    }

    if (!$newItems || !$newItems.length) {
      var direct = extractNewItems($newView);
      if (direct && direct.$items.length) {
        $newItems = direct.$items;
      }
    }

    if (!$existingTarget || !$existingTarget.length || !$newItems || !$newItems.length) {
      log('merge', 'FAIL', {
        existingTarget: $existingTarget ? $existingTarget.length : 0,
        existingTargetClass: $existingTarget && $existingTarget.length ? $existingTarget.attr('class') : null,
        newItems: $newItems ? $newItems.length : 0,
        newViewSnippet: safeSnippet($newView, 400)
      });
      syncPager(view.$view, $existingPager, $newPager);
      return $newPager.find('a[rel=next]').length === 0;
    }

    var $uniqueItems = filterDuplicateItems($newItems, $existingTarget);
    if (!$uniqueItems.length) {
      log('merge', 'SKIP duplicates', {
        incoming: $newItems.length,
        existing: countItems($existingTarget)
      });
      syncPager(view.$view, $existingPager, $newPager);
      return true;
    }

    var beforeCount = countItems($existingTarget);
    if ($existingWrapper.length) {
      $existingWrapper.trigger('views_infinite_scroll.new_content', $uniqueItems.clone());
    }
    $existingTarget.append($uniqueItems);

    syncPager(view.$view, $existingPager, $newPager);

    resetCatalogLayout(view.$view);
    rebindFancybox(view.$view[0]);
    Drupal.attachBehaviors(view.$view[0]);

    log('merge', 'OK', {
      before: beforeCount,
      after: countItems($existingTarget),
      added: countItems($existingTarget) - beforeCount,
      duplicatesSkipped: $newItems.length - $uniqueItems.length,
      viewAfter: snapshotView(view.$view)
    });
    return true;
  }

  function patchInfiniteScrollInsertView() {
    if (patched || typeof $.fn.infiniteScrollInsertView !== 'function') {
      return patched;
    }

    var originalInsert = $.fn.infiniteScrollInsertView;

    $.fn.infiniteScrollInsertView = function ($newView) {
      log('insertView', 'called', {
        viewClass: this.attr('class') || '',
        newViewNodes: $newView ? $newView.length : 0
      });

      try {
        var matches = /(js-view-dom-id-\w+)/.exec(this.attr('class') || '');
        if (!matches) {
          log('insertView', 'FAIL no js-view-dom-id');
          return;
        }

        var currentViewId = matches[1].replace('js-view-dom-id-', 'views_dom_id:');
        var view = Drupal.views.instances[currentViewId];

        if (!view) {
          log('insertView', 'no Drupal.views instance, use original', { currentViewId: currentViewId });
          originalInsert.call(this, $newView);
          return;
        }

        once.remove('ajax-pager', view.$view);
        if (view.$exposed_form) {
          once.remove('exposed-form', view.$exposed_form);
        }
        once.remove('infinite-scroll', view.$view.find(pagerSelector));

        if (mergeInfiniteScrollContent(view, $newView)) {
          return;
        }

        log('insertView', 'fallback originalInsert');
        originalInsert.call(this, $newView);
        resetCatalogLayout(view.$view);
        rebindFancybox(view.$view[0]);
      } catch (error) {
        log('insertView', 'ERROR', error);
        originalInsert.call(this, $newView);
      }
    };

    patched = true;
    log('patch', 'infiniteScrollInsertView patched');
    return true;
  }

  function logPageInventory() {
    var views = drupalSettings.views && drupalSettings.views.ajaxViews
      ? Object.keys(drupalSettings.views.ajaxViews)
      : [];
    log('inventory', 'page state', {
      patched: patched,
      hasInsertFn: typeof $.fn.infiniteScrollInsertView === 'function',
      hasViewsAjax: typeof Drupal.views !== 'undefined' && typeof Drupal.views.ajaxView === 'function',
      ajaxViewsSettings: views,
      ajaxViewsInstances: Drupal.views && Drupal.views.instances ? Object.keys(Drupal.views.instances) : [],
      domViews: $('[class*="js-view-dom-id-"]').length,
      wrappers: $(contentWrapperSelector).length,
      pagers: $(pagerSelector).length,
      pagerLinks: $(pagerSelector + ' a[rel=next], .js-pager__items a[rel=next]').length,
      catalogShowMob: $('.catalog-show-mob').length
    });
  }

  Drupal.behaviors.bootstrapInfiniteScrollFix = {
    attach: function (context) {
      patchInfiniteScrollInsertView();
      once('vis-inventory', 'body', context).forEach(logPageInventory);
    }
  };

  once('vis-global-listeners', 'body').forEach(function () {
    $(document).on('click', '[data-drupal-views-infinite-scroll-pager] a[rel=next], .js-pager__items a[rel=next]', function () {
      log('click', 'pager next', { href: $(this).attr('href') || '' });
    });

    $(document).ajaxSend(function (_e, _xhr, settings) {
      if (!settings.url || settings.url.indexOf('views/ajax') === -1) {
        return;
      }
      log('ajax', 'SEND', { url: settings.url });
    });

    $(document).ajaxComplete(function (_e, xhr, settings) {
      patchInfiniteScrollInsertView();
      if (!settings.url || settings.url.indexOf('views/ajax') === -1) {
        return;
      }
      var commands = [];
      try {
        var parsed = JSON.parse(xhr.responseText || '[]');
        commands = parsed.map(function (cmd) {
          return { command: cmd.command, method: cmd.method, selector: cmd.selector };
        });
      } catch (err) {
        log('ajax', 'bad JSON response', { status: xhr.status });
        return;
      }
      log('ajax', 'COMPLETE', {
        status: xhr.status,
        commands: commands,
        infiniteScroll: commands.some(function (c) { return c.method === 'infiniteScrollInsertView'; })
      });
    });

    $(document).ajaxError(function (_e, xhr, settings, error) {
      if (!settings.url || settings.url.indexOf('views/ajax') === -1) {
        return;
      }
      log('ajax', 'ERROR', { status: xhr.status, error: String(error) });
    });
  });

})(jQuery, Drupal, once, drupalSettings);
