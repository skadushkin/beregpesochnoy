<?php

namespace Drupal\bereg_i18n\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Translates visible HTML for en/ae hosts after Drupal renders the page.
 */
class HtmlTranslatorSubscriber implements EventSubscriberInterface {

  public static function getSubscribedEvents(): array {
    return [
      KernelEvents::RESPONSE => ['onResponse', -100],
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
    $translated = bereg_i18n_translate_html($content);
    // Price stripping on Views AJAX JSON breaks "Load more".
    // CSS on body.lang-en / body.lang-ar hides prices in inserted cards.
    if (!$isJson && !$isAjax) {
      $translated = bereg_i18n_hide_prices_html($translated);
      $translated = bereg_i18n_hide_news_html($translated);
    }
    $response->setContent($translated);
  }

}
