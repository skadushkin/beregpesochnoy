<?php

namespace Drupal\yandex_export\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\node\Entity\Node;

/**
 * Сервис для экспорта данных в XML.
 */
class YandexExportService {

  protected $database;
  protected $fileSystem;
  protected $fileUrlGenerator;

  public function __construct(Connection $database, FileSystemInterface $fileSystem) {
    $this->database = $database;
    $this->fileSystem = $fileSystem;
  }

  public function generateXml() {
    // Общий фид
    $this->generateFeed(['house', 'house_under_construction'], 'projects.xml');
    // Только готовые дома
    $this->generateFeed(['house'], 'projects_house.xml');
    // Только дома в строительстве
    $this->generateFeed(['house_under_construction'], 'projects_under_construction.xml');
  }

  protected function generateFeed(array $types, $filename) {
    // Категории в зависимости от типа фида
    if (count($types) === 1 && $types[0] === 'house') {
      $categoriesContent = '<category id="2">Готовые дома</category>';
      $categoryId = 2;
    }
    elseif (count($types) === 1 && $types[0] === 'house_under_construction') {
      $categoriesContent = '<category id="1">Дома с подрядом</category>';
      $categoryId = 1;
    }
    else {
      $categoriesContent = '<category id="1">Дома с подрядом</category><category id="2">Готовые дома</category>';
    }

    $content = '<?xml version="1.0" encoding="UTF-8"?>';
    $content .= '<yml_catalog date="' . date('Y-m-d H:i') . '">
                  <shop>
                  <name>Коттеджный поселок "Берег Песочной"</name>
                  <company>Коттеджный поселок "Берег Песочной"</company>
                  <url>https://beregpesochnoy.ru/</url>
                  <currencies>
                    <currency id="RUR" rate="1"/>
                  </currencies>
                  <categories>
                    ' . $categoriesContent . '
                  </categories>
                  <offers>';

    $content2 = '<?xml version="1.0" encoding="UTF-8"?>';
    $content2 .= '<realty-feed xmlns="http://webmaster.yandex.ru/schemas/feed/realty/2010-06">
    <generation-date>' . date('Y-m-d\TH:i:sP') . '</generation-date>';


    $nodes = $this->getNodesByType($types);

    foreach ($nodes as $node) {
      $item = Node::load($node->nid);
      if (!$item) {
        continue;
      }
      $project = NULL;
      if ($item->hasField('field_house_project') && !$item->get('field_house_project')->isEmpty()) {
        $project = Node::load($item->get('field_house_project')->target_id);
      }
      $categoriesContent2 = '';
      $price = 0;
      if ($item->getType() == 'house') {
        if ($item->hasField('field_house_price2') && !$item->get('field_house_price2')->isEmpty()) {
          $price = $item->get('field_house_price2')->value;
        }
        $categoriesContent2 = '<category>дом</category>';
        $categoryId = 2;
      } elseif ($item->getType() == 'house_under_construction') {
        $categoriesContent2 = '<category>дом с участком</category>';
        if ($item->hasField('field_lot_price2') && !$item->get('field_lot_price2')->isEmpty()) {
          $price = $item->get('field_lot_price2')->value;
        }
        $categoryId = 1;
      }

      if ($item->hasField('field_total_area') && !$item->field_total_area->isEmpty()) {
        $total_area = $item->field_total_area->value;
      } elseif ($project && $project->hasField('field_total_area') && !$project->field_total_area->isEmpty()) {
        $total_area = $project->field_total_area->value;
      } else {
        $total_area = 'Не указано';
      }

      $lot_area = $item->hasField('field_lot_area') ? $item->field_lot_area->value : 'Не указано';

      $content .= '<offer id="' . $node->nid . '" available="true">
        <name>Дом ' . ($project ? $project->getTitle() : 'Неизвестный проект') . ' площадью ' . $total_area . ' м² на участке ' . $lot_area . '</name>
        <vendor>Коттеджный поселок «Берег Песочной»</vendor>
        <url>https://beregpesochnoy.ru' . $item->toUrl()->toString() . '</url>';

      if ($price > 0) {
        $content .= '<price>' . $price . '</price>';
      }

      $content .= '<categoryId>' . $categoryId . '</categoryId>';

      if ($project && $project->hasField('field_project_images') && !$project->get('field_project_images')->isEmpty()) {
        foreach ($project->get('field_project_images') as $image) {
          if (!$image->entity) {
            continue;
          }
          $file_uri = $image->entity->getFileUri();
          $file_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file_uri);
          $content .= '<picture>' . $file_url . '</picture>';
        }
      }

      $description = $item->hasField('body') ? $item->body->value : '';
      $content .= '<description><![CDATA[' . strip_tags($description) . ']]></description>';
      $content .= '</offer>';
      if($price>0) {
        $content2 .= '
        <offer internal-id="' . $node->nid . '">
           <type>продажа</type>
           <property-type>жилая</property-type>
           '.$categoriesContent2.'
           <url>https://beregpesochnoy.ru' . $item->toUrl()->toString() . '</url>
           <creation-date>' . date('Y-m-d\TH:i:sP') . '</creation-date>
           <location>
               <country>Россия</country>
               <region>Московская область</region>
               <district>городской округ Истра</district>
               <locality-name>коттеджный посёлок Берег Песочной</locality-name>
               <address>Лесная улица, 1</address>
           </location>
           <sales-agent>
               <phone>+7 (495) 877-44-58</phone>
               <category>застройщик</category>
               <name>ООО «АгроКом»</name>
           </sales-agent>
           <price>
               <value>' . $price . '</value>
               <currency>RUB</currency>
           </price>
           <lot-area>
                <value>' . $lot_area . '</value>
                <unit>сотка</unit>
            </lot-area>';
            if ($project && $project->hasField('field_project_images') && !$project->get('field_project_images')->isEmpty()) {
              foreach ($project->get('field_project_images') as $image) {
                if (!$image->entity) {
                  continue;
                }
                $file_uri = $image->entity->getFileUri();
                $file_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file_uri);
                $content2 .= '<image>' . $file_url . '</image>';
              }
            }
          $content2 .= '<description><![CDATA[ ' . strip_tags($description) . ' ]]></description>';
          $content2 .= '</offer>';
      }
      

//    <offer id="' . $node['nid'] . '" available="true">
//     ' . $params . '
//     <name>Дом ' . $project->title . ' площадью ' . $total_area . 'м2 на участке ' . $item->field_lot_area['und'][0]['value'] . '</name>
     


      //$content .= '</offer>';
      
    }

    $content .= '</offers></shop></yml_catalog>';
    $content2 .= '</realty-feed>';


    $this->writeXmlFile($filename, $content);
    $this->writeXmlFile('direct_' . $filename, $content2);
  }

  /**
   * Writes feed XML into public files and the site docroot.
   */
  protected function writeXmlFile($filename, $content) {
    $this->fileSystem->saveData($content, 'public://' . $filename, FileExists::Replace);
    file_put_contents(DRUPAL_ROOT . '/' . $filename, $content);
  }

  /**
   * Absolute path of a generated feed, or NULL if it is missing.
   */
  public function getFeedFilePath($filename) {
    $rootPath = DRUPAL_ROOT . '/' . $filename;
    if (is_file($rootPath)) {
      return $rootPath;
    }
    $publicPath = $this->fileSystem->realpath('public://' . $filename);
    if ($publicPath && is_file($publicPath)) {
      return $publicPath;
    }
    return NULL;
  }

  protected function getNodesByType(array $types) {
    $query = $this->database->select('node_field_data', 'n')
      ->fields('n', ['nid'])
      ->condition('n.status', 1)
      ->condition('n.type', $types, 'IN');

    return $query->execute()->fetchAll();
  }
}
