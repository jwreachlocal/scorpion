/**
 * Total Live Chat.
 * 
 * 
 * Display a chat application (provided by APEX CHAT).
 * 
 * 
 * Example product settings in the config file (rl_config.js):
 * 
 * config: {
 *   id: "USA2621094"
 * }
 * 
 * id - string - unique product id.
 */
(function(window, undefined, $RL) {
	"use strict";
	
	var $CHAT = {},									// Chat widget (window.RL.CHAT).
		chatConfig = $RL.config.products.chat;		// Chat config alias.

		
	$CHAT = {
		/**
		 * Init.
		 * 
		 * Fire chat.load event.
		 * 
		 * .init()
		 */
		init: function() {
			var _$RL = $RL;		// RL alias.

			// Sanity check.
			if (typeof chatConfig.id !== "string" || chatConfig.id === "") {
				// Chat id is required.
				return this;
			}
			
			// Load Apex Chat library.
			_$RL.loadJs("//www.apexchat.com/scripts/dyns.js", function() {
				window.LoadRunRemoveScriptOnce(chatConfig.id);
				
				// Dispatch load event.
				_$RL.Events.dispatch("chat", "load");
			});

			return this;
		}
	};

	
	$RL.CHAT = $CHAT;
})(window, undefined, window.RL);
