// var nbControlsEnum = {
//     fullscreen: "vjs-fullscreen-control",
//     audio: "vjs-audio-button",
//     text: "vjs-subs-caps-button",
//     trackItem: "vjs-menu-item"
// }

$(function () {
  nbPlayer.init();
});

var nbPlayer = {
  name: 'nb-vjs',
  currentType: null,
  vodControlsEnum: null,
  type: {
    vod: "vod",
    service: "service",
    catchup: "catchup-event"
  },
  $player: null,
  $controlBar: null,
  $playPauseButton: null,
  $playIcon: null,
  $pauseIcon: null,
  $vodControls: null,
  $vodTracksDiv: null,
  $vodTracksButton: null,
  $nextEpisodeButton: null,
  $nextEpisodeButtonTooltip: null,
  $forwardXButton: null,
  $backXButton: null,
  $goToStartButton: null,
  $goToEpgButton: null,
  //$seekingButton: null,
  $nbControlBar: null,
  $seekbar: null,
  $seekbarBar: null,
  $itemImageImg: null,
  $itemImageDiv: null,
  $channel: null,
  $epgNowLabel: null,
  $epgNowTimeLabel: null,
  $epgNextLabel: null,
  $titleContentLabel: null,
  $epgDataTr: null,
  $seekbarCurrentTime: null,
  $seekbarLeftTime: null,
  $backButton: null,
  $sideMenuButton: null,
  resetDelay: null,
  inactivityTimeout: null,
  defaultSkipSeconds: 10,
  startTime: null,
  endTime: null,
  duration: null,
  lastTime: 0,
  currentPercent: 0,
  isLive: false,
  callbackOnEnded: null,
  currentBrand: "",
  homeObject: null,
  $sideMenu: null,
  $sideMenuContainer: null,
  $infoButton: null,
  $favoriteButton: null,
  $unfavoriteButton: null,
  $lockButton: null,
  $unlockButton: null,
  $noLockIcon: null,
  $lockedIcon: null,
  $favoritedIcon: null,
  $addFavoriteIcon: null,
  $playerEpgDetails: null,
  sn: null,
  widthInitial: 0,
  heightInitial: 0,
  secondsSkipped: 0,
  skipTimeTimeout: null,
  ignoredAudioTracks: [],
  ignoredTextTracks: [],
  isLG: false,

  init: function (successCallback) {

    this.currentBrand = CONFIG.app.brand;
    this.$container = $("#divVideoContainer");
    this.$player = videojs('mainVideo');
    this.$playerDiv = $(this.$player.el_);
    this.ignoredAudioTracks = ["SoundHandler"];
    this.ignoredTextTracks = ["SoundHandler"];
    this.isLG = Device.isLG || Device.isWEBOS;

    this.vodControlsEnum = {
      play: "play-pause",
      next: "next-episode",
      tracks: "tracks",
      back: "back",
      trackItem: "track-item",
      forwardX: 'forwardx',
      backX: 'backx',
      start: 'start',
      end: 'end',
      epg: 'epg',
      sideMenu: 'side-menu',
      favorite: "favorite",
      unfavorite: "unfavorite",
      lock: "lock",
      info: "info",
      seekbar: "seekbar",
      lock: "lock",
      unlock: "unlock",
    }

    // set initial player dimensions based on screen height
    this.heightInitial = $(window).height() * 0.3;
    this.widthInitial = (16 / 9 - 1) * this.heightInitial + this.heightInitial;
    this.$container.width(this.widthInitial);
    this.$container.height(this.heightInitial);
    this.$container.parent().height(this.heightInitial + 5);
    this.$container.parent().parent().height(this.heightInitial + 5);
    this.$container.find("#mainVideo").css({ "width": "100%", "height": "100%" });

    this.$container.find("#mainVideo").prepend("<div class='channel-number-indicator'><span></span></div>");

    this.$player.options_.inactivityTimeout = 0;
    this.$controlBar = this.$playerDiv.find(".vjs-control-bar:first");
    this.$controlBar.addClass(".hide-controls");
    this.$controlBar.find(".vjs-remaining-time").hide();

    //init VOD controls
    //this.$controlBar.append($("#nbVjsControlsTemplate").html());
    $("#nbVjsControlsTemplate").remove();

    this.$controlBar.append($("#matControlsTemplate").html());
    $("#matControlsTemplate").remove();

    //this.$seekbar = this.$controlBar.find(".vjs-play-progress:first");
    this.$seekbar = this.$controlBar.find(".nb-seekbar:first");
    this.$seekbarBar = this.$seekbar.find("div:first");
    this.$itemImageDiv = this.$controlBar.find(".vjs-nb-item-image:first");
    this.$itemImageImg = this.$itemImageDiv.find("img:first");
    this.$vodControls = this.$controlBar.find(".mat-controls");

    //buttons
    //this.$backButton = this.$vodControls.find("div[data-type='back']:first"); //regreso boton de back
    this.$sideMenuButton = this.$vodControls.find("div[data-type='side-menu']:first");
    this.$vodTracksButton = this.$vodControls.find("div[data-type='tracks']:first");
    this.$vodTracksDiv = this.$vodControls.find(".nb-vjs-tracks-div");
    this.$infoButton = this.$vodControls.find("div[data-type='info']:first");
    this.$goToStartButton = this.$vodControls.find("div[data-type='start']:first");
    this.$backXButton = this.$vodControls.find("div[data-type='backx']:first");
    this.$playPauseButton = this.$vodControls.find("div[data-type='play-pause']:first");
    this.$playIcon = this.$playPauseButton.find("span[data-type='play']:first");
    this.$pauseIcon = this.$playPauseButton.find("span[data-type='pause']:first");
    this.$forwardXButton = this.$vodControls.find("div[data-type='forwardx']:first");
    this.$goToEndButton = this.$vodControls.find("div[data-type='end']:first");
    this.$favoriteButton = this.$vodControls.find("div[data-type='favorite']:first");
    this.$unfavoriteButton = this.$vodControls.find("div[data-type='unfavorite']:first");
    this.$favoritedIcon = this.$playPauseButton.find("span[data-type='favorited']:first");
    this.$addFavoriteIcon = this.$playPauseButton.find("span[data-type='add-favorite']:first");
    this.$lockButton = this.$vodControls.find("div[data-type='lock']:first");
    this.$unlockButton = this.$vodControls.find("div[data-type='unlock']:first");
    this.$noLockIcon = this.$playPauseButton.find("span[data-type='no-lock']:first");
    this.$lockedIcon = this.$playPauseButton.find("span[data-type='locked']:first");
    this.$goToEpgButton = this.$vodControls.find("div[data-type='epg']:first");
    this.$nextEpisodeButton = this.$vodControls.find("div[data-type='next-episode']");

    //labels
    this.$epgNowLabel = this.$vodControls.find(".nb-vjs-epg-now:first");
    this.$epgNowTimeLabel = this.$vodControls.find(".nb-vjs-epg-now-time:first");
    this.$epgNextLabel = this.$vodControls.find(".nb-vjs-epg-next:first");
    this.$titleContentLabel = this.$vodControls.find(".nb-vjs-vod-title:first");
    this.$epgDataTr = this.$vodControls.find(".nb-vjs-epg-data-tr:first");
    this.$seekbarCurrentTime = this.$controlBar.find(".nb-vjs-vod-current-time:first");
    this.$seekbarLeftTime = this.$controlBar.find(".nb-vjs-vod-duration:first");
    //this.$backButton = this.$controlBar.find(".nb-vjs-back-button:first");

    //add tooltips elements to each focusable items
    this.$vodControls.find(".mat-controls-item-control.focusable").append("<span class='nb-vjs-tooltip'></span>");

    //set default texts and values
    this.$vodTracksButton.find(".nb-vjs-tooltip").html(__("PlayerTracksSubtitlesTitle"));
    this.$nextEpisodeButton.find(".nb-vjs-tooltip").html(__("PlayerNextEpisodeTooltip"));
    this.$goToStartButton.find(".nb-vjs-tooltip").html(__("PlayerStartButtonTooltip"));
    this.$backXButton.find(".nb-vjs-tooltip").html(__("PlayerBackXButtonTooltip").replaceAll("%s", this.defaultSkipSeconds));
    this.$forwardXButton.find(".nb-vjs-tooltip").html(__("PlayerForwardXButtonTooltip").replaceAll("%s", this.defaultSkipSeconds));
    this.$goToStartButton.find(".nb-vjs-tooltip").html(__("PlayerStartButtonTooltip"));
    this.$goToEndButton.find(".nb-vjs-tooltip").html(__("PlayerEndButtonTooltip"));
    this.$vodControls.find(".nb-vjs-tracks-audio-title").html(__("PlayerTracksAudioTitle"));
    this.$vodControls.find(".nb-vjs-tracks-subtitles-title").html(__("PlayerTracksSubtitlesTitle"));
    this.$goToEpgButton.find(".nb-vjs-tooltip").html(__("EPGTitle"));
    this.$sideMenuButton.find(".nb-vjs-tooltip").html(__("PlayerChannelList"));
    this.$infoButton.find(".nb-vjs-tooltip").html(__("PlayerChannelInfo"));
    this.$favoriteButton.find(".nb-vjs-tooltip").html(__("PlayerFavorite"));
    this.$unfavoriteButton.find(".nb-vjs-tooltip").html(__("PlayerUnfavorite"));
    this.$lockButton.find(".nb-vjs-tooltip").html(__("PlayerLockChannel"));
    this.$unlockButton.find(".nb-vjs-tooltip").html(__("PlayerUnlockChannel"));

    $(".vjs-menu-item").addClass("focusable");

    var self = this;
    this.$player.on("pause", function () {
      self.$pauseIcon.hide();
      self.$playIcon.show();
    })

    this.$player.on("play", function () {
      self.$playIcon.hide();
      self.$pauseIcon.show();
    });

    //se adiciono este codigo para el fullscreen
    this.$player.on('fullscreenchange', function () {
      setTimeout(function () {
        if (self.isFullscreen()) {
          $(self.$player.el_).find(".video-cover").hide();
          self.deactivateControls(false);
        } else {
          $(self.$player.el_).find(".video-cover").show();
          self.closeSideMenu();
          self.hideControls();
          self.deactivateControls(true);
        }
      }, 800);
    });

    this.$playerDiv.parent().prepend('<div class="video-cover"></div>');

    if (successCallback != null && typeof successCallback != 'undefined') {
      successCallback();
    }

    this.$seekbar.click(function (e) {
      var newPercent = ((e.pageX - $(this).offset().left) / $(this).width());
      self.seekbarClicked(newPercent);
    });

    //hide original controls
    $(".vjs-progress-control").hide();
    $(".vjs-control-bar>div,.vjs-control-bar>button").css({ "visibility": "hidden" });
    this.$controlBar.find(".vjs-subs-caps-button").css({ "visibility": "hidden" });
    this.$controlBar.find(".vjs-audio-button").css({ "visibility": "hidden" });
    this.$controlBar.find(".vjs-current-time").css({ "visibility": "hidden" });
    this.$controlBar.find(".vjs-duration").css({ "visibility": "hidden" });

    this.$controlBar.addClass("nb-vjs-custom-controls-div");
    this.$vodControls.css({ "visibility": "visible" });
    this.$vodControls.show();

    var $mainVideo = this.$container.find("#mainVideo");
    if ($mainVideo.find(".side-menu-player-container").length == 0) {
      this.$container.find("#mainVideo").prepend("<div class='side-menu-player-container'><div class='side-menu-player'></div></div>");
      this.$sideMenuContainer = $mainVideo.find(".side-menu-player-container");
      this.$sideMenu = $mainVideo.find(".side-menu-player");
    }

    this.$mainVideo = $mainVideo;
    EPGDetails.init($mainVideo);
  },

  //se comento todo el codigo y solo se dejo la parte final
  requestFullscreen: function () {
    //var self = this;
    //this.$container.addClass("video_full");
    //console.log(this.$container)
    //this.$player.requestFullscreen();
    //this.showControls();
    //animated way (experimental)
    // var videoFull = {
    //   'width' : '100vw',
    //   'height' : '100vh',
    //   "border": "0px",
    //   "margin": "0",
    //   "left": "0",
    //   "top": "0",
    //   "object-position": "0%"
    // };

    // var self = this;
    // $('.video-container').addClass("video_full");
    // $('.video-container').animate(videoFull, 500, function () {
    //   self.showControls();
    // });
    try {
      //this.deactivateControls(false);
      var self = this;
      this.$player.requestFullscreen();
      setTimeout(function () {
        self.showControls();
      }, 100);
    } catch (e) { }

  },

  isPaused: function () {
    return this.$player.paused();
  },

  navigate: function ($focused, direction) {
    var $current = $focused;

    if (EPGDetails.isShowed()) {
      EPGDetails.navigate(direction);
      return;
    }

    if (ParentalControlDlg.isShowed()) {
      ParentalControlDlg.navigate(direction);
      return;
    }

    var $focusContainer = $current.parent(".mat-controls-item");

    //if ($focusContainer.length > 0 || $current.closest(".nb-vjs-tracks-div").length > 0) {
    if (!this.isSideMenuOpened()) {
      var $focusTo = [];
      var $nbVjsList = [];

      if (!this.nbPlayerAreControslActive()) {
        this.showControls();
        return;
      }

      if ((CONFIG.app.brand == "fotelka") && this.nbPlayerAreControslActive() && (direction == "up" || direction == "down") && !this.isTracksMenuOpened()) {
        if (direction == "up") {
          this.homeObject.channelUp();
        } else if (direction == "down") {
          this.homeObject.channelDown();
        }
        return;
      } else if ($current.is(this.$seekbar)) {
        if (direction == "left") {
          this.backXAction();
        } else if (direction == "right") {
          this.forwardXAction();
        } else if (direction == "up") {
          $focusTo = this.$vodControls.find(".focusable:visible:first");
        }
      } else if (this.isTracksMenuOpened()) {
        $focusTo = this.navigateTracks($current, direction);
      } else if ($current.closest(".mat-controls-row").index() == 0 && (direction == "down")) {
        if (this.$seekbar.is(":visible")) {
          $focusTo = this.$seekbar;
        }
      } else {
        if (direction == "left") {
          $nbVjsList = $current.closest(".mat-controls-item").prevAll(".mat-controls-item:has(.focusable:visible)");
        } else if (direction == "right") {
          $nbVjsList = $current.closest(".mat-controls-item").nextAll(".mat-controls-item:has(.focusable:visible)");
        }

        if ($nbVjsList != null && $nbVjsList.length > 0) {
          $nbVjsList.each(function (idx, item) {
            var focusable = $(item).find(".focusable:visible:first");
            if (focusable.length > 0) {
              $focusTo = focusable;
              return false;
            }
          });
        }
      }

      if ($focusTo.length > 0 && !$focusTo.is(this.$seekbar)) {
        $(".nb-vjs-tooltip").hide();
        this.setFocusTo($focusTo);
      }

      this.resetAutoHideControls();
      return;
    } else if (this.isSideMenuOpened()) { //navigate on side menu
      if (direction == "up" || direction == "down") {
        if (direction == "down") {
          $focusTo = $current.next(".focusable:first");
        } else {
          $focusTo = $current.prev(".focusable:first");
        }
      }

      if ($focusTo.length > 0) {
        Focus.to($focusTo);
        this.setSideMenuScroll();
      }
    }

    this.resetAutoHideControls();
  },

  getFocused: function () {
    return Focus.focused;
  },

  setFocusTo: function ($el) {
    if ($el && $el.length > 0) {
      Focus.to($el);
    }
  },

  manageOnEnter: function ($el, callbackNext, callbackRestartFocus, callbackGoToEpg) {

    if ($el.is(this.$container)) {
      if (this.isSideMenuOpened()) {
        this.closeSideMenu();
      }
      return;
    }

    $el = !$el || $el == null ? this.getFocused() : $el;
    console.log("nbPlayer: manageOnEnter");
    if (EPGDetails.isShowed()) {
      EPGDetails.onEnter($el);
    } else if (ParentalControlDlg.isShowed()) {
      ParentalControlDlg.onEnter($el);
    } else if (this.isSideMenuOpened()) {
      console.log("nbPlayer: manageOnEnter this.isSideMenuOpened(): " + this.isSideMenuOpened());
      var id = this.getFocused().data("id");
      console.log("nbPlayer: manageOnEnter id: " + id);

      if (!id) {
        return;
      }
      var serviceTV = AppData.getServiceTV(id);
      this.homeObject.playServiceTVByChannel(serviceTV);
      // codigo para cerrar el menu latera cuando se selecciona un canal
      if (this.isSideMenuOpened() && CONFIG.app.brand === "fotelka") {
        this.closeSideMenu();
        return;
      }
    } else if (!this.nbPlayerAreControslActive()) {
      console.log("nbPlayer: manageOnEnter !this.nbPlayerAreControslActive(): " + !this.nbPlayerAreControslActive());
      this.showControls();
      this.focusOnFirstElement();
    } else {

      if (this.isTracksMenuOpened()) {
        this.closeTracks();
      }

      switch (this.vodPlayerGetControlType($el)) {
        case this.vodControlsEnum.play:
          if (this.isPaused()) {
            this.$player.play();
          } else {
            this.$player.pause();
          }
          break;
        case this.vodControlsEnum.next:
          callbackNext();
          break;
        case this.vodControlsEnum.tracks:
          var $first = this.openTracks();
          if ($first.length > 0) {
            Focus.to($first);
          }
          break;
        case this.vodControlsEnum.back:
          var self = this;
          this.exitFullscreen(function () {
            //self.restartFocus();
            callbackRestartFocus();
          });
          break;
        case this.vodControlsEnum.trackItem:
          this.selectTrack($el);
          break;
        case this.vodControlsEnum.backX:
          this.backXAction();
          break;
        case this.vodControlsEnum.forwardX:
          this.forwardXAction();
          break;
        case this.vodControlsEnum.start:
          this.start();
          break;
        case this.vodControlsEnum.end:
          this.end();
          break;
        case this.vodControlsEnum.sideMenu:
          this.openSideMenu();
          break;
        case this.vodControlsEnum.favorite:
          this.onFavorite();
          break;
        case this.vodControlsEnum.lock:
          this.onToggleLock();
          break;
        case this.vodControlsEnum.info:
          EPGDetails.show(this.$container.find("#mainVideo"), this.homeObject.playbackMetadata, this.homeObject, Focus.focused);
          break;
        case this.vodControlsEnum.epg:
          this.exitFullscreen(function () {
            callbackGoToEpg();
          });
          break;
      }
    }
  },

  playContent: function (type, url) {
    var self = this;
    this.$player.pause();
    this.nbPlayerResetContent();
    this.currentType = type;
    this.isLive = this.currentType == "service";
    this.$player.src({
      src: url,
      type: 'application/x-mpegURL',
      //src: "https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8"
      //src: "http://190.171.101.36/AXN/index.m3u8"
      //src: "https://news.cgtn.com/resource/live/english/cgtn-news.m3u8"
      //src: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
    });

    //this.showVODControls();

    this.$container.find(".video-cover").hide();
    this.$controlBar.addClass("nb-vjs-custom-controls-div");
    this.$vodControls.css({ "visibility": "visible" });
    this.$vodControls.show();

    this.seekbarLiveInitialTime = 0;
    this.seekbarLiveInitialDate = null;
    this.seekbarLiveSecondsLate = 0;

    this.$player.off('loadedmetadata');
    this.$player.on('loadedmetadata', function () {
      self.playerLoadedMetadata();
      // if (!self.isLG) {
      // }
    });

    this.$player.off('loadeddata');
    this.$player.on('loadeddata', function () {
      self.playerLoaded();
    });

    //prepare controls
    this.$vodTracksButton.hide();
    if (this.isLive && this.currentBrand != "bromteck" && this.currentBrand != "fotelka") {
      this.$playPauseButton.hide();
      this.$backXButton.hide();
      this.$forwardXButton.hide();
      this.$goToStartButton.hide();
      this.$goToEndButton.hide();
    } else {
      this.$playPauseButton.show();
      this.$backXButton.show();
      this.$forwardXButton.show();
      this.$goToStartButton.show();
      this.$goToEndButton.show();
    }

    if (this.isLive) {
      this.$seekbar.removeClass("focusable");
      this.$seekbar.css("pointer-events", "none");
    } else {
      this.$seekbar.addClass("focusable");
      this.$seekbar.css("pointer-events", "auto");
    }
  },

  playerLoaded: function () {

    this.seekbarLiveInitialTime = this.$player.currentTime();
    this.seekbarLiveInitialDate = this.getCurrentServerTime();
    //check if has tracks (audio or subtitle) to show button
    if (this.getPlayerAudioTracks().length > 0 || this.getPlayerTextTracks().length > 0) {
      this.$vodTracksButton.show();
    } else {
      this.$vodTracksButton.hide();
    }
  },

  playerLoadedMetadata: function () {
    var audio, subtitle;
    // var audio = User.getPlayerAudioLang();
    // var subtitle = User.getPlayerSubtitleLang();

    var serviceTV = this.getCurrentServiceTV();
    if (serviceTV == null) {
      return;
    }

    var data = User.getAudioAndSubtitle(serviceTV.epgStreamId);
    if (data && data.length > 0) {
      audio = data.length >= 1 ? data[0] : null;
      subtitle = data.length >= 2 ? data[1] : null;
    }

    //debugger;
    if (audio) {
      this.setAudioByProperty("label", audio);
    } else {
      audio = Device.getLanguageIso6392(); //get device language
      if (audio) {
        this.setAudioByProperty("language", audio);
      }
    }

    if (subtitle) {
      this.setSubtitleByProperty("label", subtitle);
    }
  },

  getPlayerAudioTracks: function () {
    if (this.$player.audioTracks().tracks_.length > 0) {
      var self = this;
      return this.$player.audioTracks().tracks_.filter(function (track) {
        return self.ignoredAudioTracks.indexOf(track.label) < 0;
      });
    }

    return [];
  },

  getPlayerTextTracks: function () {
    if (this.$player.textTracks().tracks_.length > 0) {
      var self = this;
      return this.$player.textTracks().tracks_.filter(function (track) {
        return self.ignoredTextTracks.indexOf(track.label) < 0;
      });
    }

    return [];
  },

  clearTextTracks: function () {
    if (this.$player.textTracks().tracks_.length > 0) {
      var self = this;
      this.$player.textTracks().tracks_.forEach(function (track) {
        self.$player.textTracks().removeTrack(track);
      });
    }
  },

  setPlayerMetadata: function (metadata) {
    label = "";
    label = (metadata.titleTop && metadata.titleTop.length > 0) ? metadata.titleTop : "";
    this.$titleContentLabel.html(metadata.titleTop);

    //label = __("EPGAtThisTime") + ": " + ((metadata.epgNow && metadata.epgNow.length > 0) ? metadata.epgNow : __("EPGNoInformation"));
    this.$epgNowLabel.html(metadata.epgNow);
    //label = __("EPGNext") + ": " + ((metadata.epgNext && metadata.epgNext.length > 0) ? metadata.epgNext : __("EPGNoInformation"));
    this.$epgNextLabel.html(metadata.epgNext);

    if (metadata.showNext) {
      this.$nextEpisodeButton.show();
    } else {
      this.$nextEpisodeButton.hide();
    }

    // this.$epgDataTr.hide();
    // this.$playPauseButton.parent().parent().show();
    // this.$seekbar.parent().parent().show();

    this.$favoriteButton.hide();
    this.$unfavoriteButton.hide();
    this.$lockButton.hide();
    this.$unlockButton.hide();
    this.$epgNowTimeLabel.hide();
    this.$itemImageImg.loadImage(metadata.epgImageSrc, metadata.epgImagePlaceholder);
    this.$itemImageDiv.show();

    if (metadata.epgImageStyle && metadata.epgImageStyle.length > 0) {
      this.$itemImageImg.attr("style", metadata.epgImageStyle);
    }

    if (this.homeObject.playbackMetadata.type != "vod") {
      this.$infoButton.show();
      if (metadata.startTime != null && metadata.endTime != null) {
        this.startTime = metadata.startTime;
        this.endTime = metadata.endTime;
        this.duration = getTimeDifference(metadata.startTime, metadata.endTime, 'seconds');
        this.$seekbarBar.css({ "width": "0%" });
        /*var now = this.getCurrentServerTime();
        var current = getTimeDifference(metadata.startTime, now, 'seconds');
        var percent = current/this.duration * 100;
        this.$seekbar.css({"width": percent + "%"});*/
        this.$epgNowTimeLabel.show();
        this.$epgNowTimeLabel.html(getDateFormatted(this.startTime, true) + " - " + getDateFormatted(this.endTime, true));
        this.onProgressLiveContent();
        //this.$epgDataTr.show();

        this.$backXButton.show();
        this.$goToStartButton.show();
        this.$playPauseButton.show();
        this.$forwardXButton.show();
        this.$goToEndButton.show();
        this.$seekbarCurrentTime.show();
        this.$seekbarLeftTime.show();
        this.$seekbar.show();
      } else {
        // this.$playPauseButton.parent().parent().hide();
        // this.$seekbar.parent().parent().hide();
        this.$backXButton.hide();
        this.$goToStartButton.hide();
        this.$playPauseButton.hide();
        this.$forwardXButton.hide();
        this.$goToEndButton.hide();
        this.$seekbarCurrentTime.hide();
        this.$seekbarLeftTime.hide();
        this.$seekbar.hide();
      }


      if (this.homeObject.playbackMetadata.type == "service") {
        if (this.isServiceTVFavorite()) {
          this.$unfavoriteButton.show();
        } else {
          this.$favoriteButton.show();
        }
      }

      if (this.homeObject.playbackMetadata.type == "service" && CONFIG.app.brand != "fotelka") {
        this.$backXButton.hide();
        this.$goToStartButton.hide();
        this.$playPauseButton.hide();
        this.$forwardXButton.hide();
        this.$goToEndButton.hide();
      }
    } else { //vod
      this.$backXButton.show();
      this.$goToStartButton.show();
      this.$playPauseButton.show();
      this.$forwardXButton.show();
      this.$goToEndButton.show();
      this.$seekbarCurrentTime.show();
      this.$seekbarLeftTime.show();
      this.$seekbar.show();
      this.$infoButton.hide();
      this.$itemImageDiv.hide();
    }

    //check if channel is locked/unlocked
    if (this.homeObject.playbackMetadata.type == "service") {
      if (User.hasServiceTVLocked(this.homeObject.playbackMetadata.id)) {
        this.$unlockButton.show();
      } else {
        this.$lockButton.show();
      }
    }

    $(".vjs-progress-control").hide();
    $(".nb-vjs-tooltip").hide();
  },

  vodPlayerGetControlType: function ($object) {

    switch ($object.data("type")) {
      case this.vodControlsEnum.play:
        return this.vodControlsEnum.play;
      case this.vodControlsEnum.next:
        return this.vodControlsEnum.next;
      case this.vodControlsEnum.tracks:
        return this.vodControlsEnum.tracks;
      case this.vodControlsEnum.back:
        return this.vodControlsEnum.back;
      case this.vodControlsEnum.trackItem:
        return this.vodControlsEnum.trackItem;
      case this.vodControlsEnum.forwardX:
        return this.vodControlsEnum.forwardX;
      case this.vodControlsEnum.backX:
        return this.vodControlsEnum.backX;
      case this.vodControlsEnum.start:
        return this.vodControlsEnum.start;
      case this.vodControlsEnum.end:
        return this.vodControlsEnum.end;
      case this.vodControlsEnum.epg:
        return this.vodControlsEnum.epg;
      case this.vodControlsEnum.sideMenu:
        return this.vodControlsEnum.sideMenu;
      case this.vodControlsEnum.favorite:
      case this.vodControlsEnum.unfavorite:
        return this.vodControlsEnum.favorite;
      case this.vodControlsEnum.lock:
      case this.vodControlsEnum.unlock:
        return this.vodControlsEnum.lock;
      case this.vodControlsEnum.info:
        return this.vodControlsEnum.info;
      case this.vodControlsEnum.seekbar:
        return this.vodControlsEnum.seekbar;
      default:
        return false;
    }

    // if ($object.data("type") == this.vodControlsEnum.play) {
    //     return this.vodControlsEnum.play;
    // } else if ($object.hasClass(this.vodControlsEnum.next)) {
    //     return this.vodControlsEnum.next;
    // } else if ($object.hasClass(this.vodControlsEnum.tracks)) {
    //     return this.vodControlsEnum.tracks;
    // } else if ($object.hasClass(this.vodControlsEnum.back)) {
    //     return this.vodControlsEnum.back;
    // } else if ($object.hasClass(this.vodControlsEnum.trackItem)) {
    //     return this.vodControlsEnum.trackItem;
    // } else if ($object.hasClass(this.vodControlsEnum.forwardX)) {
    //     return this.vodControlsEnum.forwardX;
    // } else if ($object.hasClass(this.vodControlsEnum.backX)) {
    //     return this.vodControlsEnum.backX;
    // } else if ($object.hasClass(this.vodControlsEnum.start)) {
    //     return this.vodControlsEnum.start;
    // } else if ($object.hasClass(this.vodControlsEnum.end)) {
    //     return this.vodControlsEnum.end;
    // } else if ($object.hasClass(this.vodControlsEnum.epg)) {
    //     return this.vodControlsEnum.epg;
    // } else if ($object.hasClass(this.vodControlsEnum.sideMenu)) {
    //     return this.vodControlsEnum.sideMenu;
    // }

    // return false;
  },

  openTracks: function () {

    var tracks = "";
    var audioTracks = this.getPlayerAudioTracks();
    var textTracks = this.getPlayerTextTracks();

    if (textTracks.length > 0 || audioTracks.length > 0) {
      var maxIndex = audioTracks.length > (textTracks.length + 1) ? audioTracks.length : (textTracks.length + 1);
      var subitlesDeactivated = textTracks.filter(function (track) { return track.mode == "showing" }).length == 0;
      var activated = "";
      var label = "";
      var trackItem = "";
      var audioIgnored = false;
      var subtitleIgnored = false;

      for (var i = 0; i < maxIndex; i++) {

        trackItem = "";
        audioIgnored = false;
        subtitleIgnored = false;
        // audio
        if (i < audioTracks.length && this.ignoredAudioTracks.indexOf(audioTracks[i].label) < 0) {
          activated = audioTracks[i].enabled ? "" : "hidden";
          label = audioTracks[i].label != null ? audioTracks[i].label : "";
          label = label == "" ? __("PlayerTracksUnknown") : label;
          trackItem += "<td class='nb-vjs-track-item nb-vjs-track-audio focusable' tabindex='1' data-index='" + i + "' data-id='" + audioTracks[i].id + "' data-type='track-item'><i class='fa fa-check " + activated + "'></i>" + label + "</td>";
        } else {
          audioIgnored = true;
          trackItem += "<td></td>";
        }

        // subtitles
        if (i == 0 && textTracks.length > 0) {
          activated = subitlesDeactivated ? "" : "hidden";
          trackItem += "<td class='nb-vjs-track-item nb-vjs-track-subtitle focusable' data-index='-1' data-id='' tabindex='1' data-type='track-item'> <i class='fa fa-check " + activated + "'></i>" + __("PlayerSubtitlesDeactivated") + "</td>";
        } else if ((i - 1) < textTracks.length && textTracks[i - 1] != null && this.ignoredTextTracks.indexOf(textTracks[i-1].label) < 0) {
          label = textTracks[i - 1].label != null ? textTracks[i - 1].label : "";
          label = label == "" ? __("PlayerTracksUnknown") : label;

          activated = (textTracks[i - 1].mode == "showing") ? "" : "hidden";
          trackItem += "<td class='nb-vjs-track-item nb-vjs-track-subtitle focusable' data-index='" + (i - 1) + "' data-id='" + textTracks[i - 1].id + "' tabindex='1' data-type='track-item'> <i class='fa fa-check " + activated + "'></i>" + label + "</td>";
        } else {
          subtitleIgnored = true;
          trackItem += "<td></td>";
        }

        if (!audioIgnored || !subtitleIgnored) {
          tracks += "<tr>" + trackItem + "</tr>";
        }
      }
    }

    if (tracks.length > 0) {
      this.$vodTracksDiv.find("table tbody").html(tracks);

      var subtitles = this.$vodTracksDiv.find("table tbody .nb-vjs-track-subtitle");
      if (subtitles.length > 0) {
        this.$vodTracksDiv.find("table .nb-vjs-track-subtitle").show();
        this.$vodTracksDiv.find("table tbody tr").find("td:eq(1)").show();
      } else {
        this.$vodTracksDiv.find("table .nb-vjs-track-subtitle").hide();
        this.$vodTracksDiv.find("table tbody tr").find("td:eq(1)").hide();
      }

      var audios = this.$vodTracksDiv.find("table tbody .nb-vjs-track-audio");
      if (audios.length > 0) {
        this.$vodTracksDiv.find("table .nb-vjs-track-audio").show();
        this.$vodTracksDiv.find("table tbody tr").find("td:eq(0)").show();
      } else {
        this.$vodTracksDiv.find("table .nb-vjs-track-audio").hide();
        this.$vodTracksDiv.find("table tbody tr").find("td:eq(0)").hide();
      }

      this.$vodTracksDiv.show();
      return this.$vodTracksDiv.find("table tbody tr td.focusable:first");
    } else {
      this.$vodTracksDiv.find("table tbody").html("");
      this.$vodTracksDiv.hide();
      this.$vodTracksButton.hide();
      return [];
    }
  },

  closeTracks: function () {
    if (this.isTracksMenuOpened()) {
      this.$vodTracksDiv.hide();
      Focus.to(this.$vodTracksButton);
    }
  },

  navigateTracks: function ($focused, direction) {
    var $focusTo = [];
    switch (direction) {
      case 'right':
        $focusTo = $focused.next("td");
        break;
      case 'left':
        $focusTo = $focused.prev("td");
        break;
      case 'up':
        $focusTo = $focused.closest("tr").prev("tr").find("td:nth-child(" + ($focused.index() + 1) + ").focusable");
        break;
      case 'down':
        $focusTo = $focused.closest("tr").next("tr").find("td:nth-child(" + ($focused.index() + 1) + ").focusable");
        break;
      default:
        break;
    }

    console.log($focusTo);
    return $focusTo;
  },

  updateChannelTrack: function(type, id) {
    var serviceTV = this.getCurrentServiceTV();
    if (serviceTV) {
      User.setChannelData(serviceTV.epgStreamId, type, id);
    }

    if (type == User.propChannelAudio) {
      User.setPlayerAudioLang(id);
    } else {
      User.setPlayerSubtitleLang(id);
    }
  },

  selectTrack: function ($focused) {
    var id = $focused.data("id");
    var self = this;
    var currentTime = this.$player.currentTime();
    var wasPlaying = !this.$player.paused();

    // Función para aplicar los cambios de track
    const applyTrackChanges = function() {
      if ($focused.hasClass("nb-vjs-track-subtitle")) {
        //tracks.forEach(function (track, index) { if (track.mode == "showing") { track.mode = "hidden"; } })
        User.setPlayerSubtitleLang(null);
        self.$player.textTracks().tracks_.forEach(function (track, index) {
          if (track.id == id && id != "-1") {
            self.$player.textTracks().tracks_[index].mode = "showing";
            //label saved instead of language because sometimes it brings several tracks with
            //the same language but different labels, and Id also because sometimes it changes (especially text tracks)
            self.updateChannelTrack(User.propChannelSubtitles, track.label);
          } else {
            self.$player.textTracks().tracks_[index].mode = "hidden";
          }
        });
          self.$vodTracksDiv.find(".nb-vjs-track-subtitle").find("i").addClass("hidden");
      } else {
        //this.$player.audioTracks().tracks_.forEach(function (track, index) { if (track.enabled == true) { track.mode = false; } })
        //this.$player.audioTracks().tracks_[index].enabled = true;
        User.setPlayerAudioLang(null);
        self.$player.audioTracks().tracks_.forEach(function (track, index) {
          if (track.id == id) {
            self.$player.audioTracks().tracks_[index].enabled = true;
            //label saved instead of language because sometimes it brings several tracks with
            //the same language but different labels, and Id also because sometimes it changes (especially text tracks)
            self.updateChannelTrack(User.propChannelAudio, track.label);
          } else {
            self.$player.audioTracks().tracks_[index].enabled = false;
          }
        });
        self.$vodTracksDiv.find(".nb-vjs-track-audio").find("i").addClass("hidden");
      }
    };

      // Manejo específico para LG
      // if (Device.isLG || Device.isWEBOS) {
        //this.$player.pause();
        // Aplicar cambios y recargar
        //applyTrackChanges();
        //this.$player.load();
        // Esperar a que el video esté listo
        //this.$player.one('loadeddata', function() {
          // Restaurar posición y estado
          //self.$player.currentTime(currentTime);
          //if (wasPlaying) {
            //self.$player.play();
          //}
        //});
        // Manejar error de carga
        //this.$player.one('error', function(error) {
          //console.error('Error al cargar el video después de cambiar la pista:', error);
        //});
      //} else {
        // Comportamiento normal para otros dispositivos
        //applyTrackChanges();
        //this.$player.one('loadeddata', function() {
          //self.$player.currentTime(currentTime);
          //if (wasPlaying) {
            //self.$player.play();
          //}
        //});
      //}
      $focused.find("i").removeClass("hidden");
  },
  setAudioByProperty: function (property, propertyValue) {
    var self = this;

    console.log("Changing audio to " + propertyValue);
    this.$player.audioTracks().tracks_.forEach(function (track, index) {
      try {
        if (track[property] && track[property] == propertyValue) {
          self.$player.audioTracks().tracks_[index].enabled = true;
        } else {
          self.$player.audioTracks().tracks_[index].enabled = false;
        }
      } catch(ex) {
        console.log(ex);
      }
    });

    this.$vodTracksDiv.find(".nb-vjs-track-audio").find("i").addClass("hidden");
  },

  setSubtitleByProperty: function (property, propertyValue) {
    var self = this;

    this.$player.textTracks().tracks_.forEach(function (track, index) {
      if (track[property] && track[property] == propertyValue) {
        self.$player.textTracks().tracks_[index].mode = "showing";
      } else {
        self.$player.textTracks().tracks_[index].mode = "hidden";
      }
    });

    this.$vodTracksDiv.find(".nb-vjs-track-subtitle").find("i").addClass("hidden");
  },

  resetAutoHideControls: function () {
    var self = this;
    clearTimeout(this.inactivityTimeout);
    this.inactivityTimeout = setTimeout(function () {
      self.hideControls();
    }, 6000);
  },

  showControls: function () {
    if (this.isSideMenuOpened()) {
      this.focusOnSideMenu();
      return;
    }

    this.$player.userActive(true);

    var self = this;
    self.focusOnFirstElement();
    self.resetAutoHideControls();
    // setTimeout(function () {
    //   $(".nb-vjs-tooltip").hide();
    //   //$(".nb-vjs-custom-controls-div").show();
    //   self.focusOnFirstElement();
    //   self.resetAutoHideControls();
    // }, 500);
  },

  hideControls: function () {
    var self = this;
    this.closeTracks();
    $(".vjs-menu").hide();
    // this.cancelSeekTimeIndicator();
    $(".nb-vjs-tooltip").hide();
    setTimeout(function () {
      self.$player.userActive(false);
    }, 100);
    //$(".nb-vjs-custom-controls-div").hide();
  },

  backXAction: function () {
    this.skip(-this.defaultSkipSeconds);
  },

  forwardXAction: function () {
    this.skip(this.defaultSkipSeconds);
  },

  start: function () {
    if (this.isLive) {
      this.goToStartLive();
    } else {
      this.$player.currentTime(0);
    }
  },

  end: function () {
    if (this.isLive) {
      this.goToLivePoint();
    } else {
      this.$player.currentTime(this.$player.duration() - this.defaultSkipSeconds);
    }
  },

  skip: function (seconds) {
    if (this.isLive) {
      this.skipTimeLive(seconds);
    } else {
      //this.$player.currentTime(this.$player.currentTime() + seconds);
      this.skipTimeVOD(seconds);
    }

    this.resetAutoHideControls();
  },

  nbPlayerResetContent: function (minimize) {
    this.hideControls();

    if (minimize && this.isFullscreen()) {
      this.exitFullscreen(function () { });
    }

    this.$player.errorDisplay.close();
    this.$player.reset();
    this.$player.hasStarted(false);
    this.$player.currentTime(0);
    this.currentPercent = 0;
    this.isLive = false;
    this.startTime = null;
    this.endTime = null;
    this.duration = null;
    this.callbackOnEnded = null;
    this.clearTextTracks();
  },

  nbPlayerAreControslActive: function () {
    return this.$player && this.$player.userActive();
  },

  //modificacion de codigo para que oculte los botones cuando no esta en video
  exitFullscreen: function (callback) {
    if (EPGDetails.isShowed()) {
      EPGDetails.close();
    }

    this.hideControls();
    this.$player.exitFullscreen();
    this.deactivateControls(true);
    callback();
  },

  onReturn: function ($el, playbackMetadata, callback) {
    if (EPGDetails.isShowed()) {
      EPGDetails.close();
    } else if (this.nbPlayerAreControslActive()) {
      if (this.isTracksMenuOpened()) {
        this.closeTracks();
        Focus.to(this.$vodTracksButton);
      } else {
        this.hideControls();
      }
    } else if (this.isSideMenuOpened()) {
      this.closeSideMenu();
    } else {
      // this.cancelSeekTimeIndicator();
      this.exitFullscreen(callback);
    }
  },

  //funcion para maximias
  isFullscreen: function () {
    return this.$player.isFullscreen_;
    //return this.$container.hasClass("video_full");
  },

  setTextTrack: function (index) {

    var tracks = this.$player.textTracks();

    for (var i = 0; i < tracks.length; i++) {
      tracks[i].mode = 'hidden';
    }

    if (index > 1) {
      this.$player.textTracks()[index - 2].mode = "showing";
    }
  },

  onProgressEverySecond: function (time) {
    if (time == this.lastTime) {
      return;
    }

    this.lastTime = time;

    if (this.isLive) {
      this.onProgressLiveContent();
    } else {
      this.onProgressVOD(time);
    }
  },

  onProgressLiveContent: function () {

    if (this.startTime == null || this.endTime == null || this.duration == 0 || this.seekbarLiveInitialDate == null) {
      return;
    }

    var now = this.getCurrentLiveProgressTime();
    var currentSeconds = getTimeDifference(this.startTime, now, 'seconds');
    this.currentPercent = currentSeconds / this.duration * 100;

    if (this.currentPercent <= 100) {
      this.$seekbarBar.css({ "width": this.currentPercent + "%" });
      //this.$seekbarBar.find("div:last").html(getStringDate(now, "HH:mm:ss") + " (" + parseInt(this.currentPercent) + "%)");
      this.$seekbarCurrentTime.html(secondsToTimeString(currentSeconds));
      this.$seekbarLeftTime.html(secondsToTimeString(getTimeDifference(now, this.endTime, 'seconds')));
    } else {
      if (this.callbackOnEnded != null) {
        this.callbackOnEnded();
      }
    }
  },

  onProgressVOD: function (time) {
    var duration = this.$player.duration();

    if (duration <= 0 || isNaN(duration)) {
      this.$seekbarBar.css({ "width": "0%" });
      this.$seekbarCurrentTime.html("--:--");
      this.$seekbarLeftTime.html("--:--");
      return;
    }

    this.currentPercent = time / duration * 100;
    if (this.currentPercent > 100) {
      return;
    }

    var progress = !isNaN(this.currentPercent) ? this.currentPercent : 0;
    this.$seekbarBar.css({ "width": progress + "%" });
    this.$seekbarCurrentTime.html(secondsToTimeString(time));
    this.$seekbarLeftTime.html(secondsToTimeString(duration - time));
  },

  /**
   * Returns the current progress of live content in date (moment) format
   * @returns Date (moment)
   */
  getCurrentLiveProgressTime: function () {
    var diffNow = getTimeDifference(this.seekbarLiveInitialDate, this.getCurrentServerTime(), 'seconds') - this.seekbarLiveSecondsLate;
    var now = addSeconds(this.seekbarLiveInitialDate, diffNow);
    //console.log(" now: " + now);

    return now;
  },

  setEvents: function (callbackOnProgress, callbackOnError, callbackOnEnded) {
    var self = this;

    this.$player.off('timeupdate');
    this.$player.on('timeupdate', function (event) {
      var time = parseInt(self.$player.currentTime());
      self.onProgressEverySecond(time);
      callbackOnProgress(time);
    });

    this.$player.off('error');
    this.$player.on('error', function (error) {
      callbackOnError(error);
    });

    if (this.isLive) {
      this.callbackOnEnded = callbackOnEnded;
    } else {
      this.$player.off('ended');
      this.$player.on('ended', function () {
        callbackOnEnded();
      });
    }
  },

  goToLivePoint: function () {
    this.seekbarLiveSecondsLate = 0;
    this.$player.currentTime(this.getLiveCurrentTime());
  },

  goToStartLive: function () {
    var secondsNow = getTimeDifference(this.startTime, this.seekbarLiveInitialDate, 'seconds');
    var newTime = this.seekbarLiveInitialTime - secondsNow;
    this.seekbarLiveSecondsLate = getTimeDifference(this.startTime, getTodayDate(), 'seconds');
    this.$player.currentTime(newTime);
  },

  getLiveCurrentTime: function () {
    var diff = getTimeDifference(this.seekbarLiveInitialDate, this.getCurrentServerTime(), 'seconds');

    return this.seekbarLiveInitialTime + diff;
  },

  getCurrentServerTime: function () {
    return getTodayDate();
  },

  /**
   *
   * @param {int} newPercent: value between 0 and 1
   */
  seekbarClicked: function (newPercent) {

    if (this.isLive) {
      var current = (newPercent * this.duration);
      var newPointDate = addSeconds(this.startTime, current);
      var now = this.getCurrentServerTime();
      var diffNow = getTimeDifference(this.seekbarLiveInitialDate, now, 'seconds');
      var newSecondsLate = getRealTimeDifference(newPointDate, now, 'seconds');

      if ((this.seekbarLiveInitialTime + diffNow + newSecondsLate) <= this.getLiveCurrentTime()) {
        this.seekbarLiveSecondsLate = Math.abs(newSecondsLate);
        newPercent *= 100;
        this.$seekbarBar.css({ "width": newPercent + "%" });

        this.$player.currentTime(this.seekbarLiveInitialTime + diffNow - this.seekbarLiveSecondsLate);
      } else {
        this.goToLivePoint();
      }
    } else {

      var duration = this.$player.duration();
      if (duration <= 0) {
        return;
      }

      var newSeconds = (newPercent * duration);

      if (newSeconds >= 0 && newSeconds <= duration) {
        this.$player.currentTime(newSeconds);
      }
    }

  },

  skipTimeLive: function (seconds) {

    // var sec = (this.currentPercent * this.duration) / 100;
    // sec += seconds;
    // var newPercent = sec / this.duration;

    // this.seekbarClicked(newPercent);
    this.$player.pause();
    clearTimeout(this.skipTimeTimeout);
    this.skipTimeTimeout = null;

    this.secondsSkipped = (this.secondsSkipped == 0 ? (this.$player.currentTime()) : this.secondsSkipped) + seconds;
    this.seekbarLiveSecondsLate += seconds * -1;
    this.onProgressEverySecond(this.secondsSkipped);
    console.log("Skip live to " + this.secondsSkipped);

    var self = this;
    this.skipTimeTimeout = setTimeout(function() {
      var skipped = self.secondsSkipped - self.$player.currentTime();
      console.log("Total skipped " + skipped);

      var sec = (self.currentPercent * self.duration) / 100;
      sec += skipped;
      console.log("Total skipped seconds" + sec);

      var newPercent = sec / self.duration;
      console.log("Live new percent " + newPercent);

      self.seekbarClicked(newPercent);
      self.$player.play();
      self.secondsSkipped = 0;
    }, 1000);
  },

  skipTimeVOD: function(seconds) {
    this.$player.pause();
    clearTimeout(this.skipTimeTimeout);
    this.skipTimeTimeout = null;
    this.secondsSkipped = (this.secondsSkipped == 0 ? (this.$player.currentTime()) : this.secondsSkipped) + seconds;
    console.log("Skip to "+this.secondsSkipped);
    this.onProgressEverySecond(this.secondsSkipped);

    var self = this;
    this.skipTimeTimeout = setTimeout(function() {
      self.$player.currentTime(self.secondsSkipped);
      self.$player.play();
      self.secondsSkipped = 0;
    }, 1000);
  },

  focusOnFirstElement: function () {
    if (this.$playPauseButton.is(":visible")) {
      this.setFocusTo(this.$playPauseButton);
    } else {
      this.setFocusTo(this.$vodControls.find(".focusable:visible:first"));
    }
  },

  deactivateControls: function (deactivate) {
    if (deactivate) {
      this.$player.controlBar.hide();
    } else {
      this.$player.controlBar.show();
    }
  },

  isSideMenuOpened: function () {
    return this.$sideMenuContainer.is(":visible");
  },

  openSideMenu: function () {
    this.deactivateControls(true);
    this.hideControls();
    this.$sideMenuContainer.show();
    this.fillSideMenu();
    this.focusOnSideMenu();
    this.$sideMenu.scrollTop(this.getFocused().height() * this.getFocused().index());
  },

  closeSideMenu: function () {
    this.deactivateControls(false);
    this.hideControls();
    this.$sideMenuContainer.fadeOut(250);
  },

  fillSideMenu: function () {

    if (this.$sideMenu.find(".focusable").length > 0) {
      return;
    }

    var html = "<div class='v-carrousel'>";
    //web
    if (Device.isDEFAULT) {
      html += "<div class='side-menu-close' onclick='nbPlayer.closeSideMenu()'>X</div>";
    }
    //web
    var channels = AppData.channels;
    var channel, style;

    for (var i = 0; i < channels.length; i++) {
      style = "";
      channel = channels[i];

      if (channel.backgroundColor != null && typeof channel.backgroundColor != 'undefined') {
        style = " background-color: #" + channel.backgroundColor;
      }

      var serviceTV = AppData.getServiceTV(channel.id);
      var liveEvent = AppData.getLiveEvent(serviceTV);
      var showName = "";
      if (liveEvent != null) {
        showName = (liveEvent.languages.length > 0 ? liveEvent.languages[0].title : "");
      }

      html += "<div class='v-carrousel-item focusable' data-id='" + channel.id + "' tabindex='0'>"
        + "<div class='v-carrousel-image' style='" + style + "'><img src='" + channel.img + "' ></div>"
        + "<div class='v-carrousel-desc'>"
        + "<div class='v-carrousel-title'>" + channel.lcn + " " + channel.name + "</div>"
        + "<div class='v-carrousel-subtitle'>" + showName + "</div>"
        + "</div>"
        + "</div>";
    }
    html += "</div>";

    this.$sideMenu.scrollTop(0);
    this.$sideMenu.html(html);
    //Focus.to(this.$sideMenu.find(".focusable:first"));
  },

  onFocus: function () {
    $(".nb-vjs-tooltip").hide();

    var $focused = this.getFocused();
    if (this.isSideMenuOpened()) {
      var id = $focused.data("id");

      if (!id) {
        return;
      }

      //Focus.focused.parent().find(".v-carrousel-item").css({"background-color": "transparent"});
      //Focus.focused.css({"background-color": CONFIG_CURRENT_BRAND.epgLineColorTime});
      var $showName = $focused.find(".v-carrousel-subtitle");
      var serviceTV = AppData.getServiceTV(id);

      $showName.html(__("EPGLoading")); // Mostrar mensaje de "Cargando"

      AppData.getSimpleEpgByChannel(id, function () {
        var liveEvent = AppData.getLiveEvent(serviceTV);
        if (liveEvent != null) {
          $showName.html((liveEvent.languages.length > 0 ? liveEvent.languages[0].title : ""));
        } else {
          $showName.html(__("EPGItemNoData"));
        }
      });
    } else if ($focused.find(".nb-vjs-tooltip").length > 0) {
      $focused.find(".nb-vjs-tooltip").show();
    }
  },

  focusOnSideMenu: function () {
    var $focusTo = null;
    if (this.homeObject.playbackMetadata.type == "service") {
      $focusTo = this.$sideMenu.find(".focusable[data-id='" + this.homeObject.playbackMetadata.id + "']:first");
    } else {
      $focusTo = this.$sideMenu.find(".focusable:first");
    }

    if ($focusTo) {
      this.setFocusTo($focusTo);
      this.setSideMenuScroll();
    }
  },

  setSideMenuScroll: function () {
    var $focusTo = this.getFocused();
    var currentTop = $focusTo.position().top;
    if (currentTop < 0) {
      this.$sideMenu.scrollTop(this.$sideMenu.scrollTop() + currentTop);
    } else if ((currentTop + $focusTo.height()) > this.$sideMenu.height()) {
      var jump = this.$sideMenu.scrollTop() + $focusTo.height() + parseInt($focusTo.css('marginTop'));
      this.$sideMenu.scrollTop(jump);
    }
  },

  onFavorite: function () {
    if (this.homeObject.playbackMetadata.type != "service") {
      return;
    }

    var idServiceTV = this.homeObject.playbackMetadata.id;
    var serviceTV = idServiceTV != null ? AppData.getServiceTV(idServiceTV) : null;
    if (serviceTV != null) {
      var lcn = serviceTV.lcn;

      var favorites = User.getServicesTVFavorited();
      if (favorites.length > 0) {
        var index = User.hasServiceTVFavorited(lcn);
        if (index >= 0) { // remove favorite
          favorites.splice(index, 1);
        } else { // add favorite
          favorites.push(lcn);

        }
      } else { // add first favorite
        favorites = [lcn];
      }

      User.setServicesTVFavorited(favorites);

      if (User.hasServiceTVFavorited(lcn) >= 0) {
        this.$favoriteButton.hide();
        this.$unfavoriteButton.show();
        Focus.to(this.$unfavoriteButton);
      } else {
        this.$unfavoriteButton.hide();
        this.$favoriteButton.show();
        Focus.to(this.$favoriteButton);
      }

      this.homeObject.setFavoritesRow();
      return true;
    }

    return false;
  },

  isServiceTVFavorite: function () {
    if (this.homeObject.playbackMetadata.type != "service") {
      return false;
    }

    var idServiceTV = this.homeObject.playbackMetadata.id;
    var serviceTV = idServiceTV != null ? AppData.getServiceTV(idServiceTV) : null;

    if (serviceTV) {
      return User.hasServiceTVFavorited(serviceTV.lcn) >= 0;
    }

    return false;
  },

  onToggleLock: function () {
    if (this.homeObject.playbackMetadata.type != "service" && this.homeObject.playbackMetadata.type != "catchup-event") {
      return;
    }

    var idServiceTV = this.homeObject.playbackMetadata.id;
    var $container = this.isFullscreen() ? this.$mainVideo : $(".common:first");
    var $lastFocused = Focus.focused;
    var self = this;

    if (this.homeObject.playbackMetadata.type == "catchup-event") {
      var serviceTVObj = AppData.getServiceTVByCatchupObj(this.homeObject.playbackMetadata.item);
      if (serviceTVObj) {
        idServiceTV = serviceTVObj.id;
      } else {
        console.log("Catchup data not found");
        return;
      }
    }

    ParentalControlDlg.show($container, $lastFocused, function() {
      if (User.toggleLockedServiceTV(idServiceTV)) {
        self.$lockButton.hide();
        self.$unlockButton.show();
      } else {
        self.$unlockButton.hide();
        self.$lockButton.show();
      }
    }, null);

  },

  isTracksMenuOpened: function() {
    var $el = Focus.focused;
    return (this.vodPlayerGetControlType($el) == this.vodControlsEnum.trackItem);
  },

  getCurrentServiceTV: function() {
    var idServiceTV = this.homeObject.playbackMetadata.id;
    return idServiceTV != null ? AppData.getServiceTV(idServiceTV) : null;
  }

};
