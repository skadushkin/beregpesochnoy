<?php

declare(strict_types=1);

namespace Drupal\Tests\oliverotest\Functional\Update;

use Drupal\FunctionalTests\Update\UpdatePathTestBase;

/**
 * Tests the update path for oliverotest.
 *
 * @group Update
 * @group #slow
 */
class oliverotestPostUpdateTest extends UpdatePathTestBase {

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * {@inheritdoc}
   */
  protected function setDatabaseDumpFiles() {
    $this->databaseDumpFiles = [
      __DIR__ . '/../../../../../../modules/system/tests/fixtures/update/drupal-9.4.0.filled.standard.php.gz',
    ];
  }

  /**
   * Tests update hook setting base primary color.
   */
  public function testoliverotestPrimaryColorUpdate(): void {
    $config = $this->config('oliverotest.settings');
    $this->assertEmpty($config->get('base_primary_color'));

    // Run updates.
    $this->runUpdates();

    $config = $this->config('oliverotest.settings');
    $this->assertSame('#1b9ae4', $config->get('base_primary_color'));
  }

}
