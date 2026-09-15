<?php

namespace Drupal\svg_tooltip\Controller;

use Drupal\node\Entity\Node;
use Drupal\svg_tooltip\ConstructionFinishLabel;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class NodeInfoController
{
    public function getNodeInfo($nid)
    {
        if ($nid == '99999') {
            $response_data = [
                'title' => 'Резеденции',
                'image' => '/sites/default/files/field/image/alverin.jpg',
                'link' => '/rezidents/',
            ];
        }
        else {
            $node = Node::load($nid);
            if (!$node) {
                return new JsonResponse(['error' => 'Node not found'], Response::HTTP_NOT_FOUND);
            }

            // Unpublished / access-denied construction nodes still appear on the genplan.
            // Prefer a published house page with the same cadastral number (or known remap).
            $linkOverrides = [
                '580' => 934, // Лот №22
                '634' => 935, // Лот №23
            ];
            if (!$node->access('view') && isset($linkOverrides[(string) $nid])) {
                $overrideNode = Node::load($linkOverrides[(string) $nid]);
                if ($overrideNode && $overrideNode->access('view')) {
                    $node = $overrideNode;
                }
            }
            elseif (!$node->access('view') && $node->hasField('field_kn_uchastka') && !$node->get('field_kn_uchastka')->isEmpty()) {
                $kn = $node->get('field_kn_uchastka')->value;
                $ids = \Drupal::entityQuery('node')
                    ->accessCheck(TRUE)
                    ->condition('status', 1)
                    ->condition('field_kn_uchastka', $kn)
                    ->condition('nid', $nid, '<>')
                    ->range(0, 1)
                    ->execute();
                if ($ids) {
                    $overrideNode = Node::load(reset($ids));
                    if ($overrideNode && $overrideNode->access('view')) {
                        $node = $overrideNode;
                    }
                }
            }

            $related_node = null;
            if ($node->hasField('field_house_project') && !$node->get('field_house_project')->isEmpty()) {
                $related_node = Node::load($node->get('field_house_project')->target_id);
            }

            $response_data = [
                'title' => $node->label(),
                'link' => $node->toUrl()->toString(),
                'type' => $node->bundle(),
            ];

            if ($node->hasField('field_kn_uchastka') && !$node->field_kn_uchastka->isEmpty()) {
                $response_data['kn'] = $node->field_kn_uchastka->value;
            }

            if ($node->hasField('field_lot_number') && !$node->get('field_lot_number')->isEmpty()) {
                $response_data['lot_number'] = (string) $node->get('field_lot_number')->value;
            }

            if ($node->bundle() == 'house_under_construction') {
                $response_data['house_under_construction'] = 1;
            }

            try {
                $finish = ConstructionFinishLabel::fromEntity($node);
                if ($finish) {
                    $response_data['construction_finish'] = $finish;
                }
            }
            catch (\Throwable $e) {
                // Плашка срока сдачи не должна ронять информер.
            }

            $residenceLots = [983, 984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 996, 997];
            if (in_array((int) $nid, $residenceLots, TRUE) || in_array((int) $node->id(), $residenceLots, TRUE)) {
                $response_data['residence_lot'] = 1;
            }

            // Участок с подрядом (bundle lot) — отдельная карточка на генплане.
            if ($node->bundle() === 'lot') {
                $response_data['land_with_contract'] = 1;
            }

            if ($related_node) {
                if ($related_node->hasField('field_project_images') && !$related_node->get('field_project_images')->isEmpty()) {
                    $image = $related_node->get('field_project_images')->first()->entity;
                    if ($image) {
                        $response_data['image'] = \Drupal::service('file_url_generator')->generateAbsoluteString($image->getFileUri());
                    }
                }
            }

            if ($node->hasField('field_house_price') && !$node->get('field_house_price')->isEmpty()) {
                $response_data['price'] = number_format($node->get('field_house_price')->value, 0, ',', ' ') . ' ₽';
            }
            elseif ($node->hasField('field_house_price2') && !$node->get('field_house_price2')->isEmpty()) {
                $response_data['price'] = number_format($node->get('field_house_price2')->value, 0, ',', ' ') . ' ₽';
            }
            elseif ($related_node && $related_node->hasField('field_project_price') && !$related_node->get('field_project_price')->isEmpty()) {
                $response_data['price'] = number_format($related_node->get('field_project_price')->value, 0, ',', ' ') . ' ₽';
            }
            elseif ($node->hasField('field_lot_price') && !$node->get('field_lot_price')->isEmpty() && $node->get('field_lot_price')->value > 0) {
                $response_data['price'] = number_format($node->get('field_lot_price')->value, 0, ',', ' ') . ' ₽';
            }
            elseif ($node->hasField('field_lot_price2') && !$node->get('field_lot_price2')->isEmpty()) {
                $response_data['price'] = number_format($node->get('field_lot_price2')->value, 0, ',', ' ') . ' ₽';
            }

            if ($node->hasField('field_mainproject_image') && !$node->get('field_mainproject_image')->isEmpty()) {
                $image = $node->get('field_mainproject_image')->first()->entity;
                if ($image) {
                    $response_data['image'] = \Drupal::service('file_url_generator')->generateAbsoluteString($image->getFileUri());
                }
            }

            $area = null;
            if ($node->hasField('field_house_area') && !$node->get('field_house_area')->isEmpty()) {
                $area = $node->get('field_house_area')->value;
            }
            elseif ($node->hasField('field_total_area') && !$node->get('field_total_area')->isEmpty()) {
                $area = $node->get('field_total_area')->value;
            }
            elseif ($related_node && $related_node->hasField('field_total_area') && !$related_node->get('field_total_area')->isEmpty()) {
                $area = $related_node->get('field_total_area')->value;
            }
            if ($area) {
                $response_data['area'] = rtrim(rtrim(number_format((float) $area, 2, '.', ''), '0'), '.') . ' м²';
            }

            if ($node->hasField('field_lot_area') && !$node->get('field_lot_area')->isEmpty()) {
                $response_data['lot_area'] = $node->get('field_lot_area')->value . ' соток участок';
            }

            $frontLength = null;
            $flankLength = null;
            foreach ([$node, $related_node] as $sourceNode) {
                if (!$sourceNode) {
                    continue;
                }
                if ($frontLength === null && $sourceNode->hasField('field_front_length') && !$sourceNode->get('field_front_length')->isEmpty()) {
                    $frontLength = $sourceNode->get('field_front_length')->value;
                }
                if ($flankLength === null && $sourceNode->hasField('field_flank_length') && !$sourceNode->get('field_flank_length')->isEmpty()) {
                    $flankLength = $sourceNode->get('field_flank_length')->value;
                }
            }
            if ($frontLength && $flankLength) {
                $response_data['dimensions'] = rtrim(rtrim(number_format((float) $frontLength, 2, '.', ''), '0'), '.')
                    . '×'
                    . rtrim(rtrim(number_format((float) $flankLength, 2, '.', ''), '0'), '.')
                    . ' метров';
            }

            $storeys = null;
            if ($node->hasField('field_storeys') && !$node->get('field_storeys')->isEmpty()) {
                $storeys = (int) $node->get('field_storeys')->value;
            }
            elseif ($related_node && $related_node->hasField('field_storeys') && !$related_node->get('field_storeys')->isEmpty()) {
                $storeys = (int) $related_node->get('field_storeys')->value;
            }
            if ($storeys) {
                if ($storeys == 1) {
                    $response_data['storeys'] = '1 этаж';
                }
                elseif (in_array($storeys, [2, 3, 4], true)) {
                    $response_data['storeys'] = $storeys . ' этажа';
                }
                else {
                    $response_data['storeys'] = $storeys . ' этажей';
                }
            }

            $rooms = null;
            if ($node->hasField('field_rooms') && !$node->get('field_rooms')->isEmpty()) {
                $rooms = (int) $node->get('field_rooms')->value;
            }
            elseif ($related_node && $related_node->hasField('field_rooms') && !$related_node->get('field_rooms')->isEmpty()) {
                $rooms = (int) $related_node->get('field_rooms')->value;
            }
            if ($rooms) {
                $response_data['rooms'] = $rooms . ' спальни';
            }

            $bathrooms = null;
            if ($node->hasField('field_bathrooms') && !$node->get('field_bathrooms')->isEmpty()) {
                $bathrooms = (int) $node->get('field_bathrooms')->value;
            }
            elseif ($related_node && $related_node->hasField('field_bathrooms') && !$related_node->get('field_bathrooms')->isEmpty()) {
                $bathrooms = (int) $related_node->get('field_bathrooms')->value;
            }
            if ($bathrooms) {
                $response_data['bathrooms'] = $bathrooms . ' санузла';
            }

            if ($node->hasField('field_mortgage') && !$node->get('field_mortgage')->isEmpty()) {
                $mortgage = trim(strip_tags($node->get('field_mortgage')->value));
                if ($mortgage !== '') {
                    $response_data['mortgage'] = $mortgage;
                }
            }

            foreach ([$node, $related_node] as $sourceNode) {
                if (!$sourceNode || !$sourceNode->hasField('body') || $sourceNode->get('body')->isEmpty()) {
                    continue;
                }

                $bodyItem = $sourceNode->get('body')->first();
                $raw = $bodyItem->value ?: $bodyItem->summary;
                if (!$raw) {
                    continue;
                }

                $raw = str_replace(['</p>', '<br>', '<br/>', '<br />', '</div>'], "\n", $raw);
                $description = trim(strip_tags($raw));
                $description = preg_replace("/\n{3,}/u", "\n\n", $description);
                $description = preg_replace("/[ \t]+/u", ' ', $description);

                if ($description === '') {
                    continue;
                }

                if (mb_strlen($description) > 600) {
                    $description = mb_substr($description, 0, 597) . '...';
                }

                $response_data['description'] = $description;
                break;
            }
        }

        return new JsonResponse($response_data);
    }
}
