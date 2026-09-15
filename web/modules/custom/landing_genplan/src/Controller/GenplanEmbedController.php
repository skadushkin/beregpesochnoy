<?php

namespace Drupal\landing_genplan\Controller;

use Symfony\Component\HttpFoundation\Response;

/**
 * Returns genplan HTML fragment for lazy loading on landing pages.
 */
class GenplanEmbedController {

  /**
   * Renders the genplan map partial without page chrome.
   */
  public function embed(): Response {
    $build = [
      '#theme' => 'genplan_map_embed',
    ];
    $html = (string) \Drupal::service('renderer')->renderRoot($build);

    return new Response($html, 200, [
      'Content-Type' => 'text/html; charset=UTF-8',
      'Cache-Control' => 'public, max-age=3600',
    ]);
  }

}
