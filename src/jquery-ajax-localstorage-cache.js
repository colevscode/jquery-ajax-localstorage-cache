// github.com/paulirish/jquery-ajax-localstorage-cache
// dependent on Modernizr's localStorage test
//

(function(window, $, Modernizr, undefined) {

  var PREFIX = '_jalc_';
  var noop = function(){};

  function save(key, val, isLegacy, err) {
    err = err || noop; 
    try {
      if(isLegacy) {
        localStorage.setItem( key, JSON.stringify(val.p));
        localStorage.setItem( key+'cachettl', JSON.stringify(val.t));
      } else {
        localStorage.setItem( PREFIX+key, JSON.stringify(val));
      }
    } catch (e) {
      // Remove any incomplete data that may have been saved before the exception was caught
      if(isLegacy) {
        localStorage.removeItem( key );
        localStorage.removeItem( key+'cachettl' );
      } else {
        localStorage.removeItem( PREFIX+key );
      }
      err( e, val );
    }
  }

  //save payload
  function savePayload(fingerprint, payload, hourstl, isLegacy, onError) {
    var expires = +new Date() + 1000 * 60 * 60 * hourstl;
    save(fingerprint, {
      t: expires,
      p: payload
    }, isLegacy, onError);
  }
  
  //Someone may have upgraded the plugin.. Respect the user and clean up
  function convertLegacy(cacheKey) {
    var out;
    var ttl = localStorage.getItem(cacheKey + 'cachettl');
    var value = localStorage.getItem( cacheKey );
    if(ttl && value) {
      value = JSON.parse(value);
      localStorage.removeItem(cacheKey + 'cachettl');
      localStorage.removeItem( cacheKey );
      out =  {
        t: ttl,
        p: value
      };
      save(md5(cacheKey), out);
    }
    return out;
  }

  function getItem(key, isLegacy) {
    var item;
    var ttl;
    if(isLegacy) {
      item = localStorage.getItem(key);
      ttl = localStorage.getItem(key+'cachettl');
    } else {
      item = localStorage.getItem(PREFIX+key);
    }
    if(item) {
      item = JSON.parse(item);
    }
    if(!isLegacy && item) {
      ttl = item.t;
      item = item.p;
    }
    if ( item && ttl < +new Date() ){
      if(isLegacy) {
        localStorage.removeItem(key);
        localStorage.removeItem(key+'cachettl');
      } else {
        localStorage.removeItem( PREFIX+key );
      }
      item = null;
    }
    return item;
  }
  
  $.ajaxPrefilter( function( options, originalOptions, jqXHR ) {

    // Cache it ?
    if ( !Modernizr.localstorage || !options.localCache ) {
      return undefined;
    }

    var hourstl = options.cacheTTL || 5;

    var originalCacheKey = options.url.replace( /jQuery.*/,'' ) + options.type + options.data;

    var isLegacy = options.cacheKey != null;

    var cacheKey= options.cacheKey || md5(originalCacheKey);

    if(!isLegacy) {
      convertLegacy(originalCacheKey);
    }
    
    // isCacheValid is a function to validate cache
    if ( options.isCacheValid &&  ! options.isCacheValid() ){
      if(isLegacy) {
        localStorage.removeItem( cacheKey );
      } else {
        localStorage.removeItem( PREFIX+cacheKey );
      }
    }

    var value = getItem( cacheKey, isLegacy);
    if ( value ){
      //In the cache? So get it, apply success callback & abort the XHR request
      // parse back to JSON string if we can.
      if (options.dataType.indexOf( 'json' ) !== 0 ) {
        value = JSON.stringify( value );
      } 
      
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
        savePayload(cacheKey, data, hourstl, isLegacy, function(e) {
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
