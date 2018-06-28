!function(e){/*if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else*/{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.lmv_poly2tri=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
module.exports={"version": "1.3.5"}
},{}],2:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint maxcomplexity:11 */

"use strict";


/*
 * Note
 * ====
 * the structure of this JavaScript version of poly2tri intentionally follows
 * as closely as possible the structure of the reference C++ version, to make it 
 * easier to keep the 2 versions in sync.
 */


// -------------------------------------------------------------------------Node

/**
 * Advancing front node
 * @constructor
 * @private
 * @struct
 * @param {!XY} p - Point
 * @param {Triangle=} t triangle (optional)
 */
var Node = function(p, t) {
    /** @type {XY} */
    this.point = p;

    /** @type {Triangle|null} */
    this.triangle = t || null;

    /** @type {Node|null} */
    this.next = null;
    /** @type {Node|null} */
    this.prev = null;

    /** @type {number} */
    this.value = p.x;
};

// ---------------------------------------------------------------AdvancingFront
/**
 * @constructor
 * @private
 * @struct
 * @param {Node} head
 * @param {Node} tail
 */
var AdvancingFront = function(head, tail) {
    /** @type {Node} */
    this.head_ = head;
    /** @type {Node} */
    this.tail_ = tail;
    /** @type {Node} */
    this.search_node_ = head;
};

/** @return {Node} */
AdvancingFront.prototype.head = function() {
    return this.head_;
};

/** @param {Node} node */
AdvancingFront.prototype.setHead = function(node) {
    this.head_ = node;
};

/** @return {Node} */
AdvancingFront.prototype.tail = function() {
    return this.tail_;
};

/** @param {Node} node */
AdvancingFront.prototype.setTail = function(node) {
    this.tail_ = node;
};

/** @return {Node} */
AdvancingFront.prototype.search = function() {
    return this.search_node_;
};

/** @param {Node} node */
AdvancingFront.prototype.setSearch = function(node) {
    this.search_node_ = node;
};

/** @return {Node} */
AdvancingFront.prototype.findSearchNode = function(/*x*/) {
    // TODO: implement BST index
    return this.search_node_;
};

/**
 * @param {number} x value
 * @return {Node}
 */
AdvancingFront.prototype.locateNode = function(x) {
    var node = this.search_node_;

    /* jshint boss:true */
    if (x < node.value) {
        while (node = node.prev) {
            if (x >= node.value) {
                this.search_node_ = node;
                return node;
            }
        }
    } else {
        while (node = node.next) {
            if (x < node.value) {
                this.search_node_ = node.prev;
                return node.prev;
            }
        }
    }
    return null;
};

/**
 * @param {!XY} point - Point
 * @return {Node}
 */
AdvancingFront.prototype.locatePoint = function(point) {
    var px = point.x;
    var node = this.findSearchNode(px);
    var nx = node.point.x;

    if (px === nx) {
        // Here we are comparing point references, not values
        if (point !== node.point) {
            // We might have two nodes with same x value for a short time
            if (point === node.prev.point) {
                node = node.prev;
            } else if (point === node.next.point) {
                node = node.next;
            } else {
                throw new Error('poly2tri Invalid AdvancingFront.locatePoint() call');
            }
        }
    } else if (px < nx) {
        /* jshint boss:true */
        while (node = node.prev) {
            if (point === node.point) {
                break;
            }
        }
    } else {
        while (node = node.next) {
            if (point === node.point) {
                break;
            }
        }
    }

    if (node) {
        this.search_node_ = node;
    }
    return node;
};


// ----------------------------------------------------------------------Exports

module.exports = AdvancingFront;
module.exports.Node = Node;


},{}],3:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 *
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 *
 * All rights reserved.
 *
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";

/*
 * Function added in the JavaScript version (was not present in the c++ version)
 */

/**
 * assert and throw an exception.
 *
 * @private
 * @param {boolean} condition   the condition which is asserted
 * @param {string} message      the message which is display is condition is falsy
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assert Failed");
    }
}
module.exports = assert;



},{}],4:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";


/*
 * Note
 * ====
 * the structure of this JavaScript version of poly2tri intentionally follows
 * as closely as possible the structure of the reference C++ version, to make it 
 * easier to keep the 2 versions in sync.
 */

var xy = _dereq_('./xy');

// ------------------------------------------------------------------------Point
/**
 * Construct a point
 * @example
 *      var point = new poly2tri.Point(150, 150);
 * @public
 * @constructor
 * @struct
 * @param {number=} x    coordinate (0 if undefined)
 * @param {number=} y    coordinate (0 if undefined)
 */
var Point = function(x, y) {
    /**
     * @type {number}
     * @expose
     */
    this.x = +x || 0;
    /**
     * @type {number}
     * @expose
     */
    this.y = +y || 0;

    // All extra fields added to Point are prefixed with _p2t_
    // to avoid collisions if custom Point class is used.

    /**
     * The edges this point constitutes an upper ending point
     * @private
     * @type {Array.<Edge>}
     */
    this._p2t_edge_list = null;
};

/**
 * For pretty printing
 * @example
 *      "p=" + new poly2tri.Point(5,42)
 *      // â†? "p=(5;42)"
 * @returns {string} <code>"(x;y)"</code>
 */
Point.prototype.toString = function() {
    return xy.toStringBase(this);
};

/**
 * JSON output, only coordinates
 * @example
 *      JSON.stringify(new poly2tri.Point(1,2))
 *      // â†? '{"x":1,"y":2}'
 */
Point.prototype.toJSON = function() {
    return { x: this.x, y: this.y };
};

/**
 * Creates a copy of this Point object.
 * @return {Point} new cloned point
 */
Point.prototype.clone = function() {
    return new Point(this.x, this.y);
};

/**
 * Set this Point instance to the origo. <code>(0; 0)</code>
 * @return {Point} this (for chaining)
 */
Point.prototype.set_zero = function() {
    this.x = 0.0;
    this.y = 0.0;
    return this; // for chaining
};

/**
 * Set the coordinates of this instance.
 * @param {number} x   coordinate
 * @param {number} y   coordinate
 * @return {Point} this (for chaining)
 */
Point.prototype.set = function(x, y) {
    this.x = +x || 0;
    this.y = +y || 0;
    return this; // for chaining
};

/**
 * Negate this Point instance. (component-wise)
 * @return {Point} this (for chaining)
 */
Point.prototype.negate = function() {
    this.x = -this.x;
    this.y = -this.y;
    return this; // for chaining
};

/**
 * Add another Point object to this instance. (component-wise)
 * @param {!Point} n - Point object.
 * @return {Point} this (for chaining)
 */
Point.prototype.add = function(n) {
    this.x += n.x;
    this.y += n.y;
    return this; // for chaining
};

/**
 * Subtract this Point instance with another point given. (component-wise)
 * @param {!Point} n - Point object.
 * @return {Point} this (for chaining)
 */
Point.prototype.sub = function(n) {
    this.x -= n.x;
    this.y -= n.y;
    return this; // for chaining
};

/**
 * Multiply this Point instance by a scalar. (component-wise)
 * @param {number} s   scalar.
 * @return {Point} this (for chaining)
 */
Point.prototype.mul = function(s) {
    this.x *= s;
    this.y *= s;
    return this; // for chaining
};

/**
 * Return the distance of this Point instance from the origo.
 * @return {number} distance
 */
Point.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};

/**
 * Normalize this Point instance (as a vector).
 * @return {number} The original distance of this instance from the origo.
 */
Point.prototype.normalize = function() {
    var len = this.length();
    this.x /= len;
    this.y /= len;
    return len;
};

/**
 * Test this Point object with another for equality.
 * @param {!XY} p - any "Point like" object with {x,y}
 * @return {boolean} <code>true</code> if same x and y coordinates, <code>false</code> otherwise.
 */
Point.prototype.equals = function(p) {
    return this.x === p.x && this.y === p.y;
};


// -----------------------------------------------------Point ("static" methods)

/**
 * Negate a point component-wise and return the result as a new Point object.
 * @param {!XY} p - any "Point like" object with {x,y}
 * @return {Point} the resulting Point object.
 */
Point.negate = function(p) {
    return new Point(-p.x, -p.y);
};

/**
 * Add two points component-wise and return the result as a new Point object.
 * @param {!XY} a - any "Point like" object with {x,y}
 * @param {!XY} b - any "Point like" object with {x,y}
 * @return {Point} the resulting Point object.
 */
Point.add = function(a, b) {
    return new Point(a.x + b.x, a.y + b.y);
};

/**
 * Subtract two points component-wise and return the result as a new Point object.
 * @param {!XY} a - any "Point like" object with {x,y}
 * @param {!XY} b - any "Point like" object with {x,y}
 * @return {Point} the resulting Point object.
 */
Point.sub = function(a, b) {
    return new Point(a.x - b.x, a.y - b.y);
};

/**
 * Multiply a point by a scalar and return the result as a new Point object.
 * @param {number} s - the scalar
 * @param {!XY} p - any "Point like" object with {x,y}
 * @return {Point} the resulting Point object.
 */
Point.mul = function(s, p) {
    return new Point(s * p.x, s * p.y);
};

/**
 * Perform the cross product on either two points (this produces a scalar)
 * or a point and a scalar (this produces a point).
 * This function requires two parameters, either may be a Point object or a
 * number.
 * @param  {XY|number} a - Point object or scalar.
 * @param  {XY|number} b - Point object or scalar.
 * @return {Point|number} a Point object or a number, depending on the parameters.
 */
Point.cross = function(a, b) {
    if (typeof(a) === 'number') {
        if (typeof(b) === 'number') {
            return a * b;
        } else {
            return new Point(-a * b.y, a * b.x);
        }
    } else {
        if (typeof(b) === 'number') {
            return new Point(b * a.y, -b * a.x);
        } else {
            return a.x * b.y - a.y * b.x;
        }
    }
};


// -----------------------------------------------------------------"Point-Like"
/*
 * The following functions operate on "Point" or any "Point like" object 
 * with {x,y} (duck typing).
 */

Point.toString = xy.toString;
Point.compare = xy.compare;
Point.cmp = xy.compare; // backward compatibility
Point.equals = xy.equals;

/**
 * Peform the dot product on two vectors.
 * @public
 * @param {!XY} a - any "Point like" object with {x,y}
 * @param {!XY} b - any "Point like" object with {x,y}
 * @return {number} The dot product
 */
Point.dot = function(a, b) {
    return a.x * b.x + a.y * b.y;
};


// ---------------------------------------------------------Exports (public API)

module.exports = Point;

},{"./xy":11}],5:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";

/*
 * Class added in the JavaScript version (was not present in the c++ version)
 */

var xy = _dereq_('./xy');

/**
 * Custom exception class to indicate invalid Point values
 * @constructor
 * @public
 * @extends Error
 * @struct
 * @param {string=} message - error message
 * @param {Array.<XY>=} points - invalid points
 */
var PointError = function(message, points) {
    this.name = "PointError";
    /**
     * Invalid points
     * @public
     * @type {Array.<XY>}
     */
    this.points = points = points || [];
    /**
     * Error message
     * @public
     * @type {string}
     */
    this.message = message || "Invalid Points!";
    for (var i = 0; i < points.length; i++) {
        this.message += " " + xy.toString(points[i]);
    }
};
PointError.prototype = new Error();
PointError.prototype.constructor = PointError;


