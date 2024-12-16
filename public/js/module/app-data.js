AppData = (function (Events) {

  var AppData = {};

  $.extend(true, AppData, Events, {
    init: function () {
      this.bouquets = [];
      this.services = [];
      this.channels = [];
      this.catchupGroups = [];
      this.catchupsRecorded = [];
      this.bouquetsHome = [];
      this.vodCategories = [];
      this.EPG_API_KEY = CONFIG.app.epgApiKey;
      this.EPG_API_TOKEN = CONFIG.app.epgApiToken;
      this.EPG_DAYS_OFFSET = CONFIG_CURRENT_BRAND.brand == "rsogo" ? 1 : 2;
      this.BASE_URL = CONFIG.app.drmURL;
      this.IMAGE_URL_VOD_POSTER_LIST = CONFIG.app.imageUrlVodPosterList;
      this.IMAGE_URL_VOD_POSTER_INFO = CONFIG.app.imageUrlVodPosterInfo
      this.IMAGE_URL_VOD_ORIGINAL_IMAGE = CONFIG.app.imageUrlVodOriginalImage;
      this.allVods = [];
      this.vodRecommendedId = -1;
      this.vodRecommended = [];
      this.epgRowsOnInit = CONFIG.app.newEpgRowsOnInit;
    },

    clearData: function () {
      this.bouquets = [];
      this.services = [];
      this.channels = [];
      this.catchupGroups = [];
      this.catchupsRecorded = [];
      this.bouquetsHome = [];
      this.vodCategories = [];
      this.allVods = [];
      this.vodRecommendedId = -1;
      this.vodRecommended = []
    },

    getDataForServicesTV: function (callback) {
      this.bouquets = [];
      this.services = [];
      this.bouquetsHome = [];

      var self = this;
      if (this.bouquets.length == 0) {
        cv.getBouquets(function (bouquets) {
          self.bouquets = bouquets;

          // translate bouquets title
          self.bouquets.forEach(function (bouquet, index) {
            self.bouquets[index].name = __(bouquet.name);
          });

          cv.getAvailableStreams(function (services) {
            self.services = services;
            self.bouquetsHome = self.prepareServicesAndBouquetsData(function (data) {
              // ordenar los bouquets segun la prioridad
              data.sort(function (a, b) {
                return a.priority - b.priority;
              })
              callback(data);
            });

          }, function () {
            callback([]);
          });

        }, function () {
          callback([]);
        });
      } else {
        callback([]);
      }
    },

    getCatchupGroups: function (callback) {
      var self = this;
      cv.getCatchupGroups(function (catchupGroups) {
        // Ordenar catchupGroups por el valor de lcn
        catchupGroups.sort(function (a, b) {
          return a.lcn - b.lcn;
        });

        self.catchupGroups = catchupGroups;

        self.catchupGroups = self.sortByLcn(self.catchupGroups);

        self.getCatchupEvents(callback);
      }, function () {
        callback([]);
      });
    },

    getCatchupEvents: function (callback) {
      var self = this;
      var catchupGroupsCount = this.catchupGroups.length;

      if (catchupGroupsCount > 0) {
        this.catchupGroups.forEach(function (catchupGroup, index, array) {
          cv.getCatchupEvents(catchupGroup.epgStreamId, function (events) {

            events.forEach(function (event, index, array) {
              events[index].catchupGroupId = catchupGroup.catchupGroupId;
              events[index].startDate = event.start != null ? moment(new Date(event.start)).utc(true) : null;
              events[index].endDate = event.start != null ? moment(new Date(event.start)).utc(true).add(event.duration, "seconds") : null;
            });

            self.catchupGroups[index].events = events;

            if ((index + 1) >= catchupGroupsCount) {
              callback(self.catchupGroups);
            }
          }, function () {
            if ((index + 1) >= catchupGroupsCount) {
              callback(self.catchupGroups);
            }
          });
        });
      } else {
        callback(self.catchupGroups);
      }


    },

    getCatchupsRecorded: function (callback) {

      var self = this;

      this.catchupsRecorded = [];

      cv.getCatchupsRecorded(function (catchupsRecorded) {
        self.catchupsRecorded = self.prepareDataForCatchupsRecorded(catchupsRecorded);
        callback(self.catchupsRecorded);
      }, function () {
        callback([]);
      });

    },

    getVOD: function (callback) {

      var self = this;

      this.vodCategories = [];
      this.allVods = [];
      this.vodRecommendedId = -1;
      this.vodRecommended = []

      cv.getVOD(function (library) {
        // filter only category group type 5 and type 6 and get only categories
        library = library.length > 0 ? library[0] : [];
        var groupsType5 = library.categoryGroups != null ? library.categoryGroups.filter(function (item) { return item.type == 5 || item.type == 6; }) : [];
        groupsType5.forEach(function (groups) {
          self.vodCategories = self.vodCategories.concat(groups.categories);
        });

        var vodRecommended = library.categoryGroups != null ? library.categoryGroups.filter(function (item) { return item.type == 6; }) : [];
        if (vodRecommended.length > 0) {
          self.vodRecommendedId = vodRecommended[0].id
        }

        //self.vodCategories = self.vodCategories != null && self.vodCategories.length > 0 ? self.vodCategories[0] : [];

        self.vodCategories.forEach(function (category, index) {
          self.vodCategories[index].name = __(category.name);
        });

        self.callGetVODContent(0, [], callback);

      }, function () {
        callback([]);
      });

    },

    callGetVODContent: function (offset, allVods, callback) {
      var self = this;

      if (offset > 1000) {
        callback(self.prepareDataForVOD(allVods));
        return;
      }

      cv.getVODContent(offset, function (vods) {
        if (vods != null && vods.length > 0) {
          allVods = allVods.concat(vods);
          self.callGetVODContent((offset + 100), allVods, callback);
        } else {
          callback(self.prepareDataForVOD(allVods));
        }
      }, function () {
        callback(self.prepareDataForVOD(allVods));
      });
    },

    prepareDataForVOD: function (vods) {
      var self = this;
      var filtered = [];

      this.vodCategories.forEach(function (category, index, arrray) {
        filtered = vods.filter(function (vod) {
          return vod.categories.indexOf(category.id) >= 0;
        });

        // set vod images
        filtered.forEach(function (vod, index) {
          if (vod.image1Id != null) {
            filtered[index].posterListURL = self.IMAGE_URL_VOD_POSTER_LIST.replace("%base_url%", self.BASE_URL).replace("%image_id%", vod.image1Id);
            filtered[index].posterInfoURL = self.IMAGE_URL_VOD_POSTER_INFO.replace("%base_url%", self.BASE_URL).replace("%image_id%", vod.image1Id);
          }

          if (vod.image2Id != null) {
            filtered[index].extraImageURL = self.IMAGE_URL_VOD_ORIGINAL_IMAGE.replace("%base_url%", self.BASE_URL).replace("%image_id%", vod.image2Id)
          }

          if (vod.image3Id != null) {
            filtered[index].backgroundImageURL = self.IMAGE_URL_VOD_ORIGINAL_IMAGE.replace("%base_url%", self.BASE_URL).replace("%image_id%", vod.image3Id);
          }

          filtered[index].baseImageUrl = self.IMAGE_URL_VOD_ORIGINAL_IMAGE.replace("%base_url%", self.BASE_URL).replace("%image_id%", "{id}");
        });

        self.vodCategories[index].vods = filtered;
        self.allVods = [].concat(self.allVods, filtered);
      });

      var series = vods.filter(function (vod) { return vod.isSeries });
      if (series.length > 0 && this.vodCategories.length > 0) {

        series.sort(function (a, b) {
          return a.name != null ? ((a.name > b.name) ? 1 : ((a.name < b.name) ? -1 : 0)) : 0;
        });

        this.vodCategories.push({ id: 0, name: __("Séries"), vods: series });
        self.allVods = self.allVods.concat(series);
      }

      if (this.vodRecommended >= 0) {
        var filtered = this.vodCategories.filter(function (category) { return category.id == self.vodRecommendedId });
        if (filtered.length > 0) {
          this.vodRecommended = filtered[0].vods;
        }
      }
      this.vodCategories = this.vodCategories.filter(function (category) { return category.id != self.vodRecommendedId });

      this.vodCategories.sort(function (a, b) {
        return a.name != null ? ((a.name > b.name) ? 1 : ((a.name < b.name) ? -1 : 0)) : 0;
      });
      return this.vodCategories;
    },

    getVodRecommended: function () {
      return this.vodRecommended;
    },

    prepareDataForCatchupsRecorded: function (catchupsRecorded) {

      var self = this;

      var catchups = catchupsRecorded.filter(function (catchup) {
        return catchup.mode == 4 && catchup.catchupId > 0 && !catchup.deleted;
      });

      catchups.forEach(function (item, index, array) {
        var filtered = self.catchupGroups.filter(function (group) { return group.events != null && group.events.filter(function (event) { return event.id == item.catchupId }).length > 0; });
        if (filtered.length > 0) {
          filtered = filtered[0];
          var events = filtered.events.filter(function (event) { return event.id == item.catchupId });

          catchups[index].event = events[0];
          catchups[index].image = filtered.img;
          catchups[index].lcn = filtered.lcn;
          catchups[index].catchupName = filtered.name;
        }
      });

      catchups = catchups.filter(function (catchup) { return catchup.event != null });
      catchups.sort(function (a, b) {
        return a.startDate != null ? ((a.startDate > b.startDate) ? 1 : ((a.startDate < b.startDate) ? -1 : 0)) : 0;
      });

      return catchups;
    },

    prepareServicesAndBouquetsData: function (callback) {

      var self = this;

      self.channels = this.services;
      // 1. sort services by lcn (channel number)
      self.channels.sort(function (a, b) {
        if (a.lcn > b.lcn) {
          return 1;
        }
        if (a.lcn < b.lcn) {
          return -1;
        }

        return 0;
      });
      // 2. filter services without lcn.
      //var tvChannelsNoNumber = channels.filter(channel => channel.lcn == 0);
      var tvChannelsNoNumber = self.channels.filter(function (channel) {
        return channel.lcn == 0;
      });

      // 3. create list "channels" ordered by channel number and channels without number at the end of list
      //channels = channels.filter(channel => channel.lcn != 0);
      self.channels = self.channels.filter(function (channel) {
        return channel.lcn != 0;
      });

      self.channels = self.channels.concat(tvChannelsNoNumber);

      // 4. Iterate bouquets list and set 'services filtered by bouquet' to items property.
      this.bouquets.forEach(function (bouquet, index, array) {
        //var filtered = self.services.filter(channel => channel.bouquetIds.includes(bouquet.bouquetId));
        var filtered = self.services.filter(function (channel) {
          return channel.bouquetIds.indexOf(bouquet.bouquetId) >= 0;
        });
        self.bouquets[index].items = filtered;
      });
      // 5. create a bouquet with title "Channels" and set "channels" to items property, append to bouquets list
      var bouquetAllChannels = [{
        bouquetId: "106",
        description: "",
        items: self.channels,
        name: __("ServicesAndTVTVChannels"),
        priority: "1",
      }]

      var list = bouquetAllChannels.concat(this.bouquets);
      //list = list.filter(bouquet => bouquet.items.length > 0);
      list = list.filter(function (bouquet) {
        return bouquet.items.length > 0;
      });

      //this.bouquets = this.bouquets.unshift(bouquetAllChannels);
      // 6. Return boquets list
      console.log(list);
      callback(list);
    },

    getServicesTVFavoritedAsChannels: function () {
      var favorites = User.getServicesTVFavorited();
      var bouquetFavorites = null;
      var self = this;
      if (favorites.length > 0) {
        var servicesTVFavorited = [];
        favorites.forEach(function (lcn, index, array) {
          var channel = self.channels.filter(function (channel) {
            return channel.lcn == lcn;
          });

          if (channel != null && channel.length > 0) {
            servicesTVFavorited.push(channel[0]);
          }
        });

        if (servicesTVFavorited.length > 0) {
          bouquetFavorites = {
            bouquetId: "-1",
            description: "",
            items: servicesTVFavorited,
            name: __("ServicesAndTVFavorites"),
            priority: "1",
          }
        }
      }
      return bouquetFavorites;
    },

    getServiceTV: function (id) {
      //var filtered = this.services.filter(channel => channel.id == id);
      var filtered = this.services.filter(function (channel) {
        return channel.id == id;
      });
      if (filtered.length > 0) {
        return filtered[0];
      }
      return false;
    },

    getServiceTVByStreamId: function (streamId) {
      //var filtered = this.services.filter(channel => channel.id == id);
      var filtered = this.services.filter(function (channel) {
        return channel.epgStreamId == streamId;
      });
      if (filtered.length > 0) {
        return filtered[0];
      }
      return false;
    },

    getServiceTVByChannelNumber: function (number) {
      var filtered = this.services.filter(function (channel) {
        return channel.lcn == number;
      });
      if (filtered.length > 0) {
        return filtered[0];
      } else {
        var lessDiff = 0;
        var lessId = 0;
        $.each(this.services, function (i, service) {
          if (Math.abs(service.lcn - number) < lessDiff || lessDiff == 0) {
            lessDiff = Math.abs(service.lcn - number);
            lessId = service.id;
          }
        });

        if (lessId > 0) {
          filtered = this.getServiceTV(lessId);
          if (filtered != false) {
            return filtered;
          }
        }
      }
      return false;
    },

    getNextPrevServiceTV: function (channel, addIndex) {

      var index = this.channels.indexOf(channel);
      var newIndex = index + addIndex;

      if (newIndex >= this.channels.length) {
        newIndex = 0;
      } else if (newIndex < 0) {
        newIndex = this.channels.length - 1;
      }

      return this.channels[newIndex];
    },

    getCatchup: function (id) {
      var filtered = this.catchupGroups.filter(function (catchup) {
        return catchup.epgStreamId == id;
      });

      if (filtered.length > 0) {
        return filtered[0];
      }
      return false;
    },

    getCatchupByEventId: function (id) {
      var result = false;
      $.each(this.catchupGroups, function (i, group) {
        if (typeof group.events != 'undefined') {
          $.each(group.events, function (j, event) {
            if (event.id == id) {
              result = event;
              return;
            }
          });
        }
      });

      return result;
    },

    getCatchupEvent: function (group, id) {
      var groups = this.catchupGroups.filter(function (catchup) {
        return catchup.epgStreamId == group;
      });

      if (groups.length > 0) {
        var filtered = groups[0].events.filter(function (event) {
          return event.eventId == id;
        });

        return filtered.length > 0 ? filtered[0] : false;
      }
      return false;
    },

    getCatchupGroup: function (groupId) {

      var groups = this.catchupGroups.filter(function (catchup) {
        return catchup.catchupGroupId == groupId;
      });

      return (groups.length > 0 ? groups[0] : false);
    },

    getVODItem: function (id, callback) {
      var self = this;
      var vod = this.allVods.filter(function (vod) {
        return vod.id == id;
      });

      if (vod == null || vod.length == 0 || vod[0] == null) {
        if (typeof callback != 'undefined') {
          callback(false);
          return;
        } else {
          return false;
        }
      }

      vod = vod[0];

      if (typeof callback == 'undefined') {
        return vod;
      }

      var index = self.allVods.indexOf(vod);

      if (vod.isSeries) {
        if (vod.seasons == null || vod.seasons.length == 0) {

          cv.getVodSeriesInfo(vod.id, function (data) {
            self.allVods[index].seasons = data.seasons;
            // self.vodCategories[indexCategory].vods[indexVod].seasons = data.seasons;
            console.log(data);
            console.log("=========================================");
            callback(self.allVods[index]);
          }, function () {
            self.allVods[index].seasons = [];
            console.log("ERROR");
            console.log("=========================================");

            callback(self.allVods[index]);
          });
        } else {
          callback(vod);
        }
      } else {
        callback(vod);
      }
    },

    getFirstCategory: function (categories) {
      var filtered = [];
      var self = this;
      categories.forEach(function (categoryId) {
        if (filtered.length == 0) {
          filtered = self.vodCategories.filter(function (item) { return categoryId == item.id });
        }
      });

      if (filtered.length > 0) {
        return filtered[0];
      }

      return null;
    },

    getCategoryById: function (id) {
      var filtered = this.vodCategories.filter(function (category) {
        return category.id == id;
      });

      if (filtered.length > 0) {
        return filtered[0];
      }

      return null;
    },

    getEPGByBouquet: function (callback, index) {
      if (this.services.length <= 0) {
        callback(this.services);
        return;
      }

      var self = this;
      var startDate = null;
      var endDate = null;
      var endDate = null;
      var todayDate = getTodayDate(); //moment(new Date()).utc(true);
      var eventsFiltered = [];
      var channel = this.services[index];
      var epgStreamId = channel.epgStreamId;
      var url = self.getEPGURL(epgStreamId);

      console.log("Load EPG for ", url);
      cv.getEPG(url, function (data) {

        // eventsFiltered = data.filter(function(event) {
        //     startDate = event.start != null ? moment(event.start).utc(true) : null;
        //     endDate = event.end != null ? moment(event.end).utc(true) : null;

        //     if (startDate != null && endDate != null && startDate.isSame(todayDate, "day")) {
        //         //getTimeDifference(startDate, todayDate, "hours") <= 24) {
        //         event.startDate = startDate;
        //         event.endDate = endDate;
        //         //eventsFiltered.push(event);
        //         return event;
        //     }
        // });

        data.forEach(function (event) {
          startDate = event.start != null ? moment(event.start).utc(true) : null;
          endDate = event.end != null ? moment(event.end).utc(true) : null;

          if (startDate != null && endDate != null && getTimeDifference(startDate, todayDate, "hours") <= 48) {
            event.startDate = startDate;
            event.endDate = endDate;
            eventsFiltered.push(event);
          }
        });

        if (index < self.services.length) {
          self.services[index].epgItems = eventsFiltered;
        }

        if ((index + 1) >= self.services.length || (self.epgRowsOnInit > 0 && index >= self.epgRowsOnInit)) {
          self.epgLoaded(callback);
        } else {
          self.getEPGByBouquet(callback, index + 1);
        }
      }, function (error) {
        console.log("ERROR load EPG (" + index + ") (" + url + ")" + error);
        self.services[index].epgItems = [];

        if ((index + 1) >= self.services.length) {
          self.epgLoaded(callback);
        } else {
          self.getEPGByBouquet(callback, index + 1);
        }
      });
    },

    epgLoaded: function (callback) {
      // rebuild bouquets data with services with epg items and send to home to refresh data displayed
      console.log("EPG loaded");
      console.log(this.services);

      callback(this.services);
    },

    sortByLcn: function (list) {
      list.sort(function (a, b) {
        if (a.lcn > b.lcn) {
          return 1;
        }
        if (a.lcn < b.lcn) {
          return -1;
        }

        return 0;
      });

      return list;
    },

    getEPGURL: function (streamId) {

      var epgCdnUrl = User.epgCdnUrl;
      var operatorName = User.operatorName;


      if (epgCdnUrl.length > 0 && operatorName) {
        var accessToken = CryptoJS.SHA256(this.EPG_API_KEY + operatorName + this.EPG_API_KEY + streamId + this.EPG_API_KEY).toString();

        return epgCdnUrl + "/?pid=guest.home.login&requestMode=download&d=epg"
          + "&apiToken=" + this.EPG_API_TOKEN
          + "&accessToken=" + accessToken
          + "&operator=" + operatorName
          + "&epgStreamId=" + streamId
          + "&pastDays=" + this.EPG_DAYS_OFFSET
          + "&unzipped=true";
      }

      return "";
    },

    getTopLevelVodM3u8Url: function (vodId, callback) {
      cv.getTopLevelVodM3u8Url(vodId, function (url) {
        callback(url);
      }, function () {
        callback("");
      });
    },

    getTopLevelCatchupM3u8Url: function (catchupId, callback) {
      cv.getTopLevelCatchupM3u8Url(catchupId, function (url) {
        callback(url);
      }, function () {
        callback("");
      });
    },

    getLiveEvent: function (serviceTV) {
      if (serviceTV.epgItems && serviceTV.epgItems.length > 0) {
        var todayDate = getTodayDate();
        var lives = serviceTV.epgItems.filter(function (event) {
          if (event.startDate && event.endDate) {
            return todayDate.isBetween(event.startDate, event.endDate)
          }
          return false;
        });

        return lives.length > 0 ? lives[0] : null;
      }
      return null;
    },

    getNextEvent: function (serviceTV, live) {
      if (serviceTV.epgItems && serviceTV.epgItems.length > 0) {
        var next = serviceTV.epgItems.filter(function (event) {
          return event.startDate && event.endDate && event.startDate >= live.endDate;
        });

        return next.length > 0 ? next[0] : null;
      }
      return null;
    },

    recordCatchup: function (catchupId, callback) {
      cv.recordOrDeleteCatchup(catchupId, false, function (response) {
        callback(response);
      }, function () {
        callback(false);
      });
    },

    deleteCatchup: function (catchupId, callback) {
      var catchupRecorded = this.getCatchupRecorded(catchupId);
      if (catchupRecorded !== false) {
        cv.recordOrDeleteCatchup(catchupRecorded.recordingTaskId, true, function (response) {
          callback(response);
        }, function () {
          callback(false);
        });
      } else {
        callback(false);
      }
    },

    getCatchupRecordingsMinutesUsed: function () {
      var duration = 0;
      this.catchupsRecorded.forEach(function (catchup, index, array) {
        duration += catchup.event.duration;
      });

      return (duration / 60);
    },

    canRecordCatchup: function (eventId) {
      var catchup = this.getCatchupByEventId(eventId);

      if (catchup !== false) {
        var toUse = this.getCatchupRecordingsMinutesUsed() + (catchup.duration / 60);
        return toUse <= (CONFIG.app.catchupRecordingHoursLimit * 60);
      }

      return false;
    },

    isCatchupRecorded: function (catchupId) {
      var results = this.catchupsRecorded.filter(function (catchup) {
        return catchup.catchupId == catchupId;
      });

      if (results.length > 0) {
        return results[0];
      }

      return false;
    },

    getCatchupRecorded: function (catchupId) {
      var result = this.catchupsRecorded.filter(function (catchup) {
        return catchup.catchupId = catchupId;
      });

      return result.length > 0 ? result[0] : false;
    },

    getSimilarVOD: function (id) {

      var mainVod = this.getVODItem(id);
      var similar = [];
      var similarIds = [];

      $.each(this.vodCategories, function (x, category) {
        $.each(category.vods, function (y, vod) {
          $.each(vod.categories, function (z, categoryId) {
            if (mainVod.id != vod.id && categoryId != 2 && mainVod.categories.indexOf(categoryId) >= 0 && similarIds.indexOf(vod.id) < 0) {
              similarIds.push(vod.id);
              similar.push(vod);
            }
          });
        });
      });

      return similar;
    },

    getNextEpisode: function (serie, currentSeasonId, currentEpisodeId) {
      var season = serie.seasons.filter(function (season) { return season.id == currentSeasonId });

      if (season.length > 0) {
        season = season[0];
      } else {
        return null;
      }

      var episode = season.episodes.filter(function (episode) { return episode.id == currentEpisodeId });

      if (episode.length > 0) {
        episode = episode[0];
      } else {
        return null;
      }

      var currentEpisodeNumber = episode.episodeNumber;
      var nextEpisode = season.episodes.filter(function (episode) { return episode.episodeNumber == (currentEpisodeNumber + 1) });

      if (nextEpisode.length > 0) {
        var next = nextEpisode[0];
        next.seasonId = currentSeasonId;
        return next;
      } else {
        var currentSeasonNumber = season.seasonNumber;
        var nextSeason = serie.seasons.filter(function (season) { return season.seasonNumber == (currentSeasonNumber + 1) });

        if (nextSeason.length > 0 && nextSeason[0].episodes != null && nextSeason[0].episodes.length > 0) {
          var next = nextSeason[0].episodes[0];
          next.seasonId = nextSeason[0].id;
          return next;
        }
      }

      return null;
    },

    getVodObject: function (id) {
      var category = this.vodCategories.filter(function (category) { return category.id == 6; })

      if (category.length > 0) {
        category = category[0];

        var vod = category.vods.filter(function (vod) { return vod.id == id; });

        if (vod.length > 0) {
          return vod[0];
        }
      } else {
        var vods = this.allVods.filter(function (vod) { return vod.id == id; });
        if (vods != null && vods.length > 0) {
          return vods[0];
        }
      }

      return null;
    },

    getNextCatchup: function (prevEventId) {
      var result = false;
      $.each(this.catchupGroups, function (i, group) {
        if (typeof group.events != 'undefined') {
          $.each(group.events, function (j, event) {
            if (event.eventId == prevEventId) {
              if ((j - 1) >= 0 && (j - 1) < group.events.length) {
                result = group.events[j - 1];
              }
              return;
            }
          });
        }
      });

      return result;
    },

    getAds: function (callback) {
      cv.getAds(function (data) {
        console.log(data);
        console.log("=========================================");
        var ads = data.filter(function (ad) { return ad.targetKey == 'html5'; })
        callback(ads)
        console.log(ads);
      }, function () {
        console.log("ERROR");
        console.log("=========================================");
        callback([])
      });
    },

    getAllServices: function () {
      return this.services;
    },

    getSimpleEpgByChannel: function (id, callback) {
      var index = -1;
      var filtered = this.services.filter(function (channel, i) {
        if (channel.id == id) {
          index = i;
          return channel;
        }
      });

      if (index >= 0) {
        this.getSimpleEpgByChannelIndex(index, callback);
      }
    },

    getSimpleEpgByChannelIndex: function (index, callback) {
      // if (this.services.length <= 0) {
      //     callback(this.services);
      //     return;
      // }

      var self = this;
      var startDate = null;
      var endDate = null;
      var endDate = null;
      var todayDate = getTodayDate(); //moment(new Date()).utc(true);
      var eventsFiltered = [];
      var channel = this.services[index];
      var epgStreamId = channel.epgStreamId;
      var url = self.getEPGURL(epgStreamId);


      if (channel.epgItems != null) {
        callback();
        return;
      }

      console.log("Load EPG for ", url);
      cv.getEPG(url, function (data) {

        // eventsFiltered = data.filter(function(event) {
        //     startDate = event.start != null ? moment(event.start).utc(true) : null;
        //     endDate = event.end != null ? moment(event.end).utc(true) : null;

        //     if (startDate != null && endDate != null && startDate.isSame(todayDate, "day")) {
        //         //getTimeDifference(startDate, todayDate, "hours") <= 24) {
        //         event.startDate = startDate;
        //         event.endDate = endDate;
        //         //eventsFiltered.push(event);
        //         return event;
        //     }
        // });

        data.forEach(function (event) {
          startDate = event.start != null ? moment(event.start).utc(true) : null;
          endDate = event.end != null ? moment(event.end).utc(true) : null;

          if (startDate != null && endDate != null && getTimeDifference(startDate, todayDate, "hours") <= 48) {
            event.startDate = startDate;
            event.endDate = endDate;
            eventsFiltered.push(event);
          }
        });

        if (index < self.services.length) {
          self.services[index].epgItems = eventsFiltered;
        }

        callback();

        // if ((index + 1) >= self.services.length || index >= 7) {
        //     self.epgLoaded(callback);
        // } else {
        //     self.getEPGByBouquet(callback, index + 1);
        // }
      }, function (error) {
        console.log("ERROR load EPG (" + index + ") (" + url + ")" + error);
        self.services[index].epgItems = [];
        callback();
        // if ((index + 1) >= self.services.length) {
        //     self.epgLoaded(callback);
        // } else {
        //     self.getEPGByBouquet(callback, index + 1);
        // }
      });
    },

    getServiceTVByCatchupObj: function(catchupObj) {
      if (catchupObj) {
        var group = AppData.getCatchupGroup(catchupObj.catchupGroupId);
        if (group && group.epgStreamId) {
          var serviceTVObj = AppData.getServiceTVByStreamId(group.epgStreamId);
          if (serviceTVObj) {
            return serviceTVObj;
          }
        }
      }

      return null;
    },

  });

  AppData.init();

  return AppData;
})(Events);
