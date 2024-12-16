/**
 * Application class
 * 
 * @author AuroraTech
 * @class App 
 * @singleton
 * @mixins Events
 * @mixins Deferrable
 */

App = (function (Events, Deferrable) {

  var App = {
    /**
     * @property {Boolean} networkStatus Network status, TRUE if connected
     */
    networkStatus: true
  };

  $.extend(true, App, Events, Deferrable, {
    /**
     * @event network
     * Will be called when network status changes
     * @param {Boolean} status
     */

    /**
     * Initialize Application
     */
    init: function () {

      var scope = this, $notifications = $("#notifications");

      // notification element
      if ($notifications.length)
        this.$notifications = $notifications;
      else {
        this.$notifications = $('<div id="notifications" />');
        $("body").append(this.$notifications);
      }
      // throbber interval
      this.throbberInt = null;
      // is throbber visible
      this.throbberIsShown = false;

      // monitor network connection
      setInterval(function () {
        scope.checkNetworkConnection();
      }, 1000);

      this.initRouter();


      this.splashscreen();
      //TEMPORAL LOGIN, after should call only this.splashscreen();
      // let self = this;
      // cv.clientLogin("1432031", "Nm7LwPk2", false, function(){
      // 	cv.getClientConfig(function() {

      // 		cv.getStreamingLicenses(function() {
      // 			let license = User.getLicenses()[8].key;
      // 			let pin = "3615";
      // 			cv.activateStreamingLicense(license, pin, function() { 
      // 				self.splashscreen();
      // 			}, function() {  });
      // 		}, function() { });

      // 	}, function() { });
      // }, function(message){
      // 	cv.showError('Login error ' + message);
      // });

    },

    initRouter: function () {
      HOME = new Scene_Home;
      Router.addScene('splash', new Scene_Splash);
      Router.addScene('home', HOME);
      Router.addScene('login', new Scene_Login);
      Router.addScene('licenses', new Scene_Licenses);
      Router.addScene('activation', new Scene_Activation);
      Router.addScene('offline', new Scene_Offline);
      //Router.addScene('voddetail', new Scene_VODDetail);
      //Router.go('splash') ;
    },

    checkNetworkConnection: function () {
      Device.checkNetworkConnection(function (status) {
        if (status !== this.networkStatus) {
          this.networkStatus = status;
          this.trigger('network', this.networkStatus);
        }
      }, this);
    },

    throbber: function (disable) {
      if (this.throbberIsShown) {
        $(".throbber").remove();
        //return; // only one instance of throbber
      }

      if (disable) {
        Control.disable(); // while throbber is loading, disable all controls
        Mouse.disable();
      }

      var $throbber = $("<div class='throbber' />");
      var $el = Router.activeScene.$el;
      if (!$el || $el.length == 0) {
        $el = $("body");
      }
      $el.append($throbber);

      this.throbberIsShown = true;

      // animation
      var pos = 0, width = 71, max = -781;
      this.throbberInt = setInterval(function () {
        pos -= width;
        if (pos < max)
          pos = 0;
        $throbber.css("background-position", pos + 'px 0px');
      }, 100);
    },

    throbberHide: function (enable) {
      if (this.throbberIsShown) {
        this.throbberIsShown = false;
        clearInterval(this.throbberInt);
        this.throbberInt = null;
        $(".throbber").remove();
        if (enable) {
          Control.enable();
          Mouse.enable();
        }
      }
    },

    notification: function (msg) {
      var $el = $('<div class="msg" />').html(msg);
      $('#notifications').html($el);

      $el.fadeIn();

      setTimeout(function () {
        if ($el) {
          $el.fadeOut();
        }
      }, 4000);
    },

    splashscreen: function () {
      Router.go('splash');

      setTimeout(function () {

        if (User.hasCredentials()) {
          var user = User.getUsername();
          var password = User.getPassword();

          Router.go('login');
          Scene_Login.prototype.showForm(user, password, true, false);

          cv.clientLogin(user, password, true, function () {
            cv.getClientConfig(function () {
              if (User.hasCredentialsLicense()) {
                var license = User.getLicense();
                var pin = User.getLicensePin();
                cv.activateStreamingLicense(license, pin, false, function () {
                  console.log("Go to home with all data (user, config and license activated)");
                  Router.go('home');
                }, function () {
                  console.log("Go to licenses with user and config (pending license)");
                  Router.go('licenses');
                });
              } else {
                Router.go('licenses');
              }
            }, function () {
              console.log("Has user but pending config and license. Go to Login");
              Scene_Login.prototype.showForm('', '', false, true);
            });
          }, function (result) {
            Scene_Login.prototype.showForm('', '', false, true);
          });
        } else {
          Router.go('login');
          Scene_Login.prototype.showForm('', '', true, true);
        }

      }, 2000)
    },

    throbberIn: function ($el, disable) {
      if (this.throbberIsShown)
        return; // only one instance of throbber

      if (disable) {
        Control.disable(); // while throbber is loading, disable all controls
        Mouse.disable();
      }

      var left = $el.width / 2;
      var $throbber = $("<div class='throbber' style='left: " + left + "px' />");
      $el.append($throbber);

      this.throbberIsShown = true;

      // animation
      var pos = 0, width = 71, max = -781;
      this.throbberInt = setInterval(function () {
        pos -= width;
        if (pos < max)
          pos = 0;
        $throbber.css("background-position", pos + 'px 0px');
      }, 100);
    },


  });

  // Initialize this class when Main is ready
  Main.ready(function () {
    App.init();
  });

  return App;

})(Events);