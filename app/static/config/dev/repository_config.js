// CVM area display parameters.
const cvmAreaOutlineColor = [Cesium.Color.CYAN];
const cvmAreaFaceColor = [Cesium.Color.CYAN];
const cvmAreaLabel = ["CVM & Study (—) Areas; Filters (- -)"];
const cvmAreaFillOpacity = [0.1];

// Configuration.
Cesium.Ion.defaultAccessToken = "your_access_token";

// Study area.
const west = -130;
const south = 39;
const east = -116;
const north = 52;

// Initial view settings
const initialFlyTO = [-132.76, 39.84, 3500000]; // Increase the altitude value to zoom out
const initialHeading = 48.65;
const initialPitch = -75;
const initialRoll = 0.3;

// Logo file
const logoFile = "/static/images/crescent_logos_horizontal_transparent.png";

// Earthquakes
const eqQueryUrl = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=1970-01-01&minmagnitude=4&minlatitude=' + south + '&maxlatitude=' + north + '&minlongitude=' + west + '&maxlongitude=' + east;
const eqLabel = ['Earthquakes (M ≥ 4), Circle Size ∝ Magnitude'];
const eqColor = Cesium.Color.YELLOW;
const eqMarker = ["circle"];

// NOTE: if you change any of the following colors, you must change the corresponding selection box rgb color in the index file under modelSelectionPanel.
const cesiumColorList = [
    Cesium.Color.CYAN,
    Cesium.Color.RED,
    Cesium.Color.GREEN,
    Cesium.Color.BLUE,
    Cesium.Color.YELLOW,
    Cesium.Color.WHITE,
    Cesium.Color.BROWN,
    Cesium.Color.PURPLE,
    Cesium.Color.PINK
];

// CVM display parameters.
const cvmOutlineColor = Cesium.Color.BLUE;
const cvmFaceColor = Cesium.Color.BLUE;
const cvmLabel = ["CVM Coverage"];
const cvmColor = [cvmFaceColor];
const cvmMarker = ["rectangle"];
const cvmLineWidth = 4;


// Auxiliary data.
const auxData = ["https://raw.githubusercontent.com/cascadiaquakes/crescent-cfm/dev/crescent_cfm_files/cascadia_subduction_interface_temp.geojson",
    "https://raw.githubusercontent.com/cascadiaquakes/crescent-cfm/dev/crescent_cfm_files/casie21_plate_boundary_multipart.geojson",
    "https://raw.githubusercontent.com/cascadiaquakes/crescent-cfm/dev/crescent_cfm_files/mcrory_2012_cascadia_interface.geojson",
    "https://raw.githubusercontent.com/cascadiaquakes/crescent-cfm/dev/crescent_cfm_files/slab2_cascadia_interface_multipart.geojson"
];
const auxLabel = ["Cascadia subduction interface - Graham et al., 2018", "Cascadia plate boundary - Carbotte et al., 2024", "Cascadia plate boundary - McRory et al., 2012.", "Cascadia plate boundary from Slab2 - Hayes et al., 2018"];
const auxColor = [Cesium.Color.OLIVE.withAlpha(0.7), Cesium.Color.SIENNA.withAlpha(0.7), Cesium.Color.SANDYBROWN.withAlpha(0.7), Cesium.Color.GREEN.withAlpha(0.7)];
const auxFillOpacity = [0.3, 0.3, 0.3, 0.3];
const auxLineWidth = [4, 4, 4, 4];
const auxMarker = ["rectangle", "rectangle", "rectangle", "rectangle"];

// Boundary data.
const boundaryData = [
    '/static/boundary_geojson/us-states.json',
    '/static/boundary_geojson/georef-canada-province-public.geojson'
];
const boundaryLabel = ['US', 'Canada'];
const boundaryColor = [Cesium.Color.GRAY, Cesium.Color.DIMGRAY];
const boundaryFillOpacity = [0.0, 0.0];
const boundaryLineWidth = [2, 0.5];
const boundaryMarker = ["line"];

const zoomOutFactor = 2.0; // Increased zoom out factor for better visibility

// CFM data
const cfmData = ['https://raw.githubusercontent.com/cascadiaquakes/crescent-cfm/dev/crescent_cfm_files/crescent_cfm_crustal_3d.geojson'];
const cfmLabel = ['Cascadia Fault Surfaces'];
const cfmColor = [Cesium.Color.DARKMAGENTA];
const cfmFillOpacity = [0.5];
const cfmLineWidth = [2];
const cfmMarker = ["rectangle"];

// CFM Trace data
const cfmTraceData = ['https://raw.githubusercontent.com/cascadiaquakes/crescent-cfm/dev/crescent_cfm_files/crescent_cfm_crustal_traces.geojson'];
const cfmTraceLabel = ['Cascadia Fault Traces'];
const cfmTraceColor = [Cesium.Color.CRIMSON];
const cfmTraceFillOpacity = [0.5];
const cfmTraceLineWidth = [2];
const cfmTraceMarker = ["line"];

// Map labels to checkboxes on the HTML page.
const dataSourceCheckboxMapping = {
    'Cascadia Fault Traces': 'toggleCFMTraceCheckbox',
    'Cascadia Fault Surfaces': 'toggleCFMCheckbox'
};

// Legends
const primaryLegendLabel = cfmLabel.concat(cfmTraceLabel);
const primaryLegendColor = cfmColor.concat(cfmTraceColor);
const auxLegendLabel = cvmAreaLabel.concat(cvmLabel).concat(eqLabel);//.concat(boundaryLabel);
const auxLegendColor = cvmAreaOutlineColor.concat(cvmColor).concat(eqColor);//.concat(boundaryColor);

// Legacy support.
const data = cfmData.concat(cfmTraceData)
const label = cfmLabel.concat(cfmTraceLabel)

const dataColor = cfmColor.concat(cfmTraceColor)
const fillOpacity = cfmFillOpacity.concat(cfmFillOpacity)
const lineWidth = cfmLineWidth.concat(cfmTraceLineWidth);
const marker = cfmMarker.concat(cfmTraceMarker)

// Check if Cesium.Ion.defaultAccessToken is not set or is using the placeholder token.
// using a synchronous XHR request, ensuring that the Cesium token is fetched and 
// set before any further processing. This will block the browser until the token 
// is fetched, but it guarantees that the token is available before proceeding.
// Synchronous XHR is deprecated and will block page rendering, so this method 
// should only be used as a last resort.However, it guarantees that the token 
// is set before any dependent scripts run. Our fetch is quick and is OK to use.
if (!Cesium.Ion.defaultAccessToken || Cesium.Ion.defaultAccessToken === "your_access_token") {
    console.log("Cesium access token not set or is using the placeholder token. Retrieving from server..." + Cesium.Ion.defaultAccessToken);

    try {
        // Create a synchronous XHR request to fetch the token
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/get-token', false);  // `false` makes the request synchronous
        xhr.send();

        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            Cesium.Ion.defaultAccessToken = data.token;
            console.log("Cesium access token set successfully.");// + Cesium.Ion.defaultAccessToken);
        } else {
            throw new Error("Failed to fetch Cesium access token from server.");
        }
    } catch (error) {
        console.error("Error fetching Cesium access token:", error);
    }
} else {
    console.log("Cesium access token is already set and valid.");
}
