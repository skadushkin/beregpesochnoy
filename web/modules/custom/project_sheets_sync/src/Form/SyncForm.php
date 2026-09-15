<?php

namespace Drupal\project_sheets_sync\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\project_sheets_sync\Service\ProjectSheetsSyncService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Настройки и запуск синхронизации из Google Sheets.
 */
class SyncForm extends ConfigFormBase {

  protected ProjectSheetsSyncService $syncService;

  public function __construct($config_factory, ProjectSheetsSyncService $sync_service) {
    parent::__construct($config_factory);
    $this->syncService = $sync_service;
  }

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('config.factory'),
      $container->get('project_sheets_sync.sync')
    );
  }

  protected function getEditableConfigNames() {
    return ['project_sheets_sync.settings'];
  }

  public function getFormId() {
    return 'project_sheets_sync_form';
  }

  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('project_sheets_sync.settings');

    $form['spreadsheet_id'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Spreadsheet ID'),
      '#default_value' => $config->get('spreadsheet_id'),
      '#required' => TRUE,
    ];
    $form['api_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Google API key'),
      '#default_value' => $config->get('api_key'),
      '#required' => TRUE,
      '#description' => $this->t('Лучше задать через settings.php: $config[\'project_sheets_sync.settings\'][\'api_key\'].'),
    ];
    $form['range'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Диапазон'),
      '#default_value' => $config->get('range') ?: 'A5:Z200',
      '#description' => $this->t('Например A5:Z200. Заголовок в строке 5, данные с колонки D, окончание строительства — колонка M.'),
    ];

    $form['actions']['#type'] = 'actions';
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Сохранить настройки'),
      '#button_type' => 'secondary',
      '#submit' => ['::submitForm'],
    ];
    $form['actions']['dry_run'] = [
      '#type' => 'submit',
      '#value' => $this->t('Проверить (dry-run)'),
      '#submit' => ['::submitDryRun'],
    ];
    $form['actions']['sync'] = [
      '#type' => 'submit',
      '#value' => $this->t('Обновить проекты'),
      '#button_type' => 'primary',
      '#submit' => ['::submitSync'],
    ];

    return $form;
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->config('project_sheets_sync.settings')
      ->set('spreadsheet_id', trim((string) $form_state->getValue('spreadsheet_id')))
      ->set('api_key', trim((string) $form_state->getValue('api_key')))
      ->set('range', trim((string) $form_state->getValue('range')))
      ->save();
    $this->messenger()->addStatus($this->t('Настройки сохранены.'));
  }

  public function submitDryRun(array &$form, FormStateInterface $form_state) {
    $this->submitForm($form, $form_state);
    $this->runSync(TRUE);
  }

  public function submitSync(array &$form, FormStateInterface $form_state) {
    $this->submitForm($form, $form_state);
    $this->runSync(FALSE);
  }

  protected function runSync(bool $dry_run): void {
    try {
      $result = $this->syncService->sync($dry_run);
    }
    catch (\Throwable $e) {
      $this->messenger()->addError($e->getMessage());
      return;
    }

    $this->messenger()->addStatus($this->t('Обновлено: @u, без изменений: @s, не найдено: @m', [
      '@u' => $result['updated'],
      '@s' => $result['skipped'],
      '@m' => $result['missing'],
    ]));
    foreach (array_slice($result['messages'], 0, 80) as $message) {
      $this->messenger()->addMessage($message);
    }
    if (count($result['messages']) > 80) {
      $this->messenger()->addWarning($this->t('Показаны первые 80 строк лога.'));
    }
  }

}
