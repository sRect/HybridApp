(function() {

    "use strict";

    var av = Autodesk.Viewing;
    var avp = Autodesk.Viewing.Private;
    var aveb = AutodeskNamespace('Autodesk.Viewing.Extensions.Billboard');

    /**
     * Extension used to add annotations over 3d models.
     * @constructor
     * @tutorial feature_billboard
     * @param {Autodesk.Viewing.Viewer3D} viewer - Viewer to be extended.
     * @param {object} options - An optional dictionary of options for this extension.
     * @memberof Autodesk.Viewing.Extensions.Billboard
     * @alias Autodesk.Viewing.Extensions.Billboard.BillboardExtension
     * @category Extensions
     */
    var BillboardExtension = function(viewer, options) {
        av.Extension.call(this, viewer, options);
        this.name = "billboard";
    };

    BillboardExtension.prototype = Object.create(av.Extension.prototype);
    BillboardExtension.prototype.constructor = BillboardExtension;

    var proto = BillboardExtension.prototype;

    proto.load = function() {

        // download css
        avp.injectCSS('extensions/Billboard/Billboard.css');

        var self = this;
        this.tool = new aveb.BillboardTool(this.viewer);
        this.viewer.toolController.registerTool(this.tool);
        
        this.onExplodeBinded = this.onExplode.bind(this);
        this.onSectionBinded = this.onSection.bind(this);

        this.viewer.addEventListener(av.CAMERA_CHANGE_EVENT, this.tool.onCameraChange);
        this.viewer.addEventListener(av.VIEWER_RESIZE_EVENT, this.tool.handleResize);
        this.viewer.addEventListener(av.EXPLODE_CHANGE_EVENT, this.onExplodeBinded);
        this.viewer.addEventListener(av.CUTPLANES_CHANGE_EVENT, this.onSectionBinded);

        // Given that the user has single clicked to highlight an existing billboard
        // Then Return Key will enter annotation "edit mode".
        this.HOTKEYS_ID = "Autodesk.Billboard.Hotkeys";
        var hotkeys = [{
            keycodes: [
                av.theHotkeyManager.KEYCODES.ENTER
            ],
            onRelease: function() {
                if (self.tool)
                    return self.tool.enterEditAnnotation();
            }
        }];
        av.theHotkeyManager.pushHotkeys(this.HOTKEYS_ID, hotkeys);
        
        return true;
    };

    proto.unload = function() {
        // Remove hotkeys
        av.theHotkeyManager.popHotkeys(this.HOTKEYS_ID);

        this.viewer.removeEventListener(av.CAMERA_CHANGE_EVENT, this.tool.onCameraChange);
        this.viewer.removeEventListener(av.VIEWER_RESIZE_EVENT, this.tool.handleResize);
        this.viewer.removeEventListener(av.EXPLODE_CHANGE_EVENT, this.onExplodeBinded);
        this.viewer.removeEventListener(av.CUTPLANES_CHANGE_EVENT, this.onSectionBinded);

        this.clearAnnotations();

        this.viewer.toolController.deregisterTool(this.tool);
        this.tool = null;
        return true;
    };

    proto.activate = function () {
        if(!this.activeStatus) {
            this.enterEditMode();
            this.activeStatus = true;
        }
        return true;
    };
    proto.deactivate = function () {
        if(this.activeStatus) {
            this.leaveEditMode();
            this.activeStatus = false;
        }
        return true;
    };

    /**
     * Enables click/touch interactions over Viewer canvas to create annotations.<br>
     * Exit editMode by calling [leaveEditMode()]{@link Autodesk.Viewing.Extensions.Billboard.BillboardExtension#leaveEditMode}.<br>
     * @returns {boolean} Returns true if editMode is active
     */
    proto.enterEditMode = function() {
        if (!this.tool.isActive()) {
            this.viewer.toolController.activateTool('billboard');
        }
        return true;
    };

    /**
     * Exits from editMode.<br>
     * See also [enterEditMode()]{@link Autodesk.Viewing.Extensions.Billboard.BillboardExtension#enterEditMode}.
     * @returns {boolean} returns true if edit mode has been deactivated
     */
    proto.leaveEditMode = function() {
        if (this.tool.isActive()) {
            this.viewer.toolController.deactivateTool('billboard');
        }
        return true;
    };

    /**
     * Returns an array of annotations created so far as comments object.<br>
     * Annotations should have been added while in
     * [Edit Mode]{@link Autodesk.Viewing.Extensions.Billboard.BillboardExtension#enterEditMode}.
     * @returns {string}
     */
    proto.generateData = function() {
        // Return an array with all the user added annotations.
        return this.tool.generateData();
    };

    /**
     * Loads an array of annotations as comments object and show all annotations.<br>
     * @param {string} data - an array of comments objects
     */
    proto.loadData = function(data) {
        this.tool.loadData(data);
    };

    /**
     * Shows annotations created so far.<br>
     * Annotations should have been added while in
     * [Edit Mode]{@link Autodesk.Viewing.Extensions.Billboard.BillboardExtension#enterEditMode}.
     */
    proto.showAnnotations = function() {
        if (this.tool) {
            this.tool.showAnnotations();
        }
    };

    /**
     * Hides annotations created so far.<br>
     * Annotations should have been added while in
     * [Edit Mode]{@link Autodesk.Viewing.Extensions.Billboard.BillboardExtension#enterEditMode}.
     */
    proto.hideAnnotations = function() {
        if (this.tool) {
            this.tool.hideAnnotations();
        }
    };

    /**
     * Delete all annotations created so far.<br>
     */
    proto.clearAnnotations = function() {
        if (this.tool) {
            this.tool.clearAnnotations();
        }
    };

    /**
     * Shows number markers related to annotations created so far.<br>
     */
    proto.showNumberMarkers = function() {
        if (this.tool) {
            this.tool.showNumMarkers();
        }
    };

    /**
     * Hides number markers related to annotations created so far.<br>
     */
    proto.hideNumberMarkers = function() {
        if (this.tool) {
            this.tool.hideNumMarkers();
        }
    };

    /**
     * @private
     */
    proto.onExplode = function(e) {
        // scale is a string
        if (e.scale * 1.0 === 0) {
            this.showNumberMarkers();
        } else {
            this.hideAnnotations();
            this.hideNumberMarkers();
        }
    };

    /**
     * @private
     */
    proto.onSection = function(e) {
        if (Array.isArray(e.planes) && e.planes.length > 0) {
            this.hideAnnotations();
            this.hideNumberMarkers();
        } else {
            this.showNumberMarkers();
        }
    };

    aveb.BillboardExtension = BillboardExtension;
    av.theExtensionManager.registerExtension('Autodesk.Billboard', BillboardExtension);

})();

