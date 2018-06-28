(function(){ "use strict";

    var namespace = AutodeskNamespace('Autodesk.Viewing.Extensions.Comments');
    var avp = Autodesk.Viewing.Private;

    function CommentFactory(viewer) {

        this.viewer = viewer;
        this.mappingPromise = null; // Lazy initialization upon first usage.
        this.filter = {
            seedURN: true,
            objectSet: true,
            viewport: true,
            tags: true, // Animation extension uses tags.
            renderOptions: false,
            cutplanes: true
        };
    }

    var proto = CommentFactory.prototype;

    /**
     * Invoked when extension is unloaded
     */
    proto.destroy = function() {
        this.viewer = null;
    };

    /**
     * Creates a comment object that can be posted to the comment end point.
     * @param {Object} [dataBag] - Object bag with optional values
     * @return {Object} a comment object
     */
    proto.createCommentObj = function(dataBag) {
        var commentObj = this.viewer.getState(this.filter);
        this.injectInfo(commentObj, dataBag);
        return commentObj;
    };

    /**
     * Populates comment object with data common
     * @param {Object} commentObj
     * @param {Object} [dataBag] - Object bag with optional values
     */
    proto.injectInfo = function(commentObj, dataBag) {
        commentObj["body"] = dataBag.message || "";
        commentObj["status"] = 'open';
        commentObj["jsonVersion"] = "2.0";
        commentObj["inputSource"] = "Web";
        commentObj["type"] = "geometry";

        // These lines include model's sheet info within the document.
        var geometryItem = this.viewer.model.getDocumentNode();
        if (geometryItem) {
            geometryItem = geometryItem.findParentGeom2Dor3D();
            commentObj["layoutName"] = geometryItem.data.guid;
            commentObj["layoutIndex"] = geometryItem.data.order;
        }

        if (dataBag.point3d) {
            var val = dataBag.point3d;
            if (val instanceof THREE.Vector3) { // Check if we have a THREE.Vector3 value
                val = val.toArray();
            }
            this.pushTag(commentObj, {name: "nodeOffset", value: val});
        }
    };

    /**
     * Checks if a comment belongs to the current loaded model.
     * @param {object} commentObj - The comment to check
     * @returns {boolean} True if comment belongs to the current sheet
     */
    proto.isCommentForCurrentSheet = function(commentObj) {
        var currentSheetItem = this.viewer.model.getDocumentNode();
        if (currentSheetItem) {
            currentSheetItem = currentSheetItem.findParentGeom2Dor3D();
            return currentSheetItem.data.guid === commentObj.layoutName;
        }
        return true; // Assume it is for the current sheet
    };

    /**
     * Checks if a comment belongs to the current loaded model.
     * @param {object} commentObj - The comment to check
     * @returns {object|null} manifest node where the comment belongs, or null.
     */
    proto.getManifestNode = function(commentObj) {
        var geometryItem = this.viewer.model.getDocumentNode();
        if (geometryItem) {
            var root = geometryItem.getRootNode();
            return root.findByGuid(commentObj.layoutName);
        }
        return null;
    };

    /**
     * Comments support "tags", which can be seen as a non-structured key-value pair collection.
     * @param {Object} dbComment
     * @param {Object} tagObject
     */
    proto.pushTag = function(dbComment, tagObject) {
        if (!Array.isArray(dbComment["tags"])) {
            dbComment["tags"] = [];
        }
        dbComment["tags"].push(tagObject);
    };

    /**
     * Returns an object containing the key/value pair for a specified tag key. Null if key not found.
     *
     * @param {Object} dbComment - dbComment to inspect
     * @param {String} tagKey - tag we are looking for.
     * @returns {Object|null} - Object containing the key/value pair for the specified tag-key; null if not found.
     */
    proto.getTag = function(dbComment, tagKey) {
        var tags = dbComment["tags"];
        if (tags && Array.isArray(tags)) {
            for (var i = 0, len = tags.length; i < len; ++i) {
                if (tags[i]["name"] === tagKey) {
                    return tags[i];
                }
            }
        }
        return null;
    };

    /**
     * Returns a value for a specified tag key. Null if key not found.
     *
     * @param {Object} dbComment - dbComment to inspect
     * @param {String} tagKey - tag we are looking for.
     * @param {String} [valueNotFound] - Returned back when key is not found. Defaults to null.
     * @returns {String|null} - String value associated to the tag, or valueNotFound if not found.
     */
    proto.getTagValue = function(dbComment, tagKey, valueNotFound) {
        var tag = this.getTag(dbComment, tagKey);
        if (tag) {
            return tag.value;
        }
        return valueNotFound || null;
    };

    /**
     * Applies transformations to make the commentObj compatible with other
     * offline Autodesk applications (such as Fusion 360).
     *
     * WARNING: Never call this function more than once per commentObj.
     *
     * @param {Object} commentObj
     * @return {promise}
     */
    proto.exportCommentObj = function(commentObj) {
        var self = this;
        return new Promise(function(resolve /*,reject*/){ // This method will not reject()
            self.applyGlobalOffset(commentObj);
            self.getMappingPromise().then(function(mapping){
                self.mapObjectSetLmvToExternal(commentObj, mapping, function onMapObjectSetLmvToExternal(value){
                    resolve(value);
                });
            });
        });
    };

    /**
     * Applies transformations to make the commentObj compatible with LMV.
     * May be required when comment was generated from/for offline Autodesk
     * applications (Such as Fusion 360)
     *
     * WARNING: Never call this function more than once per commentObj.
     *
     * @param commentObj
     * @return {Promise}
     */
    proto.importCommentObj = function(commentObj) {
        // We need to clone the comment object, but only the values that matter.
        // Values that matter are keys within this.filter

        // First make a shallow copy
        var copy = {};
        for (var key in this.filter) {
            if (this.filter.hasOwnProperty(key) && commentObj.hasOwnProperty(key)) {
                copy[key] = commentObj[key];
            }
        }

        // Now deep copy those elements that are used by the filter
        var deepCopy = JSON.parse(JSON.stringify(copy));

        var self = this;
        return new Promise(function(resolve){
            self.getMappingPromise().then(function(mapping){

                // Transform "external" objectSet values into "lmv" ones
                self.mapObjectSetExternalToLmv(deepCopy, mapping);

                // Finally, transform the data before returning it back for restoration.
                self.removeGlobalOffset(deepCopy);
                resolve(deepCopy);
            });
        });
    };

    /////////////////////////////
    //// AUXILIARY FUNCTIONS ////
    /////////////////////////////

    /**
     * To make the Viewer's state associated in the comment compatible with
     * external apps, make sure that LMV's global offset gets removed using
     * this method.
     *
     * WARNING: Call this method only once per created commentObj
     *
     * @param {Object} commentObj - output of createComment() function
     * @returns {boolean} - Transformation applied or not
     */
    proto.applyGlobalOffset = function(commentObj) {
        var globalOffset = this.viewer.model.getData().globalOffset;
        if (globalOffset) { // globalOffset is null for 2d models.

            // viewport
            this.applyOffsetToCamera(commentObj.viewport, globalOffset);

            // nodeOffset
            var keyValuePair = this.getTag(commentObj, "nodeOffset");
            if (keyValuePair) {
                this.applyOffset(keyValuePair["value"], globalOffset);
            }

            // DONE
            return true;
        }
        return false;
    };

    /**
     * When loading an comment object created for/from an external application,
     * this method will apply LMV's globalOffset transformation.

     * WARNING: Call this method only once per commentObj
     *
     * @param {Object} commentObj - output of createComment() function
     * @returns {boolean} - Transformation applied or not
     */
    proto.removeGlobalOffset = function(commentObj) {
        var globalOffset =  this.viewer.model.getData().globalOffset;
        if (globalOffset) {
            var invGlobalOffset = { x: -globalOffset.x, y: -globalOffset.y, z: -globalOffset.z };

            // viewport
            this.applyOffsetToCamera(commentObj.viewport, invGlobalOffset);

            // nodeOffset
            var keyValuePair = this.getTag(commentObj, "nodeOffset");
            if (keyValuePair) {
                this.applyOffset(keyValuePair["value"], invGlobalOffset);
            }

            return true;
        }
        return false;
    };

    /**
     *
     * @param {Object} viewport - viewport aspect of the ViewerState object
     * @param {Object} offset - {x:Number, y:Number, z:Number}
     * @private
     */
    proto.applyOffsetToCamera = function(viewport, offset) {

        if (!viewport || !offset) {
            return;
        }

        this.applyOffset(viewport['eye'], offset);
        this.applyOffset(viewport['target'], offset);
        this.applyOffset(viewport['pivotPoint'], offset);
    };

    /**
     * Applies an offset to a 3d point represented as an Array.<br>
     * Notice that THREE.Vector3 has method toArray().
     *
     * @param {Array} array - Array with 3 Number elements
     * @param {Object} offset - {x:Number, y:Number, z:Number}
     */
    proto.applyOffset = function(array, offset) {
        if (array) {

            // Make sure we are dealing with Numbers coming out of array[x]
            var value0 = Number(array[0]) + offset.x;
            var value1 = Number(array[1]) + offset.y;
            var value2 = Number(array[2]) + offset.z;

            array[0] = (typeof array[0] === "string") ? value0.toString() : value0;
            array[1] = (typeof array[1] === "string") ? value1.toString() : value1;
            array[2] = (typeof array[2] === "string") ? value2.toString() : value2;
        }
    };

    /**
     * Create
     * @param {Object} commentObj
     * @param {Object} mapping
     * @param {Function} resolve
     */
    proto.mapObjectSetLmvToExternal = function(commentObj, mapping, resolve) {
        if (!mapping) {
            resolve(commentObj);
        }

        // Avoid translating ids for 2d sheets (for now)
        if (this.viewer.model.is2d()) {
            resolve(commentObj);
        }

        var objectSetValues = this.getObjectSetElementWithIdType(commentObj.objectSet, 'lmv');
        var dbIds = [].concat(objectSetValues.id)
                      .concat(objectSetValues.hidden)
                      .concat(objectSetValues.isolated);
        uniq_fast(dbIds);

        this.viewer.model.getBulkProperties(dbIds, ['externalId'],
            function onSuccess(results){

                var dbToExternal = {}; // Put results in an associative array:
                results.forEach(function(elem){
                    dbToExternal[elem.dbId] = elem.externalId;
                });

                // Make a copy of the original object:
                var externalObjectSetValues = JSON.parse(JSON.stringify(objectSetValues));
                externalObjectSetValues['idType'] = 'external'; // Signals that we are using externalIds

                // Map them all!
                var mapIdToExternalId = function(dbId) {
                    return dbToExternal[dbId];
                };
                externalObjectSetValues.id = externalObjectSetValues.id.map(mapIdToExternalId);
                externalObjectSetValues.hidden = externalObjectSetValues.hidden.map(mapIdToExternalId);
                externalObjectSetValues.isolated = externalObjectSetValues.isolated.map(mapIdToExternalId);

                // Push copy to objectSet and resolve
                commentObj.objectSet.push(externalObjectSetValues);
                resolve(commentObj);
            },
            function onFailure(){
                // Something failed, ignore and continue
                resolve(commentObj);
            }
        );
    };

    // From Stack overflow
    // Removes duplicate entries.
    function uniq_fast(a) {
        var seen = {};
        var out = [];
        var len = a.length;
        var j = 0;
        for(var i = 0; i < len; i++) {
            var item = a[i];
            if(seen[item] !== 1) {
                seen[item] = 1;
                out[j++] = item;
            }
        }
        return out;
    }

    proto.mapObjectSetExternalToLmv = function(commentObj, idMapping) {
        if (!idMapping) {
            return;
        }

        var objectSetList = commentObj.objectSet;
        var objectSet = this.getObjectSetElementWithIdType(objectSetList, 'lmv');

        // Nothing to do, we already have lmv data values
        if (objectSet) {
            return;
        }

        // Else, no lmv objectSet element. Probably a comment coming from Fusion (or similar).
        // Create objectSet entry in index 0 with lmv values.
        var externalObjectSet = this.getObjectSetElementWithIdType(objectSetList, 'external');
        if (!externalObjectSet) {
            return;
        }

        var mapExternalToDbId = function(externalId) {
            return idMapping[externalId];
        };
        var lmvObjectSet = JSON.parse(JSON.stringify(externalObjectSet));

        // Map external ids back to lmv dbIds
        lmvObjectSet.id = lmvObjectSet.id.map(mapExternalToDbId);
        lmvObjectSet.isolated = lmvObjectSet.isolated.map(mapExternalToDbId);
        lmvObjectSet.hidden = lmvObjectSet.hidden.map(mapExternalToDbId);
        lmvObjectSet.idType = 'lmv';

        // Make sure we pushed it as the first element
        objectSetList.unshift(lmvObjectSet);
    };

    proto.getObjectSetElementWithIdType = function(objectSet, idType) {
        if (!objectSet || !Array.isArray(objectSet)) {
            return null;
        }
        for (var i= 0, len=objectSet.length; i<len; ++i) {
            if (objectSet[i].idType === idType) {
                return objectSet[i];
            }
        }
        return null;
    };

    /**
     * Lazy initialization of mapping and it's Promise.
     *
     * @returns {Promise}
     */
    proto.getMappingPromise = function() {
        if (!this.mappingPromise) {
            var self = this;
            this.mappingPromise = new Promise(
                function fetchMapping(resolve/*, reject*/) {
                    self.viewer.model.getExternalIdMapping(
                        function onSuccess(result){
                            avp.logger.log("[Autodesk.Comment]Successfully fetched external id mapping.");
                            resolve(result);
                        },
                        function onFailure() {
                            avp.logger.error("[Autodesk.Comment]Failed to fetch the external id mapping.");
                            resolve(null);
                        }
                    );
                }
            );
        }
        return this.mappingPromise;
    };

    namespace.CommentFactory = CommentFactory;
})();

