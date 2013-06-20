/**
 * MODULES.
 */
(function(window, $RL) {
  "use strict";

  var document = window.document,
    $CORE = {},         // Holds core/required modules before they are loaded.
    $OPTIONAL = {};     // Holds all the optional modules before they are loaded.


  $CORE = {
    /**
     * Functions required for cross-browser compatibility.
     */
    compatibility: function() {
      /**
       * Array.indexOf() is not defined in IE8.
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

      /**
       * String.trim() is not defined in IE8.
       */
      if(!String.prototype.trim) {
        String.prototype.trim = function () {
          return this.replace(/^\s+|\s+$/g,'');
        };
      }

      return this;
    },

    init: function() {
      // Alias jQuery.
      $RL.jq = window.rl_jquery;

      // Load required modules.
      this.compatibility().randomString().javascript().events().storage().post();

      // Init function to create RL framework.
      $RL.init = function() {
        var cfg = window.rl_widget_cfg;

        // Verify config object.
        if (!cfg || !cfg.config || !cfg.products) {
          return false;
        }

        this.config = (function(cfg) {
          // Clean up config data.
          var c = JSON.parse(JSON.stringify(cfg)),
            p = {};

          // Process product configs.
          for (var i = -1, length = cfg.products.length; ++i < length;) {
            var product = cfg.products[i];
            p[product.name] = product.config;
          }
          c.products = p;

          // Remove module configs.
          c.modules = undefined;

          // Clean up internal domains.
          c.config.domains.internal = (function(domains) {
            for (var i = -1, length = domains.length; ++i < length;) {
              domains[i] = domains[i].replace(/ /g, "");
            }
            return domains;
          })(c.config.domains.internal);

          return c;
        })(cfg);

        this.config.config = (function(c) {
          // Populate config object with basic page information.
          c.pageUri = (function(location) {
            return {
              hash: location.hash.length > 1 ? location.hash.slice(1) : "",
              hostname: location.hostname,
              href: location.href,
              pathname: location.pathname,
              protocol: location.protocol,
              search: location.search.length > 1 ? location.search.slice(1) : ""
            };
          })(window.location);
          c.pageTitle = window.document.title;
          c.referrer = (function(d, $) {
            var c = $.cookie("RlocalHilite");
            if (c === null) {
              return d.referrer;
            }
            return $.deparam(c).se_refer || "";
          })(window.document, $RL.jq);
          c.scorpion = $RL.jq("body").attr("data-source") === "c77d130cdb614c8497a9b22757aa6382" ? 1 : 0;
          c.dotNet = (function($) {
            var $formsE = $("form");
            if ($formsE.length === 1) {
              if (($formsE.attr("onsubmit") || "").indexOf("WebForm_OnSubmit()") > -1 || typeof __doPostBack === "function" || ($("input#__EVENTTARGET").length === 1 && $("input#__EVENTARGUMENT").length === 1 && $("input#__VIEWSTATE").length === 1)) {
                return 1;
              }
            }
            return 0;
          })($RL.jq);
          return c;
        })(this.config.config);

        return this;
      };

      // Give window.RL access to list of optional modules.
      $RL._MODULES = $OPTIONAL;

      return $RL;
    },

    /**
     * Create an internal message queue for events.
     *
     * Available functions in the .Events namespace:
     * - subscribe(product, event, handler, scope)
     * - dispatch(product, event, data)
     * - unsubscribe(product, name, id)
     */
    events: function() {
      var buffer = {};

      $RL.Events = {
        /**
         * Subscribe to an event.
         *
         * Returns an alpha-numeric id if subscription is successful or else false.
         * The handler function should return a "false" if there is async logic.
         *
         * RL.Events.subscribe(product, event, handler, scope)
         * product - string - product name (e.g. capture)
         * event - string - event name (e.g. load, close)
         * handler - function - a function to execute each time the event is triggered
         * scope - object - (optional) scope for the handler function
         *
         * handler function:
         * data - object - (optional) key-value mapping
         * complete - function - (optional) must execute this function if exist when handler contains async logic
         */
        subscribe: function(product, event, handler, scope) {
          var id = String.random(5);

          // Sanity check.
          if (typeof product !== "string" || typeof event !== "string" || typeof handler !== "function" || product === "" || event === "") {
            // product, event, and handler params are required.
            return false;
          }

          // Store event.
          if (!buffer[product]) {
            buffer[product] = {};
          }
          if (!buffer[product][event]) {
            buffer[product][event] = [];
          }
          buffer[product][event].push({id: id, handler: handler, scope: scope});

          return id;
        },
        /**
         * Dispatch an event.
         *
         * RL.Events.dispatch(product, event, data)
         * product - string - product name (e.g. capture)
         * event - string - event name (e.g. load, close)
         * data - object - (optional) key-value mapping
         * complete - function - (optional) function to execute once subscribed queue has been dispatched
         */
        dispatch: function(product, event, data, complete) {
          var queue = (buffer[product] && buffer[product][event]) ? buffer[product][event] : [],
            asyncQueueCount = 0,
            asyncQueueCounter = 0;

          // Helper function to check if async queue has been dispatched.
          var done = typeof complete === "function" ? function() {
              if (++asyncQueueCounter >= asyncQueueCount) {
                complete();
              }
            } : undefined;

          for (var i = -1, length = queue.length; ++i < length;) {
            var q = queue[i],
              scope,
              r;

            if (q === undefined || q === null) {
              continue;
            }

            scope = q.scope;
            r = scope ? q.handler.call(scope, data, done) : q.handler(data, done);

            if (r === false) {
              // Queue contains async handler.  Increase count.
              asyncQueueCount++;
            }
          }

          if (typeof complete === "function" && asyncQueueCount === 0) {
            // Queue does not contain async handlers and has been dispatched.
            complete();
          }
        },
        /**
         * Unsubscribe from an event.
         *
         * If id is not provided, then all the handlers are removed.
         *
         * RL.Events.unsubscribe(product, name, id)
         * product - string - product name (e.g. capture)
         * event - string - event name (e.g. load, close)
         * id - string - (optional) id returned from subscribe()
         */
        unsubscribe: function(product, event, id) {
          var queue = (buffer[product] && buffer[product][event]) ? buffer[product][event] : [];

          if (typeof id === "string" && id !== "") {
            // Remove handler with specified id.
            for (var i = -1, length = queue.length; ++i < length;) {
              if (queue[i].id === id) {
                buffer[product][event].splice(i, 1);
                return;
              }
            }
            return;
          }

          if (queue.length > 0) {
            // Remove all handlers.
            buffer[product][event] = [];
          }
        }
      };

      return this;
    },

    /**
     * Load external JavaScript file asynchronously.
     *
     * .loadJs(uri, complete)
     * uri - string - file path
     * complete - function - callback function when script has been loaded
     */
    javascript: function() {
      // Create RL.loadJS method.
      $RL.loadJs = function(uri, complete) {
        // Create script tag element.
        var scriptE = document.createElement("script");
        scriptE.type = "text/javascript";
        scriptE.src = uri;
        scriptE.async = true;

        if (typeof complete === "function") {
          // Attach onload callback function to script tag.
          if (scriptE.readyState) {
            // IE.
            scriptE.onreadystatechange = function() {
              if (this.readyState === "complete" || this.readyState === "loaded") {
                complete();
              }
            };
          } else {
            // Firefox, Chrome.
            scriptE.onload = function() {
              complete();
            };
          }
        }

        // Append script tag to HEAD element.
        document.getElementsByTagName("head")[0].appendChild(scriptE);
      };

      return this;
    },

    /**
     * Perform a form post.
     *
     * Create a form and an iframe, and perform a post to the iframe.
     * Requires jQuery library.
     *
     * The complete function is called when the iframe the form is posting to is loaded;
     * in short, the load event is triggered.  This function will be called even if the
     * iframe loads a 404 page.
     *
     * The success function is called when the iframe sends a message via postMessage()
     * to the parent window, and the message is accepted by the handler.  The message must
     * be a JSON string with the following format: {id: "", data: {}}.  The id value is the
     * value passed in the form field "rl_eid".
     *
     * .post(uri, data, options)
     * uri - string - URL where request is sent
     * data - object - key-value mapping
     * options - object - (optional) key-value mapping
     *
     * options object:
     * id - string - form ID
     * complete - function - function to be called when the request finishes
     * success - function - function to be called if the request succeeds
     */
    post: function() {
      var $ = $RL.jq; // jQuery alias.

      // Helper function create a form in a hidden IFRAME.
      var sendRequest = function(options) {
        var IFRAME_ID = ["rl-iframe", options.id].join("-"),
          IFRAME_NAME = IFRAME_ID.replace(/-/g, "_"),
          FORM_ID = ["rl-form", options.id].join("-"),
          EVENT_ID = String.random(10),
          $rootE = $("#rl-root"),
          $formE = $("<form>", {id: FORM_ID, method: "POST", target: IFRAME_NAME, action: options.uri}),
          $iframeE = $("<iframe>", {id: IFRAME_ID, name: IFRAME_NAME, src: "about:blank"});

        if ($rootE.length === 0) {
          // Create hidden DIV.
          $rootE = $("<div>", {id: "rl-root"})
            .css({height: 0, width: 0, display: "none"})
            .appendTo($("body"));
        } else {
          // Remove exisiting form with same id.
          $(["#", FORM_ID].join("")).remove();

          // Remove exisiting iframe with same id.
          $(["#", IFRAME_ID].join("")).remove();
        }

        if (typeof options.success === "function") {
          (function(o) {
            // Attach eventhandler to intercept messages from iframe.
            $(window).bind("message", function($e) {
              var e = $e.originalEvent,
                data;

              try {
                // Process data.
                data = JSON.parse(e.data);
              } catch(err) {
                // Invalid message.
                return false;
              }

              // Security check.
              if (!data.id || o.eventId !== data.id) {
                // Event id must be the same.
                return false;
              }

              // Remove bound event since it should never be used again.
              $(window).unbind($e);

              setTimeout(function() {
                // Clean up form and iframe elements.
                o.$iframeE.remove();
                o.$formE.remove();
              }, 50);

              // Return data to success function.
              o.success(data.data);
            });
          })({eventId: EVENT_ID, success: options.success, $formE: $formE, $iframeE: $iframeE});
        }

        // Set up iframe.
        $iframeE
          .appendTo($rootE)
          .load(function() {
            if (typeof options.success !== "function") {
              // Clean up after iframe loads since there is no success function.
              setTimeout(function() {
                // Clean up form and iframe elements.
                $formE.remove();
                $iframeE.remove();
              }, 100);
            }

            if (typeof options.complete === "function") {
              // Call complete function since iframe has loaded.
              options.complete();
            }
          });

        (function(o) {
          // Set up form.
          var $formE = o.$formE,
            data = o.data;

          if (typeof options.success === "function") {
            // Create event id field for iframe messaging.
            $formE.append($("<input>", {name: "rl_eid", value: o.eventId, type: "hidden"}));
          }

          // Create form fields.
          for (var key in data) {
            var value = data[key];

            if (typeof value === "string" || typeof value === "number" || value === null) {
              $formE.append($("<input>", {name: key, value: value, type: "hidden"}));
            } else if ($.type(value) === "array") {
              for (var i = value.length; --i >= 0;) {
                $formE.append($("<input>", {name: key, value: value, type: "hidden"}));
              }
            }
          }
        })({data: options.data, $formE: $formE, eventId: EVENT_ID});

        $formE
          .appendTo($rootE)
          .submit();
      };

      $RL.post = function(uri, data, options) {
        if (typeof uri !== "string" || uri === "") {
          // Endpoint url must be valid.
          return false;
        }

        if (!$.isPlainObject(options)) {
          options = {};
        }

        return sendRequest({
          uri: uri,
          data: data,
          id: (typeof options.id === "string" && options.id !== "") ? options.id : (Math.floor(Math.random() * 1000001)),
          complete: options.complete,
          success: options.success
        });
      };

      return this;
    },

    /**
     * Generate random string.
     *
     * Code is based on https://gist.github.com/2368164.
     *
     * String.random(length)
     * length - int - string length
     */
    randomString: function() {
      String.random = function(length) {
        var m = length || 9,
          s = "",
          r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i=0; i < m; i++) {
          s += r.charAt(Math.floor(Math.random() * r.length));
        }

        return s;
      };

      return this;
    },

    /**
     * Stores data using web storage on a 3rd party domain.
     *
     * Creates a hidden iframe and calls setItem, getItem, or removeItem endpoints.
     * Requires jQuery library.
     *
     * Available functions in the RL.RlmmsStorage and RL.CaptureStorage namespaces:
     * - setItem(key, value, expires, success)
     * - setItems(data, success)
     * - getItem(key, success)
     * - removeItem(key, success)
     */
    storage: function() {
      var $ = $RL.jq; // jQuery alias.

      var Storage = function(type) {
        var basePath;

        // Helper function to send request via a form post to an iframe.
        var sendRequest = function(eventId, uri, payload, success) {
          var $rootE = $("#rl-root"),
            $iframeE = $("<iframe>", {src: "about:blank"}).addClass("rl_ws").css({width: 0, height: 0});

          if ($rootE.length === 0) {
            // Create hidden DIV.
            $rootE = $("<div>", {id: "rl-root"})
              .css({height: 0, width: 0, display: "none"})
              .appendTo($("body"));
          }

          $iframeE.appendTo($rootE);

          (function($iframeE, eventId, success) {
            // Attach event handler to intercept messages from iframe.
            $(window).bind("message", function($e) {
              var e = $e.originalEvent, // Original event.
                data = e.data;

              // Security check.
              if (e.origin.search(/\.(rlmms|rlets|rlcdn|reachlocal)(-(qa|dev|test|sb))?\.|(lvh\.me)/gi) === -1) {
                // Ignore messages not from RL domains.
                return false;
              }

              // Process data.
              data = JSON.parse(data);

              // Security check.
              if (eventId !== data.id) {
                // Event id must be the same.
                return false;
              }

              // Remove bound event since it should never be used again.
              $(window).unbind($e);

              setTimeout(function() {
                // Remove iframe from DOM after it is loaded.
                $iframeE.remove();
              }, 50);

              if (typeof success === "function") {
                // Return data to callback function.
                success(data.data);
              }
            });
          })($iframeE, eventId, success);

          if (typeof basePath !== "string") {
            // Determine endpoint url.
            basePath = (function(type) {
              var config = $RL.config,
                siteConfig = config.config;

              switch (type) {
                case "capture":
                  return ["//", config.id, ".", siteConfig.domains.capture, "/static"].join("");

                case "rlmms":
                  return ["//", siteConfig.domains.cdn, siteConfig.cdnFilePath, "/static"].join("");

                default:
                  return "";
              }
            })(type);
          }

          $iframeE.attr("src", [basePath, uri, "?rl_eid=", eventId, "&rl_ws=", encodeURIComponent(JSON.stringify(payload))].join(""));
        };

        // Helper function to prep data for set.
        this.set = function(data, success) {
          var URI = "/setItem.html",
            eventId = ["setItem", String.random(7)].join("-"),
            payload = [];

          // Sanity check.
          if ($.type(data) !== "array") {
            // data must be an array.
            return false;
          }

          // Clean up data.
          for (var i = -1, length = data.length; ++i < length;) {
            var d = data[i],
              p;

            // Sanity check.
            if (typeof d.key !== "string" || d.key === "" || typeof d.value !== "string" || (!$.isNumeric(d.expires) && d.expires !== undefined && d.expires !== "")) {
              // Invalid key, value, and/or expires.
              continue;
            }

            // Format data payload.
            p = {
              k: d.key,
              v: d.value
            };
            if ($.isNumeric(d.expires) || d.expires === "") {
              p.e = d.expires;
            }
            payload.push(p);
          }

          if (payload.length === 0) {
            // Do not send request if no data to set.
            return false;
          }

          return sendRequest.call(this, eventId, URI, payload, success);
        };

        // Helper function to prep data for get.
        this.get = function(key, success) {
          var URI = "/getItem.html",
            eventId = ["getItem", String.random(7)].join("-"),
            payload = [];

          // Format data payload.
          if (typeof key === "string" && key !== "") {
            // Key param is a string.
            payload.push(key);
          } else if ($.type(key) === "array") {
            // Key param is an array of strings.
            payload = (function(keys) {
              var d = [];
              for (var i = -1, length = keys.length; ++i < length;) {
                var key = keys[i];

                // Sanity check.
                if (typeof key !== "string" || key === "") {
                  // Not a string.
                  continue;
                }

                d.push(key);
              }
              return d;
            })(key);
          } else {
            // Invalid key.
            return false;
          }

          return sendRequest.call(this, eventId, URI, payload, success);
        };

        // Helper function to prep data for remove.
        this.remove = function(key, success) {
          var URI = "/removeItem.html",
            eventId = ["removeItem", String.random(7)].join("-"),
            payload = [];

          // Format data payload.
          if (typeof key === "string" && key !== "") {
            // Key param is a string.
            payload.push(key);
          } else if ($.type(key) === "array") {
            // Key param is an array of strings.
            payload = (function(keys) {
              var d = [];
              for (var i = -1, length = keys.length; ++i < length;) {
                var key = keys[i];

                // Sanity check.
                if (typeof key !== "string" || key === "") {
                  // Not a string.
                  continue;
                }

                d.push(key);
              }
              return d;
            })(key);
          } else {
            // Invalid key value.
            return false;
          }

          return sendRequest.call(this, eventId, URI, payload, success);
        };

        return this;
      };
      /**
       * Store data.
       *
       * If expiration is not specified or is now or earlier, data is stored as session.
       * If expiration is an empty string, data is stored as local with expiration.
       *
       * The success function is called when the iframe sends a message via postMessage()
       * to the parent window, and the message is accepted by the handler.  The message must
       * be a JSON string with the following format: {id: "", data: {}}.  The id value is the
       * value passed in the form field "rl_eid".
       *
       * RL.RLmmsStorage.setItem(key, value, expires)
       * key - string - key
       * value - string - value
       * expires - string/number - (optional) expiration in unix time
       * success - function - (optional) function to be called if the request succeeds
       *
       * success function:
       * data - string - retrieved data
       */
      Storage.prototype.setItem = function(key, value, expires, success) {
        return this.set([{key: key, value: value, expires: expires}], success);
      };
      /**
       * Store data.
       *
       * If expiration is not specified or is now or earlier, data is stored as session.
       * If expiration is an empty string, data is stored as local with expiration.
       *
       * The success function is called when the iframe sends a message via postMessage()
       * to the parent window, and the message is accepted by the handler.  The message must
       * be a JSON string with the following format: {id: "", data: {}}.  The id value is the
       * value passed in the form field "rl_eid".
       *
       * RL.RLmmsStorage.setItem(key, value, expires)
       * data - array - array of key-value mappings
       * success - function - (optional) function to be called if the request succeeds
       *
       * data array object:
       * key - string - key
       * value - string - value
       * expires - string/number - (optional) expiration in unix time
       *
       * success function:
       * data - string - retrieved data
       */
      Storage.prototype.setItems = function(data, success) {
        return this.set.apply(this, arguments);
      };
      /**
       * Get data.
       *
       * Returns data as a string representation of key-value pair JSON object.
       * Ex. {"foo": "bar"}
       *
       * The success function is called when the iframe sends a message via postMessage()
       * to the parent window, and the message is accepted by the handler.  The message must
       * be a JSON string with the following format: {id: "", data: {}}.  The id value is the
       * value passed in the form field "rl_eid".
       *
       * RL.RLmmsStorage.getItem(key, success)
       * key - string/array - key or array of keys
       * success - function - function to be called if the request succeeds
       *
       * success function:
       * data - string - retrieved data
       */
      Storage.prototype.getItem = function(key, success) {
        return this.get.apply(this, arguments);
      };
      /**
       * Remove data.
       *
       * The success function is called when the iframe sends a message via postMessage()
       * to the parent window, and the message is accepted by the handler.  The message must
       * be a JSON string with the following format: {id: "", data: {}}.  The id value is the
       * value passed in the form field "rl_eid".
       *
       * RL.RLmmsStorage.removeItem(key)
       * key - string/array - key or array of keys
       * success - function - (optional) function to be called if the request succeeds
       */
      Storage.prototype.removeItem = function(key, success) {
        return this.remove.apply(this, arguments);
      };

      $RL.RlmmsStorage = new Storage("rlmms");
      $RL.CaptureStorage = new Storage("capture");

      return this;
    }
  };


  $OPTIONAL = {
    /**
     * Various functions used for tracking purposes.
     *
     * Triggers capture-web-service.sendRequest and capture-web-service.receiveResponse events.
     *
     * Interface with Capture API.
     */
    CaptureWebServices: function(enabled) {
      // Helper function to load module.
      var execute = function() {
        var _$RL = this,  // RL alias.
          $ = _$RL.jq;  // jQuery alias.

        // Helper function to send request.
        var sendRequest = function(uri, eventId, data, callback) {
          var config = _$RL.config,   // Config.
            siteConfig = config.config, // Site config.
            uri = ["//", config.id, ".", siteConfig.domains.capture, uri].join("");

          // Additional common params.
          data.rl_eid = eventId;
          data.global_master_advertiser_id = config.globalMasterAdvertiserId; // Global master advertiser id.
          data.page_name = siteConfig.pageTitle;    // Page title.
          data = (function(d, cd, c, platform){
            // Paid campaign data.
            if (c.isPaidCampaign) {
              d.scid = c.scid;
              d.campaign_id = [platform, c.cid].join("_");
              d.tc = c.tc;
              d.master_campaign_id = (cd[d.campaign_id] || {}).master_campaign_id;

              if (c.kw !== "") {
                d.kw = c.kw;
              }

              if (c.pub_cr_id !== "") {
                d.pub_cr_id = c.pub_cr_id;
              }
            } else {
              d.master_campaign_id = (cd[sessionStorage.getItem("referrer_type")] || {}).master_campaign_id;
            }

            if (d.master_campaign_id !== undefined) {
              d.master_campaign_id = [platform, d.master_campaign_id].join("_");
            }

            return d;
          })(data, config.campaign_data || {}, siteConfig.campaign, siteConfig.platform);
          data = (function(d, p, r) {
            // Page url.
            if (!d.fname && p !== "") {
              d.fname = p;
            }

            // Referrer url.
            if (!d.referrer && r !== "") {
              d.referrer = r;
            }
            return d;
          })(data, siteConfig.pageUri.href, siteConfig.referrer);

          (function(eventId, callback) {
            // Attach eventhandler to intercept messages from iframe.
            $(window).bind(["message", eventId].join("."), function($e) {
              var e = $e.originalEvent,
                eData = e.data;

              // Security check.
              if (e.origin.indexOf(siteConfig.domains.capture) === -1) {
                // Ignore messages not from RL domains.
                return false;
              }

              // Process data.
              eData = JSON.parse(eData);

              // Security check.
              if (eventId !== eData.id) {
                // Event id must be the same.
                return false;
              }

              // Remove bound event since it should never be used again.
              $(window).unbind($e);

              // Dispatch event.
              _$RL.Events.dispatch("capture-web-service", "receiveResponse", {data: eData.data, eventId: eventId});

              if (typeof callback === "function") {
                // Return data to callback function.
                callback(eData.data);
              }
            });
          })(eventId, callback);

          // Send POST request.
          _$RL.post(uri, data);

          // Dispatch event.
          _$RL.Events.dispatch("capture-web-service", "sendRequest", {url: uri, data: data, eventId: eventId});
        };

        _$RL.CaptureWS = {
          /**
           * Track initial visit.
           *
           * Will generate visitor id if none is present.  Will generate visit id and referrer type if none is present.
           *
           * RL.CaptureWS.trackVisit(data)
           * data - object - key-value pairs
           *
           * data object:
           * visitorId - string - (optional) visitor id
           */
          trackVisit: function(data, callback) {
            var URI = "/api/v1/visits",
              eventId = ["trackVisit", String.random(7)].join("-"),
              payload = {};

            // Required params.
            payload.referrer_source = data.referrer_source;

            // Optional params.
            if (typeof data.visitorId === "string" && data.visitorId !== "") {
              payload.visitor_id = data.visitorId;
            }

            sendRequest.call(this, URI, eventId, payload, callback);
          },
          /**
           * Track formmail data.
           *
           * RL.CaptureWS.trackEmail(data)
           * data - object - key-value pairs
           *
           * data object:
           * visitId - string - visit id
           * visitorId - string - visitor id
           */
          trackEmail: function(data) {
            var URI = "/api/v1/emails",
              eventId = ["trackEmail", String.random(7)].join("-"),
              payload = {};

            // Required params.
            payload.visit_id = data.visitId;    // Visit id.
            payload.visitor_id = data.visitorId;  // Visitor id.

            // Optional params.

            // CVT-type dependent data.
            for (var p in data) {
              switch (p) {
                case "visitId":
                case "visitorId":
                  break;

                default:
                  payload[p] = data[p];
              }
            }

            sendRequest.call(this, URI, eventId, payload);
          },
          /**
           * Track form post data.
           *
           * RL.CaptureWS.trackPost(data)
           * data - object - key-value pairs
           * callback - function - (optional) callback function to execute once the response has been received
           *
           * data object:
           * visitId - string - visit id
           * visitorId - string - visitor id
           */
          trackPost: function(data, callback) {
            var URI = "/api/v1/posts",
              eventId = ["trackPost", String.random(7)].join("-"),
              payload = {},
              requiredFields = {phone: false, email: false};

            // Required params.
            payload.visit_id = data.visitId;    // Visit id.
            payload.visitor_id = data.visitorId;  // Visitor id.

            // Optional params.

            // CVT-type dependent data.
            for (var p in data) {
              switch (p) {
                case "visitId":
                case "visitorId":
                  break;

                case "postbody":
                  var d = $.deparam(data[p]);
                  for (var k in d) {
                    var v = d[k].filterCreditCard();  // Check for credit card numbers.
                    d[k] = v;

                    if (k.search(/(work_phone_number|mobile_phone_number|home_phone_number|phone_number|work_phone|mobile_phone|home_phone|phone)/gi) > -1 && v.length > 0) {
                      // Phone number field found.
                      requiredFields.phone = true;
                    }
                    if (k.search(/(email_address|emailaddress|email)/gi) > -1 && v.length > 0) {
                      // Email address field found.
                      requiredFields.email = true;
                    }
                  }
                  payload[p] = $.param(d);
                  break;

                default:
                  payload[p] = data[p];
              }
            }

            if (requiredFields.phone || requiredFields.email) {
              sendRequest.call(this, URI, eventId, payload, callback);
            } else if (typeof callback === "function") {
              callback();
            }
          },
          /**
           * Track a CVT event.
           *
           * RL.CaptureWS.trackCvt(data)
           * data - object - key-value pairs
           *
           * data object:
           * cvtId - string - cvt id
           * cvtType - string/number - cvt type (e.g. 2, 3, 7, 8)
           * visitId - string - visit id
           * visitorId - string - visitor id
           */
          trackCvt: function(data) {
            var URI = "/api/v1/cvts",
              eventId = ["trackCvt", String.random(7)].join("-"),
              payload = {};

            // Required params.

            payload.src = "capture";
            payload.idpagecvt = data.cvtId;     // CVT id.
            payload.event = data.cvtType;     // CVT type.
            payload.visit_id = data.visitId;    // Visit id.
            payload.visitor_id = data.visitorId;  // Visitor id.

            // Optional params.

            // CVT-type dependent data.
            for (var p in data) {
              switch (p) {
                case "cvtId":
                case "cvtType":
                case "visitId":
                case "visitorId":
                  break;

                default:
                  payload[p] = data[p];
              }
            }

            sendRequest.call(this, URI, eventId, payload);
          }
        };
      };

      if (enabled === 1) {
        // Module is enabled.
        execute.call($RL);
      } else {
        // Module is disabled.
        $RL.getCampaign = function() {
          // Return empty object.
          return {};
        };
      }
    },

    /**
     * Get campaign data from cookies or location querystring.
     *
     * Will collect data from the following sources in the listed order:
     * - RlocalUID
     * - RlocalTag
     * - location querystring
     *
     * Proxy-URL-to-native-URL mappings are stored in RL.config.proxyUrls object.  If that object does not exist, then
     * one will be created.
     *
     * Returns an object will at least the following properties:
     * - isSrcProxy (boolean)
     * - isSrcRct (boolean)
     * - isSrcQuerystring (boolean)
     * - isPaidCampaign (boolean)
     *
     * .getCampaign(enabled)
     * enabled - int - 1: module enabled, 0: module disabled
     */
    Campaign: function(enabled) {
      // Helper function to load module.
      var execute = function() {
        var FIELDS = ["scid", "cid", "tc", "rl_key", "kw", "pub_cr_id"],  // Required data points.
          PROXY_DOMAINS = ["avxtrk.com", "ddcsem.com", "ezlcl.com", "reachlocal.com", "reachlocal.net", "rtrk.com", "rtrk.com.au", "rtrk1.com", "rtrk2.com", "rtrk5.com", "search-dealer.com", "smrtlnk.com", "trvlclick.com"], // Hard proxy base domains.
          _$RL = this,  // RL alias.
          $ = _$RL.jq,  // jQuery alias.
          qs;           // Campaign data in querystring.

        qs = (function(qs) {
          // Get campaign data from querystring.
          var scid = qs.scid || "",
            cid = qs.cid || "",
            tc = qs.tc || "",
            rl_key = qs.rl_key || "",
            kw = qs.kw || "",
            pub_cr_id = qs.pub_cr_id || "",
            data;

          if (scid === "" || cid === "" || tc === "" || rl_key === "") {
            // Since campaign data does not exist in the querystring, try local web storage.
            data = sessionStorage.getItem("rl_campaign") || "";

            try {
              data = JSON.parse(data);
            } catch(err) {
              // Local web storage does not have campaign data.
              return null;
            }

            if (data.scid === "" || data.cid === "" || data.tc === "" || data.rl_key === "") {
              // Local web storage does not have campaign data.
              return null;
            }
          } else {
            // Querystring contains campaign data.
            data = {
              scid: scid,
              cid: cid,
              tc: tc,
              rl_key: rl_key,
              kw: kw,
              pub_cr_id: pub_cr_id,
              rl_tag: ""
            };
          }

          return data;
        })($.deparam(_$RL.config.config.pageUri.search));

        if (qs === null) {
          sessionStorage.removeItem("rl_campaign");

          _$RL.CaptureStorage.getItem("rl_campaign", function(data) {
            // Retrieve campaign data stored in web storage in the Capture domain for multidomain visit.
            try {
              data = JSON.parse(data.rl_campaign);
            } catch(err) {
              return;
            }

            if (!data.campaign || !data.pageUri) {
              return;
            }

            if (_$RL.config.config.referrer === unescape(data.pageUri)) {
              qs = data.campaign;
              _$RL.config.config.campaign = _$RL.getCampaign();

              // Cache campaign data.
              sessionStorage.setItem("rl_campaign", JSON.stringify(qs));
              _$RL.CaptureStorage.setItem("rl_campaign", JSON.stringify({campaign: qs, pageUri: escape(_$RL.config.config.pageUri.href)}));
            }
          });
        } else {
          // Cache campaign data.
          sessionStorage.setItem("rl_campaign", JSON.stringify(qs));
          _$RL.CaptureStorage.setItem("rl_campaign", JSON.stringify({campaign: qs, pageUri: escape(_$RL.config.config.pageUri.href)}));
        }

        _$RL.getCampaign = function() {
          var proxyCookie,
            isProxy,
            campaign;

          proxyCookie = (function(cookie) {
            // Get proxy campaign data from RlocalUID cookie.
            cookie = cookie !== null ? $.deparam(cookie) : {};
            return cookie.scid ? cookie : null;
          })($.cookie("RlocalUID"));

          isProxy = (function() {
            // Check if proxy campaign.
            var pageUri = _$RL.config.config.pageUri,
              hostname = pageUri.hostname.toLowerCase(),
              baseDomain;

            // Check if URL is dynamically proxied.
            if (hostname.indexOf("url") === 0 && hostname.indexOf("--") > -1) {
              // Dynamically proxied URL starts with "url" and contains at least 1 pair of "--".

              // Save proxied URL.
              _$RL.config.config.proxyUrl = pageUri.href;

              // Replaced cached proxied URL with native URL (see TRACK-1092).
              pageUri.hostname = hostname.slice(3, hostname.indexOf(".")).replace(/--/g, ".");
              pageUri.href = pageUri.href.replace(hostname, pageUri.hostname);
              _$RL.config.config.pageUri = pageUri;

              return true;
            }

            baseDomain = (function(h, hArr) {
              // Get base domain.
              if (hArr.length > 2) {
                return [hArr[hArr.length - 2], hArr[hArr.length - 1]].join(".");
              }
              return h;
            })(hostname, hostname.split("."));

            // Check if URL is a hard proxied URL.
            if (PROXY_DOMAINS.indexOf(baseDomain) > -1) {
              // Proxied URLs has one of the listed base domain.

              // Save proxied URL.
              _$RL.config.config.proxyUrl = pageUri.href;

              // Make sure rl_config.js has a "proxyUrls" section.
              if (!_$RL.config.proxyUrls) {
                _$RL.config.proxyUrls = {};
              }

              _$RL.config.config.pageUri = (function(pageUri, proxyUrl, nativeUrl) {
                // Replaced cached proxied URL with native URL if one is specified.
                if (typeof nativeUrl === "string" && nativeUrl !== "") {
                  pageUri.hostname = nativeUrl;
                  pageUri.href = pageUri.href.replace(proxyUrl, nativeUrl);
                }

                return pageUri;
              })(pageUri, hostname, _$RL.config.proxyUrls[hostname]);

              return true;
            }

            return false;
          })();

          // Additional flags.
          if (proxyCookie !== null && isProxy === true) {
            campaign = proxyCookie;
            campaign.isSrcProxy = true;
            campaign.isSrcQuerystring = false;
            campaign.isPaidCampaign = true;
          } else if (qs !== null) {
            campaign = $.extend({}, qs);
            campaign.isSrcProxy = false;
            campaign.isSrcQuerystring = true;
            campaign.isPaidCampaign = true;
          } else {
            campaign = {
              isSrcProxy: false,
              isSrcQuerystring: false,
              isPaidCampaign: false
            };
          }

          // Additional campaign data.
          for (var i = -1, length = FIELDS.length; ++i < length;) {
            var field = FIELDS[i];
            if (!campaign[field]) {
              campaign[field] = "";
            }
          }

          return campaign;
        };

        _$RL.config.config.campaign = _$RL.getCampaign();
      };

      if (enabled === 1) {
        // Module is enabled.
        execute.call($RL);
      } else {
        // Module is disabled.
        $RL.config.config.campaign = {};
        $RL.getCampaign = function() {
          // Return empty object.
          return {};
        };
      }
    },

    /**
     * Replace common credit card numbers with astericks.
     *
     * The following 6 credit cards will be filtered:
     * - American Express
     * - Diners Club
     * - Discover
     * - JCB
     * - Mastercard
     * - Visa
     *
     * Example usage: "hi there".filterCreditcard();
     *
     * <string>.filterCreditCard()
     */
    CreditCard: function(enabled) {
      // Helper function to load module.
      var execute = function() {
        String.prototype.filterCreditCard = function() {
          var CC = [
              "3[47]\\d{2}[ -.]?\\d{6}[ -.]?\\d{5}",              // American Express.
              "3([68]\\d|0[0-5])\\d[ -.]?\\d{6}[ -.]?\\d{4}",         // Diners Club.
              "6(011|5\\d{2})[ -.]?(\\d{4}[ -.]?){3}",            // Discover.
              "35(2[8-9]|[3-8]\\d)[ -.]?(\\d{4}[ -.]?){3}",         // JCB.
              "5[1-5]\\d{2}[ -.]?(\\d{4}[ -.]?){3}",            // Mastercard.
              "4\\d{3}[ -.]?(\\d{4}|\\d{3})[ -.]?(\\d{4}|\\d{2})[ -.]?\\d{4}" // Visa.
            ],          // Credit card regex.
            strMatches = [];  // Credit card regex matches.

          // Helper function
          var generateReplacementString = function(l) {
            var s = "";
            for (var i = -1; ++i < l;) {
              s = [s, "*"].join("");
            }
            return s;
          };

          strMatches = (function(str, CC) {
            var s = [];
            for (var i = -1, length = CC.length; ++i < length;) {
              var r = new RegExp(CC[i], "gi"),
                m = str.match(r);
              if (m !== null) {
                s = s.concat(m);
              }
            }
            return s;
          })(this, CC);

          return (function(str, strMatches) {
            for (var i = -1, length = strMatches.length; ++i < length;) {
              var s = strMatches[i],
                r = generateReplacementString(s.length);
              str = str.replace(s, r);
            }
            return str;
          })(this, strMatches);
        };
      };

      if (enabled === 1) {
        // Module is enabled.
        execute.call($RL);
      } else {
        // Module is disabled.
        String.prototype.filterCreditCard = function() {
          return this;
        };
      }
    },

    /**
     * Track CVTs.
     *
     * CVTs are stored in RL.config.cvts object.  If that object does not exist, then one will be created.
     *
     * Subscribes to form-submission-capture.callback event to track POST events and capture form data.
     *
     * .trackCvt()
     */
    CVT: function(enabled) {
      // Helper function to load module.
      var execute = function() {
        var _$RL = this,  // RL alias.
          $ = _$RL.jq,  // jQuery alias.
          post;     // Undefined if page request is not type POST.

        // Check if current page is a POST request.
        _$RL.RlmmsStorage.getItem("rl_capture_post", function(data) {
          post = data.rl_capture_post ? data.rl_capture_post : undefined;
        });

        // Make sure rl_config.js has a "cvts" section.
        if (!$.isPlainObject(_$RL.config.cvts)) {
          _$RL.config.cvts = {};
        }

        _$RL.trackCvt = (function() {
          var config = _$RL.config,             // Config.
            platform = config.config.platform,  // Platform.
            campaign = config.config.campaign,  // Campaign info.
            pageCvts;                           // Current page's CVT info.

          // Helper function to get CVT info for a given URL.
          var getCvt = function(originalUri) {
            var cvtConfig = config.cvts,  // CVT config.
              data = [],                  // All the CVTs for the page.
              cvt;                        // Paid CVT.

            // Update campaign info.
            campaign = config.config.campaign;

            // Make sure uri is in lower case for comparision
            var uri = originalUri.toLowerCase();

            data = (function() {
              // Get list of CVTs from config.
              for (var cvtDomain in cvtConfig) {
                var cvtPaths = cvtConfig[cvtDomain];

                cvtDomain = cvtDomain.toLowerCase();

                if (uri.indexOf(cvtDomain) !== 0) {
                  // Not matching protocol & domain.
                  continue;
                }

                // Remove protocol and domain for current url.
                uri = uri.replace(cvtDomain, "");

                if (uri.charAt(0) !== "/") {
                  // Prefix a slash if missing.
                  uri = ["/", uri].join("");
                }

                for (var cvtPath in cvtPaths) {
                  var path = [cvtPath.charAt(0) !== "/" ? "/" : "", cvtPath.toLowerCase()].join("");

                  if (uri.indexOf(path) !== 0) {
                    // Not a substring of the current url.
                    continue;
                  }

                  // Return array of CVTs.
                  return cvtPaths[cvtPath] || [];
                }
              }

              return [];
            })();

            cvt = (function() {
              var campaignCid;

              if (campaign.isPaidCampaign === true) {
                campaignCid = [platform, campaign.cid].join("_");

                // Clean up data.
                for (var i = -1, length = data.length; ++i < length;) {
                  var d = data[i];

                  if (d.campaign_id === campaignCid) {
                    return d;
                  }
                }
              }

              return undefined;
            })();

            return {
              data: data,   // Page CVTs.
              cvt: cvt    // Paid campaign CVT.
            };
          };

          // Helper function track CVT event.
          var trackCvt = function(cvtId, cvtType, o) {
            var _$RL = this,
              $ = _$RL.jq,
              fname,
              referrer;

            if ($.isPlainObject(o)) {
              if (typeof o.fname === "string") {
                fname = o.fname;
              }
              if (typeof o.referrer === "string") {
                referrer = o.referrer;
              }
            }

            (function(o) {
              var visitorId = sessionStorage.getItem("visitor_id"),
                visitId = sessionStorage.getItem("visit_id"),
                eventId;

              if (visitId !== null && visitorId !== null) {
                // Track CVT since visit and visitor ids are available.
                _$RL.CaptureWS.trackCvt({
                  cvtId: o.id,
                  cvtType: o.type,
                  visitorId: visitorId,
                  visitId: visitId,
                  referrer: o.referrer,
                  fname: o.fname
                });
                return;
              }

              // Wait for visit and visitor ids to be available.
              eventId = _$RL.Events.subscribe("capture", "visit", function(data) {
                // Unsubscribe to event.
                _$RL.Events.unsubscribe("capture", "visit", eventId);

                // Track CVT since visit and visitor ids are available.
                _$RL.CaptureWS.trackCvt({
                  cvtId: o.id,
                  cvtType: o.type,
                  visitorId: data.visitorId,
                  visitId: data.visitId,
                  referrer: o.referrer,
                  fname: o.fname
                });
              });
            })({id: cvtId, type: cvtType === "high" ? 8 : 7, referrer: referrer, fname: fname});
          };

          // Helper function track form post.
          var trackPost = function(data, complete) {
            var visitorId = sessionStorage.getItem("visitor_id"),
              visitId = sessionStorage.getItem("visit_id"),
              eventId,
              timeoutId;

            if (visitId !== null && visitorId !== null) {
              data.visitId = visitId;
              data.visitorId = visitorId;

              // Track Post since visit and visitor ids are available.
              _$RL.CaptureWS.trackPost(data, complete);
              return;
            }

            // Wait for visit and visitor ids to be available.
            eventId = _$RL.Events.subscribe("capture", "visit", function(data) {
              // Unsubscribe to event.
              _$RL.Events.unsubscribe("capture", "visit", eventId);

              // End timeout.
              clearTimeout(timeoutId);

              data.visitId = visitId;
              data.visitorId = visitorId;

              // Track CVT since visit and visitor ids are available.
              _$RL.CaptureWS.trackPost(data, complete);
            });

            timeoutId = setTimeout(function() {
              complete();
            }, 2000);
          };

          // Subscribe to form-submission-capture.callback event.
          _$RL.Events.subscribe("form-submission-capture", "callback", function(data, complete) {
            var formCvts = getCvt.call(_$RL, data.url),
              cvt = formCvts.cvt,
              isAuto8 = false;

            // Initialize variables just in case they are undefined.
            if (pageCvts === undefined) {
              pageCvts = {data: [], cvt: undefined};
            }

            if (cvt !== undefined || (pageCvts.cvt !== undefined && pageCvts.cvt.value === "low")) {
              // Form post is a CVT.
              if (pageCvts.cvt && pageCvts.cvt.value === "low" && (cvt === undefined || cvt.value !== "high")) {
                // Auto 8.
                cvt = {
                  cvtid: pageCvts.cvt.cvtid,
                  value: "high"
                };
                isAuto8 = true;
              }
            }

            if (cvt !== undefined) {
              // Track CVT POST event.
              trackCvt.call(_$RL, cvt.cvtid, cvt.value, {referrer: config.config.pageUri.href, fname: data.url});
            }

            var payload = {
              formUri: data.url,
              postbody: data.data
            };
            if (isAuto8 === true) {
              payload.referrer = config.config.pageUri.href;
            }

            // Track form post.
            trackPost.call(_$RL, payload, function() {
              // Set POST action flag.
              _$RL.RlmmsStorage.setItem("rl_capture_post", data.url, parseInt((new Date()).getTime() / 1000) + 60, function() {
                if (typeof complete === "function") {
                  complete();
                }
              });
            });

            return false;
           }, _$RL);

          return function() {
            var cvt;

            // Get current page's CVT info.
            pageCvts = getCvt.call(this, config.config.pageUri.href);
            cvt = pageCvts.cvt;

            if (post === config.config.pageUri.href) {
              // POST event are tracked before the post.

              // Remove POST action flag.
              this.RlmmsStorage.removeItem("rl_capture_post");
              return;
            }

            if (cvt !== undefined) {
                  // Track CVT event.
                  trackCvt.call(this, cvt.cvtid, cvt.value);
                }

                // Not a CVT page.
                return false;
          };
        })();
      };

      if (enabled === 1) {
        // Module is enabled.
        execute.call($RL);
      } else {
        // Module is disabled.
        $RL.trackCvt = function() {
          // Return empty object.
          return {};
        };
      }
    },

    /**
     * Collect form submit and AJAX request data.
     *
     * Collects data from input (text, password, hidden, checkbox, and radio), textarea,
     * and select elements for form submit.
     *
     * Collect data from AJAX request payload (only IE8+, FF3.6+, Chrome, Safari).
     *
     * Triggers form-submission-capture.callback event during an interception.
     *
     * .captureFormSubmit(callback, form)
     * form - object - form element(s)
     */
    Form: function(enabled, config) {
      // Helper function to load module.
      var execute = function() {
        var _$RL = this,  // RL alias.
          $ = _$RL.jq;  // jQuery alias.

        _$RL.captureFormSubmit = (function() {
          var submittedForms = []; // Submitted forms.

          // Helper function to collect data from AJAX request.
          var getXhrData = function(callback) {
            // Works for IE8+ and other modern browsers only.
            if (window.XMLHttpRequest && XMLHttpRequest.prototype) {
              // Code is based on http://stackoverflow.com/questions/3596583/javascript-detect-an-ajax-event with minor modifications.
              var s_ajaxListener = new Object();
              s_ajaxListener.tempOpen = XMLHttpRequest.prototype.open;
              s_ajaxListener.tempSend = XMLHttpRequest.prototype.send;
              s_ajaxListener.callback = function () {
                callback({
                  method: this.method,
                  url: this.url,
                  data: this.data
                });
              };

              XMLHttpRequest.prototype.open = function(method, url) {
                s_ajaxListener.tempOpen.apply(this, arguments);
                s_ajaxListener.method = method;
                s_ajaxListener.url = url;
                if (method.toLowerCase() === "get") {
                  var urlArr = url.split("?");
                  s_ajaxListener.data = urlArr[1];
                }
              };

              XMLHttpRequest.prototype.send = function(data) {
                s_ajaxListener.tempSend.apply(this, arguments);
                if (s_ajaxListener.method.toLowerCase() === "post") {
                  s_ajaxListener.data = data || "";
                }
                s_ajaxListener.callback();
              };
            }
          };

          // Helper function to capture form submit event.
          var captureForm = function(forms) {
            var config = _$RL.config.config,
                isDotNet = config.dotNet;

            for (var i = -1, length = forms.length; ++i < length;) {
              var formE = forms[i],
                $formE = $(formE);

              // Sanity check.
              if (!formE.nodeType || formE.nodeType !== 1 || typeof formE.nodeName !== "string" || formE.nodeName.toLowerCase() !== "form") {
                // Not a form element node.
                continue;
              }

              // Check if form is .NET Web Form.
              if (isDotNet === 1) {
                (function(formE) {
                  var onSubmit = window.WebForm_OnSubmit,
                    hasSubmitted = false;

                  window.WebForm_OnSubmit = function() {
                    var r;

                    if (formE.action.indexOf("https:") === 0) {
                      // Do not track forms with SSL.
                      onSubmit();
                    } else if (hasSubmitted === false) {
                      r = onSubmit();

                      if (r === false) {
                        return false;
                      }

                      hasSubmitted = true;

                      _$RL.Events.dispatch("form-submission-capture", "callback", {form: formE, url: formE.action, data: $(formE).formSerialize()}, function() {
                        $formE.find(":submit").click();
                      });

                      return false;
                    }

                    return true;
                  };
                })(formE);

                return null;
              }

              formE.onsubmit = (function(formE) {
                var onSubmitFn = formE.onsubmit;

                var attach = function(e) {
                  var r = typeof onSubmitFn === "function" ? onSubmitFn.call(formE, e) : null,
                    submittedFormsIndex = submittedForms.indexOf(formE),
                    isAjax = submittedFormsIndex > -1 ? true : false,
                    formData = $(formE).formSerialize();

                  // Helper function to submit form.
                  var sendRequest = function() {
                    if (r !== false) {
                      if (formE.action.indexOf("https:") === 0) {
                        // Do not capture forms with SSL.
                        formE.submit();
                        return;
                      }

                      // Dispatch form-submission-capture.callback event.
                      _$RL.Events.dispatch("form-submission-capture", "callback", {form: formE, url: formE.action, data: formData}, function() {
                        // Form submission is not cancelled.
                        formE.submit();
                      });
                    } else {
                      // Form submission is blocked in the onsubmit handler.
                      formE.submit = (function(formE) {
                        // Override submit().
                        var submit = formE.submit;

                        return function() {
                          var formE = this,
                            args = arguments,
                            formData = $(formE).formSerialize();

                          if (formE.action.indexOf("https:") === 0) {
                            // Do not capture forms with SSL.
                            submit.apply(formE, args);
                            return;
                          }

                          _$RL.Events.dispatch("form-submission-capture", "callback", {form: formE, url: formE.action, data: formData}, function() {
                            // Form submission is not cancelled.
                            submit.apply(formE, args);
                          });
                        };
                      })(formE);
                    }
                  };

                  if (isAjax === true) {
                    submittedForms[submittedFormsIndex] = null;
                  }

                  if (typeof e.defaultPrevented === "boolean") {
                    // Modern browsers.
                    if (isAjax === false) {
                      sendRequest();
                    }
                  } else {
                    // Older browsers.
                    setTimeout(function() {
                      submittedFormsIndex = submittedForms.indexOf(formE);
                      isAjax = submittedFormsIndex > -1 ? true : false;

                      if (isAjax === true) {
                        submittedForms[submittedFormsIndex] = null;
                      }

                      if (isAjax === false) {
                        sendRequest();
                      }
                    }, 100);
                  }

                  // Stop form submission.
                  if (e && e.preventDefault) {
                    e.preventDefault();
                  } else if (window.event) {
                    window.event.returnValue = false;
                  }
                };

                if (formE.addEventListener) {
                  formE.addEventListener("submit", attach, false);
                } else if (formE.attachEvent) {
                  formE.attachEvent("onsubmit", attach);
                }

                return null;
              })(formE);
            }
          };

          // Helper function to capture AJAX event.
          var captureXhr = function() {
            // Sanity check.
            if (document.forms.length === 0) {
              // Forms do not exist.
              return;
            }

            // Intercept XHR requests.
            getXhrData(function(requestData) {
              var forms = document.forms,
                url = requestData.url,
                data = requestData.data;

              for (var i = -1, length = forms.length; ++i < length;) {
                var formE = forms[i],
                  formUri = formE.action;

                if (formUri === url || (formUri !== "" && (formUri.indexOf(url) > -1 || (url !== "" && url.indexOf(formUri) > -1)))) {
                  if (formUri.indexOf("https:") === 0) {
                    // Do not track forms with SSL.
                    return;
                  }

                  submittedForms.push(formE);

                  // Dispatch form-submission-capture.callback event.
                  _$RL.Events.dispatch("form-submission-capture", "callback", {url: formUri, data: data});
                  return;
                }
              }
            });
          };

          return function(form) {
            var config = this.config.config,
                isHipaa = config.hipaa,
                isScorpion = config.scorpion,
                isSsl = config.pageUri.protocol === "https:" ? 1 : 0,
                formEArr;

            if (isScorpion === 1 || isHipaa === 1 || isSsl === 1) {
              // Do not track forms automatically if it is a Scorpion site.
              // Do not track forms if it is a HIPAA site.
              // Do not track forms with SSL.
              return;
            }

            formEArr = form === undefined ? document.forms : ($.type(form) === "array" ? form : [form]);

            captureForm(formEArr);
            captureXhr();
          };
        })();
      };

      if (enabled === 1) {
        // Module is enabled.
        execute.call($RL, config);
      } else {
        // Module is disabled.
        $RL.captureFormSubmit = function() {};
      }
    },

    /**
     * Search and replace all image and CSS style background image on the page.
     *
     * .replaceImage(data)
     * data - array - array of key-value mapping (e.g. [{"search": "http://www.site.com/foo.jpg", "replace": "http://www.site.com/bar.jpg"}])
     *
     * data object:
     * search - string - string to replace
     * replace - string - string used to replace
     */
    ImageReplacement: function(enabled, config) {
      // Helper function to load module.
      var execute = function() {
        var _$RL = this,  // RL aslias.
          $ = _$RL.jq;  // jQuery alias.

        _$RL.replaceImage = (function() {
          var images,
            imgArr = [],
            bgImgArr = [];

          // Helper function to retrieve the CSS style.
          var getCss = function(elem, css) {
            if (!elem || !elem.style) {
              return "";
            }

            // Format style name to camel casing.
            var style = css.replace(/\-([a-z])/g, function(a, b) {
              return b.toUpperCase();
            });

            if (elem.currentStyle){
              return elem.style[style] || elem.currentStyle[style] || "";
            }

            var dv = document.defaultView || window;
            return elem.style[style] || dv.getComputedStyle(elem, "").getPropertyValue(css) || "";
          };

          // Helper function to get image elements and other elements with background images.
          var getImages = function() {
            var elems = document.getElementsByTagName("*"),
              imgArr = [],  // array of image elements
              bgArr = [];   // array of elements with background images

            for (var i = -1, length = elems.length; ++i < length;) {
              var elem = elems[i];

              switch (elem.nodeName.toLowerCase()) {
                case "script":
                case "link":
                case "style":
                case "meta":
                case "html":
                case "head":
                case "title":
                case "base":
                case "noscript":
                  continue;
                  break;

                case "img":
                  imgArr.push(elem);
                  break;

                default:
                  var bgImg = getCss(elem, "background-image"),
                    url = /url\(['"]?([^")]+)/.exec(bgImg) || [];
                  if (typeof url[1] === "string" && url[1] !== "") {
                    bgArr.push(elem);
                  }
              }
            }

            return {img: imgArr, bgImg: bgArr};
          };

          // Helper function to replace image elements and elements with background images.
          var replace = function(search, replace) {
            // Replace image elements.
            for (var i = -1, length = images.img.length; ++i < length;) {
              var elem = images.img[i];

              if (elem.attributes.getNamedItem("src").value === search || elem.attributes.getNamedItem("src").ie8_value === search || elem.src === search) {
                // Replace node src value and remove node from list.
                elem.src = replace;
              } else {
                // Add node to list for additional replacements.
                imgArr.push(elem);
              }
            }

            // Replace elements with background images.
            for (var i = -1, length = images.bgImg.length; ++i < length;) {
              var elem = images.bgImg[i],
                elemBgImg = getCss(elem, "background-image");
              if (elemBgImg.indexOf(search) > -1) {
                // Replace node background image and remove node from list.
                elem.style.backgroundImage = ["url('", replace, "')"].join("");
              } else {
                // Add node to list for additional replacements.
                bgImgArr.push(elem);
              }
            }
          };

          return function(data) {
            imgArr = bgImgArr = [];

            if ($.isPlainObject(data)) {
              // Replace 1 node.
              images = getImages();
              replace(data.search, data.replace);
            } else if ($.type(data) === "array") {
              // Replace multiple nodes.
              images = getImages();
              for (var i = -1, length = data.length; ++i < length;) {
                var elem = data[i];
                if ($.isPlainObject(elem)) {
                  replace(elem.search, elem.replace);
                }
              }
            }

            images = undefined;
            return {img: imgArr, bgImg: bgImgArr};
          };
        })();
      };

      if (enabled === 1) {
        // Module is enabled.
        execute.call($RL, config);
      } else {
        // Module is disabled.
        $RL.replaceImage = function() {
          // Do nothing.
          return false;
        };
      }
    },

    /**
     * Replaces href in an anchor node.
     *
     * .replaceLink(options)
     * options - object - key-value mapping
     *
     * options object:
     * nodeE - object - DOM node to replace
     * uri - string - new url value
     * text - string - (optional) new text string
     * handler - function - (optional) bind click event handler
     */
    LinkReplacement: function(enabled, config) {
      // Helper function to load module.
      var execute = function() {
        var _$RL = this,  // RL aslias.
          $ = _$RL.jq;  // jQuery alias.

        _$RL.replaceLink = (function() {
          // Helper function modify the anchor element.
          var replace = function(nodeE, uri, text, handler) {
            text = text || nodeE.innerHTML;
            nodeE.href = uri;
            nodeE.innerHTML = text;

            // Attach click event handler.
            if (typeof handler === "function") {
              $(nodeE).click(handler);
            }
          };

          return function(options) {
            // Sanity check.
            if (!$.isPlainObject(options)) {
              // Invalid parameter.
              return false;
            } else if (typeof options.nodeE !== "object" || options.nodeE.nodeType !== 1 || options.nodeE.nodeName !== "A") {
              // Invalid nodeE parameter property.
              return false;
            } else if (typeof options.uri !== "string") {
              // Invalid uri parameter property.
              return false;
            }

            // Initialize optional parameter properties.
            if (typeof options.text !== "string") {
              options.text = undefined;
            }
            if (typeof options.handler !== "function") {
              options.handler = undefined;
            }

            replace(options.nodeE, options.uri, options.text, options.handler);

            return options.nodeE;
          };
        })();
      };

      if (enabled === 1) {
        // Module is enabled.
        execute.call($RL, config);
      } else {
        // Module is disabled.
        $RL.replaceLink = function() {
          // Do nothing.
          return false;
        };
      }
    },


    /**
     * Replace phone numbers in TextNodes on the page.
     *
     * .replacePhoneNumbers(data)
     * data - array - array of key-value mapping (e.g. [{"search": "8183397978", "replace": "2221113333"}, {"search": "8183397777", "replace": "2221114444"}])
     */
    PhoneNumberReplacement: function(enabled, config) {
      // Helper function to load module.
      var execute = function() {
        var _$RL = this,  // RL aslias.
          $ = _$RL.jq;  // jQuery alias.

        _$RL.replacePhoneNumber = function(data) {
          var POST_PHONE_PATTERN = "([~|_|\\,|\\?|\\||#|\\[|\\]|\\{|\\}|\\^|\\:|\\=|\\\|\"|\\*|\\/|\\.|\\+|\\-|\\(|\\)|\\s|%20|&nbsp;]*)",
            PRE_PHONE_PATTERN = "([\\(|\\+]*)",
            dataCollection = [];

          if ($.type(data) !== "array") {
            return false;
          }

          for (var i = -1, length = data.length; ++i < length;) {
            var elem = data[i],
              searchPN = elem.search,
              newPN = elem.replace,
              isDomestic = true,
              searchTerm,
              newTerm,
              regex;

            // Sanity check.
            if (typeof searchPN !== "string" || typeof newPN !== "string") {
              // Both search and replace values must be strings.
              continue;
            }

            // Do not replace phone numbers with alphabetical characters.
            if (searchPN.search(/[a-z\/]+/i) >= 0) {
              continue;
            }

            // Remove nondigit characters.
            searchPN = searchPN.replace(/[\s-()\.]*/g, "");

            // Clean phone numbers by removing "#".
            (function(_searchPN, _newPN) {
              var index;

              index = _searchPN.indexOf("#");
              if (index > -1) {
                searchPN = _searchPN.substr(0, index);
                isDomestic = false;
              }

              index = _newPN.indexOf("#");
              if (index > -1) {
                newPN = _newPN.substr(0, index);
                isDomestic = false;
              }
            })(searchPN, newPN);

            // Create phone number RegEx pattern.
            searchTerm = (function(searchPN, postPhonePattern, prePhonePattern) {
              var searchTermArr = [];

              for (var i = -1, length = searchPN.length; ++i < length;) {
                searchTermArr.push(searchPN.charAt(i));
                searchTermArr.push(postPhonePattern);
              }

              if (searchTermArr.length > 0) {
                searchTermArr.pop();
                searchTermArr.unshift(prePhonePattern);
              }

              return searchTermArr.join("");
            })(searchPN, POST_PHONE_PATTERN, PRE_PHONE_PATTERN);

            if (isDomestic === true) {
              newTerm = (function(_newPN) {
                var newTermArr = [];

                for (var i = -1, length = _newPN.length; ++i < length;) {
                  newTermArr.push(_newPN.charAt(i));
                  newTermArr.push("$" + (i + 2));
                }

                if (newTermArr.length > 0) {
                  newTermArr.pop();
                  newTermArr.unshift("$1");
                }

                return newTermArr.join("");
              })(newPN);
            } else {
              newTerm = newPN;
            }

            dataCollection.push({
              search: new RegExp(searchTerm, "i"),
              replace: newTerm
            });
          }

          // Replace text nodes.
          _$RL.replaceText({data: dataCollection});

          // Replace anchor nodes that have "tel" protocol.
          (function(data) {
            var anchorEArr = $("a");

            for (var i = -1, iLength = anchorEArr.length; ++i < iLength;) {
              var anchorE = anchorEArr[i],
                anchorEHref = anchorE.href.trim(),
                anchorEProtocol = anchorE.protocol;

              if (anchorEProtocol !== "tel:") {
                continue;
              }

              for (var j = -1, jLength = data.length; ++j < jLength;) {
                var d = data[j],
                  s = d.search,
                  r = d.replace;

                if (anchorEHref.search(s) > -1) {
                  anchorE.href= anchorEHref.replace(s, r);
                  break;
                }
              }
            }
          })(dataCollection);
        };
      };

      if (enabled === 1) {
        // Module is enabled.
        execute.call($RL, config);
      } else {
        // Module is disabled.
        $RL.replacePhoneNumber = function() {
          // Do nothing.
          return false;
        };
      }
    },

    /**
     * Retrieve and set cookie in the RLMMS domain.
     *
     * .getRlmmsCookie(cookie, options)
     * cookie - array/string - cookie name(s)
     * options - object - (optional) key-value mapping
     *
     * options object:
     * callback - function - callback function after a successful query
     * scid - string - if provided, retrieve additional campaign data
     *
     * .setRlmmsCookie(data, options)
     * data - object - key-value mapping
     * options - object - (optional) key-value mapping
     *
     * options object:
     * callback - function - callback function after a successful query
     * type - string - "post" or "get" (default)
     */
    RlmmsCookie: function(enabled, config) {
      // Helper function to load module.
      var execute = function() {
        var _$RL = this,      // RL alias.
          $ = _$RL.jq,      // jQuery alias.
          env = _$RL.config.env,  // Environment setting.
          mmsDomain = _$RL.config.config.domains.mms,   // MMS domain.
          cdnDomain = _$RL.config.config.domains.cdn;   // CDN domain.

        _$RL.getRlmmsCookie = function(cookie, options) {
          var callback = function() {},
            scid = "",
            eventId;

          // Sanity check.
          if ($.type(cookie) === "array") {
            // Convert array of strings into one string.
            cookie = cookie.join("&");
          }
          if (typeof cookie !== "string" || cookie === "") {
            // Invalid data type or no cookie specified.
            return false;
          }

          if ($.isPlainObject(options)) {
            if (typeof options.callback === "function") {
              callback = options.callback;
            }
            if (typeof options.scid === "string") {
              scid = options.scid;
            }
          }

          if (env === "T" || env === "S") {
            eventId = ["getCookie", String.random(7)].join("-");

            // Attach eventhandler to intercept messages from iframe.
            $(window).bind(["message", eventId].join("."), function($e) {
              var e = $e.originalEvent,
                eData = e.data,
                data;

              // Security check.
              if (e.origin.indexOf(mmsDomain.split(':')[0]) === -1) {
                // Ignore messages not from RL domains.
                return false;
              }

              // Process data.
              eData = JSON.parse(eData);

              // Security check.
              if (eventId !== eData.id) {
                // Event id must be the same.
                return false;
              }

              data = eData.data;

              // Remove bound event since it should never be used again.
              $(window).unbind($e);

              if ($.isPlainObject(data)) {
                for (var cookie in data) {
                  window[cookie] = data[cookie];
                }
              }

              if (typeof callback === "function") {

                // Return data to callback function.
                callback(data);
              }
            });

            // Send POST request.
            _$RL.post(["//", mmsDomain, "/getcookie?rl_eid=", eventId, "&", cookie].join(""));
          } else {
            $.ajax({
              url: ["//", mmsDomain, "/getcookie?", cookie, (scid !== "" ? "&scid=" + scid : "")].join(""),
              dataType: "script",
              cache: true,
              crossdomain: true,
              success: callback
            });
          }
        };

        _$RL.setRlmmsCookie = function(data, options) {
          var callback = function() {},
            type = "get",
            uri = ["//", mmsDomain, "/setcookie"].join("");

          // Sanity check.
          if (!$.isPlainObject(data)) {
            return false;
          }

          if ($.isPlainObject(options)) {
            if (typeof options.callback === "function") {
              callback = options.callback;
            }
            if (typeof options.type === "string" && options.type === "post") {
              type = "post";
            }
          }

          if (type === "get") {
            // Perform AJAX GET request.
            $.ajax({
              url: uri,
              dataType: "script",
              cache: true,
              crossdomain: true,
              data: data,
              success: callback
            });
          } else {
            // Perform IFRAME form post.
            _$RL.post(uri, data, {success: callback});
          }

          return null;
        };
      };

      if (enabled === 1) {
        // Module is enabled.
        execute.call($RL, config);
      } else {
        // Module is disabled.
        $RL.getRlmmsCookie = function() {
          if ($.isPlainObject(options) && typeof options.callback === "function") {
            // Execute callback if exists.
            options.callback();
          }
        };
      }
    },

    /**
     * Check if the visit is by a robot by comparing User-Agent.
     *
     * The list of UA is taken from http://www.user-agents.org/allagents.xml.  If the module is executed,
     * the result is saved at RL.config.config.robot as a boolean.
     */
    Robot: function(enabled, config) {
      // Helper function to load module.
      var execute = function() {
        var BOTS_URI = ["//", window.rl_widget_cfg.config.domains.cdn, $RL.config.config.cdnFilePath, "/lib/rl_robots.js"].join(""),  // Bots file path.
          _$RL = this;  // RL alias.

        _$RL.loadJs(BOTS_URI, function() {
          var list = window.RL_ROBOTS,
            ua = navigator.userAgent.toLowerCase();

          if (ua.indexOf("robot") > -1) {
            // May be a robot since "robot" is in the user-agent.
            _$RL.config.config.robot = true;
            return;
          }

          for (var i = -1, length = list.length; ++i < length;) {
            if (ua.indexOf(list[i].toLowerCase()) > -1) {
              // May be a robot since one of the known robot substring is in the user-agent.
              _$RL.config.config.robot = true;
              return;
            }
          }

          _$RL.config.config.robot = false;

          // Dispatch robots.load event.
          _$RL.Events.dispatch("robot", "load", {robot: _$RL.config.config.robot});
        });
      };

      if (enabled === 1) {
        // Module is enabled.
        execute.call($RL, config);
      } else {
      }
    },

    /**
     * Provide a set of functions for Scorpion sites.
     *
     * Since Scorpion sites are designed using .NET, some of Capture JS features might be crippled.
     * A set of functions are provided for Scorpion site integration.
     */
    Scorpion: function(enabled) {
      // Helper function to load module.
      var execute = function() {
        var $RL = this,  // RL alias.
            $ = $RL.jq;  // jQuery alias.

        $RL.Scorpion = {
          /**
           * Track form post by forwarding data to Capture.
           *
           * Data is sent to CAPTURE asynchronously so the complete callback function is required to continue
           * the original form submission.
           *
           * .trackFormPost(settings)
           * settings - object - key-value mapping
           *
           * settings object:
           * url - string - form action url
           * data - object - form fields (key-value mapping)
           * complete - function - callback function after forwarding form data to Capture
           * node - object - (optional) DOM node
           */
          trackFormPost: function(settings) {
            var config = $RL.config.config,
                isHipaa = config.hipaa,
                isSsl = config.pageUri.protocol === "https:" ? 1 : 0;

            if (isSsl === 1 && isHipaa === 0) {
              // Do not track forms that have SSL but is not HIPAA.
              return false;
            }

            settings = $.isPlainObject(settings) ? settings : {};

            // Sanity check and clean up.
            if (typeof settings.url !== "string" || settings.url.length < 1) {
              return false;
            }
            if ($.isPlainObject(settings.data)) {
              settings.data = $.param(settings.data);
            } else if (typeof settings.data !== "string") {
              return false;
            }
            if (typeof settings.complete !== "function") {
              return false;
            }

            if (settings.url.indexOf("https:") === 0 && isHipaa === 0) {
              // Do not track forms that have SSL but is not HIPAA.
              return false;
            }

            // Dispatch form-submission-capture.callback event.
            $RL.Events.dispatch("form-submission-capture", "callback", {url: settings.url, data: settings.data, node: settings.node}, function() {settings.complete();});
          }
        };
      };

      if (enabled === 1) {
        // Module is enabled.
        execute.call($RL);
      } else {
      }
    },

    /**
     * Replaces text in TextNodes.
     *
     * .replaceText(options)
     * options - object - key-value data mapping
     *
     * options object:
     * node - object - DOM node to start the search
     * data - object/array - search & replace text (array of)
     *
     * data object:
     * search - string/regex - search string
     * replace - string - new string
     * success - function - (optional) function to be called if the replacement succeeds
     */
    TextReplacement:  function(enabled, config) {
      // Helper function to load module.
      var execute = function() {
        var _$RL = this,  // RL alias.
          $ = _$RL.jq;  // jQuery alias.

        _$RL.replaceText = (function() {
          var replace = function(node, data) {
            // Native DOM traversal.
            var treeWalker = function(node, data) {
              var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);

              while (node = walker.nextNode()) {
                replaceText(node, data);
              }
            };

            // Manual DOM traversal.
            var recursiveTreeTraversal = function(node, data) {
              var childNodes = node.childNodes || [];

              for (var i = -1, length = childNodes.length; ++i < length;) {
                recursiveTreeTraversal(childNodes[i], data);
              }

              if (node.nodeType !== 3) {
                return;
              }

              replaceText(node, data);
            };

            var replaceText = function(node, data) {
              for (var i = -1, length = data.length; ++i < length;) {
                var r = data[i],
                  nodeValue = undefined;

                if ($.type(r.search) === "regexp") {
                  nodeValue = node.nodeValue;
                  node.nodeValue = node.nodeValue.replace(r.search, r.replace);
                  if (nodeValue.search(r.search) > -1 && typeof r.success === "function") {
                    r.success(node);
                  }
                } else if (node.nodeValue === r.search) {
                  node.nodeValue = r.replace;
                  if (typeof r.success === "function") {
                    r.success(node);
                  }
                }
              }
            };

            return typeof document.createTreeWalker === "function" ? treeWalker(node, data) : recursiveTreeTraversal(node, data);
          };

          return function(options) {
            var node, // DOM node.
              data; // Array of search & replace text.

            if (!$.isPlainObject(options)) {
              return false;
            }

            if ($.type(options.data) === "array") {
              data = [];
              for (var i = -1, length = options.data.length; ++i < length;) {
                var text = options.data[i];
                if ($.isPlainObject(text) && (typeof text.search === "string" || $.type(text.search) === "regexp") && typeof text.replace === "string") {
                  data.push(text);
                }
              }
            } else if ($.isPlainObject(options.data) && (typeof options.data.search === "string" || $.type(options.data.search) === "regexp") && typeof options.data.replace === "string") {
              data = [options.data];
            } else {
              return false;
            }

            node = (typeof node === "object" && node.nodeType === 1) ? options.node : document.body;

            if (data.length > 0) {
              replace(node, data);
            }
          };
        })();
      };

      if (enabled === 1) {
        // Module is enabled.
        execute.call($RL, config);
      } else {
        // Module is disabled.
        $RL.replaceText = function() {
          // Do nothing.
          return false;
        };
      }
    },

    /**
     * Check if tracking is enabled.
     *
     * Tracking is enabled only if there is no opt-out cookie and
     * browser cookies are enabled.
     *
     * .isTrackingEnabled(optOutCookie)
     * optOutCookie - string/null/undefined - value of the opt-out cookie
     */
    Tracking: function(enabled, config) {
      // Helper function to load module.
      var execute = function() {
        var _$RL = this,  // RL alias.
          $ = _$RL.jq;  // jQuery alias.

        _$RL.isTrackingEnabled = function(optOutCookie) {
          // Sanity check.
          if ((typeof optOutCookie !== "string" && typeof optOutCookie !== "undefined" && optOutCookie !== null) || (typeof optOutCookie === "string" && optOutCookie !== "")) {
            return false;
          }

          // Check if browser cookies are enabled.
          $.cookie("rl_track", "test");
          if ($.cookie("rl_track") === "test") {
            $.cookie("rl_track", null, {expires: -1});
            return true;
          }

          return false;
        };
      };

      if (enabled ===1) {
        // Module is enabled.
        execute.call($RL, config);
      } else {
        // Module is disabled.
        $RL.isTrackingEnabled = function() {
          // Always return true.
          return true;
        };
      }
    }
  };


  try {
    $RL._init = $CORE;
  } catch(e) {
  }

})(window, window.RL);