module.exports = PointError;

},{"./xy":11}],6:[function(_dereq_,module,exports){
(function (global){
/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * * Neither the name of Poly2Tri nor the names of its contributors may be
 *   used to endorse or promote products derived from this software without specific
 *   prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

/**
 * Public API for poly2tri.js
 * @module poly2tri
 */


/**
 * If you are not using a module system (e.g. CommonJS, RequireJS), you can access this library
 * as a global variable <code>poly2tri</code> i.e. <code>window.poly2tri</code> in a browser.
 * @name poly2tri
 * @global
 * @public
 * @type {module:poly2tri}
 */
var previousPoly2tri = global.poly2tri;
/**
 * For Browser + &lt;script&gt; :
 * reverts the {@linkcode poly2tri} global object to its previous value,
 * and returns a reference to the instance called.
 *
 * @example
 *              var p = poly2tri.noConflict();
 * @public
 * @return {module:poly2tri} instance called
 */
// (this feature is not automatically provided by browserify).
exports.noConflict = function() {
    global.poly2tri = previousPoly2tri;
    return exports;
};

/**
 * poly2tri library version
 * @public
 * @const {string}
 */
exports.VERSION = _dereq_('../dist/version.json').version;

/**
 * Exports the {@linkcode PointError} class.
 * @public
 * @typedef {PointError} module:poly2tri.PointError
 * @function
 */
exports.PointError = _dereq_('./pointerror');
/**
 * Exports the {@linkcode Point} class.
 * @public
 * @typedef {Point} module:poly2tri.Point
 * @function
 */
exports.Point = _dereq_('./point');
/**
 * Exports the {@linkcode Triangle} class.
 * @public
 * @typedef {Triangle} module:poly2tri.Triangle
 * @function
 */
exports.Triangle = _dereq_('./triangle');
/**
 * Exports the {@linkcode SweepContext} class.
 * @public
 * @typedef {SweepContext} module:poly2tri.SweepContext
 * @function
 */
exports.SweepContext = _dereq_('./sweepcontext');


// Backward compatibility
var sweep = _dereq_('./sweep');
/**
 * @function
 * @deprecated use {@linkcode SweepContext#triangulate} instead
 */
exports.triangulate = sweep.triangulate;
/**
 * @deprecated use {@linkcode SweepContext#triangulate} instead
 * @property {function} Triangulate - use {@linkcode SweepContext#triangulate} instead
 */
exports.sweep = {Triangulate: sweep.triangulate};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../dist/version.json":1,"./point":4,"./pointerror":5,"./sweep":7,"./sweepcontext":8,"./triangle":9}],7:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint latedef:nofunc, maxcomplexity:9 */

"use strict";

/**
 * This 'Sweep' module is present in order to keep this JavaScript version
 * as close as possible to the reference C++ version, even though almost all
 * functions could be declared as methods on the {@linkcode module:sweepcontext~SweepContext} object.
 * @module
 * @private
 */

/*
 * Note
 * ====
 * the structure of this JavaScript version of poly2tri intentionally follows
 * as closely as possible the structure of the reference C++ version, to make it 
 * easier to keep the 2 versions in sync.
 */

var assert = _dereq_('./assert');
var PointError = _dereq_('./pointerror');
var Triangle = _dereq_('./triangle');
var Node = _dereq_('./advancingfront').Node;


// ------------------------------------------------------------------------utils

var utils = _dereq_('./utils');

/** @const */
var EPSILON = utils.EPSILON;

/** @const */
var Orientation = utils.Orientation;
/** @const */
var orient2d = utils.orient2d;
/** @const */
var inScanArea = utils.inScanArea;
/** @const */
var isAngleObtuse = utils.isAngleObtuse;


// ------------------------------------------------------------------------Sweep

/**
 * Triangulate the polygon with holes and Steiner points.
 * Do this AFTER you've added the polyline, holes, and Steiner points
 * @private
 * @param {!SweepContext} tcx - SweepContext object
 */
function triangulate(tcx) {
    tcx.initTriangulation();
    tcx.createAdvancingFront();
    // Sweep points; build mesh
    sweepPoints(tcx);
    // Clean up
    finalizationPolygon(tcx);
}

/**
 * Start sweeping the Y-sorted point set from bottom to top
 * @param {!SweepContext} tcx - SweepContext object
 */
function sweepPoints(tcx) {
    var i, len = tcx.pointCount();
    for (i = 1; i < len; ++i) {
        var point = tcx.getPoint(i);
        var node = pointEvent(tcx, point);
        var edges = point._p2t_edge_list;
        for (var j = 0; edges && j < edges.length; ++j) {
            edgeEventByEdge(tcx, edges[j], node);
        }
    }
}

/**
 * @param {!SweepContext} tcx - SweepContext object
 */
function finalizationPolygon(tcx) {
    // Get an Internal triangle to start with
    var t = tcx.front().head().next.triangle;
    var p = tcx.front().head().next.point;
    while (!t.getConstrainedEdgeCW(p)) {
        t = t.neighborCCW(p);
    }

    // Collect interior triangles constrained by edges
    tcx.meshClean(t);
}

/**
 * Find closes node to the left of the new point and
 * create a new triangle. If needed new holes and basins
 * will be filled to.
 * @param {!SweepContext} tcx - SweepContext object
 * @param {!XY} point   Point
 */
function pointEvent(tcx, point) {
    var node = tcx.locateNode(point);
    var new_node = newFrontTriangle(tcx, point, node);

    // Only need to check +epsilon since point never have smaller
    // x value than node due to how we fetch nodes from the front
    if (point.x <= node.point.x + (EPSILON)) {
        fill(tcx, node);
    }

    //tcx.AddNode(new_node);

    fillAdvancingFront(tcx, new_node);
    return new_node;
}

function edgeEventByEdge(tcx, edge, node) {
    tcx.edge_event.constrained_edge = edge;
    tcx.edge_event.right = (edge.p.x > edge.q.x);

    if (isEdgeSideOfTriangle(node.triangle, edge.p, edge.q)) {
        return;
    }

    // For now we will do all needed filling
    // TODO: integrate with flip process might give some better performance
    //       but for now this avoid the issue with cases that needs both flips and fills
    fillEdgeEvent(tcx, edge, node);
    edgeEventByPoints(tcx, edge.p, edge.q, node.triangle, edge.q);
}

function edgeEventByPoints(tcx, ep, eq, triangle, point) {
    if (isEdgeSideOfTriangle(triangle, ep, eq)) {
        return;
    }

    var p1 = triangle.pointCCW(point);
    var o1 = orient2d(eq, p1, ep);
    if (o1 === Orientation.COLLINEAR) {
        // TODO integrate here changes from C++ version
        // (C++ repo revision 09880a869095 dated March 8, 2011)
        throw new PointError('poly2tri EdgeEvent: Collinear not supported!', [eq, p1, ep]);
    }

    var p2 = triangle.pointCW(point);
    var o2 = orient2d(eq, p2, ep);
    if (o2 === Orientation.COLLINEAR) {
        // TODO integrate here changes from C++ version
        // (C++ repo revision 09880a869095 dated March 8, 2011)
        throw new PointError('poly2tri EdgeEvent: Collinear not supported!', [eq, p2, ep]);
    }

    if (o1 === o2) {
        // Need to decide if we are rotating CW or CCW to get to a triangle
        // that will cross edge
        if (o1 === Orientation.CW) {
            triangle = triangle.neighborCCW(point);
        } else {
            triangle = triangle.neighborCW(point);
        }
        edgeEventByPoints(tcx, ep, eq, triangle, point);
    } else {
        // This triangle crosses constraint so lets flippin start!
        flipEdgeEvent(tcx, ep, eq, triangle, point);
    }
}

function isEdgeSideOfTriangle(triangle, ep, eq) {
    var index = triangle.edgeIndex(ep, eq);
    if (index !== -1) {
        triangle.markConstrainedEdgeByIndex(index);
        var t = triangle.getNeighbor(index);
        if (t) {
            t.markConstrainedEdgeByPoints(ep, eq);
        }
        return true;
    }
    return false;
}

/**
 * Creates a new front triangle and legalize it
 * @param {!SweepContext} tcx - SweepContext object
 */
function newFrontTriangle(tcx, point, node) {
    var triangle = new Triangle(point, node.point, node.next.point);

    triangle.markNeighbor(node.triangle);
    tcx.addToMap(triangle);

    var new_node = new Node(point);
    new_node.next = node.next;
    new_node.prev = node;
    node.next.prev = new_node;
    node.next = new_node;

    if (!legalize(tcx, triangle)) {
        tcx.mapTriangleToNodes(triangle);
    }

    return new_node;
}

/**
 * Adds a triangle to the advancing front to fill a hole.
 * @param {!SweepContext} tcx - SweepContext object
 * @param node - middle node, that is the bottom of the hole
 */
function fill(tcx, node) {
    var triangle = new Triangle(node.prev.point, node.point, node.next.point);

    // TODO: should copy the constrained_edge value from neighbor triangles
    //       for now constrained_edge values are copied during the legalize
    triangle.markNeighbor(node.prev.triangle);
    triangle.markNeighbor(node.triangle);

    tcx.addToMap(triangle);

    // Update the advancing front
    node.prev.next = node.next;
    node.next.prev = node.prev;


    // If it was legalized the triangle has already been mapped
    if (!legalize(tcx, triangle)) {
        tcx.mapTriangleToNodes(triangle);
    }

    //tcx.removeNode(node);
}

/**
 * Fills holes in the Advancing Front
 * @param {!SweepContext} tcx - SweepContext object
 */
function fillAdvancingFront(tcx, n) {
    // Fill right holes
    var node = n.next;
    while (node.next) {
        // TODO integrate here changes from C++ version
        // (C++ repo revision acf81f1f1764 dated April 7, 2012)
        if (isAngleObtuse(node.point, node.next.point, node.prev.point)) {
            break;
        }
        fill(tcx, node);
        node = node.next;
    }

    // Fill left holes
    node = n.prev;
    while (node.prev) {
        // TODO integrate here changes from C++ version
        // (C++ repo revision acf81f1f1764 dated April 7, 2012)
        if (isAngleObtuse(node.point, node.next.point, node.prev.point)) {
            break;
        }
        fill(tcx, node);
        node = node.prev;
    }

    // Fill right basins
    if (n.next && n.next.next) {
        if (isBasinAngleRight(n)) {
            fillBasin(tcx, n);
        }
    }
}

/**
 * The basin angle is decided against the horizontal line [1,0].
 * @param {Node} node
 * @return {boolean} true if angle < 3*Ï€/4
 */
function isBasinAngleRight(node) {
    var ax = node.point.x - node.next.next.point.x;
    var ay = node.point.y - node.next.next.point.y;
    assert(ay >= 0, "unordered y");
    return (ax >= 0 || Math.abs(ax) < ay);
}

/**
 * Returns true if triangle was legalized
 * @param {!SweepContext} tcx - SweepContext object
 * @return {boolean}
 */
function legalize(tcx, t) {
    // To legalize a triangle we start by finding if any of the three edges
    // violate the Delaunay condition
    for (var i = 0; i < 3; ++i) {
        if (t.delaunay_edge[i]) {
            continue;
        }
        var ot = t.getNeighbor(i);
        if (ot) {
            var p = t.getPoint(i);
            var op = ot.oppositePoint(t, p);
            var oi = ot.index(op);

            // If this is a Constrained Edge or a Delaunay Edge(only during recursive legalization)
            // then we should not try to legalize
            if (ot.constrained_edge[oi] || ot.delaunay_edge[oi]) {
                t.constrained_edge[i] = ot.constrained_edge[oi];
                continue;
            }

            var inside = inCircle(p, t.pointCCW(p), t.pointCW(p), op);
            if (inside) {
                // Lets mark this shared edge as Delaunay
                t.delaunay_edge[i] = true;
                ot.delaunay_edge[oi] = true;

                // Lets rotate shared edge one vertex CW to legalize it
                rotateTrianglePair(t, p, ot, op);

                // We now got one valid Delaunay Edge shared by two triangles
                // This gives us 4 new edges to check for Delaunay

                // Make sure that triangle to node mapping is done only one time for a specific triangle
                var not_legalized = !legalize(tcx, t);
                if (not_legalized) {
                    tcx.mapTriangleToNodes(t);
                }

                not_legalized = !legalize(tcx, ot);
                if (not_legalized) {
                    tcx.mapTriangleToNodes(ot);
                }
                // Reset the Delaunay edges, since they only are valid Delaunay edges
                // until we add a new triangle or point.
                // XXX: need to think about this. Can these edges be tried after we
                //      return to previous recursive level?
                t.delaunay_edge[i] = false;
                ot.delaunay_edge[oi] = false;

                // If triangle have been legalized no need to check the other edges since
                // the recursive legalization will handles those so we can end here.
                return true;
            }
        }
    }
    return false;
}

/**
 * <b>Requirement</b>:<br>
 * 1. a,b and c form a triangle.<br>
 * 2. a and d is know to be on opposite side of bc<br>
 * <pre>
 *                a
 *                +
 *               / \
 *              /   \
 *            b/     \c
 *            +-------+
 *           /    d    \
 *          /           \
 * </pre>
 * <b>Fact</b>: d has to be in area B to have a chance to be inside the circle formed by
 *  a,b and c<br>
 *  d is outside B if orient2d(a,b,d) or orient2d(c,a,d) is CW<br>
 *  This preknowledge gives us a way to optimize the incircle test
 * @param pa - triangle point, opposite d
 * @param pb - triangle point
 * @param pc - triangle point
 * @param pd - point opposite a
 * @return {boolean} true if d is inside circle, false if on circle edge
 */
function inCircle(pa, pb, pc, pd) {
    var adx = pa.x - pd.x;
    var ady = pa.y - pd.y;
    var bdx = pb.x - pd.x;
    var bdy = pb.y - pd.y;

    var adxbdy = adx * bdy;
    var bdxady = bdx * ady;
    var oabd = adxbdy - bdxady;
    if (oabd <= 0) {
        return false;
    }

    var cdx = pc.x - pd.x;
    var cdy = pc.y - pd.y;

    var cdxady = cdx * ady;
    var adxcdy = adx * cdy;
    var ocad = cdxady - adxcdy;
    if (ocad <= 0) {
        return false;
    }

    var bdxcdy = bdx * cdy;
    var cdxbdy = cdx * bdy;

    var alift = adx * adx + ady * ady;
    var blift = bdx * bdx + bdy * bdy;
    var clift = cdx * cdx + cdy * cdy;

    var det = alift * (bdxcdy - cdxbdy) + blift * ocad + clift * oabd;
    return det > 0;
}

/**
 * Rotates a triangle pair one vertex CW
 *<pre>
 *       n2                    n2
 *  P +-----+             P +-----+
 *    | t  /|               |\  t |
 *    |   / |               | \   |
 *  n1|  /  |n3           n1|  \  |n3
 *    | /   |    after CW   |   \ |
 *    |/ oT |               | oT \|
 *    +-----+ oP            +-----+
 *       n4                    n4
 * </pre>
 */
function rotateTrianglePair(t, p, ot, op) {
    var n1, n2, n3, n4;
    n1 = t.neighborCCW(p);
    n2 = t.neighborCW(p);
    n3 = ot.neighborCCW(op);
    n4 = ot.neighborCW(op);

    var ce1, ce2, ce3, ce4;
    ce1 = t.getConstrainedEdgeCCW(p);
    ce2 = t.getConstrainedEdgeCW(p);
    ce3 = ot.getConstrainedEdgeCCW(op);
    ce4 = ot.getConstrainedEdgeCW(op);

    var de1, de2, de3, de4;
    de1 = t.getDelaunayEdgeCCW(p);
    de2 = t.getDelaunayEdgeCW(p);
    de3 = ot.getDelaunayEdgeCCW(op);
    de4 = ot.getDelaunayEdgeCW(op);

    t.legalize(p, op);
    ot.legalize(op, p);

    // Remap delaunay_edge
    ot.setDelaunayEdgeCCW(p, de1);
    t.setDelaunayEdgeCW(p, de2);
    t.setDelaunayEdgeCCW(op, de3);
    ot.setDelaunayEdgeCW(op, de4);

    // Remap constrained_edge
    ot.setConstrainedEdgeCCW(p, ce1);
    t.setConstrainedEdgeCW(p, ce2);
    t.setConstrainedEdgeCCW(op, ce3);
    ot.setConstrainedEdgeCW(op, ce4);

    // Remap neighbors
    // XXX: might optimize the markNeighbor by keeping track of
    //      what side should be assigned to what neighbor after the
    //      rotation. Now mark neighbor does lots of testing to find
    //      the right side.
    t.clearNeighbors();
    ot.clearNeighbors();
    if (n1) {
        ot.markNeighbor(n1);
    }
    if (n2) {
        t.markNeighbor(n2);
    }
    if (n3) {
        t.markNeighbor(n3);
    }
    if (n4) {
        ot.markNeighbor(n4);
    }
    t.markNeighbor(ot);
}

/**
 * Fills a basin that has formed on the Advancing Front to the right
 * of given node.<br>
 * First we decide a left,bottom and right node that forms the
 * boundaries of the basin. Then we do a reqursive fill.
 *
 * @param {!SweepContext} tcx - SweepContext object
 * @param node - starting node, this or next node will be left node
 */
function fillBasin(tcx, node) {
    if (orient2d(node.point, node.next.point, node.next.next.point) === Orientation.CCW) {
        tcx.basin.left_node = node.next.next;
    } else {
        tcx.basin.left_node = node.next;
    }

    // Find the bottom and right node
    tcx.basin.bottom_node = tcx.basin.left_node;
    while (tcx.basin.bottom_node.next && tcx.basin.bottom_node.point.y >= tcx.basin.bottom_node.next.point.y) {
        tcx.basin.bottom_node = tcx.basin.bottom_node.next;
    }
    if (tcx.basin.bottom_node === tcx.basin.left_node) {
        // No valid basin
        return;
    }

    tcx.basin.right_node = tcx.basin.bottom_node;
    while (tcx.basin.right_node.next && tcx.basin.right_node.point.y < tcx.basin.right_node.next.point.y) {
        tcx.basin.right_node = tcx.basin.right_node.next;
    }
    if (tcx.basin.right_node === tcx.basin.bottom_node) {
        // No valid basins
        return;
    }

    tcx.basin.width = tcx.basin.right_node.point.x - tcx.basin.left_node.point.x;
    tcx.basin.left_highest = tcx.basin.left_node.point.y > tcx.basin.right_node.point.y;

    fillBasinReq(tcx, tcx.basin.bottom_node);
}

/**
 * Recursive algorithm to fill a Basin with triangles
 *
 * @param {!SweepContext} tcx - SweepContext object
 * @param node - bottom_node
 */
function fillBasinReq(tcx, node) {
    // if shallow stop filling
    if (isShallow(tcx, node)) {
        return;
    }

    fill(tcx, node);

    var o;
    if (node.prev === tcx.basin.left_node && node.next === tcx.basin.right_node) {
        return;
    } else if (node.prev === tcx.basin.left_node) {
        o = orient2d(node.point, node.next.point, node.next.next.point);
        if (o === Orientation.CW) {
            return;
        }
        node = node.next;
    } else if (node.next === tcx.basin.right_node) {
        o = orient2d(node.point, node.prev.point, node.prev.prev.point);
        if (o === Orientation.CCW) {
            return;
        }
        node = node.prev;
    } else {
        // Continue with the neighbor node with lowest Y value
        if (node.prev.point.y < node.next.point.y) {
            node = node.prev;
        } else {
            node = node.next;
        }
    }

    fillBasinReq(tcx, node);
}

function isShallow(tcx, node) {
    var height;
    if (tcx.basin.left_highest) {
        height = tcx.basin.left_node.point.y - node.point.y;
    } else {
        height = tcx.basin.right_node.point.y - node.point.y;
    }

    // if shallow stop filling
    if (tcx.basin.width > height) {
        return true;
    }
    return false;
}

function fillEdgeEvent(tcx, edge, node) {
    if (tcx.edge_event.right) {
        fillRightAboveEdgeEvent(tcx, edge, node);
    } else {
        fillLeftAboveEdgeEvent(tcx, edge, node);
    }
}

function fillRightAboveEdgeEvent(tcx, edge, node) {
    while (node.next.point.x < edge.p.x) {
        // Check if next node is below the edge
        if (orient2d(edge.q, node.next.point, edge.p) === Orientation.CCW) {
            fillRightBelowEdgeEvent(tcx, edge, node);
        } else {
            node = node.next;
        }
    }
}

function fillRightBelowEdgeEvent(tcx, edge, node) {
    if (node.point.x < edge.p.x) {
        if (orient2d(node.point, node.next.point, node.next.next.point) === Orientation.CCW) {
            // Concave
            fillRightConcaveEdgeEvent(tcx, edge, node);
        } else {
            // Convex
            fillRightConvexEdgeEvent(tcx, edge, node);
            // Retry this one
            fillRightBelowEdgeEvent(tcx, edge, node);
        }
    }
}

function fillRightConcaveEdgeEvent(tcx, edge, node) {
    fill(tcx, node.next);
    if (node.next.point !== edge.p) {
        // Next above or below edge?
        if (orient2d(edge.q, node.next.point, edge.p) === Orientation.CCW) {
            // Below
            if (orient2d(node.point, node.next.point, node.next.next.point) === Orientation.CCW) {
                // Next is concave
                fillRightConcaveEdgeEvent(tcx, edge, node);
            } else {
                // Next is convex
                /* jshint noempty:false */
            }
        }
    }
}

function fillRightConvexEdgeEvent(tcx, edge, node) {
    // Next concave or convex?
    if (orient2d(node.next.point, node.next.next.point, node.next.next.next.point) === Orientation.CCW) {
        // Concave
        fillRightConcaveEdgeEvent(tcx, edge, node.next);
    } else {
        // Convex
        // Next above or below edge?
        if (orient2d(edge.q, node.next.next.point, edge.p) === Orientation.CCW) {
            // Below
            fillRightConvexEdgeEvent(tcx, edge, node.next);
        } else {
            // Above
            /* jshint noempty:false */
        }
    }
}

function fillLeftAboveEdgeEvent(tcx, edge, node) {
    while (node.prev.point.x > edge.p.x) {
        // Check if next node is below the edge
        if (orient2d(edge.q, node.prev.point, edge.p) === Orientation.CW) {
            fillLeftBelowEdgeEvent(tcx, edge, node);
        } else {
            node = node.prev;
        }
    }
}

function fillLeftBelowEdgeEvent(tcx, edge, node) {
    if (node.point.x > edge.p.x) {
        if (orient2d(node.point, node.prev.point, node.prev.prev.point) === Orientation.CW) {
            // Concave
            fillLeftConcaveEdgeEvent(tcx, edge, node);
        } else {
            // Convex
            fillLeftConvexEdgeEvent(tcx, edge, node);
            // Retry this one
            fillLeftBelowEdgeEvent(tcx, edge, node);
        }
    }
}

function fillLeftConvexEdgeEvent(tcx, edge, node) {
    // Next concave or convex?
    if (orient2d(node.prev.point, node.prev.prev.point, node.prev.prev.prev.point) === Orientation.CW) {
        // Concave
        fillLeftConcaveEdgeEvent(tcx, edge, node.prev);
    } else {
        // Convex
        // Next above or below edge?
        if (orient2d(edge.q, node.prev.prev.point, edge.p) === Orientation.CW) {
            // Below
            fillLeftConvexEdgeEvent(tcx, edge, node.prev);
        } else {
            // Above
            /* jshint noempty:false */
        }
    }
}

function fillLeftConcaveEdgeEvent(tcx, edge, node) {
    fill(tcx, node.prev);
    if (node.prev.point !== edge.p) {
        // Next above or below edge?
        if (orient2d(edge.q, node.prev.point, edge.p) === Orientation.CW) {
            // Below
            if (orient2d(node.point, node.prev.point, node.prev.prev.point) === Orientation.CW) {
                // Next is concave
                fillLeftConcaveEdgeEvent(tcx, edge, node);
            } else {
                // Next is convex
                /* jshint noempty:false */
            }
        }
    }
}

function flipEdgeEvent(tcx, ep, eq, t, p) {
    var ot = t.neighborAcross(p);
    assert(ot, "FLIP failed due to missing triangle!");

    var op = ot.oppositePoint(t, p);

    // Additional check from Java version (see issue #88)
    if (t.getConstrainedEdgeAcross(p)) {
        var index = t.index(p);
        throw new PointError("poly2tri Intersecting Constraints",
                [p, op, t.getPoint((index + 1) % 3), t.getPoint((index + 2) % 3)]);
    }

    if (inScanArea(p, t.pointCCW(p), t.pointCW(p), op)) {
        // Lets rotate shared edge one vertex CW
        rotateTrianglePair(t, p, ot, op);
        tcx.mapTriangleToNodes(t);
        tcx.mapTriangleToNodes(ot);

        // XXX: in the original C++ code for the next 2 lines, we are
        // comparing point values (and not pointers). In this JavaScript
        // code, we are comparing point references (pointers). This works
        // because we can't have 2 different points with the same values.
        // But to be really equivalent, we should use "Point.equals" here.
        if (p === eq && op === ep) {
            if (eq === tcx.edge_event.constrained_edge.q && ep === tcx.edge_event.constrained_edge.p) {
                t.markConstrainedEdgeByPoints(ep, eq);
                ot.markConstrainedEdgeByPoints(ep, eq);
                legalize(tcx, t);
                legalize(tcx, ot);
            } else {
                // XXX: I think one of the triangles should be legalized here?
                /* jshint noempty:false */
            }
        } else {
            var o = orient2d(eq, op, ep);
            t = nextFlipTriangle(tcx, o, t, ot, p, op);
            flipEdgeEvent(tcx, ep, eq, t, p);
        }
    } else {
        var newP = nextFlipPoint(ep, eq, ot, op);
        flipScanEdgeEvent(tcx, ep, eq, t, ot, newP);
        edgeEventByPoints(tcx, ep, eq, t, p);
    }
}

/**
 * After a flip we have two triangles and know that only one will still be
 * intersecting the edge. So decide which to contiune with and legalize the other
 *
 * @param {!SweepContext} tcx - SweepContext object
 * @param o - should be the result of an orient2d( eq, op, ep )
 * @param t - triangle 1
 * @param ot - triangle 2
 * @param p - a point shared by both triangles
 * @param op - another point shared by both triangles
 * @return returns the triangle still intersecting the edge
 */
function nextFlipTriangle(tcx, o, t, ot, p, op) {
    var edge_index;
    if (o === Orientation.CCW) {
        // ot is not crossing edge after flip
        edge_index = ot.edgeIndex(p, op);
        ot.delaunay_edge[edge_index] = true;
        legalize(tcx, ot);
        ot.clearDelaunayEdges();
        return t;
    }

    // t is not crossing edge after flip
    edge_index = t.edgeIndex(p, op);

    t.delaunay_edge[edge_index] = true;
    legalize(tcx, t);
    t.clearDelaunayEdges();
    return ot;
}

/**
 * When we need to traverse from one triangle to the next we need
 * the point in current triangle that is the opposite point to the next
 * triangle.
 */
function nextFlipPoint(ep, eq, ot, op) {
    var o2d = orient2d(eq, op, ep);
    if (o2d === Orientation.CW) {
        // Right
        return ot.pointCCW(op);
    } else if (o2d === Orientation.CCW) {
        // Left
        return ot.pointCW(op);
    } else {
        throw new PointError("poly2tri [Unsupported] nextFlipPoint: opposing point on constrained edge!", [eq, op, ep]);
    }
}

/**
 * Scan part of the FlipScan algorithm<br>
 * When a triangle pair isn't flippable we will scan for the next
 * point that is inside the flip triangle scan area. When found
 * we generate a new flipEdgeEvent
 *
 * @param {!SweepContext} tcx - SweepContext object
 * @param ep - last point on the edge we are traversing
 * @param eq - first point on the edge we are traversing
 * @param {!Triangle} flip_triangle - the current triangle sharing the point eq with edge
 * @param t
 * @param p
 */
function flipScanEdgeEvent(tcx, ep, eq, flip_triangle, t, p) {
    var ot = t.neighborAcross(p);
    assert(ot, "FLIP failed due to missing triangle");

    var op = ot.oppositePoint(t, p);

    if (inScanArea(eq, flip_triangle.pointCCW(eq), flip_triangle.pointCW(eq), op)) {
        // flip with new edge op.eq
        flipEdgeEvent(tcx, eq, op, ot, op);
    } else {
        var newP = nextFlipPoint(ep, eq, ot, op);
        flipScanEdgeEvent(tcx, ep, eq, flip_triangle, ot, newP);
    }
}


// ----------------------------------------------------------------------Exports

exports.triangulate = triangulate;

},{"./advancingfront":2,"./assert":3,"./pointerror":5,"./triangle":9,"./utils":10}],8:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint maxcomplexity:6 */

"use strict";


/*
 * Note
 * ====
 * the structure of this JavaScript version of poly2tri intentionally follows
 * as closely as possible the structure of the reference C++ version, to make it 
 * easier to keep the 2 versions in sync.
 */

var PointError = _dereq_('./pointerror');
var Point = _dereq_('./point');
var Triangle = _dereq_('./triangle');
var sweep = _dereq_('./sweep');
var AdvancingFront = _dereq_('./advancingfront');
var Node = AdvancingFront.Node;


// ------------------------------------------------------------------------utils

/**
 * Initial triangle factor, seed triangle will extend 30% of
 * PointSet width to both left and right.
 * @private
 * @const
 */
var kAlpha = 0.3;


// -------------------------------------------------------------------------Edge
/**
 * Represents a simple polygon's edge
 * @constructor
 * @struct
 * @private
 * @param {Point} p1
 * @param {Point} p2
 * @throw {PointError} if p1 is same as p2
 */
var Edge = function(p1, p2) {
    this.p = p1;
    this.q = p2;

    if (p1.y > p2.y) {
        this.q = p1;
        this.p = p2;
    } else if (p1.y === p2.y) {
        if (p1.x > p2.x) {
            this.q = p1;
            this.p = p2;
        } else if (p1.x === p2.x) {
            throw new PointError('poly2tri Invalid Edge constructor: repeated points!', [p1]);
        }
    }

    if (!this.q._p2t_edge_list) {
        this.q._p2t_edge_list = [];
    }
    this.q._p2t_edge_list.push(this);
};


// ------------------------------------------------------------------------Basin
/**
 * @constructor
 * @struct
 * @private
 */
var Basin = function() {
    /** @type {Node} */
    this.left_node = null;
    /** @type {Node} */
    this.bottom_node = null;
    /** @type {Node} */
    this.right_node = null;
    /** @type {number} */
    this.width = 0.0;
    /** @type {boolean} */
    this.left_highest = false;
};

Basin.prototype.clear = function() {
    this.left_node = null;
    this.bottom_node = null;
    this.right_node = null;
    this.width = 0.0;
    this.left_highest = false;
};

// --------------------------------------------------------------------EdgeEvent
/**
 * @constructor
 * @struct
 * @private
 */
var EdgeEvent = function() {
    /** @type {Edge} */
    this.constrained_edge = null;
    /** @type {boolean} */
    this.right = false;
};

// ----------------------------------------------------SweepContext (public API)
/**
 * SweepContext constructor option
 * @typedef {Object} SweepContextOptions
 * @property {boolean=} cloneArrays - if <code>true</code>, do a shallow copy of the Array parameters
 *                  (contour, holes). Points inside arrays are never copied.
 *                  Default is <code>false</code> : keep a reference to the array arguments,
 *                  who will be modified in place.
 */
/**
 * Constructor for the triangulation context.
 * It accepts a simple polyline (with non repeating points), 
 * which defines the constrained edges.
 *
 * @example
 *          var contour = [
 *              new poly2tri.Point(100, 100),
 *              new poly2tri.Point(100, 300),
 *              new poly2tri.Point(300, 300),
 *              new poly2tri.Point(300, 100)
 *          ];
 *          var swctx = new poly2tri.SweepContext(contour, {cloneArrays: true});
 * @example
 *          var contour = [{x:100, y:100}, {x:100, y:300}, {x:300, y:300}, {x:300, y:100}];
 *          var swctx = new poly2tri.SweepContext(contour, {cloneArrays: true});
 * @constructor
 * @public
 * @struct
 * @param {Array.<XY>} contour - array of point objects. The points can be either {@linkcode Point} instances,
 *          or any "Point like" custom class with <code>{x, y}</code> attributes.
 * @param {SweepContextOptions=} options - constructor options
 */
var SweepContext = function(contour, options) {
    options = options || {};
    this.triangles_ = [];
    this.map_ = [];
    this.points_ = (options.cloneArrays ? contour.slice(0) : contour);
    this.edge_list = [];

    // Bounding box of all points. Computed at the start of the triangulation, 
    // it is stored in case it is needed by the caller.
    this.pmin_ = this.pmax_ = null;

    /**
     * Advancing front
     * @private
     * @type {AdvancingFront}
     */
    this.front_ = null;

    /**
     * head point used with advancing front
     * @private
     * @type {Point}
     */
    this.head_ = null;

    /**
     * tail point used with advancing front
     * @private
     * @type {Point}
     */
    this.tail_ = null;

    /**
     * @private
     * @type {Node}
     */
    this.af_head_ = null;
    /**
     * @private
     * @type {Node}
     */
    this.af_middle_ = null;
    /**
     * @private
     * @type {Node}
     */
    this.af_tail_ = null;

    this.basin = new Basin();
    this.edge_event = new EdgeEvent();

    this.initEdges(this.points_);
};


/**
 * Add a hole to the constraints
 * @example
 *      var swctx = new poly2tri.SweepContext(contour);
 *      var hole = [
 *          new poly2tri.Point(200, 200),
 *          new poly2tri.Point(200, 250),
 *          new poly2tri.Point(250, 250)
 *      ];
 *      swctx.addHole(hole);
 * @example
 *      var swctx = new poly2tri.SweepContext(contour);
 *      swctx.addHole([{x:200, y:200}, {x:200, y:250}, {x:250, y:250}]);
 * @public
 * @param {Array.<XY>} polyline - array of "Point like" objects with {x,y}
 */
SweepContext.prototype.addHole = function(polyline) {
    this.initEdges(polyline);
    var i, len = polyline.length;
    for (i = 0; i < len; i++) {
        this.points_.push(polyline[i]);
    }
    return this; // for chaining
};

/**
 * For backward compatibility
 * @function
 * @deprecated use {@linkcode SweepContext#addHole} instead
 */
SweepContext.prototype.AddHole = SweepContext.prototype.addHole;


/**
 * Add several holes to the constraints
 * @example
 *      var swctx = new poly2tri.SweepContext(contour);
 *      var holes = [
 *          [ new poly2tri.Point(200, 200), new poly2tri.Point(200, 250), new poly2tri.Point(250, 250) ],
 *          [ new poly2tri.Point(300, 300), new poly2tri.Point(300, 350), new poly2tri.Point(350, 350) ]
 *      ];
 *      swctx.addHoles(holes);
 * @example
 *      var swctx = new poly2tri.SweepContext(contour);
 *      var holes = [
 *          [{x:200, y:200}, {x:200, y:250}, {x:250, y:250}],
 *          [{x:300, y:300}, {x:300, y:350}, {x:350, y:350}]
 *      ];
 *      swctx.addHoles(holes);
 * @public
 * @param {Array.<Array.<XY>>} holes - array of array of "Point like" objects with {x,y}
 */
// Method added in the JavaScript version (was not present in the c++ version)
SweepContext.prototype.addHoles = function(holes) {
    var i, len = holes.length;
    for (i = 0; i < len; i++) {
        this.initEdges(holes[i]);
    }
    this.points_ = this.points_.concat.apply(this.points_, holes);
    return this; // for chaining
};


/**
 * Add a Steiner point to the constraints
 * @example
 *      var swctx = new poly2tri.SweepContext(contour);
 *      var point = new poly2tri.Point(150, 150);
 *      swctx.addPoint(point);
 * @example
 *      var swctx = new poly2tri.SweepContext(contour);
 *      swctx.addPoint({x:150, y:150});
 * @public
 * @param {XY} point - any "Point like" object with {x,y}
 */
SweepContext.prototype.addPoint = function(point) {
    this.points_.push(point);
    return this; // for chaining
};

/**
 * For backward compatibility
 * @function
 * @deprecated use {@linkcode SweepContext#addPoint} instead
 */
SweepContext.prototype.AddPoint = SweepContext.prototype.addPoint;


/**
 * Add several Steiner points to the constraints
 * @example
 *      var swctx = new poly2tri.SweepContext(contour);
 *      var points = [
 *          new poly2tri.Point(150, 150),
 *          new poly2tri.Point(200, 250),
 *          new poly2tri.Point(250, 250)
 *      ];
 *      swctx.addPoints(points);
 * @example
 *      var swctx = new poly2tri.SweepContext(contour);
 *      swctx.addPoints([{x:150, y:150}, {x:200, y:250}, {x:250, y:250}]);
 * @public
 * @param {Array.<XY>} points - array of "Point like" object with {x,y}
 */
// Method added in the JavaScript version (was not present in the c++ version)
SweepContext.prototype.addPoints = function(points) {
    this.points_ = this.points_.concat(points);
    return this; // for chaining
};


/**
 * Triangulate the polygon with holes and Steiner points.
 * Do this AFTER you've added the polyline, holes, and Steiner points
 * @example
 *      var swctx = new poly2tri.SweepContext(contour);
 *      swctx.triangulate();
 *      var triangles = swctx.getTriangles();
 * @public
 */
// Shortcut method for sweep.triangulate(SweepContext).
// Method added in the JavaScript version (was not present in the c++ version)
SweepContext.prototype.triangulate = function() {
    sweep.triangulate(this);
    return this; // for chaining
};


/**
 * Get the bounding box of the provided constraints (contour, holes and 
 * Steinter points). Warning : these values are not available if the triangulation 
 * has not been done yet.
 * @public
 * @returns {{min:Point,max:Point}} object with 'min' and 'max' Point
 */
// Method added in the JavaScript version (was not present in the c++ version)
SweepContext.prototype.getBoundingBox = function() {
    return {min: this.pmin_, max: this.pmax_};
};

/**
 * Get result of triangulation.
 * The output triangles have vertices which are references
 * to the initial input points (not copies): any custom fields in the
 * initial points can be retrieved in the output triangles.
 * @example
 *      var swctx = new poly2tri.SweepContext(contour);
 *      swctx.triangulate();
 *      var triangles = swctx.getTriangles();
 * @example
 *      var contour = [{x:100, y:100, id:1}, {x:100, y:300, id:2}, {x:300, y:300, id:3}];
 *      var swctx = new poly2tri.SweepContext(contour);
 *      swctx.triangulate();
 *      var triangles = swctx.getTriangles();
 *      typeof triangles[0].getPoint(0).id
 *      // â†? "number"
 * @public
 * @returns {array<Triangle>}   array of triangles
 */
SweepContext.prototype.getTriangles = function() {
    return this.triangles_;
};

/**
 * For backward compatibility
 * @function
 * @deprecated use {@linkcode SweepContext#getTriangles} instead
 */
SweepContext.prototype.GetTriangles = SweepContext.prototype.getTriangles;


// ---------------------------------------------------SweepContext (private API)

/** @private */
SweepContext.prototype.front = function() {
    return this.front_;
};

/** @private */
SweepContext.prototype.pointCount = function() {
    return this.points_.length;
};

/** @private */
SweepContext.prototype.head = function() {
    return this.head_;
};

/** @private */
SweepContext.prototype.setHead = function(p1) {
    this.head_ = p1;
};

/** @private */
SweepContext.prototype.tail = function() {
    return this.tail_;
};

/** @private */
SweepContext.prototype.setTail = function(p1) {
    this.tail_ = p1;
};

/** @private */
SweepContext.prototype.getMap = function() {
    return this.map_;
};

/** @private */
SweepContext.prototype.initTriangulation = function() {
    var xmax = this.points_[0].x;
    var xmin = this.points_[0].x;
    var ymax = this.points_[0].y;
    var ymin = this.points_[0].y;

    // Calculate bounds
    var i, len = this.points_.length;
    for (i = 1; i < len; i++) {
        var p = this.points_[i];
        /* jshint expr:true */
        (p.x > xmax) && (xmax = p.x);
        (p.x < xmin) && (xmin = p.x);
        (p.y > ymax) && (ymax = p.y);
        (p.y < ymin) && (ymin = p.y);
    }
    this.pmin_ = new Point(xmin, ymin);
    this.pmax_ = new Point(xmax, ymax);

    var dx = kAlpha * (xmax - xmin);
    var dy = kAlpha * (ymax - ymin);
    this.head_ = new Point(xmax + dx, ymin - dy);
    this.tail_ = new Point(xmin - dx, ymin - dy);

    // Sort points along y-axis
    this.points_.sort(Point.compare);
};

/** @private */
SweepContext.prototype.initEdges = function(polyline, isOpen) {
    var i, len = polyline.length, iEnd = isOpen ? polyline.length-1 : polyline.length;
    for (i = 0; i < iEnd; ++i) {
        this.edge_list.push(new Edge(polyline[i], polyline[(i + 1) % len]));
    }
};

/** @private */
SweepContext.prototype.getPoint = function(index) {
    return this.points_[index];
};

/** @private */
SweepContext.prototype.addToMap = function(triangle) {
    this.map_.push(triangle);
};

/** @private */
SweepContext.prototype.locateNode = function(point) {
    return this.front_.locateNode(point.x);
};

/** @private */
SweepContext.prototype.createAdvancingFront = function() {
    var head;
    var middle;
    var tail;
    // Initial triangle
    var triangle = new Triangle(this.points_[0], this.tail_, this.head_);

    this.map_.push(triangle);

    head = new Node(triangle.getPoint(1), triangle);
    middle = new Node(triangle.getPoint(0), triangle);
    tail = new Node(triangle.getPoint(2));

    this.front_ = new AdvancingFront(head, tail);

    head.next = middle;
    middle.next = tail;
    middle.prev = head;
    tail.prev = middle;
};

/** @private */
SweepContext.prototype.removeNode = function(node) {
    // do nothing
    /* jshint unused:false */
};

/** @private */
SweepContext.prototype.mapTriangleToNodes = function(t) {
    for (var i = 0; i < 3; ++i) {
        if (!t.getNeighbor(i)) {
            var n = this.front_.locatePoint(t.pointCW(t.getPoint(i)));
            if (n) {
                n.triangle = t;
            }
        }
    }
};

/** @private */
SweepContext.prototype.removeFromMap = function(triangle) {
    var i, map = this.map_, len = map.length;
    for (i = 0; i < len; i++) {
        if (map[i] === triangle) {
            map.splice(i, 1);
            break;
        }
    }
};

/**
 * Do a depth first traversal to collect triangles
 * @private
 * @param {Triangle} triangle start
 */
SweepContext.prototype.meshClean = function(triangle) {
    // New implementation avoids recursive calls and use a loop instead.
    // Cf. issues # 57, 65 and 69.
    var triangles = [triangle], t, i;
    /* jshint boss:true */
    while (t = triangles.pop()) {
        if (!t.isInterior()) {
            t.setInterior(true);
            this.triangles_.push(t);
            for (i = 0; i < 3; i++) {
                if (!t.constrained_edge[i]) {
                    triangles.push(t.getNeighbor(i));
                }
            }
        }
    }
};

// ----------------------------------------------------------------------Exports

module.exports = SweepContext;

},{"./advancingfront":2,"./point":4,"./pointerror":5,"./sweep":7,"./triangle":9}],9:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 *
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

