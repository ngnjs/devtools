"use strict"
window.ref = {};

Object.defineProperties(window.ref, {

  keys: {
    enumerable: false,
    writable: true,
    configurable: false,
    value: {}
  },

  add: {
    enumerble: false,
    writable: false,
    configurable: false,
    value: function(key, value) {
      // Basic error checking
      if (typeof key !== 'string' && typeof key !== 'number') {
        throw new Error('Cannot add a non-alphanumeric selector reference.');
      }
      if (key.trim().length === 0) {
        throw new Error('Cannot add a blank selector reference.');
      }
      if (value === undefined || value === null || value.trim().length === 0) {
        throw new Error('Cannot create a null/undefined selector reference.');
      }

      // Create a reference object
      var cleankey = this.cleanKey(key);
      Object.defineProperty(window.ref, cleankey, {
        enumerable: false,
        writable: true,
        configurable: true,
        value: value
      });
      Object.defineProperty(window.ref, key, {
        enumerable: true,
        get: function() {
          var els = document.querySelectorAll(value);
          if (els.length === 1) {
            return els[0];
          } else {
            return Array.prototype.slice.call(els);
          }
        },
        set: function(val) {
          if (val === undefined || val === null || val.trim().length === 0) {
            throw new Error('Cannot create a null/undefined selector reference.');
          }
          window.ref[cleankey] = val;
        }
      });
      this.keys[key] = value;
      this.keys[this.cleanKey(key)] = value;
    }
  },

  rm: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function(key) {
      if (this.key) {
        delete this.key;
        delete this.keys[key];
      }
      var ck = this.cleanKey(key);
      if (this[ck]) {
        delete this[ck];
        delete this.keys[ck];
      }
    }
  },

  cleanKey: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function(key) {
      return key.replace(/[^A-Za-z0-9\_\#\$\@\-\+]/gi, '') + key.length;
    }
  },

  // Return a basic JSON representation of the references
  json: {
    enumerable: true,
    get: function() {
      var me = this,
        obj = {};
      Object.keys(this).forEach(function(el) {
        if (me.hasOwnProperty(el) && el !== 'json') {
          obj[el] = me.keys[el];
        }
      });
      return obj;
    }
  }

});
