<?php
/**
 * Отправка заявок с колеса фортуны на почту ya.seohelp@yandex.ru
 */

// Настройки (БЭНПАН по умолчанию; Берег Песочной — при site=bereg или метке источника)
$to = 'dom@benpan.ru';
$subject = 'Новая заявка с колеса фортуны ЖБИ дома';

/**
 * Заявка с посёлка «Берег Песочной» (колесо на node/835).
 */
function wheel_is_bereg_context() {
    $site = isset($_POST['site']) ? (string) $_POST['site'] : '';
    $source = isset($_POST['source']) ? (string) $_POST['source'] : '';
    if ($site === 'bereg') {
        return true;
    }
    if (stripos($source, 'bereg') !== false || stripos($source, '835') !== false || stripos($source, 'beregpesochnoy') !== false) {
        return true;
    }
    return false;
}

function wheel_mail_settings() {
    if (wheel_is_bereg_context()) {
        return [
            'to' => 'info@beregpesochnoy.ru',
            'subject' => 'Новая заявка с колеса фортуны Берег Песочной',
            'from_name' => 'Берег Песочной',
            'from_email' => 'noreply@beregpesochnoy.ru',
            'max_prize_index' => 7,
            'bitrix_title' => 'Заявка: колесо фортуны Берег Песочной',
            'bitrix_source_description' => 'Колесо фортуны Берег Песочной',
            'bitrix_comment_prefix' => 'Колесо фортуны Берег Песочной',
            // Тот же портал, что и формы сайта (oooagrokom / main.js).
            'bitrix_webhook' => 'https://oooagrokom.bitrix24.ru/rest/234/2ebwc1baokth23f1/',
        ];
    }
    return [
        'to' => 'dom@benpan.ru',
        'subject' => 'Новая заявка с колеса фортуны ЖБИ дома',
        'from_name' => 'ЖБИ дома',
        'from_email' => 'noreply@jbi-doma.ru',
        'max_prize_index' => 9,
        'bitrix_title' => 'Заявка: колесо фортуны ЖБИ дома',
        'bitrix_source_description' => 'Колесо фортуны ЖБИ дома',
        'bitrix_comment_prefix' => 'Колесо фортуны ЖБИ дома',
        'bitrix_webhook' => 'https://b24.benpan.ru/rest/8/d4vel02vzhgqmb68/',
    ];
}

// Заголовки для защиты от спама
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не поддерживается']);
    exit;
}

/**
 * Нормализация телефона к виду 7 + 10 цифр (без +).
 */
function wheel_normalize_phone_ru($phone) {
    $d = preg_replace('/\D+/', '', (string) $phone);
    if (strlen($d) === 11 && $d[0] === '8') {
        $d = '7' . substr($d, 1);
    }
    if (strlen($d) === 10) {
        $d = '7' . $d;
    }
    return $d;
}

/**
 * Путь к jsonl-файлу: один участник = одна строка JSON.
 */
function wheel_participants_file() {
    if (wheel_is_bereg_context()) {
        return __DIR__ . '/wheel_fortune_bereg_phones.json';
    }
    return __DIR__ . '/wheel_fortune_phones.json';
}

/**
 * Поиск участника по нормализованному номеру.
 */
function wheel_find_by_phone($normalized) {
    $path = wheel_participants_file();
    if (!is_readable($path)) {
        return null;
    }
    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return null;
    }
    foreach ($lines as $line) {
        $row = json_decode($line, true);
        if (is_array($row) && isset($row['phone']) && $row['phone'] === $normalized) {
            return $row;
        }
    }
    return null;
}

/**
 * Сохранить участника после успешной отправки (без дубликатов по номеру).
 */
function wheel_save_participant($normalized, $prize_index, $prize_id, $prize_title) {
    $path = wheel_participants_file();
    $fp = fopen($path, 'c+');
    if ($fp === false) {
        return false;
    }
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return false;
    }
    $raw = stream_get_contents($fp);
    if ($raw !== false && $raw !== '') {
        foreach (explode("\n", trim($raw)) as $line) {
            if ($line === '') {
                continue;
            }
            $row = json_decode($line, true);
            if (is_array($row) && isset($row['phone']) && $row['phone'] === $normalized) {
                flock($fp, LOCK_UN);
                fclose($fp);
                return true;
            }
        }
    }
    $entry = json_encode([
        'phone' => $normalized,
        'prizeIndex' => (int) $prize_index,
        'prizeId' => $prize_id,
        'prizeTitle' => $prize_title,
    ], JSON_UNESCAPED_UNICODE) . "\n";
    fseek($fp, 0, SEEK_END);
    fwrite($fp, $entry);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return true;
}

