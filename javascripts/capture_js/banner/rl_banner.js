/**
 * EU Banner.
 */
(function (window, undefined, $RL) {
	var $BANNER = {}, 				// the popup object
		$,							// jQuery.
		VALID_PROXIES = [
			"reachlocal.net",
			"reachlocal.com",
			"rtrk.com",
			"rtrk5.com",
			"rtrk.ca",
			"rtrk.com.br",
			"rtrk.com.au",
			"rtrk.co.uk",
			"rtrk.jp",
			"rtrk.de",
			"rtrk.nl",
			"rtrk.es",
			"rtrk.sk",
			"rtrk.pl"
		],
		langs,
		proxy,
		campaign;


	// Helper function to get cookies.
	function getCookie(success) {
		var cookieName = ["rl_", campaign.cid].join(""),
			lCookie,
			rCookie,
			cookie;

		// Check local domain.
		lCookie = cookie = getLocalCookie(cookieName);

		if (cookie === undefined) {
			// Check remote domain.
			getRemoteCookie(cookieName, function(data) {
				rCookie = cookie = data;

				if (data !== undefined) {
					// Update local domain.
					lCookie = data;
				}

				success(rCookie);
			});

			return;
		}

		success(lCookie);
	}

	// Helper function set cookies.
	function setCookie() {
		var cookieName = ["rl_", campaign.cid].join("");

		// Set local cookie.
		setLocalCookie(cookieName, campaign.cid, 365);

		// Set remote cookie.
		setRemoteCookie(cookieName, campaign.cid);
	}

	// Helper function to get local cookies.
	// Code taken from http://www.w3schools.com/js/js_cookies.asp.
	function getLocalCookie(c_name) {
		var i, x, y, ARRcookies = document.cookie.split(";");
		for (i = 0; i < ARRcookies.length; i++) {
			x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
			y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
			x = x.replace(/^\s+|\s+$/g, "");
			if (x == c_name) {
				return unescape(y);
			}
		}
	}

	// Helper function to set local cookies.
	// Code taken from http://www.w3schools.com/js/js_cookies.asp.
	function setLocalCookie(c_name, value, exdays) {
		var exdate = new Date();
		exdate.setDate(exdate.getDate() + exdays);
		var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
		document.cookie = c_name + "=" + c_value;
	}

	// Helper function to get cookies from the proxy domain.
	function getRemoteCookie(c, success) {
		$.ajax({
			url: [proxy, "getcookie?", c].join(""),
			dataType: "script",
			success: function(data, textStatus, jqXHR) {

				success(eval(["rl_", campaign.cid].join("")));
			}
		});
	}

	// Helper function to set cookies on the proxy domain.
	function setRemoteCookie(c, v) {
		$.ajax({
			url: [proxy, "setcookie?", c, "=", v].join(""),
			dataType: "script"
		});
	}

	// Get the local language via the global rl_lang variable
	function getLang() {
		//var lang = (navigator.language) ? navigator.language : navigator.userLanguage;
		var lang = window.rl_lang;

		if (lang === "" || lang === "undefined" || lang === null) {
			lang = "en-us";
		}

		return lang;
	}


	// Format and cache local campaign cookie (RlocalUID).
	campaign = (function () {
		// Get proxy campaign data from RlocalUID cookie.
		var cookie = (function(cStr) {
			var cArr = cStr.split("&"),
				c = {};
			for (var i = -1, length = cArr.length; ++i < length;) {
				var e = cArr[i].split("="),
					k = e[0],
					v = e[1];
				if (typeof k === "string" && k !== "" && typeof v === "string") {
					c[k] = v;
				}
			}
			return c.scid ? c : null;
		})(getLocalCookie("RlocalUID") || "");

		return cookie;
	})();

	// Determine and set the proxy server domain.
	(function(host) {
		var hostArr = host.split("."),
			baseDomain;

		if (hostArr.length < 2) {
			baseDomain = host;
		} else {
			baseDomain = [hostArr[hostArr.length - 2], hostArr[hostArr.length - 1]].join(".");
		}

		proxy = ["//rtsys.", baseDomain, "/"].join("");
	})(campaign.primary_serv);


	$BANNER = {
		init: function () {
			var _$BANNER = this;

			if (!campaign.cid || !proxy) {
				// CID and proxy domain values must be valid.
				return false;
			}

			// Init vars.
			$ = window.jQuery;
			langs = window.RL_BANNER_LANGS;

			// Check for cookies.
			getCookie.call(this, function(c) {
				if (c !== undefined) {
					// Do not display banner.
					return;
				}

				// Display banner.
				_$BANNER.show();

			});

			return this;
		},

		show: function() {
			// Determine the proper language and get corresponding copy.
			var lang = langs[getLang()],
				headingText = ["<h3>", lang.header, "</h3>"].join(""),
				contentText = ["<p>", lang.copy, "</p>"].join("");

			// Create a container element for the EU cookie notification.
			var $containerE = $("<div>", {id: "rl-cookies-notice"})
				.css({display: "none"})
				.prependTo($("body"));

			// Create a wrapper element to hold the structure elements for the EU cookie notification.
			var $wrapE = $("<div>")
				.addClass("rl-cookie-notice-content")
				.append(headingText)
				.append(contentText)
				.appendTo($containerE);

			// Append the structure elements for the EU cookie notification.
			$wrapE
				.append($("<div>").addClass("rl-clear"))
				.append($("<div>").addClass("rl-close-btn")
					.append($("<a>", {href: "javascript:void(0);", title: "Click to close"}).html("x"))
					.click(function() {
						setCookie.call(this);

						$("#rl-cookies-notice").slideUp(function() {
							$("#rl-cookies-notice").remove();
						});
					})
				)
				.append($("<div>").addClass("rl-clear"));

			$("#reachLocal-cookie-link").attr("href", lang.link);

			$("#rl-cookies-notice").slideDown();
		}
	};

	window.RL_EUBANNER = $BANNER;

})(window, undefined, window.RL);



