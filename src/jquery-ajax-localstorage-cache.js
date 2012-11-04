// github.com/paulirish/jquery-ajax-localstorage-cache
// dependent on Modernizr's localStorage test
//

(function(window, $, Modernizr, undefined) {

  var PREFIX = '_jalc_';

  //save payload
  function savePayload(fingerprint, payload, hourstl, onError) {
    var expires = +new Date() + 1000 * 60 * 60 * hourstl;
    try {
      localStorage.setItem( PREFIX+fingerprint, JSON.stringify({
        t: expires,
        p:payload
      }));
    } catch (e) {
      // Remove any incomplete data that may have been saved before the exception was caught
      localStorage.removeItem( fingerprint);
      if ( typeof onError === 'function') {
        onError( e, payload );
      }
    }
  }
  
  //Someone may have upgraded the plugin.. Respect the user and clean up
  function convertLegacy(cacheKey, hourstl) {
    var out;
    var ttl = localStorage.getItem(cacheKey + 'cachettl');
    var value = localStorage.getItem( cacheKey );
    if(ttl && value) {
      localStorage.removeItem(cacheKey + 'cachettl');
      localStorage.removeItem( cacheKey );
      out =  {
        t: ttl,
        p: value
      };
      savePayload(md5(cacheKey), out, hourstl);
    }
    return out;
  }

  function getItem(key) {
    var item = localStorage.getItem(PREFIX+key);
    if(item) {
      item = JSON.parse(item);
    }
    if ( item && item.t < +new Date() ){
      localStorage.removeItem( PREFIX+key );
    }
    return item != null ? item.p : undefined;
  }
  
  $.ajaxPrefilter( function( options, originalOptions, jqXHR ) {

    // Cache it ?
    if ( !Modernizr.localstorage || !options.localCache ) {
      return undefined;
    }

    var hourstl = options.cacheTTL || 5;

    var originalCacheKey = options.cacheKey || 
                   options.url.replace( /jQuery.*/,'' ) + options.type + options.data;

    var cacheKey = md5(originalCacheKey);

    convertLegacy(originalCacheKey);
    
    // isCacheValid is a function to validate cache
    if ( options.isCacheValid &&  ! options.isCacheValid() ){
      localStorage.removeItem( cacheKey );
    }

    var value = getItem( cacheKey );
    if ( value ){
      //In the cache? So get it, apply success callback & abort the XHR request
      // parse back to JSON if we can.
      //if ( options.dataType.indexOf( 'json' ) === 0 ) {
      //  value = JSON.parse( value );
      //}
      options.success( value );
      // Abort is broken on JQ 1.5 :(
      jqXHR.abort();
    } else {

      //If it not in the cache, we change the success callback, just put data on localstorage and after that apply the initial callback
      if ( options.success ) {
        options.realsuccess = options.success;
      }  

      options.success = function( data ) {
        var strdata = data;
        if ( this.dataType.indexOf( 'json' ) === 0 ) {
          strdata = JSON.stringify( data );
        }

        // Save the data to localStorage catching exceptions (possibly QUOTA_EXCEEDED_ERR)
        savePayload(cacheKey, data, hourstl, function(e) {
          if ( typeof options.cacheError === 'function' ) { 
            options.cacheError( e, originalCacheKey, strdata ); 
          }
        });

        if ( options.realsuccess ) {
          options.realsuccess( data );
        }
      };
      
    }
  });
  
} (this, this.jQuery, this.Modernizr));
