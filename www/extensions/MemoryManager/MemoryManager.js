(function() {
    var av = Autodesk.Viewing,
        ave = av.Extensions,
        avp = av.Private,
        avu = av.UI;

    ave.MemoryManager = function(viewer, options) {
        av.Extension.call(this, viewer, options);
        this.name = 'memorymanager';
    };

    ave.MemoryManager.prototype = Object.create(av.Extension.prototype);
    ave.MemoryManager.prototype.constructor = ave.MemoryManager;

    ave.MemoryManager.prototype.createUI = function() {
        var viewer = this.viewer;
        var scope = this;

        this.panel = new ave.MemoryManagerPanel(viewer);
        this.memMgrBtn = new avu.Button('toolbar-memMgrBtn');
        this.memMgrBtn.setToolTip('Memory Manager');
        this.memMgrBtn.setIcon("adsk-icon-mem-mgr");
        this.memMgrBtn.onClick = function(e) {
            var display = scope.panel.container.style.display === "none";
            // toggle
            if(display) {
                scope.activate();
            } else {
                scope.deactivate();
            }
        };

        viewer.modelTools.addControl(this.memMgrBtn);
    };

    ave.MemoryManager.prototype.close = function() {
        this.panel.setVisible(false, true);
    };

    ave.MemoryManager.prototype.load = function() {
        avp.injectCSS('extensions/MemoryManager/MemoryManagerUI.css');
        var viewer = this.viewer;
        var scope = this;

        function onToolbarCreated() {
            viewer.removeEventListener(av.TOOLBAR_CREATED_EVENT, onToolbarCreated);
            scope.createUI();
        }

        if (viewer.modelTools) {
            scope.createUI();
        } else {
            viewer.addEventListener(av.TOOLBAR_CREATED_EVENT, onToolbarCreated);
        }

        return true;
    };

    ave.MemoryManager.prototype.unload = function () {
        var viewer = this.viewer;
        
        if (this.panel) {
            this.panel.setVisible(false);
            this.panel.uninitialize();
            this.panel = null;
        }

        viewer.modelTools.removeControl(this.memMgrBtn.getId());
        this.memMgrBtn = null;

        return true;
    };

    ave.MemoryManager.prototype.activate = function () {
        if(!this.activeStatus) {
            this.panel.setVisible(true);
            this.activeStatus = true;
        }
        return true;
    };

    ave.MemoryManager.prototype.deactivate = function () {
        if(this.activeStatus) {
            this.panel.setVisible(false);
            this.activeStatus = false;
        }
        return true;
    };

    av.theExtensionManager.registerExtension('Autodesk.Viewing.MemoryManager', ave.MemoryManager);
})();

AutodeskNamespace('Autodesk.Viewing.Extensions');

