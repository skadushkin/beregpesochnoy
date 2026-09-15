<?php

namespace Drupal\custom_export\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\custom_export\Service\CustomExportService;

/**
 * Форма запуска экспорта.
 */
class ExportForm extends FormBase {

  protected $exportService;

  public function __construct(CustomExportService $exportService) {
    $this->exportService = $exportService;
  }

  public static function create(ContainerInterface $container) {
    return new static($container->get('custom_export.service'));
  }

  public function getFormId() {
    return 'custom_export_form';
  }

  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['submit'] = [
      '#type' => 'submit',
      '#value' => 'Запустить экспорт',
    ];
    return $form;
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->exportService->generateXml();
    \Drupal::messenger()->addMessage('XML-файл успешно создан!');
  }
}
