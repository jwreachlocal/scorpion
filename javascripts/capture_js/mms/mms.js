/**
 * Loader.
 *
 * Load and process rl_config.js, rl_modules.js, rl_lib.js, and rl_jquery files.  Depending on rl_config.js, load products and modules.
 *
 * rl_config.js, rl_modules.js, and rl_lib.js override via c, m, and l params.
 * Ex. <script src="mms.js?c=http://www.example.com/rl_config.js&m=http://www.example.com/rl_modules.js&l="http://www.example.com/rl_lib.js"></script>"
 *
 * environment override via e param.
 * Valid values are P (prod), QA (QA), T (integrated testing), D (dev), S (sandbox).
 * Ex. <script src="mms.js?e=T"></script>
 *
 * The init method for products can be overriden to not autoexec via autorun param.
 * Valid value is "0".
 * Ex. <script src="mms.js?autorun=0"></script>
 */
(function(window) {

  var RL_INIT = function() {

    // Default configuration settings.
    var MODULES = ["Campaign", "CaptureWebServices", "CreditCard", "CVT", "Form", "ImageReplacement", "LinkReplacement", "PhoneNumberReplacement", "RlmmsCookie", "Robot", "Scorpion", "TextReplacement", "Tracking"],  // List of modules.
        FILES = [
          {file: "/lib/rl_jquery.js", namespace: "window[\"rl_jquery\"]", aync: false},
          {file: "/lib/rl_domains.js", namespace: "window[\"RL_PROXY_DOMAINS\"]", async: false},
          {file: "/lib/rl_robots.js", namespace: "window[\"RL_ROBOTS\"]", async: false},
          {file: "/mms/rl_config.js", namespace: "window[\"rl_widget_cfg\"]", async: false},
          {file: "/modules/rl_lib.source.js", namespace: "RL[\"lib\"]", async: false},
          {file: "/modules/rl_modules.source.js", namespace: "RL[\"_init\"]", async: true}
        ],                        // Required files.
        CDN_BASE_FILEPATH = {
          "P": "/capture_static",
          "QA": "/capture_static",
          "T": "",
          "D": "/capture_static",
          "S": ""
        },                        // CDN base filepath.
        CDN_DOMAINS = {
          "P": "static.rlcdn.net",
          "QA": "qweb351.dyn.wh.reachlocal.com",
          "T": "capture_js.rlmms-test.com:9292",
          "D": "dweb351.dyn.wh.reachlocal.com",
          "S": "js.rlmms-sb.com"
        },                        // CDN domains.
        CAPTURE_DOMAINS = {
          "P": "rlets.com",
          "QA": "q-capture-qa-vs-wh-gbl-capture-http.wh.reachlocal.com",
          "T": "lvh.me:9887",
          "D": "d-capture-dev-vs-wh-gbl-capture-http.wh.reachlocal.com",
          "S": "lvh.me"
        },                        // Capture API domains.
        MMS_DOMAINS = {
          "P": "rtsys.rlmms.com",
          "QA": "qweb102.dyn.wh.reachlocal.com",
          "T": "capture.stubproxy.com:9298",
          "D": "rtsys.rlmms-dev.com",
          "S": "rtsys.rlmms-sb.com"
        };                        // MMS/Proxy domains.

    var config = {};

    /**
     * Initialize loader.
     *
     * Get user settings if applicable and start loading dependent files.
     *
     * .init()
     */
    this.init = function() {
      var self = this,
          checkRetryCounter = 0,
          checkRetryId;

      // Check browser compatibility.
      if (!this.constructor.isBrowserCompatible()) {
        return;
      }

      // Get config.
      config = this.config();

      // Load required core files.
      this.loadFiles(config.files);

      // Check if all core files are loaded.
      var checkFiles = function() {
        if (++checkRetryCounter > 35) {
          clearInterval(checkRetryId);
          return;
        }

        if (this.areFilesLoaded(config.files)) {
          // All required files are loaded.
          clearInterval(checkRetryId);
          this.processFiles();
          return;
        }
      };
      checkRetryId = setInterval(function() {checkFiles.call(self);}, 100);
    };

    /**
     * Check if core files are loaded.
     *
     * .areFilesLoaded(files)
     * files - object - array of key-value mappings
     *
     * files object:
     * file - string - url address
     * namespace - string - object name
     * async - boolean - load JS aysnc or not
     *
     * RETURNS: boolean
     */
    this.areFilesLoaded = function(files) {
      files = files || [];

      for (var i = -1, length = files.length; ++i < length;) {
        if (eval(files[i].namespace) === undefined) {
          return false;
        }
      }

      return true;
    };

    /**
     * Gets the configuration settings.
     *
     * Retrieves the default settings and override specific settings with user specified settings if applicable.
     *
     * .config()
     *
     * RETURNS: key-value mapping object
     */
    this.config = function() {
      var siteId = (window.rl_id || window.rl_siteid || window.rlets_siteid || "").replace(/-/g, ""),
          settings = this.constructor.parseUserSettings(this.constructor.getUserSettings()),
          environment = (typeof settings.e === "string" && CDN_DOMAINS[settings.e]) ? settings.e : "P",
          autorun = settings.autorun == 0 ? 0 : 1,
          cdnHost = ["//", CDN_DOMAINS[environment]].join(""),
          cdnBaseFilePath = CDN_BASE_FILEPATH[environment],
          files = [];

      for (var i = -1, length = FILES.length; ++i < length;) {
        var file = FILES[i].file,
            namespace = FILES[i].namespace,
            fileAddress;

        switch (namespace) {
          case "window[\"rl_widget_cfg\"]":
            if (typeof settings.c === "string" && settings.c.length > 2) {
              fileAddress = settings.c;
              break;
            }

            fileAddress = this.constructor.getSiteConfigFile(siteId);
            if (fileAddress.length > 0) {
              fileAddress = [cdnHost, fileAddress].join("");
            } else {
              fileAddress = ["http://jwreachlocal.github.io/scorpion/javascripts", file].join("");
            }
            break;

          case "RL[\"lib\"]":
            fileAddress = (typeof settings.l === "string" && settings.l.length > 0) ? settings.l : ["http://jwreachlocal.github.io/scorpion/javascripts/capture_js", file].join("");
            break;

          case "RL[\"_init\"]":
            fileAddress = (typeof settings.m === "string" && settings.m.length > 2) ? settings.m : ["http://jwreachlocal.github.io/scorpion/javascripts/capture_js", file].join("");
            break;

          default:
            fileAddress = ["http://jwreachlocal.github.io/scorpion/javascripts/capture_js", file].join("");
        }

        files.push({file: fileAddress, namespace: namespace, async: FILES[i].async});
      }

      return {
        siteId: siteId,
        environment: environment,
        autorun: autorun,
        cdnHost: cdnHost,
        cdnBaseFilePath: cdnBaseFilePath,
        captureHost: ["//", CAPTURE_DOMAINS[environment]].join(""),
        proxyHost: ["//", MMS_DOMAINS[environment]].join(""),
        files: files
      };
    };

    /**
     * Initialize modules.
     *
     * .initModules(modules)
     * modules - string - array of module names
     */
    this.initModules = function(modules) {
      var modulesLib = window.RL._MODULES;

      for (var i = -1, length = modules.length; ++i < length;) {
        var moduleInitFunction = modulesLib[modules[i]];

        if (typeof moduleInitFunction === "function") {
          moduleInitFunction(1);
        }
      }
    };

    /**
     * Initialize products.
     *
     * .initProducts()
     */
    this.initProducts = function() {
      var self = this,
          RL = window.RL,
          products = window.rl_widget_cfg.products,
          autorun = config.autorun,
          cdnHostAndBaseFilePath = [config.cdnHost, config.cdnBaseFilePath].join("");

      window.rl_jquery.each(products, function(i, product) {
        var jsFile = product.jsFile,
            cssFile = product.cssFile;

        // Default load logic for products that are enabled and autoloaded.
        if (product.enabled !== true || product.autoload !== true) {
          // Do not load product.
          return;
        }

        var loadProductCompleteCallback = autorun === 1 ? function() {
          self.constructor.initProduct(product);
        } : undefined;

        jsFile = typeof jsFile === "string" && jsFile.length > 2 ? ["http://jwreachlocal.github.io/scorpion/javascripts/capture_js/", jsFile].join("") : "";
        cssFile = typeof cssFile === "string" && cssFile.length > 2 ? ["http://jwreachlocal.github.io/scorpion/javascripts/capture_js/", cssFile].join("") : "";

        // Load product.
        self.constructor.loadProduct(jsFile, cssFile, product.jsCode, loadProductCompleteCallback);
      });
    };

    /**
     * Loads core files.
     *
     * The list of files to load is generated by .config() and is stored in the .config().files.
     *
     * .loadFiles(files)
     * files - object - array of key-value mappings
     *
     * files object:
     * file - string - url address
     * namespace - string - object name
     * async - boolean - load JS aysnc or not
     */
    this.loadFiles = function(files) {
      files = files || [];

      for (var i = -1, length = files.length; ++i < length;) {
        this.constructor.loadJs(files[i].file, files[i].async);
      }
    };

    /**
     * Process core files after they are loaded.
     *
     * After all the core files are loaded, load modules and products, and set up the JS configuration settings.
     *
     * .processFiles()
     */
    this.processFiles = function() {
      var siteConfig = window.rl_widget_cfg,
          environment = config.environment,
          RL;

      // Update domains and paths.
      siteConfig.env = environment;
      siteConfig.config.domains.cdn = CDN_DOMAINS[environment];
      siteConfig.config.domains.mms = MMS_DOMAINS[environment];
      siteConfig.config.domains.capture = CAPTURE_DOMAINS[environment];
      siteConfig.config.cdnFilePath = config.cdnBaseFilePath;

      RL = window.RL._init.init();

      // Confirm window.RL object has been created and initialized.
      if (!RL || RL.init() === false) {
        return false;
      }

      RL.lib.isOptedOut();

      // Load modules.
      this.initModules(MODULES);

      // Load products.
      this.initProducts();
    };
  };

  /**
   * Generates the site JS config url location based on the site id.
   *
   * If the site id is a 32 character UUID, then the file path will be
   * /capture_configs/{3-char}/{3-char}/{3-char}/{23-char}.js else returns empty string.
   *
   * .constructor.getSiteConfigFile(siteId)
   * siteId - string - site id
   *
   * RETURNS: string
   */
  RL_INIT.getSiteConfigFile = function(siteId) {
    var filePath = [];

    if (siteId.length !== 32) {
      // Invalid site id.
      return "";
    }

    // Valid site id.
    filePath.push("/capture_configs");
    filePath.push(siteId.substr(0, 3));
    filePath.push(siteId.substr(3, 3));
    filePath.push(siteId.substr(6, 3));
    filePath.push([siteId.substr(9), "js"].join("."));
    filePath = filePath.join("/");

    return filePath;
  };

  /**
   * Retrieves user settings from the url querystring.
   *
   * .constructor.getUserSettings()
   *
   * RETURNS: string
   */
  RL_INIT.getUserSettings = function() {
    var scriptEs = document.getElementsByTagName("script");

    // Get the last mms.js script tag.
    for (var i = scriptEs.length; --i > -1;) {
      var src,
          pos;

      // Get the script source.
      src = (function(src) {
        var pos = src.indexOf("mms.js");
        if (pos < 0) {
          pos = src.indexOf("mms.source.js");
        }
        return pos > -1 ? src.slice(pos) : "";
      })(scriptEs[i].src);

      if (src.length === 0) {
        // Not a mms.js or mms.source.js script.
        continue;
      }

      // Extract querystring from the script tag source.
      pos = src.indexOf("?");
      return pos > -1 ? src.slice(pos + 1) : "";
    }
  };

  /**
   * Initialize product.
   *
   * .constructor.initProduct(product)
   * product - object - key-value mapping
   *
   * product object:
   * name - string - name of product
   */
  RL_INIT.initProduct = function(product) {
    var productNamespace = RL[product.name.toUpperCase()],
        checkRetryCounter = 0,
        checkRetryId;

    checkRetryId = setInterval(function() {
      if (++checkRetryCounter > 25) {
        clearInterval(checkRetryId);
        return;
      }

      if (productNamespace) {
        // Product is loaded.
        clearInterval(checkRetryId);

        try {
          productNamespace.init();
        } catch(e) {
        }

        return;
      }
    }, 10);
  };

  /**
   * Checks if browser is compatible.
   *
   * Checks if browser supports JSON and postMessage().
   *
   * .constructor.isBrowserCompatible()
   *
   * RETURNS: boolean
   */
  RL_INIT.isBrowserCompatible = function() {
    if (!window.JSON || !window.postMessage) {
      // Browser must support JSON and postMessage().
      return false;
    }
    return true;
  };

  /**
   * Load JS file.
   *
   * .constructor.loadJs(url, async)
   * url - string - JS file url
   * async - boolean - load file async or not
   */
  RL_INIT.loadJs = function(url, async) {
    // Create script tag element.
    var scriptE = document.createElement("script");
    scriptE.src = url;
    scriptE.async = async === true ? true : false;

    // Append script tag to HEAD element.
    document.getElementsByTagName("head")[0].appendChild(scriptE);
  };

  /**
   * Load a product.
   *
   * Loads product library files (e.g. JS and CSS files).  Either jsFile or jsCode parameter must be set.
   *
   * .constructor.loadProduct(jsFile, cssFile, jsCode, complete)
   * jsFile - string - (optional) JS file url
   * cssFile - string - (optional) CSS file url
   * jsCode - string - (optional) JS code
   * complete - function - (optional) function to execute once the JS file is loaded or executed.
   */
  RL_INIT.loadProduct = function(jsFile, cssFile, jsCode, complete) {
    if (cssFile) {
      // Load CSS file.
      RL.lib.loadCss(cssFile);
    }

    if (jsFile) {
      // Load JS file.
      RL.lib.loadJs(jsFile, complete);
    }

    if (typeof jsCode === "string" && jsCode.length > 0) {
      // Execute JS code.
      eval(jsCode);
      if (typeof complete === "function") {
        complete();
      }
    }
  };

  /**
   * Parses user settings from the querystring into a key-value mapping object.
   *
   * .constructor.parseUserSettings(settings)
   * settings - string - user settings
   *
   * RETURNS: key-value mapping object
   */
  RL_INIT.parseUserSettings = function(settings) {
    var data = {};

    settings = typeof settings === "string" ? settings.split("&") : [];

    // Get each key-value pair.
    for (var i = -1, length = settings.length; ++i < length;) {
      var keyValue = settings[i].split("="),
          key = keyValue[0] || "",
          value = keyValue[1] || "";

      if (key.length === 0) {
        // Skip empty key.
        continue;
      }

      data[decodeURIComponent(key)] = decodeURIComponent(value);
    }

    return data;
  };


  window.RL = {loader: new RL_INIT()};
  if (!window.rl_no_load) {
    window.RL.loader.init();
  }

})(window);
