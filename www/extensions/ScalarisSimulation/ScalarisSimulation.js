/*
 * Add/Remove Scalaris Stress Visualization UI to/from the viewer.
 * Toggles the visualization of simulation data in the model.
 */
(function() { 'use strict';

var namespace = AutodeskNamespace('Autodesk.Viewing.Extensions.ScalarisSimulation');  
var av = Autodesk.Viewing;

var SCALARIS_SIMULATION_EXTENSION_ID = 'Autodesk.Viewing.ScalarisSimulation';
var SCALARIS_SIMULATION_BUTTON_ID = 'toolbar-simulation';


/**
 * ScalarisSimulationExtension adds a toggle simulation button ('Model View'/'Stress View')
 * to settingsTools toolbar.
 * @constructor
 * @extends {Autodesk.Viewing.Extension}
 * @param {Autodesk.Viewing.Viewer3D} viewer - Viewer instance.
 * @param {Object} options - Not used.
 * @category Extensions
 */
function ScalarisSimulationExtension(viewer, options) {
    av.Extension.call(this, viewer, options);
    this._onToolbarCreated = this._onToolbarCreated.bind(this);
}

ScalarisSimulationExtension.prototype = Object.create(av.Extension.prototype);
ScalarisSimulationExtension.prototype.constructor = ScalarisSimulationExtension;

/**
 * Load the Scalaris simulation extension.
 * @override
 * @returns {boolean}
 */
ScalarisSimulationExtension.prototype.load = function() {
  if (!this.viewer.model.loader) {
    return false;
  }

  if (!(this.viewer.model.loader instanceof av.ScalarisLoader)) {
    av.Private.logger.warn('No scalaris loader available for extension', SCALARIS_SIMULATION_EXTENSION_ID);
    return false;
  }

  av.Private.injectCSS('extensions/ScalarisSimulation/ScalarisSimulation.css');

  if (this.viewer.toolbar) {
      this._createUI();
  } else {
      this.viewer.addEventListener(av.TOOLBAR_CREATED_EVENT, this._onToolbarCreated);
  }
  return true;
};

/**
 * Unload the Scalaris simulation extension.
 * @override
 * @returns {boolean}
 */
ScalarisSimulationExtension.prototype.unload = function() {
  // Remove the simulation UI from the viewer.
  if (this._legendContainer) {
    this.viewer.container.removeChild(this._legendContainer);
    // Remove a control from this control group.
    this.viewer.settingsTools.removeControl(SCALARIS_SIMULATION_BUTTON_ID);
  }
  // Disable display of simulation data.
  this.setDisplayStress(false);
  return true;
};

/**
 * Toggle the display of stress data on the model and related UI in the viewer.
 * @param {boolean} show - enables or disables the display.
 */
 ScalarisSimulationExtension.prototype.setDisplayStress = function(show) {
  var defMaterial = this.viewer.impl.getMaterials().defaultMaterial;
  if (!defMaterial) {
    return;
  }

  if (this._legendContainer) {
    this._legendContainer.hidden = !show;
  }
  if (this._simulationButton) {
    if (show) {
      this._simulationButton.setIcon('adsk-toolbar-view-modelIcon');
      this._simulationButton.setToolTip(av.i18n.translate('Model View'));
    } else {
      this._simulationButton.setIcon('adsk-toolbar-view-stressIcon');
      this._simulationButton.setToolTip(av.i18n.translate('Stress View')); // structural stress simulation results view
    }
  }
  defMaterial.vertexColors = show ? THREE.VertexColors : THREE.NoColors;
  defMaterial.needsUpdate = true;
  this.viewer.impl.invalidate(true, true, false); // trigger re-render
};

/**
 * Set the min and max values for the von Mises stress data in specified units.
 * @param {number} min - minimum von Mises stress value
 * @param {number} max - maximum von Mises stress value
 * @param {?string} [units='Pa'] - units for stress values.
 */
ScalarisSimulationExtension.prototype.setStressRange = function(min, max, units) {
  if (!units) {
    max = Number.isInteger(max) ? max : max.toExponential(4);
    min = Number.isInteger(min) ? min : min.toExponential(4);
    units = 'Pa';
  }
  this._minLabel.innerText = av.i18n.translate('Min Stress', {min: min, units: units});  
  this._maxLabel.innerText = av.i18n.translate('Max Stress', {max: max, units: units});
};

/**
 * @private
 * Remove the toolbar creation event listener and create the UI elements for simulation data.
 */
ScalarisSimulationExtension.prototype._onToolbarCreated = function() {
  this.viewer.removeEventListener(av.TOOLBAR_CREATED_EVENT, this._onToolbarCreated);
  this._createUI();
};

/**
 * @private
 * Create the UI elements (legend and simulation button) for displaying von Mises stress data.
 */
ScalarisSimulationExtension.prototype._createUI = function() {
  var viewer = this.viewer;
  var svf = viewer.model.loader.svf;
  var loadOptions = svf.loadOptions;
  if (svf && loadOptions) {
    var isScalaris = loadOptions.defaultFileType || loadOptions.svf.slice(loadOptions.svf.length-8).toLowerCase(); 
    if (isScalaris === 'scalaris' && svf.colors && svf.colors.byteLength) {
      // Add the simulation UI to the viewer .
      this._legendContainer = document.createElement('div');
      this._legendContainer.classList.add('adsk-legend-container');
      var title = document.createElement('div');
      title.innerText = av.i18n.translate('Von Mises Stress');
      title.classList.add('adsk-legend-title');
      var scaleContainer = document.createElement('div');
      scaleContainer.classList.add('adsk-legend-scale-container');
      var colorScale = document.createElement('div');
      colorScale.classList.add('adsk-legend-color-scale');
      var labelContainer = document.createElement('div');
      labelContainer.classList.add('adsk-legend-label-container');
      this._maxLabel = document.createElement('div');
      this._maxLabel.classList.add('adsk-legend-max-label');
      this._minLabel = document.createElement('div');
      this._minLabel.classList.add('adsk-legend-min-label');
      
      this.setStressRange(svf.stressMin, svf.stressMax, loadOptions.stressUnits);
      
      labelContainer.appendChild(this._maxLabel);
      scaleContainer.appendChild(colorScale);
      scaleContainer.appendChild(labelContainer);
      labelContainer.appendChild(this._minLabel);
      this._legendContainer.appendChild(title);
      this._legendContainer.appendChild(scaleContainer);
      viewer.container.appendChild(this._legendContainer);

      this._simulationButton = new av.UI.Button(SCALARIS_SIMULATION_BUTTON_ID);
      this._simulationButton.setToolTip(av.i18n.translate('Stress View'));
      this._simulationButton.setIcon('adsk-toolbar-view-stressIcon');
      this.setDisplayStress(false);
      var scope = this;
      this._simulationButton.onClick = function(e) {
        if (scope._legendContainer) {
          scope.setDisplayStress(scope._legendContainer.hidden);
        }
      };
      viewer.settingsTools.addControl(this._simulationButton, {index: viewer.settingsTools.getNumberOfControls()});
    } else {
      // Turn off the display of simulation data.
      this.setDisplayStress(false);
      av.Private.logger.warn('No simulation data available to view for extension', SCALARIS_SIMULATION_EXTENSION_ID);
    }
  }
};

/*
 * Register the 'Autodesk.Viewing.ScalarisSimulation' extension with the extension manager.
 */
av.theExtensionManager.registerExtension(SCALARIS_SIMULATION_EXTENSION_ID, ScalarisSimulationExtension);

})();
