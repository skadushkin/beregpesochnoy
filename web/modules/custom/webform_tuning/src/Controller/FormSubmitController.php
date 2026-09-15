<?php

namespace Drupal\webform_tuning\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Drupal\webform\Entity\WebformSubmission;

/**
 * Class FormSubmitController.
 * Provides custom form submission controllers.
 */
class FormSubmitController {

  /**
   * Handles form submission for the callback form.
   */
  public function callbackFormSubmit(Request $request) {
    $name = $request->request->get('name');
    $phone = $request->request->get('phone');
    $time = $request->request->get('time');
    $comment = $request->request->get('comment');

    if (!empty($name)) {
      $data = [
        '1' => [$name],
        '2' => [$phone],
        '3' => [$time],
        '4' => [$comment],
      ];

      $submission = WebformSubmission::create([
        'webform_id' => 'callback_form',
        'data' => $data,
      ]);
      $submission->save();

      $this->sendLeadNotificationMail([
        'name' => $name,
        'phone' => $phone,
        'email' => '',
        'source' => 'Заказать звонок',
        'message' => trim((string) $comment),
        'extra' => $time ? ('Время: ' . $time) : '',
      ], $request);

      return new JsonResponse(['status' => 'success', 'message' => 'Form submitted successfully.']);
    }

    return new JsonResponse(['status' => 'error', 'message' => 'Name is required.'], 400);
  }

  /**
   * Handles form submission for the common form.
   */
  public function commonFormSubmit(Request $request) {
    $name = $request->request->get('name');
    $email = $request->request->get('email');
    $phone = $request->request->get('phone');
    $source = $request->request->get('source');
    $message = $request->request->get('message');

    if (!empty($name)) {
      $sourceForStore = $source;
      if (!empty($message)) {
        $sourceForStore = trim($source . "\nСообщение: " . $message);
      }

      $data = [
        '1' => [$name],
        '2' => [$phone],
        '3' => [$email],
        '4' => [$sourceForStore],
      ];

      $submission = WebformSubmission::create([
        'webform_id' => 'contact',
        'data' => $data,
      ]);
      $submission->save();

      // Как на Бэнпане (/send.php lead_form): письмо менеджеру + данные формы.
      $this->sendLeadNotificationMail([
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'source' => $source,
        'message' => $message,
      ], $request);

      return new JsonResponse(['status' => 'success', 'message' => 'Form submitted successfully.']);
    }

    return new JsonResponse(['status' => 'error', 'message' => 'Name is required.'], 400);
  }

  /**
   * Handles form submission for the quiz form.
   */
  public function quizFormSubmit(Request $request) {
    $name = $request->request->get('name');
    $mail = $request->request->get('mail');
    $phone = $request->request->get('phone');
    $questions = $request->request->get('questions');

    if (!empty($name)) {
      $data = [
        '1' => [$name],
        '2' => [$mail],
        '3' => [$phone],
        '4' => [$questions],
      ];

      $submission = WebformSubmission::create([
        'webform_id' => 'quiz_form',
        'data' => $data,
      ]);
      $submission->save();

      $questionsText = '';
      if (is_array($questions)) {
        $questionsText = implode("\n", array_map('strval', $questions));
      }
      elseif (is_string($questions)) {
        $questionsText = $questions;
      }

      $this->sendLeadNotificationMail([
        'name' => $name,
        'phone' => $phone,
        'email' => $mail,
        'source' => 'Квиз',
        'message' => $questionsText,
      ], $request);

      return new JsonResponse(['status' => 'success', 'message' => 'Quiz submitted successfully.']);
    }

    return new JsonResponse(['status' => 'error', 'message' => 'Name is required.'], 400);
  }

