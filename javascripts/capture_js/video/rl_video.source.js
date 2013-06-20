/**
 * Total Video Now. 
 * 
 * 
 * Display a video player in a user-specified DOM or in an overlay.
 * 
 * 
 * Example product settings in the config file (rl_config.js):
 * 
 * config: {
 *   cssSelector: "#my-div",
 *   closeButtonText: "",
 *   closeButtonImage: "http://www.images.com/button.jpg",
 *   closeButtonWidth: "100",
 *   closeButtonHeight: "50",
 *   autoplay: "1",
 *   video: "<object id=\"player_swf\" classid=\"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000\" width=\"400\" height=\"332\" codebase=\"http://fpdownload.macromedia.com/get/flashplayer/current/swflash.cab\"><param name=\"movie\" value=\"http://cdn-akm.vmixcore.com/core-flash/UnifiedVideoPlayer/UnifiedVideoPlayer.swf?player_id=80b916b86efd0417de7e77c4c21f069b\"></param><param name=\"allowScriptAccess\" value=\"always\"></param><param name=\"allowFullScreen\" value=\"true\"></param><param name=\"wmode\" value=\"transparent\"></param><param name=\"flashVars\" value=\"player_id=80b916b86efd0417de7e77c4c21f069b&services_url=http://cdn-akm.vmixcore.com/core-flash/UnifiedVideoPlayer/services.xml&env=&token=V0Uo0cQHKBkX5aiwxLovkxeeJiBegwHRRD\"></param> <embed name=\"player_swf\" src=\"http://cdn-akm.vmixcore.com/core-flash/UnifiedVideoPlayer/UnifiedVideoPlayer.swf?player_id=80b916b86efd0417de7e77c4c21f069b\" width=\"400\" height=\"332\" allowScriptAccess=\"always\" allowFullScreen=\"true\" wmode=\"transparent\" type=\"application/x-shockwave-flash\" flashvars=\"player_id=80b916b86efd0417de7e77c4c21f069b&services_url=http://cdn-akm.vmixcore.com/core-flash/UnifiedVideoPlayer/services.xml&env=&token=V0Uo0cQHKBkX5aiwxLovkxeeJiBegwHRRD\" swliveconnect=\"true\" pluginspage=\"http://www.adobe.com/go/getflashplayer\"></embed></object>", 
 * }
 * 
 * cssSelector - string - (optional) DOM node id.  if not populated, video player will be displayed in an overlay window.
 * closeButtonText - string - (optional) user specified close button text.  if this and closeButtonImage are not populated, text "X" is used.
 * closeButtonImage - string - (optional) close button image url.
 * closeButtonWidth - string - (optional) close button image width in pixels.
 * closeButtonHeight - string - (optional) close button image height in pixels.
 * autoplay - string - 1 to autoplay video when finish loading and 0 to not.
 * video - string - video embed code.
 */
