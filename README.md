# Community Fault Model (CFM) Web Interface

The **Community Fault Model (CFM) Web Interface** is a FastAPI-based platform for visualizing and exploring 2D and 3D fault models of the Cascadia Subduction Zone. This project integrates [CesiumJS](https://cesium.com/platform/cesiumjs) for interactive mapping and provides tools for filtering, visualizing, and downloading fault model data.

## Deployed Environments

| Environment | URL | Status |
|---|---|---|
| Production | [cfm.cascadiaquakes.org](https://cfm.cascadiaquakes.org/) | Live (pending cutover to new infra) |
| Dev | [App Runner dev instance](https://x2b8mq8atm.us-west-2.awsapprunner.com) | Live |

## Features

- **Interactive Visualization** — Explore and select fault traces in a 2D map view, then visualize selected faults in a 3D viewer powered by CesiumJS.
- **Dynamic Filtering** — Filter faults by latitude, longitude, and depth ranges. Customize fault coloring based on attributes like depth, dip, or rake.
- **Data Integration** — Download fault model data directly from the application. Load auxiliary and [CVM model boundary datasets](https://cvm.cascadiaquakes.org/).

## Local Development

```bash
git clone https://github.com/cascadiaquakes/CRESCENT-CFM-WEB.git
cd CRESCENT-CFM-WEB

docker build -t cfm-viewer .

# Create .env with your Cesium ion token (avoids shell quoting issues)
echo 'CESIUM_KEYS={"cesium_access_token":"your_token_here"}' > .env
docker run --env-file .env -p 8080:80 cfm-viewer
```

Access at [http://localhost:8080](http://localhost:8080). Ensure `.env` is in `.gitignore`.

## Configuration

The application relies on configuration files in `app/static/config/`:

- **`repository_config.js`** — Dataset URLs, color mappings, and visualization settings. Key arrays: `cfmTraceData` (fault traces), `cfmData` (fault surfaces), `auxData` (auxiliary datasets).
- **`project.json`** — Address of the fault trace file displayed on the 2D map.

CVM metadata files in `app/static/json/` are automatically included in the 3D viewer's CVM selection box. See the [CVM-Tools User Guide](https://cascadiaquakes.github.io/cvm-tools-book/usage/netcdf_to_geocsv.html) for creating valid metadata files.

## Usage

**2D Fault Viewer** — Navigate to the homepage, use sliders to filter by latitude/longitude/depth, and click fault traces for descriptions.

**3D Fault Viewer** — Select faults via checkboxes, click "View 3D" to load them. Toggle terrain occlusion, boundary lines, and earthquakes from the control panel.

**Downloads** — Navigate to the "Download Models" section for fault datasets.

## Project Structure

```
CRESCENT-CFM-WEB/
├── .github/workflows/        # CI/CD pipelines
├── app/
│   ├── static/
│   │   ├── config/           # repository_config.js, project.json
│   │   ├── css/
│   │   ├── images/
│   │   ├── js/
│   │   └── json/             # CVM metadata files
│   ├── templates/            # Jinja2 HTML templates
│   ├── main.py               # FastAPI entry point
│   └── routes.py             # API endpoints and page routes
├── cfm-infra/                # AWS CDK infrastructure
├── Dockerfile
├── requirements.txt
└── README.md
```

## Deployment and CI/CD

This repo includes GitHub Actions workflows and AWS CDK infrastructure for automated deployment to App Runner in `us-west-2`. Infrastructure code lives in `cfm-infra/`, and workflow definitions live in `.github/workflows/`.

**Workflows:**

- **CI** (`ci.yml`) — Lints, builds, and smoke-tests the container on every push and PR.
- **Deploy Dev** (`deploy-dev.yml`) — Builds the image, pushes to ECR, and updates the App Runner dev service on push to `dev`.
- **Deploy Infrastructure** (`deploy-infra.yml`) — Manual trigger for CDK stack updates.

**Pipeline flow:**

```
Push to dev → CI (lint + build + smoke test) → Deploy Dev (ECR push → App Runner update)
```

Authentication uses GitHub Actions OIDC as no long-lived AWS credentials are stored in the repository. The Cesium ion token and service ARNs are managed as GitHub repository secrets.

For detailed infrastructure notes, see `cfm-infra/`.

## Help and Support

[Submit a Question or Request Help](https://cfm.cascadiaquakes.org/request)