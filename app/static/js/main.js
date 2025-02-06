
document.addEventListener('DOMContentLoaded', function () {
    // Define the coordinates and other configuration variables
    const delta = 0.1;
    const startDepth = 0;
    const endDepth = 50;

    // Initializes the input ranges for longitude, latitude, and depth based on the given variables.
    function initializeSliders() {
        // Set longitude range and initial values
        const minLongitudeInput = document.getElementById('minLongitude');
        const maxLongitudeInput = document.getElementById('maxLongitude');
        minLongitudeInput.min = west - delta * 5;
        minLongitudeInput.max = east - delta;
        minLongitudeInput.value = west;
        maxLongitudeInput.min = west + delta;
        maxLongitudeInput.max = east + delta * 5;
        maxLongitudeInput.value = east;

        // Set latitude range and initial values
        const minLatitudeInput = document.getElementById('minLatitude');
        const maxLatitudeInput = document.getElementById('maxLatitude');
        minLatitudeInput.min = south - delta * 5;
        minLatitudeInput.max = north - delta;
        minLatitudeInput.value = south;
        maxLatitudeInput.min = south + delta;
        maxLatitudeInput.max = north + delta * 5;
        maxLatitudeInput.value = north;

        // Set depth range and initial values
        const minDepthInput = document.getElementById('minDepth');
        const maxDepthInput = document.getElementById('maxDepth');
        minDepthInput.min = startDepth - delta * 5;
        minDepthInput.max = endDepth - delta;
        minDepthInput.value = startDepth;
        maxDepthInput.min = startDepth + delta;
        maxDepthInput.max = endDepth + delta * 5;
        maxDepthInput.value = endDepth;

        // Adding event listeners with validation to prevent sliders from crossing each other
        function validateSliderAdjustments(minInput, maxInput, minValue, maxValue, delta) {
            if (parseFloat(minInput.value) > parseFloat(maxInput.value) - delta) {
                alert("Minimum value cannot exceed or meet the maximum value minus a delta!");
                minInput.value = Math.min(parseFloat(maxInput.value) - delta, maxValue - delta);
            }
            if (parseFloat(maxInput.value) < parseFloat(minInput.value) + delta) {
                alert("Maximum value cannot be less than or meet the minimum value plus a delta!");
                maxInput.value = Math.max(parseFloat(minInput.value) + delta, minValue + delta);
            }
        }

        minLongitudeInput.addEventListener('input', () => validateSliderAdjustments(minLongitudeInput, maxLongitudeInput, west, east, delta));
        maxLongitudeInput.addEventListener('input', () => validateSliderAdjustments(minLongitudeInput, maxLongitudeInput, west, east, delta));
        minLatitudeInput.addEventListener('input', () => validateSliderAdjustments(minLatitudeInput, maxLatitudeInput, south, north, delta));
        maxLatitudeInput.addEventListener('input', () => validateSliderAdjustments(minLatitudeInput, maxLatitudeInput, south, north, delta));
        minDepthInput.addEventListener('input', () => validateSliderAdjustments(minDepthInput, maxDepthInput, startDepth, endDepth, delta));
        maxDepthInput.addEventListener('input', () => validateSliderAdjustments(minDepthInput, maxDepthInput, startDepth, endDepth, delta));
    }


    function updateDisplayValues() {
        // Update display values for all sliders
        ['minLongitude', 'maxLongitude', 'minLatitude', 'maxLatitude', 'minDepth', 'maxDepth'].forEach(id => {
            updateDisplay(id, id.includes('Depth') ? ' km' : '°');
        });
    }

    function updateDisplay(id, unit) {
        const input = document.getElementById(id);
        const span = document.getElementById(id + 'Value');
        span.textContent = input.value + unit;
        input.addEventListener('input', function () {
            span.textContent = this.value + unit;
        });
    }

    // Initialize sliders on load
    initializeSliders();

    // To control the "Home" button zoom area:
    // Set the "default" camera view prior to constructing the Viewer widget, 
    // and this is used both for the initial view and for the "Home" button view.
    // Set this using static properties DEFAULT_VIEW_FACTOR and DEFAULT_VIEW_RECTANGLE on the Camera class.

    var rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);

    Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle;

    // NOTE: Viewer constructed after default view is set.

    // Cesium Viewer instance
    const viewer = new Cesium.Viewer('mapContainer', {
        imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
        }),
        fullscreenButton: false,  // Disable the default fullscreen button
        navigationInstructionsInitiallyVisible: true,
        baseLayerPicker: false,
        infoBox: true
    });



    viewer.scene.globe.baseColor = Cesium.Color.TRANSPARENT;
    viewer.animation.container.style.visibility = 'hidden';
    viewer.timeline.container.style.visibility = 'hidden';
    const areaRectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
    viewer.camera.setView({ destination: areaRectangle });

    const view3DButton = document.getElementById('view3DButton');
    const toggleButton = document.getElementById('toggleControlsVisibility');


    // Fetch earthquake data from USGS API
    fetch(eqQueryUrl)
        .then(response => response.json())
        .then(data => {
            data.features.forEach(feature => {
                const coords = feature.geometry.coordinates;
                const magnitude = feature.properties.mag;

                viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(coords[0], coords[1]),
                    ellipse: {
                        semiMinorAxis: 50 * Math.pow(magnitude, 3),
                        semiMajorAxis: 50 * Math.pow(magnitude, 3),
                        material: Cesium.Color.YELLOW.withAlpha(0.5)
                    },
                    description: `Magnitude: ${magnitude}<br>Location: (${coords[1]}, ${coords[0]})<br>Depth: ${coords[2]} km`
                });
            });
        })
        .catch(error => console.error('Error fetching earthquake data:', error));

    view3DButton.addEventListener('click', function () {
        const checkboxes = document.querySelectorAll('#lineList input[type="checkbox"]:checked');
        if (checkboxes.length === 0) {
            // No checkboxes are selected, display an error message
            alert('Please select at least one fault before proceeding.');
            return; // Stop further execution
        }

        // If there are selected checkboxes, proceed with the original functionality
        const selectedLines = Array.from(checkboxes).map(cb => cb.value); // Get the value (id) of the checkbox

        // Store selected lines in localStorage or pass to another page
        localStorage.setItem('selectedLines', JSON.stringify(selectedLines));

        // Open the new page in a new tab
        const newTab = window.open();
        if (newTab) {
            newTab.document.write('<html><head><title>View 3D</title></head><body></body></html>');
            newTab.document.close();
            newTab.location.href = '/3d';
        } else {
            alert('Please select at least one fault before proceeding.');
            return; // Stop further execution
        }
    });


    toggleButton.addEventListener('click', function () {
        var element = document.getElementById("mapControls");
        if (element.style.display === "none") {
            element.style.display = "block";
        } else {
            element.style.display = "none";
        }

    });

    // Get references to the input elements by their IDs
    const colorSelector = document.getElementById('colorSelector');
    const minColorInput = document.getElementById('minColor');
    const maxColorInput = document.getElementById('maxColor');

    // Function to update feature colors, assuming viewer is available
    function triggerColorUpdate() {
        updateFeatureColors(colorSelector.value, viewer);
    }

    // Attach event listeners to the input elements
    // For color selection dropdown
    colorSelector.addEventListener('change', triggerColorUpdate);

    // For min and max color value inputs
    minColorInput.addEventListener('input', triggerColorUpdate);
    maxColorInput.addEventListener('input', triggerColorUpdate);

    document.getElementById('minColor').addEventListener('input', () => updateAllFeatureColors(viewer));
    document.getElementById('maxColor').addEventListener('input', () => updateAllFeatureColors(viewer));

    function updateAllFeatureColors(viewer) {
        const selectedColor = document.getElementById('colorSelector').value;
        if (selectedColor === 'DepthColorMap') {
            updateFeatureColors(selectedColor, viewer);
        }
    }


    function getColorFromValue(value, minValue, maxValue) {
        // Normalize the value within the range of minValue to maxValue
        const fraction = (value - minValue) / (maxValue - minValue);
        const clampedFraction = Math.max(0, Math.min(1, fraction));

        // Calculate the red and blue components based on the clamped fraction
        const red = Math.floor(255 * (1 - clampedFraction));
        const blue = Math.floor(255 * clampedFraction);
        const green = 0;

        // Create a Cesium Color object
        const cesiumColor = Cesium.Color.fromBytes(red, green, blue);

        // Create an RGB string
        const rgbString = `rgb(${red}, ${green}, ${blue})`;

        // Return both the Cesium Color object and the RGB string
        return {
            cesiumColor: cesiumColor,
            rgbString: rgbString
        };
    }


    function updateFeatureColors(selectedColor, viewer) {
        //alert("Updating colors for: " + selectedColor);
        viewer.entities.values.forEach(entity => {
            if (entity.polyline) {
                let color;
                //alert("Entity has polyline");
                if (selectedColor === 'DepthColorMap' && 'averageDepth' in entity) {
                    toggleColorInputs(true);
                    const minDepth = parseFloat(document.getElementById('minColor').value);
                    const maxDepth = parseFloat(document.getElementById('maxColor').value);
                    //alert("Depth values: " + entity.averageDepth + "," + minDepth + "," + maxDepth);
                    color = getColorFromValue(entity.averageDepth, minDepth, maxDepth).cesiumColor;
                } else if (selectedColor === 'RakeColorMap' && 'rake' in entity) {
                    toggleColorInputs(true);
                    const minRake = parseFloat(document.getElementById('minColor').value);
                    const maxRake = parseFloat(document.getElementById('maxColor').value);
                    color = getColorFromValue(entity.rake, minRake, maxRake).cesiumColor;
                } else if (selectedColor === 'DipColorMap' && 'dip' in entity) {
                    toggleColorInputs(true);
                    const minDip = parseFloat(document.getElementById('minColor').value);
                    const maxDip = parseFloat(document.getElementById('maxColor').value);
                    color = getColorFromValue(entity.dip, minDip, maxDip).cesiumColor;
                } else if (selectedColor === 'Black') {
                    color = Cesium.Color.BLACK;
                    toggleColorInputs(false);
                } else if (selectedColor === 'Blue') {
                    color = Cesium.Color.BLUE;
                    toggleColorInputs(false);
                }
                else {
                    color = Cesium.Color.WHITE; // default color if no valid option is selected
                }
                entity.polyline.material = new Cesium.ColorMaterialProperty(color);
                //alert("Color set to:" + color);
            }
        });
        // Sometimes changes to entity properties might not visually update until the scene is explicitly refreshed or re-rendered.
        viewer.scene.requestRender();
    }

    function updateColorBars() {
        const minColorValue = parseFloat(document.getElementById('minColor').value);
        const maxColorValue = parseFloat(document.getElementById('maxColor').value);
        const minColor = getColorFromValue(minColorValue, minColorValue, maxColorValue).rgbString;
        const maxColor = getColorFromValue(maxColorValue, minColorValue, maxColorValue).rgbString;

        // Assuming colors are returned as strings suitable for CSS (e.g., "rgb(255,0,0)")
        document.getElementById('colorBarMin').style.backgroundColor = minColor;
        document.getElementById('colorBarMax').style.backgroundColor = maxColor;
    }

    document.getElementById('minColor').addEventListener('input', () => updateColorBars());
    document.getElementById('maxColor').addEventListener('input', () => updateColorBars());
    toggleColorInputs(false);
    function toggleColorInputs(enabled) {
        // Reference input and color bar elements
        const minColorInput = document.getElementById('minColor');
        const maxColorInput = document.getElementById('maxColor');
        const colorBarMin = document.getElementById('colorBarMin');
        const colorBarMax = document.getElementById('colorBarMax');
        const minColorInputLabel = document.getElementById('minColorLabel');
        const maxColorInputLabel = document.getElementById('maxColorLabel');

        // Enable or disable input fields
        minColorInput.disabled = !enabled;
        maxColorInput.disabled = !enabled;

        // Adjust the color bars visibility based on the enabled status
        if (enabled) {
            colorBarMin.style.opacity = '1'; // Make it fully visible
            colorBarMax.style.opacity = '1'; // Make it fully visible
            minColorInputLabel.style.color = "BLACK"; // Make it fully visible
            maxColorInputLabel.style.color = "BLACK"; // Make it fully visible
            maxColorInputLabel.style.backgroundColor = colorBarMax
        } else {
            colorBarMin.style.opacity = '0.3'; // Reduce visibility
            colorBarMax.style.opacity = '0.3'; // Reduce visibility
            minColorInputLabel.style.color = "GRAY"; // Reduce visibility
            maxColorInputLabel.style.color = "GRAY"; // Reduce visibility
        }
    }



    let filterRectangle = viewer.entities.add({
        rectangle: {
            coordinates: Cesium.Rectangle.fromDegrees(west, south, east, north),
            material: Cesium.Color.GREY.withAlpha(0.2),
            outline: true,
            outlineColor: Cesium.Color.GREY
        }
    });


    const geoJsonEntities = {};

    fetch('/geojson')
        .then(response => response.json())
        .then(data => {
            const lineList = document.getElementById('lineList');
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');

            document.getElementById('toggleVisibilityLabel').addEventListener('click', function () {
                const visibilityIcons = document.querySelectorAll('#lineList .fa-eye');
                const allVisible = Array.from(visibilityIcons).every(icon => icon.style.color !== 'grey');

                visibilityIcons.forEach(icon => {
                    icon.click(); // Trigger the click event on each eye icon
                });

                const toggleVisibilityIcon = document.getElementById('toggleVisibilityIcon');
                if (allVisible) {
                    toggleVisibilityIcon.style.color = 'grey'; // Set to grey if all were previously visible
                } else {
                    toggleVisibilityIcon.style.color = 'black'; // Set to black if any were previously invisible
                }
            });

            selectAllCheckbox.addEventListener('change', function () {
                const checkboxes = document.querySelectorAll('#lineList input[type="checkbox"]');
                checkboxes.forEach((checkbox) => {
                    // Get the parent row of the checkbox
                    let parentRow = checkbox.closest('tr');
                    // Check if the row is visible by checking its display style
                    if (parentRow.style.display !== 'none') {
                        checkbox.checked = this.checked;
                        checkbox.dispatchEvent(new Event('change'));
                        // Just make sure the unselected checkboxes are not checked from the previous run.
                    } else { checkbox.checked = !this.checked; }
                });
            });

            populateLineList(data, lineList, geoJsonEntities, viewer);

            document.getElementById('minLongitude').addEventListener('input', () => updateVisibility(geoJsonEntities, lineList));
            document.getElementById('maxLongitude').addEventListener('input', () => updateVisibility(geoJsonEntities, lineList));
            document.getElementById('minLatitude').addEventListener('input', () => updateVisibility(geoJsonEntities, lineList));
            document.getElementById('maxLatitude').addEventListener('input', () => updateVisibility(geoJsonEntities, lineList));
            document.getElementById('minDepth').addEventListener('input', () => updateVisibility(geoJsonEntities, lineList));
            document.getElementById('maxDepth').addEventListener('input', () => updateVisibility(geoJsonEntities, lineList));

        })
        .catch(error => console.error('Error fetching GeoJSON:', error));

    function populateLineList(data, lineList, entities, viewer) {
        const headerRow = document.createElement('tr');
        ['', '', 'Fault Name', 'Avg. Depth (km)', 'Dip (°)', 'Rake (°)', 'Source', 'ID'].forEach(text => {
            const header = document.createElement('th');
            header.textContent = text;
            // Apply a class to the "ID" column
            if (text === 'ID') {
                header.classList.add('hidden-id-column');
            }
            headerRow.appendChild(header);
        });
        lineList.appendChild(headerRow);

        data.features.forEach((feature, index) => {
            if (feature.geometry.type === "LineString") {
                const positions = feature.geometry.coordinates.map(coord => Cesium.Cartesian3.fromDegrees(coord[0], coord[1]));
                const lineName = feature.properties.name.trim() ? feature.properties.name : `Fault trace ${feature.properties.id}`;
                const id = feature.properties.id;
                const source = feature.properties.source;
                const upperDepth = feature.properties.upper_depth || 0;
                const lowerDepth = feature.properties.lower_depth || 0;
                const averageDepth = (upperDepth + lowerDepth) / 2;

                const longitudes = positions.map(pos => {
                    const cartographic = Cesium.Cartographic.fromCartesian(pos);
                    return cartographic.longitude * Cesium.Math.DEGREES_PER_RADIAN;
                });

                const latitudes = positions.map(pos => {
                    const cartographic = Cesium.Cartographic.fromCartesian(pos);
                    return cartographic.latitude * Cesium.Math.DEGREES_PER_RADIAN;
                });

                const averageLongitude = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
                const averageLatitude = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;


                const rake = feature.properties.rake || 0;
                const dip = feature.properties.dip || 0;

                const lineEntity = viewer.entities.add({
                    polyline: {
                        positions: positions,
                        material: Cesium.Color.BLACK,
                        width: 3
                    },
                    name: lineName,
                    id: id,
                    show: true,
                    description: Object.entries(feature.properties).map(([key, value]) => `${key}: ${value}`).join('<br>') + '<br>average longitude:' + averageLongitude.toFixed(2) + '<br>average latitude: ' + averageLatitude.toFixed(2),
                    averageLongitude: averageLongitude,
                    averageLatitude: averageLatitude,
                    averageDepth: averageDepth,
                    rake: rake,
                    dip: dip

                });

                entities[id] = lineEntity;

                const listItem = document.createElement('tr');

                const checkboxCell = document.createElement('td');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `checkbox-${index}`;
                checkbox.value = id;
                checkbox.onchange = function () {
                    lineEntity.polyline.material = this.checked ? Cesium.Color.MAGENTA : Cesium.Color.BLACK;
                };
                checkboxCell.appendChild(checkbox);
                listItem.appendChild(checkboxCell);

                const visibilityCell = document.createElement('td');
                const visibilityIcon = document.createElement('i');
                visibilityIcon.classList.add('fas', 'fa-eye');
                visibilityIcon.style.cursor = 'pointer';
                visibilityIcon.onclick = function () {
                    lineEntity.show = !lineEntity.show;
                    visibilityIcon.style.color = lineEntity.show ? 'black' : 'grey';
                };
                visibilityCell.appendChild(visibilityIcon);
                listItem.appendChild(visibilityCell);

                const nameCell = document.createElement('td');
                nameCell.textContent = lineName;
                listItem.appendChild(nameCell);
                /*
                 const averageLongitudeCell = document.createElement('td');
                 averageLongitudeCell.textContent = averageLongitude.toFixed(2);
                 listItem.appendChild(averageLongitudeCell);
 
                 const averageLatitudeCell = document.createElement('td');
                 averageLatitudeCell.textContent = averageLatitude.toFixed(2);
                 listItem.appendChild(averageLatitudeCell);
                 */
                const averageDepthCell = document.createElement('td');
                averageDepthCell.textContent = averageDepth.toFixed(1);
                listItem.appendChild(averageDepthCell);

                const dipCell = document.createElement('td');
                dipCell.textContent = dip.toFixed(1);
                listItem.appendChild(dipCell);

                const rakeCell = document.createElement('td');
                rakeCell.textContent = rake.toFixed(1);
                listItem.appendChild(rakeCell);

                const sourceCell = document.createElement('td');
                sourceCell.textContent = source;
                listItem.appendChild(sourceCell);

                const idCell = document.createElement('td');
                idCell.textContent = id;
                idCell.classList.add('hidden-id-column'); // Make the ID column hidden
                listItem.appendChild(idCell);

                lineList.appendChild(listItem);
            }
        });
    }


    function updateVisibility(entities, list) {
        const minLongitude = parseFloat(document.getElementById('minLongitude').value);
        const maxLongitude = parseFloat(document.getElementById('maxLongitude').value);
        const minLatitude = parseFloat(document.getElementById('minLatitude').value);
        const maxLatitude = parseFloat(document.getElementById('maxLatitude').value);
        const minDepth = parseFloat(document.getElementById('minDepth').value);
        const maxDepth = parseFloat(document.getElementById('maxDepth').value);

        const rows = list.getElementsByTagName('tr');
        Object.keys(entities).forEach(id => {
            const entity = entities[id];
            const positions = entity.polyline.positions.getValue(Cesium.JulianDate.now());

            const longitudes = positions.map(pos => {
                const cartographic = Cesium.Cartographic.fromCartesian(pos);
                return cartographic.longitude * Cesium.Math.DEGREES_PER_RADIAN;
            });

            const latitudes = positions.map(pos => {
                const cartographic = Cesium.Cartographic.fromCartesian(pos);
                return cartographic.latitude * Cesium.Math.DEGREES_PER_RADIAN;
            });

            const avgLongitude = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
            const avgLatitude = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
            const depth = entity.averageDepth; // Assuming averageDepth is stored directly in the entity

            const isVisible = (avgLongitude >= minLongitude && avgLongitude <= maxLongitude) &&
                (avgLatitude >= minLatitude && avgLatitude <= maxLatitude) &&
                (depth >= minDepth && depth <= maxDepth);

            entity.show = isVisible;

            // Search for the row by ID instead of relying on position matching
            for (let i = 1; i < rows.length; i++) { // Start from 1 to skip header row
                const rowId = rows[i].cells[rows[i].cells.length - 1].textContent; // Get ID from the last cell
                if (rowId === id) {
                    rows[i].style.display = isVisible ? '' : 'none';
                    break; // Stop looping once the correct row is found and processed
                }
            }
        });
    }




    function updateFilterRectangle() {
        const minLon = parseFloat(document.getElementById('minLongitude').value);
        const maxLon = parseFloat(document.getElementById('maxLongitude').value);
        const minLat = parseFloat(document.getElementById('minLatitude').value);
        const maxLat = parseFloat(document.getElementById('maxLatitude').value);

        filterRectangle.rectangle.coordinates = Cesium.Rectangle.fromDegrees(minLon, minLat, maxLon, maxLat);
    }

    document.getElementById('minLongitude').addEventListener('input', function () {
        updateVisibility(geoJsonEntities, lineList);
        updateFilterRectangle();
    });
    document.getElementById('maxLongitude').addEventListener('input', function () {
        updateVisibility(geoJsonEntities, lineList);
        updateFilterRectangle();
    });

    document.getElementById('minLatitude').addEventListener('input', function () {
        updateVisibility(geoJsonEntities, lineList);
        updateFilterRectangle();
    });

    document.getElementById('maxLatitude').addEventListener('input', function () {
        updateVisibility(geoJsonEntities, lineList);
        updateFilterRectangle();
    });
    //document.getElementById('minDepth').addEventListener('input', updateFilterRectangle);
    //document.getElementById('maxDepth').addEventListener('input', updateFilterRectangle);
});

