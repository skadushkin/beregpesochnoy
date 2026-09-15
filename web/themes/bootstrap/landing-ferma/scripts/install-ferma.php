<?php

/**
 * Создаёт типы ferma_product / ferma_photo, Basic page /ferma и слайды с картинками.
 * drush php:script themes/bootstrap/landing-ferma/scripts/install-ferma.php
 */

use Drupal\Core\File\FileExists;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\file\Entity\File;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\path_alias\Entity\PathAlias;

$fs = \Drupal::service('file_system');
$display = \Drupal::service('entity_display.repository');
$theme_img = DRUPAL_ROOT . '/themes/bootstrap/landing-ferma/img';

function ferma_ensure_type(string $id, string $label, string $description): void {
  if (NodeType::load($id)) {
    return;
  }
  $type = NodeType::create([
    'type' => $id,
    'name' => $label,
    'description' => $description,
    'new_revision' => FALSE,
    'preview_mode' => 0,
    'display_submitted' => FALSE,
  ]);
  $type->save();
  echo "Created type $id\n";
}

function ferma_ensure_storage(string $name, array $values): void {
  if (FieldStorageConfig::loadByName('node', $name)) {
    return;
  }
  FieldStorageConfig::create($values + [
    'field_name' => $name,
    'entity_type' => 'node',
  ])->save();
  echo "Created storage $name\n";
}

function ferma_ensure_field(string $bundle, string $name, array $values): void {
  if (FieldConfig::loadByName('node', $bundle, $name)) {
    return;
  }
  FieldConfig::create($values + [
    'field_name' => $name,
    'entity_type' => 'node',
    'bundle' => $bundle,
  ])->save();
  echo "Attached $name to $bundle\n";
}

function ferma_file(string $source, string $dest_uri) {
  $fs = \Drupal::service('file_system');
  $dir = dirname($dest_uri);
  $fs->prepareDirectory($dir, \Drupal\Core\File\FileSystemInterface::CREATE_DIRECTORY | \Drupal\Core\File\FileSystemInterface::MODIFY_PERMISSIONS);
  $uri = $fs->copy($source, $dest_uri, FileExists::Replace);
  $existing = \Drupal::entityTypeManager()->getStorage('file')->loadByProperties(['uri' => $uri]);
  if ($existing) {
    $file = reset($existing);
  }
  else {
    $file = File::create([
      'uri' => $uri,
      'status' => 1,
      'uid' => 1,
    ]);
    $file->save();
  }
  return $file;
}

ferma_ensure_type('ferma_product', 'Продукт фермы', 'Карточки слайдера на странице /ferma');
ferma_ensure_type('ferma_photo', 'Фото фермы', 'Слайды «Снаружи / Внутри» на странице /ferma');

if (!FieldStorageConfig::loadByName('node', 'field_image')) {
  ferma_ensure_storage('field_image', [
    'type' => 'image',
    'cardinality' => 1,
    'settings' => [
      'uri_scheme' => 'public',
      'default_image' => [
        'uuid' => NULL,
        'alt' => '',
        'title' => '',
        'width' => NULL,
        'height' => NULL,
      ],
      'target_type' => 'file',
      'display_field' => FALSE,
      'display_default' => FALSE,
    ],
  ]);
}

ferma_ensure_storage('field_ferma_lead', [
  'type' => 'string',
  'cardinality' => 1,
  'settings' => ['max_length' => 255, 'is_ascii' => FALSE, 'case_sensitive' => FALSE],
]);
ferma_ensure_storage('field_ferma_plus', [
  'type' => 'string',
  'cardinality' => -1,
  'settings' => ['max_length' => 255, 'is_ascii' => FALSE, 'case_sensitive' => FALSE],
]);

foreach (['ferma_product', 'ferma_photo'] as $bundle) {
  ferma_ensure_field($bundle, 'field_image', [
    'label' => 'Изображение',
    'required' => TRUE,
    'settings' => [
      'file_directory' => 'ferma',
      'file_extensions' => 'png gif jpg jpeg webp',
      'max_filesize' => '',
      'max_resolution' => '',
      'min_resolution' => '',
      'alt_field' => TRUE,
      'alt_field_required' => FALSE,
      'title_field' => FALSE,
      'title_field_required' => FALSE,
      'default_image' => [
        'uuid' => NULL,
        'alt' => '',
        'title' => '',
        'width' => NULL,
        'height' => NULL,
      ],
      'handler' => 'default:file',
      'handler_settings' => [],
    ],
  ]);
}

ferma_ensure_field('ferma_product', 'field_ferma_lead', [
  'label' => 'Подзаголовок',
  'required' => FALSE,
]);
ferma_ensure_field('ferma_product', 'field_ferma_plus', [
  'label' => 'Преимущества',
  'required' => FALSE,
]);

