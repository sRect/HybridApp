(function() {

    AutodeskNamespace('Autodesk.Viewing.Extensions.Debug');
    var HTML_TEMPLATE = null;
    
    function DebugExtension(viewer, options) {
        Autodesk.Viewing.Extension.call(this, viewer, options);
        this.viewer = viewer;
        this.container = null;
        this.onTemplate = this.onTemplate.bind(this);
        this.name = "debug";
    }
    
    DebugExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
    DebugExtension.prototype.constructor = DebugExtension;

    var proto = DebugExtension.prototype;

    proto.load = function() {
        //downloads css file
        avp.injectCSS('extensions/Debug/Debug.css');

        if (HTML_TEMPLATE) {
            this.onTemplate(null, HTML_TEMPLATE);
        } else {
            avp.getHtmlTemplate('extensions/Debug/res/debug-ui.html', this.onTemplate);
        }

        return true;
    };

    proto.unload = function() {
        //removes the debug ext ui to complete unloading
        this.container.remove();
        this.container = null;
        this.debugButton = null;
        this.debugExit = null;
        this.debugWindow = null;
        this.svfWindow = null;
        return true;
    };

    proto.onTemplate = function(err, content) {
        var self = this;
        var viewer = this.viewer;

        if (err) {
            avp.logger.error('Failed to show Debug ext.');
            return;
        }

        // Keep a reference so that it doesn't have to get downloaded again.
        HTML_TEMPLATE = content;

        var tmp = document.createElement('div');
        tmp.innerHTML = HTML_TEMPLATE;

        this.viewer.container.appendChild(tmp.childNodes[0]);  // Assumes template has only 1 root node.

        this.container = this.viewer.container.querySelector('.debug-ext-UI');

        this.debugWindow = this.container.querySelector('.debug-ext-infoPanel');

        this.svfWindow = this.container.querySelector('.debug-ext-SVF-panel');
        this.svfWindow.style.display = "none";
        this.svfExit = this.svfWindow.querySelector('.debug-ext-SVF-exit');
        
        this.svfManifestBtn = this.debugWindow.querySelector('.debug-ext-SVF-btn');
        this.svfManifestBtn.style.display = "none";

        this.svfContent = this.svfWindow.querySelector(".debug-ext-SVF-content");

        this.mrtDisplay = this.debugWindow.querySelector('.debug-ext-MRT-display');
        this.mrtDisplay.innerHTML = "- MRT Support:  " + supportsMRT();

        this.versionDisplay = this.debugWindow.querySelector('.debug-ext-version-display');
        this.versionDisplay.innerHTML = "- Viewer Version:  " + whichVersion();

        this.debugExit = this.debugWindow.querySelector('.debug-ext-unload-btn');
        this.debugExit.addEventListener("click", function(e) {
            viewer.unloadExtension('Autodesk.Debug');
        });

        this.debugButton = this.container.querySelector('.debug-ext-icon');

        var _that = this;
        this.debugButton.addEventListener('click', function(e) {
            if(!_that.activeStatus) {
                _that.activate();
            } else {
                _that.deactivate();
            }

        if(viewer.model){
            SvfBtn();
        }else{
            viewer.addEventListener(av.MODEL_ROOT_LOADED_EVENT, SvfBtn);
        }
        function SvfBtn(){
            if(viewer.model.is3d()){
                _that.svfManifestBtn.style.display = "block";
                _that.svfManifestBtn.addEventListener("click", showSvfManifest);
            }
        }

        });

        function supportsMRT() {
            
            //returning null because _glExtensionDrawBuffers is null
            var isMRTenabled = viewer.impl.glrenderer().supportsMRT();
            if(isMRTenabled){ return "Yes";}
            
            return "No";
        }

        function whichVersion() {
            var version = LMV_VIEWER_VERSION + '.' + LMV_VIEWER_PATCH;
            if (version.charAt(0) === "@"){version = "None";}
            
            return version;
        }
        
        function showSvfManifest(){ 
            if(_that.svfWindow.style.display === "none"){
                _that.svfWindow.style.display = "block";
            }

            _that.svfExit.addEventListener("click", function(e){
                _that.svfWindow.style.display = "none";
            });

        
            _that.manifestObj = viewer.model.loader.svf.manifest;
            _that.svfContent.innerHTML = JSON.stringify(_that.manifestObj, null, 2);
        }      
        
    };

    proto.activate = function () {
        if(!this.activeStatus) {
            this.debugWindow.classList.add("show");
            this.activeStatus = true;
        }
        return true;
    };

    proto.deactivate = function () {
        if(this.activeStatus) {
            this.debugWindow.classList.remove("show");
            this.activeStatus = false;
        }
        return true;
    };


    Autodesk.Viewing.theExtensionManager.registerExtension('Autodesk.Debug', DebugExtension);

})();