// Лёгкая проверка номера до кручения колеса (localStorage мог очиститься)
if (!empty($_POST['wheel_lookup'])) {
    $phone_lookup = isset($_POST['phone']) ? trim(strip_tags($_POST['phone'])) : '';
    $norm_lookup = wheel_normalize_phone_ru($phone_lookup);
    if ($phone_lookup === '' || !preg_match('/^\+7\d{10}$/', $phone_lookup) || !preg_match('/^7\d{10}$/', $norm_lookup)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Неверный формат телефона']);
        exit;
    }
    $found = wheel_find_by_phone($norm_lookup);
    if ($found) {
        echo json_encode([
            'success' => true,
            'exists' => true,
            'prizeIndex' => (int) $found['prizeIndex'],
            'prizeTitle' => $found['prizeTitle'],
            'prizeId' => $found['prizeId'],
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'exists' => false,
        ]);
    }
    exit;
}

/**
 * Нормализует ввод телефона к строке +7 и 10 цифр или null.
 */
function wheel_phone_to_plus7($raw) {
    $d = preg_replace('/\D+/', '', (string) $raw);
    if (strlen($d) === 11 && $d[0] === '8') {
        $d = '7' . substr($d, 1);
    }
    if (strlen($d) === 11 && $d[0] === '7') {
        $d = substr($d, 1);
    }
    if (strlen($d) !== 10) {
        return null;
    }
    return '+7' . $d;
}

/**
 * Нормализует метку источника для гаражных форм.
 */
function wheel_lead_normalize_source($source, $lead_title) {
    $garage_sources = array('page-node-3916-garage', 'page-type-garage');
    if (in_array($source, $garage_sources, true)) {
        return $source;
    }
    if ($lead_title !== '' && mb_stripos($lead_title, 'гараж') !== false) {
        return 'page-type-garage';
    }
    return $source;
}

/**
 * Значение для поля Bitrix «Дополнительно об источнике» (SOURCE_DESCRIPTION).
 */
function wheel_lead_bitrix_source_description($source, $lead_title) {
    $garage_sources = array('page-node-3916-garage', 'page-type-garage');
    if (in_array($source, $garage_sources, true)) {
        return 'Гараж';
    }
    if ($lead_title !== '' && mb_stripos($lead_title, 'гараж') !== false) {
        return 'Гараж';
    }
    if (strpos($source, 'domokomplekt') !== false || $source === 'node-domokomplekt') {
        return 'Домокомплект';
    }
    if ($lead_title !== '' && mb_stripos($lead_title, 'домокомплект') !== false) {
        return 'Домокомплект';
    }
    return $lead_title !== '' ? $lead_title : 'Заявка с сайта';
}

