/**
 * Email Form.
 *
 *
 * Display a generic email form in a user-specified DOM node or in an overlay window.
 *
 *
 * Example product settings in the config file (rl_config.js):
 *
 * config: {
 *   company: "ABC Company",
 *   companyEmail: "info@abc.com",
 *   cssSelector: "#my-div",
 *   height: "400",
 *   width: "400"
 * }
 *
 * company - string - (optional) company name displayed on the email form header section.
 * companyEmail - string - (optional) company email address (target email address).
 * cssSelector - string - (optional) DOM node id.  if not populated, email form will be displayed in an overlay window.
 * height - string - (optional) email form container node height in pixel.
 * width - string - (optional) email form container node width in pixel.
 */
(function(window, undefined, $RL) {
  "use strict";

  var $EMAIL = {},                  // Email widget (window.RL.EMAIL).
    siteConfig = $RL.config.config,         // Global config alias.
    emailConfig = $RL.config.products.email,    // Email config alias.
    emailE;                     // Email form node.


  /**
   * Create a form field.
   *
   * create(options)
   * options - object - key-value mapping
   *
   * options object:
   * email - string - company email address (target email address)
   */
  var create = function(options) {
    var FIELDS = [
        {
          label: {
            "id": "rl-email-label-name",
            "class": "",
            "value": "Name"
          },
          field: {
            "id": "rl-email-name",
            "class": "",
            "name": "name",
            "type": "text"
          },
          validators: ["required"]
        },
        {
          label: {
            "id": "rl-email-label-email",
            "class": "",
            "value": "E-Mail"
          },
          field: {
            "id": "rl-email-email",
            "class": "",
            "name": "email",
            "type": "text"
          },
          validators: ["required", "email"]
        },
        {
          label: {
            "id": "rl-email-label-phone",
            "class": "",
            "value": "Phone"
          },
          field: {
            "id": "rl-email-phone",
            "class": "",
            "name": "phone",
            "type": "text"
          },
          validators: []
        },
        {
          label: {
            "id": "rl-email-label-message",
            "class": "",
            "value": "Message"
          },
          field: {
            "id": "rl-email-message",
            "class": "",
            "name": "message",
            "type": "textarea"
          },
          validators: ["required"]
        }
      ],          // Default form fields.
      _$EMAIL = this,   // $EMAIL alias.
      $ = $RL.jq,     // jQuery alias.
      $formE = $("<form>", {id: "rl-email-form", method: "POST"});  // Form element node.

    for (var i = -1, iLength = FIELDS.length; ++i < iLength;) {
      var f = FIELDS[i],
        label = f.label,
        field = f.field,
        validators = f.validators,
        $labelE,    // Label node.
        $fieldE;    // Field node.

      // Create field node.
      switch(field.type) {
        case "text":
          $fieldE = $("<input>", {type: "text"});
          break;

        case "textarea":
          $fieldE = $("<textarea>");
          break;

        default:
          continue;
      }

      // Create label node.
      $labelE = $("<label>", {id: label.id, "for": field.id}).addClass("rl-email-label").html(label.value).appendTo($formE);

      if (validators.indexOf("required") > -1) {
        // Display required text.
        $labelE.append($("<span>").addClass("rl-email-required").html("required"));
      }

      // Bind validators.
      for (var j = -1, jLength = validators.length; ++j < jLength;) {
        validate.call(_$EMAIL, $fieldE.get(0), validators[j]);
      }

      $labelE.append($fieldE.attr({id: field.id, name: field.name}).addClass("rl-email-field"));
    }

    // Attach buttons to DOM.
    $formE
      .append($("<input>", {type: "submit", name: "submit", value: "Send Message"}).addClass("rl-button"))
      .append(
        $("<input>", {type: "button", name: "cancel", value: "Cancel"}).addClass("rl-button").click(function() {
          _$EMAIL.hide();
        })
      )
      .submit(function() {
        var $formE = $(this),
          $fieldsE = $formE.find(".rl-email-field"),
          validated = 1;

        // Verify all fields are validated.
        for (var i = -1, length = $fieldsE.length; ++i < length;) {
          var $fieldE = $($fieldsE.get(i));

          // Trigger validation.
          $fieldE.blur();

          // Set form validation flag.
          if ($fieldE.data("validated") === 0) {
            validated = 0;
          }
        }

        if (validated === 1) {
          // Form has been validated.

          // Track CVT.
          trackCvt.call(_$EMAIL, {cvtType: 3, email: options.email});

          // Track email form data.
          trackEmail.call(_$EMAIL, {email: options.email});

          // Display confirmation.
          $(emailE)
            .empty()
            .append($("<span>").addClass("rl-email-confirmation").html("Your message has been sent."));

          _$EMAIL.hide(1000);
        }

        return false;
      });

    return $formE.get(0);
  };

  /**
   * Track CVTs.
   *
   * trackCvt(data)
   * data - object - key-value mapping
   *
   * data object:
   * cvtId - string - (optional) cvt id
   * cvtType - string/number - cvt type (e.g. 2, 3)
   * email - string - company email address (target email address)
   */
  var trackCvt = function(data) {
    var _$RL = $RL,     // $RL alias.
      $ = $RL.jq,     // jQuery alias.
      visitorId = sessionStorage.getItem("visitor_id"), // Visitor id.
      visitId = sessionStorage.getItem("visit_id"),   // Visit id.
      payload,
      eventId;

    if (siteConfig.campaign.isPaidCampaign === false) {
      // Only track CVT if paid campaign.
      return;
    }

    payload = {
      cvtId: data.cvtId || "",
      cvtType: data.cvtType,
      customer_name: $("#rl-email-name").val(),
      customer_email: $("#rl-email-email").val(),
      customer_phone: $("#rl-email-phone").val(),
      target_email: data.email
    };

    if (visitId !== null && visitorId !== null) {
      payload.visit_id = visitId;
      payload.visitor_id = visitorId;

      // Track CVT since visit and visitor ids are available.
      _$RL.CaptureWS.trackCvt(payload);
      return;
    }

    // Wait for visit and visitor ids to be available.
    eventId = _$RL.Events.subscribe("capture", "visit", function(data) {
      _$RL.Events.unsubscribe("capture", "visit", eventId);

      payload.visit_id = data.visitId;
      payload.visitor_id = data.visitorId;

      // Track CVT since visit and visitor ids are available.
      _$RL.CaptureWS.trackCvt(payload);
    });
  };

  /**
   * Track Email post.
   *
   * trackEmail(data)
   * data - object - key-value mapping
   *
   * data object:
   * email - string - company email address (target email address)
   */
  var trackEmail = function(data) {
    var _$RL = $RL,     // $RL alias.
      $ = $RL.jq,     // jQuery alias.
      visitorId = sessionStorage.getItem("visitor_id"), // Visitor id.
      visitId = sessionStorage.getItem("visit_id"),   // Visit id.
      payload,
      eventId;

    payload = {
      target_email: data.email,
      data: JSON.stringify({
        customer_name: $("#rl-email-name").val(),
        customer_email: $("#rl-email-email").val(),
        customer_phone: $("#rl-email-phone").val(),
        message: $("#rl-email-message").val()
      })
    };

    if (visitId !== null && visitorId !== null) {
      payload.visit_id = visitId;
      payload.visitor_id = visitorId;

      // Track CVT since visit and visitor ids are available.
      _$RL.CaptureWS.trackEmail(payload);
      return;
    }

    // Wait for visit and visitor ids to be available.
    eventId = _$RL.Events.subscribe("capture", "visit", function(data) {
      _$RL.Events.unsubscribe("capture", "visit", eventId);

      payload.visit_id = data.visitId;
      payload.visitor_Id = data.visitorId;

      // Track CVT since visit and visitor ids are available.
      _$RL.CaptureWS.trackEmail(payload);
    });
  };

  /**
   * Attach validator check to a field node.
   *
   * validate(fieldE, type)
   * fieldE - object - form field node
   * type - string - type of validator (e.g. required, email)
   */
  var validate = (function() {
    var regex = {
      // Regex taken from http://www.zparacha.com/validate-email-address-using-javascript-regular-expression/#.UJl4QsXA98E.
      email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
    };  // Collection of validation regex.

    // Helper function to set error message.
    var set = function(type, message) {
      var $ = $RL.jq,     // jQuery alias.
        $fieldE = this,   // Field node.
        $validationTextE = $fieldE.siblings(".rl-email-required");    // Error message node.

      if (typeof message === "string" && message !== "") {
        if ($validationTextE.length === 0) {
          // Create new validation text.
          $validationTextE = $("<span>").addClass("rl-email-required").html(message).before($fieldE);
        } else {
          // Save existing validation text.
          $validationTextE.data("validation_text", $validationTextE.html());

          // Edit message.
          $validationTextE.html(message);
        }
      }
    };

    // Helper function remove error message.
    var clear = function(type) {
      var $fieldE = this,   // Field node.
        $validationTextE = $fieldE.siblings(".rl-email-required"),    // Error message span node.
        existingValidationText;

      if ($validationTextE.length > 0) {
        existingValidationText = $validationTextE.data("validation_text");

        if (typeof existingValidationText === "string" && existingValidationText != "") {
          // Display original message.
          $validationTextE.html(existingValidationText);
        }
      }
    };

    // Helper function
    var mark = function() {
      var $fieldE = this,
        validators = $fieldE.data("validators") || {},
        validated = 1;

      for (var i in validators) {
        validated &= validators[i];
      }

      if (validated === 0) {
        $fieldE.parent().addClass("error");
      } else {
        $fieldE.parent().removeClass("error");
      }

      $fieldE.data("validated", validated);
    };

    return function(fieldE, type) {
      var $ = $RL.jq,   // jQuery alias.
        $fieldE = $(fieldE),
        validators;

      // Sanity check.
      if (typeof fieldE !== "object" || fieldE.nodeType !== 1) {
        // Not a valid DOM object.
        return false;
      }

      switch (type) {
        case "required":
          $fieldE.bind("blur", {validator: type}, function($e) {
            var $fieldE = $(this),
              validators = $fieldE.data("validators") || {},
              type = $e.data.validator;

            if ($fieldE.val().trim() === "") {
              // Empty string.
              validators[type] = 0;
              set.call($fieldE, type);
            } else {
              validators[type] = 1;
              clear.call($fieldE, type);
            }

            $fieldE.data("validators", validators);

            mark.call($fieldE);
          });
          return;

        case "email":
          $fieldE.bind("blur", {validator: type}, function($e) {
            var $fieldE = $(this),
              value = $fieldE.val(),
              validators = $fieldE.data("validators") || {},
              type = $e.data.validator;

            if (value.trim() === "") {
              // No validation on empty strings.
              validators[type] = 1;
              clear.call($fieldE, type);
            } else if (regex.email.test(value)) {
              // Valid email address.
              validators[type] = 1;
              clear.call($fieldE, type);
            } else {
              // Invalid email address.
              validators[type] = 0;
              set.call($fieldE, type, "Invalid");
            }

            $fieldE.data("validators", validators);

            mark.call($fieldE);
          });
          return;

        default:
          return;
      }
    };
  })();


  $EMAIL = {
    /**
     * Get product settings.
     *
     * Clean and verify data.  If data is not valid, it is set to empty string.
     * cssSelector node is verified to exist or else set to empty string.
     *
     * .config()
     */
    config: function() {
      var $ = $RL.jq,           // jQuery alias.
          config = emailConfig; // Email config alias.

      return {
        cssSelector: (function(cssSelector) {
          if (typeof cssSelector === "string" && cssSelector !== "") {
            if (cssSelector.charAt(0) !== "#") {
              // Only node ids are accepted.
              cssSelector = "#" + cssSelector;
            }

            if ($(cssSelector).length > 0) {
              // User-specified node exist.
              return cssSelector;
            }
          }

          return "";
        })(config.cssSelector),
        width: $.isNumeric(config.width) ? String(config.width) : "",
        height: $.isNumeric(config.height) ? String(config.height) : "",
        company: typeof config.company === "string" ? config.company : "",
        companyEmail: typeof config.companyEmail === "string" ? config.companyEmail : ""
      };
    },

    /**
     * Hide and remove email form.
     *
     * Fade out node containing the email form and remove from DOM.
     * Fire email.hide event.
     *
     * .hide(delay)
     * delay - string/number - (optional) delay in milliseconds
     */
    hide: function(delay) {
      var _$RL = $RL,                   // $RL alias.
          _$EMAIL = this,                 // $EMAIL alias.
          $ = $RL.jq,                   // jQuery alias.
          $emailContainerE = $("#rl-email-container");  // Email form container (overlay) node.

      // Sanity check.
      if (!$.isNumeric(delay)) {
        delay = "fast";
      }

      if ($emailContainerE.length > 0) {
        // Email form displayed in an overlay.
        $emailContainerE.fadeOut(delay, function() {
          $emailContainerE.remove();
          emailE = $emailContainerE = undefined;
        });
      } else if (emailE !== undefined) {
        // Email form displayed in a user-specified DOM node.
        var $emailE = $(emailE);
        $emailE.fadeOut(delay, function() {
          $emailE.remove();
          $emailE = emailE = undefined;
        });
      }

      // Dispatch hide event.
      _$RL.Events.dispatch("email", "hide");

      return _$EMAIL;
    },

    /**
     * Init.
     *
     * Fire email.load event.
     *
     * .init()
     */
    init: function() {
      var _$RL = $RL,       // RL alias.
          _$EMAIL = this,   // $EMAIL alias.
          $ = $RL.jq;       // jQuery alias.

      _$RL.lib.isOptedOut(function(cookie) {
        // Check for opt-out.
        if (cookie !== false) {
          return;
        }

        $(document).ready(function() {
          // Replace existing email links.
          _$EMAIL.replace();

          // Dispatch load event.
          _$RL.Events.dispatch("email", "load");
        });
      });

      return _$EMAIL;
    },

    /**
     * Replace email links.
     *
     * Fire email.replace event.
     *
     * .replace(nodeE)
     * nodeE - object - (optional) parent node to search and replace
     */
    replace: function(nodeE) {
      var _$RL = $RL,       // $RL alias.
          _$EMAIL = this,   // $EMAIL alias.
          $ = $RL.jq,       // jQuery alias.
          $linksE = (typeof nodeE === "object" && nodeE.nodeType === 1) ? $(nodeE).find("a") : $("a");  // List of anchor nodes.

      if (siteConfig.hipaa === 1) {
        // Do not replace email links if HIPAA.
        return false;
      }

      $linksE.each(function() {
        var nodeE,
            emailAddress;

        if (this.protocol === "mailto:" && !$(this).hasClass("rl-no-form")) {
          nodeE = this;
          emailAddress = this.href.replace("mailto:", "");

          _$RL.replaceLink({
            nodeE: nodeE,
            uri: "javascript:void(0);",
            handler: function(e) {
              _$EMAIL.show({email: emailAddress});
            }
          });
        }
      });

      // Dispatch replace event.
      _$RL.Events.dispatch("email", "replace");

      return _$EMAIL;
    },

    /**
     * Show email form.
     *
     * Create and overlay if a DOM node is not specified.
     * Fire email.show event.
     *
     * .show(options)
     * options - object - key-value mapping
     *
     * options object:
     * company - string - (optional) company name displayed on the email form header section
     * email - string - company email address (target email address)
     */
    show: function(options) {
      var _$RL = $RL,           // $RL alias.
        _$EMAIL = this,         // $EMAIL alias.
        $ = $RL.jq,           // jQuery alias.
        eConfig = _$EMAIL.config(),   // Cleaned up settings.
        companyName = eConfig.company !== "" ? eConfig.company : (typeof options.company === "string" ? options.company : ""),      // Company name.
        companyEmail = eConfig.companyEmail !== "" ? eConfig.companyEmail : (typeof options.email === "string" ? options.email : ""); // Company email.

      // Sanity check.
      if (typeof options.email !== "string" || options.email === "") {
        // Email address is required;
        return _$EMAIL;
      }

      if (emailE !== undefined) {
        // Email form is already displayed.
        return _$EMAIL;
      }

      if (eConfig.cssSelector !== "") {
        // Look for user-specified DOM node.
        var $emailE = $(eConfig.cssSelector);
        if ($emailE.length > 0) {
          // Create email form in user-specified DOM node.
          emailE = $emailE
            .append($("<div>").addClass("rl-email-company-name").html(companyName))
            .append(create.call(_$EMAIL, options))
            .get(0);
        }
      } else {
        // Create email form to put in an overlay.
        emailE = $("<div>", {id: "rl-email"})
          .append($("<div>").addClass("rl-email-company-name").html(companyName))
          .append(create.call(_$EMAIL, {email: companyEmail}))
          .get(0);

        // Create overlay.
        $("<div>", {id: "rl-email-container"})
          .append(emailE)
          .append($("<div>").addClass("rl-email-overlay-win"))
          .css({display: "none"})
          .appendTo($("body"))
          .fadeIn("fast");
      }

      // Apply width and height to email form node.
      if (eConfig.width !== "") {
        emailE.style.width = [eConfig.width, "px"].join("");
      }
      if (eConfig.height !== "") {
        emailE.style.height = [eConfig.height, "px"].join("");
      }

      // Center email form node.
      emailE.style.marginTop = ["-", (emailE.offsetHeight / 2), "px"].join("");
      emailE.style.marginLeft = ["-", (emailE.offsetWidth / 2), "px"].join("");

      // Track CVT.
      trackCvt.call(_$EMAIL, {cvtType: 2, email: companyEmail});

      // Dispatch show event.
      _$RL.Events.dispatch("email", "show");

      return _$EMAIL;
    }
  };


  $RL.EMAIL = $EMAIL;
})(window, undefined, window.RL);
