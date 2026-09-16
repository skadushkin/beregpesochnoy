<?php

namespace Drupal\landing_genplan\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\RedirectResponse;

/**
 * Marketing inner pages for the test2 Bereg Pesochnoy landing.
 */
class SitePageController extends ControllerBase {

  /**
   * Renders a marketing page; markup lives in the page template.
   */
  public function view(string $page_id): array {
    return [
      '#markup' => '',
      '#cache' => [
        'contexts' => ['url.path', 'url.site'],
        'tags' => ['bereg_page:' . $page_id],
      ],
    ];
  }

  /**
   * Catalog alias that matches the recommended /houses route.
   */
  public function houses(): RedirectResponse {
    return new RedirectResponse('/kupit-dom-v-kottedzhnom-poselke', 302);
  }

}
