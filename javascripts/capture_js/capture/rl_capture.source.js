/**
 * Capture.
 *
 *
 * Track user visits.
 *
 *
 * Example product settings in the config file (rl_globalConfig.js):
 *
 * config: {
 *   id: "f51e0b33-c1ea-456d-a795-d94c4a598284"
 * }
 *
 * id - string - unique site id.
 */
(function(window, undefined, $RL) {
  "use strict";

  var $CAPTURE = {},                  // Capture widget (window.RL.CAPTURE).
    globalConfig = $RL.config.config,       // Global config alias.
    captureConfig = $RL.config.products.capture,  // Capture config alias.
    replacementConfig = $RL.config.replacements,  // Replacments config alias.
    cookies = {};                 // Cookies used by CAPTURE.


  $CAPTURE = {
    /**
     * Init.
     *
     * Fire capture.load event.
     *
     * .init(skipInit)
     * skipInit - boolean - true to skip setting config data
     */
    init: function(skipInit) {
      var _$RL = $RL,             // RL alias.
        _$CAPTURE = this,         // $CAPTURE alias.
        $ = _$RL.jq,            // jQuery alias.
        platform = globalConfig.platform, // Platform.
        campaign = globalConfig.campaign; // Campaign data.

      if (campaign.isPaidCampaign === true && campaign.isSrcProxy === true) {
        // Do not track if proxy visit.
        return;
      }

      if (typeof skipInit !== "boolean" || skipInit === false) {
        // Get cookies from RLMMS.com domain.
        _$RL.getRlmmsCookie(
          ["RlocalOptOut"],
          {
            scid: campaign.isPaidCampaign === true ? campaign.scid : "",
            callback: function() {
              var _$RL = $RL;

              // Get opt-out cookie.
              cookies.optOutCookie = typeof window.RlocalOptOut === "string" ? window.RlocalOptOut : (typeof window.RlocalOptOut === "number" ? String(window.RlocalOptOut) : null);

              // Get campaign mcid.
              if (typeof window.mcid_get === "string") {
                campaign.mcid = window.mcid_get;
              } else if (typeof window.mcid_get === "number") {
                campaign.mcid = String(window.mcid_get);
              }

              // Check if tracking page.
              if (!_$RL.isTrackingEnabled(cookies.optOutCookie)) {
                return _$CAPTURE;
              }

              _$RL.Events.subscribe("robot", "load", function(data) {
                // Wait for robot detection.
                _$CAPTURE.init(true);
                return _$CAPTURE;
              });

              if (typeof _$RL.config.config.robot === "boolean") {
                // Wait for robot detection.
                _$CAPTURE.init(true);
                return _$CAPTURE;
              }
            }
          }
        );

        return _$CAPTURE;
      }

      $(document).ready(function() {
        // Track visit event.
        _$CAPTURE.trackVisit();

        // Track CVTs.
        _$RL.trackCvt();

        // Capture form submit event.
        _$RL.captureFormSubmit();

        if (campaign.isPaidCampaign === true) {
          // Paid campaign visit.

          if (campaign.isSrcProxy === false) {
            // Phone and string replacements if non-proxied campaign.
            _$CAPTURE.replace([platform, campaign.scid].join("_"));
          }
        } else {
          // Organic visit.
        }

        // Dispatch load event.
        _$RL.Events.dispatch("capture", "load");
      });

      return _$CAPTURE;
    },

    /**
     * Replace phone numbers and images.
     *
     * .replace(type)
     * type - string - SCID or referrer type if organic visit
     */
    replace: function(type) {
      var _$RL = $RL,           // RL alias.
        _$CAPTURE = this,       // $CAPTURE alias.
        $ = $RL.jq,           // jQuery alias.
        data = replacementConfig[type]; // Phone and string replacement data.

      // Sanity check.
      if (data === undefined) {
        // Data must exist for SCID or referrer type.
        return false;
      }

      // Replace phone numbers.
      if ($.type(data.phone) === "array") {
        (function(data) {
          // Format data.
          var d = [];
          for (var i = -1, length = data.length; ++i < length;) {
            var elem = data[i];
            d.push({
              search: elem.original,
              replace: elem.replace
            });
          }
          _$RL.replacePhoneNumber(d);
        })(data.phone);
      }

      // Replace strings.
      if ($.type(data.strings) === "array") {
        (function(data) {
          // Format data.
          var d = [];
          for (var i = -1, length = data.length; ++i < length;) {
            var elem = data[i];
            d.push({
              search: elem.original,
              replace: elem.replace
            });
          }
          _$CAPTURE.replaceString(d);
        })(data.strings);
      }

      // Replace email links.
      if ($.type(data.email) === "array") {
        (function(data) {
          // Format data.
          var d = [];
          for (var i = -1, length = data.length; ++i < length;) {
            var elem = data[i];
            d.push({
              search: elem.original,
              replace: elem.replace
            });
          }
          _$CAPTURE.replaceEmailLinks(d);
        })(data.email);
      }

      return _$CAPTURE;
    },

    /**
     * Replace email links on the page.
     *
     * .replaceEmailLinks(data)
     * data - array - array of key-value mapping (e.g. [{"search": "foo@bar.com", "replace": "bar@foo.com"}, {"search": "joe@plumber.com", "replace": "info@plumber.com"}])
     */
    replaceEmailLinks: function(data) {
      var _$RL = $RL,   // RL alias.
        $ = $RL.jq,   // jQuery alias.
        linkEArr = $.makeArray($("a[href^=mailto]")); // Mail links.

      for (var i = -1, ilength = data.length; ++i < ilength;) {
        var d = data[i],
          s = d.search,
          r = d.replace;

        for (var j = -1, jlength = linkEArr.length; ++j < jlength;) {
          var linkE = linkEArr[j];

          if (linkE.href.replace("mailto:", "").toLowerCase() === s.toLowerCase()) {
            _$RL.replaceLink({
              nodeE: linkE,
              uri: ["mailto", r].join(":")
            });
          }
        }
      }

      return this;
    },

    /**
     * Replace strings on the page.
     *
     * .replaceStrings(data)
     * data - array - array of key-value mapping (e.g. [{"search": "8183397978", "replace": "2221113333"}, {"search": "8183397777", "replace": "2221114444"}])
     */
    replaceString: function(data) {
      var _$RL = $RL,       // RL alias.
        $ = $RL.jq,       // jQuery alias.
        imgData = [],     // Images that needed replacement.
        strData = {data: []}; // Text that needed replacement.

      // Sanity check.
      if ($.type(data) !== "array") {
        // Data parameter must be an array of objects.
        return false;
      }

      // Helper function to parse out the image file.
      var parseString = function(str) {
        if (str.search(/(img)?.*src\s*=\s*[\"\'][^\'\"]*[\"\']/ig) > -1) {
          // String contains IMG tag.
          var text = str.replace(/<?\s*(img)?(\s\w+\s*=?\s*[\"\'][^\"\']*[\"\'])*\s*src\s*=\s*[\"\']([^\"\']*)[\"\'](\s\w+\s*=?\s*[\"\'][^\"\']*[\"\'])*\s*\/?>?/ig, "");

          if ($.trim(text).length === 0) {
            // String is an IMG tag.
            return {type: ["image"], string: str.replace(/<?\s*(img)?(\s\w+\s*=?\s*[\"\'][^\"\']*[\"\'])*\s*src\s*=\s*[\"\']([^\"\']*)[\"\'](\s\w+\s*=?\s*[\"\'][^\"\']*[\"\'])*\s*\/?>?/ig, "$3")};
          } else {
            // String contains additional text.
            return {type: ["string"], string: text, image: str.match(/(<\s*img.*src\s*=\s*)[\"\']([^\"\']*)[\"\']((\s\w+\s*=?\s*[\"\']?[^\"\']*[\"\']?)*\s*\/?>)/ig)[0]};
          }
        } else if (str.search(/^(background(-image)?:|transparent )?(url)?\s*\(\s*[\"\']?([^\"\']*)[\"\']?\s*\)$/ig) === 0) {
          // String contains CSS background image.
          return {type: ["image"], string: str.replace(/^(background(-image)?:|transparent )?(url)?\s*\(\s*[\"\']?([^\"\']*)[\"\']?\s*\)$/ig, "$4")};
        } else if (str.search(/^background\s*=\s*[\"\']([^\"\']*)[\"\']?$/ig) === 0) {
          // String contains CSS background image.
          return {type: ["image"], string: str.replace(/^background\s*=\s*[\"\']([^\"\']*)[\"\']?$/ig, "$1")};
        } else if (str.search(/.+\.(jpg|jpeg|gif|tif|png|bmp)\s*$/ig) > -1) {
          // String contains an url.
          return {type: ["image", "string"], string: str.replace(/(.+\.(jpg|jpeg|gif|tif|png|bmp))\s*$/ig, "$1")};
        } else if (str.search(/a(\s\w+\s*=?\s*[\"\'][^\"\']*[\"\'])*\s*href\s*=\s*[\"\'][^\'\"]*[\"\']/ig) > -1) {
          // String contains a link.
          var text = str.replace(/<a(\s\w+\s*=?\s*[\"\'][^\"\']*[\"\'])*\s*href\s*=\s*[\"\']([^\"\']*)[\"\'](\s\w+\s*=?\s*[\"\'][^\"\']*[\"\'])*\s*>.+<\/a>/gi, "$LINK$");

          if ($.trim(text) === "$LINK$") {
            // String is a link.
            return {type: ["link"], link: str};
          } else {
            // String contains additional text.
            var linkStr = str.match(/<a(\s\w+\s*=?\s*[\"\'][^\"\']*[\"\'])*\s*href\s*=\s*[\"\']([^\"\']*)[\"\'](\s\w+\s*=?\s*[\"\'][^\"\']*[\"\'])*\s*>.+<\/a>/ig);
            if (linkStr !== null) {
              return {type: ["string"], string: text, link: linkStr[0]};
            }
          }
        }

        return {type: ["string"], string: str};
      };

      for (var i = -1, length = data.length; ++i < length;) {
        var elem = data[i],
          searchStr = parseString(elem.search),
          replaceStr = parseString(elem.replace);

        if (searchStr.string !== "" && replaceStr.string !== "") {
          // Straight string replacement.
          if (searchStr.type.indexOf("image") > -1 && replaceStr.type.indexOf("image") > -1) {
            imgData.push({search: searchStr.string, replace: replaceStr.string});
          }
          if (searchStr.type.indexOf("string") > -1 && replaceStr.type.indexOf("string") > -1) {
            (function() {
              var success;

              if (replaceStr.image) {
                var success = (function() {
                  var image  = replaceStr.image;
                  return function(nodeE) {
                    $(nodeE).after(image);
                  };
                })();
              } else if(replaceStr.link) {
                var success = (function() {
                  var link  = replaceStr.link,
                    pos = replaceStr.string.search(/^\s*\$LINK\$/gi) > -1 ? "before" : "after";
                  return function(nodeE) {
                    if (pos === "before") {
                      $(nodeE).before(link);
                    } else {
                      $(nodeE).after(link);
                    }
                  };
                })();
                replaceStr.string = replaceStr.string.replace("$LINK$", "");
              }

              try {
                strData.data.push({search: new RegExp(["(\n)*", searchStr.string, "(\n)*"].join(""), "g"), replace: replaceStr.string, success: success});
              } catch(e) {}
            })();
          }
        }
      }

      _$RL.replaceImage(imgData);
      _$RL.replaceText(strData);

      return this;
    },

    /**
     * Track visit event.
     *
     * Serialized data must follow the order stated in the YAML file.
     * Fire capture.visit event.
     *
     * .trackVisit()
     */
    trackVisit: function() {
      var _$RL = $RL,       // $RL alias.
        _$CAPTURE = this,   // $CAPTURE alias.
        $ = $RL.jq;       // jQuery alias.

      // Retrieve visit & visitor ids.
      _$RL.CaptureStorage.getItem(["visitor_id", "visit_id", "referrer_type"], function(data) {
        var ts = parseInt((new Date()).getTime() / 1000),
          visitorId = typeof data.visitor_id === "string" ? data.visitor_id : "",
          visitData = (typeof data.visit_id === "string" && data.visit_id !== "") ? JSON.parse(data.visit_id) : {},
          visitTS = visitData.ts || 0,
          visitId = visitData.id || "",
          referrerType = typeof data.referrer_type === "string" ? data.referrer_type : "",
          previousVisitId,
          previousReferrerType;

        if (visitorId === "") {
          // New visitor.
          referrerType = visitId = "";
        } else {
          // Previous visitor but check to see if new visit.

          if (visitId && referrerType) {
            // Save previous session info just in case this is a continuation.
            previousVisitId = visitId;
            previousReferrerType = referrerType;
          }

          var isInternalPage = (function(gc) {
            // Check if page is internal.
            var domains = gc.domains.internal || [],
                hostname = gc.pageUri.hostname;

            for (var i = -1, length = domains.length; ++i < length;) {
              if (hostname.indexOf(domains[i].toLowerCase()) === 0) {
                // Page is internal.
                return true;
              }
            }

            // Page is external.
            return false;
          })(globalConfig);

          if (isInternalPage === false) {
            // New visit since domain is not internal.
            referrerType = visitId = "";
          } else if (globalConfig.referrer === "" && ts - visitTS >= 86400) {
            // Last visit was 24+ hours ago.
            referrerType = visitId = "";
          } else if (globalConfig.referrer !== "") {
            var isInternalReferrer = (function(gc) {
              // Check if referrer is internal.
              var domains = gc.domains.internal || [],
                referrer = gc.referrer.replace(/^https?:\/\//, "");

              for (var i = -1, length = domains.length; ++i < length;) {
                if (referrer.indexOf(domains[i].toLowerCase()) === 0) {
                  // Came from an internal page.
                  return true;
                }
              }

              // Came from an external page.
              return false;
            })(globalConfig);

            if (isInternalReferrer === false) {
              // New visit since page is referred from an external source.
              referrerType = visitId = "";
            }
          }
        }

        if (visitId && visitorId) {
          // Cache visitor id, visit id, and referrer type if visitor and visit are valid.
          sessionStorage.setItem("visit_id", visitId);
          sessionStorage.setItem("visitor_id", visitorId);
          sessionStorage.setItem("referrer_type", referrerType);
        }

        if (visitId) {
          if (globalConfig.campaign.isPaidCampaign === false && referrerType) {
            if (_$RL.config.config.robot === true && referrerType === "DIRECT") {
              // Do not replace if visited by a robot and the referral type is "DIRECT".
              return;
            }

            // Phone and string replacements for organic visit.
            _$CAPTURE.replace(referrerType);
          }

          // Dispatch visit event.
          _$RL.Events.dispatch("capture", "visit", {visitorId: visitorId, visitId: visitId, referrerType: referrerType});

          // Not new visit.
          return;
        } else {
          // Track visit callback.
          window.rl_captureTrackVisit = function(data) {
            // Manage visit id, visitor id, and referrer type.
            if ($.isEmptyObject(data)) {
              // Continuation of a previous session.
              if (previousVisitId) {
                visitId = previousVisitId;
                previousVisitId = undefined;
              }
              if (previousReferrerType) {
                referrerType = previousReferrerType;
                previousReferrerType = undefined;
              }
            } else {
              if (typeof data.visitor_id === "string" && data.visitor_id !== "") {
                visitorId = data.visitor_id;
              }
              if (typeof data.visit_id === "string" && data.visit_id !== "") {
                visitId = data.visit_id;
              }
              if (typeof data.referrer_type === "string" && data.referrer_type !== "") {
                referrerType = data.referrer_type;
              }
            }

            if (visitId && visitorId) {
              // Cache visitor id, visit id, and referrer type.
              sessionStorage.setItem("visit_id", visitId);
              sessionStorage.setItem("visitor_id", visitorId);
              sessionStorage.setItem("referrer_type", referrerType);
            }

            // Save visit id, visitor id, and referral type.
            _$RL.CaptureStorage.setItems([
              {key: "visitor_id", value: visitorId, expires: ""},
              {key: "visit_id", value: JSON.stringify({id: visitId, ts: parseInt((new Date()).getTime() / 1000)})},
              {key: "referrer_type", value: referrerType}
            ]);

            if (globalConfig.campaign.isPaidCampaign === false && referrerType) {
              if (_$RL.config.config.robot === true && referrerType === "DIRECT") {
                // Do not replace if visited by a robot and the referral type is "DIRECT".
                return;
              }

              // Phone and string replacements for organic visit.
              _$CAPTURE.replace(referrerType);
            }

            // Dispatch visit event.
            _$RL.Events.dispatch("capture", "visit", {visitorId: visitorId, visitId: visitId, referrerType: referrerType});
          };

          // Track new visit.
          _$RL.CaptureWS.trackVisit({
            visitId: visitId || previousVisitId,
            visitorId: visitorId,
            referrer_source: globalConfig.campaign.isPaidCampaign ? "PAID" : "ORGANIC"
          }, window.rl_captureTrackVisit);

        }
      });

      return _$CAPTURE;
    }
  };


  $RL.CAPTURE = $CAPTURE;
})(window, undefined, window.RL);
