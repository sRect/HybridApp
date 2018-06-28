(function() {

"use strict";

var av = Autodesk.Viewing;
var avp = av.Private;
var aveh = AutodeskNamespace('Autodesk.Viewing.Extensions.Hyperlink');

var HyperlinkExtension = function(viewer, options) {
    av.Extension.call(this, viewer, options);
    this.tool = null;
    this.name ='hyperlink';
};

HyperlinkExtension.prototype = Object.create(av.Extension.prototype);
HyperlinkExtension.prototype.constructor = HyperlinkExtension;

HyperlinkExtension.prototype.load = function() {
    var toolConfig = this.options || {};
    avp.injectCSS('extensions/Hyperlink/Hyperlink.css');
    this.tool = new aveh.HyperlinkTool(this.viewer, toolConfig);
    this.viewer.toolController.registerTool(this.tool);
    this.viewer.toolController.activateTool(this.tool.getName());
    return true;
};

HyperlinkExtension.prototype.unload = function() {
    this.viewer.toolController.deactivateTool(this.tool.getName());
    this.viewer.toolController.deregisterTool(this.tool);
    this.tool = null;
    return true;
};

HyperlinkExtension.prototype.activate = function () {
    return true;
};

HyperlinkExtension.prototype.deactivate = function () {
    return false;
};
aveh.HyperlinkExtension = HyperlinkExtension;
av.theExtensionManager.registerExtension('Autodesk.Hyperlink', HyperlinkExtension);

})();

