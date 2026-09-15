<?php

namespace Drupal\svg_tooltip\Controller;

use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Список проектов домов / резиденций для попапа генплана.
 */
class HouseProjectsController {

  /**
   * Returns published project or residence nodes as JSON.
   */
  public function list(Request $request): JsonResponse {
    $kind = (string) $request->query->get('kind');
    $residenceOnly = ($kind === 'residence');
    $bundle = $residenceOnly ? 'rezidencii' : 'project';

    $query = \Drupal::entityQuery('node')
      ->accessCheck(TRUE)
      ->condition('status', 1)
      ->condition('type', $bundle)
      ->sort('title', 'ASC');
    if (!$residenceOnly) {
      $query->range(0, 48);
    }
    $ids = $query->execute();

    $items = [];
    if ($ids) {
      $fileUrl = \Drupal::service('file_url_generator');
      foreach (Node::loadMultiple($ids) as $node) {
        $items[] = $this->nodeToItem($node, $fileUrl, $residenceOnly);
      }
    }

    return new JsonResponse([
      'items' => $items,
      'count' => count($items),
    ]);
  }

  /**
   * @param \Drupal\Core\File\FileUrlGeneratorInterface $fileUrl
   *
   * @return array<string, mixed>
   */
  protected function nodeToItem(NodeInterface $node, $fileUrl, bool $isResidence): array {
    $item = [
      'id' => (int) $node->id(),
      'title' => $node->label(),
      'link' => $node->toUrl()->toString(),
      'category' => $isResidence ? 'vip' : 'serial',
    ];

    $imageFields = ['field_image', 'field_project_images', 'field_mainproject_image', 'field_house_photo'];
    foreach ($imageFields as $field_name) {
      if (!$node->hasField($field_name) || $node->get($field_name)->isEmpty()) {
        continue;
      }
      $image = $node->get($field_name)->first()->entity;
      if ($image) {
        $item['image'] = $fileUrl->generateAbsoluteString($image->getFileUri());
        break;
      }
    }

    $price = NULL;
    foreach (['field_project_price', 'field_house_price', 'field_house_price2', 'field_lot_price'] as $field_name) {
      if (!$node->hasField($field_name) || $node->get($field_name)->isEmpty()) {
        continue;
      }
      $raw = $node->get($field_name)->value;
      if ($raw !== NULL && $raw !== '' && (float) $raw > 0) {
        $price = number_format((float) $raw, 0, ',', ' ') . ' ₽';
        break;
      }
    }
    $item['price'] = $price ?: 'Цена по запросу';

    if (!$isResidence && $node->hasField('field_project_type') && !$node->get('field_project_type')->isEmpty()) {
      $term = $node->get('field_project_type')->entity;
      if ($term) {
        $label = mb_strtolower($term->label());
        if (mb_strpos($label, 'таун') !== FALSE) {
          $item['category'] = 'townhouse';
        }
        elseif (mb_strpos($label, 'дуплекс') !== FALSE) {
          $item['category'] = 'duplex';
        }
        elseif (mb_strpos($label, 'vip') !== FALSE || mb_strpos($label, 'резиден') !== FALSE) {
          $item['category'] = 'vip';
        }
      }
    }

    $lotAreaField = $node->hasField('field_general_area') && !$node->get('field_general_area')->isEmpty()
      ? 'field_general_area'
      : 'field_lot_area';
    if ($node->hasField($lotAreaField) && !$node->get($lotAreaField)->isEmpty()) {
      $lotArea = (float) $node->get($lotAreaField)->value;
      $item['lot_area'] = str_replace('.', ',', rtrim(rtrim(number_format($lotArea, 2, '.', ''), '0'), '.')) . ' соток';
    }

    if ($node->hasField('field_mortgage') && !$node->get('field_mortgage')->isEmpty()) {
      $mortgage = trim(strip_tags($node->get('field_mortgage')->value));
      if ($mortgage !== '') {
        $item['mortgage'] = $mortgage;
      }
    }
    if (empty($item['mortgage'])) {
      $item['mortgage'] = 'Льготная ипотека от 6%';
    }

    if ($node->hasField('field_total_area') && !$node->get('field_total_area')->isEmpty()) {
      $area = $node->get('field_total_area')->value;
      $item['area'] = str_replace('.', ',', rtrim(rtrim(number_format((float) $area, 1, '.', ''), '0'), '.')) . ' м2';
    }

    if ($node->hasField('field_storeys') && !$node->get('field_storeys')->isEmpty()) {
      $storeys = (int) $node->get('field_storeys')->value;
      if ($storeys === 1) {
        $item['storeys'] = '1 этаж';
      }
      elseif (in_array($storeys, [2, 3, 4], TRUE)) {
        $item['storeys'] = $storeys . ' этажа';
      }
      elseif ($storeys > 0) {
        $item['storeys'] = $storeys . ' этажей';
      }
    }

    return $item;
  }

}
