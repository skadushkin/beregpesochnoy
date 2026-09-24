<?php

namespace Drupal\bereg_i18n\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Translates visible HTML for en/ae hosts after Drupal renders the page.
 */
class HtmlTranslatorSubscriber implements EventSubscriberInterface {

  public static function getSubscribedEvents(): array {
    return [
      // After Drupal AjaxResponseSubscriber (-100) has encoded commands.
      KernelEvents::RESPONSE => ['onResponse', -150],
    ];
  }

  public function onResponse(ResponseEvent $event): void {
    if (!$event->isMainRequest()) {
      return;
    }
    if (bereg_i18n_lang() === 'ru') {
      return;
    }
    $response = $event->getResponse();
    $contentType = (string) $response->headers->get('Content-Type', '');
    $isHtml = $contentType === '' || str_contains($contentType, 'html') || str_contains($contentType, 'text/');
    $isJson = str_contains($contentType, 'json');
    $isAjax = str_contains($contentType, 'ajax')
      || str_contains($event->getRequest()->getPathInfo(), '/views/ajax')
      || $event->getRequest()->isXmlHttpRequest();
    if ($contentType !== '' && !$isHtml && !$isJson) {
      return;
    }
    $content = $response->getContent();
    if (!is_string($content) || $content === '') {
      return;
    }
    // Views AJAX encodes Cyrillic as \uXXXX. Phrase replace on the raw
    // body misses "Загрузить еще" and house-card labels.
    if ($isJson || $isAjax) {
      $decoded = json_decode($content, TRUE);
      if (is_array($decoded) && $decoded !== []) {
        $decoded = bereg_i18n_translate_json($decoded);
        if ($response instanceof JsonResponse) {
          $response->setData($decoded);
          return;
        }
        $encoded = json_encode($decoded, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE);
        if (is_string($encoded)) {
          $response->setContent($encoded);
        }
        return;
      }
    }
    $translated = bereg_i18n_translate_html($content);
    $translated = bereg_i18n_hide_prices_html($translated);
    $translated = bereg_i18n_hide_news_html($translated);
    $response->setContent($translated);
  }

}