// Заявки с блоков .garage-form-card (консультация, без колеса и без записи участников)
if (isset($_POST['lead_form']) && (string) $_POST['lead_form'] === '1') {
    $name = isset($_POST['name']) ? trim(strip_tags($_POST['name'])) : '';
    $phone_try = isset($_POST['phone']) ? $_POST['phone'] : '';
    $lead_title = isset($_POST['lead_title']) ? trim(strip_tags($_POST['lead_title'])) : '';
    $source = isset($_POST['source']) ? trim(strip_tags($_POST['source'])) : '';
    $user_agent = isset($_POST['user_agent']) ? trim(strip_tags($_POST['user_agent'])) : '';
    $consent_ok = isset($_POST['consent']) && (string) $_POST['consent'] === '1';

    if ($lead_title === '') {
        $lead_title = 'Заявка с сайта';
    }

    $errors = [];
    if ($name === '' || mb_strlen($name) < 2) {
        $errors[] = 'Имя должно содержать минимум 2 символа';
    }
    $phone = wheel_phone_to_plus7($phone_try);
    if ($phone === null) {
        $errors[] = 'Неверный формат телефона';
    }
    if (!$consent_ok) {
        $errors[] = 'Необходимо согласие с политикой конфиденциальности';
    }

    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
        exit;
    }

    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'Неизвестно';
    $date = date('d.m.Y H:i:s');
    $referer = $_SERVER['HTTP_REFERER'] ?? 'Прямой переход';

    $source = wheel_lead_normalize_source($source, $lead_title);
    $bitrix_source_description = wheel_lead_bitrix_source_description($source, $lead_title);

    // Гаражные лендинги (3916, тип garage) — отдельный ящик
    $mail_to_lead = $to;
    if (in_array($source, array('page-node-3916-garage', 'page-type-garage'), true)) {
        $mail_to_lead = '5992726@mail.ru';
    }

    $subject_lead = 'Заявка с сайта ЖБИ: ' . $lead_title;
    $name_esc = htmlspecialchars($name, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $lead_title_esc = htmlspecialchars($lead_title, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $source_esc = htmlspecialchars($source, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    $message_lead = "
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(165deg, #c68b1c, #e6a817); color: #1e1606; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .header h2 { margin: 0; font-size: 24px; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 10px; }
        .field { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .field-label { font-weight: bold; color: #666; display: inline-block; width: 140px; }
        .field-value { color: #333; }
        .footer { margin-top: 20px; font-size: 12px; color: #999; text-align: center; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>Новая заявка с сайта</h2>
            <p style='margin:5px 0 0; opacity:0.9;'>$lead_title_esc · $date</p>
        </div>
        <div class='content'>
            <div class='field'>
                <span class='field-label'>Имя:</span>
                <span class='field-value'><strong>$name_esc</strong></span>
            </div>
            <div class='field'>
                <span class='field-label'>Телефон:</span>
                <span class='field-value'><strong>$phone</strong></span>
            </div>
            <div class='field'>
                <span class='field-label'>Тип заявки:</span>
                <span class='field-value'>$lead_title_esc</span>
            </div>
            <div class='field'>
                <span class='field-label'>Источник (метка):</span>
                <span class='field-value'>$source_esc</span>
            </div>
            <div class='field'>
                <span class='field-label'>IP:</span>
                <span class='field-value'>" . htmlspecialchars($ip, ENT_QUOTES | ENT_HTML5, 'UTF-8') . "</span>
            </div>
            <div class='field'>
                <span class='field-label'>Referer:</span>
                <span class='field-value'>" . htmlspecialchars($referer, ENT_QUOTES | ENT_HTML5, 'UTF-8') . "</span>
            </div>
            <div class='field'>
                <span class='field-label'>User Agent:</span>
                <span class='field-value' style='font-size:12px;'>" . htmlspecialchars($user_agent, ENT_QUOTES | ENT_HTML5, 'UTF-8') . "</span>
            </div>
        </div>
        <div class='footer'>Автоуведомление с сайта ЖБИ (форма консультации)</div>
    </div>
</body>
</html>
";

    $alt_lead = "НОВАЯ ЗАЯВКА С САЙТА\n";
    $alt_lead .= "Тип: $lead_title\n";
    $alt_lead .= "Имя: $name\n";
    $alt_lead .= "Телефон: $phone\n";
    $alt_lead .= "Источник (метка): $source\n";
    $alt_lead .= "IP: $ip\n";
    $alt_lead .= "Дата: $date\n";
    $alt_lead .= "Referer: $referer\n";
    $alt_lead .= "User Agent: $user_agent\n";

    $headers_lead = "MIME-Version: 1.0\r\n";
    $headers_lead .= "Content-type: text/html; charset=utf-8\r\n";
    $headers_lead .= "From: ЖБИ дома <noreply@jbi-doma.ru>\r\n";
    $headers_lead .= "Reply-To: noreply@jbi-doma.ru\r\n";
    $headers_lead .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    $headers_lead .= "X-Priority: 1\r\n";

    $mail_sent_lead = mail($mail_to_lead, $subject_lead, $message_lead, $headers_lead);

    $bitrixWebhookBase = "https://b24.benpan.ru/rest/8/d4vel02vzhgqmb68/";
    if ($bitrixWebhookBase !== '') {
        $bitrixComment = 'Заявка с сайта ЖБИ' . "\n"
            . 'Тип: ' . $lead_title . "\n"
            . 'Источник (метка): ' . $source . "\n"
            . 'IP: ' . $ip . "\n"
            . 'Дата: ' . $date . "\n"
            . 'Referer: ' . $referer . "\n"
            . 'User-Agent: ' . $user_agent;
        $bitrixFields = array(
            'TITLE' => 'Заявка с сайта: ' . $lead_title,
            'SOURCE_ID' => 'WEB',
            'SOURCE_DESCRIPTION' => $bitrix_source_description,
            'NAME' => $name,
            'PHONE' => array(
                array(
                    'VALUE' => $phone,
                    'VALUE_TYPE' => 'WORK',
                ),
            ),
            'COMMENTS' => $bitrixComment,
        );
        if ($bitrix_source_description === 'Гараж') {
            $bitrixFields['UF_CRM_TYPE_OBYAV'] = '2825';
        }
        elseif ($bitrix_source_description === 'Домокомплект') {
            $bitrixFields['UF_CRM_TYPE_OBYAV'] = '2824';
        }
        $bitrixUrl = $bitrixWebhookBase . 'crm.lead.add.json';
        $ch = curl_init($bitrixUrl);
        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query(array('fields' => $bitrixFields)),
            CURLOPT_TIMEOUT => 30,
        ));
        $bitrixRaw = curl_exec($ch);
        file_put_contents('wheel_b24.log', $bitrixRaw, FILE_APPEND);
        curl_close($ch);
        $bitrixDecoded = json_decode((string) $bitrixRaw, true);
        if (!is_array($bitrixDecoded) || !empty($bitrixDecoded['error'])) {
            $bitrixErr = date('Y-m-d H:i:s') . ' | BITRIX LEAD | ' . $name . ' | ' . $phone . ' | ' . $bitrixRaw . "\n";
            @file_put_contents('wheel_errors.log', $bitrixErr, FILE_APPEND);
        }
    }

    if ($mail_sent_lead) {
        $log_entry = date('Y-m-d H:i:s') . " | LEAD | $name | $phone | $lead_title\n";
        @file_put_contents('wheel_leads.log', $log_entry, FILE_APPEND);

        echo json_encode([
            'success' => true,
            'message' => 'Заявка успешно отправлена',
        ]);
    } else {
        $error_log = date('Y-m-d H:i:s') . " | LEAD ERROR | $name | $phone | $lead_title | Mail failed\n";
        @file_put_contents('wheel_errors.log', $error_log, FILE_APPEND);

        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Не удалось отправить заявку. Попробуйте позже или позвоните нам.',
        ]);
    }

    $csv_file = 'wheel_leads.csv';
    $csv_data = [
        date('Y-m-d H:i:s'),
        $name,
        $phone,
        $lead_title,
        '',
        $ip,
        $source,
        $mail_sent_lead ? 'отправлено' : 'ошибка',
    ];
    if (!file_exists($csv_file)) {
        $csv_header = ['Дата', 'Имя', 'Телефон', 'Приз', 'Описание', 'IP', 'Источник', 'Статус'];
        $fp = fopen($csv_file, 'w');
        fputcsv($fp, $csv_header, ';');
        fclose($fp);
    }
    $fp = fopen($csv_file, 'a');
    fputcsv($fp, $csv_data, ';');
    fclose($fp);

    exit;
}

// Получаем данные из формы
$name = isset($_POST['name']) ? trim(strip_tags($_POST['name'])) : '';
$phone = isset($_POST['phone']) ? trim(strip_tags($_POST['phone'])) : '';
$prize_index_post = isset($_POST['prize_index']) ? (int) $_POST['prize_index'] : -1;
$prize_id_post = isset($_POST['prize_id']) ? trim(strip_tags($_POST['prize_id'])) : '';
$normalized_phone = wheel_normalize_phone_ru($phone);

// Уже участвовал — не списываем приз повторно и не шлём второе письмо
if ($normalized_phone !== '' && preg_match('/^7\d{10}$/', $normalized_phone)) {
    $already = wheel_find_by_phone($normalized_phone);
    if ($already) {
        echo json_encode([
            'success' => true,
            'already_registered' => true,
            'prizeIndex' => (int) $already['prizeIndex'],
            'prizeTitle' => $already['prizeTitle'],
            'prizeId' => $already['prizeId'],
            'message' => 'Этот номер уже участвовал — подарок был определён ранее.',
        ]);
        exit;
    }
}

// Остальные поля
$prize = isset($_POST['prize']) ? trim(strip_tags($_POST['prize'])) : '';
$prize_description = isset($_POST['prize_description']) ? trim(strip_tags($_POST['prize_description'])) : '';
$source = isset($_POST['source']) ? trim(strip_tags($_POST['source'])) : '';
$user_agent = isset($_POST['user_agent']) ? trim(strip_tags($_POST['user_agent'])) : '';

// Валидация данных
$errors = [];

if (empty($name) || strlen($name) < 2) {
    $errors[] = 'Имя должно содержать минимум 2 символа';
}

if (empty($phone) || !preg_match('/^\+7\d{10}$/', $phone)) {
    $errors[] = 'Неверный формат телефона';
}

if (empty($prize)) {
    $errors[] = 'Не указан подарок';
}

$wheel_mail = wheel_mail_settings();
if (isset($_POST['prize_index']) && (string) $_POST['prize_index'] !== '') {
    if ($prize_index_post < 0 || $prize_index_post > $wheel_mail['max_prize_index']) {
        $errors[] = 'Некорректный приз';
    }
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
    exit;
}

// Дополнительная информация
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'Неизвестно';
$date = date('d.m.Y H:i:s');
$referer = $_SERVER['HTTP_REFERER'] ?? 'Прямой переход';

// Формируем тело письма (HTML + текст)
$message = "
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(165deg, #c68b1c, #e6a817); color: #1e1606; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .header h2 { margin: 0; font-size: 24px; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 10px; }
        .field { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .field-label { font-weight: bold; color: #666; display: inline-block; width: 120px; }
        .field-value { color: #333; }
        .prize-highlight { background: #fef6e8; padding: 15px; border-radius: 8px; border-left: 4px solid #e6a817; margin: 20px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #999; text-align: center; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>🎡 Новая заявка с колеса фортуны!</h2>
            <p style='margin:5px 0 0; opacity:0.9;'>ЖБИ дома · $date</p>
        </div>
        
        <div class='content'>
            <div class='field'>
                <span class='field-label'>👤 Имя:</span>
                <span class='field-value'><strong>$name</strong></span>
            </div>
            
            <div class='field'>
                <span class='field-label'>📞 Телефон:</span>
                <span class='field-value'><strong>$phone</strong></span>
            </div>
            
            <div class='prize-highlight'>
                <div style='font-size:14px; color:#b77e1e; margin-bottom:5px;'>🎁 ВЫПАВШИЙ ПРИЗ</div>
                <div style='font-size:20px; font-weight:bold; color:#392e1a;'>$prize</div>
                <div style='margin-top:8px; color:#65573e;'>$prize_description</div>
            </div>
            
            <div class='field'>
                <span class='field-label'>📱 Источник:</span>
                <span class='field-value'>" . htmlspecialchars($source) . "</span>
            </div>
            
            <div class='field'>
                <span class='field-label'>🌐 IP-адрес:</span>
                <span class='field-value'>$ip</span>
            </div>
            
            <div class='field'>
                <span class='field-label'>🔗 Referer:</span>
                <span class='field-value'>$referer</span>
            </div>
            
            <div class='field'>
                <span class='field-label'>💻 User Agent:</span>
                <span class='field-value' style='font-size:12px;'>" . htmlspecialchars($user_agent) . "</span>
            </div>
        </div>
        
        <div class='footer'>
            Это автоматическое уведомление с сайта ЖБИ дома · Колесо фортуны
        </div>
    </div>
</body>
</html>
";

// Альтернативный текст для почтовых клиентов без HTML
$alt_message = "НОВАЯ ЗАЯВКА С КОЛЕСА ФОРТУНЫ\n";
$alt_message .= "==============================\n\n";
$alt_message .= "Имя: $name\n";
$alt_message .= "Телефон: $phone\n";
$alt_message .= "Выпавший приз: $prize\n";
$alt_message .= "Описание: $prize_description\n";
$alt_message .= "Источник: $source\n";
$alt_message .= "IP: $ip\n";
$alt_message .= "Дата: $date\n";
$alt_message .= "Referer: $referer\n";
$alt_message .= "User Agent: $user_agent\n";

// Bitrix24: тот же входящий вебхук, что в max_bot (BITRIX24_WEBHOOK_URL), вызов как в BitrixLead::call

// Пытаемся отправить письмо
$wheel_mail = wheel_mail_settings();
$to = $wheel_mail['to'];
$subject = $wheel_mail['subject'];
$bitrixWebhookBase = isset($wheel_mail['bitrix_webhook']) ? $wheel_mail['bitrix_webhook'] : 'https://b24.benpan.ru/rest/8/d4vel02vzhgqmb68/';
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=utf-8\r\n";
$headers .= 'From: ' . $wheel_mail['from_name'] . ' <' . $wheel_mail['from_email'] . ">\r\n";
$headers .= 'Reply-To: ' . $wheel_mail['from_email'] . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "X-Priority: 1\r\n";

$mail_sent = mail($to, $subject, $message, $headers);

if ($bitrixWebhookBase !== '') {
    $bitrixComment = $wheel_mail['bitrix_comment_prefix'] . "\n"
        . 'Приз: ' . $prize . "\n"
        . 'Описание: ' . $prize_description . "\n"
        . 'Источник: ' . $source . "\n"
        . 'IP: ' . $ip . "\n"
        . 'Дата: ' . $date . "\n"
        . 'Referer: ' . $referer . "\n"
        . 'User-Agent: ' . $user_agent;
    $bitrixSourceDescription = isset($wheel_mail['bitrix_source_description'])
        ? $wheel_mail['bitrix_source_description']
        : $wheel_mail['bitrix_title'];
    $bitrixFields = array(
        'TITLE' => $wheel_mail['bitrix_title'],
        'SOURCE_ID' => 'WEB',
        'SOURCE_DESCRIPTION' => $bitrixSourceDescription,
        'NAME' => $name,
        'PHONE' => array(
            array(
                'VALUE' => $phone,
                'VALUE_TYPE' => 'WORK',
            ),
        ),
        'COMMENTS' => $bitrixComment,
    );
    $bitrixUrl = $bitrixWebhookBase . 'crm.lead.add.json';
    $ch = curl_init($bitrixUrl);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query(array('fields' => $bitrixFields)),
        CURLOPT_TIMEOUT => 30,
    ));
    $bitrixRaw = curl_exec($ch);
    file_put_contents('wheel_b24.log', $bitrixRaw, FILE_APPEND);
    curl_close($ch);
    $bitrixDecoded = json_decode((string) $bitrixRaw, true);
    if (!is_array($bitrixDecoded) || !empty($bitrixDecoded['error'])) {
        $bitrixErr = date('Y-m-d H:i:s') . ' | BITRIX | ' . $name . ' | ' . $phone . ' | ' . $bitrixRaw . "\n";
        @file_put_contents('wheel_errors.log', $bitrixErr, FILE_APPEND);
    }
}

if ($mail_sent) {
    // Фиксируем номер на сервере — повторное участие с того же телефона невозможно
    wheel_save_participant($normalized_phone, $prize_index_post, $prize_id_post, $prize);

    // Логируем успешную отправку (опционально)
    $log_entry = date('Y-m-d H:i:s') . " | SUCCESS | $name | $phone | $prize\n";
    @file_put_contents('wheel_leads.log', $log_entry, FILE_APPEND);
    
    echo json_encode([
        'success' => true,
        'message' => 'Заявка успешно отправлена'
    ]);
} else {
    // Логируем ошибку
    $error_log = date('Y-m-d H:i:s') . " | ERROR | $name | $phone | $prize | Mail failed\n";
    @file_put_contents('wheel_errors.log', $error_log, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Не удалось отправить письмо. Попробуйте позже или свяжитесь с нами по телефону.'
    ]);
}

// Дополнительно сохраняем в CSV (для надёжности)
$csv_file = 'wheel_leads.csv';
$csv_data = [
    date('Y-m-d H:i:s'),
    $name,
    $phone,
    $prize,
    $prize_description,
    $ip,
    $source,
    $mail_sent ? 'отправлено' : 'ошибка'
];

if (!file_exists($csv_file)) {
    $csv_header = ['Дата', 'Имя', 'Телефон', 'Приз', 'Описание', 'IP', 'Источник', 'Статус'];
    $fp = fopen($csv_file, 'w');
    fputcsv($fp, $csv_header, ';');
    fclose($fp);
}

$fp = fopen($csv_file, 'a');
fputcsv($fp, $csv_data, ';');
fclose($fp);



?>