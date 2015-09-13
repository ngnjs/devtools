/**
 * Inspired by David Walsh's simple PubSub code
 * at http://davidwalsh.name/pubsub-javascript.
 */
/**
 * @class BUS
 * The bus acts as a pub/sub messaging system (as opposed to a queue). It is primarily
 * designed for asynchronous communication between javascript objects, but can also be
 * bound to DOM events.
 *
 * The most common use looks like:
 * ```js
 *   var subscriber = BUS.subscribe('test', function(){
 *     console.log('test handled');
 *   });
 *
 *   BUS.subscribeOnce('test', function(){
 *     console.log('RESPOND ONCE!');
 *   })
 *
 *   BUS.publish('test'); // Outputs "test handled" and "RESPOND ONCE".
 *
 *   BUS.publish('test'); // Outputs "test handled" only.
 *
 *   subscriber.unsubscribe(); // Removes the listener
 *
 *   BUS.publish('test'); // Outputs nothing since the subscription was removed.
 * ```
 * There are a few aliases for ease of use, including `on() --> subscribe()`,
 * `once() --> subscribeOnce()`, and `emit() --> publish()`.
 *
 * It is also possible to use a wildcard in a subscription.
 *
 * ```js
 *   var subscriber = BUS.subscribe('test.*', function(){
 *     console.log('test handled');
 *   });
 *   var subscriber = BUS.subscribe('test.create', function(){
 *     console.log('test create handled');
 *   });
 *
 *   BUS.publish('test.create'); // Outputs "test handled" and "test create handled"
 *
 *   BUS.publish('test.delete'); // Outputs "test handled"
 * ```
 * @singleton
 */
