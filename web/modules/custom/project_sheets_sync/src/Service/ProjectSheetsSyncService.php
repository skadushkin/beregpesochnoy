<?php

namespace Drupal\project_sheets_sync\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\node\NodeInterface;
use Drupal\project_sheets_sync\ConstructionFinish;
use GuzzleHttp\ClientInterface;

/**
 * Читает Google Sheet и обновляет ноды проектов по Id.
 *
 * Колонки Лист1 (с D):
 * D название, E готовность, F Id, G лот, H площадь,
 * I кадастр, J цена/сотка, K стоимость дома, L общая сумма (цена на сайте),
 * M окончание строительства.
 */
class ProjectSheetsSyncService {

  protected ClientInterface $httpClient;

  protected EntityTypeManagerInterface $entityTypeManager;

  protected ConfigFactoryInterface $configFactory;

  protected $logger;

  public function __construct(
    ClientInterface $http_client,
    EntityTypeManagerInterface $entity_type_manager,
    ConfigFactoryInterface $config_factory,
    LoggerChannelFactoryInterface $logger_factory
  ) {
    $this->httpClient = $http_client;
    $this->entityTypeManager = $entity_type_manager;
    $this->configFactory = $config_factory;
    $this->logger = $logger_factory->get('project_sheets_sync');
  }

  /**
   * Забирает строки из таблицы.
   *
   * @return array<int, array<string, mixed>>
   *   Нормализованные строки с ключами id, name, readiness, lot, area, ...
   */
  public function fetchRows(): array {
    $config = $this->configFactory->get('project_sheets_sync.settings');
    $spreadsheet_id = trim((string) $config->get('spreadsheet_id'));
    $api_key = trim((string) $config->get('api_key'));
    $range = trim((string) $config->get('range')) ?: 'A5:Z200';
    $range = $this->expandRangeToIncludeFinishColumn($range);

    if ($spreadsheet_id === '' || $api_key === '') {
      throw new \RuntimeException('Не заданы spreadsheet_id или api_key в project_sheets_sync.settings.');
    }

    $url = sprintf(
      'https://sheets.googleapis.com/v4/spreadsheets/%s/values/%s',
      rawurlencode($spreadsheet_id),
      rawurlencode($range)
    );

    $response = $this->httpClient->request('GET', $url, [
      'query' => ['key' => $api_key],
      'timeout' => 30,
    ]);
    $data = json_decode((string) $response->getBody(), TRUE);
    if (!is_array($data) || empty($data['values']) || !is_array($data['values'])) {
      throw new \RuntimeException('Пустой ответ Google Sheets API.');
    }

    $rows = [];
    $header_seen = FALSE;
    $finish_index = 12;
    foreach ($data['values'] as $raw) {
      if (!is_array($raw)) {
        continue;
      }
      // Данные начинаются с колонки D (индекс 3).
      $name = $this->cell($raw, 3);
      $readiness = $this->cell($raw, 4);
      $id_raw = $this->cell($raw, 5);

      if (!$header_seen && (mb_stripos($name, 'название') !== FALSE || mb_stripos($id_raw, 'id') !== FALSE)) {
        $header_seen = TRUE;
        $detected = $this->detectFinishColumn($raw);
        if ($detected !== NULL) {
          $finish_index = $detected;
        }
        continue;
      }
      $header_seen = TRUE;

      $nid = (int) preg_replace('/\D+/', '', $id_raw);
      if ($nid <= 0) {
        continue;
      }

      $rows[$nid] = [
        'id' => $nid,
        'name' => $name,
        'readiness' => $readiness,
        'lot' => $this->parseLotNumber($this->cell($raw, 6)),
        'lot_raw' => $this->cell($raw, 6),
        'area' => $this->parseDecimal($this->cell($raw, 7)),
        'cadastral' => $this->cell($raw, 8),
        'price_per_sotka' => $this->parseMoney($this->cell($raw, 9)),
        'house_price' => $this->parseMoney($this->cell($raw, 10)),
        'total_price' => $this->parseMoney($this->cell($raw, 11)),
        'construction_finish' => $this->cell($raw, $finish_index) !== ''
          ? $this->cell($raw, $finish_index)
          : $this->cell($raw, 12),
      ];
    }

    return array_values($rows);
  }

