var NbNetworkObserver = {
  checkingConnection: false,
  intervalId: 0,
  secondsToCheck: 20,
  offlineStatus: 0,
  onlineStatus: 1,
  currentStatus: 1, //0: offline, 1: online (internet connection)
  urlTocheck: "",
  forceCallback: false,

  startObserver: function (onlineCallback, offlineCallback) {
    this.forceCallback = false;
    this.start(onlineCallback, offlineCallback);
  },

  startObserverFromOffline: function (onlineCallback, offlineCallback) {
    this.forceCallback = true;
    this.start(onlineCallback, offlineCallback);
  },

  start: function (onlineCallback, offlineCallback) {
    var self = this;
    this.urlTocheck = location.protocol + '//' + location.host + location.pathname + "/img/network.png";
    this.stopObserver();
    console.log("NbNetworkObserver started");
    self.checkInternetConnection(onlineCallback, offlineCallback);
    this.intervalId = setInterval(function () {
      self.checkInternetConnection(onlineCallback, offlineCallback);
    }, self.secondsToCheck * 1000);
  },

  stopObserver: function () {
    if (this.intervalId != 0) {
      console.log("NbNetworkObserver stopped");
      clearInterval(this.intervalId)
      this.intervalId = 0;
    }
  },

  checkInternetConnection: function (onlineCallback, offlineCallback) {
    if (this.checkConnection) {
      return;
    }

    var self = this;
    this.checkConnection = true;

    $.ajax({
      url: self.urlTocheck,
      timeout: 3000,
      cache: false,
      success: function (data, textStatus, xhr) {
        if (self.currentStatus == self.offlineStatus || self.forceCallback) {
          self.currentStatus = self.onlineStatus;
          onlineCallback();
        } else {
          self.currentStatus = self.onlineStatus;
        }

        self.checkConnection = false;
      },
      error: function (xhr, textStatus, errorThrown) {
        if (self.currentStatus == self.onlineStatus || self.forceCallback) {
          self.currentStatus = self.offlineStatus;
          offlineCallback();
        } else {
          self.currentStatus = self.offlineStatus;
        }

        self.checkConnection = false;
      }
    });
  },

  simpleCheckInternetConnection: function (onlineCallback, offlineCallback) {
    $.ajax({
      url: self.urlTocheck,
      timeout: 3000,
      cache: false,
      success: function () {
        onlineCallback();
      },
      error: function () {
        offlineCallback();
      }
    });
  }

};