(function(window, undefined, $RL) {
	"use strict";
	
	var $VIDEO = {},									// Video widget (window.RL.VIDEO).
		videoConfig = $RL.config.products.video,		// Video config alias.
		videoE;											// Video node.
		

	/**
	 * Create close button.
	 * 
	 * createCloseButton()
	 */
	var createCloseButton = function() {
		var $ = $RL.jq,																		// jQuery alias.
			vConfig = this.config(),														// Cleaned up settings.
			$containerE = $("<div>").addClass("rl-video-close-container"),					// Close button container node.
			$buttonE = $("<a>", {href: "javascript:void(0);"}).addClass("rl-video-close"),	// Close button node.
			$buttonImageE;																	// Close button image node.
		
		if (vConfig.closeButtonText !== "") {
			// Create close button with user-specified text.
			$buttonE.html(vConfig.closeButtonText);
		} else if (vConfig.closeButtonImage !== "") {
			// Create close button with an user-specified image.
			$buttonImageE = $("<img>", {src: vConfig.closeButtonImage, alt: ""});
			$buttonE.append($buttonImageE);
		} else {
			// Create close button with a default text.
			$buttonE.html("X");
		}
		
		// Apply width and height close button image if exist.
		if (vConfig.width !== "" && $buttonImageE) {
			$buttonImageE.css({width: vConfig.width + "px"});
		}
		if (vConfig.height !== "" && $buttonImageE) {
			$containerE.css({height: vConfig.height + "px"});
			$buttonImageE.css({height: vConfig.height + "px"});
		}
		
		return $containerE.append($buttonE).get(0);
	};	
	
	/**
	 * Create the video player.
	 * 
	 * Create the iframe node then write the video embed code into iframe's document object.
	 * 
	 * create() 
	 */	
	var create = function(overlay) {
		var IFRAME_DOC_CONTENT = ["<html><head><style>html,body{padding:0;margin:0;}</style><script type=\"text/javascript\">rl_events = function(e) {if (typeof window.parent.rlvideo_events === \"function\") {window.parent.rlvideo_events(e);}};</script></head><body>", "</body></html>"],	// Iframe content.
			_$VIDEO = this,				// $VIDEO alias.
			$ = $RL.jq,					// jQuery alias.
			vConfig = _$VIDEO.config(),	// Cleaned up settings.
			video = vConfig.video,		// Video embed code.
			$iframeE = $("<iframe>", {id: "rl-video-iframe", scrolling: "no", frameborder: 0});	// Iframe node.
			
		if (vConfig.autoplay === "1" || overlay === true) {
			// Set autoplay if specified or is in an overlay.
			video = video.replace("name=\"flashVars\" value=\"", "name=\"flashVars\" value=\"auto_play=1&").replace("type=\"application/x-shockwave-flash\" flashvars=\"", "type=\"application/x-shockwave-flash\" flashvars=\"auto_play=1&");
		}
		
		if (overlay === true) {
			// Attach auto-close event handler for video played in an overlay.
			window.rlvideo_events = function(e) {
				if (e.type === "video_complete") {
					setTimeout(
						function() {
							_$VIDEO.hide();	
						},
						750
					);
				}
			};
			video = video.replace("name=\"flashVars\" value=\"", "name=\"flashVars\" value=\"event_handler=rl_events&").replace("type=\"application/x-shockwave-flash\" flashvars=\"", "type=\"application/x-shockwave-flash\" flashvars=\"event_handler=rl_events&");
		}
		
		$iframeE.ready(function() {
			// Write VMIX video JS to iframe's document.
			var iframeDocE = $iframeE.contents().get(0);
			iframeDocE.open();
			iframeDocE.write(IFRAME_DOC_CONTENT.join(video));
			iframeDocE.close();
		});
		
		return $iframeE.get(0);
	};
	

	$VIDEO = {
		/**
		 * Get product settings.
		 *
		 * Clean and verify data.  If data is not valid, it is set to empty string.
		 * cssSelector node is verified to exist or else set to empty string.
		 *
		 * .config(key)
		 * key - string - (optional) setting to retrieve.  if not provided, all settings are returned.
		 */
		config: function(key) {
			var $ = $RL.jq,				// jQuery alias.
				vConfig = videoConfig;	// Video config alias.
				
			// Helper function to clean up setting.
			var clean = function(key, value) {
				switch (key) {
					case "cssSelector":
						if (typeof value === "string" && value !== "") {
							if (value.charAt(0) !== "#") {
								// Only node ids are accepted.
								value = "#" + value;
							}
							
							if ($(value).length > 0) {
								// User-specified node exist.
								return value;
							}
						}
						return "";
					
					case "closeButtonText":
					case "closeButtonImage":
						return typeof value === "string" ? value : "";
						
					case "closeButtonWidth":
					case "closeButtonHeight":
						return $.isNumeric(value) ? String(value) : "";
						
					case "autoplay":
						return value == "1" ? "1" : "0";
						
					case "video":
						return (typeof value === "string" && value !== "") ? value.replace(/&?auto_play=[01]/g, "") : "";
						
					default:
						return "";
				}
			};
				
			if (typeof key === "string" && key !== "") {
				// Return specfic setting.
				if (!vConfig[key]) {
					// Key not found.
					return "";
				}
				return clean(key, vConfig[key]);
			} else {
				// Return all settings.		
				return {
					cssSelector: clean("cssSelector", vConfig.cssSelector),
					closeButtonText: clean("closeButtonText", vConfig.closeButtonText),
					closeButtonImage: clean("closeButtonImage", vConfig.closeButtonImage),
					closeButtonWidth: clean("closeButtonWidth", vConfig.closeButtonWidth),
					closeButtonHeight: clean("closeButtonHeight", vConfig.closeButtonHeight),
					autoplay: clean("autoplay", vConfig.autoplay),
					video: clean("video", vConfig.video)
				};
			}
		},
		
		/**
		 * Hide and remove video player.
		 *
		 * Fade out node containing the video player and remove from DOM.
		 * Fire video.hide event.
		 *
		 * .hide()
		 */
		hide: function() {
			var _$RL = $RL,										// $RL alias.
				_$EMAIL = this,									// $EMAIL alias.
				$ = $RL.jq,										// jQuery alias.
				$videoContainerE = $("#rl-video-container");	// Video container (overlay) node.
			
			if ($videoContainerE.length > 0) {
				// Video player displayed in an overlay.
				$videoContainerE.fadeOut("fast", function() {
					$videoContainerE.remove();
					videoE = $videoContainerE = undefined;
				});
			} else if (videoE !== undefined) {
				// Email form displayed in a user-specified DOM node.
				var $videoE = $(videoE);
				$videoE.fadeOut("fast", function() {
					$videoE.remove();
					$videoE = videoE = undefined;
				});
			}
			
			// Dispatch hide event.
			_$RL.Events.dispatch("video", "hide");
			
			return _$EMAIL;
		},
		
		/**
		 * Init.
		 * 
		 * Fire video.load event.
		 * 
		 * .init()
		 */
		init: function() {
			var _$RL = $RL,			// RL alias.
				_$VIDEO = this,		// $VIDEO alias.
				$ = _$RL.jq;		// jQuery alias.

			$(document).ready(function() {
				// Show player.
				_$VIDEO.show(_$VIDEO.config("autoplay"));

				// Dispatch load event.
				_$RL.Events.dispatch("video", "load");
			});
					
			return _$VIDEO;
		},
		
		/**
		 * Display video.
		 *
		 * If a DOM element ID XXX is specified in the config, the DOM structure is #XXX->IFRAME; otherwise,
		 * DIV#rl-video-container->DIV#rl-video->DIV#rl-video-close-button,IFRAME.
		 * Fire video.show event.
		 *
		 * .show(autoplay)
		 * autoplay - boolean - autoplay video when loaded
		 */
		show: function(autoplay) {
			var _$RL = $RL,					// RL alias.
				_$VIDEO = this,				// $VIDEO alias.
				$ = _$RL.jq,				// jQuery alias.
				cssSelector = _$VIDEO.config("cssSelector");	// Cleaned up settings.
				
			if (videoE !== undefined) {
				// Video is already displayed.
				return false;
			}
			
			if (cssSelector !== "") {
				// Look for user-specified DOM node.
				var $videoE = $(cssSelector);
				if ($videoE.length > 0) {
					// Create video in user-specified DOM node.
					videoE = $videoE
						.append(create.call(_$VIDEO))
						.get(0);
				}
			} else {
				// Create video to put in an overlay.
				videoE = $("<div>", {id: "rl-video"})
					.append(createCloseButton.call(_$VIDEO))
					.get(0);
				
				// Create overlay.
				$("<div>", {id: "rl-video-container"})
					.click(function() {
						// Click on overlay will close video player.
						_$VIDEO.hide();
					})
					.append(videoE)
					.css({display: "none"})
					.appendTo($("body"))
					.fadeIn("fast");
				
				// Parent node needs to be on the DOM first.
				videoE.appendChild(create.call(_$VIDEO, true));
			}
			
			// Dispatch show event.
			_$RL.Events.dispatch("video", "show");
		}
	};

	
	$RL.VIDEO = $VIDEO;
})(window, undefined, window.RL);
