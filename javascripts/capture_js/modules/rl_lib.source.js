/**
 * Provide a set of base functions in the RL.lib namespace.
 *
 * List of functions:
 * - String.random()
 *
 * List of functions in RL.lib namespace:
 * - .createStorage(basePath)
 * - .isOptedOut(complete, settings)
 * - .loadCss()
 * - .loadJs()
 * - .Campaign.checkDynamicUrl(url)
 * - .Campaign.checkUrl(url)
 * - .Campaign.getFromCookie()
 * - .Campaign.getFromQuerystring()
 * - .Node.createForm(settings)
 * - .Node.createIframe(settings)
 * - .Node.createRoot()
 * - .Url.getBaseDomain(url)
 * - .Url.getHostname(url)
 * - .Url.getQuerystring(url, key)
 * - .Storage(settings)
 * - .Storage.getItem(key, success)
 * - .Storage.removeItem(key, success)
 * - .Storage.setItem(key, success)
 * - .Storage.sendRequest(url, settings)
 * - .Storage.url(filePath, data, settings)
 * - .WindowMessageListener.bind(handler, data)
 * - .WindowMessageListener.parseEvent(event)
 * - .WindowMessageListener.queue()
 * - .WindowMessageListener.trigger(id, data, origin)
 * - .WindowMessageListener.unbind(id)
 */
