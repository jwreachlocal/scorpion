window.rl_widget_cfg = {
  "id": "f51e0b33-c1ea-456d-a795-d94c4a598284",
  "globalMasterAdvertiserId": "USA_8967",
  "config": {
    "domains": {
      "cdn": "js.rlmms-sb.com",
      "mms": "rtsys.rlmms.com",
      "capture": "lvh.me:9887",
      "internal": [
        "localhost.rtrk.com",
        "capture.bobs.com"
      ]
    },
    "platform": "USA",
    "debug": 0,
    "hipaa": 0,
    "optOut": null
  },
  "products": [
    {
      "name": "capture",
      "enabled": true,
      "autoload": true,
      "jsFile": "/capture/rl_capture.source.js",
      "jsCode": "",
      "cssFile": "",
      "config": {
      }
    },
    {
      "name": "video",
      "enabled": false,
      "autoload": true,
      "jsFile": "/video/rl_video.source.js",
      "jsCode": "",
      "cssFile": "/video/rl_video.css",
      "config": {
        "cssSelector": "",
        "closeButtonText": "",
        "closeButtonImage": "",
        "closeButtonWidth": "",
        "closeButtonHeight": "",
        "autoplay": "0",
        "video": "<object id=\"player_swf\" classid=\"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000\" width=\"400\" height=\"332\" codebase=\"http://fpdownload.macromedia.com/get/flashplayer/current/swflash.cab\"><param name=\"movie\" value=\"http://cdn-akm.vmixcore.com/core-flash/UnifiedVideoPlayer/UnifiedVideoPlayer.swf?player_id=80b916b86efd0417de7e77c4c21f069b\"></param><param name=\"allowScriptAccess\" value=\"always\"></param><param name=\"allowFullScreen\" value=\"true\"></param><param name=\"wmode\" value=\"transparent\"></param><param name=\"flashVars\" value=\"player_id=80b916b86efd0417de7e77c4c21f069b&services_url=http://cdn-akm.vmixcore.com/core-flash/UnifiedVideoPlayer/services.xml&env=&token=V0Uo0cQHKBkX5aiwxLovkxeeJiBegwHRRD\"></param> <embed name=\"player_swf\" src=\"http://cdn-akm.vmixcore.com/core-flash/UnifiedVideoPlayer/UnifiedVideoPlayer.swf?player_id=80b916b86efd0417de7e77c4c21f069b\" width=\"400\" height=\"332\" allowScriptAccess=\"always\" allowFullScreen=\"true\" wmode=\"transparent\" type=\"application/x-shockwave-flash\" flashvars=\"player_id=80b916b86efd0417de7e77c4c21f069b&services_url=http://cdn-akm.vmixcore.com/core-flash/UnifiedVideoPlayer/services.xml&env=&token=V0Uo0cQHKBkX5aiwxLovkxeeJiBegwHRRD\" swliveconnect=\"true\" pluginspage=\"http://www.adobe.com/go/getflashplayer\"></embed></object>"
      }
    },
    {
      "name": "chat",
      "enabled": false,
      "autoload": true,
      "jsFile": "/chat/rl_chat.source.js",
      "jsCode": "",
//      "cssFile": "//rtsys.rlmms.com/widget/css/rl_chat.css",
      "config": {
        "id": "USA2621094"
      }
    },
    {
      "name": "remarketing",
      "enabled": true,
      "autoload": true,
      "jsFile": "/remarketing/rl_remarketing.source.js",
      "jsCode": "",
      "cssFile": "",
      "config": {
        "1225894": {
          "2842353": {
            "tags": "<img id=\"remarketing_2842353_pixel\" class=\"remarketing_pixel\" src=\"\" width=\"1\" height=\"1\" />",
            "scripts": "var div = document.createElement('div'); div.id = 'remarketing_status'; div.innerHTML = 'REMARKETING LOADED FOR 2842353'; document.body.appendChild(div);"
          },
          "default": {
            "tags": "<img id=\"remarketing_default_pixel\" class=\"remarketing_pixel\" src=\"\" width=\"1\" height=\"1\" />",
            "scripts": "var div = document.createElement('div'); div.id = 'remarketing_status'; div.innerHTML = 'REMARKETING LOADED FOR default'; document.body.appendChild(div);"
          }
        },
        "1226468": {
          "default": {
            "tags": "<img id=\"remarketing_default_pixel\" class=\"remarketing_pixel\" src=\"\" width=\"1\" height=\"1\" />",
            "scripts": "var div = document.createElement('div'); div.id = 'remarketing_status'; div.innerHTML = 'REMARKETING LOADED FOR default'; document.body.appendChild(div);"
          }
        }
      }
    },
    {
      "name": "email",
      "enabled": true,
      "autoload": true,
      "jsFile": "/email/rl_email.source.js",
      "jsCode": "",
      "cssFile": "/email/rl_email.css",
      "config": {
        /*"company": "ABC Company",
            "companyEmail": "abc@company.com",
        "cssSelector": "",
        "height": "400",
        "width": "400"*/
      }
    },
    {
      "name": "toolbar",
      "enabled": false,
      "autoload": true,
      "jsFile": "",
      "jsCode": "",
      "cssFile": "//rtsys.rlmms.com/widget/css/rl_widget.css",
      "config": {
        "docking": "h-bottom",
        "backgroundColor": "#00FF00",
        "backgroundImage": "",
        "fontColor": "#000000",
        "buttonColor": "",
        "buttonFontColor": "#000000"
      }
    }
  ],
  "replacements": {
    "USA_2821244": {
      "strings": [
        {
          "original": "foo",
          "replace": "bar"
        }
      ],
      "phone": [
        {
          "original": "8888888888",
          "replace": "9999999999"
        }
      ],
      "email": [
/*        {
          "original": "foo@bar.com",
          "replace": "bar@foo.com"
        }*/
      ]
    },
    "DIRECT": {
      "strings": [
        {
          "original": "foo",
          "replace": "cake"
        },
        {
          "original": "Thank you for shopping",
          "replace": "Wopper<img src=\"//search.reachlocal.net/event/?event=8&options=fname%3Dhttp%253A//dev.djalexr.com/RL_cvt_shopping%26idpagecvt%3D9457071&dom=appleanniestearooman2.reachlocal.net\" width=\"1\" height=\"1\">"
        },
        {
          "original": "http://www.reachlocal.com/sites/all/themes/custom/reachlocal/logo.png",
          "replace": "http://www.reachlocal.com/sites/default/files/service-callout/images/icon-reach-cast.png"
        },
        {
          "original": "src=\"http://www.reachlocal.com/sites/all/themes/custom/reachlocal/logo1.png\"",
          "replace": "src=\"http://www.reachlocal.com/sites/default/files/service-callout/images/icon-reach-cast1.png\""
        },
        {
          "original": "url('http://www.reachlocal.com/sites/all/themes/custom/reachlocal/logo2.png')",
          "replace": "url('http://www.reachlocal.com/sites/default/files/service-callout/images/icon-reach-cast2.png')"
        },
        {
          "original": "<img src=\"http://www.reachlocal.com/sites/all/themes/custom/reachlocal/logo3.png\" />",
          "replace": "<img src=\"http://www.reachlocal.com/sites/default/files/service-callout/images/icon-reach-cast3.png\" />"
        },
        {
          "original": "src=\"Includes/Templates/Active/images/printBanner.jpg\"",
          "replace": "src=\"//rtsys.rtrk.com/campaign_images/d1256/1256454/titan_desert.jpg\""
        },
        {
          "original": "url('images/contactText.png')",
          "replace": "url('http://rtsys.rtrk.com/campaign_images/d1256/1256454/titan_desert.jpg')"
        },
        {
          "original": "Medical Artistry. All rights reserved.",
          "replace": "Medical Artistry. All rights reserved. | <a href=\"http://rtsys.reachlocal.net/w3c/proxy_privacy_policy.html?path=/coupon/d918/918140\" TARGET=\"_blank\">Notice of Marketing Policy</A>"
        },
        {
          "original": "<a target=\"_blank\" href=\"links.html\"",
          "replace": "<a href=\"links.html\""
        },
        {"original":"document.location.protocol) ? \"https://ssl.\" : \"http://www.\");","replace":"document.location.protocol) ? \"//ssl.\" : \"//www.\");"},
        {"original":"x26q\\x3dhttp://chicagochapter7attor1.reachlocal.net","replace":"x26q\\x3dhttp://www.chicagochapter7attorney.com"},
        {"original":"youtube.com/user/CutlerSchaumburg\" rel=\"nofollow\" target=\"RL_top\">","replace":"youtube.com/user/CutlerSchaumburg\" rel=\"nofollow\" target=\"_blank\">"},
        {"original":"continue=http://google8549.reachlocal.net","replace":"continue=http://maps.google.com"},
        {"original":"https://chicagochapter7attorney.com","replace":"https://chicagochapter7attor1.reachlocal.net"},
        {"original":"plus.google.com","replace":"google26227.reachlocal.net"},
        {"original":"www.847debt.com","replace":"847debt.reachlocal.net"},
        {"original":"twitter.com/CutlerIL\" rel=\"nofollow\" target=\"RL_top\"","replace":"twitter.com/CutlerIL\" rel=\"nofollow\" target=\"_blank\""},
        {"original":"q=http://chicagochapter7attor1.reachlocal.net","replace":"q=http://www.chicagochapter7attorney.com"},
        {"original":"http://chicagochapter7attorney.com","replace":"http://chicagochapter7attor1.reachlocal.net"},
        {"original":"facebook.com","replace":"RL_NODYN"},{"original":"www.youtube-nocookie.com","replace":"RL_NODYN"},
        {"original":"www.chicagochapter7attorney.net","replace":"chicagochapter7attorney.reachlocal.net"},
        {"original":"twitter.com","replace":"RL_NODYN"},
        {"original":"src=\"http://www.chicagochapter7attorney.com/wp-content/themes/cutler/images/sidebar-phone.png\"","replace":"src=\"//rtsys.reachlocal.net/campaign_images/d363/363544/sidebar-phone_8476034952.png\""},
        {"original":"youtube.com","replace":"RL_NODYN"},
        {"original":"maps.gstatic.com","replace":"RL_NODYN"},
        {"original":"bbb.org","replace":"RL_NODYN"},
        {"original":"http://google.com","replace":"http://google8549.reachlocal.net"},
        {"original":"local_url?dq\\u003d\\u0026q\\u003dhttp://chicagochapter7attor1.reachlocal.net","replace":"local_url?dq\\u003d\\u0026q\\u003dhttp://www.chicagochapter7attorney.com"},
        {"original":"apexchat.com","replace":"RL_NODYN"},
        {"original":"https://847debt.com","replace":"https://847debt.reachlocal.net"},
        {"original":"www.chicagochapter7attorney.com","replace":"RL_NODYN"},
        {"original":"c+\"cb/googlepano","replace":"\"http://maps.gstatic.com/intl/en_us/mapfiles/cb/googlepano"},
        {"original":"facebook.net","replace":"RL_NODYN"},
        {"original":"href=\"http://www.bbb.org/","replace":"target=\"_blank\" href=\"http://www.bbb.org/"},
        {"original":"top.location","replace":"//top.location"},
        {"original":"src=\"http://chicagochapter7.web312.netdna-cdn.com/wp-content/themes/cutler/images/header-phone.jpg\"","replace":"src=\"//rtsys.reachlocal.net/campaign_images/d363/363544/header-phone_8476034952.jpg\""},
        {"original":"bankruptcylawyersinchicagosuburbs.com","replace":"RL_NODYN"},
        {"original":"actual_url:'http://chicagochapter7attor1.reachlocal.net","replace":"actual_url:'http://www.chicagochapter7attorney.com"},
        {"original":"href=\"http://chicagochapter7attor1.reachlocal.net/feed\"","replace":"target=\"_blank\" href=\"http://chicagochapter7attor1.reachlocal.net/feed\""},
        {"original":"maps.google.com","replace":"google8549.reachlocal.net"},
        {"original":"src=\"http://www.chicagochapter7attorney.com/wp-content/themes/cutler/images/header-phone.jpg\"","replace":"src=\"//rtsys.reachlocal.net/campaign_images/d363/363544/header-phone_8476034952.jpg\""},
        {"original":"local_url?dq\\u0026q\\u003dhttp://chicagochapter7attor1.reachlocal.net","replace":"local_url?dq\\u0026q\\u003dhttp://www.chicagochapter7attorney.com"},
        {"original":"cutler-and-associates-ltd-in-skokie-il-88372872\" target=\"RL_top\"><","replace":"cutler-and-associates-ltd-in-skokie-il-88372872\" target=\"_blank\"><"},
        {"original":"src=\"http://chicagochapter7.web312.netdna-cdn.com/wp-content/themes/cutler/images/sidebar-phone.png\"","replace":"src=\"//rtsys.reachlocal.net/campaign_images/d363/363544/sidebar-phone_8476034952.png\""},
        {"original":"widget.rlcdn.net","replace":"RL_NODYN"},
        {"original":"https://chicagochapter7attorney.net","replace":"https://chicagochapter7attorney.reachlocal.net"},
        {"original":"bankruptcylawyersinchicagosuburbs.com/\" rel=\"nofollow\" target=\"RL_top\"><","replace":"bankruptcylawyersinchicagosuburbs.com/\" rel=\"nofollow\" target=\"_blank\"><"},
        {"original":"146451815412703\" rel=\"nofollow\" target=\"RL_top\"","replace":"146451815412703\" rel=\"nofollow\" target=\"_blank\""},
        {"original":"gg","replace":"RL_NODYN"},
        {"original":"local_url?q=http://chicagochapter7attor1.reachlocal.net","replace":"local_url?q=http://www.chicagochapter7attorney.com"},
        {"original":"TARGET=\"RL_top\" alt=\"Google Reviews\" title=\"Google Reviews\" /> </map></div></","replace":"TARGET=\"_blank\" alt=\"Google Reviews\" title=\"Google Reviews\" /> </map></div></"},
        {"original":"http://chicagochapter7attorney.net","replace":"http://chicagochapter7attorney.reachlocal.net"},
        {"original":"chicagochapter7attor1.reachlocal.net/</a></div></div><","replace":"www.chicagochapter7attorney.com/</a></div></div><"},
        {"original":"https://google.com","replace":"https://google8549.reachlocal.net"},
        {"original":"http://847debt.com","replace":"http://847debt.reachlocal.net"}
      ],
      "phone": [
        {
          "original": "8888888888",
          "replace": "7777777777"
        }
      ],
      "email": [
        {
          "original": "foo@bar.com",
          "replace": "cake@pops.com"
        }
      ]
    }
  },
  "cvts": {
    "http://www.bob.com": {
      "/foo": [
        {"campaign_id": "USA_223", "cvtid": 556, "value": "high"}
      ],
      "/": [
        {"campaign_id": "USA_223", "cvtid": 556, "value": "high"}
      ]
    },
    "http://capture.bobs.com:9293": {
      "/test_cvt?foo=bar": [
        {"campaign_id": "USA_1225893", "cvtid": 458, "value": "high"}
      ],
      "/test_cvt_high": [
        {"campaign_id": "USA_1225893", "cvtid": 458, "value": "high"}
      ],
      "/test_cvt_low": [
        {"campaign_id": "USA_1225890", "cvtid": 458, "value": "low"}
      ],
      "/contact_me": [
        {"campaign_id": "USA_1225891", "cvtid": 458, "value": "low"}
      ],
      "/test_form_post": [
        {"campaign_id": "USA_1225892", "cvtid": 458, "value": "low"}
      ],
      "/test_campaign/index.html": [
        {"campaign_id": "USA_1225890", "cvtid": 458, "value": "low"}
      ],
      "/test_campaign/form_target.html": [
        {"campaign_id": "USA_1225890", "cvtid": 458, "value": "low"}
      ]
    },
    "http://localhost.jasmine.com": {
      "/": [
        {"campaign_id": "USA_546", "cvtid": 53432, "value": "low"}
      ]
    },
    "http://localhost.rtrk.com": {
      "/index.html": [
        {"campaign_id": "USA_1207858", "cvtid": 11432, "value": "low"}
      ],
      "/index2.php": [
        {"campaign_id": "USA_1207858", "cvtid": 11432, "value": "high"}
      ],
      "/index2.html": [
        {"campaign_id": "USA_1207858", "cvtid": 11432, "value": "high"}
      ],/*
      "/index3.html": [
        {"campaign_id": "USA_1207858", "cvtid": 11432, "value": "low"}
      ]*/
      "/index4.html": [
        {"campaign_id": "USA_1207858", "cvtid": 11432, "value": "high"}
      ]
    },
    "http://localhost.rlmms.com": {
      "/test/": [
        {"campaign_id": "USA_1207858", "cvtid": 11432, "value": "high"}
      ],
      "/index4.html": [
        {"campaign_id": "USA_1207858", "cvtid": 11432, "value": "high"}
      ]
    }
  },
  "campaign_data": {
    "USA_1207858": {
      "referrer_type": "PAID",
      "master_campaign_id": "1225894",
      "campaign_name": "Apple Annies Restaurant 20130102"
    },
    "DIRECT": {
      "referrer_type": "ORGANIC",
      "master_campaign_id": "1226468",
      "campaign_name": "Apple Annies Restaurant 20130121"
    }
  },
  "proxyUrls": {
    "starwoodhotels39.reachlocal.net": "www.joe-plumber.com"
  }
};
