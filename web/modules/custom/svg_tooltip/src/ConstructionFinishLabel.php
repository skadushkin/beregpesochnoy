<?php

namespace Drupal\svg_tooltip;

use Drupal\Core\Entity\FieldableEntityInterface;

/**
 * Подпись срока сдачи для информера генплана.
 */
class ConstructionFinishLabel {

  /**
   * «IV КВАРТАЛ 2026 ГОДА» или NULL.
   */
  public static function fromEntity($entity): ?string {
    if (!$entity instanceof FieldableEntityInterface || !$entity->hasField('field_okonchanie_stroitelstva')) {
      return NULL;
    }
    if ($entity->get('field_okonchanie_stroitelstva')->isEmpty()) {
      return NULL;
    }

    $item = $entity->get('field_okonchanie_stroitelstva')->first();
    $raw = '';
    if ($item) {
      if (!empty($item->date) && is_object($item->date) && method_exists($item->date, 'format')) {
        $raw = $item->date->format('Y-m-d');
      }
      else {
        $raw = (string) ($item->value ?? '');
      }
    }

    return self::fromRaw($raw);
  }

  public static function fromRaw(string $raw): ?string {
    $raw = trim($raw);
    if ($raw === '') {
      return NULL;
    }

    if (preg_match('/^(\d{4})-(\d{2})/', $raw, $m)) {
      $year = (int) $m[1];
      $quarter = (int) ceil(((int) $m[2]) / 3);
      $roman = [1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV'][$quarter] ?? (string) $quarter;
      return $roman . ' КВАРТАЛ ' . $year . ' ГОДА';
    }

    if (preg_match('/(IV|III|II|I|[1-4])\s*(?:кв\.?|квартал)\.?\s*(\d{4})/ui', $raw, $m)) {
      $map = [
        'I' => 1,
        'II' => 2,
        'III' => 3,
        'IV' => 4,
        '1' => 1,
        '2' => 2,
        '3' => 3,
        '4' => 4,
      ];
      $quarter = $map[mb_strtoupper($m[1])] ?? 1;
      $roman = [1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV'][$quarter] ?? (string) $quarter;
      return $roman . ' КВАРТАЛ ' . (int) $m[2] . ' ГОДА';
    }

    return NULL;
  }

}