(function() {
    
    "use strict";
    
    var av = Autodesk.Viewing;
    var avp = Autodesk.Viewing.Private;
    var aveb = AutodeskNamespace('Autodesk.Viewing.Extensions.Billboard');

    av.ANNOTATION_CREATED_EVENT = "annotationCreated";
    av.ANNOTATION_DELETED_EVENT = "annotationDeleted";
    
    var BillboardTool = function(viewer) {
        av.ToolInterface.call(this);
        this.names = ['billboard'];

        var self = this;
        var _active = false;
        var _dragging = false;
        var _editing = false;

        var _nextId = 1; // record the annotation id

        var _cursor = "url(data:;base64,AAABAAEAGBgAAAEAIACICQAAFgAAACgAAAAYAAAAMAAAAAEAIAAAAAAAAAkAABMLAAATCwAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJAAAAtAAAAEkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMSEhL/sbGx/wAAALQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEwgICP99fX3//////wAAAP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAdCAgI/3p6ev///////////wAAAP8AAADWAAAAqAAAAHwAAABJAAAAEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHQAAAHQEBAT/AAAABAAAABMSEhL/hISE/////////////////+Li4v/W1tb/qKio/319ff9KSkr/EhIS/wAAAHQAAAAdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEHR0d/3R0dP9kZGT/AAAAdAAAABMSEhL/sbGx//////////////////r6+v//////////////////////x8fH/3R0dP8dHR3/AAAARAAAAAAAAAAAAAAAAAAAADUzMzP/ra2t///////i4uL/VlZW/wQEBP8AAAD/MzMz/7m5uf///////////4qKiv9kZGT/hISE/7W1tf/t7e3///////////+tra3/MzMz/wAAADUAAAAAAAAAAAAAAJydnZ3//////+Li4v+Kior/MzMz/wAAADEAAAAAAAAAUCkpKf+5ubn//////wAAAP8AAABmAAAAgwAAALQ4ODj/ioqK/+Li4v//////nZ2d/wAAAJwAAAAAAAAAAAAAAOzv7+///////2RkZP8AAACMAAAANQAAAAAAAAAJAAAAAAAAAFApKSn/ubm5/wAAALQAAAAAAAAAAAAAAAAAAAA1AAAAjGRkZP//////7+/v/wAAAOwAAAAAAAAAAAAAAJydnZ3//////+Li4v+Kior/ODg4/wAAAP8ICAj/AAAAVwAAADUAAABQCwsL/////wD////U////1P///9T////U////AAcHB///////nZ2d/wAAAJwAAAAAAAAAAAAAADUzMzP/ra2t////////////7e3t/7W1tf+EhIT/VlZW/zMzM/8XFxf/FxcX/wAAAAAAAAD/AAAA/wAAAP8AAAD/AAAAADU1Nf+Ojo7/MzMz/wAAADUAAAAAAAAAAAAAAAAAAABEHR0d/3R0dP/Hx8f/////////////////////////////////ZWVl/wAAAAT////UAAAA/wAAAP/////UAAAAAHFxcf8dHR3/AAAARAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHQAAAHQSEhL/SkpK/319ff+oqKj/zMzM/+jo6P/6+vr/QEBA/wAAAAb////UAAAA/wAAAP/////UAAAAAAAAAHQAAAAdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATAAAASQAAAHwAAACoAAAAzAAAAOwAAAD5AAAA+wAAAAL////UAAAA/wAAAP/////UAAAAAAAAAAD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAD////UAAAA/wAAAP/////UAAAAAAAAAAD///8AAAAAAAAAAAAAAACMAAAA9gAAAIwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////U////1P///9T////UAAAA/wAAAP/////U////1P///9T////UAAAAAAAAAAAAAAD29vb2/0hISP8AAACQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////UAAAA/3R0dOr////UAAAA/wAAAP/////UdHR06gAAAP/////UAAAAAAAAAAAAAAD///////r6+v9OTk7/AAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////UAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP/////UAAAAAAAAAAAAAAD////////////6+vr/Tk5O/wAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////U////1P///9T////U////1P///9T////U////1P///9T////UAAAAAAAAAAAAAAD/////////////////+vr6/wAAAPkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACcAAAA/wAAAP8AAAD/AAAA+QAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AP///wD/8f8A/+H/AP/B/wD9gA8A8AADAOAAAQDAAAAAwEAAAMChwADAAhAAwAIQAOAAEQDwABMA/AAfAP/+HwAf8AMAD/ADAAfwAwAD8AMAA///AAP//wA=), auto";

        var _lineOverlayName = "billboard-line";
        var _pointOverlayName = "billboard-point";
        var _billboardLineMaterial = null;
        var _annotationLineMaterial = null;
        var _billboardLineColor = 0x000000;
        var _annotationLineColor = 0x008585;
        var _lineWidth = 1;
        var _glowLineMaterial = null;
        var _glowLineColor = 0xFFFFFF;
        var _leadPointMaterial = null;
        var _leadPointColor = 0x000000;
        var _glowPointMaterial = null;
        var _glowPointColor = 0xFFFFFF;

        this.annotations = [];
        this.numMarkers = [];

        this.filter = {
            seedURN: true,
            objectSet: true,
            viewport: true,
            tags: true, // Animation extension uses tags.
            renderOptions: false,
            cutplanes: true
        };

        this.isActive = function() {
            return _active;
        };

        this.getCursor = function() {
            return _cursor;
        };

        this.activate = function() {
            _active = true;

            viewer.clearSelection();
            this.showAnnotations();
        };

        this.deactivate = function() {
            _active = false;

            if (this.billboard) {
                // In annotation editting mode, save the annotation before deactivating the tool.
                if (this.billboard.annotationEditing) {
                    this.billboard.dragging = false;
                    if (this.billboard.textArea.value)
                        this.billboard.acceptButton.click();
                    else
                        this.billboard.cancelButton.click();
                }
                else {
                    this.destroyBillboard();
                }
            }

            this.hideAnnotations();
        };

        this.onCameraChange = function() {
            self.updateBillboard();
            self.updateAnnotations();
            self.highlightAnnotation();
        };

        this.project = function(position) {
            var camera = viewer.navigation.getCamera();
            var containerBounds = viewer.navigation.getScreenViewport();

            var p = new THREE.Vector3().copy(position);
            p.project(camera);

            return new THREE.Vector3(Math.round((p.x + 1) / 2 * containerBounds.width),
                Math.round((-p.y + 1) / 2 * containerBounds.height), p.z);
        };

        this.unproject = function(position) {
            var camera = viewer.navigation.getCamera();
            var containerBounds = viewer.navigation.getScreenViewport();
            var p = new THREE.Vector3();

            p.x = position.x / containerBounds.width * 2 - 1;
            p.y = -(position.y / containerBounds.height * 2 - 1);
            p.z = position.z;

            p.unproject(camera);

            return p;
        };

        this.createBillboard = function(intersectPoint, annotation) {

            // Only keep at most one billboard in the scene
            if (_editing)
                return;

            _editing = true;

            // Create Billboard Panel
            this.billboard = document.createElement("div");
            this.billboard.className = "billboard-container";
            viewer.container.appendChild(this.billboard);

            // Initialize the position of billboard
            var pos = new THREE.Vector3(0, 0, 0);
            var deltaX = pos.x - intersectPoint.x;
            var deltaY = pos.y - intersectPoint.y;
            this.billboard.deltaX = annotation ? annotation.deltaX : deltaX;
            this.billboard.deltaY = annotation ? annotation.deltaY : deltaY;
            this.setBillboardPosition(intersectPoint, annotation);
            this.moveHandler(this.billboard);

            this.billboard.intersectPoint = intersectPoint;
            this.billboard.show = true;
            if (annotation) {
                this.billboard.annotationEditing = true;
            }

            // Create Text Area
            var textarea = this.billboard.textArea = document.createElement("TEXTAREA");
            textarea.className = "billboard-textarea";
            this.billboard.appendChild(textarea);
            textarea.setAttribute('rows', '4');
            textarea.setAttribute('maxlength', '140');
            textarea.focus();
            if (annotation) {
                textarea.value = annotation.childNodes[0].innerHTML;
            }

            var control = document.createElement("div");
            control.className = "billboard-control";
            this.billboard.appendChild(control);

            // Create Accept Button
            var accept = this.billboard.acceptButton = document.createElement("div");
            accept.className = "billboard-button-accept";
            accept.setAttribute("data-i18n", "Accept");
            accept.textContent = av.i18n.translate("Accept");
            accept.addEventListener('click', function() {
                // Only create the annotation when the user types something in the textarea
                if (!self.billboard.dragging && self.billboard.childNodes[0].value) {
                    var val = self.billboard.childNodes[0].value;
                    var x = self.billboard.deltaX;
                    var y = self.billboard.deltaY;
                    if (annotation)
                        self.createAnnotation(intersectPoint, val, x, y, annotation.id);
                    else
                        self.createAnnotation(intersectPoint, val, x, y);
                    self.destroyBillboard();
                }
            }, false);
            control.appendChild(accept);

            if (!annotation) {
                accept.classList.add("billboard-button-accept-greyout");
            }
            textarea.addEventListener("input", function() {
                if (textarea.value) {
                    accept.classList.remove("billboard-button-accept-greyout");
                }
                else {
                    accept.classList.add("billboard-button-accept-greyout");
                }
            });

            // Create Cancel Button
            var cancel = this.billboard.cancelButton = document.createElement("div");
            cancel.className = "billboard-button-cancel";
            var cancelText;
            if (annotation)
                cancelText = "Delete";
            else
                cancelText = "Cancel";
            cancel.setAttribute("data-i18n", cancelText);
            cancel.textContent = av.i18n.translate(cancelText);
            cancel.addEventListener('click', function() {
                if (!self.billboard.dragging) {
                    self.destroyBillboard();
                    // In delete mode
                    if (annotation) {
                        self.destroyNumMarker(annotation.id);
                        viewer.dispatchEvent(
                            {type: av.ANNOTATION_DELETED_EVENT, data: annotation.commObj}
                        );
                    }
                }
            }, false);
            control.appendChild(cancel);

            this.drawLeadLine(intersectPoint, this.billboard);
            this.drawLeadPoint(intersectPoint, this.billboard);

            // Set the current hit point as the new pivot point
            viewer.utilities.setPivotPoint(intersectPoint, true, true);
        };

        this.destroyBillboard = function() {
            _editing = false;

            viewer.impl.removeMultipleOverlays(_lineOverlayName, this.billboard.line);
            viewer.impl.removeMultipleOverlays(_pointOverlayName, this.billboard.point);

            viewer.container.removeChild(this.billboard);
            this.billboard = null;
        };

        // Need to add offset to the position
        this.setBillboardPosition = function(position, annotation) {

            var pos;
            if (annotation) {
                pos = new THREE.Vector3().copy(annotation.position);
            }
            else {
                pos = new THREE.Vector3().copy(position);
                pos.x += this.billboard.deltaX;
                pos.y += this.billboard.deltaY;
            }
            this.billboard.position = pos;
            var p = this.project(pos);

            this.borderCheck(this.billboard, p);

            this.billboard.style.left = p.x + 'px';
            this.billboard.style.top = p.y + 'px';
        };

        this.updateBillboardPosition = function() {

            var p = this.project(this.billboard.position);

            this.borderCheck(this.billboard, p);

            this.billboard.style.left = p.x + 'px';
            this.billboard.style.top = p.y + 'px';
        };

        this.borderCheck = function(container, position) {

            // Check left, top, right, bottom
            var containerBounds = viewer.navigation.getScreenViewport();
            var wi = container.clientWidth;
            var hi = container.clientHeight;
            if (position.x < 5)
                position.x = 0;
            if (position.y < 5)
                position.y = 0;
            if (containerBounds.width - 5 < position.x + wi) {
                position.x = containerBounds.width - wi;
            }
            if (containerBounds.height - 5 < position.y + hi) {
                position.y = containerBounds.height - hi;
            }
        };

        this.createAnnotation = function(intersectPoint, value, deltaX, deltaY, id) {

            // Create Annotation
            var annotation = document.createElement("div");
            annotation.className = "billboard-annotation";
            viewer.container.appendChild(annotation);

            // Initialize the position of annotation
            var pos = new THREE.Vector3(0, 0, 0);
            deltaX = deltaX || (pos.x - intersectPoint.x);
            deltaY = deltaY || (pos.y - intersectPoint.y);
            annotation.deltaX = deltaX;
            annotation.deltaY = deltaY;
            this.setAnnotationPosition(annotation, intersectPoint);
            this.moveHandler(annotation);
            annotation.intersectPoint = intersectPoint;
            annotation.show = true;

            if (id) {
                annotation.id = id;
                this.annotations[id - 1] = annotation;
            }
            else {
                annotation.id = _nextId++;
                this.annotations.push(annotation);
                this.createNumMarker(annotation);
            }

            var text = document.createElement("div");
            text.innerHTML = value;
            annotation.appendChild(text);

            this.drawLeadLine(intersectPoint, annotation);

            // Create Comments Object
            var data = {
                message: value,
                point3d: intersectPoint
            };
            var commentsExtension = viewer.getExtension("Autodesk.Comments");
            // Store the promise in annotation object, it'll be used in unit test.
            var cPromise = annotation.cPromise = commentsExtension.createComment(data);

            function onSingleClick() {
                var clicks = 0;
                var timeout;

                function single() {
                    if (!annotation.dragging) {
                        if (annotation.classList.contains("billboard-annotation-highlight")) {
                            self.editAnnotation(intersectPoint, annotation);
                        }
                        else {
                            self.highlightAnnotation(annotation);
                        }
                    }
                    else {
                        self.highlightAnnotation();
                    }
                }

                return function () {
                    clicks++;
                    if (clicks == 1) {
                        timeout = setTimeout(function () {
                            single();
                            clicks = 0;
                        }, 250);
                    }
                    else {
                        clearTimeout(timeout);
                        clicks = 0;
                    }
                }
            }

            cPromise.then(function(commObj) {

                function onDoubleClick() {
                    // Given that the user has single clicked to highlight an existing billboard,
                    // Then Double click will enter "edit mode"
                    if (annotation.classList.contains("billboard-annotation-highlight")) {
                        self.editAnnotation(intersectPoint, annotation);
                    }
                    else {
                        commentsExtension.restoreComment(commObj, self.filter, false);
                    }
                }

                annotation.commObj = commObj;
                annotation.addEventListener('click', onSingleClick(), false);
                annotation.addEventListener('dblclick', onDoubleClick, false);
                if (av.isTouchDevice())
                    Hammer(annotation).on("doubletap", onDoubleClick);

                viewer.dispatchEvent(
                    {type: av.ANNOTATION_CREATED_EVENT, data: commObj}
                );
            }, function(err) {
                console.log("Create comments failed:" + err);
            });
        };

        this.destroyAnnotation = function(annotation) {
            viewer.impl.removeMultipleOverlays(_lineOverlayName, annotation.line);
            viewer.container.removeChild(annotation);
            this.annotations[annotation.id - 1] = undefined;
        };

        this.editAnnotation = function(intersectPoint, annotation) {
            // Only keep at most one billboard in the scene
            if (_editing)
                return;

            this.destroyAnnotation(annotation);
            this.createBillboard(intersectPoint, annotation);
        };

        this.highlightAnnotation = function(annotation) {
            var elems = document.getElementsByClassName("billboard-annotation-highlight");
            for (var i = 0; i < elems.length; i++) {
                elems[i].classList.remove("billboard-annotation-highlight");
            }
            if (annotation)
                annotation.classList.add("billboard-annotation-highlight");
        };

        // Enter "edit mode" for highlighted annotation.
        this.enterEditAnnotation = function() {
            for (var i = 0; i < this.annotations.length; i++) {
                var annotation = this.annotations[i];
                if (annotation && annotation.classList.contains("billboard-annotation-highlight")) {
                    this.editAnnotation(annotation.intersectPoint, annotation);
                    break;
                }
            }
        };

        this.setAnnotationPosition = function(annotation, position) {
            var pos;
            if (_editing) {
                pos = new THREE.Vector3().copy(this.billboard.position);
            }
            else {
                pos = new THREE.Vector3().copy(position);
                pos.x += annotation.deltaX;
                pos.y += annotation.deltaY;
            }
            annotation.position = pos;
            var p = this.project(pos);
            annotation.style.left = p.x + 'px';
            annotation.style.top = p.y + 'px';
        };

        this.updateAnnotationPosition = function(annotation) {

            var pos = this.project(annotation.position);
            annotation.style.left = pos.x + 'px';
            annotation.style.top = pos.y + 'px';
        };

        this.drawLeadLine = function(intersectPoint, parent) {

            parent.line = [];
            var x = parseInt(parent.style.left, 10);
            var y = parseInt(parent.style.top, 10) + parent.childNodes[0].clientHeight;
            var pos = this.unproject(new THREE.Vector3(x, y, 0));

            // Glow line
            parent.line.push(this.drawLine(intersectPoint, pos, 2));

            if (parent.id) // Annotation
                parent.line.push(this.drawLine(intersectPoint, pos, 1));
            else // Billboard
                parent.line.push(this.drawLine(intersectPoint, pos));
        };

        this.drawLine = function(p1, p2, type) {

            if (!_billboardLineMaterial) {
                _billboardLineMaterial = new THREE.LineBasicMaterial({
                    color: _billboardLineColor,
                    linewidth: 2,
                    depthTest: false,
                    depthWrite: false
                });

                _annotationLineMaterial = new THREE.LineBasicMaterial({
                    color: _annotationLineColor,
                    linewidth: 2,
                    depthTest: false,
                    depthWrite: false
                });

                _glowLineMaterial = new THREE.LineBasicMaterial({
                    color: _glowLineColor,
                    linewidth: 4,
                    depthTest: false,
                    depthWrite: false
                });

                viewer.impl.createOverlayScene(_lineOverlayName);
            }

            var lineGeom = new THREE.Geometry();
            lineGeom.vertices.push(p1);
            lineGeom.vertices.push(p2);

            var material;
            if (type == 1)
                material = _annotationLineMaterial;
            else if (type == 2)
                material = _glowLineMaterial;
            else
                material = _billboardLineMaterial;
            var line = new THREE.Line(lineGeom, material);

            viewer.impl.addOverlay(_lineOverlayName, line);

            return line;
        };

        this.drawLeadPoint = function(intersectPoint, parent) {
            parent.point = [];

            // Glow point
            parent.point.push(this.drawPoint(intersectPoint, 0));
            // Lead point
            parent.point.push(this.drawPoint(intersectPoint, 1));
        };

        this.drawPoint = function(point, type) {

            if (!_leadPointMaterial) {
                _leadPointMaterial = new THREE.MeshBasicMaterial({
                    color: _leadPointColor,
                    opacity: 1.0,
                    transparent: true,
                    depthTest: false,
                    depthWrite: false
                });

                _glowPointMaterial = new THREE.MeshBasicMaterial({
                    color: _glowPointColor,
                    opacity: 1.0,
                    transparent: true,
                    depthTest: false,
                    depthWrite: false
                });

                viewer.impl.createOverlayScene(_pointOverlayName);
            }

            var pointMesh = new THREE.Mesh(new THREE.SphereGeometry(1.0), (type ? _leadPointMaterial : _glowPointMaterial));
            pointMesh.position.set(point.x, point.y, point.z);
            this.setPointScale(pointMesh, (type ? 4 : 5));

            viewer.impl.addOverlay(_pointOverlayName, pointMesh);

            return pointMesh;
        };

        this.setPointScale = function(pointMesh, pixelSize) {
            var scale = this.setScale(pointMesh, pixelSize);
            pointMesh.scale.x = scale;
            pointMesh.scale.y = scale;
            pointMesh.scale.z = scale;
        };

        this.setScale = function (mesh, pixelSize) {
            var navapi = viewer.navigation;
            var camera = navapi.getCamera();

            var view = navapi.getEyeVector();
            var position = navapi.getPosition();

            var point = mesh.position.clone();

            var distance = camera.isPerspective ? point.sub(position).dot(view.normalize())
                : navapi.getEyeVector().length();

            var fov = navapi.getVerticalFov();
            var worldHeight = 2.0 * distance * Math.tan(THREE.Math.degToRad(fov * 0.5));

            var viewport = navapi.getScreenViewport();
            var devicePixelRatio = window.devicePixelRatio || 1;
            var scale = pixelSize * worldHeight / (viewport.height * devicePixelRatio);

            return scale;
        };
        
        this.createNumMarker = function(annotation) {
            var numMarker = document.createElement('div');
            numMarker.className = 'billboard-marker';
            this.numMarkers.push(numMarker);
            numMarker.innerHTML = annotation.id;
            viewer.container.appendChild(numMarker);

            numMarker.position = annotation.intersectPoint;
            this.setNumMarkerPosition(numMarker);

            numMarker.id = annotation.id;

            numMarker.addEventListener("click", function() {
                var antn = self.annotations[this.id - 1];
                if (antn.show)
                    self.hideAnnotation(antn);
                else
                    self.showAnnotation(antn);
            });
        };

        this.destroyNumMarker = function(id) {
            viewer.container.removeChild(this.numMarkers[id - 1]);
            this.numMarkers[id - 1] = undefined;
        };

        this.setNumMarkerPosition = function (numMarker) {
            var pos = this.project(numMarker.position);
            numMarker.style.left = pos.x - numMarker.offsetWidth / 2 + 'px';
            numMarker.style.top = pos.y - numMarker.offsetHeight / 2 + 'px';
        };

        this.updateBillboard = function() {

            if (this.billboard) {
                // Update billboard position
                this.updateBillboardPosition();

                // Redraw the line
                this.updateLine(this.billboard);

                // Redraw the point
                this.updatePoint(this.billboard);
            }

        };

        this.updateAnnotations = function() {

            for (var i = 0; i < this.annotations.length; i++) {
                if (this.annotations[i]) {
                    // Update annotation position
                    this.updateAnnotationPosition(this.annotations[i]);

                    // Redraw the line
                    this.updateLine(this.annotations[i]);
                }
            }

            // Update numMarkers position
            for (var i = 0; i < this.numMarkers.length; i++) {
                if (this.numMarkers[i])
                    this.setNumMarkerPosition(this.numMarkers[i]);
            }

        };

        this.updateLine = function(parent) {

            var line = parent.line;
            viewer.impl.removeMultipleOverlays(_lineOverlayName, line);

            // Hide billboard/annotation line when its "show" attribute is false.
            if (parent.show === true) {
                var intersectPoint = parent.intersectPoint;
                this.drawLeadLine(intersectPoint, parent);
            }
        };

        this.updatePoint = function(parent) {
            var point = parent.point;
            viewer.impl.removeMultipleOverlays(_pointOverlayName, point);

            // Hide the billboard point when its "show" attribute is false.
            if (parent.show === true)
                this.drawLeadPoint(parent.intersectPoint, parent);
        };

        this.showBillboard = function() {
            if (this.billboard) {
                this.billboard.show = true;
                this.billboard.style.display = "block";
                this.updateLine(this.billboard);
                this.updatePoint(this.billboard);
            }
        };

        this.hideBillboard = function() {
            if (this.billboard) {
                this.billboard.show = false;
                this.billboard.style.display = "none";
                this.updateLine(this.billboard);
                this.updatePoint(this.billboard);
            }
        };

        this.showAnnotation = function(annotation) {
            annotation.show = true;
            annotation.style.display = "block";
            this.updateLine(annotation);
        };

        this.showAnnotations = function() {
            for (var i = 0; i < this.annotations.length; i++) {
                if (this.annotations[i])
                    this.showAnnotation(this.annotations[i]);
            }
        };

        this.hideAnnotation = function(annotation) {
            annotation.show = false;
            annotation.style.display = "none";
            this.updateLine(annotation);
        };

        this.hideAnnotations = function() {
            for (var i = 0; i < this.annotations.length; i++) {
                if (this.annotations[i])
                    this.hideAnnotation(this.annotations[i]);
            }
        };

        this.clearAnnotations = function() {
            for (var i = 0; i < this.annotations.length; i++) {
                if (this.annotations[i]) {
                    this.destroyNumMarker(this.annotations[i].id);
                    this.destroyAnnotation(this.annotations[i]);
                }
            }
            _nextId = 1;
        };

        this.generateData = function() {
            var data = [];
            var commentsExtension = viewer.getExtension("Autodesk.Comments");
            for (var i = 0; i < this.annotations.length; i++) {
                if (this.annotations[i]) {
                    var commObj = this.annotations[i].commObj;
                    var offset = [this.annotations[i].deltaX, this.annotations[i].deltaY];
                    commentsExtension.factory.pushTag(commObj, {name: "textOffset", value: offset});
                    data.push(commObj);
                }
            }
            return data;
        };

        this.loadData = function(data) {
            var commentsExtension = viewer.getExtension("Autodesk.Comments");
            for (var i = 0; i < data.length; i++) {
                commentsExtension.factory.removeGlobalOffset(data[i]);
                var point = commentsExtension.factory.getTagValue(data[i], "nodeOffset");
                var intersectPoint = new THREE.Vector3(point[0], point[1], point[2]);
                var offset = commentsExtension.factory.getTagValue(data[i], "textOffset");
                if (offset)
                    this.createAnnotation(intersectPoint, data[i].body, offset[0], offset[1]);
                else
                    this.createAnnotation(intersectPoint, data[i].body);
            }
        };

        this.showNumMarkers = function() {
            for (var i = 0; i < this.numMarkers.length; i++) {
                if (this.numMarkers[i])
                    this.numMarkers[i].style.visibility = "visible";
            }
        };

        // Use visibility instead of display here because the offsetWidth
        // and offsetHeight are used when updating their positions even when
        // they are hidden.
        this.hideNumMarkers = function() {
            for (var i = 0; i < this.numMarkers.length; i++) {
                if (this.numMarkers[i])
                    this.numMarkers[i].style.visibility = "hidden";
            }
        };
        
        this.moveHandler = function(mover) {

            var self = this;
            var x, y;
            var lastX, lastY;
            var startX, startY;
            var deltaX, deltaY;
            
            function handleMove(e) {
                if (e.type === "touchmove") {
                    e.screenX = e.touches[0].screenX;
                    e.screenY = e.touches[0].screenY;
                }

                deltaX += e.screenX - lastX;
                deltaY += e.screenY - lastY;

                x = startX + deltaX;
                y = startY + deltaY;

                // Check left, top, right, bottom
                var containerBounds = viewer.navigation.getScreenViewport();
                var wi = mover.clientWidth;
                var hi = mover.clientHeight;
                if (x < 5)
                    x = 0;
                if (y < 5)
                    y = 0;
                if (containerBounds.width - 5 < x + wi) {
                    x = containerBounds.width - wi;
                }
                if (containerBounds.height - 5 < y + hi) {
                    y = containerBounds.height - hi;
                }

                mover.style.left = x + "px";
                mover.style.top = y + "px";

                // Redraw the line
                self.updateLine(mover);

                lastX = e.screenX;
                lastY = e.screenY;

                mover.dragging = true;
            }
            
            function handleUp(e) {

                // Get the projected Z value of intersectPoint as the one for mover's projected position.
                var intersectPos = self.project(mover.intersectPoint);
                var pos = self.unproject(new THREE.Vector3(x, y, intersectPos.z));
                mover.deltaX = pos.x - mover.intersectPoint.x;
                mover.deltaY = pos.y - mover.intersectPoint.y;
                mover.position.copy(pos);

                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleUp);
                window.removeEventListener('touchmove', handleMove);
                window.removeEventListener('touchend', handleUp);
            }

            function handleDown(e) {
                if (e.target.tagName.toLowerCase() === "textarea")
                    return;

                if (e.type === "touchstart") {
                    e.screenX = e.touches[0].screenX;
                    e.screenY = e.touches[0].screenY;
                }
                lastX = e.screenX;
                lastY = e.screenY;

                deltaX = 0;
                deltaY = 0;

                x = startX = mover.offsetLeft;
                y = startY = mover.offsetTop;

                mover.dragging = false;
                
                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', handleUp);
                window.addEventListener('touchmove', handleMove);
                window.addEventListener('touchend', handleUp);
            }
            
            mover.addEventListener('mousedown', handleDown);
            mover.addEventListener('touchstart', handleDown);
        };

        this.handleButtonDown = function(event, button) {
            _dragging = true;
            return false;
        };

        this.handleButtonUp = function(event, button) {
            _dragging = false;
            return false;
        };

        this.handleMouseMove = function(event) {
            return false;
        };

        this.handleSingleClick = function(event, button) {
            
            var node = viewer.impl.hitTest(event.canvasX, event.canvasY, false);
            if (node) {
                this.createBillboard(node.intersectPoint);
            }
            return true;
        };

        this.handleDoubleClick = function(event, button) {
            return true;
        };

        this.handleSingleTap = function(event) {
            return this.handleSingleClick(event);
        };

        this.handleDoubleTap = function(event) {
            return true;
        };

        this.handleResize = function() {
            self.updateBillboard();
            self.updateAnnotations();
            self.highlightAnnotation();
        };

    };
    
    aveb.BillboardTool = BillboardTool;
})();

