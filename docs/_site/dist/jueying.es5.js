'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*!
 * JUEYING v1.1.4
 * https://github.com/ansiboy/jueying
 *
 * 可视化页面设计器
 * 
 * 作者: 寒烟
 * 
 * 个人博客：   http://www.cnblogs.com/ansiboy/
 * GITHUB:     http://github.com/ansiboy
 * QQ 讨论组：  119038574
 * 
 * Copyright (c) 2016-2018, mai.shu <ansiboy@163.com>
 * Licensed under the MIT License.
 *
 */

(function (factory) {
	if (typeof require === 'function' && (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && (typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object') {
		// [1] CommonJS/Node.js 
		var target = module['exports'] || exports;
		var result = factory(target, require);
		Object.assign(target, result);
	} else if (typeof define === 'function' && define['amd']) {
		define(factory);
	} else {
		factory();
	}
})(function () {
	/*! 
  * jquery.event.drag - v 2.2
  * Copyright (c) 2010 Three Dub Media - http://threedubmedia.com
  * Open Source MIT License - http://threedubmedia.com/code/license
  */
	// Created: 2008-06-04 
	// Updated: 2012-05-21
	// REQUIRES: jquery 1.7.x

	;(function ($) {

		// add the jquery instance method
		$.fn.drag = function (str, arg, opts) {
			// figure out the event type
			var type = typeof str == "string" ? str : "",

			// figure out the event handler...
			fn = $.isFunction(str) ? str : $.isFunction(arg) ? arg : null;
			// fix the event type
			if (type.indexOf("drag") !== 0) type = "drag" + type;
			// were options passed
			opts = (str == fn ? arg : opts) || {};
			// trigger or bind event handler
			return fn ? this.bind(type, opts, fn) : this.trigger(type);
		};

		// local refs (increase compression)
		var $event = $.event,
		    $special = $event.special,

		// configure the drag special event 
		drag = $special.drag = {

			// these are the default settings
			defaults: {
				which: 1, // mouse button pressed to start drag sequence
				distance: 0, // distance dragged before dragstart
				not: ':input', // selector to suppress dragging on target elements
				handle: null, // selector to match handle target elements
				relative: false, // true to use "position", false to use "offset"
				drop: true, // false to suppress drop events, true or selector to allow
				click: false // false to suppress click events after dragend (no proxy)
			},

			// the key name for stored drag data
			datakey: "dragdata",

			// prevent bubbling for better performance
			noBubble: true,

			// count bound related events
			add: function add(obj) {
				// read the interaction data
				var data = $.data(this, drag.datakey),

				// read any passed options 
				opts = obj.data || {};
				// count another realted event
				data.related += 1;
				// extend data options bound with this event
				// don't iterate "opts" in case it is a node 
				$.each(drag.defaults, function (key, def) {
					if (opts[key] !== undefined) data[key] = opts[key];
				});
			},

			// forget unbound related events
			remove: function remove() {
				$.data(this, drag.datakey).related -= 1;
			},

			// configure interaction, capture settings
			setup: function setup() {
				// check for related events
				if ($.data(this, drag.datakey)) return;
				// initialize the drag data with copied defaults
				var data = $.extend({ related: 0 }, drag.defaults);
				// store the interaction data
				$.data(this, drag.datakey, data);
				// bind the mousedown event, which starts drag interactions
				$event.add(this, "touchstart mousedown", drag.init, data);
				// prevent image dragging in IE...
				if (this.attachEvent) this.attachEvent("ondragstart", drag.dontstart);
			},

			// destroy configured interaction
			teardown: function teardown() {
				var data = $.data(this, drag.datakey) || {};
				// check for related events
				if (data.related) return;
				// remove the stored data
				$.removeData(this, drag.datakey);
				// remove the mousedown event
				$event.remove(this, "touchstart mousedown", drag.init);
				// enable text selection
				drag.textselect(true);
				// un-prevent image dragging in IE...
				if (this.detachEvent) this.detachEvent("ondragstart", drag.dontstart);
			},

			// initialize the interaction
			init: function init(event) {
				// sorry, only one touch at a time
				if (drag.touched) return;
				// the drag/drop interaction data
				var dd = event.data,
				    results;
				// check the which directive
				if (event.which != 0 && dd.which > 0 && event.which != dd.which) return;
				// check for suppressed selector
				if ($(event.target).is(dd.not)) return;
				// check for handle selector
				if (dd.handle && !$(event.target).closest(dd.handle, event.currentTarget).length) return;

				drag.touched = event.type == 'touchstart' ? this : null;
				dd.propagates = 1;
				dd.mousedown = this;
				dd.interactions = [drag.interaction(this, dd)];
				dd.target = event.target;
				dd.pageX = event.pageX;
				dd.pageY = event.pageY;
				dd.dragging = null;
				// handle draginit event... 
				results = drag.hijack(event, "draginit", dd);
				// early cancel
				if (!dd.propagates) return;
				// flatten the result set
				results = drag.flatten(results);
				// insert new interaction elements
				if (results && results.length) {
					dd.interactions = [];
					$.each(results, function () {
						dd.interactions.push(drag.interaction(this, dd));
					});
				}
				// remember how many interactions are propagating
				dd.propagates = dd.interactions.length;
				// locate and init the drop targets
				if (dd.drop !== false && $special.drop) $special.drop.handler(event, dd);
				// disable text selection
				drag.textselect(false);
				// bind additional events...
				if (drag.touched) $event.add(drag.touched, "touchmove touchend", drag.handler, dd);else $event.add(document, "mousemove mouseup", drag.handler, dd);
				// helps prevent text selection or scrolling
				if (!drag.touched || dd.live) return false;
			},

			// returns an interaction object
			interaction: function interaction(elem, dd) {
				var offset = $(elem)[dd.relative ? "position" : "offset"]() || { top: 0, left: 0 };
				return {
					drag: elem,
					callback: new drag.callback(),
					droppable: [],
					offset: offset
				};
			},

			// handle drag-releatd DOM events
			handler: function handler(event) {
				// read the data before hijacking anything
				var dd = event.data;
				// handle various events
				switch (event.type) {
					// mousemove, check distance, start dragging
					case !dd.dragging && 'touchmove':
						event.preventDefault();
					case !dd.dragging && 'mousemove':
						//  drag tolerance, x� + y� = distance�
						if (Math.pow(event.pageX - dd.pageX, 2) + Math.pow(event.pageY - dd.pageY, 2) < Math.pow(dd.distance, 2)) break; // distance tolerance not reached
						event.target = dd.target; // force target from "mousedown" event (fix distance issue)
						drag.hijack(event, "dragstart", dd); // trigger "dragstart"
						if (dd.propagates) // "dragstart" not rejected
							dd.dragging = true; // activate interaction
					// mousemove, dragging
					case 'touchmove':
						event.preventDefault();
					case 'mousemove':
						if (dd.dragging) {
							// trigger "drag"		
							drag.hijack(event, "drag", dd);
							if (dd.propagates) {
								// manage drop events
								if (dd.drop !== false && $special.drop) $special.drop.handler(event, dd); // "dropstart", "dropend"							
								break; // "drag" not rejected, stop		
							}
							event.type = "mouseup"; // helps "drop" handler behave
						}
					// mouseup, stop dragging
					case 'touchend':
					case 'mouseup':
					default:
						if (drag.touched) $event.remove(drag.touched, "touchmove touchend", drag.handler); // remove touch events
						else $event.remove(document, "mousemove mouseup", drag.handler); // remove page events	
						if (dd.dragging) {
							if (dd.drop !== false && $special.drop) $special.drop.handler(event, dd); // "drop"
							drag.hijack(event, "dragend", dd); // trigger "dragend"	
						}
						drag.textselect(true); // enable text selection
						// if suppressing click events...
						if (dd.click === false && dd.dragging) $.data(dd.mousedown, "suppress.click", new Date().getTime() + 5);
						dd.dragging = drag.touched = false; // deactivate element	
						break;
				}
			},

			// re-use event object for custom events
			hijack: function hijack(event, type, dd, x, elem) {
				// not configured
				if (!dd) return;
				// remember the original event and type
				var orig = { event: event.originalEvent, type: event.type },

				// is the event drag related or drog related?
				mode = type.indexOf("drop") ? "drag" : "drop",

				// iteration vars
				result,
				    i = x || 0,
				    ia,
				    $elems,
				    callback,
				    len = !isNaN(x) ? x : dd.interactions.length;
				// modify the event type
				event.type = type;
				// remove the original event
				event.originalEvent = null;
				// initialize the results
				dd.results = [];
				// handle each interacted element
				do {
					if (ia = dd.interactions[i]) {
						// validate the interaction
						if (type !== "dragend" && ia.cancelled) continue;
						// set the dragdrop properties on the event object
						callback = drag.properties(event, dd, ia);
						// prepare for more results
						ia.results = [];
						// handle each element
						$(elem || ia[mode] || dd.droppable).each(function (p, subject) {
							// identify drag or drop targets individually
							callback.target = subject;
							// force propagtion of the custom event
							event.isPropagationStopped = function () {
								return false;
							};
							// handle the event	
							result = subject ? $event.dispatch.call(subject, event, callback) : null;
							// stop the drag interaction for this element
							if (result === false) {
								if (mode == "drag") {
									ia.cancelled = true;
									dd.propagates -= 1;
								}
								if (type == "drop") {
									ia[mode][p] = null;
								}
							}
							// assign any dropinit elements
							else if (type == "dropinit") ia.droppable.push(drag.element(result) || subject);
							// accept a returned proxy element 
							if (type == "dragstart") ia.proxy = $(drag.element(result) || ia.drag)[0];
							// remember this result	
							ia.results.push(result);
							// forget the event result, for recycling
							delete event.result;
							// break on cancelled handler
							if (type !== "dropinit") return result;
						});
						// flatten the results	
						dd.results[i] = drag.flatten(ia.results);
						// accept a set of valid drop targets
						if (type == "dropinit") ia.droppable = drag.flatten(ia.droppable);
						// locate drop targets
						if (type == "dragstart" && !ia.cancelled) callback.update();
					}
				} while (++i < len);
				// restore the original event & type
				event.type = orig.type;
				event.originalEvent = orig.event;
				// return all handler results
				return drag.flatten(dd.results);
			},

			// extend the callback object with drag/drop properties...
			properties: function properties(event, dd, ia) {
				var obj = ia.callback;
				// elements
				obj.drag = ia.drag;
				obj.proxy = ia.proxy || ia.drag;
				// starting mouse position
				obj.startX = dd.pageX;
				obj.startY = dd.pageY;
				// current distance dragged
				obj.deltaX = event.pageX - dd.pageX;
				obj.deltaY = event.pageY - dd.pageY;
				// original element position
				obj.originalX = ia.offset.left;
				obj.originalY = ia.offset.top;
				// adjusted element position
				obj.offsetX = obj.originalX + obj.deltaX;
				obj.offsetY = obj.originalY + obj.deltaY;
				// assign the drop targets information
				obj.drop = drag.flatten((ia.drop || []).slice());
				obj.available = drag.flatten((ia.droppable || []).slice());
				return obj;
			},

			// determine is the argument is an element or jquery instance
			element: function element(arg) {
				if (arg && (arg.jquery || arg.nodeType == 1)) return arg;
			},

			// flatten nested jquery objects and arrays into a single dimension array
			flatten: function flatten(arr) {
				return $.map(arr, function (member) {
					return member && member.jquery ? $.makeArray(member) : member && member.length ? drag.flatten(member) : member;
				});
			},

			// toggles text selection attributes ON (true) or OFF (false)
			textselect: function textselect(bool) {
				$(document)[bool ? "unbind" : "bind"]("selectstart", drag.dontstart).css("MozUserSelect", bool ? "" : "none");
				// .attr("unselectable", bool ? "off" : "on" )
				document.unselectable = bool ? "off" : "on";
			},

			// suppress "selectstart" and "ondragstart" events
			dontstart: function dontstart() {
				return false;
			},

			// a callback instance contructor
			callback: function callback() {}

		};

		// callback methods
		drag.callback.prototype = {
			update: function update() {
				if ($special.drop && this.available.length) $.each(this.available, function (i) {
					$special.drop.locate(this, i);
				});
			}
		};

		// patch $.event.$dispatch to allow suppressing clicks
		var $dispatch = $event.dispatch;
		$event.dispatch = function (event) {
			if ($.data(this, "suppress." + event.type) - new Date().getTime() > 0) {
				$.removeData(this, "suppress." + event.type);
				return;
			}
			return $dispatch.apply(this, arguments);
		};

		// event fix hooks for touch events...
		var touchHooks = $event.fixHooks.touchstart = $event.fixHooks.touchmove = $event.fixHooks.touchend = $event.fixHooks.touchcancel = {
			props: "clientX clientY pageX pageY screenX screenY".split(" "),
			filter: function filter(event, orig) {
				if (orig) {
					var touched = orig.touches && orig.touches[0] || orig.changedTouches && orig.changedTouches[0] || null;
					// iOS webkit: touchstart, touchmove, touchend
					if (touched) $.each(touchHooks.props, function (i, prop) {
						event[prop] = touched[prop];
					});
				}
				return event;
			}
		};

		// share the same special event configuration with related events...
		$special.draginit = $special.dragstart = $special.dragend = drag;
	})(jQuery);
	/*! 
  * jquery.event.drag.live - v 2.2
  * Copyright (c) 2010 Three Dub Media - http://threedubmedia.com
  * Open Source MIT License - http://threedubmedia.com/code/license
  */
	// Created: 2010-06-07
	// Updated: 2012-05-21
	// REQUIRES: jquery 1.7.x, event.drag 2.2

	;(function ($) {

		// local refs (increase compression)
		var $event = $.event,

		// ref the special event config
		drag = $event.special.drag,

		// old drag event add method
		origadd = drag.add,

		// old drag event teradown method
		origteardown = drag.teardown;

		// allow events to bubble for delegation
		drag.noBubble = false;

		// the namespace for internal live events
		drag.livekey = "livedrag";

		// new drop event add method
		drag.add = function (obj) {
			// call the old method
			origadd.apply(this, arguments);
			// read the data
			var data = $.data(this, drag.datakey);
			// bind the live "draginit" delegator
			if (!data.live && obj.selector) {
				data.live = true;
				$event.add(this, "draginit." + drag.livekey, drag.delegate);
			}
		};

		// new drop event teardown method
		drag.teardown = function () {
			// call the old method
			origteardown.apply(this, arguments);
			// read the data
			var data = $.data(this, drag.datakey) || {};
			// bind the live "draginit" delegator
			if (data.live) {
				// remove the "live" delegation
				$event.remove(this, "draginit." + drag.livekey, drag.delegate);
				data.live = false;
			}
		};

		// identify potential delegate elements
		drag.delegate = function (event) {
			// local refs
			var elems = [],
			    target,

			// element event structure
			events = $.data(this, "events") || {};
			// query live events
			$.each(events || [], function (key, arr) {
				// no event type matches
				if (key.indexOf("drag") !== 0) return;
				$.each(arr || [], function (i, obj) {
					// locate the element to delegate
					target = $(event.target).closest(obj.selector, event.currentTarget)[0];
					// no element found
					if (!target) return;
					// add an event handler
					$event.add(target, obj.origType + '.' + drag.livekey, obj.origHandler || obj.handler, obj.data);
					// remember new elements
					if ($.inArray(target, elems) < 0) elems.push(target);
				});
			});
			// if there are no elements, break
			if (!elems.length) return false;
			// return the matched results, and clenup when complete		
			return $(elems).bind("dragend." + drag.livekey, function () {
				$event.remove(this, "." + drag.livekey); // cleanup delegation
			});
		};
	})(jQuery);
	/*! 
  * jquery.event.drop - v 2.2
  * Copyright (c) 2010 Three Dub Media - http://threedubmedia.com
  * Open Source MIT License - http://threedubmedia.com/code/license
  */
	// Created: 2008-06-04 
	// Updated: 2012-05-21
	// REQUIRES: jquery 1.7.x, event.drag 2.2

	;(function ($) {
		// secure $ jQuery alias

		// Events: drop, dropstart, dropend

		// add the jquery instance method
		$.fn.drop = function (str, arg, opts) {
			// figure out the event type
			var type = typeof str == "string" ? str : "",

			// figure out the event handler...
			fn = $.isFunction(str) ? str : $.isFunction(arg) ? arg : null;
			// fix the event type
			if (type.indexOf("drop") !== 0) type = "drop" + type;
			// were options passed
			opts = (str == fn ? arg : opts) || {};
			// trigger or bind event handler
			return fn ? this.bind(type, opts, fn) : this.trigger(type);
		};

		// DROP MANAGEMENT UTILITY
		// returns filtered drop target elements, caches their positions
		$.drop = function (opts) {
			opts = opts || {};
			// safely set new options...
			drop.multi = opts.multi === true ? Infinity : opts.multi === false ? 1 : !isNaN(opts.multi) ? opts.multi : drop.multi;
			drop.delay = opts.delay || drop.delay;
			drop.tolerance = $.isFunction(opts.tolerance) ? opts.tolerance : opts.tolerance === null ? null : drop.tolerance;
			drop.mode = opts.mode || drop.mode || 'intersect';
		};

		// local refs (increase compression)
		var $event = $.event,
		    $special = $event.special,

		// configure the drop special event
		drop = $.event.special.drop = {

			// these are the default settings
			multi: 1, // allow multiple drop winners per dragged element
			delay: 20, // async timeout delay
			mode: 'overlap', // drop tolerance mode

			// internal cache
			targets: [],

			// the key name for stored drop data
			datakey: "dropdata",

			// prevent bubbling for better performance
			noBubble: true,

			// count bound related events
			add: function add(obj) {
				// read the interaction data
				var data = $.data(this, drop.datakey);
				// count another realted event
				data.related += 1;
			},

			// forget unbound related events
			remove: function remove() {
				$.data(this, drop.datakey).related -= 1;
			},

			// configure the interactions
			setup: function setup() {
				// check for related events
				if ($.data(this, drop.datakey)) return;
				// initialize the drop element data
				var data = {
					related: 0,
					active: [],
					anyactive: 0,
					winner: 0,
					location: {}
				};
				// store the drop data on the element
				$.data(this, drop.datakey, data);
				// store the drop target in internal cache
				drop.targets.push(this);
			},

			// destroy the configure interaction	
			teardown: function teardown() {
				var data = $.data(this, drop.datakey) || {};
				// check for related events
				if (data.related) return;
				// remove the stored data
				$.removeData(this, drop.datakey);
				// reference the targeted element
				var element = this;
				// remove from the internal cache
				drop.targets = $.grep(drop.targets, function (target) {
					return target !== element;
				});
			},

			// shared event handler
			handler: function handler(event, dd) {
				// local vars
				var results, $targets;
				// make sure the right data is available
				if (!dd) return;
				// handle various events
				switch (event.type) {
					// draginit, from $.event.special.drag
					case 'mousedown': // DROPINIT >>
					case 'touchstart':
						// DROPINIT >>
						// collect and assign the drop targets
						$targets = $(drop.targets);
						if (typeof dd.drop == "string") $targets = $targets.filter(dd.drop);
						// reset drop data winner properties
						$targets.each(function () {
							var data = $.data(this, drop.datakey);
							data.active = [];
							data.anyactive = 0;
							data.winner = 0;
						});
						// set available target elements
						dd.droppable = $targets;
						// activate drop targets for the initial element being dragged
						$special.drag.hijack(event, "dropinit", dd);
						break;
					// drag, from $.event.special.drag
					case 'mousemove': // TOLERATE >>
					case 'touchmove':
						// TOLERATE >>
						drop.event = event; // store the mousemove event
						if (!drop.timer)
							// monitor drop targets
							drop.tolerate(dd);
						break;
					// dragend, from $.event.special.drag
					case 'mouseup': // DROP >> DROPEND >>
					case 'touchend':
						// DROP >> DROPEND >>
						drop.timer = clearTimeout(drop.timer); // delete timer	
						if (dd.propagates) {
							$special.drag.hijack(event, "drop", dd);
							$special.drag.hijack(event, "dropend", dd);
						}
						break;

				}
			},

			// returns the location positions of an element
			locate: function locate(elem, index) {
				var data = $.data(elem, drop.datakey),
				    $elem = $(elem),
				    posi = $elem.offset() || {},
				    height = $elem.outerHeight(),
				    width = $elem.outerWidth(),
				    location = {
					elem: elem,
					width: width,
					height: height,
					top: posi.top,
					left: posi.left,
					right: posi.left + width,
					bottom: posi.top + height
				};
				// drag elements might not have dropdata
				if (data) {
					data.location = location;
					data.index = index;
					data.elem = elem;
				}
				return location;
			},

			// test the location positions of an element against another OR an X,Y coord
			contains: function contains(target, test) {
				// target { location } contains test [x,y] or { location }
				return (test[0] || test.left) >= target.left && (test[0] || test.right) <= target.right && (test[1] || test.top) >= target.top && (test[1] || test.bottom) <= target.bottom;
			},

			// stored tolerance modes
			modes: { // fn scope: "$.event.special.drop" object 
				// target with mouse wins, else target with most overlap wins
				'intersect': function intersect(event, proxy, target) {
					return this.contains(target, [event.pageX, event.pageY]) ? // check cursor
					1e9 : this.modes.overlap.apply(this, arguments); // check overlap
				},
				// target with most overlap wins	
				'overlap': function overlap(event, proxy, target) {
					// calculate the area of overlap...
					return Math.max(0, Math.min(target.bottom, proxy.bottom) - Math.max(target.top, proxy.top)) * Math.max(0, Math.min(target.right, proxy.right) - Math.max(target.left, proxy.left));
				},
				// proxy is completely contained within target bounds	
				'fit': function fit(event, proxy, target) {
					return this.contains(target, proxy) ? 1 : 0;
				},
				// center of the proxy is contained within target bounds	
				'middle': function middle(event, proxy, target) {
					return this.contains(target, [proxy.left + proxy.width * .5, proxy.top + proxy.height * .5]) ? 1 : 0;
				}
			},

			// sort drop target cache by by winner (dsc), then index (asc)
			sort: function sort(a, b) {
				return b.winner - a.winner || a.index - b.index;
			},

			// async, recursive tolerance execution
			tolerate: function tolerate(dd) {
				// declare local refs
				var i,
				    drp,
				    drg,
				    data,
				    arr,
				    len,
				    elem,

				// interaction iteration variables
				x = 0,
				    ia,
				    end = dd.interactions.length,

				// determine the mouse coords
				xy = [drop.event.pageX, drop.event.pageY],

				// custom or stored tolerance fn
				tolerance = drop.tolerance || drop.modes[drop.mode];
				// go through each passed interaction...
				do {
					if (ia = dd.interactions[x]) {
						// check valid interaction
						if (!ia) return;
						// initialize or clear the drop data
						ia.drop = [];
						// holds the drop elements
						arr = [];
						len = ia.droppable.length;
						// determine the proxy location, if needed
						if (tolerance) drg = drop.locate(ia.proxy);
						// reset the loop
						i = 0;
						// loop each stored drop target
						do {
							if (elem = ia.droppable[i]) {
								data = $.data(elem, drop.datakey);
								drp = data.location;
								if (!drp) continue;
								// find a winner: tolerance function is defined, call it
								data.winner = tolerance ? tolerance.call(drop, drop.event, drg, drp)
								// mouse position is always the fallback
								: drop.contains(drp, xy) ? 1 : 0;
								arr.push(data);
							}
						} while (++i < len); // loop 
						// sort the drop targets
						arr.sort(drop.sort);
						// reset the loop
						i = 0;
						// loop through all of the targets again
						do {
							if (data = arr[i]) {
								// winners...
								if (data.winner && ia.drop.length < drop.multi) {
									// new winner... dropstart
									if (!data.active[x] && !data.anyactive) {
										// check to make sure that this is not prevented
										if ($special.drag.hijack(drop.event, "dropstart", dd, x, data.elem)[0] !== false) {
											data.active[x] = 1;
											data.anyactive += 1;
										}
										// if false, it is not a winner
										else data.winner = 0;
									}
									// if it is still a winner
									if (data.winner) ia.drop.push(data.elem);
								}
								// losers... 
								else if (data.active[x] && data.anyactive == 1) {
										// former winner... dropend
										$special.drag.hijack(drop.event, "dropend", dd, x, data.elem);
										data.active[x] = 0;
										data.anyactive -= 1;
									}
							}
						} while (++i < len); // loop 		
					}
				} while (++x < end); // loop
				// check if the mouse is still moving or is idle
				if (drop.last && xy[0] == drop.last.pageX && xy[1] == drop.last.pageY) delete drop.timer; // idle, don't recurse
				else // recurse
					drop.timer = setTimeout(function () {
						drop.tolerate(dd);
					}, drop.delay);
				// remember event, to compare idleness
				drop.last = drop.event;
			}

		};

		// share the same special event configuration with related events...
		$special.dropinit = $special.dropstart = $special.dropend = drop;
	})(jQuery); // confine scope	
	/*! 
  * jquery.event.drop.live - v 2.2
  * Copyright (c) 2010 Three Dub Media - http://threedubmedia.com
  * Open Source MIT License - http://threedubmedia.com/code/license
  */
	// Created: 2010-06-07
	// Updated: 2012-05-21
	// REQUIRES: jquery 1.7.x, event.drag 2.2, event.drop 2.2

	;(function ($) {
		// secure $ jQuery alias

		// local refs (increase compression)
		var $event = $.event,

		// ref the drop special event config
		drop = $event.special.drop,

		// old drop event add method
		origadd = drop.add,

		// old drop event teradown method
		origteardown = drop.teardown;

		// allow events to bubble for delegation
		drop.noBubble = false;

		// the namespace for internal live events
		drop.livekey = "livedrop";

		// new drop event add method
		drop.add = function (obj) {
			// call the old method
			origadd.apply(this, arguments);
			// read the data
			var data = $.data(this, drop.datakey);
			// bind the live "dropinit" delegator
			if (!data.live && obj.selector) {
				data.live = true;
				$event.add(this, "dropinit." + drop.livekey, drop.delegate);
			}
		};

		// new drop event teardown method
		drop.teardown = function () {
			// call the old method
			origteardown.apply(this, arguments);
			// read the data
			var data = $.data(this, drop.datakey) || {};
			// remove the live "dropinit" delegator
			if (data.live) {
				// remove the "live" delegation
				$event.remove(this, "dropinit", drop.delegate);
				data.live = false;
			}
		};

		// identify potential delegate elements
		drop.delegate = function (event, dd) {
			// local refs
			var elems = [],
			    $targets,

			// element event structure
			events = $.data(this, "events") || {};
			// query live events
			$.each(events || [], function (key, arr) {
				// no event type matches
				if (key.indexOf("drop") !== 0) return;
				$.each(arr, function (i, obj) {
					// locate the elements to delegate
					$targets = $(event.currentTarget).find(obj.selector);
					// no element found
					if (!$targets.length) return;
					// take each target...
					$targets.each(function () {
						// add an event handler
						$event.add(this, obj.origType + '.' + drop.livekey, obj.origHandler || obj.handler, obj.data);
						// remember new elements
						if ($.inArray(this, elems) < 0) elems.push(this);
					});
				});
			});
			// may not exist when artifically triggering dropinit event
			if (dd)
				// clean-up after the interaction ends
				$event.add(dd.drag, "dragend." + drop.livekey, function () {
					$.each(elems.concat(this), function () {
						$event.remove(this, '.' + drop.livekey);
					});
				});
			//drop.delegates.push( elems );
			return elems.length ? $(elems) : false;
		};
	})(jQuery); // confine scope	
	window['jueying'] = window['jueying'] || jueying;

	return jueying;
});
