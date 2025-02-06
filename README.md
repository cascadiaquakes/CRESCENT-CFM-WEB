# Community Fault Model (CFM) Web Interface

The **Community Fault Model (CFM) Web Interface** is a FastAPI-based platform for visualizing and exploring 2D and 3D fault models of the Cascadia Subduction Zone. This project integrates **[CesiumJS](https://cesium.com/platform/cesiumjs)** for interactive mapping and provides tools for filtering, visualizing, and downloading fault model data.

## Deployed Website

Visit the live application here: **[https://cfm.cascadiaquakes.org/](https://cfm.cascadiaquakes.org/)**

If you have questions or need help with the site, submit a request here: **[Submit a Question or Request Help](https://cfm.cascadiaquakes.org/request)**

## Features

- **Interactive Visualization**:
  - Explore and select fault traces in a 2D map view.
  - Visualize the selected faults in a 3D viewer powered by **[CesiumJS](https://cesium.com/platform/cesiumjs)**.
- **Dynamic Filtering on 2D Map**:
  - Filter faults by latitude, longitude, and depth ranges.
  - Customize fault coloring based on attributes like depth, dip, or rake.
- **Data Integration**:
  - Download fault model data directly from the web application.
  - Seamlessly load auxiliary and **[CVM model boundary datasets](https://cvm.cascadiaquakes.org/)**.

## Configuration Files

The application relies on two key configuration files located in the `app/static/config/` directory:

1. **`repository_config.js`**:
   - Defines dataset URLs, color mappings, and visualization settings.
   - Key data arrays include:
        - `cfmTraceData` array that contains URLs of **GeoJSON fault traces**. These traces are displayed on both the **2D map** and the **3D viewer**, providing a simplified representation of fault lines.
        - `cfmData` array that holds URLs of **GeoJSON fault surfaces**. These surfaces are displayed on the **3D map**, allowing users to explore 3D representations of fault models.
        - `auxData`array that contains URLs to **2D GeoJSON model files** that appear in the **2D surfaces selection box** under the **3D viewer's control panel**. These surfaces represent auxiliary datasets that can be toggled on the 3D viewer.

2. **`project.json`**:
   - This file must include the address of the fault trace file to be displayed on the **2D map**.

## CVM Metadata Files

The directory `app/static/json/` includes the **CVM JSON metadata files**. Any valid CVM model metadata file placed in this directory will automatically be included in the **3D viewer's CVM selection box**.

### Adding a CVM Model
- To include a CVM model in the application, place its corresponding JSON metadata file in the `app/static/json/` directory.
- A valid CVM model metadata file can be created from CVM netCDF files using the **CVM-Tools**. For detailed instructions, consult the [CVM-Tools User Guide](https://cascadiaquakes.github.io/cvm-tools-book/usage/netcdf_to_geocsv.html).

## Running the Application with Docker

### Prerequisites
- Install [Docker](https://docs.docker.com/get-docker/).

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/cascadiaquakes/crescent-cfm.git
   cd crescent-cfm
   ```

2. **Ensure you are in the root directory of the application**, then build the Docker image::
   ```bash
   docker build -t cfm_viewer .
   ```

3. Run the application:
   - To run in detached mode:
     ```bash
     docker run -d -p 8080:80 -v $(pwd)/app:/app cfm_viewer
     ```
   - To run interactively:
     ```bash
     docker run -p 8080:80 -v $(pwd)/app:/app cfm_viewer
     ```

4. Access the application:
   - Open your browser and go to [http://localhost:8080](http://localhost:8080).

## Usage

### 2D Fault Viewer
- Navigate to the homepage.
- Use the sliders to filter faults by latitude, longitude, or depth.
- Click on fault traces to view their descriptions.

### 3D Fault Viewer
- Select faults in the 2D view using the checkboxes and click "View 3D" to load them in the 3D viewer.
- On the 3d-Viewer, use the controls to toggle terrain occlusion, boundary lines, and earthquakes.

### Downloading Models
- Navigate to the "Download Models" section to access fault datasets.

### Help and Support
- **[Submit a Question or Request Help](https://cfm.cascadiaquakes.org/request)**:
  Reach out to the team for any questions or assistance related to the application.

## Project Structure

### Key Files and Directories

#### Templates
- **`app/templates/cfm_page.html`**:
  - Base template defining the main structure and layout of the application.
- **`app/templates/index.html`**:
  - Homepage template featuring the 2D fault map and filtering controls.
- **`app/templates/view3d.html`**:
  - Template for the 3D fault viewer, including terrain and earthquake visualization controls.

#### Routes
- **`app/routes.py`**:
  - Defines API endpoints for rendering pages, handling form submissions, and serving GeoJSON data.

#### Static Assets
- **`app/static/config/repository_config.js`**:
  - Configuration file containing dataset URLs, color mappings, and application settings.
- **`app/static/json/`**:
  - Contains JSON metadata files for CVM models. Add valid metadata files here to include them in the CVM selection box in the 3D viewer.