  /**
   * Синхронизирует ноды.
   *
   * @param bool $dry_run
   *   Только отчёт, без сохранения.
   *
   * @return array{updated: int, skipped: int, missing: int, messages: string[]}
   */
  public function sync(bool $dry_run = FALSE): array {
    $result = [
      'updated' => 0,
      'skipped' => 0,
      'missing' => 0,
      'messages' => [],
    ];
    $finish_in_sheet = 0;
    $finish_written = 0;
    $finish_no_field = 0;
    $finish_ids = [];

    $rows = $this->fetchRows();
    $storage = $this->entityTypeManager->getStorage('node');

    foreach ($rows as $row) {
      /** @var \Drupal\node\NodeInterface|null $node */
      $node = $storage->load($row['id']);
      if (!$node instanceof NodeInterface) {
        $result['missing']++;
        $result['messages'][] = "nid {$row['id']}: нода не найдена ({$row['name']}).";
        continue;
      }

      $changed = FALSE;
      $bundle = $node->bundle();
      $changes = [];

      // Площадь участка.
      if ($row['area'] !== NULL && $node->hasField('field_lot_area')) {
        $current = $node->get('field_lot_area')->value;
        if ((string) $current !== (string) $row['area']) {
          $node->set('field_lot_area', $row['area']);
          $changed = TRUE;
          $changes[] = "площадь {$current} → {$row['area']}";
        }
      }

      // Номер лота (в шаблонах: «Участок №{{ field_lot_number }}»).
      if ($row['lot'] !== NULL && $node->hasField('field_lot_number')) {
        $current = (string) $node->get('field_lot_number')->value;
        $next = (string) $row['lot'];
        if ($current !== $next) {
          $node->set('field_lot_number', $next);
          $changed = TRUE;
          $changes[] = "лот {$current} → {$next}";
        }
      }

      // Колонка L «Общая сумма» — цена на сайте (дом + участок).
      // Колонку K «Стоимость дома» не пишем в эти поля: иначе 19 млн затираются 13 млн.
      $selling_price = $row['total_price'] ?? $row['house_price'];
      if ($selling_price !== NULL) {
        $price_fields = $this->priceFieldsForBundle($bundle);
        foreach ($price_fields as $field_name) {
          if (!$node->hasField($field_name)) {
            continue;
          }
          $current = $node->get($field_name)->value;
          if ((string) $current !== (string) $selling_price) {
            $node->set($field_name, $selling_price);
            $changed = TRUE;
            $changes[] = "{$field_name} {$current} → {$selling_price}";
          }
        }
      }

      // Окончание строительства (field_okonchanie_stroitelstva или поле с похожим названием).
      $finish_field = $this->finishFieldName($node);
      $finish_raw = trim((string) ($row['construction_finish'] ?? ''));
      if ($finish_raw !== '') {
        $finish_in_sheet++;
        $finish_ids[] = (string) $row['id'];
        if (!$finish_field) {
          $finish_no_field++;
          $result['messages'][] = "nid {$row['id']}: в таблице срок «{$finish_raw}», но на типе «{$bundle}» нет поля окончания строительства.";
        }
        else {
          try {
            $finish_changed = $this->syncConstructionFinish($node, $finish_field, $finish_raw);
            if ($finish_changed) {
              $changed = TRUE;
              $changes[] = $finish_changed;
              $finish_written++;
            }
          }
          catch (\Throwable $e) {
            $result['messages'][] = "nid {$row['id']}: срок сдачи не записан ({$e->getMessage()}). Значение: «{$finish_raw}».";
          }
        }
      }

      // Готовность = тип контента; только предупреждение.
      $expected_bundle = $this->bundleFromReadiness($row['readiness']);
      if ($expected_bundle && $expected_bundle !== $bundle) {
        $result['messages'][] = "nid {$row['id']}: в таблице «{$row['readiness']}» (ожидали {$expected_bundle}), на сайте тип «{$bundle}» — тип не меняем.";
      }

      if (!$changed) {
        $result['skipped']++;
        $result['messages'][] = "nid {$row['id']} ({$bundle}): без изменений.";
        continue;
      }

      if ($dry_run) {
        $result['updated']++;
        $result['messages'][] = "[dry-run] nid {$row['id']} ({$bundle}): " . implode('; ', $changes);
        continue;
      }

      $node->setNewRevision(TRUE);
      $node->setRevisionLogMessage('Обновление из Google Sheets (project_sheets_sync).');
      $node->save();
      $result['updated']++;
      $result['messages'][] = "nid {$row['id']} ({$bundle}): " . implode('; ', $changes);
      $this->logger->notice('Updated node @nid: @changes', [
        '@nid' => $row['id'],
        '@changes' => implode('; ', $changes),
      ]);
    }

    $result['messages'][] = sprintf(
      'Срок сдачи: в таблице заполнено %d%s, записано %d, нет поля на ноде %d.',
      $finish_in_sheet,
      $finish_ids ? ' (id ' . implode(', ', $finish_ids) . ')' : '',
      $finish_written,
      $finish_no_field
    );

    return $result;
  }

