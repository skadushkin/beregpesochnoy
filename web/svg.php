<?php

function loadSvgPaths($filePath) {
    $svg = simplexml_load_file($filePath);
    $svg->registerXPathNamespace('svg', 'http://www.w3.org/2000/svg');

    $paths = [];
    foreach ($svg->xpath('//svg:path') as $path) {
        $d = (string)$path['d'];
        if ($d) {
            $paths[trim($d)] = $path;
        }
    }
    return [$svg, $paths];
}

$oldSvgPath = 'old_map.svg'; // старый файл с data-id
$newSvgPath = 'new_map.svg'; // новый файл, в который нужно перенести data-id
$outputPath = 'new_map_with_ids.svg';

list($oldSvg, $oldPaths) = loadSvgPaths($oldSvgPath);
list($newSvg, $newPaths) = loadSvgPaths($newSvgPath);
//print_r($newSvg);

$updated = 0;

foreach ($newSvg->xpath('//svg:path') as $newPath) {
    $d = trim((string)$newPath['d']);
    var_dump($d); exit;
    if (isset($oldPaths[$d])) {
        $oldPath = $oldPaths[$d];
        if (isset($oldPath['data-id'])) {
            $newPath['data-id'] = (string)$oldPath['data-id'];
            $updated++;
        }
    }
}

file_put_contents($outputPath, $newSvg->asXML());

echo "Готово! Перенесено data-id: $updated\n";
