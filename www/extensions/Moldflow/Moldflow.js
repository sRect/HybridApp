(function () {
/*
* load/unload moldflow visualization extension to/from the viewer.
*/
    'use strict';

    var _avem = AutodeskNamespace('Autodesk.Viewing.Extensions.Moldflow');
    var _av = Autodesk.Viewing;
    var _ave = _av.Extension;
    var _avemgr = _av.theExtensionManager;

    /**
     * MoldflowExtension adds a legendbar and scalebar to the main viewer.
     * @constructor
     * @extends {Autodesk.Viewing.Extension}
     * @param {Autodesk.Viewing.Viewer3D} viewer - Viewer instance.
     * @param {Object} options - Not used.
     * @category Extensions
     */

    // define a const string to hold name of our extension.
    const MoldflowExtString = 'Autodesk.Moldflow';

    _avem.MoldflowExtension = function (viewer, options) {
        _ave.call(this, viewer, options);
        //hook viewer events we are interested in.
        this.onGeometryLoaded = this.onGeometryLoaded.bind(this);
        this.onCameraChanged = this.onCameraChanged.bind(this);
    };

    _avem.MoldflowExtension.prototype = Object.create(_ave.prototype);
    _avem.MoldflowExtension.prototype.constructor = _avem.MoldflowExtension;

    /**
     * Override load to create the legend and scale bars in the viewer.
     */
    _avem.MoldflowExtension.prototype.load = function () {
        var that = this;
        _av.Private.injectCSS('extensions/Moldflow/Moldflow.css');

        //make sure the model exists, then init base moldflow view elements upon result data.
        //otherwise, hook event to create it later.
        if (that.viewer.model) {
            that.initBaseMFView();
        } else {
            that.viewer.addEventListener(_av.GEOMETRY_LOADED_EVENT, that.onGeometryLoaded);
        }

        that.viewer.addEventListener(_av.CAMERA_CHANGE_EVENT, this.onCameraChanged);

        return true;
    };


    /**
     * Override unload to release whatever we created on this viewer.
     */
    _avem.MoldflowExtension.prototype.unload = function () {
        var that = this;

        //Remove all Moldflow extension UI elements.
        if (that.legendContainer) {
            that.viewer.container.removeChild(that.legendContainer);
        }

        if (that.scalebarContainer) {
            that.viewer.container.removeChild(that.scalebarContainer);
        }

        return true;
    };


    /**
     * event hook when geometry loaded.
     */
    _avem.MoldflowExtension.prototype.onGeometryLoaded = function () {
        this.viewer.removeEventListener(_av.GEOMETRY_LOADED_EVENT, self.onGeometryLoaded);
        self.onGometryLoaded = null;
        this.initBaseMFView();
    };

    var legendBarData = function(title, unit, smooth, colourArr, labelArr) {
        this.title = title;
        this.unit = unit;
        this.smooth = smooth;
        this.colourArr = colourArr;
        this.labelArr = labelArr;
    };


    /**
     * create moldflow extension UI components.
     */
    _avem.MoldflowExtension.prototype.initBaseMFView = function () {
        var that = this;

        var lbData = new legendBarData("", "", 0, 0, 0, [0]);
        
        // get legend bar control parameters. If not found, don't display legend bar.
        var pdb = that.viewer.model.getPropertyDb();

        // uses 'lbVer' as key value to determine search for table containing entries.
        pdb.findProperty('lbVer').then(function(myIdArr) {
            // if multiple database id's returned, use only last database.
            var j = myIdArr.length - 1;
            if  (j === -1) return;
            {
                pdb.getProperties(myIdArr[j], function(result) {

                    var rawRGBAStr = "";
                    var rawRGBALen = 0;
                    var rawLabelsStr = "";
                    var rawLabelsLen = 0;

                    for (var i = 0; i < result.properties.length; ++i) {
                        var myProp = result.properties[i];
                        switch(myProp.displayName) {
                            case 'lbTitle':
                                lbData.title = myProp.displayValue;
                                break;
                            case 'lbUnit':
                                lbData.unit = myProp.displayValue;
                                break;
                            case 'lbRGBA':
                                rawRGBAStr = myProp.displayValue;
                                break; 
                            case 'lbRGBAcount':
                                rawRGBALen = myProp.displayValue;
                                break;
                            case 'lbSmooth':
                                lbData.smooth = myProp.displayValue;
                                break;
                            case 'lbLabels':
                                rawLabelsStr = myProp.displayValue;
                                break;
                            case 'lbLabelCount':
                                rawLabelsLen = myProp.displayValue;
                                break;
                            default:
                                break;
                        }
                    }
                    
                    // convert RGB string to array.
                    if (rawRGBALen != 0 ) {
                        lbData.colourArr = new Array(rawRGBALen);
                        lbData.colourArr = rawRGBAStr.split(',', rawRGBALen);
                    }
                    
                    // Get the Label array.
                    if (rawLabelsLen != 0 ) {
                        lbData.labelArr = new Array(rawLabelsLen);
                        lbData.labelArr = rawLabelsStr.split('&', rawLabelsLen);
                    }

                    that.createLegendBar(lbData);
                });               
            }
        });

        // use 'sbVer' as key value to switch scale bar on
        pdb.findProperty('sbVer').then(function(myIdArr) {
            if(myIdArr.length <= 0)
                return;
            that.createScaleBar();
        });
    };


    /** -------------------------------------------------
     *
     * Legend Bar related variables/functions.
     *
     *  ------------------------------------------------- */

    /**
     * create legend colour bar.
     */
    _avem.MoldflowExtension.prototype.createLegendBar = function (lbData) {

        //create colour legend container - with 2 elements: title + colour container
        var legendContainer = document.createElement('div');
        legendContainer.classList.add('adsk-mf-legend-container');
        var legendTitle = document.createElement('div');
        legendTitle.classList.add('adsk-mf-legend-title');
        var colourContainer = document.createElement('div');
        colourContainer.classList.add('adsk-mf-legend-colour-container');

        // Set legend title
        if (!lbData.unit) 
            lbData.unit = '';       
        legendTitle.innerHTML = _av.i18n.translate(lbData.title + " " + lbData.unit);

        // colour container is split into two components: colour bar + label containers
        // Create either: a) smoothed colour bar b) banded colour bar
        if ( lbData.smooth == true ) {
            var smoothColourBar = document.createElement('div');
            smoothColourBar.classList.add('adsk-mf-legend-colour-bar');
            var backgroundGradient = '';
            if ( lbData.colourArr.length > 0 ) {
                backgroundGradient = "linear-gradient(to bottom";
                for(var i = lbData.colourArr.length-1; i > -1; i--) {
                    backgroundGradient += ", " + lbData.colourArr[i];
                }
                backgroundGradient += ")";
            }
            smoothColourBar.style.background = backgroundGradient;
            colourContainer.appendChild(smoothColourBar);
        }
        else 
        { // banded colour bar - reverse order to match definition
            var colourSegments = new Array(lbData.colourArr.length);
            var colourHeight = "calc(100%/" + (lbData.colourArr.length) + ")";
            var bandedColourBar = document.createElement('div');
            bandedColourBar.classList.add('adsk-mf-legend-colour-bar');
            for ( var j = lbData.colourArr.length-1; j > -1; j-- ){
                colourSegments[j] = document.createElement('div');
                colourSegments[j].classList.add('adsk-mf-legend-colour-band');
                bandedColourBar.appendChild(colourSegments[j]);
                colourSegments[j].style.background = lbData.colourArr[j];
                colourSegments[j].style.height = colourHeight;
            }
            colourContainer.appendChild(bandedColourBar);
        }

        // Add labels to label container - in reverse order to match colour mapping.
        var labelContainer = document.createElement('div');
        labelContainer.classList.add('adsk-mf-legend-label-container');
        var labels = new Array(lbData.labelArr.length);
        
        var labelHeight = "calc((100% - 20px)/" + (lbData.labelArr.length-1) + ")";
        for (var k = lbData.labelArr.length-1; k > -1; k--) {
            labels[k] = document.createElement('div');
            labels[k].classList.add('adsk-mf-legend-label');
            labelContainer.appendChild(labels[k]);
            labels[k].innerHTML = lbData.labelArr[k];
            labels[k].style.height = labelHeight;
        }
        colourContainer.appendChild(labelContainer);

        // append constructed Title + colour containers to legend.
        legendContainer.appendChild(legendTitle);
        legendContainer.appendChild(colourContainer);
        
        this.viewer.container.appendChild(legendContainer);
    };


    /** -------------------------------------------------
     *
     * Scale Bar related variables/functions.
     *
     *  ------------------------------------------------- */

    var previousScale = 1.0;
    var maxRulerLen = 1000;
    var numOfTicks = 1;

    var pixcel2LenFactor = 2.5; // This is approximate and to be improved.
    

    /**
     * event hook when camera changed.
     */
    _avem.MoldflowExtension.prototype.onCameraChanged = function () {
        //TBD: what's the right way to compute the true scale of the viewer? 
        //
        var vec = this.viewer.navigation.getEyeToCenterOfBoundsVec(this.viewer.model.getBoundingBox());
        var scale = vec.length();
        if(previousScale == scale)
            return;
        else
            previousScale = scale;

        if (scale != 0.0)
            scale = 1.0 / scale;
        this.updateScaleBar(scale, "mm");
    };

    /**
     * create scale bar.
     */
    _avem.MoldflowExtension.prototype.createScaleBar = function () {
        //create scale bar.
        this.scalebarContainer = document.createElement('div');
        this.scalebarContainer.classList.add('adsk-mf-scalebar');
        this.scalebarRuler = document.createElement('div');
        this.scalebarRuler.classList.add('adsk-mf-scalebar-ruler');
        this.scalebarLabel = document.createElement('div');
        this.scalebarLabel.classList.add('adsk-mf-scalebar-label');
        this.scalebarLabel.innerHTML = 'Scale(' + 100 + 'mm)'; //TODO: a fake default value.

        this.scalebarRulerTicks = [];
        for (var i = 0; i < 4; i++) {
            var divTick = document.createElement('div');

            divTick.classList.add('adsk-mf-scalebar-tick');
            this.scalebarRulerTicks[i] = divTick;
            this.scalebarRuler.appendChild(divTick);
        }

        this.scalebarContainer.appendChild(this.scalebarRuler);
        this.scalebarContainer.appendChild(this.scalebarLabel);
       
        // Update scale before displaying.
        var scale = this.viewer.navigation.getEyeToCenterOfBoundsVec(this.viewer.model.getBoundingBox()).length();
        previousScale = scale;

        if (scale != 0.0)
            scale = 1.0 / scale;
        
        
        this.updateScaleBar(scale, "mm");

        // display
        this.viewer.container.appendChild(this.scalebarContainer);
    };

    /**
     * Update scale bar.
     */
    _avem.MoldflowExtension.prototype.updateScaleBar = function (scale, unit) {

        var maxLen = (maxRulerLen / scale) / pixcel2LenFactor;

        var precision = 1.0;
        var normlizedMaxLen = maxLen;
        while (normlizedMaxLen < 1 || normlizedMaxLen >= 10) {
            if (normlizedMaxLen < 1) {
                precision *= 0.1;
                normlizedMaxLen *= 10.0;
            } else if (normlizedMaxLen >= 10) {
                precision *= 10.0;
                normlizedMaxLen *= 0.1;
            }
        }

        numOfTicks = Math.floor(normlizedMaxLen);
        var rulerWidth = Math.floor(maxRulerLen / normlizedMaxLen) * numOfTicks;
        this.scalebarContainer.style.width = rulerWidth + 'px';
        this.scalebarContainer.style.left = this.viewer.container.clientWidth / 2 - 0.5 * rulerWidth - 2 + 'px';
        var result = numOfTicks * precision;
        result = parseFloat(result.toPrecision(1));
        this.scalebarLabel.innerHTML = 'Scale(' + result + ' ' + unit +')';

        this.scalebarRulerTicks = [];
        this.scalebarRuler.innerHTML = "";

        for (var i = 0; i < numOfTicks - 1; i++) {
            var divTick = document.createElement('div');

            divTick.classList.add('adsk-mf-scalebar-tick');
            divTick.style.marginLeft = (rulerWidth / numOfTicks -2) + 'px';
            this.scalebarRulerTicks[i] = divTick;
            this.scalebarRuler.appendChild(divTick);
        }
    };

    /**
     * Register the extension with the extension manager.
     */
    _avemgr.registerExtension(MoldflowExtString, _avem.MoldflowExtension);

})();