(function() {

"use strict";

var av = Autodesk.Viewing;
var avp = av.Private;
var aveh = AutodeskNamespace('Autodesk.Viewing.Extensions.Hyperlink');

var HyperlinkTool = function(viewer, config) {
    av.ToolInterface.call(this);
    this.names = ['hyperlink'];

    var self = this;

    var _dbId = -1;
    var _dragging = false;
    var _linkCache2d = {};
    var _linkCache3d = {};
    var _tooltip = null;
    var _dbIdToIndex = null;

    var _stringDbIds = null;
    var _stringBoxes = null;
    var _thumbnailCache = {};

    var _bBoxOverlayName = 'Hyperlink-bBox';
    var _bBoxMaterial = null;
    var _bBoxSelectOverlayName = 'Hyperlink-bBox-select';
    var _bBoxSelectMaterial = null;
    var _meshSelected = null;

    this.panel = null; // hyperlink panel
    //this.back = null; // hyperlink back button

    /**
     * {number} Hexadecimal color for hyperlink. Default is 0x03a9f4.
     */
    this.fillColor = config.hyperlinkColor || 0x03a9f4;

    /**
     * {number} Hyperlink opacity property. 1 is opaque, 0 is transparent.
     */
    this.opacity = config.hyperlinkOpacity || 0.4;

    /**
     * {number} Hexadecimal color for selected hyperlinks. Default is 0xff7f50.
     */
    this.selectionFillColor = config.hyperlinkColorSelection || 0x708cde;

    /**
     * {number} Hyperlink opacity property. 1 is opaque, 0 is transparent.
     */
    this.selectedOpacity = config.hyperlinkOpacitySelected || 0.4;

    /**
     * {number} Padding added to the hyperlink rectangle.
     */
    this.rectanglePadding = config.hyperlinkPadding || 0.5;


    var _showTooltip = function(x, y, intersectPoint) {
        if (!_tooltip) {
            _tooltip = document.createElement('div');
            viewer.container.appendChild(_tooltip);

            _tooltip.setAttribute("data-i18n", "Ctrl + Click to preview the link");
            _tooltip.textContent = av.i18n.translate("Ctrl + Click to preview the link");
        }
        _tooltip.className = 'hyperlink-tooltip';
        _tooltip.style.top = (y + 20) + 'px';
        _tooltip.style.left = (x + 20) + 'px';
        _tooltip.intersectPoint = intersectPoint;
    };

    var _hideTooltip = function() {
        if (_tooltip) {
            viewer.container.removeChild(_tooltip);
            _tooltip = null;
        }
    };

    var _updateTooltipPosition = function() {
        if (_tooltip) {
            var camera = viewer.navigation.getCamera();
            var containerBounds = viewer.navigation.getScreenViewport();

            var p = new THREE.Vector3().copy(_tooltip.intersectPoint);
            p.project(camera);

            var x = Math.round((p.x + 1) / 2 * containerBounds.width);
            var y = Math.round((-p.y + 1) / 2 * containerBounds.height);

            _tooltip.style.left = (x + 20) + "px";
            _tooltip.style.top = (y + 20) + "px";
        }
    };

    var _onGeometryLoaded = function(event) {
        viewer.removeEventListener(av.GEOMETRY_LOADED_EVENT, _onGeometryLoaded);
        self.loadHyperlinks();
    };

    var _onCameraChange = function() {
        if (self.panel) {
            self.panel.updatePosition();
        }
        _updateTooltipPosition();
    };

    this.activate = function(name) {
        if (viewer.model && viewer.model.isLoadDone()) {
            self.loadHyperlinks();
        }
        else {
            viewer.addEventListener(av.GEOMETRY_LOADED_EVENT, _onGeometryLoaded);
        }
        viewer.addEventListener(av.CAMERA_CHANGE_EVENT, _onCameraChange);
    };

    this.deactivate = function(name) {
        viewer.removeEventListener(av.CAMERA_CHANGE_EVENT, _onCameraChange);
        viewer.removeEventListener(av.GEOMETRY_LOADED_EVENT, _onGeometryLoaded);
        
        _linkCache2d = {};
        _linkCache3d = {};
        _hideTooltip();
        if (this.panel) {
            this.panel.uninitialize();
            this.panel = null;
        }
        if (viewer.HyperlinkBack) {
            viewer.HyperlinkBack.uninitialize();
            viewer.HyperlinkBack = null;
        }
        viewer.impl.clearOverlay(_bBoxOverlayName);
        viewer.impl.clearOverlay(_bBoxSelectOverlayName);
    };

    this.update = function(timestamp) {
        return false;
    };

    this.handleSingleClick = function(event, button) {

        this.clearSelection();
        if (this.panel) {
            this.panel.uninitialize();
            this.panel = null;
        }

        var docNode = viewer.model.getDocumentNode();
        var viewableID = null;
        if (docNode) {
            viewableID = docNode.data.viewableID;
        }
        var position = new THREE.Vector2(event.canvasX, event.canvasY);
        
        // 2D
        if (viewer.model.is2d()) {

            var viewportCoords = viewer.impl.clientToViewport(event.canvasX, event.canvasY);
            var intersectPoint = viewer.impl.intersectGroundViewport(viewportCoords);

            for (var index in _linkCache2d) {

                if (!_linkCache2d.hasOwnProperty(index))
                    continue;

                var hyperLink = _linkCache2d[index];
                var x = intersectPoint.x;
                var y = intersectPoint.y;
                if (x >= hyperLink.bBox[0] && x <= hyperLink.bBox[2] && y >= hyperLink.bBox[1] && y <= hyperLink.bBox[3]) {
                    // Internal links
                    if (hyperLink.node) {
                        var title = hyperLink.node.data.name;
                        this.panel = new av.Extensions.Hyperlink.HyperlinkPanel(self, viewer, position, intersectPoint, title, hyperLink.link, viewableID, hyperLink.dbId, hyperLink.node.data, this.getThumbnail);
                    }
                    // external links
                    else {
                        this.panel = new av.Extensions.Hyperlink.HyperlinkPanel(self, viewer, position, intersectPoint, null, hyperLink.link, viewableID);
                    }
                    this.highlightSelection(hyperLink.bBoxMesh);
                    return true;
                }
            }

            return false;
        }

        // 3D
        if (viewer.model.is3d()) {

            var result = viewer.impl.hitTest(event.canvasX, event.canvasY, false);
            if (!result)
                return false;

            if (event.ctrlKey && _linkCache3d[_dbId]) {
                this.controller.setIsLocked(false);
                _hideTooltip();
                var hyperLink = _linkCache3d[_dbId];
                // Internal links
                if (hyperLink.node) {
                    var title = hyperLink.node.data.name;
                    this.panel = new av.Extensions.Hyperlink.HyperlinkPanel(self, viewer, position, result.intersectPoint, title, hyperLink.link, viewableID, _dbId, hyperLink.node.data, this.getThumbnail);
                }
                // external links
                else {
                    this.panel = new av.Extensions.Hyperlink.HyperlinkPanel(self, viewer, position, result.intersectPoint, null, hyperLink.link, viewableID, _dbId);
                }
                return true;
            }
        }

        return false;
    };

    this.handleButtonDown = function(event, button) {
        _dragging = true;
        return false;
    };

    this.handleButtonUp = function(event, button) {
        _dragging = false;
        return false;
    };

    /**
     * Specialize base class implementation
     */
    this.handleMouseMove = function(event) {
        if (_dragging) {
            return;
        }

        // 3D
        if (viewer.model && !viewer.model.is2d()) {
            var result = viewer.impl.hitTest(event.canvasX, event.canvasY, false);
            if (result) {
                var dbId = result.dbId;
                if (dbId != _dbId) {
                    _dbId = dbId;
                    _hideTooltip();
                }

                // Don't show tooltip for the same object when the popup is shown
                if (this.panel && this.panel.dbId === dbId) {
                    return;
                }

                // We're checking the hyperlinks lazily which means that their 1st appearance may be delayed.
                // If this is a problem, consider preloading hyperlinks during HyperlinkTool activation.
                if (_linkCache3d.hasOwnProperty(_dbId)) {
                    if (_linkCache3d[_dbId]) {
                        _showTooltip(event.canvasX, event.canvasY, result.intersectPoint);
                    }
                }
                else {
                    _linkCache3d[_dbId] = null;
                    this.loadHyperlink3d(_dbId, event.canvasX, event.canvasY, result.intersectPoint);
                }
            }
            else {
                _hideTooltip();
            }
        }
        return false;
    };

    this.getCursor = function() {
        return _tooltip ? 'pointer' : null;
    };

    /**
     * Load hyperlinks for 2D models.
     */
    this.loadHyperlinks = function() {

        var data = viewer.model.getData();
        _stringDbIds = data.stringDbIds;
        _stringBoxes = data.stringBoxes;
        _linkCache2d = {};

        // We only need to check the dbIds in stringDbIds, since
        // hyperlinks are associated with texts in 2d drawing.
        if (!_stringDbIds) 
            return;

        // _stringDbIds contains duplicate dbIds and also negative dbIds, which are
        // placeholders for text-only geometry without any property database entry.
        // Need to remove the negative dbIds and delete all other duplicates.
        var uniqueDbIds = [];
        _dbIdToIndex = {};
        for (var i=0, len=_stringDbIds.length; i<len; ++i) {
            
            var candidateId = _stringDbIds[i];
            if (candidateId < 1) 
                continue;

            if (uniqueDbIds.indexOf(candidateId) === -1) {
                uniqueDbIds.push(candidateId);
                _dbIdToIndex[candidateId] = [];
            }

            _dbIdToIndex[candidateId].push(i);
        }

        // Ignore error function callback.
        viewer.model.getBulkProperties(uniqueDbIds, { propFilter: ['hyperlink']}, this._onBulkProperties);
    };

    /**
     * Parses results from model.getBulkProperties() to initialize hyperlinks on-canvas.
     * 
     * @private
     */
    this._onBulkProperties = function(results) {
        
        // Get bubble manifest.
        var docNode = viewer.model.getDocumentNode();
        if (docNode) {
            docNode = docNode.getRootNode();
        }

        for (var i=0, len=results.length; i<len; ++i) {
            var result = results[i];
            var dbId = result.dbId;
            var propValue = result.properties[0].displayValue;
            var linkToNode = null; // Object reference
            var link = null; // string

            // Is it a reference to another Document viewable?
            var candidates = docNode ? docNode.search({'viewableID': propValue}) : null;
            if (candidates && candidates.length) {
                linkToNode = candidates[0];
            }
            // Or a URL, maybe?
            if (!linkToNode && this._isURL(propValue)) {
                link = propValue;
            }

            if (!linkToNode && !link)
                continue;
        
            // Cache it
            var indices = _dbIdToIndex[dbId];
            for (var x=0; x<indices.length; ++x) {
                
                var index = indices[x];
                _linkCache2d[index] = {
                    dbId: dbId,
                    link: link,
                    node: linkToNode
                };

                // Highlight the bounding box of text with hyperlink
                this.highlightText(index);
            }
        
        }
    }.bind(this);

    /**
     * TODO: Refactor to common place.
     * 
     * @private
     */
    this._isURL = function(str) {
        
        //
        // We could have a complex RegExp, but I'm going with a simple check for URLs.
        //
        if (typeof str !== 'string')
            return;

        // check http protocol, it's the only one we care about.
        var protocol = str.substr(0, 4).toLowerCase();
        if (protocol === 'http')
            return true;

        // Find first '/' ...
        var firstSlash = str.indexOf('/');
        if (firstSlash !== -1) {
            // ... and get rid of the rest...
            str = str.substr(0, firstSlash);
        }

        // If there is a slash, check that str has at least 1 dot. Example: autodesk.com/something
        var dotCount = str.split('.').length;
        if (firstSlash > 0 && dotCount > 0)
            return true;

        // If there is no slash, check that the url has at least 2 dots. Example: www.autodesk.com
        if (firstSlash === -1 && dotCount > 1)
            return true;

        // Add more checks as needed...

        return false;
    };

    this.navigateToLink = function(link, item) {

        if (link) {
            window.open(link);
            return;
        }

        if (item) {
            // Relies on ViewingApplication to navigate the Viewer into the new viewable.
            viewer.dispatchEvent({ type: av.HYPERLINK_EVENT, data: { item: item } });
            return;        
        }
    };

    this.loadHyperlink3d = function(dbId, x, y, intersectPoint) {
        viewer.getProperties(dbId, function (result) {
            var props = result.properties;
            for (var i = 0, len = props.length; i < len; i++) {
                var prop = props[i];
                if (prop.displayCategory === '__hyperlink__') {
                    var linkToNode = null;
                    var link = prop.displayValue;
                    var docNode = viewer.model.getDocumentNode();
                    if (docNode) {
                        docNode = docNode.getRootNode();
                        var candidates = docNode.search({'viewableID': link});
                        if (candidates && candidates.length) {
                            linkToNode = candidates[0];
                        }
                    }
                    _linkCache3d[dbId] = {
                        link: link,
                        node: linkToNode
                    };

                    _showTooltip(x, y, intersectPoint);

                    break;
                }
            }
        });
    };

    this.getHyperlinks = function() {
        return _linkCache;
    };

    /**
     * @param {string} item - Document item.
     */
    this.getThumbnail = function(dbId, item, callback) {
        if (_thumbnailCache.hasOwnProperty(dbId)) {
            callback(_thumbnailCache[dbId]);
            return;
        }
        
        var data = {
            urn: viewer.model.getData().urn,
            width: 200,
            height: 200,
            guid: encodeURIComponent(item.guid),
            acmsession: viewer.model.getData().acmSessionId
        };

        var onSuccess = function(response) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var thumbnailURL = e.target.result;
                _thumbnailCache[dbId] = thumbnailURL;
                callback(thumbnailURL);
            };
            reader.readAsDataURL(response);
        };

        var options = {
            responseType: 'blob',
            skipAssetCallback: true,
            size: data.width, //Ignore the height, they are the same.
            guid: data.guid,
            acmsession: data.acmsession
        };

        var urlpath = "urn:" + data.urn; //HACK: Adding urn: makes the ViewingServiceXhr accept this as a viewing service request.
        avp.ViewingService.getThumbnail(avp.initLoadContext(), urlpath, onSuccess, null, options);
    };

    this.highlightText = function(index) {
        var padding = this.rectanglePadding;
        var minX = _stringBoxes[index * 4] - padding;
        var minY = _stringBoxes[index * 4 + 1] - padding;
        var maxX = _stringBoxes[index * 4 + 2] + padding;
        var maxY = _stringBoxes[index * 4 + 3] + padding;
        _linkCache2d[index].bBox = [minX, minY, maxX, maxY];

        // draw a rectangle with these values.
        this.addRectangle(index, minX, minY, maxX, maxY);
    };

    this.addRectangle = function(index, minX, minY, maxX, maxY) {

        var z = 0;
        var vA = new THREE.Vector3(minX, minY, z);
        var vB = new THREE.Vector3(maxX, minY, z);
        var vC = new THREE.Vector3(maxX, maxY, z);
        var vD = new THREE.Vector3(minX, maxY, z);
        
        var geom = new THREE.Geometry();
        geom.vertices.push(vA);
        geom.vertices.push(vB);
        geom.vertices.push(vC);
        geom.vertices.push(vD);
        
        geom.faces.push(new THREE.Face3(0, 1, 2));
        geom.faces.push(new THREE.Face3(0, 3, 2));

        if (!_bBoxMaterial) {
            var color = this.fillColor;
            var opacity = this.opacity;

            _bBoxMaterial = new THREE.MeshBasicMaterial({
                color: color,
                opacity: opacity,
                transparent: true,
                depthTest: false,
                depthWrite: false,
                side: THREE.DoubleSide
            });

            viewer.impl.createOverlayScene(_bBoxOverlayName);
        }

        var mesh = _linkCache2d[index].bBoxMesh = new THREE.Mesh(geom, _bBoxMaterial, true);
        
        viewer.impl.addOverlay(_bBoxOverlayName, mesh);
        
    };

    this.highlightSelection = function(mesh) {
        _meshSelected = mesh;
        viewer.impl.removeOverlay(_bBoxOverlayName, mesh);

        if (!_bBoxSelectMaterial) {
            var color = this.selectionFillColor;;
            var opacity = this.selectedOpacity;

            _bBoxSelectMaterial = new THREE.MeshBasicMaterial({
                color: color,
                opacity: opacity,
                transparent: true,
                depthTest: false,
                depthWrite: false,
                side: THREE.DoubleSide
            });

            viewer.impl.createOverlayScene(_bBoxSelectOverlayName);
        }

        var newMesh = new THREE.Mesh(mesh.geometry, _bBoxSelectMaterial);
        viewer.impl.addOverlay(_bBoxSelectOverlayName, newMesh);
    };

    this.clearSelection = function() {
        if (_meshSelected) {
            viewer.impl.clearOverlay(_bBoxSelectOverlayName);

            viewer.impl.addOverlay(_bBoxOverlayName, _meshSelected);
            _meshSelected = null;
        }
    };

};