/* jshint maxcomplexity:10 */

"use strict";


/*
 * Note
 * ====
 * the structure of this JavaScript version of poly2tri intentionally follows
 * as closely as possible the structure of the reference C++ version, to make it 
 * easier to keep the 2 versions in sync.
 */

var xy = _dereq_("./xy");


// ---------------------------------------------------------------------Triangle
/**
 * Triangle class.<br>
 * Triangle-based data structures are known to have better performance than
 * quad-edge structures.
 * See: J. Shewchuk, "Triangle: Engineering a 2D Quality Mesh Generator and
 * Delaunay Triangulator", "Triangulations in CGAL"
 *
 * @constructor
 * @struct
 * @param {!XY} pa  point object with {x,y}
 * @param {!XY} pb  point object with {x,y}
 * @param {!XY} pc  point object with {x,y}
 */
var Triangle = function(a, b, c) {
    /**
     * Triangle points
     * @private
     * @type {Array.<XY>}
     */
    this.points_ = [a, b, c];

    /**
     * Neighbor list
     * @private
     * @type {Array.<Triangle>}
     */
    this.neighbors_ = [null, null, null];

    /**
     * Has this triangle been marked as an interior triangle?
     * @private
     * @type {boolean}
     */
    this.interior_ = false;

    /**
     * Flags to determine if an edge is a Constrained edge
     * @private
     * @type {Array.<boolean>}
     */
    this.constrained_edge = [false, false, false];

    /**
     * Flags to determine if an edge is a Delauney edge
     * @private
     * @type {Array.<boolean>}
     */
    this.delaunay_edge = [false, false, false];
};

var p2s = xy.toString;
/**
 * For pretty printing ex. <code>"[(5;42)(10;20)(21;30)]"</code>.
 * @public
 * @return {string}
 */
Triangle.prototype.toString = function() {
    return ("[" + p2s(this.points_[0]) + p2s(this.points_[1]) + p2s(this.points_[2]) + "]");
};

/**
 * Get one vertice of the triangle.
 * The output triangles of a triangulation have vertices which are references
 * to the initial input points (not copies): any custom fields in the
 * initial points can be retrieved in the output triangles.
 * @example
 *      var contour = [{x:100, y:100, id:1}, {x:100, y:300, id:2}, {x:300, y:300, id:3}];
 *      var swctx = new poly2tri.SweepContext(contour);
 *      swctx.triangulate();
 *      var triangles = swctx.getTriangles();
 *      typeof triangles[0].getPoint(0).id
 *      // â†? "number"
 * @param {number} index - vertice index: 0, 1 or 2
 * @public
 * @returns {XY}
 */
Triangle.prototype.getPoint = function(index) {
    return this.points_[index];
};

/**
 * For backward compatibility
 * @function
 * @deprecated use {@linkcode Triangle#getPoint} instead
 */
Triangle.prototype.GetPoint = Triangle.prototype.getPoint;

/**
 * Get all 3 vertices of the triangle as an array
 * @public
 * @return {Array.<XY>}
 */
