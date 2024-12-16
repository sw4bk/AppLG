User = (function (Events) {

  var User = {};

  $.extend(true, User, Events, {
    init: function () {
      this.logged = false;
      this.license = "";
      this.config = "";
      this.sessionId = "";
      this.licenseActivated = false;
      this.licenseToActivate = "";
      this.epgCdnUrl = "";
      this.operatorName = "";
      this.USER_FAVORITES_KEY = "USER_FAVORITES_KEY";
      this.LOCKED_CHANNELS_KEY = "LOCKED_CHANNELS_KEY";
      this.CHANNEL_DATA_KEY = "CHANNEL_DATA_KEY";
      this.propChannelAudio = "audio";
      this.propChannelSubtitles = "subtitles";
    },

    hasCredentials: function () {
      var username = Storage.get("username");
      var password = Storage.get("password");

      if (typeof username !== 'undefined' && username != null && username.length > 0
        && typeof password !== 'undefined' && password != null && password.length > 0) {
        return true;
      }

      return false;
    },

    hasCredentialsLicense: function () {
      var license = Storage.get("license");
      var licensePin = Storage.get("licensePin");

      if (typeof license !== 'undefined' && license != null && license.length > 0
        && typeof licensePin !== 'undefined' && licensePin != null && licensePin.length > 0) {
        return true;
      }

      return false;
    },

    isPreparedForGetData: function () {
      return this.logged && this.sessionId.length > 0 & this.license.length > 0;
    },

    getUsername: function () {
      var username = Storage.get("username");

      if (typeof username !== 'undefined' && username != null && username.length > 0) {
        return username
      }

      return "";
    },

    getPassword: function () {
      var password = Storage.get("password");

      if (typeof password !== 'undefined' && password != null && password.length > 0) {
        return password
      }

      return "";
    },

    getLicense: function () {
      return Storage.get("license");
    },

    setLicense: function (license) {
      Storage.set("license", license);
      this.license = license;
    },

    getLicensePin: function () {
      return Storage.get("licensePin");
    },

    setLicensePin: function (pin) {
      Storage.set("licensePin", pin.toString());
      this.pin = pin;
    },

    getLicenseName: function () {
      return Storage.get("licenseName");
    },

    setLicenseName: function (licenseName) {
      Storage.set("licenseName", licenseName);
      this.licenseName = licenseName;
    },

    getLicenses: function () {
      return JSON.parse(Storage.get("licenses"));
    },

    setLicenses: function (licenses) {
      Storage.set("licenses", licenses);
    },

    getConfig: function () {
      return JSON.parse(Storage.get("config"));
    },

    setConfig: function (config) {
      Storage.set("config", config);
      this.config = config;

      config = this.getConfig();
      var cdn = config.epgCdnGroupId;
      var cdnServers = config.cdnServers;

      if (cdn != null && cdnServers != null && cdnServers.length > 0) {
        var filter = cdnServers.filter(function (server) {
          return server.id == cdn;
        });

        if (filter.length > 0 && filter[0].urls.length > 0) {
          this.epgCdnUrl = filter[0].urls[0];
          console.log("epgCdnUrl: " + this.epgCdnUrl);
        }
      }

      if (config.subscriber.operator != null && config.subscriber.operator.length > 0) {
        this.operatorName = config.subscriber.operator;
      }
    },

    getSessionId: function () {
      return this.sessionId;
    },

    /**
     * Sign in (login)
     * @param {object} tokenData
     */
    setLoggedIn: function (username, password, sessionId) {
      this.username = username;
      this.password = password;
      this.sessionId = sessionId
      Storage.set('username', username);
      Storage.set('password', password);
    },

    setLoggedOut: function () {
      Storage.set('username', '');
      Storage.set('password', '');
      Storage.set('licenses', '');
      Storage.set('config', '');
      Storage.set('license', '');
      Storage.set('licensePin', '');
      Storage.set('videoHistory', '');
      Storage.set(this.USER_FAVORITES_KEY, '');
      Storage.set(this.LOCKED_CHANNELS_KEY, '');
      Storage.set('playerAudioLang', '');
      Storage.set('playerSubtitleLang', '');
      this.logged = false;
      this.license = "";
      this.config = "";
      this.sessionId = "";
      this.licenseActivated = false;
      this.operatorName = "";
      this.epgCdnUrl = "";
    },

    setLicenseActivated: function (activated) {
      this.licenseActivated = activated;
    },

    isLicenseActivated: function () {
      return this.licenseActivated;
    },

    setLicenseToActivate: function (license) {
      this.licenseToActivate = license;
    },

    getLicenseToActivate: function () {
      return String(this.licenseToActivate);
    },

    getAppLang: function () {
      return Storage.get('language');
    },

    setAppLang: function (language) {
      return Storage.set('language', language);
    },

    setServicesTVFavorited: function (favorites) {
      Storage.set(this.USER_FAVORITES_KEY, favorites);
    },

    getServicesTVFavorited: function () {
      var favorites = Storage.get(this.USER_FAVORITES_KEY);

      if (favorites != null && typeof favorites != 'undefined' && favorites.length > 0) {
        return favorites;
      }

      return [];
    },

    hasServiceTVFavorited: function (lcn) {
      var favorites = this.getServicesTVFavorited();
      return favorites.indexOf(Number(lcn));
    },

    setVideoHistoryFor: function (videoHistory) {
      var stored = Storage.get("videoHistory"); //[{type, id, time},{type, id, time}]
      var list = [];
      var index = -1;

      if (stored != null && stored != "") {
        list = JSON.parse(stored);
        index = list.indexOf(list.filter(function (item) {
          return item.type == videoHistory.type && item.id == videoHistory.id;
        })[0]);
      }

      if (index >= 0) {
        list[index].time = videoHistory.time;
      } else {
        list.push(videoHistory);
      }

      Storage.set("videoHistory", JSON.stringify(list));
    },

    getVideoHistoryFor: function (type, id) {
      var stored = Storage.get("videoHistory");
      if (stored != null && stored != "") {
        var list = JSON.parse(stored);
        var index = list.indexOf(list.filter(function (item) {
          return item.type == type && item.id == id;
        })[0]);

        if (index >= 0) {
          return list[index].time;
        }
      }

      return 0;
    },

    toggleLockedServiceTV: function (serviceTVId) {
      var success = false;
      var lockeds = Storage.get(this.LOCKED_CHANNELS_KEY);
      if (lockeds && lockeds.length > 0) {
        var index = lockeds.indexOf(Number(serviceTVId));
        if (index >= 0) { // remove
          lockeds.splice(index, 1);
        } else { // add
          lockeds.push(Number(serviceTVId));
          success = true;
        }
      } else { // add first
        lockeds = [Number(serviceTVId)];
        success = true;
      }

      Storage.set(this.LOCKED_CHANNELS_KEY, lockeds);
      return success;
    },

    hasServiceTVLocked: function (serviceTVId) {
      var lockeds = Storage.get(this.LOCKED_CHANNELS_KEY);
      return lockeds && lockeds.indexOf(Number(serviceTVId)) >= 0;
    },

    setPlayerAudioLang: function(language) {
      return Storage.set('playerAudioLang', language);
    },

    getPlayerAudioLang: function() {
      var lang = Storage.get('playerAudioLang');

      return lang && lang.length > 0 ? lang : null;
    },

    setPlayerSubtitleLang: function(language) {
      return Storage.set('playerSubtitleLang', language);
    },

    getPlayerSubtitleLang: function() {
      var lang = Storage.get('playerSubtitleLang');

      return lang && lang.length > 0 ? lang : null;
    },

    setChannelData: function (channelId, propKey, value) {
      var channelIndex = -1;
      var channelData = [];

      var jsonArray = Storage.get(this.CHANNEL_DATA_KEY);
      try {
        if (Array.isArray(jsonArray)) {
          channelData = jsonArray;
          channelIndex = channelData.findIndex(function (dictionary) {
            return dictionary.channel === channelId;
          });
        }
      } catch (error) {
        console.error("Error parsing JSON:", error.message);
      }

      if (channelIndex >= 0) {
        channelData[channelIndex][propKey] = value;
      } else {
        var newEntry = { channel: channelId};
        newEntry[propKey] = value;
        channelData.push(newEntry);
      }

      Storage.set(this.CHANNEL_DATA_KEY, channelData);
    },

    getAudioAndSubtitle: function (channelId) {
      var channelIndex = -1;
      var channelData = [];

      var jsonArray = Storage.get(this.CHANNEL_DATA_KEY);
      if (Array.isArray(jsonArray)) {
        channelData = jsonArray;
        channelIndex = channelData.findIndex(function (dictionary) {
          return dictionary.channel === channelId;
        });
      }

      if (channelIndex >= 0) {
        var audio = null;
        var subtitles = null;

        if (channelData[channelIndex][this.propChannelAudio]) {
          audio = channelData[channelIndex][this.propChannelAudio];
        }

        if (channelData[channelIndex][this.propChannelSubtitles]) {
          subtitles = channelData[channelIndex][this.propChannelSubtitles];
        }

        return [audio, subtitles];
      }

      return [null, null];
    }

  });

  User.init();

  return User;
})(Events);