(function() {
    var av = Autodesk.Viewing,
        ave = av.Extensions,
        avp = av.Private,
        avu = av.UI;

    var defaultSettings = {
        "memorymanager.unloadPackfiles": false,
        "memorymanager.sblIterator": false,
        "memorymanager.autoRefresh": false,
        "memorymanager.keepIdPixels": 1,
        "memorymanager.occludePixels": 1,
        "memorymanager.startOcclusionTesting": 8,
        "memorymanager.occlusionPackCount": 4,
        "memorymanager.occludeInstancing": true,
        "memorymanager.memorySize": 50,
        "memorymanager.maxPageOutSize": 50,
        "memorymanager.boxProxyMaxCount": 0,
        "memorymanager.boxProxyMinScreen": 0.4
    };

    var memoryId = "memory";
    var occlusionId = "occlusion";
    var debugId = "debug";

    var showPFindex = -1;
    var visiblePFs = "0";
    var _refreshTimeout = 0;

    function MemoryManagerPanel(viewer) {
        this.viewer = viewer;
        viewer.prefs.load(defaultSettings);

        function setSavedSettings() {
            var model = scope.viewer.model;
            if (model) {
                var prefs = scope.viewer.prefs;
                var pp = model.getFragmentList().pagingProxy;
                if (pp) {
                    var options = pp.options;
                    if (options.hasOwnProperty("limit"))
                        options.limit = prefs.get("memorymanager.memorySize");
                    if (options.debug.hasOwnProperty("maxPageOutSize"))
                        options.debug.maxPageOutSize = prefs.get("memorymanager.maxPageOutSize");
                    if (options.debug.hasOwnProperty("occlusionThreshold")) {
                        options.debug.occlusionThreshold = prefs.get("memorymanager.keepIdPixels");
                        scope.viewer.impl.renderer().settings.occlusionid = options.debug.occlusionThreshold > 0;
                    }
                    if (options.debug.hasOwnProperty("occlusionTestThreshold"))
                        options.debug.occlusionTestThreshold = prefs.get("memorymanager.occludePixels");
                    if (options.debug.hasOwnProperty("startOcclusionTestingPackCount"))
                        options.debug.startOcclusionTestingPackCount = prefs.get("memorymanager.startOcclusionTesting");
                    if (options.debug.hasOwnProperty("testPackfileCount"))
                        options.debug.testPackfileCount = prefs.get("memorymanager.occlusionPackCount");
                    if (options.debug.hasOwnProperty("useOcclusionInstancing"))
                        options.debug.useOcclusionInstancing = prefs.get("memorymanager.occludeInstancing");
                    if (options.debug.hasOwnProperty("boxProxyMaxCount"))
                        options.debug.boxProxyMaxCount = prefs.get("memorymanager.boxProxyMaxCount");
                    if (options.debug.hasOwnProperty("boxProxyMinScreen"))
                        options.debug.boxProxyMinScreen = prefs.get("memorymanager.boxProxyMinScreen");
                    if (options.debug.hasOwnProperty("automaticRefresh"))
                        options.debug.automaticRefresh = prefs.get("memorymanager.autoRefresh");
                }
                scope.viewer.removeEventListener(Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, setSavedSettings);
            }
        }
        viewer.addEventListener(Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, setSavedSettings);

        var scope = this;
        var rightCellWidth = "200px";
        var margin = "7px";

        function addRow(tabId, caption, atIndex) {
            var value = document.createElement("div");
            scope.addControl(tabId, value, { caption: caption, insertAtIndex: atIndex });
            var cell = value.sliderRow.cells[1];
            cell.style.width = rightCellWidth;
            value.style.marginLeft = margin;
            value.style.marginRight = margin;
            return value;
        }

        function setupControl(controlId) {
            var control = scope.getControl(controlId);
            control.sliderRow.cells[1].style.width = rightCellWidth;
            return control;
        }

        function redrawView() {
            if (scope.model) {
                // just redraw
                scope.impl.invalidate(true, true, true);
            }
        }

        function getSortedPFid(pfIdIndex) {
            // -1 means don't use this feature to filter PFs
            if (pfIdIndex === -1)
                return -1;
            if (scope.viewer.model) {
                var pfOrder;
                var frags = scope.viewer.model.getFragmentList();
                if (frags && frags.pagingProxy && typeof frags.pagingProxy.pfOrder == 'function')
                    pfOrder = frags.pagingProxy.pfOrder();
                return pfOrder ? pfOrder[pfIdIndex] : pfIdIndex;
            }
            return -1;
        }

        avu.SettingsPanel.call(this, viewer.container, 'MemoryManagePanel' + viewer.id, 'Memory Manager', { width: 380, heightAdjustment: 110 } );

        this.addVisibilityListener(function(show) {
            if (show) {
                scope.refreshPanel();
                scope.resizeToContent();
            } else {
                if (_refreshTimeout > 0) {
                    clearTimeout(_refreshTimeout);
                    _refreshTimeout = 0;
                }
            }
        });

        this.container.dockRight = true;
        this.container.classList.add('memory-manager');

        this.addTab( memoryId, "Memory", { className: "mem-mgr-memory" } );
        this.addTab( occlusionId, "Occlusion", { className: "mem-mgr-occlusion" } );
        this.addTab( debugId, "Debug", { className: "mem-mgr-debug" } );

        this.refreshDiv = document.createElement('div');
        this.refreshDiv.className = 'mem-mgr-reload';
        this.refreshDiv.textContent = "Refresh";
        this.addEventListener(this.refreshDiv, 'touchstart', av.touchStartToClick);
        this.addEventListener(this.refreshDiv, 'click', function() {
            if (scope.viewer.model) {
                resetForRefresh();
                scope.bboxCheckbox.setValue(false);
                scope.viewer.dispatchEvent({ type: av.LOAD_MISSING_GEOMETRY, delay: false, debug: {
                    unloadPackFiles: !!scope.upfCheckbox.getValue()    // For debugging only
                }});
                // view whole model, as viewing individual parts seems to be confusing the code
                // LMV-2188
                scope.showPFSlider.setValue(-1);
                updatePFstrat();
                scope.refreshPanel();
            }
        }, false);
        this.container.appendChild(this.refreshDiv);

        this.onDemandLoading = addRow(memoryId, "On Demand Loading", -1);
        this.packFileCount = addRow(memoryId, "Pack File Count", -1);
        this.geomMemorySize = addRow(memoryId, "Geom Memory Size", -1);
        this.memUsedSize = addRow(memoryId, "Memory Used", -1);
        this.lastPageOut = addRow(memoryId, "Last Page Out", -1);

        var prefs = viewer.prefs;
        this.autoCheckbox = setupControl(this.addCheckbox(debugId, "Auto Refresh",
            prefs.get("memorymanager.autoRefresh"), function(checked) {
                prefs.set("memorymanager.autoRefresh", checked);
                if (scope.viewer.model) {
                    var pp = scope.viewer.model.getFragmentList().pagingProxy;
                    if (pp)
                        pp.options.debug.automaticRefresh = checked;
                }
            }));

        this.upfCheckbox = setupControl(this.addCheckbox(debugId, "Unload Packfiles",
            prefs.get("memorymanager.unloadPackfiles"), function(checked) {
                prefs.set("memorymanager.unloadPackfiles", checked);
            }));

        this.occtSlider = setupControl(this.addSlider(occlusionId, "Keep Id Pixels", 0, 4096,
            prefs.get("memorymanager.keepIdPixels"), function(e) {
                prefs.set("memorymanager.keepIdPixels", Number(scope.occtSlider.stepperElement.value));
                if (scope.viewer.model) {
                    var pp = scope.viewer.model.getFragmentList().pagingProxy;
                    var occlusionThreshold = Number(scope.occtSlider.stepperElement.value);
                    if (pp)
                        pp.options.debug.occlusionThreshold = occlusionThreshold;
                    scope.viewer.impl.renderer().settings.occlusionid = occlusionThreshold > 0;
                }
            }));
        this.occtSlider.sliderElement.step = this.occtSlider.stepperElement.step = 1;

        this.poctSlider = setupControl(this.addSlider(occlusionId, "Pack Occluded Pixels", 0, 4096,
            prefs.get("memorymanager.occludePixels"), function(e) {
                prefs.set("memorymanager.occludePixels", Number(scope.poctSlider.stepperElement.value));
                if (scope.viewer.model) {
                    var pp = scope.viewer.model.getFragmentList().pagingProxy;
                    var occlusionTestThreshold = Number(scope.poctSlider.stepperElement.value);
                    if (pp)
                        pp.options.debug.occlusionTestThreshold = occlusionTestThreshold;
                }
            }));
        this.poctSlider.sliderElement.step = this.poctSlider.stepperElement.step = 1;

        this.socpSlider = setupControl(this.addSlider(occlusionId, "Start Occlusion", 0, 4096,
            prefs.get("memorymanager.startOcclusionTesting"), function(e) {
                prefs.set("memorymanager.startOcclusionTesting", Number(scope.socpSlider.stepperElement.value));
                if (scope.viewer.model) {
                    var pp = scope.viewer.model.getFragmentList().pagingProxy;
                    var startOcclusionTestingPackCount = Number(scope.socpSlider.stepperElement.value);
                    if (pp)
                        pp.options.debug.startOcclusionTestingPackCount = startOcclusionTestingPackCount;
                }
            }));
        this.socpSlider.sliderElement.step = this.socpSlider.stepperElement.step = 1;

        this.tstcSlider = setupControl(this.addSlider(occlusionId, "Occlusion Pack Count", 1, 4,
            prefs.get("memorymanager.occlusionPackCount"), function(e) {
                prefs.set("memorymanager.occlusionPackCount", Number(scope.tstcSlider.stepperElement.value));
                if (scope.viewer.model) {
                    var pp = scope.viewer.model.getFragmentList().pagingProxy;
                    var testPackfileCount = Number(scope.tstcSlider.stepperElement.value);
                    if (pp)
                        pp.options.debug.testPackfileCount = testPackfileCount;
                }
            }));
        this.tstcSlider.sliderElement.step = this.tstcSlider.stepperElement.step = 1;

        this.occInstCheckbox = setupControl(this.addCheckbox(occlusionId, "Occlusion Instancing",
            prefs.get("memorymanager.occludeInstancing"), function(checked) {
                prefs.set("memorymanager.occludeInstancing", checked);
                if (scope.viewer.model) {
                    var pp = scope.viewer.model.getFragmentList().pagingProxy;
                    if (pp)
                        pp.options.debug.useOcclusionInstancing = checked;
                }
            }));

        this.occlusionCulledCount = addRow(memoryId, "Occlusion Culled Count", -1);

        this.pfSlider = setupControl(this.addSlider(memoryId, "Memory Limit MB", 10, 2050,
            prefs.get("memorymanager.memorySize"), function(e) {
                prefs.set("memorymanager.memorySize", Number(scope.pfSlider.stepperElement.value));
                if (scope.viewer.model) {
                    var pp = scope.viewer.model.getFragmentList().pagingProxy;
                    if (pp)
                        pp.options.limit = Number(scope.pfSlider.stepperElement.value);
                }
            }));
        this.pfSlider.sliderElement.step = this.pfSlider.stepperElement.step = 10;

        this.maxPSlider = setupControl(this.addSlider(memoryId, "Max Page Out Size", 10, 2050,
            prefs.get("memorymanager.maxPageOutSize"), function(e) {
                prefs.set("memorymanager.maxPageOutSize", Number(scope.maxPSlider.stepperElement.value));
                if (scope.viewer.model) {
                    var pp = scope.viewer.model.getFragmentList().pagingProxy;
                    if (pp)
                        pp.options.debug.maxPageOutSize = Number(scope.maxPSlider.stepperElement.value);
                }
            }));
        this.maxPSlider.sliderElement.step = this.maxPSlider.stepperElement.step = 10;

        this.pfCheckbox = setupControl(this.addCheckbox(debugId, "PF by importance", true,
            function(/*checked*/) {
                updatePFstrat();
                redrawView();
            }));
        // Disable this control because RenderBatch.forEach and RenderBatchLess.forEach
        // no longer support showing a single pack file. Search for showPF to showPF
        // the lines that need to be uncommented to reenable it.
        this.pfCheckbox.checkElement.disabled = true;

        this.showPFSlider = setupControl(this.addSlider(debugId, "Show single PF", -1, 1500,
            -1, function(e) {
                if (scope.viewer.model) {
                    var pp = scope.viewer.model.getFragmentList().pagingProxy;
                    // Automatically refreshing the geometry interferes with displaying individual pack files
                    // turn it off.
                    if (pp)
                        pp.options.debug.automaticRefresh = false;
                }
                updatePFstrat();
                redrawView();
            }));
        this.showPFSlider.sliderElement.step = this.showPFSlider.stepperElement.step = 1;
        // Disable this control because RenderBatch.forEach and RenderBatchLess.forEach
        // no longer support showing a single pack file. Search for showPF to showPF
        // the lines that need to be uncommented to reenable it.
        this.showPFSlider.sliderElement.disabled = this.showPFSlider.stepperElement.disabled = true;

        this.numBoxesSlider = setupControl(this.addSlider(debugId, "Proxy boxes", 0, 100000,
            prefs.get("memorymanager.boxProxyMaxCount"), function(e) {
                prefs.set("memorymanager.boxProxyMaxCount", Number(scope.numBoxesSlider.value));
                updatePFstrat();
                redrawView();
            }));
        this.numBoxesSlider.sliderElement.step = this.numBoxesSlider.stepperElement.step = 1;

        this.screenBoxesSlider = setupControl(this.addSlider(debugId, "Proxy screen area", 0, 4,
            prefs.get("memorymanager.boxProxyMinScreen"), function(e) {
                prefs.set("memorymanager.boxProxyMinScreen", Number(scope.screenBoxesSlider.value));
                updatePFstrat();
                redrawView();
            }));
        this.screenBoxesSlider.sliderElement.step = this.screenBoxesSlider.stepperElement.step = 0.1;

        this.bboxCheckbox = setupControl(this.addCheckbox(debugId, "Debug: bounding boxes", false,
            function(checked) {
                if (scope.viewer.model) {
                    scope.viewer.model.getFragmentList().showBox = !!checked;
                }
                redrawView();
            }));
        // Disable this control because FragmentList.getVisibleMesh no longer supports showing boxes
        // for all geometry. Search for showBoxes for the lines that need to be uncommented to reenable it.
        this.bboxCheckbox.checkElement.disabled = true;

        this.pfStrategy = addRow(debugId, "Pack File Displayed", -1);

        this.refreshPanel();

        this.selectTab(memoryId);

        function resetForRefresh() {
            if (scope.viewer.model) {
                var frags = scope.viewer.model.getFragmentList();
                frags.showPF = -1;
                frags.showBox = false;
            }
        }

        function updatePFstrat() {
            showPFindex = Number(scope.showPFSlider.value);
            if (scope.viewer.model) {
                var frags = scope.viewer.model.getFragmentList();
                var pp = frags.pagingProxy;
                if ( scope.pfCheckbox.getValue() )
                    frags.showPF = getSortedPFid(showPFindex);
                else
                    frags.showPF = showPFindex;
                if (pp) {
                    // update other values
                    pp.options.debug.boxProxyMaxCount = Number(scope.numBoxesSlider.value);
                    pp.options.debug.boxProxyMinScreen = Number(scope.screenBoxesSlider.value);
                    scope.refreshPanel();
                }
            }
        }
    }

    MemoryManagerPanel.prototype = Object.create(avu.SettingsPanel.prototype);
    MemoryManagerPanel.prototype.constructor = MemoryManagerPanel;

    MemoryManagerPanel.prototype.refreshPanel = function(timer) {
        if (_refreshTimeout !== 0) {
            clearTimeout(_refreshTimeout);
            _refreshTimeout = 0;
        }
        _refreshTimeout = setTimeout(function(ui) {
            _refreshTimeout = 0;
            if (ui.isVisible())
                ui.refreshPanel(true);
        }, 1000, this);

        var onDemandLoading = "Unknown";
        var onDemandLoadingColor = "#ff0000";
        var packFileCount = "Unknown";
        var memorySize = "Unknown";
        var memoryUsed = "Unknown";
        var pageOut = "Unknown";
        var culledCount = "Unknown";
        var pfStrategy = "-1 / default";
        var pfMax = 1500;
        var model = this.viewer.model;

        function getNumVisiblePFs() {
            // -1 means unknown
            if (this.viewer.model) {
                var pfVisible;
                var frags = this.viewer.model.getFragmentList();
                if (frags && frags.pagingProxy && typeof frags.pagingProxy.pfOrder == 'function')
                    pfVisible = frags.pagingProxy.getNumVisiblePFs();
                return pfVisible;
            }
            return -1;
        }

        if (model) {
            var memoryStats = model.getMemoryInfo();
            var loadedPackCount = -1;
            var packsPagedCount = -1;
            visiblePFs = getNumVisiblePFs.call(this);
            var frags = model.getFragmentList();
            if (frags) {
                onDemandLoading = frags.onDemandLoadingEnabled() ? "On" : "Off";
                if (frags.onDemandLoadingEnabled())
                    onDemandLoadingColor = "";
                if (frags.pagingProxy) {
                    this.bboxCheckbox.setValue(!!frags.showBox);
                    this.occInstCheckbox.setValue(!!frags.pagingProxy.options.debug.useOcclusionInstancing);
                    this.autoCheckbox.setValue(!!frags.pagingProxy.options.debug.automaticRefresh);
                    if (!timer) {
                        if (memoryStats)
                            this.pfSlider.setValue(memoryStats.limit);
                        if (frags.pagingProxy.options.debug.maxPageOutSize)
                            this.maxPSlider.setValue(frags.pagingProxy.options.debug.maxPageOutSize);
                        if (frags.pagingProxy.options.debug.occlusionThreshold)
                            this.occtSlider.setValue(frags.pagingProxy.options.debug.occlusionThreshold);
                        if (frags.pagingProxy.options.debug.occlusionTestThreshold)
                            this.poctSlider.setValue(frags.pagingProxy.options.debug.occlusionTestThreshold);
                        if (frags.pagingProxy.options.debug.startOcclusionTestingPackCount)
                            this.socpSlider.setValue(frags.pagingProxy.options.debug.startOcclusionTestingPackCount);
                        if (frags.pagingProxy.options.debug.testPackfileCount)
                            this.tstcSlider.setValue(frags.pagingProxy.options.debug.testPackfileCount);
                    }
                    if (frags.pagingProxy.hasOwnProperty("totalGeomSize"))
                        memorySize = frags.pagingProxy.totalGeomSize.toFixed(3) + " / limit " + memoryStats.effectiveLimit.toFixed(3);
                    if (memoryStats)
                        memoryUsed = memoryStats.loaded.toFixed(3);
                    if (frags.pagingProxy.hasOwnProperty("loadedPacks"))
                        loadedPackCount = Object.keys(frags.pagingProxy.loadedPacks).length;
                    if (frags.pagingProxy.hasOwnProperty("packsPagedOut"))
                        packsPagedCount = frags.pagingProxy.packsPagedOut;
                    if (frags.pagingProxy.hasOwnProperty("lastPageOut"))
                        pageOut = frags.pagingProxy.lastPageOut.toFixed(3);
                    if (frags.pagingProxy.hasOwnProperty("occlusionCulledCount"))
                        culledCount = frags.pagingProxy.occlusionCulledCount.toFixed(0);
                }

                var showPF = "all";
                if (frags.showPF !== -1) {
                    var visPFs = parseInt(visiblePFs);
                    if ( showPFindex === -1 ) {
                        showPF = "all";
                    } else {
                        showPF = frags.showPF;
                        if ( visPFs >= 0) {
                            // valid to check for other status
                            if (frags.pagingProxy.hasOwnProperty("loadedPacks") &&
                                !frags.pagingProxy.loadedPacks[frags.showPF]) {
                                // PF is not loaded or not visible, for some reason.
                                showPF = showPF + " (not loaded)";
                            }
                            if (showPFindex>=visPFs) {
                                // [] means nothing in PF is visible
                                showPF = showPF + " (fully culled)";
                            }
                        }
                    }
                }
                pfStrategy = showPF.toString();
            }
            if (model.is2d()) {
                packFileCount = "File is 2D";
            } else {
                var data = model.getData();
                if (data) {
                    packFileCount = data.geompacks.length.toString();
                    pfMax = packFileCount-1;
                }
                if (visiblePFs >= 0)
                    packFileCount += " / " + visiblePFs + " visible";
                if (loadedPackCount >= 0)
                    memoryUsed += " / " + loadedPackCount + " loaded";
                if (packsPagedCount >= 0)
                    pageOut += " / " + packsPagedCount + " packs paged out";
                    
            }
        }
        this.onDemandLoading.setAttribute("data-i18n", onDemandLoading);
        this.onDemandLoading.textContent = av.i18n.translate(onDemandLoading);
        this.onDemandLoading.style.color = onDemandLoadingColor;
        this.packFileCount.setAttribute("data-i18n", packFileCount);
        this.packFileCount.textContent = av.i18n.translate(packFileCount);
        this.geomMemorySize.setAttribute("data-i18n", memorySize);
        this.geomMemorySize.textContent = av.i18n.translate(memorySize);
        this.memUsedSize.setAttribute("data-i18n", memoryUsed);
        this.memUsedSize.textContent = av.i18n.translate(memoryUsed);
        this.pfStrategy.setAttribute("data-i18n", pfStrategy);
        this.pfStrategy.textContent = av.i18n.translate(pfStrategy);
        this.lastPageOut.setAttribute("data-i18n", pageOut);
        this.lastPageOut.textContent = av.i18n.translate(pageOut);
        this.occlusionCulledCount.setAttribute("data-i18n", culledCount);
        this.occlusionCulledCount.textContent = av.i18n.translate(culledCount);
        
        // set to true range
        this.showPFSlider.sliderElement.max = pfMax;
        this.showPFSlider.stepperElement.max = pfMax;
   };

    ave.MemoryManagerPanel = MemoryManagerPanel;
})();