(function(){ "use strict";

    var namespace = AutodeskNamespace('Autodesk.Viewing.Extensions.Comments');
    var avp = Autodesk.Viewing.Private;

    /**
     * Helper class for CommentsExtension which deals with all async ops with endpoints
     * @constructor
     */
    function CommentService(viewer, options, cacheObj) {
        this.viewer = viewer;
        this.cache = cacheObj;
        this.PATH_STORAGE = null;
        this.fakeRequest = null;
        this.init(options);
    }

    var proto = CommentService.prototype;

    namespace.ENV_TABLE = {
        Local : {
            COMMENT       : 'https://developer-dev.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer-dev.api.autodesk.com/oss/v1/'
        },
        Development : {
            COMMENT       : 'https://developer-dev.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer-dev.api.autodesk.com/oss/v1/'
        },
        Staging : {
            COMMENT       : 'https://developer-stg.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer-stg.api.autodesk.com/oss/v1/'
        },
        Production : {
            COMMENT       : 'https://developer.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer.api.autodesk.com/oss/v1/'
        },
        AutodeskDevelopment : {
            COMMENT       : 'https://developer-dev.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer-dev.api.autodesk.com/oss/v1/'
        },
        AutodeskStaging : {
            COMMENT       : 'https://developer-stg.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer-stg.api.autodesk.com/oss/v1/'
        },
        AutodeskProduction : {
            COMMENT       : 'https://developer.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer.api.autodesk.com/oss/v1/'
        }
    };

    proto.init = function(options) {

        options = options || {};

        // Environment //
        this.env = Autodesk.Viewing.Private.env;
        if (options.fakeServer) {
            this.fakeRequest = new namespace.FakeRequest(options);
        }

        // Token //
        this.token = options.token3leg;

        // End Points //
        var config = namespace.ENV_TABLE[this.env];
        this.COMMENT_SERVICE_URL = config['COMMENT'];
        this.OBJECT_STORAGE_SERVICE_URL = config['OBJECT_STORAGE'];

        // Urn
        var pathStorage = options.urn;
        if (pathStorage) {
            this.setPathStorage(pathStorage);
        } else {
            var viewer = this.viewer;
            var that = this;
            var onModelAvailable = function(){
                var docNode = viewer.model.getDocumentNode();
                if (docNode) {
                    var pathStorage = docNode.urn(true);
                    that.setPathStorage(pathStorage);
                }
            };
            if (viewer.model) {
                onModelAvailable();
            } else {
                // Wait for model to finish loading
                viewer.addEventListener(av.GEOMETRY_LOADED_EVENT, function onGeomLoaded(){
                    viewer.removeEventListener(av.GEOMETRY_LOADED_EVENT, onGeomLoaded);
                    onModelAvailable();
                });
            }
        }
    };

    /**
     * Invoked when extension is unloaded
     */
    proto.destroy = function() {
        this.viewer = null;
        this.fakeRequest = null;
    };

    /**
     * Sets the REST endpoint's id which groups comments
     * @param {String} path - This of it as the folder name that contains comments
     */
    proto.setPathStorage = function(path) {
        if (path) {
            // path needs to be base64 string, padded with '=' symbols
            // so that the length is multiple of 4
            var modLen = path.length % 4;
            if (modLen > 0) {
                path = path + '='.repeat(4-modLen);
            }
            this.PATH_STORAGE = path;
        }
    };

    /**
     * Gets all comments from comments endpoint
     *
     * @returns {promise}
     */
    proto.listComments = function () {
        var self = this;
        return new Promise(function(resolve, reject){
            var url = [self.COMMENT_SERVICE_URL, 'resources/', self.PATH_STORAGE].join("");
            var callbacks = getAjaxCallback(function(result){
                var comments = JSON.parse(result);
                self.cache.comments = comments;
                resolve(comments);
            }, reject);
            var xhr = createRequest(self, 'GET', url, 'text/plain', callbacks);
            xhr.send();
        });
    };

    /**
     * Posts a new comment to the comments endpoint
     *
     * @param {Object} commentObj - Comment object to post
     * @returns {promise}
     */
    proto.postComment = function (commentObj) {
        var self = this;
        return new Promise(function(resolve, reject){
            var url = [self.COMMENT_SERVICE_URL, 'resources/', self.PATH_STORAGE].join("");
            var callbacks = getAjaxCallback(resolve, reject);
            var xhr = createRequest(self, 'POST', url, 'text/plain', callbacks);
            xhr.send(JSON.stringify(commentObj));
        });
    };

    /**
     * Posts a reply to an existing comment in the comment endpoint
     *
     * @param {Object} commentObj - Reply Comment object to post (same structure as a new comment)
     * @param {String} parentCommentId - Comment id which is being replied
     * @returns {promise}
     */
    proto.postCommentReply = function(commentObj, parentCommentId) {
        var self = this;
        return new Promise(function(resolve, reject){
            var base64 = window.encodeURIComponent(base64encode(parentCommentId));
            var url = [self.COMMENT_SERVICE_URL, 'resources/', base64].join("");
            var callbacks = getAjaxCallback(resolve, reject);
            var xhr = createRequest(self, 'POST', url, 'text/plain', callbacks);
            xhr.send(JSON.stringify(commentObj));
        });
    };

    /**
     * Deletes a comment from the comment endpoint.
     * Can be used to delete replies as well.
     *
     * @param {String} commentId - Id of the comment to delete
     * @returns {Promise}
     */
    proto.deleteComment = function (commentId) {
        var self = this;
        return new Promise(function(resolve, reject){
            var encodedId = base64encode(commentId);
            var base64 = window.encodeURIComponent(encodedId);
            var url = [self.COMMENT_SERVICE_URL, 'resources/', base64].join("");
            var callbacks = getAjaxCallback(resolve, reject);
            var xhr = createRequest(self, 'DELETE', url, 'text/plain', callbacks);
            xhr.send();
        });
    };

    proto.fetchLocationForNewOssAttachment = function(additionalHeaders, callbacks) {
        var url = [this.COMMENT_SERVICE_URL, 'resources/', this.PATH_STORAGE, '/attachment'].join("");
        var xhr = createRequest(this, 'POST', url, 'application/json', callbacks, "fetchLocationForNewOssAttachment");
        injectHeaders(xhr, additionalHeaders);
        xhr.send();
    };

    proto.getAttachment = function(urn, isBinaryData, additionalHeaders) {
        var self = this;
        return new Promise(function(resolve, reject){
            var dataParts = self.extractOssBucketAndId(urn);
            var url = [self.OBJECT_STORAGE_SERVICE_URL, 'buckets/', dataParts[0], '/objects/', dataParts[1]].join("");
            var callbacks = getAjaxCallback(resolve, reject, isBinaryData);
            var xhr = createRequest(self, 'GET', url, null, callbacks);
            injectHeaders(xhr, additionalHeaders);
            if (isBinaryData) {
                xhr.responseType = 'arraybuffer';
            }
            xhr.send();
        });
    };

    proto.postAttachment = function(objectKey, fileData, bucketId, additionalHeaders, callbacks) {
        var url = [this.OBJECT_STORAGE_SERVICE_URL, 'buckets/', bucketId, '/objects/', objectKey].join("");
        var xhr = createRequest(this, 'PUT', url, 'text/plain', callbacks);
        injectHeaders(xhr, additionalHeaders);
        xhr.send(fileData);
    };

    proto.deleteAttachment = function(objectKey, bucketId, callbacks) {
        var url = [this.OBJECT_STORAGE_SERVICE_URL, 'buckets/', bucketId, '/objects/', objectKey].join("");
        var xhr = createRequest(this, 'DELETE', url, 'text/plain', callbacks);
        xhr.send();
    };

    /**
     * Extracts the bucket id and the attachment id from an OSS URN.
     * @param {String} ossUrn
     * @returns {Array} With values: [ <bucket_id>, <attachment_id> ]
     */
    proto.extractOssBucketAndId = function(ossUrn) {
        var dataParts = ossUrn.split('/'); // Returns 2 array with 2 elements [ <stuff + bucket_id>, <attachment_id> ]
        var bucketId = dataParts[0];            // Something like 'urn:adsk.objects:os.object:comments'
        var tmpArray = bucketId.split(':');     // We need to get 'comments' at the end.
        dataParts[0] = tmpArray[tmpArray.length-1];
        return dataParts;
    };

    proto.getToken = function() {
        return this.token || Autodesk.Viewing.Private.token.accessToken;
    };

    ///////////////////////
    // Private functions //
    ///////////////////////

    /**
     * Creates a request object to communicate with the comments endpoint.
     * May create a fake request for debug purposes if specified in options.
     * Returned value is ready to initiate async operation through it's send() method
     * (it hasn't been called yet)
     *
     * @param {CommentService} instance
     * @param {String} operation - POST, GET, DELETE
     * @param {String} url - REST endpoint
     * @param {String} contentType - Content type header
     * @param {Object} callbacks - {onLoad:Function, onError:Function, onTimeout:Function}
     * @param {String} [callerFunction] - Name of the operation being performed
     * @returns {XMLHttpRequest}
     */
    function createRequest(instance, operation, url, contentType, callbacks, callerFunction) {

        if (instance.fakeRequest) {
            return instance.fakeRequest.createRequest(operation, url, callbacks, callerFunction);
        }

        var token = instance.getToken();

        var xhr = new XMLHttpRequest();
        xhr.open(operation, url, true);
        if(contentType) {
            xhr.setRequestHeader("Content-Type", contentType);
        }
        xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
        xhr.setRequestHeader("Authorization", "Bearer " + token);
        xhr.onload = callbacks.onLoad;
        xhr.onerror = callbacks.onError;
        xhr.ontimeout = callbacks.onTimeout;
        return xhr;
    }

    /**
     * Returns an object compatible with our AJAX callbacks mechanism.
     * Internal usage only.
     *
     * @param {Function} resolve
     * @param {Function} reject
     * @param {Boolean} [isBinaryData] Whether the response is to be binary or not (defaults to not-binary)
     * @returns {{onLoad: Function, onError: Function, onTimeout: Function}}
     */
    function getAjaxCallback(resolve, reject, isBinaryData) {
        return {
            onLoad: function(event) {
                if (event.currentTarget.status == 200) {
                    resolve(isBinaryData ? event.currentTarget.response
                                         : event.currentTarget.responseText);
                } else {
                    reject(event.currentTarget);
                }
            },
            onError: function(event) {
                reject(event.currentTarget);
            },
            onTimeout: function(event) {
                reject(event.currentTarget);
            }
        }
    }

    /**
     * Injects additional RequestHeaders before dispatching the async op to the comment endpoint.
     *
     * @param {XMLHttpRequest} xhr
     * @param {Array} additionalHeaders - Additional headers with items {name:String, value:String}
     */
    function injectHeaders(xhr, additionalHeaders) {
        additionalHeaders && additionalHeaders.forEach(function(headerInfo) {
            xhr.setRequestHeader(headerInfo['name'], headerInfo['value']);
        });
    }

    /**
     * Base64 encode function (btoa) with IE9 support
     * @param {String} str - May contain characters with values beyond ascii
     * @returns {String} ascii-only encoded string
     */
    function base64encode(str) {
        if (window.btoa) {
            return window.btoa(str);
        }
        // IE9 support
        return window.Base64.encode(str);
    }

    // Export //
    namespace.CommentService = CommentService;
})();

