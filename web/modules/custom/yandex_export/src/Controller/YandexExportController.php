<?php

namespace Drupal\yandex_export\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Messenger\MessengerInterface;
use Drupal\yandex_export\Service\YandexExportService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Контроллер для экспорта данных.
 */
class YandexExportController extends ControllerBase {

  protected $exportService;
  protected $messenger;

  public function __construct(YandexExportService $exportService, MessengerInterface $messenger) {
    $this->exportService = $exportService;
    $this->messenger = $messenger;
  }

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('yandex_export.service'),
      $container->get('messenger')
    );
  }

  public function exportPage() {
    $form = \Drupal::formBuilder()->getForm('Drupal\yandex_export\Form\ExportForm');
    return [
      '#title' => 'Экспорт в XML',
      '#markup' => '<p>Нажмите кнопку, чтобы экспортировать данные.</p>',
      $form,
    ];
  }

  /**
   * Serves a public XML feed, generating it first if the file is missing.
   */
  public function serveFeed($filename) {
    $allowed = [
      'projects.xml',
      'direct_projects.xml',
      'projects_house.xml',
      'direct_projects_house.xml',
      'projects_under_construction.xml',
      'direct_projects_under_construction.xml',
    ];
    if (!in_array($filename, $allowed, TRUE)) {
      throw new NotFoundHttpException();
    }

    $path = $this->exportService->getFeedFilePath($filename);
    if (!$path) {
      $this->exportService->generateXml();
      $path = $this->exportService->getFeedFilePath($filename);
    }
    if (!$path) {
      throw new NotFoundHttpException();
    }

    return new Response(file_get_contents($path), 200, [
      'Content-Type' => 'application/xml; charset=utf-8',
    ]);
  }
}