// Unpdate min, max color labels.
function updateLabels() {
    const selector = document.getElementById('colorSelector');
    const minColorInput = document.getElementById('minColor');
    const maxColorInput = document.getElementById('maxColor');
    const minColorLabel = document.getElementById('minColorLabel');
    const maxColorLabel = document.getElementById('maxColorLabel');
    const minColorUnit = document.getElementById('minColorUnit');
    const maxColorUnit = document.getElementById('maxColorUnit');
    const colorNote = document.getElementById('colorBarNote');

    let unit = '';
    let note = '';
    switch (selector.value) {
        case 'DepthColorMap':
            unit = ' km';
            minColorInput.disabled = false;
            maxColorInput.disabled = false;
            break;
        case 'DipColorMap':
            unit = ' °';
            minColorInput.disabled = false;
            maxColorInput.disabled = false;
            break;
        case 'RakeColorMap':
            unit = ' °';
            minColorInput.disabled = false;
            maxColorInput.disabled = false;
            note = "Note: Aki & Richards (1980) convention is used for rake"
            break;
        default:
            unit = '';
            minColorInput.value = "";
            minColorInput.disabled = true;
            maxColorInput.value = "";
            maxColorInput.disabled = true;
            break;
    }


    minColorUnit.textContent = unit;
    maxColorUnit.textContent = unit;
    colorNote.textContent = note;
}

// Call updateLabels on page load to set initial values
window.onload = updateLabels;

// Make the map go full screen.
function toggleFullScreen() {
    const elem = document.getElementById('mapContainer');
    alert("Press Esc to exit full screen")

    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { // Firefox
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // IE/Edge
            elem.msRequestFullscreen();
        }
        instructions.style.display = 'block';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
        instructions.style.display = 'none';
    }
}