(function(){ "use strict";

    var EXTENSION_NAME = 'Autodesk.Viewing.Comments';
    var namespace = AutodeskNamespace('Autodesk.Viewing.Extensions.Comments');

    /**
     * Extension that encapsulates commenting functionality.
     *
     * Makes AJAX calls to a commenting endpoint for POST/GET/DELETE comment operations.
     *
     * Default [Comment Service](https://developer.autodesk.com/api/comments/internal/).
     *
     * Notice that most of the exposed functions return a
     * [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) object.
     * This component doesn't force usage of any particular Promise library;
     * developers are free to polyfill it as desired.
     *
     * Comments extension was tested with [es6-promise](https://github.com/jakearchibald/es6-promise)
     * which is included as a build artifact (/es6-promise.js and /es6-promise.min.js).
     *
     * @example
     *      // Load extension
     *      // NOTE: You'll need to apply proper values below.
     *      var loadOptions = {
     *          token3leg: "DKCmo1QIKYGpCywZCjib0wRt9YZi",
     *          urn: "dXJuOmFkc2suY29sdW1idXMuc3RhZ2luZzpmcy5maWxlOmQzNjhjMTdlLWVlMzYtMTFlNC04ZTM5LWRhMTVmYzJhMDc5YT92ZXJzaW9uPTE="
     *      };
     *      viewer.loadExtension("Autodesk.Viewing.Extensions.Comments", loadOptions);
     *
     *      // Get extension
     *      var extension = viewer.getExtension("Autodesk.Viewing.Extensions.Comments");
     *
     *      // Get comments from server, restore 1 comment
     *      var promiseGet = extension.getComments();
     *      promiseGet.then(function(arrayOfComments){
     *          var commentCount = arrayOfComments.length;
     *          console.log("Existing comments are: " + commentCount);
     *
     *          if (commentCount) {
     *              // Grab the first one and restore it
     *              var firstComment = arrayOfComments[0];
     *              extension.restoreComment(firstComment);
     *          }
     *      });
     *
     *      // Create comment object
     *      var postData = { message: "This is my optional text" };
     *      var promiseCreate = extension.createComment(postData);
     *      promiseCreate.then(function(lmvComment){
     *          return extension.postComment(lmvComment); // Returns another Promise
     *      }).then(function(postedComment){
     *          console.log("Posted comment is: " + postedComment);
     *      });
     *
     * @constructor
     * @memberof Autodesk.Viewing.Extensions.Comments
     * @alias Autodesk.Viewing.Extensions.Comments.CommentsExtension
     * @extends Autodesk.Viewing.Extension
     * @param {Autodesk.Viewing.Viewer3D} viewer - Viewer instance.
     * @param {object} options - Dictionary with options.
     * @param {string} [options.url] - Identifier that groups comments together. Default to manifest urn passed to ViewingApplication.
     * @param {string} [options.token3leg] - 3-legged Oauth 2 token used to access comment endpoints. Defaults to token used to access Manifest.
     * @param {boolean} [options.fakeServer] - Debug only. Forces the usage of a local proxy for all async operations with endpoints.
     * @param {number} [options.fakeSeverDelay] - Debug only. Forced delay for fakeServer proxy. Useful to test high/low latency ops.
     * @category Extensions
     * @private
     */
    function CommentsExtension(viewer, options) {
        Autodesk.Viewing.Extension.call(this, viewer, options|| {});

        this.name = 'comments';

        var _factory, _commentService;

        /**
         *
         * @returns {boolean}
         */
        this.load = function () {

            var cacheObj = this.getCache();

            _factory = new namespace.CommentFactory(this.viewer);
            _commentService = new namespace.CommentService(this.viewer, this.options, cacheObj);

            if (cacheObj.restoreComment) {
                var commentToRestore = cacheObj.restoreComment;
                delete cacheObj.restoreComment;

                var that = this;
                var onModelAvailableFn = function() {
                    var onObjectTreeFn = function(){
                        if (that.isCommentForCurrentSheet(commentToRestore)) {
                            that.restoreComment(commentToRestore);
                        }
                    };
                    that.viewer.getObjectTree(onObjectTreeFn, onObjectTreeFn);
                };

                if (this.viewer.model){
                    onModelAvailableFn();
                } else {
                    this.viewer.addEventListener(av.GEOMETRY_LOADED_EVENT, function auxGeomLoadedFn(){
                        that.viewer.removeEventListener(av.GEOMETRY_LOADED_EVENT, auxGeomLoadedFn);
                        onModelAvailableFn();
                    });
                }
            }

            return true;
        };


        /**
         * TODO
         * @returns {boolean}
         */
        this.unload = function() {
            if (_commentService) {
                _commentService.destroy();
                _commentService = null;
            }
            if (_factory) {
                _factory.destroy();
                _factory = null;
            }
            return true;
        };
        
        this.activate = function () {
           return true;
        };
        
        this.deactivate = function () {
            return false;
        };


        /**
         * Creates a comment object that can be posted to the Comment Service endpoint.
         * @example
         * commentExtension.postComment(commentExtension.createComment());
         *
         * @see {@link Autodesk.Viewing.Extensions.Comments.CommentsExtension#postComment}
         * @see {@link Autodesk.Viewing.Extensions.Comments.CommentsExtension#restoreComment}
         * @param {object|string} data - Object bag with additional comment values. Or only a String value for the message.
         * @param {array} data.message - Text attached to the comment. Example: "Hi there, this is a comment!".
         * @param {array} data.point3d - Specific 3d point in the geometry (in lmv coordinates). Example [20.5, -5.2, 7.15].
         * @returns {promise}
         */
        this.createComment = function(data) {
            var aux = data || {};
            // First argument can be just the "message" string
            if (typeof data === "string") {
                aux = { message: data };
            }
            var commentObj = _factory.createCommentObj(aux);
            return _factory.exportCommentObj(commentObj);
        };


        /**
         * Checks if a comment belongs to the current loaded model.
         * @param {object} commentObj - The comment to check
         * @returns {boolean} True if comment belongs to the current sheet
         */
        this.isCommentForCurrentSheet = function(commentObj) {
            return _factory.isCommentForCurrentSheet(commentObj);
        };

        /**
         * Wrapper for {@link Autodesk.Viewing.Viewer3D#restoreState}.
         * Works with objects created from {@link Autodesk.Viewing.Viewer3D#createComment}.
         *
         * @param {object} commentObj - The comment object, which is a super set of a valid Viewer State object.
         * @param {object} [filter] - Similar in structure to viewerState used to filter out values.
         * that should not be restored. Passing no filter will restore all values.
         * @param {boolean} [immediate] - Whether the state should be applied with (false)
         * or without (true) a smooth transition. Defaults to false, meaning it uses a transition.
         */
        this.restoreComment = function(commentObj, filter, immediate) {
            if (!this.isCommentForCurrentSheet(commentObj)) {
                var item = _factory.getManifestNode(commentObj);
                if (item) {
                    var cacheObj = this.getCache();
                    cacheObj.restoreComment = commentObj;
                    this.viewer.dispatchEvent({
                        type: Autodesk.Viewing.LOAD_GEOMETRY_EVENT,
                        data: { item: item.data }
                    });
                    return;
                }
            }

            // This sheet //
            var self = this;
            var prom = _factory.importCommentObj(commentObj);
            prom.then(function(transformed){
                self.viewer.restoreState(transformed, filter, immediate);
            });
        };

        /**
         * Sets the REST endpoint's id which groups comments.
         * There is a default value loaded from viewer's manifest,
         * so don't change it unless you have a good reason to do so.
         * @param {String} path - This of it as the folder name that contains comments
         */
        this.setPathStorage = function(path) {
            if (!path) {
                throw new Error(EXTENSION_NAME + ": Invalid path storage");
            }
            _commentService.setPathStorage(path);
        };

        /**
         * Returns comments already fetched from the Comments Service.
         * @see {@link Autodesk.Viewing.Extensions.Comments.CommentsExtension#getComments}
         * @returns {array}
         */
        this.comments = function() {
            var cache = this.getCache();
            return cache.comments || [];
        };

        /**
         * Fetches all comments from the Comments Service.
         * Customize comment storage with options.url and access with options.token3leg.
         * @see {@link Autodesk.Viewing.Extensions.Comments.CommentsExtension#restoreComment}
         * @returns {promise}
         */
        this.getComments = function() {
            return _commentService.listComments();
        };

        /**
         * Post a comment to the Comment Service backend.
         * @see {@link Autodesk.Viewing.Extensions.Comments.CommentsExtension#createComment}
         * @param {object} comment - Object to post (gets stringified)
         * @returns {promise}
         */
        this.postComment = function(comment) {
            return _commentService.postComment(comment)
        };

        /**
         * Posts a comments reply. A reply has the same structure as the one required when posting comments.
         * @param {object} commentReply - Object to post as a reply (gets stringified).
         * @param {string} parentCommentId - ID of the comment replying to.
         * @returns {promise}
         */
        this.postCommentReply = function(commentReply, parentCommentId) {
            return _commentService.postCommentReply(commentReply, parentCommentId);
        };

        /**
         * Deletes a comment or reply from the Comment Service backend.
         * @param {string} commentId - ID of the comment to remove.
         * @returns {promise}
         */
        this.deleteComment = function(commentId) {
            return _commentService.deleteComment(commentId);
        };

        /**
         * Used to get an OSS location where to post a new attachment.
         *
         * NOTE: The method does not support Promise return value yet.
         * @param {array} additionalHeaders - Additional request headers.
         * @param {object} callbacks - `{onLoad:Function, onError:Function, onTimeout:Function}`.
         * @private
         */
        function fetchLocationForNewOssAttachment(additionalHeaders, callbacks) {
            // TODO: Promisify method //
            return _commentService.fetchLocationForNewOssAttachment(additionalHeaders, callbacks);
        }

        /**
         * Helps extracting information after calling
         * {@link Autodesk.Viewing.Extensions.Comments.CommentsExtension#fetchLocationForNewOssAttachment}.
         * @param {string} ossUrn - Value returned from fetchLocationForNewOssAttachment().
         * @returns {array} 2 string elements: `[bucket_id, attachment_id]`.
         * @private
         */
        function extractOssBucketAndId(ossUrn) {
            return _commentService.extractOssBucketAndId(ossUrn);
        }

        /**
         * Posts an attachment to the attachments endpoint (OSS v1 by default).
         *
         * Relies on the return value of
         * {@link Autodesk.Viewing.Extensions.Comments.CommentsExtension#fetchLocationForNewOssAttachment}.
         *
         * Use {@link Autodesk.Viewing.Extensions.Comments.CommentsExtension#extractOssBucketAndId}
         * to extract data out of it.
         *
         * NOTE: Method does not support Promise return value yet.
         *
         * @param {string} objectKey - Attachment's ID.
         * @param {string|*} fileData - Attachment data to post.
         * @param {string} bucketId - ID of the OSS bucket where to post the attachment.
         * @param {array} additionalHeaders - Additional request headers.
         * @param {object} callbacks - `{onLoad:Function, onError:Function, onTimeout:Function}`.
         * @private
         */
        function postAttachment(objectKey, fileData, bucketId, additionalHeaders, callbacks) {
            // TODO: Promisify method //
            return _commentService.postAttachment(objectKey, fileData, bucketId, additionalHeaders, callbacks);
        }


        /**
         * Initiates an async op to request an attachment from the attachments endpoint (OSS by default).
         * @param {string} urn
         * @param {boolean} isBinary - Whether we are fetching binary data or not.
         * @param {array} additionalHeaders - Additional request headers.
         * @returns {promise}
         * @private
         */
        function getAttachment(urn, isBinary, additionalHeaders) {
            return _commentService.getAttachment(urn, isBinary, additionalHeaders);
        }

    } // Constructor

    CommentsExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
    CommentsExtension.prototype.constructor = CommentsExtension;
    Autodesk.Viewing.theExtensionManager.registerExtension(EXTENSION_NAME, CommentsExtension);
    namespace.CommentsExtension = CommentsExtension;
})();