(function() {

    "use strict";

    var CORE_EXTENSION = 'Autodesk.Billboard';
    var av = Autodesk.Viewing;
    var avu = av.UI;
    var avebg = AutodeskNamespace('Autodesk.Billboard');

    var BillboardGui = function(viewer, options) {
        av.Extension.call(this, viewer, options);
    };

    /**
     * Static function internally used that provides info on what are the configuration options
     * available to this extension.
     * @private
     */
    BillboardGui.populateDefaultOptions = function(options) {

        // Use dobule-dashes to prevent flag from being active by default while still surfacing them out (cuz why not)
        options.experimental.push('--billboards'); // flag is checked in GuiViewer3D.js //
    };

    BillboardGui.prototype = Object.create(av.Extension.prototype);
    BillboardGui.prototype.constructor = BillboardGui;

    var proto = BillboardGui.prototype;

    proto.load = function() {

        var core = this.viewer.getExtension(CORE_EXTENSION);
        if (!core) {
            this.viewer.loadExtension(CORE_EXTENSION);
            core = this.viewer.getExtension(CORE_EXTENSION);
        }
        if (!core) {
            avp.logger.warn('Missing dependency:', CORE_EXTENSION);
            return false;
        }

        this.core = core;

        if (this.viewer.toolbar) {
            this.createToolbarUI();
        }
        else {
            this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
            this.viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
        }

        return true;
    };

    proto.unload = function() {

        this.destroyToolbarUI();
        this.core = null;
        return true;
    };

    proto.onToolbarCreated = function() {
        this.viewer.removeEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
        this.onToolbarCreatedBinded = null;
        this.createToolbarUI();
    };

    proto.createToolbarUI = function() {
        var self = this;
        var viewer = this.viewer;

        var toolbar = viewer.getToolbar(true);

        this.billboardToolButton = new avu.Button('toolbar-billboardTool');
        this.billboardToolButton.setToolTip('Billboard');
        this.billboardToolButton.setIcon('adsk-icon-billboard');
        this.billboardToolButton.onClick = function(e) {
            if (self.core.activeStatus) {
                self.core.deactivate();
                self.billboardToolButton.setState(avu.Button.State.INACTIVE);
            } else {
                self.core.activate();
                self.billboardToolButton.setState(avu.Button.State.ACTIVE);
            }
        };

        var modelTools = toolbar.getControl(av.TOOLBAR.MODELTOOLSID);
        if (modelTools) {
            modelTools.addControl(this.billboardToolButton, {index: 0});
        }
    };

    proto.destroyToolbarUI = function() {
        if (this.billboardToolButton) {
            var toolbar = this.viewer.getToolbar(false);
            if (toolbar) {
                var modelTools = toolbar.getControl(av.TOOLBAR.MODELTOOLSID);
                if (modelTools) {
                    modelTools.removeControl(this.billboardToolButton);
                }
            }
            this.billboardToolButton = null;
        }
    };

    avebg.BillboardGui = BillboardGui;
    av.theExtensionManager.registerExtension('Autodesk.BillboardGui', BillboardGui);

})();