  /**
   * @return string[]
   */
  protected function priceFieldsForBundle(string $bundle): array {
    switch ($bundle) {
      case 'house':
        return ['field_house_price', 'field_house_price2'];

      case 'house_under_construction':
        // Шаблоны показывают field_house_price раньше lot-полей.
        return ['field_house_price', 'field_house_price2', 'field_lot_price', 'field_lot_price2'];

      case 'lot':
        return ['field_lot_price', 'field_lot_price2'];

      case 'project':
      case 'townhouse':
        return ['field_project_price'];

      default:
        return ['field_lot_price', 'field_lot_price2', 'field_house_price', 'field_house_price2'];
    }
  }

  protected function bundleFromReadiness(string $readiness): ?string {
    $value = mb_strtolower(trim($readiness));
    if ($value === '') {
      return NULL;
    }
    if (str_contains($value, 'готов')) {
      return 'house';
    }
    if (str_contains($value, 'стро')) {
      return 'house_under_construction';
    }
    return NULL;
  }

  protected function detectFinishColumn(array $header): ?int {
    foreach ($header as $index => $cell) {
      $label = mb_strtolower(trim((string) $cell));
      if ($label === '') {
        continue;
      }
      if (
        mb_strpos($label, 'окончан') !== FALSE
        || mb_strpos($label, 'квартал') !== FALSE
        || (mb_strpos($label, 'срок') !== FALSE && mb_strpos($label, 'строит') !== FALSE)
      ) {
        return (int) $index;
      }
    }
    return NULL;
  }

  protected function expandRangeToIncludeFinishColumn(string $range): string {
    $expanded = preg_replace('/:([A-L])(\d+)?/i', ':Z$2', $range);
    return $expanded ?: 'A5:Z200';
  }

  protected function finishFieldName(NodeInterface $node): ?string {
    if ($node->hasField('field_okonchanie_stroitelstva')) {
      return 'field_okonchanie_stroitelstva';
    }
    foreach ($node->getFieldDefinitions() as $name => $definition) {
      $haystack = mb_strtolower($name . ' ' . $definition->getLabel());
      if (
        mb_strpos($haystack, 'okonchan') !== FALSE
        || mb_strpos($haystack, 'окончан') !== FALSE
        || (mb_strpos($haystack, 'срок') !== FALSE && mb_strpos($haystack, 'строит') !== FALSE)
      ) {
        return $name;
      }
    }
    return NULL;
  }

