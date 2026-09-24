<?php

namespace Drupal\bereg_i18n\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Hides news listing and news nodes on EN/AR copies.
 */
class NewsHideSubscriber implements EventSubscriberInterface {

  public static function getSubscribedEvents(): array {
    return [
      KernelEvents::REQUEST => ['onRequest', 30],
    ];
  }

  public function onRequest(RequestEvent $event): void {
    if (!$event->isMainRequest() || bereg_i18n_lang() === 'ru') {
      return;
    }
    $path = strtolower($event->getRequest()->getPathInfo());
    if (preg_match('#^/(news|novosti)(/|$)#', $path)) {
      throw new NotFoundHttpException();
    }
  }

}
