/*
 *******************************************************************************

 * All rights reserved
 *  

 *
 * You may obtain a copy of the License at LICENSE.txt
 *******************************************************************************
 */

/**
 * File Storage class
 * 
 * @author AuroraTech
 * @class Storage
 * @singleton
 * @mixins Events
 */

Storage = (function(Events) {
    var Storage = {
	/**
	 * @property {Object} config General config hash
	 */
	config: null,
    };

    $.extend(true, Storage, Events, {
	/**
	 * Init Storage object
	 * @param {Object} [config={}] Storage configuration
     */
	init: function(config) {
	    this.configure(config);
	},
	/**
	 * Set class config hash
	 * 
	 * @param {Object} config Hash of parameters
	 */
	configure: function(config) {
	    this.config = $.extend(true, this.config || {}, config);
	},
	/**
	 * Set value to the storage
	 * 
	 * @param {String} name
	 * @param {Object/String/Number} value
	 * @returns {Boolean}
	 */
	set: function(name, value) {
	    if (window.localStorage) {
			name = CONFIG.app.brand + "_" + name;
			return window.localStorage.setItem(name, JSON.stringify(value));
	    }

	    return false;
	},
	/**
	 * Get value from the storage
	 * 
	 * @param {String} name
	 * @returns {Object/String/Number} Retrurns FALSE 
	 */
	get: function(name) {
	    var value;
	    name = CONFIG.app.brand + "_" + name;
	    if (window.localStorage) {
		value = window.localStorage.getItem(name);
		if(typeof value !== 'undefined'){
      try{
		    return JSON.parse(value);
      }
      catch(e){
        return value;
      }
		}
	    }

	    return false;
	},
	/**
	 * Clear all stored data
	 * 
	 * @returns {Boolean}
	 */
	clear: function(){
	    if(window.localStorage){
		return window.localStorage.clear();
	    }
	    
	    return false;
	}
    });

    // Initialize this class when Main is ready
    Main.ready(function(){
	Storage.init();
    });

    return Storage;

})(Events);