(function(window, RL, $) {

  /**
   * Functions not defined in IE8.
   */
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement) {
      if (this == null) {
        throw new TypeError();
      }
      var t = Object(this);
      var len = t.length >>> 0;
      if (len === 0) {
        return -1;
      }
      var n = 0;
      if (arguments.length > 1) {
        n = Number(arguments[1]);
        if (n != n) { // shortcut for verifying if it's NaN
          n = 0;
        } else if (n != 0 && n != Infinity && n != -Infinity) {
          n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
      }
      if (n >= len) {
        return -1;
      }
      var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
      for (; k < len; k++) {
        if (k in t && t[k] === searchElement) {
          return k;
        }
      }
      return -1;
    }
  }
  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^\s+|\s+$/g, "");
    };
  }


  /**
   * Generate random string.
   *
   * Code is mostly based on https://gist.github.com/2368164.
   * String length is defaulted to 9 characters if the length param is not set.
   *
   * String.random(length)
   * length - int - (optional) string length
   *
   * Return: string
   */
  String.random = function(length) {
    var m = typeof length === "number" && length >= 0 ? length : 9,
        s = "",
        r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i=0; i < m; i++) {
      s += r.charAt(Math.floor(Math.random() * r.length));
    }

    return s;
  };


  var LIB = RL.lib = {
    /**
     * Create a RL.lib.Storage object.
     *
     * .createStorage(basePath)
     * basePath - string - url address of where the set, get, remove web storage services
     *
     * Return: RL.lib.Storage
     */
    createStorage: function(basePath) {
      // Sanity check.
      if (typeof basePath !== "string" || basePath.length < 1) {
        return undefined;
      }

      return new this.Storage({basePath: basePath});
    },

    /**
     * Check if the tracking opt-out cookie is set.
     *
     * If the opt-out is set, the cookie value is passed to the complete callback function; otherwise, the boolean
     * false is passed.  The cookie is cached for the duration specified in the settings parameter or the default
     * is 30 seconds.
     *
     * .isOptedOut(complete, settings)
     * complete - function - function called after the cookie is retrieved
     * settings - object - key-value mapping
     *
     * complete function:
     * cookie - string/boolean - cookie value or false
     *
     * settings object:
     * forced - boolean - force a check rather than fetch from cache
     * duration - int - cache duration in seconds (30 seconds default)
     */
    isOptedOut: (function() {
      var cookieName = "RlocalOptOut",
          cookieValue,
          cookieExpiration = new Date(2000, 0, 1);

      return function(complete, settings) {
        var currentDate = new Date(),
            settings = settings || {},
            forced = settings.forced === true ? true : false,
            duration = (typeof settings.duration === "number" && settings.duration > 0) ? settings.duration : 30;

        if (forced === false && cookieExpiration >= currentDate) {
          // Read from cache.
          if (typeof complete === "function") {
            complete(cookieValue);
          }
          return;
        }

        var callback = function() {
          // Cache cookie value.
          cookieValue = window[cookieName] ? window[cookieName] : false;
          cookieExpiration = currentDate;
          cookieExpiration.setSeconds(currentDate.getSeconds() + duration);

          if (typeof complete === "function") {
            complete(cookieValue);
          }
          return;
        };

        $.ajax({
          url: ["//", RL.config.config.domains.mms, "/getcookie?", cookieName].join(""),
          dataType: "script",
          cache: true,
          crossdomain: true,
          success: callback
        });
      };
    })(),

    /**
     * Load external CSS file.
     *
     * .loadCss(url)
     * url - string - file path
     *
     * Return: RL.lib
     */
    loadCss: function(url) {
      // Create link tag element.
      var linkE = document.createElement("link");
      linkE.rel = "stylesheet";
      linkE.type = "text/css";
      linkE.href = url;
      linkE.media = "all";

      // Append to HEAD element.
      document.getElementsByTagName("head")[0].appendChild(linkE);

      return this;
    },

    /**
     * Load external JavaScript file asynchronously.
     *
     * .loadJs(url, complete)
     * url - string - file path
     * complete - function - callback function when script has been loaded
     *
     * Return: RL.lib
     */
    loadJs: function(url, complete) {
      // Create script tag element.
      var scriptE = document.createElement("script");
      scriptE.src = url;
      scriptE.async = true;

      if (typeof complete === "function") {
        // Attach onload callback function to script tag.
        if (scriptE.addEventListener) {
          // Firefox, Chrome, and IE >= 9.
          $(scriptE).bind("load", function($e) {
            $(this).unbind($e);
            complete.call(this);
          });
        } else {
          // IE < 9.
          $(scriptE).bind("readystatechange", function($e) {
            if (this.readyState === "complete" || this.readyState === "loaded") {
              $(this).unbind($e);
              complete.call(this);
            }
          });
        }
      }

      // Append to HEAD element.
      document.getElementsByTagName("head")[0].appendChild(scriptE);

      return this;
    }
  };

  LIB.Campaign = (function() {
    var _LIB_ = LIB,  // RL.lib alias.
        CAMPAIGN_DATA = {"scid": "", "cid": "", "tc": "", "rl_key": "", "kw": "", "pub_cr_id": ""},
        DOMAINS = JSON.parse(JSON.stringify(window.RL_PROXY_DOMAINS || []));

    return {
      /**
       * Check if url is dynamically proxied.
       *
       * Call .getHostname() to get the hostname then the hostname is checked to see if it starts
       * with "url" and contains at least 1 pair of "--" and return a boolean.
       *
       * Campaign.checkDynamicUrl(url)
       * url - string - url value
       *
       * Return: boolean
       */
      checkDynamicUrl: function(url) {
        var hostname = _LIB_.Url.getHostname(url);
        return (hostname.indexOf("url") === 0 && hostname.indexOf("--") > -1) ? true : false;
      },

      /**
       * Check if url is hard proxied.
       *
       * Call .getBaseDomain() to get the base domain then the base domain is compared to a list of valid
       * proxy base domains.  Return a boolean.
       *
       * Campaign.checkUrl(url)
       * url - string - url value
       *
       * Return: boolean
       */
      checkUrl: function(url) {
        var baseDomain = _LIB_.Url.getBaseDomain(url);
        return DOMAINS.indexOf(baseDomain) > -1 ? true : false;
      },

      /**
       * Retrieve PROXY cookie.
       *
       * Read PROXY cookie "RLocalUID" and return an object or null if none exist.
       *
       * Campaign.getFromCookie()
       *
       * Return: object/null
       */
      getFromCookie: function() {
        var cookie = $.deparam($.cookie("RlocalUID") || "");
        return (cookie.scid && cookie.cid && cookie.tc) ? $.extend(CAMPAIGN_DATA, cookie) : null;
      },

      /**
       * Retrieve campaign data from querystring.
       *
       * Read campaign data from querystring and return an object or null if none exist.
       * Will use "querystring" param instead of location.search if param is used.
       *
       * Campaign.getFromQuerystring(querystring)
       * querystring - string - (optional) url querystring value
       *
       * Return: object/null
       */
      getFromQuerystring: (function() {
        var querystring = (function(querystring) {
          querystring = $.deparam(querystring.replace("?", ""));
          return (!querystring.scid || !querystring.cid || !querystring.tc || !querystring.rl_key) ? null : $.extend(CAMPAIGN_DATA, querystring);
        })(location.search);

        return function() {
          return querystring;
        }
      })()
    };
  })();

  LIB.Node = {
    /**
     * Create a simple FORM element node.
     *
     * Create a FORM element node with no submit button child element node.  If the settings.data is set,
     * hidden INPUT element node(s) are created and appended to the FORM element node.
     *
     * The settings.method param is defaulted to "post" if it is not set or set to an invalid value.
     *
     * The settings.data param allows for string, number, null, and array of string, number, and null values.
     * Ex. {foo: "bar", sky: 1, earth: null, water: ["foo", 1, null]}
     *
     * Node.createForm(settings)
     * settings - object - (optional) key-value mapping
     *
     * settings object:
     * id - string - element id
     * method - string - HTTP method ("get" or "post")
     * action - string - destination address of where to send the data
     * target - string - where to display the response
     * parentNode - object - parent node to attach to
     * data - object - key-value mapping
     *
     * Return: FORM element node.
     */
    createForm: function(settings) {
      var formE = document.createElement("form"),
          docFragment = document.createDocumentFragment();

      // Initialize settings param.
      settings = $.isPlainObject(settings) ? settings : {};

      if (typeof settings.id === "string" && settings.id !== "") {
        formE.id = settings.id;
      }
      if (typeof settings.action === "string" && settings.action !== "") {
        formE.action = settings.action;
      }
      if (typeof settings.target === "string" && settings.target !== "") {
        formE.target = settings.target;
      }
      formE.method = typeof settings.method === "string" && settings.method === "get" ? "get" : "post";

      if ($.isPlainObject(settings.data)) {
        // Create FORM INPUT element nodes.
        for (var key in settings.data) {
          var value = settings.data[key];

          if (typeof value === "string" || typeof value === "number" || value === null) {
            docFragment.appendChild($("<input>", {name: key, value: value, type: "hidden"}).get(0));
          } else if ($.type(value) === "array") {
            var keyArrayName = [key, "[]"].join("");
            for (var i = value.length; --i >= 0;) {
              // Create an INPUT element node for each value array element.
              var valueArrayElement = value[i];
              if (typeof valueArrayElement === "string" || typeof valueArrayElement === "number" || valueArrayElement === null) {
                docFragment.appendChild($("<input>", {name: keyArrayName, value: valueArrayElement, type: "hidden"}).get(0));
              }
            }
          }
        }
        if (docFragment.hasChildNodes()) {
          formE.appendChild(docFragment);
        }
      }

      if (typeof settings.parentNode === "object" && settings.parentNode.nodeType === 1) {
        settings.parentNode.appendChild(formE);
      }

      return formE;
    },

    /**
     * Create a simple IFRAME element node.
     *
     * If the settings.complete function is specified, "this" is set as the IFRAME element node.
     * In addition, the event object is passed to it as a parameter.
     *
     * Node.createIframe(settings)
     * settings - object - (optional) key-value mapping
     *
     * settings object:
     * id - string - element id
     * complete - function - load event handler
     * name - string - element name
     * parentNode - object - parent node to attach to
     * src - string - address of the document to embed
     *
     * complete function:
     * event - object - the event object
     *
     * Return: IFRAME element node.
     */
    createIframe: function(settings) {
      var iframeE = document.createElement("iframe");

      // Initialize settings param.
      settings = $.isPlainObject(settings) ? settings : {};

      if (typeof settings.id === "string" && settings.id !== "") {
        iframeE.id = settings.id;
      }
      if (typeof settings.name === "string" && settings.name !== "") {
        iframeE.name = settings.name;
      }
      if (typeof settings.src === "string" && settings.src !== "") {
        iframeE.src = settings.src;
      }

      if (typeof settings.complete === "function") {
        $(iframeE).load(function($e) {
          settings.complete.call(this, $e.originalEvent);
        });
      }

      if (typeof settings.parentNode === "object" && settings.parentNode.nodeType === 1) {
        settings.parentNode.appendChild(iframeE);
      }

      return iframeE;
    },

    /**
     * Create "rl-root" hidden DIV element node.
     *
     * Node.createRoot()
     *
     * Return: DIV element node.
     */
    createRoot: function() {
      var $rootE = $("#rl-root");

      if ($rootE.length === 0) {
        // Create .
        $rootE = $("<div>", {id: "rl-root", css: {left: "-9999px", top: "-9999px", display: "none", property: "absolute"}})
          .appendTo($("body"));
      }

      return $rootE.get(0);
    }
  };

  LIB.Url = {
    /**
     * Get the base domain of an url.
     *
     * Call .getHostname() to get the hostname then the hostname is used to parse out
     * the base domain.
     *
     * Url.getBaseDomain(url)
     * url - string - url value
     *
     * Return: string
     */
    getBaseDomain: function(url) {
      var hostname = this.getHostname(url),
          hostnameArr = hostname.split(".");

      if (hostnameArr.length > 2) {
        return [hostnameArr[hostnameArr.length - 2], hostnameArr[hostnameArr.length - 1]].join(".");
      }
      return hostname;
    },

    /**
     * Get the hostname of an url.
     *
     * Url.getHostname(url)
     * url - string - url value
     *
     * Return: string
     */
    getHostname: function(url) {
      return (typeof url !== "string" || url === "") ? "" : url.replace(/^(https?:)?\/\/([^\/?#:]+)([\/?#:]+[^\/?#:]*)*/gi, "$2");
    },

    /**
     * Parse out the querystring portion of an url.
     *
     * Querystring is deserializes into a key-value mapping.  If key param is set, only those values are returned.  If key param is
     * set to an empty string, null, or undefined, all values are returned.
     *
     * Require jQuery deparam() plugin.
     *
     * Url.getQuerystring(url, key)
     * url - string - url value
     * key - string/array - (optional) key/keys to look for
     *
     * Return: object
     */
    getQuerystring: function(url, key) {
      var querystring = {},
          response = {};

      // Sanity check.
      if (typeof url !== "string" || url.length < 1) {
        return response;
      }

      // Deserialize string into a key-value mapping.
      querystring = $.deparam(url.replace(/[^?#]*(\?([^?#]*))?(#[^?#]*)?/gi, "$2"));

      switch ($.type(key)) {
        case "string":
          if (key.length > 0) {
            response[key] = querystring[key] || "";
          } else {
            response = querystring;
          }
          break;

        case "array":
          for (var i = -1, length = key.length; ++i < length;) {
            var keyItem = key[i];
            if (typeof keyItem === "string") {
              response[keyItem] = querystring[keyItem] || "";
            }
          }
          break;

        default:
          response = querystring;
      }

      return response;
    }
  };

  LIB.Form = (function() {
    var Form = function() {
      var cache = [];   // Stores form elements and their original onsubmit functions.

      /**
       *
       */
      this.cache = function() {
        return $.extend(true, [], cache);
      };

      /**
       *
       */
      this.cacheFormAndOnsubmit = function(formE, onsubmitFn) {
      };

    };

    /**
     *
     */
    Form.prototype.startCapture = function() {
      var formEs = document.forms;

      for (var i = -1, length = formEs.length; ++i < length;) {
        var formE = formEs[i],
            onsubmitFn = formE.onsubmit;

        if (this.constructor.hasOnsubmit(formE)) {
          this.cacheFormAndOnsubmit(formE, onsubmitFn);
          this.constructor.overrideOnsubmit(formE);
        }

      }
    };

    /**
     *
     */
    Form.hasOnsubmit = function(formE) {
      //return typeof formE.onsubmit === "function" ? true : false;
    };

    /**
     *
     */
    Form.overrideOnsubmit = function(formE) {

    };

    return Form;
  })();

  LIB.FormCapture = (function() {

  });

  /**
   * A class to store data in a remote web storage.
   */
  LIB.Storage = (function(LIB) {
    /**
     * Create a Storage object.
     *
     * Storage(settings)
     * settings - object - key-value mapping
     *
     * settings object:
     * basePath - string - url address of where the set, get, remove web storage services
     */
    var Storage = function(settings) {
      settings = $.isPlainObject(settings) ? settings : {};

      this.settings = function(key) {
        if (typeof key === "string" && key !== "") {
          return settings[key];
        }
        return settings;
      };
    };

    /**
     * Create the endpoint url that contains the payload.
     *
     * This is function is used internally by .setItem(), .getItem(), and .removeItem().
     *
     * .url(filePath, data, settings)
     * filePath - string - path of endpoint
     * data - array - data array
     * settings - object - (optional) key-value mappings
     *
     * settings object:
     * eventId - string - event id used for window "message" event
     */
    Storage.prototype.url = function(filePath, data, settings) {
      var eventId,
          payload;

      if (typeof filePath !== "string" || filePath.length < 1) {
        // Invalid filePath parameter.
        return false;
      }

      if ($.type(data) !== "array" || data.length < 1) {
        // Invalid data parameter.
        return false;
      }

      settings = $.isPlainObject(settings) ? settings : {};

      eventId = typeof settings.eventId === "string" ? settings.eventId : "";

      payload = data;

      return [this.settings("basePath"), filePath, "?rl_eid=", eventId, "&rl_ws=", encodeURIComponent(JSON.stringify(payload))].join("");
    };

    /**
     * Send request to endpoint.
     *
     * This is function is used internally by .setItem(), .getItem(), and .removeItem().
     *
     * .sendRequest(url, data, settings)
     * url - string - endpoint url
     * settings - object - (optional) key-value mappings
     *
     * settings object:
     * eventId - string - event id used for window "message" event
     * success - function - function to be called if the request succeeds
     *
     * success function:
     * data - string - retrieved data
     */
    Storage.prototype.sendRequest = function (url, settings) {
      var _LIB_ = LIB;    // LIB alias.
      var messageHandler,
          iframeCompleteCallback;

      if (typeof url !== "string" || url.length < 1) {
        // Invalid url parameter.
        return false;
      }

      settings = $.isPlainObject(settings) ? settings : {};

      if (typeof settings.eventId === "string" && settings.eventId.length > 0) {
        messageHandler = function(data, response, origin) {
          // Security check.
          if (origin.search(/\.(rlmms|rlets|rlcdn|reachlocal)(-(qa|dev|test|sb))?\.|(lvh\.me)|file:\/\/|jasmine/gi) < 0) {
            // Ignore messages not from RL domains.
            return;
          }

          _LIB_.WindowMessageListener.unbind(settings.eventId);

          if (typeof settings.success === "function") {
            // Return data to callback function.
            settings.success(response);
          }
        };
        _LIB_.WindowMessageListener.bind(messageHandler, settings.eventId);
      }

      iframeCompleteCallback = function() {
        var $iframeE = $(this);
        var removeIframe = function() {
          $iframeE.remove();
        };
        setTimeout(removeIframe, 100);
      };

      return _LIB_.Node.createIframe({
        parentNode: _LIB_.Node.createRoot(),
        src: url,
        complete: iframeCompleteCallback
      });
    };

    /**
     * Retrieve arbitrary data from storage.
     *
     * .getItem(key, success)
     * key - string/array - key or array of keys
     * success - function - function to be called if the request succeeds
     *
     * success function:
     * data - string - retrieved data
     */
    Storage.prototype.getItem = function(key, success) {
      var FILE_PATH = "/getItem.html",
          EVENT_ID = ["getItem", String.random(7)].join("-"),
          payload = [],
          url;

      if ($.type(key) === "string") {
        payload.push(key);
      } else if ($.type(key) === "array") {
        for (var i = -1, length = key.length; ++i < length;) {
          var keyItem = key[i];
          if (typeof keyItem === "string") {
            payload.push(keyItem);
          }
        }
      }

      url = this.url(FILE_PATH, payload, {eventId: EVENT_ID});
      if (url === false) {
        return false;
      }

      this.sendRequest(url, {success: success, eventId: EVENT_ID});
    };

    /**
     * Remove arbitrary data from storage.
     *
     * .removeItem(key, success)
     * key - string/array - key or array of keys
     * success - function - function to be called if the request succeeds
     *
     * success function:
     * data - string - retrieved data
     */
    Storage.prototype.removeItem = function(key, success) {
      var FILE_PATH = "/removeItem.html",
          EVENT_ID = ["removeItem", String.random(7)].join("-"),
          payload = [],
          url;

      if ($.type(key) === "string") {
        payload.push(key);
      } else if ($.type(key) === "array") {
        for (var i = -1, length = key.length; ++i < length;) {
          var keyItem = key[i];
          if (typeof keyItem === "string") {
            payload.push(keyItem);
          }
        }
      }

      url = this.url(FILE_PATH, payload, {eventId: EVENT_ID});
      if (url === false) {
        return false;
      }

      this.sendRequest(url, {success: success, eventId: EVENT_ID});
    };

    /**
     * Store arbitrary data.
     *
     * The data parameter is an array of key-value mapping objects.  Each object contains "k" (key) and "v" (value) properties
     * and an optional "e" (expires) property.  The key and value properties must be of type string, and the key property
     * value cannot be an empty string.  The expires property value must be a number or an empty string.  If the expires
     * value is set, localStorage is used when the value is a future time, or else sessionStorage is used.
     * See https://developer.mozilla.org/en-US/docs/DOM/Storage for the difference between the two.
     *
     * .setItem(data, success)
     * data - array - array of key-value mappings
     * success - function - callback
     *
     * success function:
     * data - string - retrieved data
     */
    Storage.prototype.setItem = function(data, success) {
      var FILE_PATH = "/setItem.html",
          EVENT_ID = ["setItem", String.random(7)].join("-"),
          payload = [],
          url;

      // Sanity check.
      if ($.type(data) !== "array") {
          // data must be an array.
          return false;
      }
      for (var i = -1, length = data.length; ++i < length;) {
        var datum = data[i];
        if ($.isPlainObject(datum)) {
          payload.push(datum);
        }
      }

      url = this.url(FILE_PATH, payload, {eventId: EVENT_ID});
      if (url === false) {
        return false;
      }

      this.sendRequest(url, {success: success, eventId: EVENT_ID});
    };

    return Storage;
  })(LIB);

  /**
   * A class that provides queueing of objects to ids.
   */
  LIB.DataQueue = function() {
    var queue = {},
        unbindCounter = 0;    // Number of unbind() calls.

    /**
     * Retrieve data.
     *
     * Retrieve data mapping to an id.
     *
     * .get(id)
     * id - string - unique id
     *
     * Return: object
     */
    this.get = function(id) {
      var data;

      if (id === undefined) {
        return $.extend(true, {}, queue);
      }

      return queue[id];
    };

    /**
     * Insert data.
     *
     * If an id is set, then the data is mapped to that id.  If data already exists for that id, then the
     * existing data is overwritten.  If an id is not set, then one will be generated.  In either case,
     * the id is returned.
     *
     * .insert(data, id)
     * data - object - any piece of data
     * id - string - (optional) id
     *
     * Return: string
     */
    this.insert = function(data, id) {
      if (data === undefined) {
        return false;
      }

      if (typeof id !== "string" || id.length < 1) {
        id = String.random(10);
      }

      queue[id] = data;

      return id;
    };

    /**
     * Remove data.
     *
     * Remove data mapping to an id if id exists.  If id param is not set, then all data are purged.
     * If data mapped to an id is purged, then the id is returned.  If all data are purged, then the
     * boolean true is returned.  The boolean false is returned if id is set but does not exist.
     *
     * .remove(id)
     * id - string - id
     *
     * Return: boolean/string
     */
    this.remove = function(id) {
      if (id === undefined) {
        // Remove all data.
        queue = {};
        unbindCounter = 0;

        return true;
      } else if (queue[id]) {
        // Remove mapped data.
        queue[id] = undefined;

        if (++unbindCounter > 2) {
          // Clean up queue object.
          queue = this.queue();
          unbindCounter = 0;
        }

        return id;
      }

      return false;
    };
  };

  LIB.WindowMessageListener = (function() {
    /**
     * Will automatically listen to "message" events triggered by postMessage() calls.
     * See https://developer.mozilla.org/en-US/docs/DOM/window.postMessage.
     *
     * All RL postMessage() calls must pass a JSON string for the "message" parameter.
     * The string must contain "id" and "data" keys.  The "id" key maps to a string, and the "data" key
     * maps to an object.
     * Ex. "{\"id\":\"234234\",\"data\":{\"foo\":\"bar\"}}"
     */
    var queue = {},
        unbindCounter = 0,    // Number of unbind() calls.
        API;

    API = {
      /**
       * Attach a handler to the "message" event for the window DOM object.
       *
       * If binding is success, return an unique id (user-specified id) or else the boolean false.
       *
       * WindowMessageListener.bind(handler, data)
       * handler - function - function to execute each time the event is triggered
       * id - string - (optional) user-defined id
       * data - object - (optional) key-value mapping containing data that will be passed to the event handler
       *
       * handler function parameters:
       * object - (optional) data object from .bind()
       * object - (optional) data sent by the document that caused the event
       * string - (optional) the scheme, hostname and port of the document that caused the event
       *
       * Return: string/boolean
       */
      bind: function(handler, id, data) {
        var id;

        if (typeof handler !== "function") {
          return false;
        }

        if (typeof id !== "string" || id.length < 1) {
          id = String.random(10);
        }
        queue[id] = {
          handler: handler,
          data: $.isPlainObject(data) ? JSON.parse(JSON.stringify(data)) : undefined
        };
        return id;
      },

      /**
       * Parse JSON string message sent by postMessage() call.
       *
       * Parse "id" and "data" key values, and return them along with the event origin value in
       * a key-value mapping object.  If those keys do not exist or the "id" key value is not a valid
       * string, then return the boolean false
       *
       * WindowMessageListener.parseEvent(event)
       * event - object - DOM event object
       *
       * Return: object
       */
      parseEvent: function(event) {
        var id,
            data,
            payload;

        if (!event) {
          return false;
        }

        try {
          payload = JSON.parse(event.data);
        } catch(err) {
          // Not a valid message.
          return false;
        }

        if ($.isPlainObject(payload)) {
          id = payload.id;
          data = payload.data;
        }

        if (typeof id !== "string" || id === "") {
          // Invalid id.
          return false;
        }

        return {
          id: id,
          data: data,
          origin: event.origin
        }
      },

      /**
       * Return a copy of the queue.
       *
       * WindowMessageListener.queue()
       *
       * Return: object
       */
      queue: function() {
        return $.extend(true, {}, queue);
      },

      /**
       * Execute handler.
       *
       * If id maps to a handler, then execute the handler and return true or else return false.
       *
       * WindowMessageListener.trigger(id, data, origin)
       * id - string - unique id returned by .bind()
       * data - object - (optional) any object.
       * origin - string - (optional) the scheme, hostname and port
       *
       * Return: boolean
       */
      trigger: function(id, data, origin) {
        var eventHandler = queue[id];

        if (eventHandler === undefined) {
          return false;
        }

        eventHandler.handler(eventHandler.data, data, origin);

        return true;
      },

      /**
       * Remove a previously-attached event handler for the window DOM object.
       *
       * If id maps to a handler, remove handler and return id or else return the boolean false.
       * After 10 successful unbind() calls, the queue object is cleaned up by removing keys that map to
       * the "undefined" object.
       *
       * If id is undefined, remove all handlers.
       *
       * WindowMessageListener.unbind(id)
       * id - string - (optional) unique id returned by .bind()
       *
       * Return: string/boolean
       */
      unbind: function(id) {
        if (id === undefined) {
          // Remove all handlers.
          queue = {};
          unbindCounter = 0;
        } else if (queue[id]) {
          // Remove mapped handler.
          queue[id] = undefined;

          if (++unbindCounter > 2) {
            // Clean up queue object.
            queue = this.queue();
            unbindCounter = 0;
          }

          return id;
        }

        return false;
      }
    };

    // Cache functions for internal use.
    var parseEvent = API.parseEvent,
        triggerEvent = API.trigger;

    // Event handler for the "message" event.
    var eventHandler = function($event) {
      var eventData = parseEvent($event.originalEvent);

      if (eventData === false) {
        // Not a valid RL message event.
        return;
      }

      triggerEvent(eventData.id, eventData.data, eventData.origin);
    };

    // Bind event handler to "message" event.
    $(window).bind("message", eventHandler);

    return API;
  })();

})(window, window.RL, window.rl_jquery)