// Method added in the JavaScript version (was not present in the c++ version)
Triangle.prototype.getPoints = function() {
    return this.points_;
};

/**
 * @private
 * @param {number} index
 * @returns {?Triangle}
 */
Triangle.prototype.getNeighbor = function(index) {
    return this.neighbors_[index];
};

/**
 * Test if this Triangle contains the Point object given as parameter as one of its vertices.
 * Only point references are compared, not values.
 * @public
 * @param {XY} point - point object with {x,y}
 * @return {boolean} <code>True</code> if the Point object is of the Triangle's vertices,
 *         <code>false</code> otherwise.
 */
Triangle.prototype.containsPoint = function(point) {
    var points = this.points_;
    // Here we are comparing point references, not values
    return (point === points[0] || point === points[1] || point === points[2]);
};

/**
 * Test if this Triangle contains the Edge object given as parameter as its
 * bounding edges. Only point references are compared, not values.
 * @private
 * @param {Edge} edge
 * @return {boolean} <code>True</code> if the Edge object is of the Triangle's bounding
 *         edges, <code>false</code> otherwise.
 */
Triangle.prototype.containsEdge = function(edge) {
    return this.containsPoint(edge.p) && this.containsPoint(edge.q);
};

/**
 * Test if this Triangle contains the two Point objects given as parameters among its vertices.
 * Only point references are compared, not values.
 * @param {XY} p1 - point object with {x,y}
 * @param {XY} p2 - point object with {x,y}
 * @return {boolean}
 */
Triangle.prototype.containsPoints = function(p1, p2) {
    return this.containsPoint(p1) && this.containsPoint(p2);
};

/**
 * Has this triangle been marked as an interior triangle?
 * @returns {boolean}
 */
Triangle.prototype.isInterior = function() {
    return this.interior_;
};

/**
 * Mark this triangle as an interior triangle
 * @private
 * @param {boolean} interior
 * @returns {Triangle} this
 */
Triangle.prototype.setInterior = function(interior) {
    this.interior_ = interior;
    return this;
};

/**
 * Update neighbor pointers.
 * @private
 * @param {XY} p1 - point object with {x,y}
 * @param {XY} p2 - point object with {x,y}
 * @param {Triangle} t Triangle object.
 * @throws {Error} if can't find objects
 */
Triangle.prototype.markNeighborPointers = function(p1, p2, t) {
    var points = this.points_;
    // Here we are comparing point references, not values
    if ((p1 === points[2] && p2 === points[1]) || (p1 === points[1] && p2 === points[2])) {
        this.neighbors_[0] = t;
    } else if ((p1 === points[0] && p2 === points[2]) || (p1 === points[2] && p2 === points[0])) {
        this.neighbors_[1] = t;
    } else if ((p1 === points[0] && p2 === points[1]) || (p1 === points[1] && p2 === points[0])) {
        this.neighbors_[2] = t;
    } else {
        throw new Error('poly2tri Invalid Triangle.markNeighborPointers() call');
    }
};

/**
 * Exhaustive search to update neighbor pointers
 * @private
 * @param {!Triangle} t
 */
Triangle.prototype.markNeighbor = function(t) {
    var points = this.points_;
    if (t.containsPoints(points[1], points[2])) {
        this.neighbors_[0] = t;
        t.markNeighborPointers(points[1], points[2], this);
    } else if (t.containsPoints(points[0], points[2])) {
        this.neighbors_[1] = t;
        t.markNeighborPointers(points[0], points[2], this);
    } else if (t.containsPoints(points[0], points[1])) {
        this.neighbors_[2] = t;
        t.markNeighborPointers(points[0], points[1], this);
    }
};


Triangle.prototype.clearNeighbors = function() {
    this.neighbors_[0] = null;
    this.neighbors_[1] = null;
    this.neighbors_[2] = null;
};

Triangle.prototype.clearDelaunayEdges = function() {
    this.delaunay_edge[0] = false;
    this.delaunay_edge[1] = false;
    this.delaunay_edge[2] = false;
};

/**
 * Returns the point clockwise to the given point.
 * @private
 * @param {XY} p - point object with {x,y}
 */
Triangle.prototype.pointCW = function(p) {
    var points = this.points_;
    // Here we are comparing point references, not values
    if (p === points[0]) {
        return points[2];
    } else if (p === points[1]) {
        return points[0];
    } else if (p === points[2]) {
        return points[1];
    } else {
        return null;
    }
};

/**
 * Returns the point counter-clockwise to the given point.
 * @private
 * @param {XY} p - point object with {x,y}
 */
Triangle.prototype.pointCCW = function(p) {
    var points = this.points_;
    // Here we are comparing point references, not values
    if (p === points[0]) {
        return points[1];
    } else if (p === points[1]) {
        return points[2];
    } else if (p === points[2]) {
        return points[0];
    } else {
        return null;
    }
};

/**
 * Returns the neighbor clockwise to given point.
 * @private
 * @param {XY} p - point object with {x,y}
 */
Triangle.prototype.neighborCW = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.neighbors_[1];
    } else if (p === this.points_[1]) {
        return this.neighbors_[2];
    } else {
        return this.neighbors_[0];
    }
};

/**
 * Returns the neighbor counter-clockwise to given point.
 * @private
 * @param {XY} p - point object with {x,y}
 */
Triangle.prototype.neighborCCW = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.neighbors_[2];
    } else if (p === this.points_[1]) {
        return this.neighbors_[0];
    } else {
        return this.neighbors_[1];
    }
};

Triangle.prototype.getConstrainedEdgeCW = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.constrained_edge[1];
    } else if (p === this.points_[1]) {
        return this.constrained_edge[2];
    } else {
        return this.constrained_edge[0];
    }
};

Triangle.prototype.getConstrainedEdgeCCW = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.constrained_edge[2];
    } else if (p === this.points_[1]) {
        return this.constrained_edge[0];
    } else {
        return this.constrained_edge[1];
    }
};

// Additional check from Java version (see issue #88)
Triangle.prototype.getConstrainedEdgeAcross = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.constrained_edge[0];
    } else if (p === this.points_[1]) {
        return this.constrained_edge[1];
    } else {
        return this.constrained_edge[2];
    }
};

Triangle.prototype.setConstrainedEdgeCW = function(p, ce) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        this.constrained_edge[1] = ce;
    } else if (p === this.points_[1]) {
        this.constrained_edge[2] = ce;
    } else {
        this.constrained_edge[0] = ce;
    }
};

Triangle.prototype.setConstrainedEdgeCCW = function(p, ce) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        this.constrained_edge[2] = ce;
    } else if (p === this.points_[1]) {
        this.constrained_edge[0] = ce;
    } else {
        this.constrained_edge[1] = ce;
    }
};

Triangle.prototype.getDelaunayEdgeCW = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.delaunay_edge[1];
    } else if (p === this.points_[1]) {
        return this.delaunay_edge[2];
    } else {
        return this.delaunay_edge[0];
    }
};

Triangle.prototype.getDelaunayEdgeCCW = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.delaunay_edge[2];
    } else if (p === this.points_[1]) {
        return this.delaunay_edge[0];
    } else {
        return this.delaunay_edge[1];
    }
};

Triangle.prototype.setDelaunayEdgeCW = function(p, e) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        this.delaunay_edge[1] = e;
    } else if (p === this.points_[1]) {
        this.delaunay_edge[2] = e;
    } else {
        this.delaunay_edge[0] = e;
    }
};

Triangle.prototype.setDelaunayEdgeCCW = function(p, e) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        this.delaunay_edge[2] = e;
    } else if (p === this.points_[1]) {
        this.delaunay_edge[0] = e;
    } else {
        this.delaunay_edge[1] = e;
    }
};

/**
 * The neighbor across to given point.
 * @private
 * @param {XY} p - point object with {x,y}
 * @returns {Triangle}
 */
Triangle.prototype.neighborAcross = function(p) {
    // Here we are comparing point references, not values
    if (p === this.points_[0]) {
        return this.neighbors_[0];
    } else if (p === this.points_[1]) {
        return this.neighbors_[1];
    } else {
        return this.neighbors_[2];
    }
};

/**
 * @private
 * @param {!Triangle} t Triangle object.
 * @param {XY} p - point object with {x,y}
 */
Triangle.prototype.oppositePoint = function(t, p) {
    var cw = t.pointCW(p);
    return this.pointCW(cw);
};

/**
 * Legalize triangle by rotating clockwise around oPoint
 * @private
 * @param {XY} opoint - point object with {x,y}
 * @param {XY} npoint - point object with {x,y}
 * @throws {Error} if oPoint can not be found
 */
Triangle.prototype.legalize = function(opoint, npoint) {
    var points = this.points_;
    // Here we are comparing point references, not values
    if (opoint === points[0]) {
        points[1] = points[0];
        points[0] = points[2];
        points[2] = npoint;
    } else if (opoint === points[1]) {
        points[2] = points[1];
        points[1] = points[0];
        points[0] = npoint;
    } else if (opoint === points[2]) {
        points[0] = points[2];
        points[2] = points[1];
        points[1] = npoint;
    } else {
        throw new Error('poly2tri Invalid Triangle.legalize() call');
    }
};

/**
 * Returns the index of a point in the triangle. 
 * The point *must* be a reference to one of the triangle's vertices.
 * @private
 * @param {XY} p - point object with {x,y}
 * @returns {number} index 0, 1 or 2
 * @throws {Error} if p can not be found
 */
Triangle.prototype.index = function(p) {
    var points = this.points_;
    // Here we are comparing point references, not values
    if (p === points[0]) {
        return 0;
    } else if (p === points[1]) {
        return 1;
    } else if (p === points[2]) {
        return 2;
    } else {
        throw new Error('poly2tri Invalid Triangle.index() call');
    }
};

/**
 * @private
 * @param {XY} p1 - point object with {x,y}
 * @param {XY} p2 - point object with {x,y}
 * @return {number} index 0, 1 or 2, or -1 if errror
 */
Triangle.prototype.edgeIndex = function(p1, p2) {
    var points = this.points_;
    // Here we are comparing point references, not values
    if (p1 === points[0]) {
        if (p2 === points[1]) {
            return 2;
        } else if (p2 === points[2]) {
            return 1;
        }
    } else if (p1 === points[1]) {
        if (p2 === points[2]) {
            return 0;
        } else if (p2 === points[0]) {
            return 2;
        }
    } else if (p1 === points[2]) {
        if (p2 === points[0]) {
            return 1;
        } else if (p2 === points[1]) {
            return 0;
        }
    }
    return -1;
};

/**
 * Mark an edge of this triangle as constrained.
 * @private
 * @param {number} index - edge index
 */
Triangle.prototype.markConstrainedEdgeByIndex = function(index) {
    this.constrained_edge[index] = true;
};
/**
 * Mark an edge of this triangle as constrained.
 * @private
 * @param {Edge} edge instance
 */
Triangle.prototype.markConstrainedEdgeByEdge = function(edge) {
    this.markConstrainedEdgeByPoints(edge.p, edge.q);
};
/**
 * Mark an edge of this triangle as constrained.
 * This method takes two Point instances defining the edge of the triangle.
 * @private
 * @param {XY} p - point object with {x,y}
 * @param {XY} q - point object with {x,y}
 */
Triangle.prototype.markConstrainedEdgeByPoints = function(p, q) {
    var points = this.points_;
    // Here we are comparing point references, not values        
    if ((q === points[0] && p === points[1]) || (q === points[1] && p === points[0])) {
        this.constrained_edge[2] = true;
    } else if ((q === points[0] && p === points[2]) || (q === points[2] && p === points[0])) {
        this.constrained_edge[1] = true;
    } else if ((q === points[1] && p === points[2]) || (q === points[2] && p === points[1])) {
        this.constrained_edge[0] = true;
    }
};


// ---------------------------------------------------------Exports (public API)

module.exports = Triangle;

},{"./xy":11}],10:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";

/**
 * Precision to detect repeated or collinear points
 * @private
 * @const {number}
 * @default
 */
var EPSILON = 1e-12;
exports.EPSILON = EPSILON;

/**
 * @private
 * @enum {number}
 * @readonly
 */
var Orientation = {
    "CW": 1,
    "CCW": -1,
    "COLLINEAR": 0
};
exports.Orientation = Orientation;


/**
 * Formula to calculate signed area<br>
 * Positive if CCW<br>
 * Negative if CW<br>
 * 0 if collinear<br>
 * <pre>
 * A[P1,P2,P3]  =  (x1*y2 - y1*x2) + (x2*y3 - y2*x3) + (x3*y1 - y3*x1)
 *              =  (x1-x3)*(y2-y3) - (y1-y3)*(x2-x3)
 * </pre>
 *
 * @private
 * @param {!XY} pa  point object with {x,y}
 * @param {!XY} pb  point object with {x,y}
 * @param {!XY} pc  point object with {x,y}
 * @return {Orientation}
 */
function orient2d(pa, pb, pc) {
    var detleft = (pa.x - pc.x) * (pb.y - pc.y);
    var detright = (pa.y - pc.y) * (pb.x - pc.x);
    var val = detleft - detright;
    if (val > -(EPSILON) && val < (EPSILON)) {
        return Orientation.COLLINEAR;
    } else if (val > 0) {
        return Orientation.CCW;
    } else {
        return Orientation.CW;
    }
}
exports.orient2d = orient2d;


/**
 *
 * @private
 * @param {!XY} pa  point object with {x,y}
 * @param {!XY} pb  point object with {x,y}
 * @param {!XY} pc  point object with {x,y}
 * @param {!XY} pd  point object with {x,y}
 * @return {boolean}
 */
function inScanArea(pa, pb, pc, pd) {
    var oadb = (pa.x - pb.x) * (pd.y - pb.y) - (pd.x - pb.x) * (pa.y - pb.y);
    if (oadb >= -EPSILON) {
        return false;
    }

    var oadc = (pa.x - pc.x) * (pd.y - pc.y) - (pd.x - pc.x) * (pa.y - pc.y);
    if (oadc <= EPSILON) {
        return false;
    }
    return true;
}
exports.inScanArea = inScanArea;


/**
 * Check if the angle between (pa,pb) and (pa,pc) is obtuse i.e. (angle > Ï€/2 || angle < -Ï€/2)
 *
 * @private
 * @param {!XY} pa  point object with {x,y}
 * @param {!XY} pb  point object with {x,y}
 * @param {!XY} pc  point object with {x,y}
 * @return {boolean} true if angle is obtuse
 */
function isAngleObtuse(pa, pb, pc) {
    var ax = pb.x - pa.x;
    var ay = pb.y - pa.y;
    var bx = pc.x - pa.x;
    var by = pc.y - pa.y;
    return (ax * bx + ay * by) < 0;
}
exports.isAngleObtuse = isAngleObtuse;


},{}],11:[function(_dereq_,module,exports){
/*
 * Poly2Tri Copyright (c) 2009-2014, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 * 
 * poly2tri.js (JavaScript port) (c) 2009-2014, Poly2Tri Contributors
 * https://github.com/r3mi/poly2tri.js
 * 
 * All rights reserved.
 * 
 * Distributed under the 3-clause BSD License, see LICENSE.txt
 */

"use strict";

/**
 * The following functions operate on "Point" or any "Point like" object with {x,y},
 * as defined by the {@link XY} type
 * ([duck typing]{@link http://en.wikipedia.org/wiki/Duck_typing}).
 * @module
 * @private
 */

/**
 * poly2tri.js supports using custom point class instead of {@linkcode Point}.
 * Any "Point like" object with <code>{x, y}</code> attributes is supported
 * to initialize the SweepContext polylines and points
 * ([duck typing]{@link http://en.wikipedia.org/wiki/Duck_typing}).
 *
 * poly2tri.js might add extra fields to the point objects when computing the
 * triangulation : they are prefixed with <code>_p2t_</code> to avoid collisions
 * with fields in the custom class.
 *
 * @example
 *      var contour = [{x:100, y:100}, {x:100, y:300}, {x:300, y:300}, {x:300, y:100}];
 *      var swctx = new poly2tri.SweepContext(contour);
 *
 * @typedef {Object} XY
 * @property {number} x - x coordinate
 * @property {number} y - y coordinate
 */


/**
 * Point pretty printing : prints x and y coordinates.
 * @example
 *      xy.toStringBase({x:5, y:42})
 *      // â†? "(5;42)"
 * @protected
 * @param {!XY} p - point object with {x,y}
 * @returns {string} <code>"(x;y)"</code>
 */
function toStringBase(p) {
    return ("(" + p.x + ";" + p.y + ")");
}

/**
 * Point pretty printing. Delegates to the point's custom "toString()" method if exists,
 * else simply prints x and y coordinates.
 * @example
 *      xy.toString({x:5, y:42})
 *      // â†? "(5;42)"
 * @example
 *      xy.toString({x:5,y:42,toString:function() {return this.x+":"+this.y;}})
 *      // â†? "5:42"
 * @param {!XY} p - point object with {x,y}
 * @returns {string} <code>"(x;y)"</code>
 */
function toString(p) {
    // Try a custom toString first, and fallback to own implementation if none
    var s = p.toString();
    return (s === '[object Object]' ? toStringBase(p) : s);
}


/**
 * Compare two points component-wise. Ordered by y axis first, then x axis.
 * @param {!XY} a - point object with {x,y}
 * @param {!XY} b - point object with {x,y}
 * @return {number} <code>&lt; 0</code> if <code>a &lt; b</code>,
 *         <code>&gt; 0</code> if <code>a &gt; b</code>, 
 *         <code>0</code> otherwise.
 */
function compare(a, b) {
    if (a.y === b.y) {
        return a.x - b.x;
    } else {
        return a.y - b.y;
    }
}

/**
 * Test two Point objects for equality.
 * @param {!XY} a - point object with {x,y}
 * @param {!XY} b - point object with {x,y}
 * @return {boolean} <code>True</code> if <code>a == b</code>, <code>false</code> otherwise.
 */
function equals(a, b) {
    return a.x === b.x && a.y === b.y;
}


module.exports = {
    toString: toString,
    toStringBase: toStringBase,
    compare: compare,
    equals: equals
};

},{}]},{},[6])
(6)
});
/**
 * Created by stanevt on 5/8/2015.
 */
