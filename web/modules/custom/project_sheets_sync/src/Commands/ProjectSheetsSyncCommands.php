<?php

namespace Drupal\project_sheets_sync\Commands;

use Drupal\project_sheets_sync\Service\ProjectSheetsSyncService;
use Drush\Commands\DrushCommands;

/**
 * Drush-команды синхронизации проектов из Google Sheets.
 */
class ProjectSheetsSyncCommands extends DrushCommands {

  protected ProjectSheetsSyncService $syncService;

  public function __construct(ProjectSheetsSyncService $sync_service) {
    parent::__construct();
    $this->syncService = $sync_service;
  }

  /**
   * Обновить проекты из Google Таблицы по Id.
   *
   * @command project-sheets:sync
   * @aliases pss-sync
   * @option dry-run Только показать изменения, не сохранять
   * @usage project-sheets:sync
   * @usage project-sheets:sync --dry-run
   */
  public function sync(array $options = ['dry-run' => FALSE]) {
    $dry_run = !empty($options['dry-run']);
    try {
      $result = $this->syncService->sync($dry_run);
    }
    catch (\Throwable $e) {
      $this->logger()->error($e->getMessage());
      return self::EXIT_FAILURE;
    }

    $this->output()->writeln(sprintf(
      'updated=%d skipped=%d missing=%d%s',
      $result['updated'],
      $result['skipped'],
      $result['missing'],
      $dry_run ? ' (dry-run)' : ''
    ));
    foreach ($result['messages'] as $message) {
      $this->output()->writeln($message);
    }

    return self::EXIT_SUCCESS;
  }

  /**
   * Показать строки, которые пришли из таблицы.
   *
   * @command project-sheets:preview
   * @aliases pss-preview
   */
  public function preview() {
    try {
      $rows = $this->syncService->fetchRows();
    }
    catch (\Throwable $e) {
      $this->logger()->error($e->getMessage());
      return self::EXIT_FAILURE;
    }

    foreach ($rows as $row) {
      $this->output()->writeln(sprintf(
        'id=%d name=%s readiness=%s lot=%s area=%s total=%s house=%s finish=%s',
        $row['id'],
        $row['name'],
        $row['readiness'],
        $row['lot'] ?? '-',
        $row['area'] ?? '-',
        $row['total_price'] ?? '-',
        $row['house_price'] ?? '-',
        $row['construction_finish'] !== '' ? $row['construction_finish'] : '-'
      ));
    }
    $this->output()->writeln('rows=' . count($rows));
    return self::EXIT_SUCCESS;
  }

}
