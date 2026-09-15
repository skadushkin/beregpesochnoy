<?php

namespace Drupal\yandex_export\Commands;

use Drush\Commands\DrushCommands;
use Drupal\yandex_export\Service\YandexExportService;

/**
 * Defines Drush commands for exporting content.
 */
class YandexExportCommand extends DrushCommands {

  protected $exportService;

  public function __construct(YandexExportService $exportService) {
    $this->exportService = $exportService;
  }

  /**
   * Export content to XML.
   *
   * @command yandex_export:generate
   */
  public function generate() {
    $this->exportService->generateXml();
    $this->output()->writeln('XML экспортирован в /projects.xml');
  }
}