function init_three_triangulator() {

"use strict";

if (Autodesk.Viewing.Private.Triangulator)
    return;

Autodesk.Viewing.Private.Triangulator = (function() {

    var avp = Autodesk.Viewing.Private;

    var TOL = 1e-10;

    function isZero(f) {
        return Math.abs(f) < TOL;
    }
    
    function isEqual(a, b) {
        return isZero(a - b);
    }


    function makePointId(idFrom, idTo, meshId) {
        var tmp = idFrom < idTo ? (idFrom + ":" + idTo) : (idTo + ":" + idFrom);
        return meshId + ":" + tmp;
    }

    function Edge(pt1, pt2, id1From, id1To, id2From, id2To, meshId) {

        this.pt1 = pt1;
        this.pt2 = pt2;

        this.p1 = -1;
        this.p2 = -1;

        //Use the triangle edges that created the two planar edge points
        //as IDs for those points.
        this.eid1 = makePointId(id1From, id1To, meshId);
        this.eid2 = makePointId(id2From, id2To, meshId);
    }


    function IntervalNode() {
        
        this.bbox = new THREE.Box2();
        this.left = null;
        this.right = null;
        this.node_edges = [];
    }

    //Acceleration structure for point-in-polygon checking
    function IntervalTree(pts, edges, bbox) {

        this.pts = pts;
        this.edges = edges;
        this.bbox = bbox;
        this.pipResult = false;

    }
    


    IntervalTree.prototype.splitNode = function(node) {
    
        if (node.bbox.min.y >= node.bbox.max.y)
            return;
            
        if (node.node_edges.length < 3)
            return;
    
        var split = 0.5 * (node.bbox.min.y + node.bbox.max.y);
        
        //node.bbox.makeEmpty();

        node.left = new IntervalNode();
        node.right = new IntervalNode();
        
        var pts = this.pts;
        var ne = node.node_edges;
        var remaining_node_edges = [];
        var tmpPt = new THREE.Vector2();
        
        for (var i=0; i<ne.length; i++) {

            var e = this.edges[ne[i]];

            var p1y = pts[e.p1].y;
            var p2y = pts[e.p2].y;

            if (p1y > p2y) {
                var tmp = p1y;
                p1y = p2y;
                p2y = tmp;
            }
            
            var boxPtr = null;
            
            if (p2y < split) {
                node.left.node_edges.push(ne[i]);
                boxPtr = node.left.bbox;
            } else if (p1y > split) {
                node.right.node_edges.push(ne[i]);
                boxPtr = node.right.bbox;
            } else {
                remaining_node_edges.push(ne[i]);
                //boxPtr = node.bbox;
            }
            
            if (boxPtr) {
                tmpPt.set(pts[e.p1].x, pts[e.p1].y);
                boxPtr.expandByPoint(tmpPt);
                tmpPt.set(pts[e.p2].x, pts[e.p2].y);
                boxPtr.expandByPoint(tmpPt);
            }
        }
        
        node.node_edges = remaining_node_edges;
        
        if (node.left.node_edges.length)
            this.splitNode(node.left);
        if (node.right.node_edges.length)
            this.splitNode(node.right);
    };
    

    IntervalTree.prototype.build = function() {

        this.root = new IntervalNode();

        var edge_indices = this.root.node_edges;
        for (var i=0; i<this.edges.length; i++)
            edge_indices.push(i);

        this.root.bbox.copy(this.bbox);

        //split recursively
        this.splitNode(this.root);
    };




    IntervalTree.prototype.pointInPolygonRec = function(node, x, y) {
    
        if (node.bbox.min.y <= y && node.bbox.max.y >= y) {
        
            var pts = this.pts;
            var ne = node.node_edges;
        
            for (var i=0, iEnd=ne.length; i<iEnd; i++) {
            
                var e = this.edges[ne[i]];

                // get the last point in the polygon
                var p1 = pts[e.p1];
                var vtx0X = p1.x;
                var vtx0Y = p1.y;

                // get test bit for above/below X axis
                var yflag0 = (vtx0Y >= y);

                var p2 = pts[e.p2];
                var vtx1X = p2.x;
                var vtx1Y = p2.y;

                var yflag1 = (vtx1Y >= y);

                // Check if endpoints straddle (are on opposite sides) of X axis
                // (i.e. the Y's differ); if so, +X ray could intersect this edge.
                // The old test also checked whether the endpoints are both to the
                // right or to the left of the test point.  However, given the faster
                // intersection point computation used below, this test was found to
                // be a break-even proposition for most polygons and a loser for
                // triangles (where 50% or more of the edges which survive this test
                // will cross quadrants and so have to have the X intersection computed
                // anyway).  I credit Joseph Samosky with inspiring me to try dropping
                // the "both left or both right" part of my code.
                if (yflag0 != yflag1)
                {
                    // Check intersection of pgon segment with +X ray.
                    // Note if >= point's X; if so, the ray hits it.
                    // The division operation is avoided for the ">=" test by checking
                    // the sign of the first vertex wrto the test point; idea inspired
                    // by Joseph Samosky's and Mark Haigh-Hutchinson's different
                    // polygon inclusion tests.
                    if (((vtx1Y-y)*(vtx0X-vtx1X) >=
                            (vtx1X-x)*(vtx0Y-vtx1Y)) == yflag1)
                    {
                        this.pipResult = !this.pipResult;
                    }
                }

            }
        
        }
        
        var nl = node.left;
        if (nl && nl.bbox.min.y <= y && nl.bbox.max.y >= y) {
            this.pointInPolygonRec(nl, x, y);
        }
        
        var nr = node.right;
        if (nr && nr.bbox.min.y <= y && nr.bbox.max.y >= y) {
            this.pointInPolygonRec(nr, x, y);
        }

    };
    
    IntervalTree.prototype.pointInPolygon = function(x, y) {
    
          this.pipResult = false;
          
          this.pointInPolygonRec(this.root, x, y);
          
          return this.pipResult;
    
    };



    
    //Functionality for converting a list of two point segments into a connected
    //set of (hopefully) closed contour lines. The contour set is then used
    //for triangulation
    function ContourSet(edges, bbox) {
    
        this.edges = edges;
        this.bbox = bbox;
    
        this.pts = [];
        this.idmap = {};
        this.xymap = {};
        this.contours = [];

        this.scale = (1e6) / this.bbox.size().length();
    }
    
    
    
    ContourSet.prototype.getPointIndex = function(px, py, eid) {
        var findByEdgeId = this.idmap[eid];
        if (findByEdgeId !== undefined) {
            return findByEdgeId;
        }
/*
        findByEdgeId = this.idmap[eid] = this.pts.length;
        pts.push({x: px, y: py, id: eid});
        return findByEdgeId;
*/

        var x = 0 | (px * this.scale);
        var y = 0 | (py * this.scale);

        var mx = this.xymap[x];
        var my;

        if (mx === undefined) {
            this.xymap[x] = mx = {};
            my = undefined;
        } else {
            my = mx[y];
        }

        if (my === undefined) {
            mx[y] = my = this.pts.length;
            this.idmap[eid] = my;
            this.pts.push({x: px, y: py /*, id : eid*/});
        }

        return my;
    };
    
    ContourSet.prototype.snapEdges = function() {
        
        for (var i=0; i<this.edges.length; i++) {

            var e = this.edges[i];

            e.p1 = this.getPointIndex(e.pt1.x, e.pt1.y, e.eid1);
            e.p2 = this.getPointIndex(e.pt2.x, e.pt2.y, e.eid2);
        }
    };

    ContourSet.prototype.sanitizeEdges = function() {
        var edgeSet = {};
        var sanitizedEdges = [];

        for (var i = 0, len = this.edges.length; i < len; i++) {
            var e = this.edges[i];
            if (e.p1 === e.p2) {
                continue;
            }

            var key = Math.min(e.p1, e.p2) + ':' + Math.max(e.p1, e.p2);
            if (edgeSet[key] !== true) {
                edgeSet[key] = true;
                sanitizedEdges.push(e);
            }
        }

        this.edges = sanitizedEdges;
    };

    ContourSet.prototype.stitchContours = function() {
        
        //Create jump table from edge to edge
        //and back
        var edge_table = {};
        
        for (var i=0; i<this.edges.length; i++) {
            var e = this.edges[i];
            
            if (e.p1 === e.p2)
                continue;
            
            if (edge_table[e.p1] !== undefined)
                edge_table[e.p1].push(e.p2);
            else                
                edge_table[e.p1] = [e.p2];
            
            if (edge_table[e.p2] !== undefined)
                edge_table[e.p2].push(e.p1);
            else
                edge_table[e.p2] = [e.p1];
        }
        
        var cur_cntr = [];
        
        for (var p in edge_table) {
            if (edge_table[p].length !== 2) {
                avp.logger.warn("Incomplete edge table");
                break;
            }
        }
        
        //Start with the first edge, and stitch until we can no longer
        while (true) {
        
            var sfrom = undefined;
        
            //Look for doubly connected point first
            for (var p in edge_table) {
                if (edge_table[p].length > 1) {
                    sfrom = p;
                    break;
                }
            }

            //If no double-connected point found, we know
            //the it will be an open contour, but stitch as much 
            //as we can anyway.
            if (!sfrom) {            
                for (var p in edge_table) {
                    if (edge_table[p].length > 0) {
                        sfrom = p;
                        break;
                    }
                }
            }

            if (!sfrom)
                break;

            var prev = -1;
            var cur = parseInt(sfrom);
            var cur_segs = edge_table[sfrom];

            //start a new contour
            cur_cntr.push(cur);

            while (cur_segs && cur_segs.length) {
                
                var toPt = cur_segs.shift();
                
                //skip backpointer if we hit it
                if (toPt === prev)
                    toPt = cur_segs.shift();

                if (toPt === undefined) {
                    delete edge_table[cur];
                    break;
                }
                        
                cur_cntr.push(toPt);
                
                if (cur_segs.length == 0)
                    delete edge_table[cur];
                else if (cur_segs[0] === prev)
                    delete edge_table[cur];
                
                prev = cur;
                cur = toPt;
                cur_segs = edge_table[toPt];
            }
            
            if (cur_cntr.length) {
                this.contours.push(cur_cntr);
                cur_cntr = [];
            }
        }

        var openCntrs = [];
        for (var i=0; i<this.contours.length; i++) {
            var cntr = this.contours[i];
            if (cntr[0] !== cntr[cntr.length-1])
                openCntrs.push(cntr);
        }


        if (openCntrs.length) {
            //avp.logger.warn("Incomplete stitch");
            
            var didSomething = true;
            while (didSomething) {
                
                didSomething = false;

                //Try to combine contours
                var cntr_edge_table = {};
                var contours = this.contours;
                
                for (var i=0; i<contours.length; i++) {
                    var cntr = contours[i];
                    var start = cntr[0];
                    var end = cntr[cntr.length-1];
                    
                    if (start === end)
                        continue;
                    
                    if (!cntr_edge_table[start])
                        cntr_edge_table[start] = [-i-1];
                    else
                        cntr_edge_table[start].push(-i-1);
                        
                    
                    if (!cntr_edge_table[end])
                        cntr_edge_table[end] = [i];
                    else
                        cntr_edge_table[end].push(i);
                }

                for (var p in cntr_edge_table) {
                    var entry = cntr_edge_table[p];

                    if (entry.length == 2) {
                        var toerase = undefined;

                        if (entry[0] < 0 && entry[1] < 0) {
                            var c1 = -entry[0]-1; var c2 = -entry[1]-1;
                            //join start point to startpoint
                            contours[c2].shift();
                            Array.prototype.push.apply(contours[c1].reverse(),contours[c2]);
                            toerase = c2;
                        }

                        if (entry[0] < 0 && entry[1] > 0) {
                            var c1 = -entry[0]-1; var c2 = entry[1];
                            //join start point to endpoint
                            contours[c2].pop();
                            Array.prototype.push.apply(contours[c2], contours[c1]);
                            toerase = c1;
                        }

                        if (entry[0] > 0 && entry[1] < 0) {
                            var c1 = entry[0]; var c2 = -entry[1]-1;
                            //join end point to startpoint
                            contours[c1].pop();
                            Array.prototype.push.apply(contours[c1], contours[c2]);
                            toerase = c2;
                        }

                        if (entry[0] > 0 && entry[1] > 0) {
                            var c1 = entry[0]; var c2 = entry[1];
                            //join end point to endpoint
                            contours[c1].pop();
                            Array.prototype.push.apply(contours[c1], contours[c2].reverse());
                            toerase = c2;
                        }
                        
                        if (toerase !== undefined) {
                            contours.splice(toerase, 1);
                            didSomething = true;
                        }
                        break;
                    }
                }

            }
            
        }


    };




    

    function TriangulatedSurface(cset) {

        this.indices = [];

        this.cset = cset;
        var _pts = this.pts = cset.pts;
        
        this.intervalTree = new IntervalTree(cset.pts, cset.edges, cset.bbox);
        this.intervalTree.build();


        for (var i=0; i<_pts.length; i++) {
            _pts[i].id = i;
        }
        
        var sweepCtx = new lmv_poly2tri.SweepContext([]);
        
        sweepCtx.points_  = _pts.slice();



        if (cset.contours) {
        
            var contours = this.cset.contours;
            
            for (var j=0; j<contours.length; j++) {
            
                var cntr = contours[j];
                
                //Contour is not closed
                var isOpen = (cntr[0] !== cntr[cntr.length-1]);
                
                //if (isOpen)
                //    continue;
                
                var edge = [];
                
                for (var k=0; k<cntr.length-1; k++) {
                    edge.push(_pts[cntr[k]]);
                }
                
                sweepCtx.initEdges(edge, isOpen);
            }

        } else {
        
            var edges = this.cset.edges;
        
            for (var i=0; i<edges.length; i++) {
                
                var e = edges[i];
                
                if (e.p1 == e.p2)
                    continue;
                
                var triedge = [_pts[e.p1], _pts[e.p2]];
                sweepCtx.initEdges(triedge, true);
            }
            
        }
        
        this.triangulate(sweepCtx);
        this.processResult(sweepCtx);
    }
    
    
    TriangulatedSurface.prototype.triangulate = function(sweepCtx) {
    
        try {
            sweepCtx.triangulate();
        } catch (e) {
        }
    };
    
    
    TriangulatedSurface.prototype.processResult = function(sweepCtx) {
        for (var i=0; i<sweepCtx.map_.length; i++) {
            var t = sweepCtx.map_[i];
            var p0 = t.points_[0];
            var p1 = t.points_[1];
            var p2 = t.points_[2];

            if (p0.id !== undefined && p1.id !== undefined && p2.id !== undefined)
                this.filterFace(p0.id, p1.id, p2.id);

        }
    };
    
    
    
    TriangulatedSurface.prototype.pointInEdgeList = function(x, y) {
        var yflag0, yflag1;
        var vtx0X, vtx0Y, vtx1X, vtx1Y;

        var pts = this.cset.pts;
        var edges = this.cset.edges;

        var inside_flag = false;


        for (var j= 0, jEnd = edges.length; j<jEnd; ++j)
        {
            var e = edges[j];

            // get the last point in the polygon
            vtx0X = pts[e.p1].x;
            vtx0Y = pts[e.p1].y;

            // get test bit for above/below X axis
            yflag0 = (vtx0Y >= y);


            vtx1X = pts[e.p2].x;
            vtx1Y = pts[e.p2].y;

            yflag1 = (vtx1Y >= y);

            // Check if endpoints straddle (are on opposite sides) of X axis
            // (i.e. the Y's differ); if so, +X ray could intersect this edge.
            // The old test also checked whether the endpoints are both to the
            // right or to the left of the test point.  However, given the faster
            // intersection point computation used below, this test was found to
            // be a break-even proposition for most polygons and a loser for
            // triangles (where 50% or more of the edges which survive this test
            // will cross quadrants and so have to have the X intersection computed
            // anyway).  I credit Joseph Samosky with inspiring me to try dropping
            // the "both left or both right" part of my code.
            if (yflag0 != yflag1)
            {
                // Check intersection of pgon segment with +X ray.
                // Note if >= point's X; if so, the ray hits it.
                // The division operation is avoided for the ">=" test by checking
                // the sign of the first vertex wrto the test point; idea inspired
                // by Joseph Samosky's and Mark Haigh-Hutchinson's different
                // polygon inclusion tests.
                if (((vtx1Y-y)*(vtx0X-vtx1X) >=
                        (vtx1X-x)*(vtx0Y-vtx1Y)) == yflag1)
                {
                    inside_flag = !inside_flag;
                }
            }
        }

        return inside_flag;
    };

    
    
    TriangulatedSurface.prototype.pointInContour = function(x, y, cntr) {
        var yflag0, yflag1;
        var vtx0X, vtx0Y, vtx1X, vtx1Y;

        var inside_flag = false;
        
        var pts = this.cset.pts;

        // get the last point in the polygon
        vtx0X = pts[cntr[cntr.length-1]].x;
        vtx0Y = pts[cntr[cntr.length-1]].y;

        // get test bit for above/below X axis
        yflag0 = (vtx0Y >= y);

        for (var j= 0, jEnd=cntr.length; j<jEnd; ++j)
        {
            vtx1X = pts[cntr[j]].x;
            vtx1Y = pts[cntr[j]].y;

            yflag1 = (vtx1Y >= y);

            // Check if endpoints straddle (are on opposite sides) of X axis
            // (i.e. the Y's differ); if so, +X ray could intersect this edge.
            // The old test also checked whether the endpoints are both to the
            // right or to the left of the test point.  However, given the faster
            // intersection point computation used below, this test was found to
            // be a break-even proposition for most polygons and a loser for
            // triangles (where 50% or more of the edges which survive this test
            // will cross quadrants and so have to have the X intersection computed
            // anyway).  I credit Joseph Samosky with inspiring me to try dropping
            // the "both left or both right" part of my code.
            if (yflag0 != yflag1)
            {
                // Check intersection of pgon segment with +X ray.
                // Note if >= point's X; if so, the ray hits it.
                // The division operation is avoided for the ">=" test by checking
                // the sign of the first vertex wrto the test point; idea inspired
                // by Joseph Samosky's and Mark Haigh-Hutchinson's different
                // polygon inclusion tests.
                if (((vtx1Y-y)*(vtx0X-vtx1X) >=
                        (vtx1X-x)*(vtx0Y-vtx1Y)) == yflag1)
                {
                    inside_flag = !inside_flag;
                }
            }

            // move to the next pair of vertices, retaining info as possible
            yflag0 = yflag1;
            vtx0X = vtx1X;
            vtx0Y = vtx1Y;
        }

        return inside_flag;
    };


    TriangulatedSurface.prototype.pointInPolygon = function(x, y) {
        var inside = false;

        for (var i=0; i<this.cset.contours.length; i++) {

            if (this.pointInContour(x, y, this.cset.contours[i]))
                inside = !inside;
        }

        return inside;
    };

    
    TriangulatedSurface.prototype.filterFace = function(i0, i1, i2) {

        var p0 = this.pts[i0];
        var p1 = this.pts[i1];
        var p2 = this.pts[i2];

        var cx = (p0.x + p1.x + p2.x) / 3;
        var cy = (p0.y + p1.y + p2.y) / 3;

        if (this.intervalTree.pointInPolygon(cx, cy)) {
       // if (this.pointInEdgeList(cx, cy)) {
       // if (pointInPolygon(cx, cy)) {

            var e1x = p1.x - p0.x;
            var e1y = p1.y - p0.y;
            var e2x = p2.x - p0.x;
            var e2y = p2.y - p0.y;

            var cross = e1x * e2y - e2x * e1y;

            if (cross > 0) {
                this.indices.push(i0, i1, i2);
            } else {
                this.indices.push(i0, i2, i1);
            }

        }
    };
    
    


    return {

        TriangulatedSurface : TriangulatedSurface,
        ContourSet : ContourSet,
        Edge: Edge

    };


})();

}


