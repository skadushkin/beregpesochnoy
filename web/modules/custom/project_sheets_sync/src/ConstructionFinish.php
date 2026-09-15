<?php

namespace Drupal\project_sheets_sync;

/**
 * Разбор срока окончания строительства из Google Sheets.
 */
class ConstructionFinish {

  /**
   * Значение для записи в поле Drupal из ячейки таблицы.
   *
   * @return array{storage: string, label: string, year: int, quarter: int}|null
   */
  public static function fromSheetCell(string $value, string $field_type = 'datetime'): ?array {
    $parsed = self::parse($value);
    if ($parsed === NULL) {
      return NULL;
    }

    $label = self::formatFromQuarter($parsed['year'], $parsed['quarter']);
    if ($field_type === 'datetime' || $field_type === 'daterange') {
      $storage = sprintf('%04d-%02d-01', $parsed['year'], ($parsed['quarter'] - 1) * 3 + 1);
    }
    elseif ($field_type === 'timestamp') {
      $storage = (string) gmmktime(0, 0, 0, ($parsed['quarter'] - 1) * 3 + 1, 1, $parsed['year']);
    }
    else {
      $storage = $label;
    }

    return [
      'storage' => $storage,
      'label' => $label,
      'year' => $parsed['year'],
      'quarter' => $parsed['quarter'],
    ];
  }

  /**
   * @return array{year: int, quarter: int}|null
   */
  public static function parse(string $value): ?array {
    $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    $value = str_replace("\xc2\xa0", ' ', $value);
    if ($value === '' || $value === '-' || $value === '\\-') {
      return NULL;
    }

    if (preg_match('/(IV|III|II|I|[1-4])\s*(?:кв\.?|квартал)\.?\s*(\d{4})/ui', $value, $m)) {
      return [
        'year' => (int) $m[2],
        'quarter' => self::romanToQuarter($m[1]),
      ];
    }

    if (preg_match('/\bQ\s*([1-4])\s*[\/\-]?\s*(\d{4})/i', $value, $m)) {
      return [
        'year' => (int) $m[2],
        'quarter' => (int) $m[1],
      ];
    }

    $ts = self::toTimestamp($value);
    if ($ts === NULL) {
      return NULL;
    }

    $month = (int) date('n', $ts);
    return [
      'year' => (int) date('Y', $ts),
      'quarter' => (int) ceil($month / 3),
    ];
  }

  protected static function formatFromQuarter(int $year, int $quarter): string {
    $roman = [1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV'][$quarter] ?? (string) $quarter;
    return $roman . ' КВАРТАЛ ' . $year . ' ГОДА';
  }

  protected static function romanToQuarter(string $value): int {
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
    $key = mb_strtoupper(trim($value));
    return $map[$key] ?? 1;
  }

  protected static function toTimestamp(string $value): ?int {
    if (preg_match('/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/', $value, $m)) {
      $ts = strtotime(sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]));
      return $ts ?: NULL;
    }
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $value, $m)) {
      $ts = strtotime($m[0]);
      return $ts ?: NULL;
    }
    $ts = strtotime($value);
    return $ts ?: NULL;
  }

}
