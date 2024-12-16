/*
 *******************************************************************************

 * All rights reserved
 *  

 *
 * You may obtain a copy of the License at LICENSE.txt
 *******************************************************************************
 */

/**
 * Philips Player class
 * 
 * @author AuroraTech
 * @class Device_Philips_Player
 * @extends Player
 */

Device_Philips_Player = (function(Events) {
	var Device_Philips_Player = {
		/**
		 * @property {String} type MIME type, video/mp4 or application/oipfContentAccess for DRM
		 */
		type: 'video/mp4',
		
		/**
		 * @property {String} cadProxyUrl URL address to the CAD proxy (from generating CAD file for DRM); user {DATA} placeholder
		 */
		cadProxyUrl: null
	};

	$.extend(true, Device_Philips_Player, {
		/**
		 * Get URL to the CAD proxy, override this method if you're not using this.cadProxyUrl
		 * 
		 * @template
		 * @param {Object} drmConfig DRM configuration
		 * @returns {String}
		 */
		getCadProxy: function(drmConfig){
			
		},
		/**
		 * @inheritdoc Player#initNative
		 */
		initNative: function() {
			var scope = this;
			
			this.createPlayer(this.type);
			
			this.ticker = setInterval(function() {
			scope.tick();
			}, 500);
		},
		/**
		 * @inheritdoc Player#deinitNative
		 */
		deinitNative: function() {
			this.PLAYER.stop();
			this.$el.remove();
		},
		/**
		 * Function for creating player object 
		 * 
		 * @private
		 */
		createPlayer: function(type){
			var scope = this;
			
			if(this.PLAYER){
				this.deinitNative();
			}
			
			this.$el = $('<object id="PHILIPSPLAYER" type="'+type+'"'
				+'data="" width="'+this.config.width+'" height="'+this.config.height+'" style="width:'+this.config.width+'px;height:'+this.config.height+'px;'
				+'top:'+this.config.top+'px;left:'+this.config.left+'px;'
				+'position:absolute;z-index:0;visibility:hidden"></object>').appendTo('body');
			this.PLAYER = this.$el[0];
			
			this.PLAYER.onPlayStateChange = function() {
				scope.onNativePlayStateChange();
			};
			
			this.PLAYER.ondrmmessageresult = this.onNativeDrmMessageResult;
			
			this.type = type || null;
		},
		/**
		 * Internal player timer
		 * 
		 * @private
		 */
		tick: function() {
			var pos = 0;
			
			if (this.url && this.PLAYER && typeof this.PLAYER.playTime !== 'undefined') {
				if (!this.duration && this.PLAYER.playTime) {
					this.onDurationChange(this.PLAYER.playTime);
				}
		
				pos = Math.round(this.PLAYER.playPosition >> 0);
		
				if (pos && pos !== this.currentTime) {
					this.onTimeUpdate(pos);
				}
			}
		},
		/**
		 * @inheritdoc Player#native
		 */
		native: function(cmd, attrs) {
			var url, drmUrl;
			
			if (cmd === 'play') {
				if (attrs && attrs.url) {
					url = this.url;
					this._seekOnPlay = null; // clear
	
					console.network('PLAYER', this.url);
					
					var mediaType = this.mediaOption.mediaType || this.deriveMediaType(url);
					if((typeof url === 'object' && url && url.DRM_URL) || mediaType === 'WIDEVINE'){
						// widevine
						if(this.type !== 'application/oipfContentAccess'){
							this.createPlayer('application/oipfContentAccess');
							this.show();
						}
						
						if(typeof url !== 'object'){
							drmUrl = $.extend(true, {}, this.config.DRMconfig || {}, {url: url});
							
						}else{
							drmUrl = $.extend(true, {}, url);
							url = drmUrl.url;
						}
						
						if(this.customData){
							drmUrl.CUSTOM_DATA = this.customData;
						}
						
						if(this.cadProxyUrl){
							url = String(this.cadProxyUrl).replace(/\{DATA\}/, jQuery.param(drmUrl));
							
						}else{
							url = this.getCadProxy(drmUrl);
						}
					
					}else if(this.type === 'application/oipfContentAccess'){
						// plain
						this.createPlayer('video/mp4');
						this.show();
					}
					
					this.PLAYER.data = url;
				}
				
				this.PLAYER.play(1);
				
				if (attrs && attrs.position) {
					this._seekOnPlay = attrs.position;
				}
			
			} else if (cmd === 'pause') {
				return this.PLAYER.play(0);
	
			} else if (cmd === 'stop') {
				return this.PLAYER.stop();
	
			} else if (cmd === 'seek') {
				if(this.currentState === this.STATE_BUFFERING){
					this._seekOnPlay = attrs.position;
					
				}else{
					this.PLAYER.seek(attrs.position);
				}
				
				return true;
	
			} else if (cmd === 'playbackSpeed') {
				return this.PLAYER.play(attrs.speed);
	
			} else if (cmd === 'show') {
				this.width = attrs.width || this.width;
				this.height = attrs.height || this.height;
				this.top = (typeof attrs.top !== 'undefined' ? attrs.top : this.top);
				this.left = (typeof attrs.left !== 'undefined' ? attrs.left : this.left);
		
				this.$el.css({
					width: this.width,
					height: this.height,
					left: this.left,
					top: this.top
				});
				
				this.$el.css('visibility', 'visible');
	
			} else if (cmd === 'hide') {
				this.$el.css('visibility', 'hidden');
			
			} else if (cmd === 'setVideoDimensions') {
				// @todo: implement setVideoDimensions
	
			} else if (cmd === 'audioTrack') {
				// @todo: check if audioLanguage is implemented
				if(attrs.language){
					this.PLAYER.audioLanguage = attrs.language;
				}
			}
		},
		/**
		 * Get unique ESN code. It is used for DRM verification.
		 * 
		 * @private
		 */
		getESN: function() {
			return Device.getUID();
		},
		/**
		 * Handling changes in player state
		 * 
		 * @private
		 */
		onNativePlayStateChange: function(){
			var state = this.PLAYER.playState;
			
			if(state === 0){
				// stopped
				this.onEnd();
				
			}else if(state === 1){
				// playing
				if (!this.duration && this.PLAYER.playTime) {
					this.onDurationChange(this.PLAYER.playTime);
				}
				
				this.state(this.STATE_PLAYING);
				
				if(this._seekOnPlay){
					this.PLAYER.seek(this._seekOnPlay);
					this._seekOnPlay = 0;
				}
			
			}else if(state === 2){
				// paused
				this.state(this.STATE_PAUSED);
			
			}else if(state === 3 || state === 4){
				// connecting || buffering
				if(this.currentState !== this.STATE_BUFFERING){
					this.state(this.STATE_BUFFERING);
				}
			
			}else if(state === 5){
				// finished
				this.onEnd();
				
			}else if(state === 6){
				// error
				this.onNativeError();
			}
		},
		/**
		 * Error related to DRM error
		 * 
		 * @private
		 */
		onNativeDrmMessageResult: function(msgId, resultMsg, resultCode){
			if(resultCode > 0){
				this.onError(4, 'drm', null);
			}
		},
		/**
		 * Player error handler
		 * 
		 * @private
		 */	
		onNativeError: function(){
			var code = this.PLAYER.error, msg = 'Unknown Error';
			
			this.onError(code, msg);
		}
	});

	return Device_Philips_Player;

})(Events);