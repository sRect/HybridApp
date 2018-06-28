(function() {
    //
    // Pixel Compare
    //

    var avep = AutodeskNamespace('Autodesk.Viewing.Extensions.PixelCompare');

    var av = Autodesk.Viewing;
    var avp = av.Private;
    var utils;


    function PixelCompare(viewer, options) {
        av.Extension.call(this, viewer, options);
        utils = avep.Utils;

        this.splitLineStyle = options.compareSplitLineStyle;

        this.DiffModes = Object.assign({}, avp.LeafletDiffModes);

        // Callback function for when the second model is loaded
        this.onSecondModelLoadedBinded = function(modelB) {
            var self = this;
            this.modelB = modelB;

            this.iterA = this.modelA.getIterator();
            this.iterB = this.modelB.getIterator();

            if (!av.isMobileDevice()) {
                this.iterA.setAggressivePrefetching(true);
                this.iterB.setAggressivePrefetching(true);
            }

            this.viewer.hideModel(this.modelA.id);

            // Init a leaflet compare iterator
            this.iterDiff = new avp.LeafletDiffIterator(this.iterA, this.iterB);

            this.modelDiff = new av.Model(this.modelA.getData());
            this.modelDiff.initFromCustomIterator(this.iterDiff);
            this.sceneDiff = this.iterDiff.getScene();

            if (this.viewer.loadSpinner) {
                // Show a spinner until the first scene is fully loaded
                this.sceneDiff.visible = false;
                this.viewer.loadSpinner.style.display = 'block';
                this.viewer.setNavigationLock(true);

                this.iterDiff.onFirstSceneComplete = function() {
                    self.viewer.loadSpinner.style.display = 'none';
                    self.sceneDiff.visible = true;
                    self.viewer.setNavigationLock(false);
                };
            }

            // Show rendering progress when traversing the scene
            this.iterDiff.onProgress = function(progress) {
                self.viewer.impl.signalProgress(progress, av.ProgressState.RENDERING);
            };

            this.viewer.impl.addModel(this.modelDiff);
            // Keep this.model in-sync. We should eliminate this.model to avoid that.
            this.viewer.model = this.viewer.impl.model;

            this._loadTool();

            setTimeout(function() { self.viewer.utilities.fitToView(true); }, 1);

            return true;
        }.bind(this);
    }

    PixelCompare.prototype = Object.create(av.Extension.prototype);
    PixelCompare.prototype.constructor = PixelCompare;

    var proto = PixelCompare.prototype;

    proto.load = function() {
        avp.injectCSS('extensions/PixelCompare/PixelCompare.css');

        return true;
    };

    proto.unload = function() {
        this.viewer.toolController.deregisterTool(this.tool);
        this.tool = null;

        this.endCompareWithCurrent(false);

        return true;
    };

    proto._loadTool = function() {
        this.tool = new avep.PixelCompareTool(this.viewer, this.iterDiff);
        this.viewer.toolController.registerTool(this.tool);
    };

   /*
    * Initializes a comparison between two models
    * @param {string} urnA - the first document location
    * @param {string} itemIdA - GUID of the first item.
    * @param {string} urnB - the second document location
    * @param {string} itemIdB - GUID of the second item.
    * @param {function} [cbAfterFirstModel] - optional callback executed after the first model is loaded
    * @returns {Promise} that resolves when all models are loaded
    */
    proto.compareTwoModels = function(urnA, itemIdA, urnB, itemIdB, cbAfterFirstModel) {
        var self = this;
        return this._loadModel(urnA, itemIdA, function(modelA) {
            if (!modelA || !modelA.getData().isLeaflet) {
                avp.logger.error('No model loaded to compare to or model is not leaflet');
                return false;
            }
            self.modelA = modelA;
            self.viewer.model = modelA;
            self.viewer.impl.addModel(modelA);
            setTimeout(function() {
                self.viewer.hideModel(modelA.id);
                self.viewer.model = self.viewer.impl.model = modelA;
            }, 1);

            return true;
        }).then(function() {
            if (cbAfterFirstModel) {
                cbAfterFirstModel();
            }
            return self._loadModel(urnB, itemIdB, self.onSecondModelLoadedBinded);
        })
    };

    /*
     * Initializes a comparison with the currently loaded model
     * @param {string} urn - the document location
     * @param {string} itemId - GUID of the item.
     * @returns {Promise} that resolves when model is loaded
     */
    proto.compareModelWithCurrent = function(urn, itemId) {
        this.modelA = this.viewer.model;
        if (!this.modelA || !this.modelA.getData().isLeaflet) {
            avp.logger.error('No model loaded to compare to or model is not leaflet');
            return Promise.reject({reason: 'no-suitable-first-model'});
        }

        return this._loadModel(urn, itemId, this.onSecondModelLoadedBinded);
    };

    /*
    * Ends the current comparison
    * @param {boolean} restoreModelA - whether to restore the visibility of the first (original) model
    */
    proto.endCompareWithCurrent = function(restoreModelA) {
        restoreModelA = restoreModelA === undefined ? true : restoreModelA;

        this.iterA.setAggressivePrefetching(false);
        if (this.modelB) {
            this.viewer.impl.unloadModel(this.modelDiff);
            this.viewer.impl.unloadModel(this.modelB);

            this.modelDiff = this.modelB = null;

        }

        if (this.tool && this.tool.isActive()) {
            this.setChangeOffsetMode(false);
        }

        if (restoreModelA) {
            this.viewer.showModel(this.modelA.id);

            var self = this;
            setTimeout(function () {
                self.viewer.utilities.fitToView(true);
            }, 1);
        }
    };

    /*
     * Sets the offset for the second model
     * @param {THREE.Vector3} offset
     */
    proto.setOffset = function(offset) {
        if (this.iterDiff) {
            this.iterDiff.setOffset(offset);
            this.viewer.impl.invalidate(true, true);
        }
    };

    /*
     * Split position from 0 to 1 (left to right) percent of the screen width. Used in this.DiffModes.SPLIT_VIEW
     * @param {Number} pos
     */
    proto.setSplitPosition = function(pos) {
        if (this.iterDiff) {
            this.iterDiff.setSplitPosition(pos);
            this.viewer.impl.invalidate(true, true);
        }
    };

    /**
     * Adds a split line element that can be dragged to change the split position
     * @private
     */
    proto._addSplitLine = function() {
        this.splitLineContainer = document.createElement('div');
        this.splitLineContainer.className = 'pixel-compare-splitter';

        var splitLine = document.createElement('div');
        splitLine.className = 'pixel-compare-splitter-center-mark';
        this.splitLineContainer.appendChild(splitLine);

        if (this.splitLineStyle) {
            var width = this.splitLineStyle.width;
            var color = this.splitLineStyle.color;
            if (width) {
                width = 2 * Math.round(width/2); // Round to nearest even number
                var containerWidth = Math.max(width, 16);
                this.splitLineContainer.style.width = containerWidth + 'px';
                this.splitLineContainer.style.left = 'calc(50% - ' + containerWidth/2 + 'px)';
                splitLine.style.width = width + 'px';
                splitLine.style.left = (containerWidth - width)/2 + 'px';
            }
            if (color) {
                splitLine.style.background = color;
            }
        }

        var startDragX = 0;
        var curLeft = 0;
        var isTouchEvent = false;

        var handleDown = function(e) {
            curLeft = this.splitLineContainer.offsetLeft;
            isTouchEvent = utils.isTouchEvent(e);
            startDragX = utils.getClientCoords(e).x;
            utils.addRemoveInputEvents(document, 'move', handleMove);
            utils.addRemoveInputEvents(document, 'up', handleUp);
            e.preventDefault();
        }.bind(this);

        var handleMove = function(e) {
            if (isTouchEvent !== utils.isTouchEvent(e)) return;

            var rect = this.viewer.impl.getCanvasBoundingClientRect();
            var splitWidth = this.splitLineContainer.offsetWidth;

            var x = utils.getClientCoords(e).x;
            var moveX = x - startDragX + curLeft;
            var centerX = moveX + splitWidth / 2 - rect.left;

            var limit = 5;  // Avoid dragging outside of the view bounds
            if (limit < centerX && centerX < rect.width - limit) {
                this.splitLineContainer.style.left = moveX + 'px';
                var pos = centerX / rect.width;
                this.setSplitPosition(pos);
                e.preventDefault();
            }
        }.bind(this);

        var handleUp = function(e) {
            utils.addRemoveInputEvents(document, 'move', handleMove, true);
            utils.addRemoveInputEvents(document, 'up', handleUp, true);
            e.preventDefault();
        }.bind(this);

        utils.addRemoveInputEvents(this.splitLineContainer, 'down', handleDown);

        this.setSplitPosition(0.5);
        this.viewer.container.appendChild(this.splitLineContainer);
    };

    /*
     * Changes the comparison mode
     * @param {Number} mode. Modes are in this.DiffModes
     */
    proto.setDiffMode = function(mode) {
        this.iterDiff && this.iterDiff.setDiffMode(mode);
        if (mode === this.DiffModes.SPLIT_VIEW) {
            if (!this.splitLineContainer) {
               this._addSplitLine();
            }

            this.splitLineContainer.style.display = 'block';
        } else {
            if (this.splitLineContainer) {
                this.splitLineContainer.style.display = 'none';
            }
        }
    };

   /*
    * Enables the offset changing mode, to align document
    * @param {boolean} enable
    */
    proto.setChangeOffsetMode = function(enable) {
        if (enable) {
            this.viewer.toolController.activateTool('pixelCompare');
            this.tool.setOffsetSettingMode(true);
        } else {
            this.tool.setOffsetSettingMode(false);
            this.viewer.toolController.deactivateTool('pixelCompare');
        }
    };


    /*
     * Loads a 2D model without adding it to the scene
     */
    proto._loadModel = function(urn, itemId, cb) {
        var self = this;

        return new Promise(function (resolve, reject) {
            var onLoad = function (doc) {

                var geometryItems = [];

                if (itemId) {
                    geometryItems = av.Document.getSubItemsWithProperties(doc.getRootItem(), {'guid': itemId}, true);
                }

                if (geometryItems.length === 0) {
                    geometryItems = av.Document.getSubItemsWithProperties(doc.getRootItem(), {
                        'type': 'geometry',
                        'role': '2d'
                    }, true);
                }

                if (geometryItems.length > 0) {
                    var docOptions = {
                        ids: null,
                        sharedPropertyDbPath: doc.getPropertyDbPath(),
                        acmSessionId: doc.acmSessionId,
                        loadOptions: {}
                    };

                    var path = doc.getViewablePath(geometryItems[0], docOptions.loadOptions);

                    var match = path.toLowerCase().match(/\.([a-z0-9]+)(\?|$)/),
                        fileExtension = match ? match[1] : null;

                    var loader = av.FileLoaderManager.getFileLoaderForExtension(fileExtension);
                    if (loader !== avp.LeafletLoader) {
                        avp.logger.error('File extension not supported:' + fileExtension, av.errorCodeString(av.ErrorCodes.UNSUPORTED_FILE_EXTENSION));
                        reject({reason: 'no-suitable-second-model'});
                        return;
                    }

                    // Load without adding to viewer
                    function onDone(error, model) {
                        if (error) {
                            avp.logger.error('Error loading second file for compare', error);
                            reject({reason: 'error-loading-second-model'});
                            return;
                        }

                        setTimeout(function () {
                            if (cb) {
                                cb(model) ? resolve(true) : reject({reason: 'error-in-model-cb'});
                            } else {
                                resolve(true);
                            }
                        }, 1);
                    }

                    var lefletLoader = new avp.LeafletLoader(self.viewer.impl._loaderDelegate);
                    lefletLoader.loadFile(path, docOptions, onDone);
                } else {
                    onError('Can not load geometries');
                }
            };

            var onError = function (error) {
                avp.logger.error('PixelCompare: Error loading model', error);
                reject({reason: error});
            };


            av.Document.load(urn, onLoad, onError, null);
        });
    };

    av.theExtensionManager.registerExtension('Autodesk.Viewing.PixelCompare', PixelCompare);
})();
(function() {

    "use strict";

    var av = Autodesk.Viewing;
    var avp = av.Private;
    var avep = AutodeskNamespace('Autodesk.Viewing.Extensions.PixelCompare');

    var PixelCompareTool = function(viewer, iterDiff) {
        av.ToolInterface.call(this);
        this.names = ['pixelCompare'];

        var _isActive = false;
        var _isSettingOffset = false;
        var _dragging = false;
        var _startDrag = null;
        var _curOffset = null;

        /**
         * Sets the offset changing mode
         * @param {boolean} enable
         */
        this.setOffsetSettingMode = function(enable) {
            _isSettingOffset = enable;

            if (enable) {
                // Allow zoom only when setting offset
                viewer.setNavigationLockSettings({
                    pan: false,
                    zoom: true
                });
                viewer.setNavigationLock(true);
            } else {
                viewer.setNavigationLock(false);
            }
        };

        this.isActive = function() {
            return _isActive;
        };

        this.activate = function(name) {
            _isActive = true;
        };

        this.deactivate = function(name) {
            _isActive = false;
        };

        this.handleButtonDown = function(event, button) {
            if (!_isSettingOffset) return false;

            _curOffset = iterDiff.getOffset();
            _startDrag = clientToWorld(viewer, event.canvasX, event.canvasY);
            _dragging = true;

            return true;
        };

        this.handleButtonUp = function(event, button) {
            _dragging = false;

            return false;
        };

        /**
         * Specialize base class implementation
         */
        this.handleMouseMove = function(event) {
            if (!_dragging) return false;

            var drag = clientToWorld(viewer, event.canvasX, event.canvasY);
            var newOffset = drag.sub(_startDrag).add(_curOffset);
            iterDiff.setOffset(newOffset);
            viewer.impl.invalidate(true, true);

            return true;
        };

        this.handleGesture = function(event) {
            switch(event.type)
            {
                case 'dragstart':
                    return this.handleButtonDown(event);

                case 'dragmove':
                    return this.handleMouseMove(event);

                case 'dragend':
                    return this.handleButtonUp(event);
            }
            return false;
        };

        this.getCursor = function() {
            return _isSettingOffset ? 'move' : null;
        };
    };

    var inputMap = {
        down: {
            pointer: 'pointerdown',
            mouse: 'mousedown',
            touch: 'touchstart'
        },
        up: {
            pointer: 'pointerup',
            mouse: 'mouseup',
            touch: 'touchend'
        },
        move: {
            pointer: 'pointermove',
            mouse: 'mousemove',
            touch: 'touchmove'
        }
    };

    function _getInputEvents(type) {
        if (av.isIE11)
            return [inputMap[type]['pointer']];

        const events = [];
        if (!av.isMobileDevice())
            events.push(inputMap[type]['mouse']);

        if (av.isTouchDevice())
            events.push(inputMap[type]['touch']);

        return events;
    }

    function getClientCoords(event) {
        if (av.isIE11)
            return { x: event.clientX, y: event.clientY };

        return event.type.startsWith('touch') ?
            { x: event.touches[0].clientX, y: event.touches[0].clientY } :
            { x: event.clientX, y: event.clientY };
    }

    function isTouchEvent(event) {
        if (av.isIE11)
            return event.pointerType === 'touch';

        return event.type.startsWith('touch');
    }

    function addRemoveInputEvents(elem, type, cb, isRemoving) {
        isRemoving = !!isRemoving;
        var action = (isRemoving ? 'remove' : 'add') + 'EventListener';
        var events = _getInputEvents(type);
        events.forEach(function(event) {
            elem[action](event, cb);
        });
    }

    function clientToWorld(viewer, x, y) {

        var worldPos = viewer.impl.clientToViewport(x, y);
        worldPos.unproject(viewer.impl.camera);

        return worldPos;
    }

    var Utils = {
        getClientCoords: getClientCoords,
        isTouchEvent: isTouchEvent,
        addRemoveInputEvents: addRemoveInputEvents,
        clientToWorld: clientToWorld
    };

    avep.PixelCompareTool = PixelCompareTool;
    avep.Utils = Utils;

})();