(function(){ "use strict";

    var namespace = AutodeskNamespace('Autodesk.Viewing.Extensions.Comments');

    /**
     * Helper class that serves as a debug-proxy for async operations.
     * Useful when in development mode and having trouble accessing endpoints.
     *
     * @param {Object} options
     * @param {Number} [options.fakeSeverDelay] - Forced delay on async callbacks (in milliseconds)
     * @param {String} [options.displayName] - User name posting a comment
     * @param {String} [options.oxygenId] - User's oxygenId when posting a comment
     * @constructor
     */
    function FakeRequest(options) {

        this.options = options || {};
        this.FAKE_SERVER_DELAY = this.options.fakeSeverDelay || 200;
        this.FAKE_NEXT_ID = 11;
    }

    var proto = FakeRequest.prototype;

    proto.createRequest = function(operation, url, callbacks, callerFunction) {

        var self = this;
        var fakeRequest = {
            notifyCallback: function(fakeServerResponse) {
                if (self.FAKE_SERVER_DELAY) {
                    // Fake server response delay
                    setTimeout(function(){
                            callbacks.onLoad( fakeServerResponse );
                        },
                        self.FAKE_SERVER_DELAY);
                }
                else {
                    // invoke callback right away
                    callbacks.onLoad( fakeServerResponse );
                }
            },
            replyPostComment: function(args) {
                var dbComment = JSON.parse(args);
                dbComment.id =  self.FAKE_NEXT_ID++;
                dbComment.index = dbComment.id;
                dbComment.layoutName = dbComment.layoutName || "Another Sheet";
                if (!dbComment.actor) {
                    dbComment.actor = {
                        name: self.options.displayName || "John Doe",
                        id: self.options.oxygenId || 'ABCDEFGHIJK'
                    };
                }
                dbComment.published = new Date().toUTCString();
                this.notifyCallback( { currentTarget: {status: 200, responseText: JSON.stringify(dbComment)} } );
            },
            replyFetchLocationForNewOssAttachment: function() {
                var responseObject = {
                    attachment:[{url:"urn:adsk.objects:os.object:comments/filename"}]
                };
                this.notifyCallback( { currentTarget: {status: 200, responseText: JSON.stringify(responseObject)} } );
            },

            send: function(args) {

                switch(operation) {
                    case 'GET': //listComments
                        this.notifyCallback( { currentTarget: {status: 200, responseText: "[]"} } );
                        break;
                    case 'POST': //postComment or postCommentReply

                        switch(callerFunction) {
                            case "fetchLocationForNewOssAttachment":
                                this.replyFetchLocationForNewOssAttachment();
                                break;
                            default:
                                this.replyPostComment(args);
                                break;
                        }
                        break;

                    case 'DELETE': //deleteComment or deleteCommentReply
                        this.notifyCallback( { currentTarget: {status: 200, responseText: "{}"} } );
                        break;
                    case 'PUT':
                        try {
                            JSON.parse(args);
                            this.notifyCallback( { currentTarget: {status: 200, responseText: args} } );
                        }
                        catch(error) {
                            // send attachmentData
                            var attachmentResponse = {
                                objects:[{id: "test", key: "test", 'content-type': "image/png", location: "http://www.autodesk.com"}]
                            };

                            this.notifyCallback( { currentTarget: {status: 200, responseText: JSON.stringify(attachmentResponse)} } );
                        }
                        break;
                }
            },
            setRequestHeader: function (){}
        };
        return fakeRequest;
    };

    namespace.FakeRequest = FakeRequest;
})();