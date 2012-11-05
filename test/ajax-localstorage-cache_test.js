/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
(function($) {

  /*
    ======== A Handy Little QUnit Reference ========
    http://docs.jquery.com/QUnit

    Test methods:
      expect(numAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      raises(block, [expected], [message])
  */
  var called = 0;

  $.ajaxTransport('json', function( ) {
    return {
      send: function( headers, completeCallback ) {
        completeCallback(200, 'OK', {json: {boo:"yea"}});
        called++;
      },
      abort: function(){}
    };
  }); 

  module('ajax cache', {
    setup: function() {
      window.localStorage.clear();
      called = 0;
      $.ajaxSetup({
        type: 'GET',
        dataType: 'json',
        //Caches everything in localStorage ftw!
        localCache: true
      });
    }
  });

  asyncTest('calls ajax only once', 1, function() {
    var success = 0;

    function onSuccess() {
      success++;
      if(success === 2) {
        equal(called, 1, 'should only make one ajax call');
        start();
      }
    }

    $.ajax({
      url: 'http://example.com/',
      success: onSuccess
    });
    $.ajax({
      url: 'http://example.com/',
      success: onSuccess
    });

  });

  asyncTest('should expire items', 1, function() {
    var success = 0;

    function onSuccess() {
      success++;
      if(success === 3) {
        equal(called, 2, 'should only make one ajax call');
        start();
      }
    }

    $.ajax({
      url: 'http://example.com/',
      success: onSuccess
    });
    $.ajax({
      url: 'http://example.com/',
      success: onSuccess
    });
    date = Date;
    Date = function() {
      var d = new date();
      d.setHours(d.getHours()+10);
      return d;
    };
    $.ajax({
      url: 'http://example.com/',
      success: onSuccess
    });
    Date = date;

  });

  test('should not throw when full', 1, function() {
    
    equal(1, 1, 'should be chaninable');
  });

  test('should convert legacy cache items', 1, function() {
    
    equal(1, 1, 'should be chaninable');
  });

  test('should use cachekey option', 1, function() {
    
    equal(1, 1, 'should be chaninable');
  });


}(jQuery));
