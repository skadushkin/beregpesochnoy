<?php

namespace Drupal\custom_export\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Url;
use Drupal\node\Entity\Node;

/**
 * Сервис для экспорта данных в XML.
 */
class CustomExportService {

  protected $database;
  protected $fileSystem;
  protected $fileUrlGenerator;

  public function __construct(Connection $database, FileSystemInterface $fileSystem) {
    $this->database = $database;
    $this->fileSystem = $fileSystem;
  }

  public function generateXml() {
    $categoriesContent = '<category id="1">Дома с подрядом</category>';

    $content = '<?xml version="1.0" encoding="UTF-8"?>';
    $content .= '<yml_catalog date="' . date('Y-m-d H:i') . '">
                  <shop>
                  <name>Коттеджный поселок «Берег Песочной»</name>
                  <company>Коттеджный поселок «Берег Песочной»</company>
                  <url>https://beregpesochnoy.ru/</url>
                  <currencies>
                    <currency id="RUR" rate="1"/>
                  </currencies>
                  <categories>
                    ' . $categoriesContent . '
                  </categories>
                  <offers>';

    // Получаем ноды всех нужных типов
    $nodes = $this->getNodesByType(['house', 'house_under_construction', 'lot']);

    foreach ($nodes as $node) {
      $item = Node::load($node->nid);
      $project = isset($item->field_house_project->target_id) ? Node::load($item->field_house_project->target_id) : null;

      $price = $item->get('field_project_price')->value ?? 0;
      $total_area = $item->get('field_total_area')->value ?? ($project ? $project->get('field_total_area')->value : 'Не указано');
      $lot_area = $item->get('field_lot_area')->value ?? 'Не указано';

      $content .= '<offer id="' . $node->nid . '" available="true">
        <name>Дом ' . ($project ? $project->getTitle() : 'Неизвестный проект') . ' площадью ' . $total_area . ' м² на участке ' . $lot_area . '</name>
        <vendor>Коттеджный поселок «Берег Песочной»</vendor>
        <url>https://beregpesochnoy.ru' . $item->toUrl()->toString() . '</url>';

      if ($price > 0) {
        $content .= '<price>' . $price . '</price>';
      }

      $content .= '<categoryId>1</categoryId>';

      // Изображения
      if ($project && !$project->get('field_project_images')->isEmpty()) {
        foreach ($project->get('field_project_images') as $image) {
          $content .= '<picture>https://beregpesochnoy.ru' . file_create_url($image->entity->getFileUri()) . '</picture>';
        }
      }

      $description = $item->get('body')->value ?? '';
      $content .= '<description><![CDATA[' . strip_tags($description) . ']]></description>';
      $content .= '</offer>';
    }

    $content .= '</offers></shop></yml_catalog>';

    // Сохраняем XML в файл
    $filePath = $this->fileSystem->realpath('public://projects.xml');
    file_put_contents($filePath, $content);
  }

  /**
   * Получает ноды по типу.
   */
  protected function getNodesByType(array $types) {
    $query = $this->database->select('node_field_data', 'n')
      ->fields('n', ['nid'])
      ->condition('n.status', 1)
      ->condition('n.type', $types, 'IN');

    return $query->execute()->fetchAll();
  }
}