/**
 * Load required assets.
 */
(function(window) {
	// Helper function to load script tags.
	var loadJs = function(uri, callback) {
		// Create script tag element.
		var scriptE = document.createElement("script");
		scriptE.type = "text/javascript";
		scriptE.src = uri;
		scriptE.async = true;

		if (typeof callback === "function") {
			// Attach onload callback function to script tag.
			if (scriptE.readyState) {
				// IE.
				scriptE.onreadystatechange = function() {
					if (this.readyState === "complete" || this.readyState === "loaded") {
						callback();
					}
				};
			} else {
				// Firefox, Chrome.
				scriptE.onload = function() {
					callback();
				};
			}
		}
		
		// Append script tag to HEAD element.
		document.getElementsByTagName("head")[0].appendChild(scriptE);
	};

	// Helper function to load CSS tags.
	var loadCss = function(uri) {
		// Create link tag element.
		var linkE = document.createElement("link");
		linkE.rel = "stylesheet";
		linkE.type = "text/css";
		linkE.href = uri;
		linkE.media = "all";

		// Append CSS tag to HEAD element.
		document.getElementsByTagName("head")[0].appendChild(linkE);
	};

	// Load EU banner product resources.
	loadJs("rl_banner_lang.js");
	loadCss("rl_banner.css");

	if (!window.jQuery) {
		// Load jQuery resource.
		loadJs("//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js");
	}

	// Check if JS resources are loaded.
	var check = function() {
		if (window.RL_LANGS === undefined || window.jQuery === undefined) {
			setTimeout(function() {check();}, 50);
			return;
		}

		// Execute since required JS libraries are present.
		setTimeout(function() {window.RL_EUBANNER.init();}, 50);
	};
	setTimeout(function() {check();}, 50);
})(window);