aveh.HyperlinkTool = HyperlinkTool;

})();

(function() {
    
    "use strict";

    var aveh = AutodeskNamespace('Autodesk.Viewing.Extensions.Hyperlink'),
        av = Autodesk.Viewing,
        ave = Autodesk.Viewing.Extensions,
        avp = Autodesk.Viewing.Private,
        avu = Autodesk.Viewing.UI;

    /**
     * Panel displayed on top of the viewer displaying an hint (either a URL or a Thumbnail) of where the
     * hyperlink will be redirecting the user into.
     * 
     * URLs will open in a new tab, while thumbnails are shown for models referenced by the same document.
     * 
     * @param {*} hyperlinkTool 
     * @param {*} viewer 
     * @param {*} position 
     * @param {*} intersectPoint 
     * @param {*} title 
     * @param {*} link 
     * @param {*} viewableID 
     * @param {*} dbId 
     * @param {*} item 
     * @param {*} callback 
     */
    var HyperlinkPanel = function(hyperlinkTool, viewer, position, intersectPoint, title, link, viewableID, dbId, item, callback) {
        var self = this;
        this.viewer = viewer;
        
        this.container = document.createElement("div");
        this.container.className = "hyperlink-container";
        viewer.container.appendChild(this.container);
        
        this.container.style.left = position.x + "px";
        this.container.style.top = position.y - 70 + "px"; // add the offset to let the triangle point to the position

        this.intersectPoint = intersectPoint; // for updating the panel position when camera is changed.
        this.dbId = dbId;
        
        // triangle
        this.triangle = document.createElement("div");
        this.triangle.classList.add("hyperlink-container-triangle");
        this.container.appendChild(this.triangle);

        // panel
        this.panel = document.createElement("div");
        this.panel.classList.add("docking-panel");
        this.panel.classList.add("docking-panel-container-solid-color-a");
        this.panel.classList.add("hyperlink-panel");
        this.container.appendChild(this.panel);

        // title
        this.title = document.createElement("div");
        this.title.className = "hyperlink-panel-title";
        if (title) {
            this.title.textContent = title;
        }
        else {
            this.title.setAttribute("data-i18n", "External Link");
            this.title.textContent = av.i18n.translate("External Link");
        }
        this.panel.appendChild(this.title);

        function onGetThumbnail(thumbnailURL) {
            self.thumbnail.src = thumbnailURL;
        }
        if (item) {
            // thumbnail
            this.panel.classList.add("thumbnail");
            this.thumbnail = document.createElement("img");
            this.thumbnail.className = "hyperlink-panel-thumbnail";
            callback(dbId, item, onGetThumbnail);
            this.panel.appendChild(this.thumbnail);
        }
        else {
            // external link
            this.panel.classList.add("link");
            this.externalLink = document.createElement("div");
            this.externalLink.className = "hyperlink-panel-external-link";
            this.externalLink.textContent = link;
            this.panel.appendChild(this.externalLink);
        }

        // view button
        this.viewButton = document.createElement("div");
        this.viewButton.className = "docking-panel-primary-button";
        this.viewButton.setAttribute("data-i18n", "View");
        this.viewButton.textContent = av.i18n.translate("View");
        this.panel.appendChild(this.viewButton);
        this.viewButton.addEventListener('click', function() {
            self.uninitialize();
            hyperlinkTool.panel = null;
            if (viewer.HyperlinkBack) {
                viewer.HyperlinkBack.uninitialize();
                viewer.HyperlinkBack = null;
            }
            var currItem = viewer.model.getDocumentNode();
            hyperlinkTool.navigateToLink(link, item);
            if (item) {
                viewer.HyperlinkBack = new aveh.HyperlinkBack(hyperlinkTool, viewer, currItem);
            }
        });

        // Set the triangle's position
        this.triangle.style.bottom = this.container.clientHeight - 85 + "px";

        this.boundsCheck();
    };

    HyperlinkPanel.prototype.uninitialize = function() {
        this.viewer.container.removeChild(this.container);
        this.container = null;
    };

    HyperlinkPanel.prototype.boundsCheck = function() {
        var containerBounds = this.viewer.navigation.getScreenViewport();
        var wi = this.container.clientWidth;
        var hi = this.container.clientHeight;
        var x1 = parseInt(this.container.style.left, 10);
        var y1 = parseInt(this.container.style.top, 10);
        
        var x2 = x1, y2 = y1;
        if (x1 < 0)
            x2 = 0;
        if (y1 < 0)
            y2 = 0;
        if (containerBounds.width < x1 + wi) {
            x2 = containerBounds.width - wi;
        }
        if (containerBounds.height < y1 + hi) {
            y2 = containerBounds.height - hi;
        }

        var distance = this.viewer.navigation.getEyeVector().length();
        var delta = this.viewer.impl.clientToViewport(x1, y1);
        var on = this.viewer.impl.clientToViewport(x2, y2);
        delta.subVectors(delta, on);
        this.viewer.navigation.panRelative(delta.x/2, delta.y/2, distance);

        this.container.style.left = x2 + "px";
        this.container.style.top = y2 + "px";
    };

    HyperlinkPanel.prototype.updatePosition = function() {
        var camera = this.viewer.navigation.getCamera();
        var containerBounds = this.viewer.navigation.getScreenViewport();

        var p = new THREE.Vector3().copy(this.intersectPoint);
        p.project(camera);

        var x = Math.round((p.x + 1) / 2 * containerBounds.width);
        var y = Math.round((-p.y + 1) / 2 * containerBounds.height);

        this.container.style.left = x + "px";
        this.container.style.top = y - 70 + "px"; // add the offset to let the triangle point to the position
    };

    aveh.HyperlinkPanel = HyperlinkPanel;

    /**
     * Back button added when user navigates to a new sheet using an hyperlink.
     * 
     * @param {*} hyperlinkTool 
     * @param {*} viewer 
     * @param {*} link 
     */
    var HyperlinkBack = function(hyperlinkTool, viewer, itemBack) {
        var self = this;
        this.viewer = viewer;

        this.container = document.createElement("div");
        this.container.classList.add("docking-panel-primary-button");
        this.container.classList.add("hyperlink-back") ;
        viewer.container.appendChild(this.container);

        this.backButton = document.createElement("div");
        this.backButton.className = "hyperlink-back-button";
        this.backButton.setAttribute("data-i18n", "Back");
        this.backButton.textContent = av.i18n.translate("Back");
        this.container.appendChild(this.backButton);
        this.backButton.addEventListener('click', function() {
            self.uninitialize();
            viewer.HyperlinkBack = null;
            if (hyperlinkTool.panel) {
                hyperlinkTool.panel.uninitialize();
                hyperlinkTool.panel = null;
            }
            hyperlinkTool.navigateToLink(null, itemBack);
        });

        this.closer = document.createElement("div");
        this.closer.classList.add("docking-panel-close");
        this.closer.classList.add("hyperlink-back-closer");
        this.container.appendChild(this.closer);
        this.closer.addEventListener('click', function() {
            self.uninitialize();
            viewer.HyperlinkBack = null;
        });
    };

    HyperlinkBack.prototype.uninitialize = function() {
        this.viewer.container.removeChild(this.container);
        this.container = null;
    };
    
    aveh.HyperlinkBack = HyperlinkBack;

})();