foreach (['ferma_product', 'ferma_photo'] as $bundle) {
  $form = $display->getFormDisplay('node', $bundle, 'default');
  $form->setComponent('title', ['type' => 'string_textfield', 'weight' => 0]);
  $form->setComponent('field_image', ['type' => 'image_image', 'weight' => 1]);
  if ($bundle === 'ferma_product') {
    $form->setComponent('field_ferma_lead', ['type' => 'string_textfield', 'weight' => 2]);
    $form->setComponent('field_ferma_plus', ['type' => 'string_textfield', 'weight' => 3]);
  }
  $form->save();

  $view = $display->getViewDisplay('node', $bundle, 'default');
  $view->setComponent('field_image', ['type' => 'image', 'label' => 'hidden', 'weight' => 0]);
  if ($bundle === 'ferma_product') {
    $view->setComponent('field_ferma_lead', ['type' => 'string', 'label' => 'above', 'weight' => 1]);
    $view->setComponent('field_ferma_plus', ['type' => 'string', 'label' => 'above', 'weight' => 2]);
  }
  $view->save();
}

$plus = [
  'Кладовая витаминов и минералов',
  'Идеальна для контроля веса',
  'Мощная антиоксидантная защита',
];

$products = [
  ['title' => 'Руккола', 'file' => 'product-rukola.png', 'lead' => 'Неповторимая свежесть и глубина вкуса'],
  ['title' => 'Микрозелень', 'file' => 'product-microgreen.png', 'lead' => 'Неповторимая свежесть и глубина вкуса'],
];

foreach ($products as $item) {
  $exists = \Drupal::entityQuery('node')
    ->accessCheck(FALSE)
    ->condition('type', 'ferma_product')
    ->condition('title', $item['title'])
    ->range(0, 1)
    ->execute();
  if ($exists) {
    echo "Skip product {$item['title']}\n";
    continue;
  }
  $file = ferma_file($theme_img . '/' . $item['file'], 'public://ferma/' . $item['file']);
  $node = Node::create([
    'type' => 'ferma_product',
    'title' => $item['title'],
    'status' => 1,
    'uid' => 1,
    'field_ferma_lead' => $item['lead'],
    'field_ferma_plus' => $plus,
    'field_image' => [
      'target_id' => $file->id(),
      'alt' => $item['title'],
    ],
  ]);
  $node->save();
  echo "Created product nid {$node->id()} {$item['title']}\n";
}

$photos = [
  ['title' => 'Снаружи', 'file' => 'farm-outside.png'],
  ['title' => 'Внутри', 'file' => 'farm-inside.png'],
];
foreach ($photos as $item) {
  $exists = \Drupal::entityQuery('node')
    ->accessCheck(FALSE)
    ->condition('type', 'ferma_photo')
    ->condition('title', $item['title'])
    ->range(0, 1)
    ->execute();
  if ($exists) {
    echo "Skip photo {$item['title']}\n";
    continue;
  }
  $file = ferma_file($theme_img . '/' . $item['file'], 'public://ferma/' . $item['file']);
  $node = Node::create([
    'type' => 'ferma_photo',
    'title' => $item['title'],
    'status' => 1,
    'uid' => 1,
    'field_image' => [
      'target_id' => $file->id(),
      'alt' => $item['title'],
    ],
  ]);
  $node->save();
  echo "Created photo nid {$node->id()} {$item['title']}\n";
}

$page_type = NodeType::load('page') ? 'page' : (NodeType::load('basic') ? 'basic' : NULL);
if (!$page_type) {
  throw new \RuntimeException('Basic page type not found');
}

$existing_page = \Drupal::entityQuery('node')
  ->accessCheck(FALSE)
  ->condition('type', $page_type)
  ->condition('title', 'Свежая зелень круглый год')
  ->range(0, 1)
  ->execute();

if ($existing_page) {
  $page = Node::load(reset($existing_page));
  echo "Page exists nid {$page->id()}\n";
}
else {
  $page = Node::create([
    'type' => $page_type,
    'title' => 'Свежая зелень круглый год',
    'status' => 1,
    'uid' => 1,
  ]);
  $page->save();
  echo "Created page nid {$page->id()} type $page_type\n";
}

$alias_storage = \Drupal::entityTypeManager()->getStorage('path_alias');
$aliases = $alias_storage->loadByProperties(['alias' => '/ferma']);
if (!$aliases) {
  PathAlias::create([
    'path' => '/node/' . $page->id(),
    'alias' => '/ferma',
    'langcode' => 'ru',
  ])->save();
  echo "Created alias /ferma -> /node/{$page->id()}\n";
}
else {
  echo "Alias /ferma already exists\n";
}

echo "DONE page={$page->id()}\n";
