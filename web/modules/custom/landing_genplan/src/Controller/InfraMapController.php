<?php

namespace Drupal\landing_genplan\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * JSON storage for the infrastructure map (no entity/database records).
 */
class InfraMapController extends ControllerBase {

  private const PUBLIC_URI = 'public://infra-map/data.json';

  /**
   * Default JSON shipped with the theme.
   */
  private function defaultPath(): string {
    return DRUPAL_ROOT . '/themes/bootstrap/landing-v2/data/infra-map.json';
  }

  /**
   * GET /infra-map/data
   */
  public function data(): JsonResponse {
    $fs = \Drupal::service('file_system');
    $public = $fs->realpath(self::PUBLIC_URI);
    $path = ($public && is_file($public)) ? $public : $this->defaultPath();
    $raw = is_file($path) ? file_get_contents($path) : '{}';
    $data = json_decode($raw, TRUE);
    if (!is_array($data)) {
      $data = [];
    }
    $response = new JsonResponse($data);
    $response->headers->set('Cache-Control', 'private, no-store');
    return $response;
  }

  /**
   * POST /infra-map/save
   */
  public function save(Request $request): JsonResponse {
    if (!$this->currentUser()->hasPermission('administer nodes')) {
      return new JsonResponse(['ok' => FALSE, 'error' => 'forbidden'], 403);
    }

    $payload = json_decode($request->getContent(), TRUE);
    if (!is_array($payload) || empty($payload['categories']) || !isset($payload['points'])) {
      return new JsonResponse(['ok' => FALSE, 'error' => 'invalid'], 400);
    }

    $clean = [
      'center' => $this->sanitizeCoords($payload['center'] ?? [55.9194, 36.8686]),
      'zoom' => max(8, min(18, (int) ($payload['zoom'] ?? 14))),
      'categories' => [],
      'points' => [],
    ];

    foreach ($payload['categories'] as $category) {
      if (!is_array($category) || empty($category['id'])) {
        continue;
      }
      $clean['categories'][] = [
        'id' => preg_replace('/[^a-z0-9_-]/i', '', (string) $category['id']),
        'label' => mb_substr(trim(strip_tags((string) ($category['label'] ?? ''))), 0, 80),
        'icon' => $this->sanitizeIcon((string) ($category['icon'] ?? '')),
        'color' => preg_match('/^#[0-9a-fA-F]{3,8}$/', (string) ($category['color'] ?? '')) ? $category['color'] : '#917357',
      ];
    }

    foreach ($payload['points'] as $point) {
      if (!is_array($point) || empty($point['coords'])) {
        continue;
      }
      $coords = $this->sanitizeCoords($point['coords']);
      if ($coords === NULL) {
        continue;
      }
      $clean['points'][] = [
        'id' => preg_replace('/[^a-z0-9_-]/i', '', (string) ($point['id'] ?? uniqid('p'))),
        'category' => preg_replace('/[^a-z0-9_-]/i', '', (string) ($point['category'] ?? '')),
        'title' => mb_substr(trim(strip_tags((string) ($point['title'] ?? ''))), 0, 120),
        'coords' => $coords,
        'pinned' => !empty($point['pinned']),
      ];
    }

    $fs = \Drupal::service('file_system');
    $dir = 'public://infra-map';
    $fs->prepareDirectory($dir, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS);
    $json = json_encode($clean, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    $fs->saveData($json, self::PUBLIC_URI, FileExists::Replace);

    return new JsonResponse(['ok' => TRUE, 'data' => $clean]);
  }

  /**
   * @param mixed $coords
   *
   * @return array{0: float, 1: float}|null
   */
  private function sanitizeCoords($coords): ?array {
    if (!is_array($coords) || count($coords) < 2) {
      return NULL;
    }
    $lat = (float) $coords[0];
    $lon = (float) $coords[1];
    if ($lat < 50 || $lat > 60 || $lon < 30 || $lon > 45) {
      return NULL;
    }
    return [$lat, $lon];
  }

  private function sanitizeIcon(string $icon): string {
    if (str_starts_with($icon, '/themes/bootstrap/landing-v2/img/')) {
      return $icon;
    }
    return '/themes/bootstrap/landing-v2/img/genplan-v2/infra-park.svg';
  }

}
