Scene_Home = (function (Scene) {

  var Scene_Home = function () {
    this.construct.apply(this, arguments);
  };

  $.extend(true, Scene_Home.prototype, Scene.prototype, {
    /**
     * @inheritdoc Scene#init
     */
    init: function () {
      console.log("Scene_Home init");
      this.$firstFocusableItem = this.$el.find(".channels-div .focusable").first();
      this.viewport = $("#viewport");
      this.channelsGrid = $("#channelsGrid");
      this.playbackMetadata = { type: '', id: '' };
      this.requestingData = false;
      this.$videoContainer = $("#divVideoContainer");
      this.$maxiPreview = $(".maxipreview");  // Contenedor que recibe el foco
      this.$maximizeIcon = $("#maximizeIcon"); // Ícono de maximización
      this.$lastFocused = false;
      this.firstLaunch = true;
      this.dontRedraw = false;
      this.aboutString = "";
      this.timeIntervalApp = null; //by minute
      this.currentVodCategoryId = 0;
      this.nbPlayerAttempts = 0;
      this.nbPlayerRetryTimeout = null;
      this.NBPLAYER_RETRY_AFTER_ERROR = true;
      this.verifyingUserSession = false;
      this.lastPlaybackTime = 0;
      this.autoSeek = false;
      this.forcePlayback = false;
      this.lastServiceIdPlayed = null;
      this.changeChannelTimer = null;
      this.changeChannelWait = 3 * 1000; //seconds
      this.stepLoad = 0;
      this.preventPlayerReload = false;
      this.isTizen = (Device.isTIZEN || Device.isSAMSUNG);

    },
    /**
     * @inheritdoc Scene#render
     */
    render: function () {

      if (this.dontRedraw) {
        return;
      }
      this.$el.find("#maximizeIcon").on("click", this.toggleFullscreen.bind(this));
      this.$el.find("#epgAtThisTimeLabel").html(__("EPGAtThisTime"));
      this.$el.find("#epgNextLabel").html(__("EPGNext"));
      this.$el.find("#menuTitleLabel").html(__("MenuTitle"));
      this.$el.find("#menuEPGLabel").html(__("MenuEPG"));
      this.$el.find("#menuAboutLabel").html(__("MenuAbout"));
      this.$el.find("#menuLogoutLabel").html(__("MenuLogout"));
      this.$el.find("#menuExitLabel").html(__("MenuExit"));
      this.$el.find("#menuUpdateDataLabel").html(__("MenuUpdateData"));
      $(".epg-message").html(__("EPGLoading"));
      EPG.homeObject = this;
      VOD.homeObject = this;
      VODDetail.homeObject = this;
      nbPlayer.homeObject = this;

      if (!CONFIG.app.showTime) {
        $("#nbTime").addClass("hide");
      }

      var date = new Date();
      var self = this;
      self.actionMinute();
      setTimeout(function () {
        self.timeIntervalApp = setInterval(self.actionMinute, 60000);
        self.actionMinute();
      }, (60 - date.getSeconds()) * 1000);

      if (CONFIG.app.logoPositionHome == 'right') {
        var percPlayer = $("#divVideoContainer").width() / $("#divVideoContainer").parent().parent().width() * 100;
        $("#divVideoContainer").parent().css({ 'width': percPlayer + '%' });

        var percLogo = (percPlayer / 3) * 2;
        $("#rightLogoImage").parent().css({ 'width': percLogo + '%' });
        //$("#rightLogoImage").css({'margin-top': '20%', 'width': '100%', 'padding': '1em'});

        var percInfo = 100 - percPlayer - percLogo;
        $(".header-row-info").css({ 'width': percInfo + '%' });

        $("#topLogoImage").addClass("hide");
        $("#rightLogoImage").removeClass("hide");
        $("#rightLogoImage").attr("src", "assets/images/" + CONFIG.app.brand + "/logo-top.png");

      } else {
        $("#topLogoImage").removeClass("hide");
        $("#rightLogoImage").addClass("hide");
      }

      if (CONFIG.app.production) {
        this.$el.find("#menuEPGLabel").parent().addClass("hide");
      }

      if (CONFIG.app.brand == "meganet") {
        $("#menuEPGLabel").parent().hide();
      }

      NbNetworkObserver.startObserver(function () { self.goOnline(); }, function () { self.goOffline(); });

      // if (CONFIG.app.brand == "bromteck") {
      // document.addEventListener("keydown", function(inEvent) {
      // 	var message = "<span class='key-log-info'>" + inEvent.keyCode + "</span>";
      // 	$(".key-log-info").remove();
      // 	$(".nb-alert-message-label").append(message);
      // });
      // }
    },

    toggleFullscreen: function() {
      if (nbPlayer.isFullscreen()) {
        document.exitFullscreen();
      } else {
        nbPlayer.requestFullscreen();
      }
    },


    /**
         * @inheritdoc Scene#focus
         */
    focus: function ($el) {
      if (!$el) {
        $el = this.getFocusable();
      }

      return Focus.to($el);
    },

    onFocus: function ($el) {
      this.focusCandidate = null;
      $(".focus-candidate").removeClass("focus-candidate");
      this.trigger('focus', $el);
    },

    actionMinute: function () {
      $("#nbTime").html(getDateFormatted(getTodayDate(), true));
      $(".vjs-control-bar .nb-vjs-vod-time").html(getDateFormatted(getTodayDate(), true));
    },

    /**
     * @inheritdoc Scene#activate
     */
    activate: function (id, categoryId) {

      if (this.dontRedraw) {
        if (id != null) {
          var $focus = null;
          if (this.currentVodCategoryId != null) {
            $focus = $("#vodContainer").find("[data-id='" + id + "'][data-category-id='" + this.currentVodCategoryId + "']");
          } else { // comes frome VODDetail, then search vod id item
            $focus = $("#vodRow").find("[data-id='" + id + "']");
          }

          if ($focus.length > 0) {
            Focus.to($focus);
          }
        }
      }

      if (this.requestingData) {
        return;
      }

      App.throbber();

      if (!this.dontRedraw) {
        $("#menuRow").addClass("hidden");
        this.firstLaunch = true;
      }
      this.aboutString = "";

      if (User.hasCredentials() && User.isLicenseActivated()) {
        this.aboutString = "<table>"
          + "<tr>"
          + "<td style='padding-right: 6em'>" + __("AboutVersion") + ":</td><td>" + CONFIG.version + "</td>"
          + "</tr>"
          + "<tr>"
          + "<td>" + __("LoginUsername") + ":</td><td>" + User.getUsername() + "</td>"
          + "</tr>"
          + "<tr>"
          + "<td>" + __("AboutCard") + ":</td><td>" + User.getLicense() + "</td>"
          + "</tr>"
          + "<tr>"
          + "<td>" + __("AboutDevelopedBy") + ":</td><td>" + CONFIG.app.developedBy + "</td>"
          + "</tr>";

        if (!this.dontRedraw) {
          this.clearData();
        } else {
          if (this.playbackMetadata.id != null) {
            this.forcePlayback = true;
            this.autoSeek = true;
            this.lastPlaybackTime -= 1;
            this.playContentWithAccess(this.playbackMetadata.type, this.playbackMetadata.id, this.playbackMetadata.url, this.playbackMetadata.item, true, false);
          }
        }
        this.getHomeData();
      } else if (User.hasCredentials()) {
        //activate license
        App.throbberHide();
        App.notification(__("Scene_Home"));
      } else {
        //login
        App.throbberHide();
        App.notification(__("Scene_Home"));
      }

    },

    clearData: function () {
      AppData.clearData();
      EPG.reset();
      VOD.reset();
      VODDetail.reset();
      $(".div-bouquet").remove();
      $("#tvChannelsRow").empty();
      $("#vodRow").empty()
      $("#catchupsRow").empty();
      $("#favoritesRow").empty();
      $("#catchupRecordingRow").empty();
      $("#catchupRecordingRow").empty();
      this.firstLaunch = true;
      this.$lastFocused = false;
    },

    getHomeData: function () {
      this.requestingData = true;

      if ($("#tvChannelsRow").find(".channel-video").length == 0) {
        this.stepLoad = 0;
      } else if ($("#catchupsRow").find(".channel-video").length == 0 && EPG.isEmpty()) {
        this.stepLoad = 1;
      } else if (EPG.isEmpty() && VOD.isEmpty()) {
        this.stepLoad = 3;
      } else if (VOD.isEmpty()) {
        this.stepLoad = 4;
      }

      switch (this.stepLoad) {
        case 0:
          this.getDataForServicesTV();
          break;
        case 1:
          this.getDataForCatchups();
          break;
        case 2:
          this.getDataForCatchupsRecorded();
          break;
        case 3:
          this.getEPGData();
          break;
        case 4:
          this.getVODData();
          break;
        case 5:
          this.getDataForAds();
          break;
      }

    },

    getDataForServicesTV: function () {
      var self = this;
      this.updateStepLoad(0);
      AppData.getDataForServicesTV(function(bouquets) {
        self.setBouquetsContent(bouquets);
        self.getDataForCatchups();
      });
    },

    getDataForCatchups: function () {
      var self = this;
      // get catchups with events
      this.updateStepLoad(1);
      App.throbber();
      AppData.getCatchupGroups(function (catchups) {
        App.throbberHide();
        self.setCatchupsContent(catchups);
        self.getDataForCatchupsRecorded();
      });

    },

    getDataForCatchupsRecorded: function () {
      var self = this;
      this.updateStepLoad(2);
      AppData.getCatchupsRecorded(function (catchupsRecorded) {
        console.log(catchupsRecorded);
        self.setCatchupsRecordedContent(catchupsRecorded);

        $("#menuRow").removeClass("hidden");
        App.throbberHide();
        //if (self.firstLaunch) {
        self.getEPGData();
        //}
      });

    },

    getEPGData: function () {
      var self = this;
      this.updateStepLoad(3);
      //$("#menuEPGLabel").closest(".other-option").addClass("hidden");

      if (EPG.isEmpty()) {
        console.log("EPG start " + new Date());
        //App.throbber();
        AppData.getEPGByBouquet(function (servicesWithEPG) {
          //App.throbberHide();
          console.log("EPG received: " + servicesWithEPG + " " + new Date());
          if (self.playbackMetadata.type == "service" && self.firstLaunch) {
            // call for update current player metadata content
            //self.preventPlayerReload = true;
            //self.eventWhenCurrentLiveEnd();
            self.setPlayerMetadata();
          }
          EPG.draw(servicesWithEPG);
          //$("#menuEPGLabel").closest(".other-option").removeClass("hidden");
          self.getVODData();
        }, 0);
      } else {
        self.getVODData();
      }

      //EPG.draw([]);
      //this.getVODData();
    },

    getVODData: function () {
      var self = this;
      this.updateStepLoad(4);
      AppData.getVOD(function (categories) {
        console.log("VOD library received: ");
        console.log(categories);
        self.setVODContent(categories);

        self.getDataForAds();
      });
    },

    getDataForAds: function () {
      var self = this;
      this.updateStepLoad(5);
      AppData.getAds(function (ads) {
        self.showAds(ads);
        self.allDataLoaded();
      })
    },

    agregarPublicidad: function (contenedorPublicidad, images) {
      var contenedorPosicion;
      var imageCreate;

      contenedorPosicion = document.querySelector("." + contenedorPublicidad);
      imageCreate = document.createElement('img');
      contenedorPosicion.appendChild(imageCreate);

      var currentIndex = 0;
      var image = document.querySelector("." + contenedorPublicidad + " img");

      function cambiarImagenes(index) {
        if (index < 0) {
          index = images.length - 1;
        } else if (index >= images.length) {
          index = 0;
        }
        currentIndex = index;
        image.src = images[index];
      }

      cambiarImagenes(currentIndex);

      setInterval(function () {
        cambiarImagenes(currentIndex + 1);
      }, 3000);

      contenedorPosicion.classList.remove('ocultarPublicidad');
    },

    showAds: function (ads) {
      var self = this;
      var imagesTop = [];
      var imagesBot = [];
      var imagesIzquierda = [];
      var imagesDerecha = [];

      /*
      //Please refactor the following code to avoid issues with LG (old versions)
      ads.map(ad => {
        switch (ad.locationKey) {
          case 'home':
            imagesTop.push(ad.advertFile);
            self.agregarPublicidad('publicidadTop', imagesTop);
            break;
          case 'home_bottom':
            imagesBot.push(ad.advertFile);
            self.agregarPublicidad('publicidadBot', imagesBot);
            break;
          case 'home_lateral_left':
            imagesIzquierda.push(ad.advertFile);
            self.agregarPublicidad('publicidadIzquierda', imagesIzquierda);
            break;
          case 'home_lateral_right':
            imagesDerecha.push(ad.advertFile);
            self.agregarPublicidad('publicidadDerecha', imagesDerecha);
            break;
          }
      })*/
    },

    allDataLoaded: function () {
      this.requestingData = false;
      this.firstLaunch = false;
      App.throbberHide();
    },

    /**
     * @inheritdoc Scene#onLangChange
     */
    onLangChange: function () {

    },
    /**
     * @inheritdoc Scene#onClick
     */
    onClick: function ($el, event) {
      if (this.trigger('click', $el, event) === false) {
        return false;
      }
      return this.onEnter.apply(this, arguments);
    },

    // funcion antigua para cargar la informacion del epg cuando se posa o entra en un canal
    onFocus: function ($el) {

      if (EPG.isShowed() && !nbPlayer.isFullscreen()) {
        EPG.onFocus($el);
        return;
      } else if (VOD.isShowed() && !VODDetail.isShowed() && !nbPlayer.isFullscreen()) {
        VOD.onFocus($el);
        return;
      } else if (VODDetail.isShowed() && !nbPlayer.isFullscreen()) {
        VODDetail.onFocus($el);
        return;
      }

      if (typeof $el.data("type") !== 'undefined' && typeof $el.data("id") !== 'undefined' && $el.data("id") != null) {
        var id = $el.data("id");

        if ($el.data("type") == "service") {
          var serviceTV = AppData.getServiceTV(id);
          if (serviceTV !== false) {
            this.focusServiceTV(serviceTV, false);
          }
        } else if ($el.data("type") == "catchup" || $el.data("type") == "catchup-event") {
          this.setMenuTitle(__("MenuCatchups"));
        } else if ($el.data("type") == "vod") {
          if ($el.data("id") == 0) {
            this.setMenuTitle(__("MoviesSubtitle"));
          } else {
            this.setMenuTitle(__("MenuMovies"));
          }
        }
      } else if (typeof $el.data("other-id") !== 'undefined') {
        this.$lastFocused = Focus.focused;
        var id = $el.data("other-id");
        if (id != null & id >= 0) {
          switch (id) {
            case 0: //reload
              this.setMenuTitle(__("MenuUpdateDataDescription"));
              break;
            case 1: //epg
              this.setMenuTitle(__("MenuEPGDescription"));
              break;
            case 2: //about
              this.setMenuTitle(__("MenuAbout"));
              break;
            case 3: //logout
              this.setMenuTitle(__("MenuLogout"));
              break;
          }
        }
      } else if (nbPlayer.isFullscreen()) {
        nbPlayer.onFocus();
      }
    },

    // onFocus: function ($el) {
    //   // Elimina la clase "focus-candidate" de cualquier elemento previamente enfocado.
    //   $(".focus-candidate").removeClass("focus-candidate");
    //   this.trigger('focus', $el);

    //   // Si la EPG está visible y el reproductor no está en pantalla completa, enfoca en la EPG.
    //   if (EPG.isShowed() && !nbPlayer.isFullscreen()) {
    //       EPG.onFocus($el);
    //       return;
    //   } else if (VOD.isShowed() && !VODDetail.isShowed() && !nbPlayer.isFullscreen()) {
    //       // Si VOD está visible, maneja el foco en el VOD.
    //       VOD.onFocus($el);
    //       return;
    //   } else if (VODDetail.isShowed() && !nbPlayer.isFullscreen()) {
    //       // Si se están mostrando detalles del VOD, maneja el foco en los detalles de VOD.
    //       VODDetail.onFocus($el);
    //       return;
    //   }

    //   // Verifica si hay un tipo y un id para el elemento enfocado.
    //   if (typeof $el.data("type") !== 'undefined' && typeof $el.data("id") !== 'undefined' && $el.data("id") != null) {
    //       var id = $el.data("id");

    //       if ($el.data("type") == "service") {
    //           // Obtiene la información del servicio de TV enfocado.
    //           var serviceTV = AppData.getServiceTV(id);
    //           if (serviceTV !== false) {
    //               // Si hay datos disponibles para el servicio, enfoca en el servicio.
    //               this.focusServiceTV(serviceTV, false);
    //           } else {
    //               // Si no hay datos para el servicio, muestra "No hay datos".
    //               $(".epg-message").text(__("EPGItemNoData")).show();
    //           }
    //       } else if ($el.data("type") == "catchup" || $el.data("type") == "catchup-event") {
    //           // Maneja el enfoque en un evento de catchup.
    //           this.setMenuFocusToCatchup($el.data("id"));
    //       }
    //   }
    // },

    /**
     * @inheritdoc Scene#onReturn
     */
    onReturn: function ($el, event) {
      console.log("go back");
      var self = this;
      if (ParentalControlDlg.isShowed()) {
        ParentalControlDlg.close(null);
      } else if (nbPlayer.isFullscreen()) {
        nbPlayer.onReturn($el, this.playbackMetadata, function () {
          self.restartFocus();
        });
        return;
      } else if (EPG.isShowed()) {
        EPG.onReturn(function () {
          $("#channelsGrid").show();
          Focus.to(self.$lastFocused);
          self.$lastFocused = [];
        });

        if (self.$lastFocused.length == 0) {
          Focus.to($(".other-option[data-other-id='1']"));
        }
      } else if (VOD.isShowed() && !VODDetail.isShowed()) {
        VOD.onReturn(function () {
          $("#channelsGrid").show();
          Focus.to($("#vodRow .focusable:first"));
        });
      } else if (VODDetail.isShowed()) {
        VODDetail.onReturn(function () {
          Focus.to(self.$lastFocused);
        });
      } else if ($el.isInAlertConfirm(this.$el)) {
        $el.closeAlert(this.$el);
        Focus.to(this.$lastFocused);
      } else if ($el.isInAlertMessage(this.$el)) {
        $el.closeAlert(this.$el);
        Focus.to(this.$lastFocused);
      } else if ($el.isInAlertInput(this.$el)) {
        $el.closeAlert(this.$el);
        Focus.to(this.$lastFocused);
      } else {

        if (CONFIG.app.brand == "fotelka") {
          if (this.playbackMetadata.id && this.playbackMetadata.id != '') {
            try {
              nbPlayer.requestFullscreen();
            } catch (e) { }
            return;
          }
        }

        if (Focus.focused != null && !Focus.focused.is(this.$videoContainer)) {
          Focus.to(this.$videoContainer);
          return;
        }

        this.$lastFocused = Focus.focused;
        this.$el.showAlertConfirm(__("AppCloseApp"), 'close_app', null, null, 'cancel');
      }
    },

    /**
     * @inheritdoc Scene#onEnter
     */
    onEnter: function ($el, event) {

      var self = this;
      if (nbPlayer.isFullscreen()) {
        if ($el.hasClass('video-container')) {
          return false;
        }
        nbPlayer.manageOnEnter($el, function () {
          var next = AppData.getNextEpisode(self.playbackMetadata.item, self.playbackMetadata.item.currentSeasonId, self.playbackMetadata.item.currentEpisodeId);
          if (next != null) {
            self.playEpisode(self.playbackMetadata.item.currentVodObjectId, next);
          }
        }, function () {
          self.restartFocus();
        }, function () {
          self.openEPG();
        });
        return false;
      } else if (ParentalControlDlg.isShowed()) {
        ParentalControlDlg.onEnter($el);
        return;
      } else if (EPG.isShowed() && !$el.hasClass('video-container') && !NBAlert.isInAlertInput(this.$el)) {
        EPG.onEnter($el, function (type, id, url, object) {
          self.playContentWithAccess(type, id, url, object, true, true);
        });
        return;
      } else if (VOD.isShowed() && !VODDetail.isShowed() && !$el.hasClass('video-container') && !$el.isInAlertConfirm(this.$el)) {
        VOD.onEnter($el, function (type, id, url, object) {
          self.playContent(type, id, url, object, false, false);
        });
        return;
      } else if (VODDetail.isShowed() && !$el.hasClass('video-container') && !$el.isInAlertConfirm(this.$el)) {
        VODDetail.onEnter($el);
        return;
      }

      if (typeof $el.data("id") !== 'undefined') {
        var id = $el.data("id");
        var type = $el.data("type");


        if (type == this.playbackMetadata.type && id == this.playbackMetadata.id && !this.firstLaunch) {
          try {
            nbPlayer.requestFullscreen();
          } catch (e) { }
          return;
        }

        if (type == "service") {
          var serviceTV = AppData.getServiceTV(id);
          if (serviceTV !== false && serviceTV.url != null && serviceTV.url.length > 0) {
            this.playContentWithAccess(type, id, serviceTV.url, serviceTV, true, false);
          }
        } else if (type == "catchup") {
          if ($el.data("back") == true) {
            $("#catchupsRow").find(".row-catchup-dates:first").addClass("hidden");
            $("#catchupsRow").find(".row-catchup-events:first").addClass("hidden");
            $("#catchupsRow").find(".row-catchups:first").removeClass("hidden");

            var $focusTo = $("#catchupsRow").find(".row-catchups .focusable[data-id='" + id + "']:first");
            Focus.to($focusTo);
            $focusTo.focus();
          } else {
            var catchup = AppData.getCatchup(id);
            if (catchup !== false) {
              this.openCatchupCell(catchup);
            }
          }

        } else if (type == "catchup-date") {
          if ($el.data("back") == true) {
            $("#catchupsRow").find(".row-catchups:first").addClass("hidden");
            $("#catchupsRow").find(".row-catchup-events:first").addClass("hidden");
            $("#catchupsRow").find(".row-catchup-dates:first").removeClass("hidden");

            var $focusTo = $("#catchupsRow").find(".row-catchup-dates .focusable[data-id='" + id + "']:first");
            Focus.to($focusTo);
            $focusTo.focus();
          } else {
            var catchup = AppData.getCatchup(id);
            var dateString = $el.data("date");
            if (catchup !== false) {
              this.openCatchupDate(catchup, dateString);
            }
          }
        } else if (type == "catchup-event") {
          var eventId = $el.data("event-id");
          var catchup = null;
          if (eventId != null && typeof eventId != 'undefined' && eventId > 0) {
            catchup = AppData.getCatchupByEventId(eventId);
            id = eventId;
          } else {
            var group = $el.data("group");
            catchup = AppData.getCatchupEvent(group, id);
          }

          if (catchup == null) {
            return;
          }

          console.log(catchup);
          console.log("Play catchup event id " + id);

          AppData.getTopLevelCatchupM3u8Url(catchup.id, function (url) {
            console.log("Play CATCHUP with URL: " + url);
            if (url != null && url.length > 0) {
              self.playContentWithAccess(type, id, url, catchup, true, false);
            }
          });

        } else if (type == "vod") {
          if (id > 0) {
            this.currentVodCategoryId = null;
            //Router.go('voddetail', id, this.currentVodCategoryId, this);
            this.$lastFocused = Focus.focused;
            VODDetail.show(id, this.currentVodCategoryId, this);
          } else {
            // open all vod window
            VOD.show();
          }
        }

      } else if (typeof $el.data("other-id") !== 'undefined') {
        var id = $el.data("other-id");
        if (id != null & id >= 0) {
          console.log("other option ", id);
          switch (id) {
            case 0: //reload
              this.activate();
              break;
            case 1: //epg
              this.openEPG();
              break;
            case 2: //about
              this.$el.showAlertMessage(this.aboutString, "menuabout", __("SettingsCloseButton").toUpperCase());
              break;
            case 3: //logout
              this.$lastFocused = Focus.focused;
              this.$el.showAlertConfirm(__("LoginLogoutConfirm"), 'LoginLogoutConfirm', __("LoginLogoutButton"), __("LoginLogoutCancelButton"), 'cancel');
              break;
            case 4: //exit
              this.$lastFocused = Focus.focused;
              this.$el.showAlertConfirm(__("AppCloseApp"), 'close_app', null, null, 'cancel');
              break;
          }
        }
      } else if ($el.hasClass('video-container')) {
        try {
          nbPlayer.requestFullscreen();
        } catch (e) { }

        Focus.to($(".exitFullscreenBtn"));
        $(".exitFullscreenBtn").focus();
      } else if ($el.isInAlertMessage(this.$el)) {
        $el.closeAlert(this.$el);
        Focus.to(this.$lastFocused);
      } else if ($el.isInAlertConfirm(this.$el)) {
        var tag = $el.data("tag");
        if (typeof tag != 'undefined' && tag != null && tag.length > 0) {
          if (tag == "license_already_in_use") {
            this.activateLicense($el.is(this.$nbAlertConfirmOkButton));
            $el.closeAlert(this.$el);
            Focus.to(this.$videoContainer);
            return;
          } else if (tag == "MoviesContinuePlayback") {
            if ($el.is(this.$nbAlertConfirmOkButton)) {
              var timeResume = User.getVideoHistoryFor(this.playbackMetadata.type, this.playbackMetadata.id);
              nbPlayer.$player.currentTime(timeResume);
            }
            nbPlayer.$player.play();
            $el.closeAlert(this.$el);
            nbPlayer.requestFullscreen();
            return;
          } else if (tag == "LoginLogoutConfirm") {
            if ($el.is(this.$nbAlertConfirmOkButton)) {
              $el.closeAlert(this.$el);
              cv.logout(function () {
                self.destroyScene();
              });
              return;
            } else {
              $el.closeAlert(this.$el);
              Focus.to(this.$lastFocused);
            }
          }
        }

        if ($el.is(this.$nbAlertConfirmOkButton)) {
          $el.closeAlert(this.$el);
          closeApp();
        } else {
          $el.closeAlert(this.$el);
          Focus.to(this.$lastFocused);
        }
      } else if (NBAlert.isInAlertInput(this.$el)) {
        NBAlert.enter(this);
        return;
      }
    },

    /**
     * @inheritdoc Scene#onBeforeGoBack
     */
    onBeforeGoBack: function (fromScene) {
      this.dontRedraw = true;
    },

    /**
     * @inheritdoc Scene#navigate
     */
    navigate: function (direction) {
      var $el = Focus.focused;

      if (nbPlayer.isFullscreen()) {
        nbPlayer.navigate($el, direction);
        return;
      } else if (ParentalControlDlg.isShowed()) {
        ParentalControlDlg.navigate(direction);
        return;
      } else if ($el.isInAlertMessage(this.$el) || $el.isInAlertConfirm(this.$el)) { // navigate on dialog
        this.manageFocusOnAlert(direction, $el.data("parent-type"));
        return;
      } else if (NBAlert.isInAlertInput(this.$el)) {
        NBAlert.navigate(direction, $el.data("parent-type"));
        return;
      }

      if (EPG.isShowed() && !nbPlayer.isFullscreen()) {
        EPG.navigate(direction);
        return;
      } else if (VOD.isShowed() && !VODDetail.isShowed() && !nbPlayer.isFullscreen()) {
        VOD.navigate(direction);
        return;
      } else if (VODDetail.isShowed() && !nbPlayer.isFullscreen()) {
        VODDetail.navigate(direction);
        return;
      }

      var $focused = Focus.focused;
      var $focusTo = [];

      if (direction == "up") {
        $focusTo = this.getNextFocusable(direction);
      } else if (direction == "down") {
        $focusTo = this.getNextFocusable(direction);
      } else if (direction == "left") {
        $focusTo = $focused.prevAll(".focusable:visible:first");
      } else if (direction == "right") {
        $focusTo = $focused.nextAll(".focusable:visible:first");
      }

      if ($focusTo.length > 0) {
        Focus.to($focusTo);

        var $parent = $focusTo.parent();

        if ($focusTo.position().left < 0) {
          $parent.scrollLeft($parent.scrollLeft() - $focusTo.innerWidth() - 20);
        } else if (($focusTo.position().left + $focusTo.innerWidth()) > $parent.innerWidth()) {
          $parent.scrollLeft($parent.scrollLeft() + $focusTo.innerWidth() + 20);
        }

      } else {
        if (!$el.is(":visible")) {
          Focus.to($("#divVideoContainer"));
        }
      }

      return false;
    },

    getNextFocusable: function (direction) {

      var $itemAtPoint = [];
      var $focused = Focus.focused;
      var jumpTopTo = 0;

      var $currentRow = $focused.closest(".row");
      var $nextRow = $currentRow;
      var currentLeftPos = $focused.position().left;

      if (direction == 'up') {
        if ($focused.is(this.$videoContainer)) {
          return $focused;
        }

        $nextRow = $currentRow.prevAll(".row:visible:first");

        if ($nextRow == null || $nextRow.length == 0) {
          return this.$videoContainer;
        }

      } else if (direction == 'down') {
        if ($focused.is(this.$videoContainer)) {
          currentLeftPos = $focused.offset().left + $focused.width() / 2;
          var $nearItem = this.channelsGrid.getHomeFocusableItemAt($focused.offset().top + 20, currentLeftPos);
          if ($nearItem.length > 0) {
            return $nearItem;
          } else {
            $nextRow = this.channelsGrid.getHomeRowAt($focused.offset().top + 20, currentLeftPos);
            currentLeftPos = $focused.offset().left;
          }

        } else {
          $nextRow = $currentRow.nextAll(".row:visible:first");
        }

        if ($nextRow == null || $nextRow.length == 0) {
          return $focused;
        }
      }

      left = currentLeftPos + ($focused.width() / 2);

      // scroll if needed
      if ($nextRow != null && $nextRow.length > 0) {
        jumpTopTo = $nextRow.position().top + $nextRow.find(".focusable:visible:first").position().top + 20;
        var jump = 0;
        if ($nextRow.position().top < 0) {
          jump = $nextRow.position().top;
          jumpTopTo -= jump;
        } else if ($nextRow.position().top + $nextRow.height() > this.channelsGrid.height() - 20) {
          jump = ($nextRow.position().top + $nextRow.height()) - (this.channelsGrid.height() - 50);
          jumpTopTo -= jump;
        }
        this.channelsGrid.scrollTop(this.channelsGrid.scrollTop() + jump);
      }

      //get a focusable item at point
      $itemAtPoint = this.channelsGrid.getHomeFocusableItemAt(jumpTopTo, left);

      if ($itemAtPoint.length > 0) {
        return $itemAtPoint;
      }

      // search up to left
      var jumpX = 100;
      var x = 1;
      for (var i = (left - jumpX); i > 0; i -= jumpX) {
        console.log("Search up to left " + (x++) + " (x=" + i + ",y=" + jumpTopTo + ")");
        $itemAtPoint = this.channelsGrid.getHomeFocusableItemAt(jumpTopTo, i);

        if ($itemAtPoint.length > 0) {
          return $itemAtPoint;
        }
      }

      return $focused;
    },

    channelUp: function () {
      if (this.playbackMetadata.type == "service") {
        this.playNextPrevServiceTV(1);
      }
    },

    channelDown: function () {
      if (this.playbackMetadata.type == "service") {
        this.playNextPrevServiceTV(-1);
      }
    },

    play: function () {
      if (this.playbackMetadata.type == "vod" || this.playbackMetadata.type == "catchup-event") {
        if (nbPlayer.isPaused()) {
          nbPlayer.$player.play();
        }
      }
    },

    pause: function () {
      if (this.playbackMetadata.type == "vod" || this.playbackMetadata.type == "catchup-event") {
        if (!nbPlayer.isPaused()) {
          nbPlayer.$player.pause();
        }
      }
    },

    playPause: function () {
      if (this.playbackMetadata.type == "vod" || this.playbackMetadata.type == "catchup-event") {
        if (nbPlayer.isPaused()) {
          nbPlayer.$player.play();
        } else {
          nbPlayer.$player.pause();
        }
      }
    },

    keyFFAction: function () {
      nbPlayer.forwardXAction();
    },

    keyRWAction: function () {
      nbPlayer.backXAction();
    },

    keyStopAction: function () {
      nbPlayer.nbPlayerResetContent(true);
      this.playbackMetadata = {};
    },

    keyGuideAction: function () {
      this.$lastFocused = Focus.focused;
      this.openEPG();
    },

    /**
     * @inheritdoc Scene#create
     */
    create: function () {
      return $('#scene-home');
    },

    setBouquetsContent: function (data) {
      var self = this;
      var htmlRow = "";

      $("#tvChannelsRow").addClass("hidden");
      $("#tvChannelsRow").empty();
      if (data.length >= 1) {
        var tvChannels = data[0];

        if (tvChannels.items.length > 0) {
          htmlRow = this.getHTMLRowChannel(tvChannels, tvChannels.name, false);
          $("#tvChannelsRow").html(htmlRow);
          $("#tvChannelsRow").removeClass("hidden");
        }
      }

      // set favorites if needed
      this.setFavoritesRow();

      //$("#channelCategoryGroup").addClass("hidden");
      //$("#channelCategoryGroup").empty();
      if (data.length > 1) {
        //$("#channelCategoryGroup").removeClass("hidden");
        htmlRow = "";
        data.forEach(function (bouquet, index, array) {
          if (index > 0 && bouquet.items.length > 0) {
            htmlRow += self.getHTMLRowChannel(bouquet, bouquet.name, true);
          }
        });

        //$("#channelCategoryGroup").append(htmlRow);
        $(htmlRow).insertAfter("#favoritesRow");
      }

      // set first focusable item
      this.$firstFocusableItem = this.channelsGrid.find(".channels-div .focusable").first();

      App.notification(__("Scene_Home"));
      Focus.to(this.$firstFocusableItem);

      if (this.firstLaunch) { // play first item when app data is loaded
        this.onEnter(Focus.focused, []);
      }
    },

    setCatchupsContent: function (data) {
      console.log(data);
      if (data.length > 0) {

        var cells = "";

        data.forEach(function (catchup, index, array) {
          if (catchup.events != null && catchup.events.length > 0) {
            var style = "";
            if (catchup.background != null && typeof catchup.background != 'undefined') {
              style = " background-color: #" + catchup.background;
            }
            cells += '<div class="channel-video focusable" data-id="' + catchup.epgStreamId + '" data-type="catchup" style="' + style + '">'
              + '<img src="' + catchup.img + '" alt="">'
              + '</div>';
          }
        });

        var htmlRow = '<div class="col-sm-12 channels-div">'
          + '<h4 class="heading">' + __("MenuCatchups") + '</h4>'
          + '<div class="horizontal-slide row-catchups">'
          + cells
          + '</div>'
          + '<div class="horizontal-slide row-catchup-dates hidden"></div>'
          + '<div class="horizontal-slide row-catchup-events hidden"></div>'
        '</div>';

        $("#catchupsRow").html(htmlRow);
        $("#catchupsRow").removeClass("hidden");
      } else {
        $("#catchupsRow").addClass("hidden");
      }
    },

    setCatchupsRecordedContent: function (data) {
      if (data.length > 0) {

        var cells = "";

        data.forEach(function (catchup, index, array) {
          cells += '<div class="channel-video catchup-recorded focusable" data-id="' + catchup.event.id + '" data-event-id="' + catchup.event.id + '" data-type="catchup-event">'
            + '<div class="catchup-recorded-container">'
            + '<div class="no-padding"><img src="' + catchup.event.imageUrl + '" data-placeholder="' + catchup.image + '" alt=""></div>'
            + '<span>' + catchup.event.name + '</span>'
            + '<span>' + getDateFormatted(catchup.event.startDate, false) + ' ' + getDateFormatted(catchup.event.startDate, true) + ' - ' + getDateFormatted(catchup.event.endDate, true) + '</span></div>'
            + '</div>';
        });

        var minutesUsed = AppData.getCatchupRecordingsMinutesUsed();
        var minutesLimit = CONFIG.app.catchupRecordingHoursLimit * 60;
        var percentage = (minutesUsed / (minutesLimit)) * 100;
        percentage = percentage < 0 ? 0 : (percentage > 100 ? 100 : percentage);
        var used = minutesLimit - minutesUsed;
        used = (used > 0) ? minutesToTimeString(used) : "0hs";
        var availableText = __("CatchupTimeAvailable")
          .replaceAll("%s", used)
          .replaceAll("%dhs", minutesToTimeString(minutesLimit));

        var htmlRow = '<div class="col-sm-12 channels-div">'
          + '<h4 class="heading">' + __("CatchupRecordingTitle") + '</h4>'

          + '<div class="catchup-record-info">'
          + '<div class="catchup-record-available">'
          + '<div class="catchup-record-used" style="width: ' + percentage + '%"></div>'
          + '</div>'
          + '<h3>' + availableText + '</h3></div>'

          + '<div class="horizontal-slide row-catchups">'
          + cells
          + '</div>'
        '</div>';

        $("#catchupRecordingRow").html(htmlRow);
        $("#catchupRecordingRow").removeClass("hidden");

        addImgPlaceholder($("#catchupRecordingRow").find("img"));
        //addImgErrorEvent($("#catchupRecordingRow").find("img"));
      } else {
        $("#catchupRecordingRow").addClass("hidden");
      }
    },

    openCatchupCell: function (catchup) {
      // prepare dates
      var dates = [];
      var justDate = "";
      var style = "";
      catchup.events.forEach(function (event, index, array) {
        justDate = event.startDate.local().format('YYYY-MM-DD');
        if (dates.indexOf(justDate) < 0) {
          dates.push(justDate);
        }
      });

      dates.sort(function (a, b) {
        a = moment(a.startDate).utc(true);
        b = moment(b.startDate).utc(true);
        return a.startDate != null ? ((a.startDate > b.startDate) ? 1 : ((a.startDate < b.startDate) ? -1 : 0)) : 0;
      });

      if (catchup.background != null && typeof catchup.background != 'undefined') {
        style = " background-color: #" + catchup.background;
      }
      var cells = '<div class="channel-video focusable" data-id="' + catchup.epgStreamId + '" data-type="catchup" data-back="true" style="' + style + '">'
        + '<img src="' + catchup.img + '" alt="">'
        + '</div>';

      dates.forEach(function (dateItem, index, array) {
        cells += '<div class="channel-video focusable" data-id="' + catchup.epgStreamId + '" data-date="' + dateItem + '" data-type="catchup-date">'
          + '<div><span>' + getDateFormatted(moment(dateItem)) + '</span></div>'
          + '</div>';
      });

      $("#catchupsRow").find(".row-catchups:first").addClass("hidden");
      var $rowCatchupDates = $("#catchupsRow").find(".row-catchup-dates:first");
      $rowCatchupDates.removeClass("hidden");
      $rowCatchupDates.html(cells);

      // focus
      var $focusTo = $rowCatchupDates.find(".focusable:first");
      Focus.to($focusTo);
      $focusTo.focus();
    },

    openCatchupDate: function (catchup, dateString) {
      var events = catchup.events.filter(function (event) {
        return event.startDate.local().format("YYYY-MM-DD") == dateString;
      });

      if (catchup.background != null && typeof catchup.background != 'undefined') {
        style = " background-color: #" + catchup.background;
      }

      var cells = '<div class="channel-video focusable" data-id="' + catchup.epgStreamId + '" data-type="catchup" data-back="true" style="' + style + '">'
        + '<img src="' + catchup.img + '" alt="">'
        + '</div>'
        + '<div class="channel-video focusable" data-id="' + catchup.epgStreamId + '" data-date="' + dateString + '" data-type="catchup-date" data-back="true">'
        + '<div><span>' + getDateFormatted(moment(dateString)) + '</span></div>'
        + '</div>';
      var config = Storage.get("cvClientConfig");
      var objetoConfig = JSON.parse(config);
      var cdnServers = objetoConfig.cdnServers[3].urls[1];

      events.forEach(function (event, index, array) {
        var src
        if (event.imageUrl != null || event.imageUrl != "null" || event.imageUrl != "") {
          src = event.imageUrl
        }
        else if (event.imageUrl == null || event.imageUrl == "null" || event.imageUrl == "") {
          src = cdnServers + "" + event.id + "/screenshot.jpg"
        }
        cells += '<div class="channel-video focusable" data-id="' + event.eventId + '" data-group="' + catchup.epgStreamId + '" data-type="catchup-event">'
          + '<div style = "position: relative"><img src="' + src + '"onerror="imgOnError(this)" alt=""><span style = "position: absolute; top:0;" class="event">' + event.name + '</span><span style = "position: absolute; bottom:0;" class="event">' + getDateFormatted(event.startDate, true) + ' - ' + getDateFormatted(event.endDate, true) + '</span></div>'
          + '</div>';
      });
      $("#catchupsRow").find(".row-catchup-dates:first").addClass("hidden");
      var $rowCatchupEvents = $("#catchupsRow").find(".row-catchup-events:first");
      $rowCatchupEvents.removeClass("hidden");
      $rowCatchupEvents.html(cells);

      // focus
      var $focusTo = $rowCatchupEvents.find(".focusable[data-date='" + dateString + "']:first");
      Focus.to($focusTo);
      $focusTo.focus();
    },

    setVODContent: function (categories) {
      var vodsCount = 0;
      categories.forEach(function (item) {
        vodsCount += item.vods.length;
      });

      if (vodsCount > 0) {
        var vods = AppData.getVodRecommended();
        var htmlRow = this.getHTMLRowVOD(vods, __("MenuMovies"), -1, (CONFIG.app.production ? false : true));
        $("#vodRow").html(htmlRow);
        $("#vodRow").removeClass("hidden");
      } else {
        $("#vodRow").addClass("hidden");
      }
      VOD.draw(categories);
    },

    getHTMLRowChannel: function (row, title, isBouquet) {
      var headingStyle
      if (CONFIG.app.brand === "supercabo") {
        headingStyle = "style='width: 15em; border-top: 2px solid; border-bottom: 2px solid; border-right: 2px solid; border-radius: 0px 15px 15px 0px; border-color:orange'"
      }

      var html = '<div class="col-sm-12 channels-div" data-description="' + row.description + '">'
        + '<h4 class="heading" '+headingStyle+'>' + title + '</h4>'
        + '<div class="horizontal-slide">';

      var style = "";
      row.items.forEach(function (channel) {
        style = "";
        if (channel.backgroundColor != null && typeof channel.backgroundColor != 'undefined') {
          style = " background-color: #" + channel.backgroundColor;
        }
        html += '<div class="channel-video focusable channel-style" data-id="' + channel.id + '" data-type="service" style="' + style + '">'
          + '<img class="img-style" src="' + channel.img + '" onerror="imgOnError(this)" alt="">'
          + '</div>';
      });
      html += '</div>'
        + '</div>';

      if (isBouquet) {
        html = "<div class='row div-bouquet'>" + html + "</div>";
      }

      return html;
    },

    getHTMLRowVOD: function (vods, title, idCategory, allOption) {
      // if (vods.length == 0) {
      // 	return "";
      // }
      var headingStyle
      if (CONFIG.app.brand === "supercabo") {
        headingStyle = "style='width: 15em; border-top: 2px solid; border-bottom: 2px solid; border-right: 2px solid; border-radius: 0px 15px 15px 0px; border-color:orange'"
      }

      var html = '<div class="col-sm-12 channels-div">'
        + '<h4 class="heading" '+headingStyle+'>' + title + '</h4>'
        + '<div class="horizontal-slide">';

      //all movies item
      if (allOption) {
        html += '<div class="channel-video vod-list vod-video focusable" data-id="0" data-type="vod">'
          + '<div class="vod-all-item"><i class="fa fa-film" aria-hidden="true"></i><span>' + __("MoviesAllVod") + '</span></div>'
          + '</div>';
      }
      var config = Storage.get("base_url");

      vods.forEach(function (vod) {
        var posterInfoURL
        if (vod.posterInfoURL == undefined || vod.posterInfoURL == null || vod.posterInfoURL == "null") {
          posterInfoURL = config + "/cv_data_pub/images/" + vod.image1Id + "/v/vod_poster_list.jpg"
        }
        else {
          posterInfoURL = vod.posterInfoURL
        }

        html += '<div class="channel-video vod-list focusable" data-id="' + vod.id + '" data-category-id="' + idCategory + '" data-type="vod">'
          + '<img src="' + posterInfoURL + '" onerror="imgOnError(this)" alt="">'
          + '</div>';
      });
      html += '</div>'
        + '</div>';

      return html;
    },

    playContentWithAccess: function (type, id, url, item, reset, forceFullscreen) {
      if (type == this.playbackMetadata.type && id == this.playbackMetadata.id && !this.forcePlayback
        || ((this.playbackMetadata.item && item.isSeries && this.playbackMetadata.item.isSeries && this.playbackMetadata.item.currentEpisodeId == item.currentEpisodeId))) {
        nbPlayer.requestFullscreen();
        return;
      }

      if (this.checkParentalControl(type, id, url, item, reset, forceFullscreen)) {
        return;
      }
    },

    playContent: function (type, id, url, item, reset, isAutoPlay) {
      if (type == this.playbackMetadata.type && id == this.playbackMetadata.id && !this.forcePlayback
        || ((this.playbackMetadata.item && item.isSeries && this.playbackMetadata.item.isSeries && this.playbackMetadata.item.currentEpisodeId == item.currentEpisodeId))) {
        nbPlayer.requestFullscreen();
        return;
      }

      var self = this;
      this.forcePlayback = false;
      this.NBPLAYER_RETRY_AFTER_ERROR = true;
      this.resetNbPlayerRetryTimeout(typeof reset != 'undefined' && reset == true);

      // before change current content, save history
      if (!nbPlayer.isPaused() && this.playbackMetadata.type == 'vod') {
        var currentTime = parseInt(nbPlayer.$player.currentTime());
        User.setVideoHistoryFor({ type: this.playbackMetadata.type, id: this.playbackMetadata.id, time: currentTime });
      }

      nbPlayer.playContent(type, url);

      if (!nbPlayer.isFullscreen()) {
        nbPlayer.$player.userActive(false);
      }

      this.setPlayerMetadata(type, id, url, item);

      //continue
      if (nbPlayer.nbPlayerAreControslActive() && !nbPlayer.isSideMenuOpened()) {
        Focus.to(nbPlayer.$playPauseButton);
      }

      var autoplay = true;
      if (this.autoSeek && this.lastPlaybackTime > 0) {
        nbPlayer.$player.currentTime(this.lastPlaybackTime);
        this.autoSeek = false;
        this.lastPlaybackTime = 0;
      } else if (type == 'vod') {
        var timeResume = User.getVideoHistoryFor(type, id);
        if (timeResume > 0) {
          if (nbPlayer.isFullscreen()) {
            nbPlayer.exitFullscreen();
          }
          this.$el.showAlertConfirm(__("MoviesContinuePlayback"), "MoviesContinuePlayback", __("MoviesContinuePlaybackYes"), __("MoviesContinuePlaybackNo"), "ok");
          autoplay = false;
        } else {
          nbPlayer.requestFullscreen();
        }
      }

      if (autoplay) {
        nbPlayer.$player.play();
        if (nbPlayer.isFullscreen()) {
          setTimeout(function () {
            nbPlayer.showControls();
          }, 300);
        } else {
          //  modificar maximizado de pantalla
          // if ((this.firstLaunch || CONFIG.app.brand != "telecable") && !isAutoPlay) {
          //   nbPlayer.requestFullscreen();
          // }
          if ((CONFIG.app.brand == "fotelka") && !isAutoPlay) {
            nbPlayer.requestFullscreen();
          }
        }
      }
      // else {
      //   nbPlayer.$player.pause();
      // }

      nbPlayer.setEvents(function (time) {
        self.playerOnProgress(time);
      }, function (error) {
        self.playerOnError(error);
      }, function () {
        self.playerOnEnded();
      });
    },

    setPlayerMetadata: function (type, id, url, item) {

      if (type == null && id == null && url == null && item == null) {
        if (this.playbackMetadata.type == "service") {
          var serviceTV = AppData.getServiceTV(this.playbackMetadata.id);
          // var liveEvent = AppData.getLiveEvent(serviceTV);
          // if (liveEvent != null) {
          // 	var nextEvent = AppData.getNextEvent(serviceTV, liveEvent);

          // }
          type = "service";
          id = this.playbackMetadata.id;
          url = this.playbackMetadata.url;
          item = serviceTV;
        } else {
          return;
        }
      }

      this.lastServiceIdPlayed = this.playbackMetadata.type == "service" ? this.playbackMetadata.id : null;
      this.playbackMetadata = { type: type, id: id, url: url, item: item };

      var titleTopText = "";
      var epgNowText = "";
      var epgNextText = "";
      var playerTime1Text = "";
      var playerTime2Text = "";
      var srcItemImage = "";
      var srcPlaceholder = "";
      var playerImageStyle = "";
      var showNext = false;
      var startTime = null;
      var endTime = null;

      if (type == "service") { //live

        titleTopText = item.lcn + " | " + item.name;
        srcItemImage = item.img;
        srcPlaceholder = item.img;

        if (item.backgroundColor != null && typeof item.backgroundColor != 'undefined') {
          playerImageStyle = " background-color: #" + item.backgroundColor;
        }

        var liveEvent = AppData.getLiveEvent(item);
        if (liveEvent != null) {
          var nextEvent = AppData.getNextEvent(item, liveEvent);
          $("#nowEventLabel").html(getStringDate(liveEvent.startDate, "HH:mm") + ": " + (liveEvent.languages.length > 0 ? liveEvent.languages[0].title : ""));
          $("#nextEventLabel").html(getStringDate(nextEvent.startDate, "HH:mm") + ": " + (nextEvent.languages.length > 0 ? nextEvent.languages[0].title : ""));

          epgNowText = __("EPGAtThisTime") + ": " + (liveEvent.languages.length > 0 ? liveEvent.languages[0].title : "");
          playerTime1Text = getStringDate(liveEvent.startDate, "HH:mm") + " - " + getStringDate(liveEvent.endDate, "HH:mm");
          epgNextText = __("EPGNext") + ": " + (nextEvent.languages.length > 0 ? nextEvent.languages[0].title : "");
          playerTime2Text = getStringDate(nextEvent.startDate, "HH:mm") + " - " + getStringDate(nextEvent.endDate, "HH:mm");
          srcItemImage = item.img;// liveEvent.imageUrl <= to display the event image
          startTime = liveEvent.startDate;
          endTime = liveEvent.endDate;
        } else {
          epgNowText = __("EPGAtThisTime") + ": " + __("EPGItemNoData");
          epgNextText = __("EPGNext") + ": " + __("EPGItemNoData");
        }
      } else if (type == "catchup-event") {
        var group = AppData.getCatchupGroup(item.catchupGroupId);
        titleTopText = group.lcn + " | " + group.name;

        //titleTopText = item.name;
        playerTime1Text = getStringDate(item.startDate, "HH:mm") + " - " + getStringDate(item.endDate, "HH:mm");
        srcItemImage = item.imageUrl;
        srcPlaceholder = group.img;

        if (group.background != null && typeof group.background != 'undefined') {
          playerImageStyle = " background-color: #" + group.background;
        }

        epgNowText = item.name;
        //epgNextText = "next catchup";
        startTime = item.startDate;
        endTime = item.endDate;
      } else if (type == "vod") {
        titleTopText = item.name;

        if (item.isSeries) {
          var season = item.seasons.filter(function (season) { return season.id == item.currentSeasonId });
          if (season.length > 0) {
            season = season[0];
            var episode = season.episodes.filter(function (episode) { return episode.id == item.currentEpisodeId });
            if (episode.length > 0) {
              titleTopText += " - " + episode[0].name;
            }
          }

          showNext = AppData.getNextEpisode(item, item.currentSeasonId, item.currentEpisodeId) != null;
        }
        img = item.extraImageURL;
        srcItemImage = img;
        srcPlaceholder = null;
      }

      var playerMetadata = {
        type: type,
        titleTop: titleTopText,
        epgNow: epgNowText,
        epgNext: epgNextText,
        time1: playerTime1Text,
        time2: playerTime2Text,
        epgImageSrc: srcItemImage,
        epgImageStyle: playerImageStyle,
        epgImagePlaceholder: srcPlaceholder,
        showNext: showNext,
        startTime: startTime,
        endTime: endTime
      };

      nbPlayer.setPlayerMetadata(playerMetadata);
    },

    eventWhenCurrentLiveEnd: function () {
      this.forcePlayback = true;
      this.playContentWithAccess(this.playbackMetadata.type, this.playbackMetadata.id, this.playbackMetadata.url, this.playbackMetadata.item, true, false);
    },

    playerOnProgress: function (time) {
      if (!nbPlayer.isPaused() && parseInt(this.lastPlaybackTime) == time) {
        return;
      }

      this.lastPlaybackTime = time

      //every 15 seconds save vod history
      if (this.playbackMetadata.type == "vod" && time % 15 == 0) {
        User.setVideoHistoryFor({ type: this.playbackMetadata.type, id: this.playbackMetadata.id, time: time });
      }
    },

    playerOnError: function (error) {
      console.log("NBPlayer error: ");
      console.log(error);

      if (this.NBPLAYER_RETRY_AFTER_ERROR) {
        this.retryPlayCurrentContent(error);
      }
    },

    playerOnEnded: function () {
      console.log("NBPlayer playback ended");

      if (this.playbackMetadata.type == "service") {
        this.eventWhenCurrentLiveEnd();
      } else {
        User.setVideoHistoryFor({ type: this.playbackMetadata.type, id: this.playbackMetadata.id, time: 0 });
        var currentType = this.playbackMetadata.type;

        if (currentType == "catchup-event") {
          var currentId = this.playbackMetadata.id;
          this.playbackMetadata = { type: '', id: '', url: '', item: '' };
          nbPlayer.nbPlayerResetContent(false);
          this.playNextCatchup(currentId);
        } else {
          nbPlayer.nbPlayerResetContent(true);
          Focus.to(this.$videoContainer);
          this.playbackMetadata = { type: '', id: '', url: '', item: '' };
        }
      }
    },

    playNextPrevServiceTV: function (next) {
      var currentService = AppData.getServiceTV(this.playbackMetadata.id);
      var newChannel = AppData.getNextPrevServiceTV(currentService, next);
      this.playServiceTVByChannel(newChannel);
    },

    focusServiceTV: function (serviceTV, updateFocus) {

      if (updateFocus) {
        var $newFocus = $("#tvChannelsRow").find("[data-id='" + serviceTV.id + "']");
        if ($newFocus.length > 0) {
          Focus.to($newFocus);
          $newFocus.parent().focus();
        }
      }

      $(".info-epg").addClass("hidden");
      $(".info-services").removeClass("hidden");
      $("#menuTitle").addClass("hidden");
      $("#channelInfoDiv").removeClass("hidden");

      $("#channelLcnLabel").html(serviceTV.lcn);
      $("#channelNameLabel").html(serviceTV.name);
      $("#nowEventLabel").html(__("EPGNoInformation"));
      $("#nextEventLabel").html(__("EPGNoInformation"));

      var self = this;
      this.setEpgTextInfo(serviceTV, __("EPGLoading"), __("EPGLoading"));

      AppData.getSimpleEpgByChannel(serviceTV.id, function () {
        console.log("EPG loaded for " + serviceTV.id);

        var liveEvent = AppData.getLiveEvent(serviceTV);
        if (liveEvent != null) {
          var nextEvent = AppData.getNextEvent(serviceTV, liveEvent);
          self.setEpgInfo(serviceTV, liveEvent, nextEvent);
          // self.preventPlayerReload = true;
          // self.eventWhenCurrentLiveEnd();
        } else {
          self.setEpgTextInfo(serviceTV, __("EPGItemNoData"), __("EPGItemNoData"));

        }
      });
    },

    setEpgTextInfo: function (channel, liveText, nextText) {
      if (Focus.focused.data("id") == Number(channel.id)) {
        $("#nowEventLabel").html(liveText);
        $("#nextEventLabel").html(nextText);
      }

      this.updatePlayerMetadataIfNeeded(channel);
    },

    setEpgInfo: function (channel, liveEvent, nextEvent) {
      if (Focus.focused.data("id") == Number(channel.id)) {
        $("#nowEventLabel").html(getStringDate(liveEvent.startDate, "HH:mm") + ": " + (liveEvent.languages.length > 0 ? liveEvent.languages[0].title : ""));
        $("#nextEventLabel").html(getStringDate(nextEvent.startDate, "HH:mm") + ": " + (nextEvent.languages.length > 0 ? nextEvent.languages[0].title : ""));
      }

      //update player metadata if needed
      this.updatePlayerMetadataIfNeeded(channel);
    },

    updatePlayerMetadataIfNeeded: function (channel) {
      //update player metadata if needed
      if (this.playbackMetadata.type == "service" && (channel == null || this.playbackMetadata.id == channel.id)) {
        this.setPlayerMetadata();
        console.log("EPG player data updated for " + (channel != null ? channel.id : "{no channel}"));
      }
    },

    playPrevServiceTV: function () {

    },

    playLastServiceTVPlayed: function () {
      if (this.lastServiceIdPlayed != null && (this.playbackMetadata.type == "" || this.playbackMetadata.type == "service")) {
        var newChannel = AppData.getServiceTV(this.lastServiceIdPlayed);
        this.playServiceTVByChannel(newChannel);
      }
    },

    playServiceTVByChannel: function (newChannel) {
      if (typeof newChannel !== 'undefined' && newChannel != null) {
        console.log("Play channel: " + newChannel.lcn);
        this.focusServiceTV(newChannel, !nbPlayer.isFullscreen());
        this.playContentWithAccess("service", newChannel.id, newChannel.url, newChannel, true, false);
        // if (nbPlayer.isFullscreen()) {
        // 	setTimeout(function() {
        // 		nbPlayer.showControls();
        // 	}, 300);
        // }
      }
    },

    getNearBottomItem: function (near) {
      if (near > 100) {
        return this.$videoContainer;
      }
      var itemByPoint = document.elementFromPoint(40, (this.channelsGrid.offset().top + 40) + near);

      var $newFocus = $(itemByPoint).find(".focusable:first");
      if ($newFocus.length == 0) {
        $newFocus = $(itemByPoint).closest(".focusable");

        if ($newFocus.length == 0) {
          return this.getNearBottomItem(near + 20);
        }
      }
      return $newFocus;
    },

    restartFocus: function () {
      if (VODDetail.isShowed()) {
        VODDetail.setFocus();
      } else {
        Focus.to(this.$videoContainer);
      }
    },

    setMenuTitle: function (title) {
      $("#channelInfoDiv").addClass("hidden");
      $("#menuTitle").removeClass("hidden");
      $("#menuSelectedLabel").text(title);
    },

    setFavoritesRow: function () {
      var $favoritesRow = $("#favoritesRow");
      var favorites = AppData.getServicesTVFavoritedAsChannels();
      var $html = "";

      if (favorites != null) {
        $html = this.getHTMLRowChannel(favorites, favorites.name);
        $favoritesRow.html($html);
        $favoritesRow.removeClass("hidden");
      } else if ($favoritesRow.length > 0) {
        $favoritesRow.empty();
        $favoritesRow.addClass("hidden");
      }
    },

    retryPlayCurrentContent: function (error) {
      if (!this.NBPLAYER_RETRY_AFTER_ERROR) { return; }

      var self = this;
      var delay = 0;
      if (this.nbPlayerAttempts <= 6) {
        delay = 3;
      } else if (this.nbPlayerAttempts > 6 && this.nbPlayerAttempts <= 10) {
        delay = 10;
      } else {
        delay = 20;
      }

      if (this.nbPlayerRetryTimeout == null && !this.verifyingUserSession) {
        var lastTime = this.lastPlaybackTime;
        //nbPlayer.nbPlayerResetContent();
        //$("#mainVideo").addClass("vjs-waiting");
        if (this.nbPlayerAttempts % 3 == 0) {
          this.verifyUserSession(false, function (success) {
            if (success) {
              self.lastPlaybackTime = lastTime;
              self.retryPlayCurrentContentWithDelay(delay);
            } else {
              self.licenseEnded();
            }
          });
        } else {
          self.lastPlaybackTime = lastTime;
          this.retryPlayCurrentContentWithDelay(delay);
        }
      }

    },

    licenseEnded: function () {
      if (nbPlayer.isFullscreen()) {
        var self = this;
        nbPlayer.exitFullscreen(function () { });
      }
      this.NBPLAYER_RETRY_AFTER_ERROR = false;
      var self = this;
      NbNetworkObserver.simpleCheckInternetConnection(function () {
        self.$el.showAlertConfirm(__("SettingsLicenseUsedContinueHere"), "license_already_in_use", null, null, null);
      }, function () { });
    },

    activateLicense: function (activate) {
      var self = this;
      if (activate) {
        this.verifyUserSession(true, function (success) {
          if (success && self.playbackMetadata != null) {
            self.playContent(self.playbackMetadata.type, self.playbackMetadata.item.id, self.playbackMetadata.item.url, self.playbackMetadata.item, false);
          } else {
            nbPlayer.nbPlayerResetContent();
          }
        });
      }
    },

    retryPlayCurrentContentWithDelay: function (delay) {
      var self = this;

      $("#mainVideo").addClass("vjs-waiting");
      var lastTime = self.lastPlaybackTime;
      this.nbPlayerRetryTimeout = setTimeout(function () {

        //self.resetNbPlayerRetryTimeout(false);

        if (self.playbackMetadata.type == "service") {
          console.log("NBPlayer retry playback (after " + delay + " seconds) attempt " + self.nbPlayerAttempts);
          /*nbPlayer.$player.src({
            type: 'application/x-mpegURL',
            src: self.playbackMetadata.url
          });
          */
          self.forcePlayback = true;
          self.playContent(self.playbackMetadata.type, self.playbackMetadata.id, self.playbackMetadata.url, self.playbackMetadata.item, false, true);
          //nbPlayer.$player.play();
        } else if (self.playbackMetadata.type == "vod") {

          self.autoSeek = true;
          /*console.log("NBPlayer retry playback (after " + delay + " seconds) attempt " + self.nbPlayerAttempts);
          nbPlayer.$player.src({
            type: 'application/x-mpegURL',
            src: self.playbackMetadata.url
          });*/
          self.forcePlayback = true;
          self.lastPlaybackTime = lastTime;
          self.playContent(self.playbackMetadata.type, self.playbackMetadata.id, self.playbackMetadata.url, self.playbackMetadata.item, false, true);
          /*if (self.autoSeek && self.lastPlaybackTime > 0) {
            nbPlayer.$player.currentTime(self.lastPlaybackTime);
            self.autoSeek = false;
            self.lastPlaybackTime = 0;
          }*/
          //nbPlayer.$player.play();
        }
        self.nbPlayerAttempts++;
      }, delay * 1000);
    },

    resetNbPlayerRetryTimeout: function (resetAttempts) {
      if (!this.NBPLAYER_RETRY_AFTER_ERROR) { return; }

      if (resetAttempts) {
        this.nbPlayerAttempts = 0;
      }
      if (this.nbPlayerRetryTimeout != null) {
        clearTimeout(this.nbPlayerRetryTimeout);
        this.nbPlayerRetryTimeout = null;
      }
    },

    verifyUserSession: function (forceActivate, callback) {
      if (User.hasCredentialsLicense()) {
        var self = this;
        var license = User.getLicense();
        var pin = User.getLicensePin();
        this.verifyingUserSession = true;
        cv.activateStreamingLicense(license, pin, !forceActivate, function () {
          self.verifyingUserSession = false;
          callback(true);
        }, function () {
          self.verifyingUserSession = false;
          callback(false);
        });
      }
    },

    playEpisode: function (vodId, episodeObject) {
      var vodObject = AppData.getVodObject(vodId);

      if (vodObject != null) {
        var item = JSON.parse(JSON.stringify(vodObject));
        var self = this;

        AppData.getTopLevelVodM3u8Url(episodeObject.id, function (url) {
          console.log("Play vod with URL: " + url);
          if (url != null && url.length > 0) {
            item.currentVodObjectId = vodId;
            item.currentSeasonId = episodeObject.seasonId;
            item.currentEpisodeId = episodeObject.id;
            self.playContent("vod", episodeObject.id, url, item, false, false);
          }
        });
      }
    },

    goOnline: function () {

    },

    goOffline: function () {
      nbPlayer.$player.reset();

      if (nbPlayer.isFullscreen()) {
        nbPlayer.exitFullscreen(function () { });
      }

      Router.go("offline");
    },

    destroyScene: function () {
      nbPlayer.$player.reset();
      this.clearData();
      Router.clearHistory();
      Router.go('login');
    },

    playNextCatchup: function (currentEventId) {
      var catchup = AppData.getNextCatchup(currentEventId);
      var self = this;

      if (catchup && catchup != null) {
        AppData.getTopLevelCatchupM3u8Url(catchup.id, function (url) {
          console.log("Play CATCHUP with URL: " + url);
          if (url != null && url.length > 0) {
            self.playContentWithAccess("catchup-event", catchup.eventId, url, catchup, true, false);
          } else {
            nbPlayer.nbPlayerResetContent(true);
            Focus.to(self.$videoContainer);
          }
        });
      } else {
        nbPlayer.nbPlayerResetContent(true);
        Focus.to(this.$videoContainer);
      }
    },

    keyRedAction: function () {
      // go to Home
      var screen = this.getCurrentScreen();

      if (screen == "fullscreen" || screen == "epg" || screen == "vod" || screen == "alertconfirm" || screen == "alertmessage") {
        this.onReturn(Focus.focused, null);
      } else if (screen == "voddetail") {
        var self = this;
        VODDetail.onReturn(function () {
          Focus.to(self.$lastFocused);
          if (self.getCurrentScreen() != "home") {
            self.onReturn(Focus.focused, null);
          }
        });
      }

    },

    keyGreenAction: function () {
      // go to catchups
      this.focusToCatchupRow();
    },

    keyYellowAction: function () {
      // go to VOD
      var screen = this.getCurrentScreen();

      if (screen == "vod") {
        return;
      } if (screen == "fullscreen" || screen == "epg" || screen == "alertconfirm" || screen == "alertmessage") {
        this.onReturn(Focus.focused, null);
      } else if (screen == "voddetail") {
        var self = this;
        VODDetail.onReturn(function () {
          Focus.to(self.$lastFocused);
          self.focusToVodRow();
        });
        return;
      }

      this.focusToVodRow();
    },

    keyBlueAction: function () {
      // go to previous channel played
      this.playLastServiceTVPlayed();
    },

    getCurrentScreen: function () {
      if (!this.isActive) {
        return "";
      }

      var $el = Focus.focused;
      if (nbPlayer.isFullscreen()) {
        return "fullscreen";
      } else if (EPG.isShowed()) {
        return "epg";
      } else if (VOD.isShowed() && !VODDetail.isShowed()) {
        return "vod"
      } else if (VODDetail.isShowed()) {
        return "voddetail";
      } else if ($el.isInAlertConfirm(this.$el)) {
        return "alertconfirm";
      } else if ($el.isInAlertMessage(this.$el)) {
        return "alertmessage";
      } else {
        return "home";
      }
    },

    focusToCatchupRow: function () {
      var $catchupsRow = $("#catchupsRow");
      if ($catchupsRow.is(":visible")) {
        var $focusTo = $catchupsRow.find(".focusable:first");
        if ($focusTo != null && $focusTo.length > 0) {
          this.channelsGrid.scrollTop(this.channelsGrid.scrollTop() + $catchupsRow.position().top);
          Focus.to($focusTo);
        }
      }
    },

    focusToVodRow: function () {
      var $row = $("#vodRow");
      if ($row.is(":visible")) {
        var $focusTo = $row.find(".focusable:first");
        if ($focusTo != null && $focusTo.length > 0) {
          this.channelsGrid.scrollTop(this.channelsGrid.scrollTop() + $row.position().top);
          Focus.to($focusTo);
        }
      }
    },

    keyNumberAction: function (number) {
      if (this.playbackMetadata.type != "service") {
        return;
      }

      var $focused = Focus.focused;
      if ($focused.isInAlertInput(this.$el)) {
        return;
      }

      var label = $(".channel-number-indicator").find("span:first");
      var newChannelNumber = Number(label.text() + number) || 0;
      label.html(newChannelNumber);
      label.show();

      var self = this;
      clearInterval(this.changeChannelTimer);
      this.changeChannelTimer = setTimeout(function () {
        self.changeChannelByNumber(newChannelNumber);
      }, self.changeChannelWait);
    },

    changeChannelByNumber: function (number) {
      $(".channel-number-indicator").find("span:first").empty();
      $(".channel-number-indicator").find("span:first").hide();

      var channel = AppData.getServiceTVByChannelNumber(number);
      if (channel != false) {
        this.playServiceTVByChannel(channel);
      }
    },

    updateStepLoad: function (step) {
      console.log("StepLoad changed from " + this.stepLoad + " to " + step);
      this.stepLoad = step;
    },

    openEPG: function () {
      if (this.stepLoad > 3) {
        EPG.show();
      } else {
        this.$el.showAlertMessage(__("EPGLoadingPleaseWait"), "epgloading", __("SettingsOkButton").toUpperCase());
      }
    },

    checkParentalControl: function (type, id, url, item, reset, forceFullscreen) {
      var self = this;
      var requirePin = false;
      if (type == "service" && ((typeof item.parentalControl != 'undefined' && item.parentalControl) || User.hasServiceTVLocked(id))) {
        requirePin = true;
      } else if (type == "catchup-event" && item.catchupGroupId) {
        var serviceTV = AppData.getServiceTVByCatchupObj(item);
        if (serviceTV.parentalControl || User.hasServiceTVLocked(serviceTV.id)) {
          requirePin = true;
        }
      }

      if (requirePin) {
        this.$lastFocused = Focus.focused;
        var $container = nbPlayer.isFullscreen() ? nbPlayer.$mainVideo : $(".common:first");
        ParentalControlDlg.show($container, this.$lastFocused, function () {
          self.playContent(type, id, url, item, reset, false);
        }, null);
      } else {
        this.playContent(type, id, url, item, reset, false);
        if (forceFullscreen) {
          nbPlayer.requestFullscreen();
        }
      }

    },

  });

  return Scene_Home;

})(Scene);
