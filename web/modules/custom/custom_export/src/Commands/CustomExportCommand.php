<?php

namespace Drupal\custom_export\Commands;

use Drush\Commands\DrushCommands;
use Drupal\custom_export\Service\CustomExportService;

/**
 * Defines Drush commands for exporting content.
 */
class CustomExportCommand extends DrushCommands {

  protected $exportService;

  public function __construct(CustomExportService $exportService) {
    $this->exportService = $exportService;
  }

  /**
   * Export content to XML.
   *
   * @command custom_export:generate
   */
  public function generate() {
    $this->exportService->generateXml();
    $this->output()->writeln('XML экспортирован в /projects2.xml');
  }
}
