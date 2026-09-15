<?php

/**
 * @file
 * Post update functions for oliverotest.
 */

/**
 * Sets the default `base_primary_color` value of oliverotest's theme settings.
 */
function oliverotest_post_update_add_oliverotest_primary_color() {
  \Drupal::configFactory()->getEditable('oliverotest.settings')
    ->set('base_primary_color', '#1b9ae4')
    ->save();
}
