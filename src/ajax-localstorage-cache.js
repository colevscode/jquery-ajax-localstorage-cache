/*
 * ajax-localstorage-cache
 * https://github.com/treasonx/jquery-ajax-localstorage-cache
 *
 * Copyright (c) 2012 Paul Irish
 * Licensed under the Apache, 2 licenses.
 */

(function($) {

  // Collection method.
  $.fn.awesome = function() {
    return this.each(function() {
      $(this).html('awesome');
    });
  };

  // Static method.
  $.awesome = function() {
    return 'awesome';
  };

  // Custom selector.
  $.expr[':'].awesome = function(elem) {
    return elem.textContent.indexOf('awesome') >= 0;
  };

}(jQuery));