function init_three_intersector() {

"use strict";

if (Autodesk.Viewing.Private.Intersector)
    return;

Autodesk.Viewing.Private.Intersector = (function() {

    var avp = Autodesk.Viewing.Private;

    var TOL = 1e-10;
    var Edge = Autodesk.Viewing.Private.Triangulator.Edge;

    function isZero(f) {
        return Math.abs(f) < TOL;
    }

    function isEqual(a, b) {
        return isZero(a - b);
    }


	var v1 = new THREE.Vector3();

    function xPlaneSegment(plane, pt0, pt1, res1, res2) {

        var direction = v1.subVectors(pt1, pt0);

        var denominator = plane.normal.dot( direction );

        if ( isZero(denominator) ) {

            res1.copy(pt0);
            res2.copy(pt1);

            // line is coplanar
            return 2;
        }
        
        denominator = 1.0 / denominator;

        var t = - ( pt0.dot( plane.normal ) * denominator + plane.constant * denominator);

        if ( t < -TOL || t > 1 + TOL ) {

            return 0;

        }

        var pt = direction.multiplyScalar( t ).add( pt0 );

        res1.copy(pt);

        return 1;
    }


    var res1 = new THREE.Vector3();
    var res2 = new THREE.Vector3();

    // res is array containing result segments.
    // returns number of intersection point on the plane (0, 1, or 2) with the values of the points stored in the res array
    function xTrianglePlane(plane, pt0, pt1, pt2, i0, i1, i2, res, meshId) {

        var d0 = plane.distanceToPoint(pt0);
        var d1 = plane.distanceToPoint(pt1);
        var d2 = plane.distanceToPoint(pt2);

        // Check if all points are to one side of the plane
        if (d0 < -TOL && d1 < -TOL && d2 < -TOL) {
            return null;
        }
        if (d0 > TOL && d1 > TOL && d2 > TOL) {
            return null;
        }

        var s0 = Math.sign(d0);
        var s1 = Math.sign(d1);
        var s2 = Math.sign(d2);

        // Skip coplanar triangles (leave it to the neighbouring triangles to contribute their edges)
        if (s0 === 0 && s1 === 0 && s2 === 0) {
            return null;
        }

        var tmp1, tmp2;
        var i1From, i1To, i2From, i2To;

        //There is intersection, compute it
        if (s0 !== s1) {
            var numInts = xPlaneSegment(plane, pt0, pt1, res1, res2);
            if (numInts == 2) {
                res.push(new Edge(pt0.clone(), pt1.clone(), i0, i0, i1, i1, meshId));
                return;
            } else if (numInts == 1) {
                i1From = i0; 
                i1To = i1;
                tmp1 = res1.clone();
            } else {
                avp.logger.warn("Unexpected zero intersections where at least one was expected");
            }
        }

        if (s1 !== s2) {
            var numInts = xPlaneSegment(plane, pt1, pt2, res1, res2);
            if (numInts == 2) {
                res.push(new Edge(pt1.clone(), pt2.clone(), i1, i1, i2, i2, meshId));
                return;
            } else if (numInts == 1) {
                if (tmp1) {
                    // Avoid the singular scenario where the signs are 0, -1 and +1
                    if (res1.distanceTo(tmp1) > TOL) {
                        i2From = i1;
                        i2To = i2;    
                        tmp2 = res1.clone();
                    }
                }
                else {
                    i1From = i1;
                    i1To = i2;
                    tmp1 = res1.clone();
                }
            } else {
                avp.logger.warn("Unexpected zero intersections where at least one was expected");
            }
        }

        if (s2 !== s0) {
            var numInts = xPlaneSegment(plane, pt2, pt0, res1, res2);
            if (numInts == 2) {
                res.push(new Edge(pt2.clone(), pt0.clone(), i2, i2, i0, i0, meshId));
                return;
            } else if (numInts == 1) {
                if (tmp1) {
                    // Avoid the singular scenario where the signs are 0, -1 and +1
                    if (res1.distanceTo(tmp1) > TOL) {
                        i2From = i2;
                        i2To = i0;
                        tmp2 = res1.clone();
                    }
                } else {
                    avp.logger.warn("Unexpected single intersection point");
                }
            } else {
                avp.logger.warn("Unexpected zero intersections where at least one was expected");
            }
        }


        if (tmp1 && tmp2) {
            res.push(new Edge(tmp1, tmp2, i1From, i1To, i2From, i2To, meshId));
        } else {
            avp.logger.warn("Unexpected one intersection where two were expected");
        }

    }
    
    var point = new THREE.Vector3();
    
    function xBoxPlane(plane, box) {
    
        point.set( box.min.x, box.min.y, box.min.z ); // 000
        var d = plane.distanceToPoint(point);
        var s = Math.sign(d);
        
        point.set( box.min.x, box.min.y, box.max.z ); // 001
        var d2 = plane.distanceToPoint(point);
        if (Math.sign(d2) !== s)
            return true;
        
        point.set( box.min.x, box.max.y, box.min.z ); // 010
        d2 = plane.distanceToPoint(point);
        if (Math.sign(d2) !== s)
            return true;

        point.set( box.min.x, box.max.y, box.max.z ); // 011
        d2 = plane.distanceToPoint(point);
        if (Math.sign(d2) !== s)
            return true;

        point.set( box.max.x, box.min.y, box.min.z ); // 100
        d2 = plane.distanceToPoint(point);
        if (Math.sign(d2) !== s)
            return true;

        point.set( box.max.x, box.min.y, box.max.z ); // 101
        d2 = plane.distanceToPoint(point);
        if (Math.sign(d2) !== s)
            return true;

        point.set( box.max.x, box.max.y, box.min.z ); // 110
        d2 = plane.distanceToPoint(point);
        if (Math.sign(d2) !== s)
            return true;

        point.set( box.max.x, box.max.y, box.max.z ); // 111        
        d2 = plane.distanceToPoint(point);
        if (Math.sign(d2) !== s)
            return true;

        return false;
    }

    var mi = new THREE.Matrix4();
    var pi = new THREE.Plane();

    function xMeshPlane( plane, mesh, intersects ) {

        var geometry = mesh.geometry;
        var baseIndex = intersects.length;

        var matrixWorld = mesh.matrixWorld;
        mi.getInverse(matrixWorld);
        pi.copy(plane).applyMatrix4(mi);

        avp.VertexEnumerator.enumMeshTriangles(geometry, function(vA, vB, vC, a, b, c) {

            xTrianglePlane(pi, vA, vB, vC, a, b, c, intersects, mesh.fragId);

        });

        //Put the points into world space. It should actually be possible to do
        //the entire math in object space -- but we have to check if all fragments
        //that belong to the same dbId have the same world transform.
        for (var i=baseIndex; i<intersects.length; i++) {
            intersects[i].pt1.applyMatrix4(matrixWorld);
            intersects[i].pt2.applyMatrix4(matrixWorld);
        }

    }


	function makeRotationAxis( axis, cosa, m ) {

		// Based on http://www.gamedev.net/reference/articles/article1199.asp

		var c = cosa;
		var s = Math.sqrt(1.0 - c*c);
		var t = 1 - c;
		var x = axis.x, y = axis.y, z = axis.z;
		var tx = t * x, ty = t * y;

		m.set(

			tx * x + c, tx * y - s * z, tx * z + s * y, 0,
			tx * y + s * z, ty * y + c, ty * z - s * x, 0,
			tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
			0, 0, 0, 1

		);

	}


	function makePlaneBasis(plane) {

        //var origin = plane.coplanarPoint();

        var sceneUp = new THREE.Vector3(0,0,1);
        var cross = plane.normal.clone().cross(sceneUp);
        cross = cross.normalize();
        var dot = sceneUp.dot(plane.normal);

        //We are ignoring the translation here, since
        //we will drop the Z coord for the 2D processing steps anyway.
        var planeBasis = new THREE.Matrix4();

        if (!(isZero(cross.x) && isZero(cross.y) && isZero(cross.z))) {
            makeRotationAxis(cross, dot, planeBasis);
            planeBasis.elements[14] = plane.constant;
        } else {
            planeBasis.elements[14] = dot * plane.constant;
        }

        return planeBasis;
    }


    function convertToPlaneCoords(planeBasis, edges3d, bbox) {

        for (var i=0; i<edges3d.length; i++) {
            var e = edges3d[i];

            e.pt1.applyMatrix4(planeBasis);
            e.pt2.applyMatrix4(planeBasis);

            bbox.expandByPoint(e.pt1);
            bbox.expandByPoint(e.pt2);
        }
    }


    return {

        makePlaneBasis: makePlaneBasis,
        convertToPlaneCoords: convertToPlaneCoords,

        intersectTrianglePlane : xTrianglePlane,
        intersectMeshPlane : xMeshPlane,
        intersectBoxPlane : xBoxPlane

    };

})();

}

'use strict';

AutodeskNamespace('Autodesk.Viewing.Extensions.Section');

/**
 * SectionExtension adds UI elements for section analysis
 */
Autodesk.Viewing.Extensions.Section.SectionExtension = function(viewer, options) {
    Autodesk.Viewing.Extension.call(this, viewer, options);
    this.viewer = viewer;
    this.name = 'section';
    this.modes = ['x','y','z','box'];
};

Autodesk.Viewing.Extensions.Section.SectionExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
Autodesk.Viewing.Extensions.Section.SectionExtension.prototype.constructor = Autodesk.Viewing.Extensions.Section.SectionExtension;

var proto = Autodesk.Viewing.Extensions.Section.SectionExtension.prototype;

/**
 * Registers the SectionTool, hotkeys and event handlers.
 *
 * @returns {boolean}
 */
proto.load = function() {
    var that = this;
    var viewer = this.viewer;

    Autodesk.Viewing.Private.injectCSS('extensions/Section/Section.css');

    this.tool = new Autodesk.Viewing.Extensions.Section.SectionTool(viewer);
    viewer.toolController.registerTool(this.tool);
    this.sectionStyle = null;
    this.supportedStyles = ["X", "Y", "Z", "BOX"];

    if (viewer.getToolbar) {
        var toolbar = viewer.getToolbar(true);
        if (toolbar) {
            this.onToolbarCreated();
        } else {
            this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
            viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
        }
    }

    this.onResetBinded = this.onReset.bind(this);
    viewer.addEventListener(Autodesk.Viewing.RESET_EVENT, this.onResetBinded);

    this.HOTKEYS_ID = "Autodesk.Section.Hotkeys";
    var hotkeys = [{
        keycodes: [
            Autodesk.Viewing.theHotkeyManager.KEYCODES.ESCAPE
        ],
        onRelease: function () {
            return that.enableSectionTool(false);
        }
    }];
    Autodesk.Viewing.theHotkeyManager.pushHotkeys(this.HOTKEYS_ID, hotkeys);

    return true;
};

/**
 * Unregisters the SectionTool, hotkeys and event handlers.
 *
 * @returns {boolean}
 */
proto.unload = function () {
    var viewer = this.viewer;

    // remove hotkey
    Autodesk.Viewing.theHotkeyManager.popHotkeys(this.HOTKEYS_ID);

    this.destroyUI();

    viewer.removeEventListener(Autodesk.Viewing.RESET_EVENT, this.onResetBinded);
    this.onResetBinded = null;

    if (this.onToolbarCreatedBinded) {
        viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
        this.onToolbarCreatedBinded = null;
    }

    viewer.toolController.deregisterTool(this.tool);
    this.tool = null;

    return true;
};

/**
 * Toggles activeness of section planes.
 *
 * @returns {boolean} Whether the section plane is active or not.
 */
proto.toggle = function() {
    if (this.isActive()) {
        this.enableSectionTool(false);
    } else {
        var style = this.sectionStyle || "X";
        this.setSectionStyle(style, true);
    }
    return this.isActive(); // Need to check for isActive() again.
};

/**
 * Returns the current type of plane that will cut-though the geometry.
 *
 * @returns {null|String} Either "X" or "Y" or "Z" or "BOX" or null.
 */
proto.getSectionStyle = function() {
    return this.sectionStyle;
};

/**
 * Sets the Section plane style.
 *
 * @param {String} style - Accepted values are 'X', 'Y', 'Z' and 'BOX' (in Caps)
 * @param {Boolean} [preserveSection] - Whether sending the current style value resets the cut planes.
 */
proto.setSectionStyle = function(style, preserveSection) {

    if (this.supportedStyles.indexOf(style) === -1) {
        return false;
    }

    var bActive = this.isActive();
    var bNewStyle = (this.sectionStyle !== style) || !preserveSection;
    this.sectionStyle = style;

    if (bActive && bNewStyle) {
        this.tool.setSection(style);
    }
    else if (!bActive) {
        this.enableSectionTool(true);
        if (bNewStyle) {
            this.tool.setSection(style);
        } else {
            this.tool.attachControl(true);
        }
    }
    return true;
};


/**
 *
 * @param enable
 * @returns {boolean}
 * @private
 */
proto.enableSectionTool = function(enable) {
    var toolController = this.viewer.toolController,
        isActive = this.tool.isActive();

    if (enable && !isActive) {
        toolController.activateTool("section");
        if (this.sectionToolButton) {
            this.sectionToolButton.setState(Autodesk.Viewing.UI.Button.State.ACTIVE);
        }
        return true;

    } else if (!enable && isActive) {
        toolController.deactivateTool("section");
        if (this.sectionToolButton) {
            this.sectionToolButton.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
        }
        return true;
    }
    return false;
};

/**
 * @private
 */
proto.onToolbarCreated = function() {
    if (this.onToolbarCreatedBinded) {
        this.viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
        this.onToolbarCreatedBinded = null;
    }
    this.createUI();
};

/**
 * @private
 */
proto.onReset = function() {
    this.tool.resetSection();
};

/***
 * @private
 */
proto.createUI = function()
{
    var viewer = this.viewer;
    var AVU = Autodesk.Viewing.UI;

    this.sectionToolButton = new AVU.ComboButton("toolbar-sectionTool");
    this.sectionToolButton.setToolTip('Section analysis');
    this.sectionToolButton.setIcon("adsk-icon-section-analysis");
    this.createSubmenu(this.sectionToolButton);

    // make sure inspect tools is visible
    var toolbar = viewer.getToolbar(false);
    var modelTools = toolbar.getControl(Autodesk.Viewing.TOOLBAR.MODELTOOLSID);

    // place section tool before reset tool
    if (modelTools) {
        var resetTool = modelTools.getControl("toolbar-resetTool");
        if (resetTool) {
            modelTools.addControl(this.sectionToolButton, {index: modelTools.indexOf(resetTool.getId())});
        } else {
            modelTools.addControl(this.sectionToolButton, {index: 0});
        }
    }
};

/**
 *
 * @param parentButton
 * @private
 */
proto.createSubmenu = function(parentButton)
{
    var that = this;
    var viewer = this.viewer;
    var AVU = Autodesk.Viewing.UI;

    function createNavToggler(button, name) {
        return function() {
            var state = button.getState();
            var enable = function() {
                if (button instanceof AVU.ComboButton === false) {
                    that.activate(name);
                } else {
                    that.enableSectionTool(true);
                    that.tool.attachControl(true);
                }
            };

            if (state === AVU.Button.State.INACTIVE) {
                button.setState(AVU.Button.State.ACTIVE);
                // Long initialization may cause issues on touch enabled devices, make it async
                if (Autodesk.Viewing.isMobileDevice()) {
                    setTimeout(enable, 1);
                } else {
                    enable();
                }
            } else if (state === AVU.Button.State.ACTIVE) {
                button.setState(AVU.Button.State.INACTIVE);
                that.deactivate();
            }
            that.sectionStyle = name;
        };
    }

    function updateSectionButtons() {
        var areVectorsEqual = (function () {
            var v = new THREE.Vector3();
            return function(a, b, sqtol) {
                v.subVectors(a, b);
                return v.lengthSq() < sqtol;
            };
        })();

        var unitx = new THREE.Vector3(1, 0, 0);
        var unity = new THREE.Vector3(0, 1, 0);
        var unitz = new THREE.Vector3(0, 0, 1);
        var right = viewer.autocam.getWorldRightVector();
        var up = viewer.autocam.getWorldUpVector();
        var front = viewer.autocam.getWorldFrontVector();

        var tol = 0.0001;
        if (areVectorsEqual(up, unitx, tol)) {
            that.sectionYButton.setIcon("adsk-icon-plane-x");
        } else if (areVectorsEqual(up, unitz, tol)) {
            that.sectionYButton.setIcon("adsk-icon-plane-z");
        } else {
            that.sectionYButton.setIcon("adsk-icon-plane-y");
        }

        if (areVectorsEqual(right, unity, tol)) {
            that.sectionXButton.setIcon("adsk-icon-plane-y");
        } else if (areVectorsEqual(right, unitz, tol)) {
            that.sectionXButton.setIcon("adsk-icon-plane-z");
        } else {
            that.sectionXButton.setIcon("adsk-icon-plane-x");
        }

        if (areVectorsEqual(front, unitx, tol)) {
            that.sectionZButton.setIcon("adsk-icon-plane-x");
        } else if (areVectorsEqual(front, unity, tol)) {
            that.sectionZButton.setIcon("adsk-icon-plane-y");
        } else {
            that.sectionZButton.setIcon("adsk-icon-plane-z");
        }

        viewer.removeEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, updateSectionButtons);
    }

    var sectionXButton = this.sectionXButton = new AVU.Button("toolbar-sectionTool-x");
    sectionXButton.setToolTip('Add X plane');
    sectionXButton.setIcon("adsk-icon-plane-x");
    sectionXButton.onClick = createNavToggler(sectionXButton, 'x');
    parentButton.addControl(sectionXButton);

    var sectionYButton = this.sectionYButton = new AVU.Button("toolbar-sectionTool-y");
    sectionYButton.setToolTip('Add Y plane');
    sectionYButton.setIcon("adsk-icon-plane-y");
    sectionYButton.onClick = createNavToggler(sectionYButton, 'y');
    parentButton.addControl(sectionYButton);

    var sectionZButton = this.sectionZButton = new AVU.Button("toolbar-sectionTool-z");
    sectionZButton.setToolTip('Add Z plane');
    sectionZButton.setIcon("adsk-icon-plane-z");
    sectionZButton.onClick = createNavToggler(sectionZButton, 'z');
    parentButton.addControl(sectionZButton);

    var sectionBoxButton = this.sectionBoxButton = new AVU.Button("toolbar-sectionTool-box");
    sectionBoxButton.setToolTip('Add box');
    sectionBoxButton.setIcon("adsk-icon-box");
    sectionBoxButton.onClick = createNavToggler(sectionBoxButton, 'box');
    parentButton.addControl(sectionBoxButton);

    viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, updateSectionButtons);
};

/**
 * @private
 */
proto.destroyUI = function()
{
    var viewer = this.viewer;

    var toolbar = viewer.getToolbar(false);
    if (toolbar) {
        var modelTools = toolbar.getControl(Autodesk.Viewing.TOOLBAR.MODELTOOLSID);
        if (modelTools && this.sectionToolButton) {
            var inspectSubmenu = modelTools.getControl("toolbar-inspectSubMenu");
            if (inspectSubmenu) {
                inspectSubmenu.removeControl(this.sectionToolButton.getId());
            } else {
                modelTools.removeControl(this.sectionToolButton.getId());
            }
            this.sectionToolButton = null;
        }
    }
};

proto.activate = function (mode) {
    if (this.activeStatus && this.mode === mode) {
        return;
    }
    this.enableSectionTool(true);
    switch (mode) {
        default:
        case 'x':
            this.tool.setSection('X');
            this.mode = 'x';
            break;
        case 'y':
            this.tool.setSection('Y');
            this.mode = 'y';
            break;
        case 'z':
            this.tool.setSection('Z');
            this.mode = 'z';
            break;
        case 'box':
            this.tool.setSection('BOX');
            this.mode = 'box';
            break;
        }
    this.activeStatus = true;
    return true;
};

proto.deactivate = function () {
    if(this.activeStatus) {
        this.enableSectionTool(false);
        this.activeStatus = false;
    }
    return true;
};

