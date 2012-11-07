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
        called++;
        completeCallback(200, 'OK', {json: {boo:"yea"}});
      },
      abort: function(){}
    };
  }); 

  function doAjax(onSuccess, thisMany, cacheKey, isCacheValid) {
    while(thisMany--) { 
      $.ajax({
        url: 'http://example.com/',
        success: onSuccess,
        cacheKey: cacheKey,
        isCacheValid: isCacheValid
      });
    }
  }

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
    
    doAjax(onSuccess, 2);
  });

  asyncTest('should expire items', 1, function() {
    var success = 0;
    var date = Date;

    function onSuccess() {
      success++;
      if(success === 3) {
        Date = date;
        equal(called, 2, 'should only make one ajax call');
        start();
      }
    }
    
    doAjax(onSuccess, 2);
    Date = function() {
      var d = new date();
      d.setHours(d.getHours()+10);
      return d;
    };
    doAjax(onSuccess, 1);

  });

  asyncTest('should convert legacy cache items', 4, function() {
    var testData = {legacy: 'item'};
    localStorage.setItem('http://example.com/GETundefinedcachettl', new Date().getTime()+1000*60);
    localStorage.setItem('http://example.com/GETundefined', JSON.stringify(testData)); 
    doAjax(function(d) {
      var ttl, value;
      ttl = localStorage.getItem('http://example.com/GETundefinedcachettl');
      value = localStorage.getItem('http://example.com/GETundefined');

      deepEqual(d, testData, 'should get legacy data');
      equal(called, 0, 'should not make call on legacy conversion');
      
      equal(ttl, undefined, 'legacy ttl should be removed');
      equal(value, undefined, 'legacy data should be removed');

      start();
    }, 1);
  });

  asyncTest('should use cachekey option', 2, function() {
    var success = 0;
    var cacheKey = 'myCache';

    function onSuccess() {
      var cachItem = localStorage.getItem(cacheKey);
      success++;
      if(success === 2) {
        equal(called, 1, 'should only make one ajax call');
        equal(cachItem, JSON.stringify({boo:'yea'}), 'should store test data');
        start();
      }
    }
    
    doAjax(onSuccess, 2, cacheKey);
  });

  asyncTest('should respect isCacheValid option', 1, function() {
    
    var success = 0;

    function onSuccess() {
      success++;
      if(success === 2) {
        equal(called, 2, 'should make 2 ajax calls');
        start();
      }
    }
    
    doAjax(onSuccess, 2, undefined, function(){return false;});
  });


}(jQuery));
