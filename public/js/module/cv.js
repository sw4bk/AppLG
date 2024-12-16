var cv = {
  url: CONFIG.app.drmURL,
  apiToken: CONFIG.app.drmToken, //DyqjydAnQjYMJuOgcEWm //gQposTlrMIOYQVdYBNYC
  sessionId: null,
  userName: null,
  password: null,
  loginParamOS: 'HTML5',
  appVersion: '1',
  branding: 'Panaccess',
  lang: CONFIG.locale,
  unsuccessfulLoginsTreshold: 5,
  unsuccessfulLoginsDelay: 5000,
  failCallback: function () {
    window.location = 'login.html';
  },
  initialized: false,
  init: function (successCallback, redirectIfNotLoggedIn) {
    this.initialized = true;
    var _self = this;

    this.sessionId = Storage.get('cvSessionId');

    if (typeof redirectIfNotLoggedIn != 'undefined') {
      if (typeof redirectIfNotLoggedIn == 'function') {
        _self.failCallback = redirectIfNotLoggedIn;
      } else if (!redirectIfNotLoggedIn) {
        _self.failCallback = function () {
          this.updateLayout(false);
        }
      }
    }
    if (typeof successCallback != 'undefined') {
      _self.successCallback = successCallback;
    } else {
      _self.successCallback = function () {
        this.updateLayout(true);
      };
    }

    successCallback();
  },

  updateLayout: function (loggedIn) {
    cv.translateLayout();
    if (loggedIn) {
      // Modify UI (logged)
    } else {
      // Modify UI (not logged)
    }
  },

  getResponsibleServers: function (mode, data1, successCallback, errorCallback) {
    var _self = this;
    this.get_from_url('https://cv01.panaccess.com/', { f: 'getResponsibleServers', mode: mode, data1: data1 }, 'getResponsibleServersCallback', function (result) {
      if (result.answer && result.answer != "false" && result.answer.length) {
        if (result.answer && result.answer.length > 0) {
          successCallback(result.answer[0]);
        } else {
          errorCallback();
        }
      } else {
        errorCallback();
      }
    }, function (result) {
      errorCallback(result);
    });
  },

  login: function (username, password, successCallback, errorCallback) {
    var _self = this;
    console.log("main,login: " + username + ", " + password);
    this.get_result({ f: 'login', username: username, password: password }, 'loginCallback', function (result) {
      if (result.answer && result.answer != "false" && result.answer.length) {
        _self.sessionId = result.answer;
        Storage.set('cvSessionId', _self.sessionId);
        successCallback();
      } else {
        _self.sessionId = null;
        localStorage.removeItem('cvSessionId');
        errorCallback();
      }
    }, function (result) {
      if (typeof errorCallback == 'function') {
        errorCallback(result);
      } else {
        _self.showError(result.errorMessage);
      }
    });
  },

  clientLogin: function (username, password, automatic, successCallback, errorCallback) {
    var _self = this;
    var hash = automatic ? password : cv.hashMD5(password + "_panaccess");
    var udid = getUdid();

    this.get_result_post({ f: 'clientLogin', clientId: username, pwd: hash, udid: udid, os: this.loginParamOS, appVersion: this.appVersion, branding: this.branding }, 'clientLoginCallback', function (result) {
      if (result.answer && result.answer != "false" && result.answer.length && result.success) {
        User.setLoggedIn(username, hash, result.answer);
        successCallback();
      } else {
        errorCallback("Nombre de usuario o contraseña incorrecto");
      }
    }, function (result) {
      console.log(result);
      if (typeof errorCallback == 'function') {
        errorCallback(result.errorMessage);
      } else {
        _self.showError(result.errorMessage);
      }
    });
  },

  logout: function (callback) {
    localStorage.removeItem('cvSessionId');
    callback();
  },

  getClientConfig: function (successCallback, errorCallback) {
    var udid = getUdid();
    var sessionId = User.getSessionId();

    this.get_result_post({ f: 'getClientConfig', sessionId: sessionId, udid: udid, os: this.loginParamOS, appVersion: this.appVersion, branding: this.branding }, '', function (result) {
      User.setConfig(JSON.stringify(result.answer));
      Storage.set('cvClientConfig', JSON.stringify(result.answer));
      console.log(result.answer);
      successCallback();
    }, function (result) {
      console.log("ERROR getClientConfig");
      console.log(result);
      errorCallback();
    });
  },

  getStreamingLicenses: function (successCallback, errorCallback) {
    var udid = getUdid();
    var sessionId = User.getSessionId();

    var parameters = {
      f: 'getStreamingLicenses',
      sessionId: sessionId,
      udid: udid,
      os: this.loginParamOS,
      appVersion: this.appVersion,
      branding: this.branding,
      withPins: CONFIG.automaticActivation
    };

    this.get_result_post(parameters, '', function (result) {
      console.log("SUCCESS getStreamingLicenses");
      User.setLicenses(JSON.stringify(result.answer));
      successCallback(result.answer);
    }, function (result) {
      console.log("ERROR getStreamingLicenses");
      console.log(result);
      errorCallback(result);
    });
  },

  activateStreamingLicense: function (license, pin, failIfInUse, successCallback, errorCallback) {
    var parameters = {
      f: 'setStreamingLicense',
      licenseKey: license,
      pin: pin,
      sessionId: User.getSessionId(),
      udid: getUdid(),
      os: this.loginParamOS,
      appVersion: this.appVersion,
      branding: this.branding,
      failIfInUse: failIfInUse
    }
    this.get_result_post(parameters, '', function (result) {
      console.log("SUCCESS setStreamingLicense");
      console.log(result);
      User.setLicense(license);
      User.setLicensePin(pin);
      User.setLicenseActivated(true)
      successCallback();
    }, function (result) {
      console.log(result);
      console.log("ERROR setStreamingLicense ", license, pin);
      errorCallback(result.errorCode);
    });
  },

  getBouquets: function (successCallback, errorCallback) {
    var udid = getUdid();
    var sessionId = User.getSessionId();

    this.get_result_post({ f: 'getBouquets', sessionId: sessionId, udid: udid, os: this.loginParamOS, appVersion: this.appVersion, branding: this.branding }, '', function (result) {
      console.log("SUCCESS getBouquets");
      console.log(result);
      successCallback(result.answer);
    }, function (result) {
      console.log("ERROR getBouquets");
      console.log(result);
      errorCallback();
    });
  },

  getAvailableStreams: function (successCallback, errorCallback) {
    var udid = getUdid();
    var sessionId = User.getSessionId();

    this.get_result_post({ f: 'getAvailableStreams', sessionId: sessionId, udid: udid, os: this.loginParamOS, appVersion: this.appVersion, branding: this.branding, ip: true }, '', function (result) {
      console.log("SUCCESS getAvailableStreams");
      console.log(result);
      successCallback(result.answer);
    }, function (result) {
      console.log("ERROR getAvailableStreams");
      console.log(result);
      errorCallback();
    });
  },

  getCatchupGroups: function (successCallback, errorCallback) {
    var udid = getUdid();
    var sessionId = User.getSessionId();

    this.get_result_post({ f: 'getCatchupGroups', sessionId: sessionId, udid: udid, os: this.loginParamOS, appVersion: this.appVersion, branding: this.branding }, '', function (result) {
      console.log("SUCCESS getCatchupGroups");
      console.log(result);
      successCallback(result.answer);
    }, function (result) {
      console.log("ERROR getCatchupGroups");
      console.log(result);
      errorCallback();
    });
  },

  getCatchupEvents: function (epgStreamId, successCallback, errorCallback) {
    var udid = getUdid();
    var sessionId = User.getSessionId();

    this.get_result_post({ f: 'getCatchupEvents', sessionId: sessionId, epgStreamId: epgStreamId, udid: udid, os: this.loginParamOS, appVersion: this.appVersion, branding: this.branding }, '', function (result) {
      console.log("SUCCESS getCatchupEvents");
      console.log(result);
      successCallback(result.answer);
    }, function (result) {
      console.log("ERROR getCatchupEvents");
      console.log(result);
      errorCallback();
    });
  },

  getCatchupsRecorded: function (successCallback, errorCallback) {
    var udid = getUdid();
    var sessionId = User.getSessionId();

    this.get_result_post({ f: 'getRecordingTasks', sessionId: sessionId, udid: udid, os: this.loginParamOS, appVersion: this.appVersion, branding: this.branding }, '', function (result) {
      console.log("SUCCESS getRecordingTasks");
      console.log(result);
      successCallback(result.answer);
    }, function (result) {
      console.log("ERROR getRecordingTasks");
      console.log(result);
      errorCallback();
    });
  },

  getEPG: function (url, successCallback, errorCallback) {
    //var udid = getUdid();
    //var sessionId = User.getSessionId();

    this.get_epg(url, 'getEPGCallback', function (result) {
      successCallback(result);
      /*if (result.answer && result.answer != "false" && result.answer.length) {
        if (result.answer && result.answer.length > 0) {
          successCallback(result.answer[0]);
        } else {
          errorCallback();
        }
      } else {
        errorCallback();
      }*/
    }, function (result) {
      errorCallback(result);
    });
  },

  getVOD: function (successCallback, errorCallback) {
    var udid = getUdid();
    var sessionId = User.getSessionId();

    this.get_result_post({ f: 'getVodLibraries', sessionId: sessionId, udid: udid, os: this.loginParamOS, appVersion: this.appVersion, branding: this.branding }, '', function (result) {
      console.log("SUCCESS getVodLibraries");
      console.log(result);
      successCallback(result.answer);
    }, function (result) {
      console.log("ERROR getVodLibraries");
      console.log(result);
      errorCallback();
    });
  },

  getVODContent: function (offset, successCallback, errorCallback) {
    var udid = getUdid();
    var sessionId = User.getSessionId();

    this.get_result_post({ f: 'getVodContent', sessionId: sessionId, udid: udid, os: this.loginParamOS, appVersion: this.appVersion, branding: this.branding, offset: offset, limit: 100 }, '', function (result) {
      console.log("SUCCESS getVodContent");
      console.log(result);
      successCallback(result.answer);
    }, function (result) {
      console.log("ERROR getVodContent");
      console.log(result);
      errorCallback();
    });
  },

  getVodSeriesInfo: function (seriesId, successCallback, errorCallback) {
    var udid = getUdid();
    var sessionId = User.getSessionId();

    this.get_result_post({ f: 'getVodSeriesInfo', sessionId: sessionId, udid: udid, os: this.loginParamOS, appVersion: this.appVersion, branding: this.branding, seriesId: seriesId }, '', function (result) {
      console.log("SUCCESS getVodSeriesInfo");
      console.log(result);
      successCallback(result.answer);
    }, function (result) {
      console.log("ERROR getVodContent");
      console.log(result);
      errorCallback();
    });
  },

  getAds: function (successCallback, errorCallback) {
    var udid = getUdid();
    var sessionId = User.getSessionId();

    this.get_result_post({ f: 'getAds', sessionId: sessionId, udid: udid, os: this.loginParamOS, appVersion: this.appVersion, branding: this.branding }, '', function (result) {
      console.log("SUCCESS getAds");
      console.log(result);
      successCallback(result.answer);
    }, function (result) {
      console.log("ERROR getAds");
      console.log(result);
      errorCallback();
    });
  },

  getTopLevelVodM3u8Url: function (vodId, successCallback, errorCallback) {
    var sessionId = User.getSessionId();
    var url = this.url + "index.php?requestMode=function&f=getVodM3u8&plain=true&vodId=" + vodId + "&sessionId=" + sessionId + "&m3u8";
    successCallback(url);
  },

  getTopLevelCatchupM3u8Url: function (catchupId, successCallback, errorCallback) {
    var sessionId = User.getSessionId();
    var url = this.url + "index.php?requestMode=function&f=getCatchupM3u8&plain=true&catchupId=" + catchupId + "&sessionId=" + sessionId + "&m3u8";
    successCallback(url);
  },

  recordOrDeleteCatchup: function (id, deleteCatchup, successCallback, errorCallback) {
    var udid = getUdid();
    var sessionId = User.getSessionId();
    var functionName = 'addRecordingTask';
    var params = { sessionId: sessionId, udid: udid, os: this.loginParamOS, appVersion: this.appVersion, branding: this.branding };

    if (deleteCatchup) {
      params.f = 'deleteRecordingTask';
      params.recordingTaskId = id;
    } else {
      params.f = 'addRecordingTask';
      params.mode = "4";
      params.catchupId = id;
    }

    this.get_result_post(params, '', function (result) {
      console.log("SUCCESS " + functionName);
      console.log(result);
      successCallback(result.success);
    }, function (result) {
      console.log("ERROR " + functionName);
      console.log(result);
      errorCallback(false);
    });
  },

  logout: function (successCallback, errorCallback) {
    var udid = getUdid();
    var sessionId = User.getSessionId();

    this.get_result_post({ f: 'logout', sessionId: sessionId, udid: udid, os: this.loginParamOS, appVersion: this.appVersion, branding: this.branding }, '', function (result) {
      console.log("SUCCESS logout");
      console.log(result);
      // clear all local storage
      User.setLoggedOut();
      successCallback();
    });
  },


  get_result: function (params, callbackName, successCallback, errorCallback) {
    params.requestMode = "function";
    params.apiToken = this.apiToken;
    params.l = this.lang;
    base_url = cv.url; //localStorage.getItem('base_url');
    console.log("get_result.base_url: " + base_url);
    $.ajax({

      url: cv.url,
      data: params,
      dataType: "jsonp",
      jsonp: 'jsonp',
      jsonpCallback: callbackName,
      timeout: 5000,
      success: function (result) {
        if (result.success) {
          successCallback(result);
        } else {
          errorCallback(result);
        }
      },
      error: function (xhr, textStatus, errorThrown) {
        errorCallback(textStatus);
      }
    });
  },

  get_result_post: function (params, callbackName, successCallback, errorCallback) {
    params.requestMode = "function";
    params.apiToken = this.apiToken;
    params.l = this.lang;
    base_url = cv.url;
    Storage.set("base_url", base_url);
    console.log("get_result.base_url: " + base_url);
    $.ajax({
      url: cv.url,
      data: params,
      type: "POST",
      timeout: 50000,
      success: function (result) {
        if (result.success) {
          successCallback(result);
        } else {
          errorCallback(result);
        }
      },
      error: function (xhr, textStatus, errorThrown) {
        errorCallback(textStatus);
      }
    });
  },

  get_from_url: function (base_url, params, callbackName, successCallback, errorCallback) {

    if (params !== false) {
      params.requestMode = "function";
      params.apiToken = this.apiToken;
      params.l = this.lang;
    }

    $.ajax({
      url: base_url,
      data: params,
      dataType: "jsonp",
      jsonp: 'jsonp',
      jsonpCallback: callbackName,
      timeout: 5000,
      success: function (result) {
        if (result.success) {
          successCallback(result);
        } else {
          errorCallback(result);
        }
      },
      error: function (xhr, textStatus, errorThrown) {
        errorCallback(textStatus);
      }
    });
  },

  get_epg: function (base_url, callbackName, successCallback, errorCallback) {

    $.ajax({
      url: base_url,
      data: [],
      jsonp: 'jsonp',
      jsonpCallback: callbackName,
      timeout: 60000,
      success: function (result) {
        var json = JSON.parse(result)
        successCallback(json);
      },
      error: function (xhr, textStatus, errorThrown) {
        errorCallback(textStatus);
      }
    });
  },

  showSuccess: function (message, timeout) {
    console.log("showSuccess: " + message);
    $("#messages").empty();
    var $el = $('<div class="alert alert-success alert-dismissible fade in" role="alert" ><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><p class="text-center message">' + message + '<p></div>')
      .prependTo('#messages');
    if (timeout) {
      setTimeout(function () {
        $el.alert('close');
      }, timeout);
    }
  },

  showError: function (message, timeout) {
    console.log("showError: " + message);
    $("#messages").empty();
    var $el = $('<div class="alert alert-warning alert-dismissible fade in" role="alert" ><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><p class="text-center message">' + message + '<p></div>')
      .prependTo('#messages');
    if (timeout) {
      setTimeout(function () {
        $el.alert('close');
      }, timeout);
    }
  },

  getUrlParams: function (url) {
    var params = {};
    var parser = document.createElement('a');
    parser.href = url;
    var query = parser.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      params[pair[0]] = decodeURIComponent(pair[1]);
    }
    return params;
  },

  encrypt: function (x, key) {
    // encrypt value
    return "";
  },

  decrypt: function (x, key) {
    // decrypt value
    return "";
  },

  hashMD5: function (val) {
    return md5(val);
    //return CryptoJS.MD5(val);
  },

  changeLoaderVisibility: function (val) {
    var spinner = document.getElementById("spinner");
    if (spinner) {
      if (val) {
        spinner.style.display = 'inline';
      } else {
        spinner.style.display = 'none';
      }
    }
  }

};
