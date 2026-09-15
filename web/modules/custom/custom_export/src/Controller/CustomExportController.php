<?php

namespace Drupal\custom_export\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Drupal\Core\Messenger\MessengerInterface;
use Drupal\custom_export\Service\CustomExportService;

/**
 * Контроллер для экспорта данных.
 */
class CustomExportController extends ControllerBase {

  protected $exportService;
  protected $messenger;

  public function __construct(CustomExportService $exportService, MessengerInterface $messenger) {
    $this->exportService = $exportService;
    $this->messenger = $messenger;
  }

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('custom_export.service'),
      $container->get('messenger')
    );
  }

  public function exportPage() {
    $form = \Drupal::formBuilder()->getForm('Drupal\custom_export\Form\ExportForm');
    return [
      '#title' => 'Экспорт в XML',
      '#markup' => '<p>Нажмите кнопку, чтобы экспортировать данные.</p>',
      $form,
    ];
  }
}
