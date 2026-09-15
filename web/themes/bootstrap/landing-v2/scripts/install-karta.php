<?php

/**
 * Создаёт Basic page с алиасом /karta для карты инфраструктуры.
 * drush php:script themes/bootstrap/landing-v2/scripts/install-karta.php
 */

use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\path_alias\Entity\PathAlias;

$title = 'Карта инфраструктуры';
$alias = '/karta';

$page_type = NodeType::load('page') ? 'page' : (NodeType::load('basic') ? 'basic' : NULL);
if (!$page_type) {
  throw new \RuntimeException('Basic page type not found');
}

$alias_storage = \Drupal::entityTypeManager()->getStorage('path_alias');
$existing_alias = $alias_storage->loadByProperties(['alias' => $alias]);

if ($existing_alias) {
  $path_alias = reset($existing_alias);
  $nid = (int) str_replace('/node/', '', $path_alias->getPath());
  echo "Alias {$alias} already exists -> nid {$nid}\n";
  echo "DONE page={$nid}\n";
  return;
}

$nids = \Drupal::entityQuery('node')
  ->accessCheck(FALSE)
  ->condition('type', $page_type)
  ->condition('title', $title)
  ->range(0, 1)
  ->execute();

if ($nids) {
  $page = Node::load(reset($nids));
  echo "Page exists nid {$page->id()}\n";
}
else {
  $page = Node::create([
    'type' => $page_type,
    'title' => $title,
    'status' => 1,
    'uid' => 1,
  ]);
  $page->save();
  echo "Created page nid {$page->id()}\n";
}

PathAlias::create([
  'path' => '/node/' . $page->id(),
  'alias' => $alias,
  'langcode' => 'ru',
])->save();

echo "Created alias {$alias} -> /node/{$page->id()}\n";
echo "DONE page={$page->id()}\n";
