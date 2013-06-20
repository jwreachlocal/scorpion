/**
 * Remarketing.
 *
 *
 * Drop remarketing pixels.  Pixels can be an image, iframe, or script tag.
 *
 *
 * Example product settings in the config file (rl_config.js):
 *
 * config: {
 *   pixels: [
 *     "<img src=\"http://ad.reachlocal.com/pixel?id=294157&t=2\" width=\"1\" height=\"1\" />",
 *     "<script type=\"text/javascript\"> adroll_adv_id = \"H54CPKZH5BFBBEUFKYCRH2\"; adroll_pix_id = \"TPZQZZAMYVFH5FFYYJP4RD\"; (function () { var oldonload = window.onload; window.onload = function(){    __adroll_loaded=true;    var scr = document.createElement(\"script\");    var host = ((\"https:\" == document.location.protocol) ? \"https://s.adroll.com\" : \"http://a.adroll.com\");    scr.setAttribute('async', 'true');    scr.type = \"text/javascript\";    scr.src = host + \"/j/roundtrip.js\";    document.documentElement.firstChild.appendChild(scr);    if(oldonload){oldonload()}}; }()); </script>",
 *     "<iframe src='http://pixel.fetchback.com/serve/fb/pdc?cat=&name=Halleen+Kia&sid=2749' scrolling='no' width='1' height='1' marginheight='0' marginwidth='0' frameborder='0'></iframe>"
 *   ]
 * }
 *
 * pixels - array - an array of strings.
 */
(function(window, undefined, $RL) {
	"use strict";
	
	var $REMARKETING = {},											// Remarketing widget (window.RL.REMARKETING).
		globalConfig = $RL.config,									// Global config alias.
		siteConfig = $RL.config.config,
		remarketingConfig = $RL.config.products.remarketing;		// Remarketing config alias.

		
	$REMARKETING = {
		/**
		 * Drop pixels.
		 *
		 * Pixels can be images, IFRAMEs, and JavaScript snippets.
		 * Pixel code is embedded onto the DOM, and then retrieved and processed as an DOM object.
		 *
		 * Fire remarketing.drop event.
		 *
		 * .drop(pixels)
		 * pixels - array - list of pixels.  each array element is a string.
		 */
		drop: function() {
			var _$RL = $RL,					// $RL alias.
				$ = _$RL.jq,				// jQuery alias.
				$rootE = $("#rl-root");		// #rl-root DOM node.
			
			_$RL.CaptureStorage.getItem(["visit_id"], function(data) {
				if (typeof data.visit_id === "undefined") {
					if ($rootE.length < 1) {
						// Create hidden DIV to drop pixel(s).
						$rootE = $("<div>", {id: "rl-root"}).css({height: "0", width: "0"}).appendTo($("body"));
					}

					var campaignData = globalConfig.campaign_data,
						campaignKey = [siteConfig.platform, siteConfig.campaign.cid].join("_"),
						masterCampaignId = (campaignData[campaignKey] || {}).master_campaign_id,
						remarketingPixels;

					if (typeof masterCampaignId !== 'undefined' && typeof remarketingConfig[masterCampaignId] !== 'undefined') {
						if (typeof remarketingConfig[masterCampaignId][siteConfig.campaign.scid] !== 'undefined') {
							remarketingPixels = remarketingConfig[masterCampaignId][siteConfig.campaign.scid];
						} else {
							remarketingPixels = remarketingConfig[masterCampaignId]["default"];
						}
						if (typeof remarketingPixels["tags"] == "string" && remarketingPixels["tags"] !== "") {
							var pixelId = "rl-pixel-" + pixelId;
							$("<div>", {id: pixelId}).html(remarketingPixels["tags"] ).appendTo($rootE);
						}
						if (typeof remarketingPixels["scripts"] == "string" && remarketingPixels["scripts"] !== "") {
							(function(script) {
								try {
									// Get and execute JS code.
									eval.call(window, script);
								} catch (err) {
								}
							})(remarketingPixels["scripts"]);
						}
					}
					
					// Dispatch drop event.
					_$RL.Events.dispatch("remarketing", "drop");
					
					return this;
				}
			});
		},
		
		/**
		 * Init.
		 *
		 * Fire remarketing.load event.
		 *
		 * .init()
		 */
		init: function() {
			var _$RL = $RL,				// $RL alias.
				_$REMARKETING = this,	// $REMARKETING alias.
				$ = _$RL.jq;

			if (siteConfig.campaign.isPaidCampaign === true && siteConfig.campaign.isSrcProxy === true) {
				// Do not drop pixel(s) if proxied.
				return _$REMARKETING;
			}
			
			$(document).ready(function() {
				// Drop pixels.
				_$REMARKETING.drop();
				
				// Dispatch load event.
				_$RL.Events.dispatch("remarketing", "load");
			});
			
			return _$REMARKETING;
		}
	};
	

	$RL.REMARKETING = $REMARKETING;
})(window, undefined, window.RL);