  /**
   * HTML-письмо о заявке — по образцу Benpan send.php (lead_form).
   *
   * @param array $lead
   *   Keys: name, phone, email, source, message, extra (optional).
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   Current request (referer / IP / UA).
   */
  protected function sendLeadNotificationMail(array $lead, Request $request) {
    $to = 'info@beregpesochnoy.ru';
    $name = trim((string) ($lead['name'] ?? ''));
    $phone = trim((string) ($lead['phone'] ?? ''));
    $email = trim((string) ($lead['email'] ?? ''));
    $source = trim((string) ($lead['source'] ?? ''));
    $message = trim((string) ($lead['message'] ?? ''));
    $extra = trim((string) ($lead['extra'] ?? ''));

    if ($source === '') {
      $source = 'Заявка с сайта';
    }
    if ($email === '' || $email === ' ' || strpos($email, '@') === FALSE) {
      $email = '—';
    }

    $ip = $request->headers->get('X-Forwarded-For') ?: ($request->getClientIp() ?: 'Неизвестно');
    $date = date('d.m.Y H:i:s');
    $referer = $request->headers->get('Referer') ?: 'Прямой переход';
    $user_agent = $request->headers->get('User-Agent') ?: '';

    $name_esc = htmlspecialchars($name, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $phone_esc = htmlspecialchars($phone, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $email_esc = htmlspecialchars($email, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $source_esc = htmlspecialchars($source, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $message_esc = nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    $extra_esc = htmlspecialchars($extra, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $ip_esc = htmlspecialchars((string) $ip, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $referer_esc = htmlspecialchars((string) $referer, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $ua_esc = htmlspecialchars((string) $user_agent, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    $message_block = '';
    if ($message !== '') {
      $message_block = "
            <div class='field'>
                <span class='field-label'>Сообщение:</span>
                <span class='field-value'>{$message_esc}</span>
            </div>";
    }
    $extra_block = '';
    if ($extra !== '') {
      $extra_block = "
            <div class='field'>
                <span class='field-label'>Дополнительно:</span>
                <span class='field-value'>{$extra_esc}</span>
            </div>";
    }

    $body = "
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(165deg, #917357, #ad9170); color: #fff; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .header h2 { margin: 0; font-size: 24px; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 10px; }
        .field { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .field-label { font-weight: bold; color: #666; display: inline-block; width: 140px; vertical-align: top; }
        .field-value { color: #333; }
        .footer { margin-top: 20px; font-size: 12px; color: #999; text-align: center; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>Новая заявка с сайта</h2>
            <p style='margin:5px 0 0; opacity:0.9;'>{$source_esc} · {$date}</p>
        </div>
        <div class='content'>
            <div class='field'>
                <span class='field-label'>Имя:</span>
                <span class='field-value'><strong>{$name_esc}</strong></span>
            </div>
            <div class='field'>
                <span class='field-label'>Телефон:</span>
                <span class='field-value'><strong>{$phone_esc}</strong></span>
            </div>
            <div class='field'>
                <span class='field-label'>E-mail:</span>
                <span class='field-value'>{$email_esc}</span>
            </div>
            <div class='field'>
                <span class='field-label'>Форма / источник:</span>
                <span class='field-value'>{$source_esc}</span>
            </div>
            {$message_block}
            {$extra_block}
            <div class='field'>
                <span class='field-label'>IP:</span>
                <span class='field-value'>{$ip_esc}</span>
            </div>
            <div class='field'>
                <span class='field-label'>Referer:</span>
                <span class='field-value'>{$referer_esc}</span>
            </div>
            <div class='field'>
                <span class='field-label'>User Agent:</span>
                <span class='field-value' style='font-size:12px;'>{$ua_esc}</span>
            </div>
        </div>
        <div class='footer'>Автоуведомление с сайта Берег Песочной</div>
    </div>
</body>
</html>
";

    $subject = 'Заявка с сайта Берег Песочной: ' . $source;
    // Encode subject for UTF-8 mail clients.
    $subject_encoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=utf-8\r\n";
    $headers .= "From: Берег Песочной <noreply@beregpesochnoy.ru>\r\n";
    $headers .= "Reply-To: noreply@beregpesochnoy.ru\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    $headers .= "X-Priority: 1\r\n";

    @mail($to, $subject_encoded, $body, $headers);
  }

}