  /**
   * @return string|null Текст изменения или NULL.
   */
  protected function syncConstructionFinish(NodeInterface $node, string $field_name, string $sheet_value): ?string {
    $definition = $node->getFieldDefinition($field_name);
    $field_type = $definition ? $definition->getType() : 'datetime';
    $item = $node->get($field_name)->first();
    $current = $item ? (string) ($item->value ?? '') : '';

    $parsed = ConstructionFinish::fromSheetCell($sheet_value, $field_type);
    if ($parsed === NULL) {
      throw new \RuntimeException('не распознано значение «' . $sheet_value . '»');
    }

    $next = $this->storageValueForFinishField($field_type, $definition, $parsed);
    if ($this->finishValuesEqual($field_type, $current, $next)) {
      return NULL;
    }

    $this->applyFinishValue($node, $field_name, $field_type, $next);
    return $field_name . ' → ' . $parsed['label'];
  }

  /**
   * @param array{storage: string, label: string} $parsed
   *
   * @return mixed
   */
  protected function storageValueForFinishField(string $field_type, $definition, array $parsed) {
    $storage = $parsed['storage'];
    switch ($field_type) {
      case 'datetime':
        $settings = $definition ? $definition->getSettings() : [];
        if (($settings['datetime_type'] ?? 'date') === 'datetime' && strlen($storage) === 10) {
          return $storage . 'T00:00:00';
        }
        return $storage;

      case 'daterange':
        $start = $storage;
        if (strlen($start) >= 10) {
          $start = substr($start, 0, 10);
        }
        $end = date('Y-m-t', strtotime($start) ?: time());
        return [
          'value' => $start,
          'end_value' => $end,
        ];

      case 'timestamp':
        return (int) $storage;

      case 'list_string':
        $allowed = $definition ? ($definition->getSetting('allowed_values') ?: []) : [];
        if (isset($allowed[$parsed['label']])) {
          return $parsed['label'];
        }
        if (isset($allowed[$parsed['storage']])) {
          return $parsed['storage'];
        }
        foreach (array_keys($allowed) as $key) {
          if (mb_stripos((string) $key, (string) ($parsed['label'] ?? '')) !== FALSE) {
            return $key;
          }
        }
        return $parsed['label'];

      case 'string':
      case 'string_long':
      case 'text':
      case 'text_long':
      case 'text_with_summary':
        return $parsed['label'];

      default:
        return $storage;
    }
  }

  protected function finishValuesEqual(string $field_type, string $current, $next): bool {
    if ($field_type === 'daterange' && is_array($next)) {
      return substr($current, 0, 10) === substr((string) ($next['value'] ?? ''), 0, 10);
    }
    $next_string = is_array($next) ? (string) ($next['value'] ?? '') : (string) $next;
    if ($field_type === 'datetime') {
      return substr($current, 0, 10) === substr($next_string, 0, 10) && $current !== '';
    }
    return $current === $next_string;
  }

  protected function applyFinishValue(NodeInterface $node, string $field_name, string $field_type, $next): void {
    if (in_array($field_type, ['datetime', 'daterange'], TRUE)) {
      $node->set($field_name, is_array($next) ? $next : ['value' => $next]);
      return;
    }
    $node->set($field_name, $next);
  }

  protected function cell(array $row, int $index): string {
    if (!isset($row[$index])) {
      return '';
    }
    return trim((string) $row[$index]);
  }

  protected function parseLotNumber(string $value): ?string {
    $value = trim($value);
    if ($value === '' || $value === '-') {
      return NULL;
    }
    if (preg_match('/(\d+)/u', $value, $m)) {
      return $m[1];
    }
    return $value;
  }

  protected function parseDecimal(string $value): ?string {
    $value = trim($value);
    if ($value === '' || $value === '-') {
      return NULL;
    }
    $value = str_replace([' ', "\xc2\xa0"], '', $value);
    $value = str_replace(',', '.', $value);
    if (!is_numeric($value)) {
      return NULL;
    }
    return rtrim(rtrim(number_format((float) $value, 2, '.', ''), '0'), '.') ?: '0';
  }

  protected function parseMoney(string $value): ?int {
    $value = trim($value);
    if ($value === '' || $value === '-' || $value === '\\-') {
      return NULL;
    }
    $value = str_replace([' ', "\xc2\xa0", '₽', 'руб.', 'руб'], '', $value);
    $value = str_replace(',', '.', $value);
    if (!is_numeric($value)) {
      return NULL;
    }
    return (int) round((float) $value);
  }

}
