<?php

/**
 * @file
 * Centralized confirmed content for the test2 «Берег Песочной» site.
 *
 * Do not invent metrics, prices, timings or services here.
 */

$files = '/sites/default/files/img/';
$lv2 = '/themes/bootstrap/landing-v2/img/';
$pt = '/themes/bootstrap/landing-ponton/img/';
$park = '/themes/bootstrap/landing-park/img/';
$infra = '/themes/bootstrap/landing-infrastructure/img/';

return [
  'name' => 'Берег Песочной',
  'phone_display' => '+7 (495) 186-50-88',
  'phone_tel' => '+74951865088',
  'whatsapp' => 'https://wa.me/79255543212',
  'address_line' => 'Лесная улица, 1',
  'address_place' => 'коттеджный посёлок «Берег Песочной»',
  'address_region' => 'городской округ Истра, Московская область',
  'pdf' => '/jk-bereg-pesochnoy.pdf',
  'policy' => '/policy/',
  'video' => 'https://kinescope.io/embed/b2ZqkZLrmBbMK8QywgXtzh',
  'route_url' => 'https://yandex.ru/maps/213/moscow/?ll=37.093746%2C55.877213&mode=routes&rtext=55.818974%2C37.390776~55.959175%2C36.947689&rtt=auto',
  'map_embed' => 'https://yandex.ru/map-widget/v1/?ll=36.947689%2C55.959175&z=12&pt=36.947689,55.959175,pm2dgl',
  'urls' => [
    'home' => '/',
    'houses' => '/kupit-dom-v-kottedzhnom-poselke',
    'houses_ready' => '/kupit-dom-v-kottedzhnom-poselke?type=2',
    'houses_build' => '/kupit-dom-v-kottedzhnom-poselke?type=3',
    'townhouses' => '/taunhausy',
    'catalog_all' => '/kupit-dom-v-kottedzhnom-poselke',
    'masterplan' => '/masterplan',
    'karta' => '/karta',
    'infrastructure' => '/infrastruktura',
    'waterfront' => '/waterfront',
    'water_seo' => '/kottedzhnyy-poselok-u-vody/',
    'gallery' => '/gallery',
    'location' => '/location',
    'construction' => '/construction',
    'news' => '/news',
    'service' => '/service',
    'about' => '/about',
    'contacts' => '/contacts',
    'faq' => '/#faq',
    'park' => '/node/853',
    'ponton' => '/node/840',
    'uk' => '/node/980',
  ],
  'facts' => [
    'park_ha' => '8 га',
    'village_ha' => '28 га',
    'mkad' => '45 км',
    'mkad_time' => '45 мин',
    'istra_time' => '≈ 10 мин',
    'reservoir_time' => '5 мин',
    'security' => '24/7',
    'power' => '10 кВт',
  ],
  'hero' => [
    'image' => $files . 'bereg-foto1.webp',
    'image_alt' => 'Жилой комплекс «Берег Песочной»: вода, парк и дома',
  ],
  'photos' => [
    $files . 'bereg-foto1.webp',
    $files . 'bereg-foto2.webp',
    $files . 'bereg-foto3.webp',
    $files . 'bereg-foto4.webp',
    $files . 'bereg-foto5.webp',
    $files . 'slider2.webp',
    $files . 'slider3.webp',
    $lv2 . 'lake-35dda4.png',
    $park . 'hero-park-31a4fe.png',
    $pt . 'hero-house-401b81.png',
    $infra . 'hero-infra-122032.png',
    $lv2 . 'gallery-1-36f477.png',
  ],
  'gallery' => [
    [
      'src' => $files . 'bereg-foto2.webp',
      'alt' => 'Архитектура домов «Берег Песочной»',
      'caption' => 'Современная архитектура домов',
      'cat' => 'architecture',
    ],
    [
      'src' => $lv2 . 'gallery-1-36f477.png',
      'alt' => 'Фасады и панорамное остекление',
      'caption' => 'Фасады и панорамное остекление',
      'cat' => 'architecture',
    ],
    [
      'src' => $park . 'hero-park-31a4fe.png',
      'alt' => 'Ландшафтный парк поселка',
      'caption' => 'Ландшафтный парк внутри поселка',
      'cat' => 'territory',
    ],
    [
      'src' => $park . 'lifestyle-trees-2044b4.png',
      'alt' => 'Прогулочные маршруты',
      'caption' => 'Прогулочные маршруты по территории',
      'cat' => 'territory',
    ],
    [
      'src' => $files . 'bereg-foto1.webp',
      'alt' => 'Вода и берег в поселке',
      'caption' => 'Вода как часть повседневной жизни',
      'cat' => 'water',
    ],
    [
      'src' => $lv2 . 'lake-35dda4.png',
      'alt' => 'Вид на воду',
      'caption' => 'Вид на воду и природное окружение',
      'cat' => 'water',
    ],
    [
      'src' => $pt . 'bento-activities.png',
      'alt' => 'Причал и активности у воды',
      'caption' => 'Причал для лодок и катамаранов',
      'cat' => 'water',
    ],
    [
      'src' => $files . 'bereg-foto3.webp',
      'alt' => 'Дома в поселке',
      'caption' => 'Дома для жизни круглый год',
      'cat' => 'houses',
    ],
    [
      'src' => $lv2 . 'house-1-card.png',
      'alt' => 'Частный дом',
      'caption' => 'Частные дома',
      'cat' => 'houses',
    ],
    [
      'src' => $lv2 . 'townhouse-card.png',
      'alt' => 'Таунхаусы',
      'caption' => 'Таунхаусы',
      'cat' => 'houses',
    ],
    [
      'src' => $infra . 'infrastucture_block_01.png',
      'alt' => 'Досуговая инфраструктура',
      'caption' => 'Досуговый центр и семейные зоны',
      'cat' => 'infra',
    ],
    [
      'src' => $park . 'bento-playground-c23441.png',
      'alt' => 'Детская инфраструктура',
      'caption' => 'Детские площадки на территории',
      'cat' => 'infra',
    ],
  ],
  'bento' => [
    [
      'title' => 'Природа',
      'label' => '8 га ландшафтного парка',
      'img' => $park . 'lifestyle-trees-2044b4.png',
      'size' => 'wide',
    ],
    [
      'title' => 'Вода',
      'label' => 'Река Песочная у границы поселка',
      'img' => $lv2 . 'lake-35dda4.png',
      'size' => 'tall',
    ],
    [
      'title' => 'Причал',
      'label' => 'Лодки и катамараны',
      'img' => $pt . 'bento-activities.png',
      'size' => 'std',
    ],
    [
      'title' => 'Прогулки',
      'label' => 'Дорожки в парке',
      'img' => $park . 'lifestyle-route.png',
      'size' => 'std',
    ],
    [
      'title' => 'Для детей',
      'label' => 'Площадки на территории',
      'img' => $park . 'bento-playground-c23441.png',
      'size' => 'std',
    ],
    [
      'title' => 'Спорт',
      'label' => 'Активный отдых на воздухе',
      'img' => $park . 'bento-sport-1f00a4.png',
      'size' => 'std',
    ],
    [
      'title' => 'Безопасность',
      'label' => 'Охрана и контроль доступа',
      'img' => $infra . 'lifestyle-lounge.png',
      'size' => 'std',
    ],
    [
      'title' => 'Сервис',
      'label' => 'Единая служба для жителей',
      'img' => $infra . 'hero-infra-122032.png',
      'size' => 'wide',
    ],
  ],
  'water_cards' => [
    [
      'title' => 'Причал для лодок',
      'text' => 'На понтонном пляже есть причал для лодок и катамаранов.',
      'img' => $pt . 'bento-activities.png',
    ],
    [
      'title' => 'Прокат лодок',
      'text' => 'Для жителей доступен прокат лодок — без выезда из поселка.',
      'img' => $pt . 'lifestyle-evening-water-24cea3.png',
    ],
    [
      'title' => 'Отдых у воды',
      'text' => 'Понтонный пляж: шезлонги, зоны отдыха и выход к набережной.',
      'img' => $pt . 'bento-comfort.png',
    ],
    [
      'title' => 'Прогулки вдоль берега',
      'text' => 'Вдоль южной границы поселка протекает река Песочная.',
      'img' => $park . 'lifestyle-pond-7d2f61.png',
    ],
  ],
  'faq' => [
    [
      'q' => 'Где расположен поселок?',
      'a' => 'КП «Берег Песочной» находится в Истринском районе Московской области, на Новорижском направлении, примерно в 45 км от МКАД. До города Истра — около 10 минут на машине. Адрес: Лесная улица, 1.',
    ],
    [
      'q' => 'Какие объекты доступны?',
      'a' => 'В каталоге можно выбрать готовые дома, строящиеся дома и таунхаусы. Актуальные лоты смотрите в каталоге и на генплане — состав предложений меняется.',
    ],
    [
      'q' => 'Есть ли готовые дома?',
      'a' => 'Да. Готовые дома выделены отдельным фильтром в каталоге. Комплектацию конкретного лота нужно смотреть в карточке объекта: «тёплый контур» не означает завершённую внутреннюю отделку.',
    ],
    [
      'q' => 'Какие коммуникации?',
      'a' => 'В поселке предусмотрены магистральный газ, центральное энергоснабжение, централизованная канализация, собственный водозаборный узел и оптоволоконный интернет. В базовую комплектацию дома входят заведённая канализация, электричество 10 кВт, подведённый водопровод; газ проходит по границе участка.',
    ],
    [
      'q' => 'Как организована безопасность?',
      'a' => 'Территория огорожена, въезд со шлагбаумом, круглосуточная охрана. В общественных пространствах предусмотрено видеонаблюдение.',
    ],
    [
      'q' => 'Кто обслуживает поселок?',
      'a' => 'Для жителей работает единая служба: сезонный уход за участком, электрика и сантехника. Стоимость и сроки работ уточняются после заявки.',
    ],
    [
      'q' => 'Есть ли доступ к воде?',
      'a' => 'Да. Вдоль южной границы протекает река Песочная, в нескольких минутах езды — Истринское водохранилище. На территории есть понтонный пляж с причалом для лодок и катамаранов.',
    ],
    [
      'q' => 'Как работает лодочная инфраструктура?',
      'a' => 'На понтонном пляже есть причал и прокат лодок. Актуальный сезон, правила и режим работы уточняйте в отделе продаж при записи на просмотр.',
    ],
    [
      'q' => 'Можно ли записаться на просмотр?',
      'a' => 'Да. Оставьте имя и телефон в форме — согласуем удобный день и покажем поселок, дома и инфраструктуру.',
    ],
    [
      'q' => 'Какие варианты покупки доступны?',
      'a' => 'Условия сделки, ипотека и рассрочка обсуждаются индивидуально. На консультации расскажем актуальные варианты по выбранному объекту.',
    ],
  ],
];
