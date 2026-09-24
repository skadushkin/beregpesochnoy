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
    $content = $response->getContent();
    if (!is_string($content) || !str_contains($content, '<html')) {
      return;
    }
    $response->setContent(bereg_i18n_translate_html($content));
  }

}