var BUS = (function(){

  var topics = [], oneoff = [];
  var obj = {};

  var _getTopic = function(arr,topic){
    var t = arr.filter(function(t){
      return topic.toLowerCase() === t[0].toLowerCase();
    });
    if (t.length === 0) { return null; }
    if (t.length > 1) { console.warn('NGN Event Bus: '+t[0][0]+' exists more than once.'); }
    return t[0].filter(function(el,i){return i !== 0;});
  };

  var getTopic = function(topic){
    return _getTopic.apply(this,[topics,topic]);
  };

  var getOneOffTopic = function(topic){
    return _getTopic.apply(this,[oneoff,topic]);
  };

  Object.defineProperties(obj,{

    /**
     * @method subscribe
     * Subscribe to an event.
     * @param {string} event
     * The event name.
     * @param {Function} listener
     * The callback for handling an event.
     * @param {any} [listener.data=null]
     * A data payload supplied by the event.
     */
    subscribe: {
      enumerable: true,
      configurable: false,
      writable: false,
      value: function(topic, listener) {

        // Validate input
        if (topic === null || topic === undefined || listener === null || listener === undefined){
          throw new Error('subscribe() requires a topic and listener function as arguments.');
        }

        // Create the topic if not yet created
        var t = getTopic(topic);
        t !== null && t.unshift(topic);
        t === null && (t = [topic]) && topics.push(t);
        // var x = (new Error()).lineNumber;
        // Add the listener to queue
        var index = t.push(listener);

        // Update the topic with the new queue
        topics[topics.map(function(row){return row[0]}).indexOf(topic)] = t;

        // Provide handle back for removal of topic
        return {
          unsubscribe: function() {
            t = t.splice(index,1);
            if (t.length === 0){
              topics.splice(topics.map(function(row){return row[0]}).indexOf(topic),1);
            } else {
              topics[topics.map(function(row){return row[0]}).indexOf(topic)] = t;
            }
          }
        };
      }
    },

    /**
     * @method subscribeOnce
     * Subscribe to an event. The handler/listener will only be executed the first time
     * the event is detected. The handler/listener is removed after it is executed.
     * @type {Object}
     */
    subscribeOnce: {
      enumerable:true,
      configurable: false,
      writable: false,
      value: function(topic, listener) {

        // Validate input
        if (topic === null || topic === undefined || listener === null || listener === undefined){
          throw new Error('subscribeOnce() requires a topic and listener function as arguments.');
        }

        // Create the topic if not yet created
        var t = getOneOffTopic(topic);
        t !== null && t.unshift(topic);
        t === null && (t = [topic]) && oneoff.push(t);

        // Add the listener
        t.push(listener);

        // Update the topic with the new queue
        oneoff[oneoff.map(function(row){return row[0]}).indexOf(topic)] = t;

      }
    },

    /**
     * @method on
     * Alias for #subscribe.
     */
    on: {
      enumerable: true,
      configurable: false,
      writable: false,
      value: function(){
        return this.subscribe.apply(this,arguments);
      }
    },

    /**
     * @method once
     * Alias for #subscribeOnce.
     */
    once: {
      enumerable: true,
      configurable: false,
      writable: false,
      value: function(){
        return this.subscribeOnce.apply(this,arguments);
      }
    },

    /**
     * @method publish
     * Publish/trigger/fire an event.
     * @param {String} event
     * The event to fire.
     * @param {any} data
     * The payload to send to any event listeners/handlers.
     */
    publish: {
      enumerable: true,
      configurable: false,
      writable: false,
      value: function(topic, info) {

        var t = getTopic(topic), ot = getOneOffTopic(topic);

        // Cycle through topics and execute listeners
        if (t !== null) {
          t.forEach(function(item){
            item(info !== undefined ? info : {});
          });
        }

        // Cycle through one-off topics and execute listeners
        if (ot !== null) {
          ot.forEach(function(item){
            item(info !== undefined ? info : {});
          });
          oneoff = oneoff.filter(function(_t){
            return _t[0].toLowerCase() !== topic.toLowerCase();
          });
        }

        // Execute any listeners using a wildcard event match.
        topics.filter(function(t){
          if (t[0].indexOf('*') >= 0){
            var re = new RegExp(t[0].replace('*','.*','gi'));
            return re.test(topic);
          }
          return false;
        }).map(function(arr){
          return arr.slice(1,arr.length);
        })
        .forEach(function(t){
          t.forEach(function(fn){
            fn(info !== undefined ? info : {});
          });
        });

        // Execute any one-off listeners using a wildcard event match.
        oneoff.filter(function(t){
          if (t[0].indexOf('*') >= 0){
            var re = new RegExp(t[0].replace('*','.*','gi'));
            return re.test(topic);
          }
          return false;
        }).map(function(arr){
          return arr.slice(1,arr.length);
        })
        .forEach(function(t){
          t.forEach(function(fn){
            fn(info !== undefined ? info : {});
          });
        });
        oneoff = oneoff.filter(function(t){
          if (t[0].indexOf('*') >= 0){
            var re = new RegExp(t[0].replace('*','.*','gi'));
            return !re.test(topic);
          }
          return true;
        });

      }
    },

    /**
     * @method clear
     * Remove all handlers for an event.
     * @param {String} event
     * The event to trigger.
     */
    clear: {
      enumerable: false,
      configurable: false,
      writable: false,
      value: function(topic){
        topics = topics.filter(function(t){
          return t[0].toLowerCase() !== topic.toLowerCase();
        });
        oneoff = oneoff.filter(function(t){
          return t[0].toLowerCase() !== topic.toLowerCase();
        });
      }
    },

    /**
     * @method emit
     * An alias for #publish.
     */
    emit: {
      enumerable: true,
      configurable: false,
      writable: false,
      value: function(){
        return this.publish.apply(this,arguments);
      }
    },

    /**
     * @property {Array} subscribers
     * An array of all subscribers which currently have a registered event handler.
     */
    subscribers: {
      enumerable: true,
      get: function(){
        var sum = {};
        topics.forEach(function(t){
          sum[t[0]] = {
            persist: t.length-1,
            adhoc: 0
          };
        });
        oneoff.forEach(function(t){
          sum[t[0]] = sum[t[0]] || {persist:0};
          sum[t[0]].adhoc = t.length-1;
        });

        return sum;
        // return topics.map(function(t){
        //   return t[0];
        // })
        // .concat(oneoff.map(function(t){
        //   return t[0];
        // })).filter(function(item,pos,a){
        //   return a.indexOf(item) == pos;
        // }).sort();
      }
    },

    /**
     * @property {Array} persistentSubscribers
     * All subscribers with a persistent (i.e. normal) registered event handler.
     */
    persistentSubscribers: {
      enumerable: true,
      get: function(){
        return topics.map(function(t){
          return t[0];
        }).sort();
      }
    },

    /**
     * @property adhocSubscribers
     * All subscribers with a one-time registered event handler. The handlers of events
     * are removed after the first time the event is heard by the BUS.
     */
    adhocSubscribers: {
      enumerable: true,
      get: function(){
        return oneoff.map(function(t){
          return t[0];
        }).sort();
      }
    }

  });

  return obj;

})();