Autodesk.Viewing.theExtensionManager.registerExtension('Autodesk.Section', Autodesk.Viewing.Extensions.Section.SectionExtension);

AutodeskNamespace('Autodesk.Viewing.Extensions.Section');


Autodesk.Viewing.Extensions.Section.tintColor = { r: 1, g: 1, b: 0 };
Autodesk.Viewing.Extensions.Section.tintIntensity = 0.2;


/**
 * Tool that provides visual controls for the user to change the cutplane's position and angle.
 * It can (and should) be hooked to [ToolController's registerTool]{@Autodesk.Viewing.ToolController#registerTool}
 *
 * @param {Autodesk.Viewing.Viewer3D} viewer - Viewer3D instance
 * @param {Object} [options] - This component is not customizable.
 * @constructor
 */
Autodesk.Viewing.Extensions.Section.SectionTool = function(viewer/*, options*/)
{
    var _viewer  = viewer.impl;

    var _names = ["section"];
    var _active = false;

    var _isDragging = false;
    var _isPlaneOn = true;

    var _transRotControl;
    var _transControl;
    var _sectionGroups = [];
    var _sectionPlanes = [];
    var _sectionPicker = [];
    var _activeMode = "";
    var _overlayName = "gizmo";
    var _touchType = null;
    var _initialized = false;
    var _visibleAtFirst = true;
    var _outlineIndices = [[0, 1], [1, 3], [3, 2], [2, 0]];
    var AVES = Autodesk.Viewing.Extensions.Section;
    var _priority = 70;

    init_TransformGizmos();
    init_SectionMesh();

    function initControl() {

        if (_initialized)
            return;

        _transRotControl = new THREE.TransformControls(_viewer.camera, _viewer.canvas, "transrotate");
        _transRotControl.addEventListener('change', updateViewer);
        _transRotControl.setSnap(Math.PI/2, Math.PI/36); // snap to 90 degs within 5 degs range 

        _transControl = new THREE.TransformControls(_viewer.camera, _viewer.canvas, "translate");
        _transControl.addEventListener('change', updateViewer);

        // add to overlay scene
        if (_viewer.overlayScenes[_overlayName] === undefined) {
            _viewer.createOverlayScene(_overlayName);
        }
        _viewer.addOverlay(_overlayName, _transRotControl);
        _viewer.addOverlay(_overlayName, _transControl);

        viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateControls);
        viewer.addEventListener(Autodesk.Viewing.ISOLATE_EVENT, updateSections);
        viewer.addEventListener(Autodesk.Viewing.HIDE_EVENT, updateSections);
        viewer.addEventListener(Autodesk.Viewing.SHOW_EVENT, updateSections);
        viewer.addEventListener(Autodesk.Viewing.FRAGMENTS_LOADED_EVENT, fragmentsLoaded);
    
        _initialized = true;
    }

    function deinitControl() {
        
        if (!_initialized)
            return;
    
        _viewer.removeOverlay(_overlayName, _transRotControl);
        _transRotControl.removeEventListener('change', updateViewer);
        _transRotControl = null;
        _viewer.removeOverlay(_overlayName, _transControl);
        _transControl.removeEventListener('change', updateViewer);
        _transControl = null;
        _viewer.removeOverlayScene(_overlayName);

        viewer.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateControls);
        viewer.removeEventListener(Autodesk.Viewing.ISOLATE_EVENT, updateSections);
        viewer.removeEventListener(Autodesk.Viewing.HIDE_EVENT, updateSections);
        viewer.removeEventListener(Autodesk.Viewing.SHOW_EVENT, updateSections);
        viewer.removeEventListener(Autodesk.Viewing.FRAGMENTS_LOADED_EVENT, fragmentsLoaded);
        
        _initialized = false;
    }

    function updateViewer() {
        _viewer.invalidate(false, false, true);
    }

    function updateControls() {
        if (_transRotControl) {
            _transRotControl.update();
        }
        if (_transControl) {
            _transControl.update();
        }
    }

    function updateSections() {
        if (_active && _sectionPlanes.length === 1) {
            updatePlaneMeshes(true);
            updateControls();
            updateCapMeshes(new THREE.Plane().setComponents(_sectionPlanes[0].x, _sectionPlanes[0].y, _sectionPlanes[0].z, _sectionPlanes[0].w));
        }
    }

    /*function mix(a, b, val) {
        return a * (1.0 - val) + b * val;
    }*/
    
    function getDiffuseColor(material) {
       return (material && material.color) || new THREE.Color(0xffffff);
    }

    /*function getSpecularColor(material) {
        return (material && material.specular) || new THREE.Color(0xffffff);
    }

    function tintColor(c) {
        var intensity = Autodesk.Viewing.Extensions.Section.tintIntensity;
        var tc = Autodesk.Viewing.Extensions.Section.tintColor;
        c.r = mix(c.r, tc.r, intensity);
        c.g = mix(c.g, tc.g, intensity);
        c.b = mix(c.b, tc.b, intensity);
    }*/
    
    // Object used to iterator all fragments in all dbids in all models in a scene
    // _timeSlice is the time in milliseconds before the iterator will allow itself
    // to be interrupted. _sliceDelay is the time in milliseconds the iterator delays
    // before starting a new time slice. The default values are 15 and 0 respectively.
    // I did some experiments and it seemed like these values worked pretty well.
    // _sliceDelay doesn't seem to matter very much, but making _timeSlice much
    // larger will cause highlights to look jerky.
    function FragmentIterator(_timeSlice, _sliceDelay) {

        var _capTimer = 0;      // Timer used to delay time slices
        var _callback;          // Callback for each fragment
        var _models;            // Array of models in the scene
        var _curModel;          // Current model
        var _curLoadedObj;      // On demand loaded dbIds for current model
        var _dbIds = [];        // Database ids for the current model
        var _fragIds = [];      // Fragment ids for the current database id
        var _fragmentMap;       // Fragment map for current model
        var _m;                 // Current index in _models
        var _d;                 // Current index in _dbIds
        var _f;                 // Current index in _fragIds
        var _loadedModels = []; // Models and dbIds loaded after the section has started

        // Default value for _timeSlize and _sliceDelay
        _timeSlice = _timeSlice || 15;
        _sliceDelay = _sliceDelay || 0;

        // Start the iterator
        // models is the array of models to iterate
        // delay is a delay to start the iteration. < 0 starts without any delay
        // callback is the callback for each fragment:
        //   callback(fragId, dbId, model, lastFrag, fragLoaded)
        // lastFrag is a boolean that is true when fragId is the last fragment for dbId.
        // fragLoaded is a boolean that is true when the dbId was loaded on demand.
        this.start = function(models, delay, callback) {
            reset(models);

            _callback = callback;
            if (callback) {
                if (delay >= 0)
                    _capTimer = setTimeout(doIteration, delay);
                else
                    doIteration();
            }
        };

        // Signal that a list of dbIds has been loaded from a model
        this.loadedDbIds = function(model, fragIds) {
            if (!_callback || !model || !fragIds || fragIds.length <= 0)
                return;

            var loadedObj = _loadedModels.find(function(obj) {
                return obj.model === model;
            });
            if (!loadedObj) {
                loadedObj = { model: model, dbIds: {} };
                _loadedModels.push(loadedObj);
                if (model === _curModel)
                    _curLoadedObj = loadedObj;
            }

            var frags = model.getFragmentList();

            // Convert fragIds to the dbIds that they are part of
            fragIds.forEach(function(fragId) {
                var dbId = frags.getDbIds(fragId) | 0;  // Only 2d has multiple dbIds per fragId
                loadedObj.dbIds[dbId] = true;
            });

            // If we aren't generating caps, then start it.
            if ( _capTimer == 0)
                _capTimer = setTimeout(doIteration, _sliceDelay);
        };

        // Reset the iterator, this is so we can clear the manager at the end.
        function reset(models) {
            if (_capTimer)
                clearTimeout(_capTimer);
            _capTimer = 0;
            _models = models;
            _dbIds.length = 0;
            _fragIds.length = 0;
            _fragmentMap = null;
            _loadedModels.length = 0;
            _m = -1;
            _d = 0;
            _f = 0;
        }

        // Do a single time slice
        function doIteration() {
            _capTimer = 0;
            var endTime = performance.now() + _timeSlice;
            while (performance.now() < endTime) {
                // If we are done, then return
                if (!next()) {
                    // The cap scene is in sceneAfter, so we need to redraw the model to see the caps.
                    // LMV-2571 - clear the render, as otherwise we will draw transparent objects atop themselves.
                    _viewer.invalidate(true, true);
                    // Clear everything when we are done
                    reset(null);
                    return;
                }

                var dbId = _dbIds[_d];
                if (_f == 0 && _curLoadedObj)
                    delete _curLoadedObj.dbIds[dbId];

                // Call the call back function
                _callback(_fragIds[_f], dbId, _curModel, _f + 1 >= _fragIds.length, !_models || _m >= _models.length);
            }

            // Schedule the next time slice
            _capTimer = setTimeout(doIteration, _sliceDelay);
        }

        // Advance to the next model in _models
        function nextModel() {
            // Continue processing the next model in _models
            if (_models && _m < _models.length) {
                // Go to next model
                while (++_m < _models.length) {
                    _fragmentMap = _models[_m].getFragmentMap();
                    // Only process the model, if it has a fragment map
                    if (_fragmentMap) {
                        // Get the list of dbIds.
                        _dbIds.length = 0;
                        _fragmentMap.enumNodeChildren(_models[_m].getRootId(), function(dbId) {
                            _dbIds.push(dbId);
                        }, true);
                        // Only process the model if we got some ids
                        if (_dbIds.length > 0) {
                            // Set the current model and newly loaded dbIds
                            _curModel = _models[_m];
                            _curLoadedObj = _loadedModels.find(function(obj) {
                                return obj.model === _curModel;
                            });
                            return _curModel;
                        }
                    }
                }
            }

            for (var i = 0; i < _loadedModels.length; ++i) {
                // Get the next model with newly loaded dbIds
                _curModel = _loadedModels[i].model;
                _fragmentMap = _curModel.getFragmentMap();
                // Only process the model, if it has a fragment map
                if (_fragmentMap) {
                    // Get the list of dbIds.
                    _dbIds.length = 0;
                    var dbIdStr;
                    for (dbIdStr in _loadedModels[i].dbIds) {
                        var dbId = Number(dbIdStr);
                        if (isFinite(dbId))
                            _dbIds.push(dbId);
                    }
                    // Only process the model if we got some ids
                    if (_dbIds.length > 0) {
                        _loadedModels.splice(0, i + 1); // Removed models processed and skipped
                        _curLoadedObj = null;           // No newly loaded dbIds, they are being processed
                        return true;
                    }
                }
            }

            // Done clear the current model and new loaded dbIds
            _curModel = null;
            _curLoadedObj = null;
            _loadedModels.length = 0;    // No more models, make sure list is empty

            // End of the models
            return false;
        }

        // Advance to the next database id
        function nextDbId() {
            // At the end, return false
            if (_d >= _dbIds.length)
                return false;

            // Go to next database id
            while (++_d < _dbIds.length) {
                var dbId = _dbIds[_d];
                // Only process dbIds that are not hidden and not off
                if (!_fragmentMap.isNodeHidden(dbId) && !_fragmentMap.isNodeOff(dbId)) {
                    //All fragments that belong to the same node make part of the
                    //same object so we have to accumulate all their intersections into one list
                    _fragIds.length = 0;
                    _fragmentMap.enumNodeFragments(dbId, function(fragId) {
                        _fragIds.push(fragId);
                    }, false);
                    // Only process the database id if there are some fragments
                    if (_fragIds.length > 0)
                        return true;
                }
            }

            // end of the database ids
            return false;
        }

        // Advance to the next fragment
        function next() {
            // If we are not a the end of the fragment list, then process it
            if (++_f < _fragIds.length)
                return true;

            // Start the fragment list at the beginning
            _f = 0;
            for ( ; ; ) {
                // If we have more database ids, then process them
                if (nextDbId())
                    return true;
                // If we don't have another model, then we are done
                if (!nextModel())
                    return false;
                // restart the database ids for the new model
                _d = -1;
            }
        }
    }

    // Use the same fragment iterator for all fragments
    var _fragIterator = new FragmentIterator();

    function updateCapMeshes(plane) {

        init_three_triangulator();
        init_three_intersector();
    

        var oldsection = _viewer.sceneAfter.getObjectByName("section");
        if (oldsection)
            _viewer.sceneAfter.remove(oldsection);
            
        var section = new THREE.Object3D();
        section.name = "section";
        _viewer.sceneAfter.add(section);
        
        var section3D = new THREE.Object3D();
        section.add(section3D);
        var section2D = new THREE.Object3D();
        section.add(section2D);

        var avp = Autodesk.Viewing.Private;


        var toPlaneCoords = avp.Intersector.makePlaneBasis(plane);
        var fromPaneCoords = new THREE.Matrix4().getInverse(toPlaneCoords);

        var mat2dname = _viewer.matman().create2DMaterial(null, {skipCircles:true, skipEllipticals:true}, false, false);
        var mat2d = _viewer.matman().findMaterial(null, mat2dname);
        mat2d.transparent = true;
        mat2d.depthTest = true;
        mat2d.polygonOffset = true;
        mat2d.polygonOffsetFactor = -1;
        mat2d.polygonOffsetUnits = 0.1;    // 1.0 is usually way too high, see LMV-1072

        var box = new THREE.Box3();

        //var worldBox = _viewer.getVisibleBounds(true);   
        
        //some heuristic for line width of the section outline based on model size
        //half a percent of the model size is what we do here.
        //var lineWidth = 0.5 * 5e-5 * worldBox.size().length();

        var models = _viewer.modelQueue().getModels();

        var intersects = [];
        var material;

        function removeMesh(object, modelId, dbId, disposeMaterial) {
            var child = object.children.find(function(mesh) {
                return mesh.modelId == modelId && mesh.dbId == dbId;
            });
            if (child) {
                object.remove(child);
                if (child.geometry)
                    child.geometry.dispose();
                if (disposeMaterial && child.material)
                    child.material.dispose();
            }
        }

        // Start iterating the fragments
        _fragIterator.start(models, 50, function(fragId, dbId, model, lastFrag, fragLoaded) {

            // Collect intersections for this fragment
            var frags = model.getFragmentList();
            frags.getWorldBounds(fragId, box);
            if (avp.Intersector.intersectBoxPlane(plane, box)) {
                var m = frags.getVizmesh(fragId);

                if (m.geometry && !m.geometry.is2d && !m.geometry.isLines && m.material.cutplanes) {
                    material = m.material;
                    avp.Intersector.intersectMeshPlane(plane, m, intersects);
                }
            }

            // If this is the last fragment for dbId, process the intersections
            if (lastFrag) {
                if (intersects.length) {

                    var bbox = new THREE.Box3();
                    avp.Intersector.convertToPlaneCoords(toPlaneCoords, intersects, bbox);

                    //Create the 2D line geometry
                    var vbb = new avp.VertexBufferBuilder(false, 8 * intersects.length);

                    var color = getDiffuseColor(material);
                    var r = 0|(color.r * 0.25)*255.5;
                    var g = 0|(color.g * 0.25)*255.5;
                    var b = 0|(color.b * 0.25)*255.5;

                    var c = 0xff000000 | (b<<16) | (g<<8) | r;

                    var cset = new avp.Triangulator.ContourSet(intersects, bbox);
                    cset.snapEdges();
                    cset.sanitizeEdges();
                    cset.stitchContours();

                    var j;
                    for (j=0; j<cset.contours.length; j++) {

                        var cntr = cset.contours[j];

                        r = 0|Math.random()*255.5;
                        g = 0|Math.random()*255.5;
                        b = 0|Math.random()*255.5;

                        for (var k=1; k<cntr.length; k++) {
                            var pt1 = cset.pts[cntr[k-1]];
                            var pt2 = cset.pts[cntr[k]];
                            vbb.addSegment(pt1.x, pt1.y, pt2.x, pt2.y, 0, 0.02, /*isClosed ? c : rc*/c, dbId, 0);
                        }

                    }


                    var mdata = { mesh: vbb.toMesh() };

                    avp.BufferGeometryUtils.meshToGeometry(mdata);

                    var bg2d = mdata.geometry;
                    bg2d.streamingDraw = true;
                    bg2d.streamingIndex = true;

                    // If this cap was from geometry loaded on demand, then
                    // remove any geometry that might already by in the scene
                    if (fragLoaded)
                        removeMesh(section2D, model.id, dbId, false);

                    var mesh2d = new THREE.Mesh(bg2d, mat2d);

                    mesh2d.matrix.copy(fromPaneCoords);
                    mesh2d.matrixAutoUpdate = false;
                    mesh2d.frustumCulled = false;
                    mesh2d.modelId = model.id;      // So we can look it up later
                    mesh2d.dbId = dbId;
                    section2D.add(mesh2d);


                    //Create triangulated capping polygon
                    {

                        //Create the 3D mesh
                        var tin = new avp.Triangulator.TriangulatedSurface(cset);

                        if (tin.indices.length) {

                            var bg = new THREE.BufferGeometry();

                            var pos = new Float32Array(3*tin.pts.length);
                            for (j=0; j<tin.pts.length; j++) {
                                pos[3*j] = tin.pts[j].x;
                                pos[3*j+1] = tin.pts[j].y;
                                pos[3*j+2] = 0;
                            }
                            bg.addAttribute("position", new THREE.BufferAttribute(pos, 3));

                            var packNormals = material.packedNormals;
                            var normal = packNormals ? new Uint16Array(2*tin.pts.length) : new Float32Array(3*tin.pts.length);

                            for (j=0; j<tin.pts.length; j++) {

                                if (packNormals) {
                                    var pnx = (0/*Math.atan2(0, 0)*/ / Math.PI + 1.0) * 0.5;
                                    var pny = (1.0 + 1.0) * 0.5;

                                    normal[j*2] = (pnx * 65535)|0;
                                    normal[j*2+1] = (pny * 65535)|0;
                                } else {
                                    normal[3*j] = 0;
                                    normal[3*j+1] = 0;
                                    normal[3*j+2] = 1;
                                }
                            }

                            bg.addAttribute("normal", new THREE.BufferAttribute(normal, packNormals ? 2 : 3));
                            if (packNormals) {
                                bg.attributes.normal.bytesPerItem = 2;
                                bg.attributes.normal.normalize = true;
                            }

                            var index = new Uint16Array(tin.indices.length);
                            index.set(tin.indices);

                            bg.addAttribute("index", new THREE.BufferAttribute(index, 1));

                            bg.streamingDraw = true;
                            bg.streamingIndex = true;

                            var mat = _viewer.matman().cloneMaterial(material, model);

                            mat.packedNormals = packNormals;
                            mat.cutplanes = null;
                            mat.side = THREE.FrontSide;
                            mat.depthTest = true;
                            mat.map = null;
                            mat.bumpMap = null;
                            mat.normalMap = null;
                            mat.alphaMap = null;
                            mat.specularMap = null;
                            mat.transparent = false;
                            mat.depthWrite = true;
                            mat.hatchPattern = true;
                            mat.needsUpdate = true;

                            var angle = (material.id+2) * Math.PI * 0.125;
                            var tan = Math.tan(angle);
                            mat.hatchParams = new THREE.Vector2(tan, 10.0);
                            mat.hatchTintColor = Autodesk.Viewing.Extensions.Section.tintColor;
                            mat.hatchTintIntensity = Autodesk.Viewing.Extensions.Section.tintIntensity;

                            // If the material is prism, clear all the map definitions.
                            if (mat.prismType != null) {
                                mat.defines = {};
                                mat.defines[mat.prismType.toUpperCase()] = "";
                                if (mat.prismType == "PrismWood") {
                                    mat.defines["NO_UVW"] = "";
                                }
                            }

                            // If this cap was from geometry loaded on demand, then
                            // remove any geometry that might already by in the scene
                            if (fragLoaded)
                                removeMesh(section3D, model.id, dbId, true);

                            var capmesh = new THREE.Mesh(bg, mat);
                            capmesh.matrix.copy(fromPaneCoords);
                            capmesh.matrixAutoUpdate = false;
                            capmesh.modelId = model.id;      // So we can look it up later
                            capmesh.dbId = dbId;
                            capmesh.fragId = intersects.fragId;

                            section3D.add(capmesh);
                        }

                    }

                }

                // Clear intersections for the next dbId
                intersects.length = 0;
            } // last Fragment for dbId

        }); //_fragIterator.start

    }

    // Handle FRAGMENTS_LOADED_EVENT
    function fragmentsLoaded(e) {
        if (_active && _sectionPlanes.length === 1)
            _fragIterator.loadedDbIds(e.model, e.getFragIds());
    }

    function createPlaneMesh(plane, bbox) {
        var quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), plane.normal);
        var geometry;
        var size;

        if (bbox) {
            // project bbox to set plane size
            var ptMax = plane.projectPoint(bbox.max);
            var ptMin = plane.projectPoint(bbox.min);
            var invQuat = quat.clone().inverse();
            ptMax.applyQuaternion(invQuat);
            ptMin.applyQuaternion(invQuat);
            size = new THREE.Vector3().subVectors(ptMax, ptMin);
            geometry = new THREE.PlaneBufferGeometry(size.x, size.y);
        } else {
            // project bounding sphere
            bbox = _viewer.getVisibleBounds();
            size = 2.0 * bbox.getBoundingSphere().radius;
            geometry = new THREE.PlaneBufferGeometry(size, size);
        }

        var material = new THREE.MeshBasicMaterial({
            opacity: 0,
            color: 0xffffff,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,
            transparent: true
        });

        var mesh = new AVES.SectionMesh(geometry, material, plane);
        var pt = plane.projectPoint(bbox.center());       
        mesh.position.copy(pt);
        mesh.quaternion.multiply(quat);

        // add outlines with inverted background color
        var bgColor = Autodesk.Viewing.Private.LightPresets[_viewer.currentLightPreset()].bgColorGradient;
        var color = "rgb(" + (255-bgColor[0]) + "," + (255-bgColor[1]) + "," + (255-bgColor[2]) + ")";
        var lineMaterial = new THREE.LineBasicMaterial({color: color, linewidth:1, depthTest: false});
        var pos = mesh.geometry.getAttribute('position');
        for (var i = 0; i < _outlineIndices.length; i++) {
            geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3().fromArray(pos.array, _outlineIndices[i][0] * pos.itemSize),
                                   new THREE.Vector3().fromArray(pos.array, _outlineIndices[i][1] * pos.itemSize));
            var line = new THREE.Line(geometry, lineMaterial);
            mesh.add(line);
            mesh.outlines.push(line);
        }

        return mesh;
    }

    function updatePlaneMeshes(rebuild) {
    
        traverseSections(function(child) {
            if (child instanceof AVES.SectionMesh) {

                var i, line, pos, pt;
                if (child.connectivity.length > 0) {
                    // section box
                    var minv = new THREE.Matrix4().getInverse(child.matrixWorld);
                    pt = new THREE.Vector3();
                    pos = child.geometry.getAttribute('position');
                    for (i = 0; i < pos.length / pos.itemSize; i++) {
                        var connect = child.connectivity[i];
                        if (intersectPlanes(child.plane, connect[0], connect[1], pt) !== null) {
                            pt.applyMatrix4(minv);
                            pos.setXYZ(i, pt.x, pt.y, pt.z);
                        }
                    }
                    pos.needsUpdate = true;
                    child.geometry.computeBoundingBox();
                    child.geometry.computeBoundingSphere();

                    for (i = 0; i < child.outlines.length; i++) {
                        line = child.outlines[i];
                        line.geometry.vertices[0].fromArray(pos.array, _outlineIndices[i][0] * pos.itemSize);
                        line.geometry.vertices[1].fromArray(pos.array, _outlineIndices[i][1] * pos.itemSize);
                        line.geometry.verticesNeedUpdate = true;
                    }
                } else {
                    // section plane
                    if (rebuild) {
                        var bbox = _viewer.getVisibleBounds();
                        var size = 2.0 * bbox.getBoundingSphere().radius;
                        pt = child.plane.projectPoint(bbox.center());
                        child.geometry = new THREE.PlaneBufferGeometry(size, size);
                        child.position.copy(pt);
                        pos = child.geometry.getAttribute('position');
                        for (i = 0; i < child.outlines.length; i++) {
                            line = child.outlines[i];
                            line.geometry.vertices[0].fromArray(pos.array, _outlineIndices[i][0] * pos.itemSize);
                            line.geometry.vertices[1].fromArray(pos.array, _outlineIndices[i][1] * pos.itemSize);
                            line.geometry.verticesNeedUpdate = true;
                        }
                    }
                }
            }
        });
    }

    function traverseSections(callback) {
        for (var i = 0; i < _sectionGroups.length; i++) {           
            _sectionGroups[i].traverse(callback);
        }
    }

    function setSectionPlanes() {
        traverseSections(function(child) {
            if (child instanceof AVES.SectionMesh) {
                child.update();
            }
        });
        if (_sectionPlanes.length === 1) {
            updateCapMeshes(new THREE.Plane().setComponents(_sectionPlanes[0].x, _sectionPlanes[0].y, _sectionPlanes[0].z, _sectionPlanes[0].w));
        }
        _viewer.setCutPlanes(_sectionPlanes);
    }

    function showPlane(set) {
        for (var i = 0; i < _sectionGroups.length; i++) {
            _sectionGroups[i].visible = set;
        }
        
        if (_isPlaneOn !== set)
            updateViewer();

        _isPlaneOn = set;
    }

    function showSection(set) {
        if (set && _sectionPlanes.length > 0) {
            if (_sectionPlanes.length === 1) {
                updateCapMeshes(new THREE.Plane().setComponents(_sectionPlanes[0].x, _sectionPlanes[0].y, _sectionPlanes[0].z, _sectionPlanes[0].w));
            }
            viewer.setCutPlanes(_sectionPlanes);
        }
        showPlane(set);
    }

    function attachControl(control, mesh) {
        control.attach(mesh);
        control.setPosition(mesh.position);
        control.visible = true;
    }

    function setPlane(normal) {
        // flip normal if facing inward as eye direction
        var eyeVec = _viewer.api.navigation.getEyeVector();
        if (eyeVec.dot(normal) > 0) {
            normal.negate();
        }

        var obbox = _viewer.getVisibleBounds();
        var center = obbox.center();
        var group = new THREE.Group();
        // Calculate the plane signed distance using the dot product of the center point of the scene bounding box
        // and the normal vector.
        var plane = new THREE.Plane(normal, -1 * center.dot(normal));
        var mesh = createPlaneMesh(plane, null);
        group.add(mesh);
        _sectionPlanes.push(mesh.planeVec);
        _sectionGroups.push(group);
        _viewer.addOverlay(_overlayName, group);
        attachControl(_transRotControl, mesh);
        _transRotControl.showRotationGizmos(true);
        _sectionPicker = _transRotControl.getPicker();
        setSectionPlanes();
    }

    function setBox() {
        var normals = [
            new THREE.Vector3(1, 0, 0), 
            new THREE.Vector3(0, 1, 0), 
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, 0, -1)
        ];

        var connectivities = [
            [[1, 2], [1, 5], [2, 4], [4, 5]], // 0
            [[3, 5], [0, 5], [2, 3], [0, 2]], // 1
            [[1, 3], [0, 1], [3, 4], [0, 4]], // 2
            [[1, 5], [1, 2], [4, 5], [2, 4]], // 3
            [[2, 3], [0, 2], [3, 5], [0, 5]], // 4
            [[0, 1], [3, 1], [0, 4], [3, 4]]  // 5
        ];

        var group = new THREE.Group();
        var obbox = _viewer.getVisibleBounds();
        var center = obbox.center();
        var bbox = new THREE.Box3(obbox.min, center);
        var planes = [], meshes = [];
        var i, mesh;
        for (i = 0; i < normals.length; i++) {
            var plane = new THREE.Plane(normals[i], -1 * center.dot(normals[i]));
            planes.push(plane);

            // offset plane with negative normal to form an octant
            if (i > 2) {
                var ptMax = plane.orthoPoint(bbox.max);
                var ptMin = plane.orthoPoint(bbox.min);
                var size = new THREE.Vector3().subVectors(ptMax, ptMin);
                plane.constant -= size.length();                
            }

            mesh = createPlaneMesh(plane, bbox);
            group.add(mesh);
            meshes.push(mesh);
            _sectionPlanes.push(mesh.planeVec);
        }

        // build connectivity
        for (i = 0; i < meshes.length; i++) {
            mesh = meshes[i];
            var connectivity = connectivities[i];
            for (var j = 0; j < connectivity.length; j++) {
                var nc = [];
                var ct = connectivity[j];
                for (var k = 0; k < ct.length; k++) {
                    nc.push(planes[ct[k]]);
                }
                mesh.connectivity.push(nc);
            }
        }
        
        _sectionGroups.push(group);
        _viewer.addOverlay(_overlayName, group);

        attachControl(_transRotControl, _sectionGroups[0].children[0]);
        attachControl(_transControl, _sectionGroups[0]);
        _transRotControl.showRotationGizmos(false);
        _sectionPicker = _transRotControl.getPicker().concat(_transControl.getPicker());

        setSectionPlanes();
    }

    var intersectPlanes = (function () {
        var m = new THREE.Matrix3();
        var n23 = new THREE.Vector3();
        var n31 = new THREE.Vector3();
        var n12 = new THREE.Vector3();
        return function(plane1, plane2, plane3, optionalTarget) {
            m.set(plane1.normal.x, plane1.normal.y, plane1.normal.z,
                  plane2.normal.x, plane2.normal.y, plane2.normal.z,
                  plane3.normal.x, plane3.normal.y, plane3.normal.z);
            
            var det = m.determinant();
            if (det === 0) return null;

            n23.crossVectors(plane2.normal, plane3.normal).multiplyScalar(-plane1.constant);
            n31.crossVectors(plane3.normal, plane1.normal).multiplyScalar(-plane2.constant);
            n12.crossVectors(plane1.normal, plane2.normal).multiplyScalar(-plane3.constant);

            var result = optionalTarget || new THREE.Vector3();
            return result.copy(n23).add(n31).add(n12).divideScalar(det);
        };
    })();

    var intersectObjects = (function () {
        var pointerVector = new THREE.Vector3();
        var pointerDir = new THREE.Vector3();
        var ray = new THREE.Raycaster();
        var camera = _viewer.camera;

        return function(pointer, objects, recursive) {
            var rect = _viewer.getCanvasBoundingClientRect();
            var x = ((pointer.clientX - rect.left) / rect.width) * 2 - 1;
            var y = - ((pointer.clientY - rect.top) / rect.height) * 2 + 1;
            
            if (camera.isPerspective) {
                pointerVector.set(x, y, 0.5);
                pointerVector.unproject(camera);
                ray.set(camera.position, pointerVector.sub(camera.position).normalize());
            } else {
                pointerVector.set(x, y, -1);
                pointerVector.unproject(camera);
                pointerDir.set(0, 0, -1);
                ray.set(pointerVector, pointerDir.transformDirection(camera.matrixWorld));
            }

            var intersections = ray.intersectObjects(objects, recursive);
            return intersections[0] ? intersections[0] : null;
        };
    })();

    // public functions

    /**
     * When active, the geometry will be sectioned by the current set cut plane.
     * @returns {boolean}
     */
    this.isActive = function() {
        return _active;
    };

    /**
     * Facilitates the initialization of a cut plane
     *
     * @param {String} name - Either 'X', 'Y', 'Z' or 'BOX'
     */
    this.setSection = function(name) {
        this.clearSection();
        var normal;
        switch (name) {
            case 'X':
                normal = new THREE.Vector3(1, 0, 0);
                setPlane(normal);
                break;
            case 'Y':
                normal = new THREE.Vector3(0, 1, 0);
                setPlane(normal);
                break;
            case 'Z':
                normal = new THREE.Vector3(0, 0, 1);
                setPlane(normal);
                break;
            case 'BOX':
                setBox();
                break;
        }
        _activeMode = name;
    };

    /**
     * Removes any (and all) currently set cut plane(s).
     */
    this.clearSection = function() {

        if (_transRotControl)
            _transRotControl.detach();

        if (_transControl)
            _transControl.detach();

        // remove all sections
        while(_sectionPlanes.length > 0) {
            _sectionPlanes.pop();
        }

        while(_sectionGroups.length > 0) {
            var group = _sectionGroups.pop();
            _viewer.removeOverlay(_overlayName, group);
        }

        _fragIterator.start(null);      // Shutdown iterator        
        var oldsection = _viewer.sceneAfter.getObjectByName("section");
        if (oldsection)
            _viewer.sceneAfter.remove(oldsection);

        _viewer.setCutPlanes();
    };

    this.isPlaneOn = function() {
        return _isPlaneOn;
    };

    this.showPlane = function(set) {
        showPlane(set);
    };

    /**
     * Whether translation and rotation controls are visible or not.
     * @param {Boolean} set
     */
    this.attachControl = function(set) {
        if (set) {
            attachControl(_transRotControl, _sectionGroups[0].children[0]);
            _transRotControl.highlight();
            if (_activeMode === 'BOX')
                attachControl(_transControl, _sectionGroups[0]);
        } else {
            _transRotControl.detach();
            _transControl.detach();
        }
    };

    /**
     * Invokes setSection with the last set of parameters used.
     */
    this.resetSection = function() {
        this.setSection(_activeMode);
    };

    // tool interface

    this.getNames = function() {
        return _names;
    };

    this.getName = function() {
        return _names[0];
    };

    this.register = function() {
    };

    this.deregister = function() {
        this.clearSection();
        deinitControl();
    };

    this.getPriority = function() {
        return _priority;
    };

    /**
     * [ToolInterface] Activates the tool
     * @param {String} name - unused
     */
    this.activate = function(/*name*/) {

        initControl();

        _active = true;
        _isDragging = false;
        _visibleAtFirst = true;

        // keep only one section all the time per design
        _sectionPlanes = _sectionPlanes || [];

        showSection(true);
    };

    /**
     * [ToolInterface] Deactivates the tool
     * @param {String} name - unused
     */
    this.deactivate = function(/*name*/) {
        _active = false;
        _isDragging = false;

        _fragIterator.start(null);      // Shutdown iterator        
        var oldsection = _viewer.sceneAfter.getObjectByName("section");
        if (oldsection)
            _viewer.sceneAfter.remove(oldsection);


        showSection(false);
        _viewer.setCutPlanes();
        _transRotControl.detach();
        _transControl.detach();
    };

    this.update = function(/*highResTimestamp*/) {
        return false;
    };

    this.handleSingleClick = function(event/*, button*/) {
        var pointer = event.pointers ? event.pointers[ 0 ] : event;
        var result = intersectObjects(pointer, _sectionGroups[0].children);
        if (result) {
            attachControl(_transRotControl, result.object);
            _transRotControl.highlight();
            updateViewer();
        }

        return false;
    };

    this.handleDoubleClick = function(/*event, button*/) {
        return false;
    };

    this.handleSingleTap = function(event) {
        return this.handleSingleClick(event, 0);
    };

    this.handleDoubleTap = function(/*event*/) {
        return false;
    };

    this.handleKeyDown = function(/*event, keyCode*/) {
        return false;
    };

     this.handleKeyUp = function(/*event, keyCode*/) {
        return false;
    };

    this.handleWheelInput = function(/*delta*/) {
        return false;
    };

    this.handleButtonDown = function(event/*, button*/) {
        _isDragging = true;
        if (_transControl.onPointerDown(event))
            return true;
        return _transRotControl.onPointerDown(event);
    };

    this.handleButtonUp = function(event/*, button*/) {
        _isDragging = false;
        if (_transControl.onPointerUp(event)) 
            return true;
        return _transRotControl.onPointerUp(event);
    };

    this.handleMouseMove = function(event) {
        if (_isDragging) {
            if (_transControl.onPointerMove(event) ) {
                setSectionPlanes();
                _transRotControl.update();
                return true;
            }
            if (_transRotControl.onPointerMove(event)) {
                setSectionPlanes();
                updatePlaneMeshes();
                return true;
            }
        }

        _transControl.visible = _transControl.object !== undefined;

        if (event.pointerType !== 'touch') {
            var pointer = event.pointers ? event.pointers[ 0 ] : event;
            var result = intersectObjects(pointer, _sectionGroups[0].children);
            if (result) {
                _visibleAtFirst = false;
            }

            // show gizmo + plane when intersecting on non-touch 
            var visible = _visibleAtFirst || (result || intersectObjects(pointer, _sectionPicker, true)) ? true : false;
            _transRotControl.visible = visible;
            _transControl.visible = _transControl.visible && visible;
            showPlane(visible);
        }

        if (_transControl.onPointerHover(event))
            return true;

        return _transRotControl.onPointerHover(event);
    };

    this.handleGesture = function(event) {
        switch (event.type) {
            case "dragstart":
                _touchType = "drag";
                // Single touch, fake the mouse for now...
                return this.handleButtonDown(event, 0);

            case "dragmove":
                return (_touchType === "drag") ? this.handleMouseMove(event) : false;

            case "dragend":
                if (_touchType === "drag") {
                    _touchType = null;
                    return this.handleButtonUp(event, 0);
                }
                return false;
        }
        return false;
    };

    this.handleBlur = function(/*event*/) {
        return false;
    };

    this.handleResize = function() {
    };

    this.handlePressHold = function(/*event*/) {
        return true;
    };
};

function init_SectionMesh() {

if (Autodesk.Viewing.Extensions.Section.SectionMesh)
    return;

Autodesk.Viewing.Extensions.Section.SectionMesh = function(geometry, material, plane)
{
    THREE.Mesh.call(this, geometry, material, false);

    this.plane = plane;
    this.planeVec = new THREE.Vector4(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    this.connectivity = [];
    this.outlines = [];
};

Autodesk.Viewing.Extensions.Section.SectionMesh.prototype = Object.create(THREE.Mesh.prototype);
Autodesk.Viewing.Extensions.Section.SectionMesh.prototype.constructor = Autodesk.Viewing.Extensions.Section.SectionMesh;

Autodesk.Viewing.Extensions.Section.SectionMesh.prototype.update = function()
{
    this.plane.normal.set(0, 0, 1);
    this.plane.normal.applyQuaternion(this.quaternion);

    var normal = this.plane.normal;
    var d = -1 * this.getWorldPosition().dot(normal);
    this.planeVec.set(normal.x, normal.y, normal.z, d);
    this.plane.constant = d;
};

}

