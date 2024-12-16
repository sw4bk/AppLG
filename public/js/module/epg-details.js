EPGDetails = (function (Events) {

  var EPGDetails = {};

  $.extend(true, EPGDetails, Events, {

    init: function ($container) {
      this.$container = $container;

      if (this.$container.length > 0) {
        this.$epgDetails = $container.find(".epg-dialog-details:first");
        if (this.$epgDetails.length == 0) {
          $container.append(this.getHtmlDialogEpgDetails());
          this.$epgDetails = $container.find(".epg-dialog-details:first");
        }
      }

      this.$image = this.$epgDetails.find(".epg-dialog-details-img");
      this.$lcn = this.$epgDetails.find(".epg-dialog-details-header-lcn");
      this.$channelName = this.$epgDetails.find(".epg-dialog-details-header-channel");
      this.$eventTime = this.$epgDetails.find(".epg-dialog-details-header-time");
      this.$eventDuration = this.$epgDetails.find(".epg-dialog-details-header-duration");
      this.$detailsTitle = this.$epgDetails.find(".epg-dialog-details-title");
      this.$detailsDescription = this.$epgDetails.find(".epg-dialog-details-description");
      this.$favButton = this.$epgDetails.find(".epg-dialog-details-header-fav");
      this.$recordButton = this.$epgDetails.find(".epg-dialog-record");
      this.$liveButton = this.$epgDetails.find(".epg-dialog-live");
      this.$watchButton = this.$epgDetails.find(".epg-dialog-watch");
      this.$dialogMessage = this.$epgDetails.find(".epg-dialog-details-message");
      this.metadata = null;
      this.homeObject = null;
      this.serviceTVObj = null;
      this.$lastFocused = null;
    },

    refreshElReferences: function ($container) {
      this.$container = $container;
      this.$epgDetails = this.$container.find(".epg-dialog-details:first");

      this.$image = this.$epgDetails.find(".epg-dialog-details-img");
      this.$lcn = this.$epgDetails.find(".epg-dialog-details-header-lcn");
      this.$channelName = this.$epgDetails.find(".epg-dialog-details-header-channel");
      this.$eventTime = this.$epgDetails.find(".epg-dialog-details-header-time");
      this.$eventDuration = this.$epgDetails.find(".epg-dialog-details-header-duration");
      this.$detailsTitle = this.$epgDetails.find(".epg-dialog-details-title");
      this.$detailsDescription = this.$epgDetails.find(".epg-dialog-details-description");
      this.$favButton = this.$epgDetails.find(".epg-dialog-details-header-fav");
      this.$recordButton = this.$epgDetails.find(".epg-dialog-record");
      this.$liveButton = this.$epgDetails.find(".epg-dialog-live");
      this.$watchButton = this.$epgDetails.find(".epg-dialog-watch");
      this.$dialogMessage = this.$epgDetails.find(".epg-dialog-details-message");
    },

    getHtmlDialogEpgDetails: function () {
      return '<div class="modal fade alerts nb-alert epg-dialog-details" role="dialog">'
        + '<div class="modal-dialog modal-center" style="width: 80%; height: 50em;">'
        + '<div class="modal-content" style="height: 90%;">'
        + '<div class="modal-body" style="height: 80%; display: flex; flex-direction: column; justify-content: space-around; align-items: stretch;">'
        + '<row style="display: flex;/* margin-bottom: 0.4em; */flex-direction: row;align-items: center;justify-content: space-evenly;">'
        + '<div class="col-sm-3 no-padding"><img class="epg-dialog-details-img" src="" alt=""></div>'
        + '<div class="col-sm-8 epg-dialog-details-header-info"">'

        + '<div class="channel-lcn-name" style="align-items: center; ">'
        + '<div><span class="label label-default epg-dialog-details-header-lcn" style="font-size: 2.2em; margin-right: 0.4em;"></span></div>'
        + '<h3 class="epg-dialog-details-header-channel" style="font-size: 2em;"></h3>'
        + '</div>'

        + '<p class="epg-dialog-details-header-time" style="font-size: 2em;"></p>'
        + '<p class="epg-dialog-details-header-duration" style="font-size: 2em;"></p>'
        + '</div>'
        + '<div class="col-sm-1">'
        + '<div class="nb-icon-button focusable nb-icon-star epg-dialog-details-header-fav"></div>'
        + '</div>'
        + '</row>'
        + '<row><h3 class="font-bold epg-dialog-details-title" style="font-size: 2em; height: 10%;"></h3></row>'
        + '<row><div class="epg-dialog-details-description" style="font-size: 2em; height: auto; overflow-y: auto;"></div></row>'
        + '</div>'
        + '<div class="modal-footer" style="height: 20%;">'
        + '<button type="button" class="btn-default btn-lg focusable epg-dialog-record hidden" data-parent-type="message">' + __("CatchupRecordButton") + '</button>'
        + '<button type="button" class="btn-default btn-lg focusable epg-dialog-live hidden" data-parent-type="message">' + __("EPGLive") + '</button>'
        + '<button type="button" class="btn-default btn-lg focusable epg-dialog-watch hidden" data-parent-type="message">' + __("EPGWatch") + '</button>'
        + '<p class="epg-dialog-details-message" style="text-align: center; margin-bottom: 1em;"></p>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';
    },

    show: function ($container, metadata, homeObject, $lastFocused) {
      this.refreshElReferences($container);
      this.homeObject = homeObject;
      this.$lastFocused = $lastFocused;

      var background = "";
      var image1 = "", image2 = "", lcn = "", channelName = "", ratingAndTime = "", duration = "", title = "", description = "";
      var catchupObj = null;
      var epgEvent = null;
      var self = this;
      this.serviceTVObj = null;
      this.metadata = null;

      this.$recordButton.addClass("hidden");
      this.$liveButton.addClass("hidden");
      this.$watchButton.addClass("hidden");
      this.$epgDetails.find(".epg-dialog-watch").addClass("hidden");
      this.$dialogMessage.text("");

      if (metadata.type == "service") {
        this.serviceTVObj = metadata.item;

        background = this.serviceTVObj.backgroundColor && this.serviceTVObj.backgroundColor.length > 0 ? ("#" + this.serviceTVObj.backgroundColor) : "";
        image1 = this.serviceTVObj.img;
        image2 = this.serviceTVObj.img;
        lcn = this.serviceTVObj.lcn;
        channelName = this.serviceTVObj.name;



        // if (this.homeObject.playbackMetadata.type != "service" || this.homeObject.playbackMetadata.id != this.serviceTVObj.id) {
        //   this.$watchButton.removeClass("hidden");
        // }

        if (metadata.item2) { //future event
          this.$liveButton.removeClass("hidden");
          this.setEpgEvent(metadata.item2);
        } else { //live event
          epgEvent = AppData.getLiveEvent(this.serviceTVObj);
          this.setEpgEvent(epgEvent);

          if (this.homeObject.playbackMetadata.type != "service" || this.homeObject.playbackMetadata.id != this.serviceTVObj.id) {
            this.$liveButton.removeClass("hidden");
          }
        }

      } else if (metadata.type == "catchup-event") {
        catchupObj = metadata.item;
        var group = AppData.getCatchupGroup(catchupObj.catchupGroupId);
        this.serviceTVObj = AppData.getServiceTVByStreamId(group.epgStreamId);

        if (this.serviceTVObj && this.serviceTVObj.epgItems && this.serviceTVObj.epgItems.length > 0) {
          epgEvent = this.serviceTVObj.epgItems.filter(function (e) { return e.event_id == catchupObj.eventId });
          epgEvent = (epgEvent && epgEvent.length > 0) ? epgEvent[0] : null;
          this.setEpgEvent(epgEvent);
        } else {
          AppData.getSimpleEpgByChannel(this.serviceTVObj.id, function () {
            self.serviceTVObj = AppData.getServiceTVByStreamId(group.epgStreamId);
            if (self.serviceTVObj && self.serviceTVObj.epgItems) {
              epgEvent = self.serviceTVObj.epgItems.filter(function (e) { return e.event_id == catchupObj.eventId });
              epgEvent = (epgEvent && epgEvent.length > 0) ? epgEvent[0] : null;
              self.setEpgEvent(epgEvent);
            }
          });
        }

        background = group.background && group.background.length > 0 ? ("#" + group.background) : "";
        image1 = catchupObj.imageUrl;
        image2 = group.img;
        lcn = group.lcn;
        channelName = group.name;

        if (AppData.isCatchupRecorded(catchupObj.id)) {
          this.$recordButton.text(__("CatchupDeleteButton"));
        } else {
          this.$recordButton.text(__("CatchupRecordButton"));
        }

        this.$liveButton.removeClass("hidden");
        this.$recordButton.removeClass("hidden");

        if (this.homeObject.playbackMetadata.type != "catchup-event" || this.homeObject.playbackMetadata.id != catchupObj.id) {
          if (catchupObj.startDate <= getTodayDate()) {
            this.$watchButton.removeClass("hidden");
          }
        }
      } else {
        return;
      }

      if (background.length > 0) {
        this.$image.attr("style", " background-color: " + background);
      }

      this.$image.loadImage(image1, image2);
      this.$lcn.text(lcn);
      this.$channelName.text(channelName);

      // check if favorited
      this.$favButton.addClass("nb-icon-star");
      this.$favButton.removeClass("nb-icon-star-fill");
      var favIndex = User.hasServiceTVFavorited(lcn);
      if (favIndex >= 0) {
        this.$favButton.addClass("nb-icon-star-fill");
        this.$favButton.removeClass("nb-icon-star");
      }

      this.metadata = metadata;
      this.$epgDetails.modal("show");
      Focus.to(this.$favButton);
    },

    setEpgEvent: function (epgEvent) {
      if (epgEvent) {
        var ratingAndTime = EPG.getEPGItemTimeStringByEpgItem(epgEvent);
        var duration = getTimeDifference(epgEvent.startDate, epgEvent.endDate, "minutes") + " " + __("MoviesMinutes");
        var title = epgEvent.languages.length > 0 ? epgEvent.languages[0].title : "";
        var description = epgEvent.languages.length > 0 ? epgEvent.languages[0].extendedDescription : "";

        this.$eventTime.text(ratingAndTime);
        this.$eventDuration.text(duration);
        this.$detailsTitle.text(title);
        this.$detailsDescription.text(description);
      }
    },

    isShowed: function () {
      return this.$epgDetails.hasClass("in");
    },

    navigate: function (direction) {
      var $focused = Focus.focused;

      if (direction == "up" && this.$favButton.is(":visible")) {
        Focus.to(this.$favButton);
      } else if (direction == "down" && Focus.focused.is(this.$favButton)) {
        Focus.to(this.$epgDetails.find(".modal-footer button:visible:last"));
      } else if (direction == "left" && $focused.hasClass("btn-default")) {
        Focus.to($focused.prev("button:visible"));
      } else if (direction == "right" && $focused.hasClass("btn-default")) {
        Focus.to($focused.next("button:visible"));
      }
    },

    onEnter: function ($el) {
      if ($el.is(this.$favButton)) {
        //save as favorite
        this.onFavorite();
        return;
      } else if ($el.is(this.$liveButton)) {
        this.playLive();
        this.close();
      } else if ($el.is(this.$watchButton)) {
        this.playCatchup();
        this.close();
        return;
      } else if ($el.is(this.$recordButton)) {
        //check if is recorded
        if (this.$recordButton.text() == __("CatchupRecordButton")) {
          this.onRecord();
        } else {
          this.onDeleteRecorded();
        }
        return;
      }
    },

    playLive: function () {
      this.homeObject.playContentWithAccess("service", this.serviceTVObj.id, this.serviceTVObj.url, this.serviceTVObj, true, false);
    },

    playCatchup: function () {
      var catchup = false;
      var self = this;

      if (this.metadata.type != "catchup-event") {
        return;
      }


      catchup = this.metadata.item;
      if (catchup !== false) {
        AppData.getTopLevelCatchupM3u8Url(catchup.id, function (url) {
          console.log("Play CATCHUP with URL: " + url);
          if (url != null && url.length > 0) {
            self.homeObject.playContentWithAccess("catchup-event", catchup.id, url, catchup);
          }
        });
      }
    },

    onRecord: function () {
      if (this.metadata != null && this.metadata.type == "catchup-event") {

        if (!AppData.canRecordCatchup(this.metadata.item.id)) {
          this.$dialogMessage.text(__("CatchupLowCatchupRecordingSpace"));
          return;
        }

        var self = this;
        AppData.recordCatchup(this.metadata.item.id, function (response) {
          if (self.homeObject) {
            if (response) {
              //self.homeObject.$el.showAlertMessage(__("CatchupRecordingOk"), 'record_catchup', null);
              self.$dialogMessage.text(__("CatchupRecordingOk"));
              self.$recordButton.text(__("CatchupDeleteButton"));
              self.homeObject.getDataForCatchupsRecorded();
            } else {
              self.$dialogMessage.text(__("CatchupRecordingFailed"));
              //self.homeObject.$el.showAlertMessage(__("CatchupRecordingFailed"), 'record_catchup', null);
            }
            Focus.to(self.$recordButton);
          }
        });
      }
    },

    onDeleteRecorded: function () {
      if (this.metadata != null && this.metadata.type == "catchup-event") {
        var self = this;
        AppData.deleteCatchup(this.metadata.item.id, function (response) {
          if (self.homeObject) {
            if (response) {
              self.$dialogMessage.text(__("CatchupRecordingDeleted"));
              self.$recordButton.text(__("CatchupRecordButton"));
              //self.homeObject.$el.showAlertMessage(__("CatchupRecordingDeleted"), 'record_catchup', null);
              self.homeObject.getDataForCatchupsRecorded();
            } else {
              self.$dialogMessage.text(__("CatchupDeleteFailed"));
              //self.homeObject.$el.showAlertMessage(__("CatchupDeleteFailed"), 'record_catchup', null);
            }
          }
        });
      }
    },

    onFavorite: function () {
      var serviceTV = this.serviceTVObj;
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
          this.$favButton.addClass("nb-icon-star-fill");
          this.$favButton.removeClass("nb-icon-star");
        } else {
          this.$favButton.removeClass("nb-icon-star-fill");
          this.$favButton.addClass("nb-icon-star");
        }

        this.homeObject.setFavoritesRow();
        Focus.to(this.$favButton);
        return true;
      }

      return false;
    },

    close: function () {
      this.$epgDetails.modal("hide");

      var self = this;
      setTimeout(function () {
        if (self.$lastFocused) {
          Focus.to(self.$lastFocused);
        }
      }, 250);
    },

  });

  return EPGDetails;
})(Events);
