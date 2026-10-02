# Community Fault Model (CFM) Web Interface

The **Community Fault Model (CFM) Web Interface** is a FastAPI-based platform for visualizing and exploring 2D and 3D fault models of the Cascadia Subduction Zone. This project integrates [CesiumJS](https://cesium.com/platform/cesiumjs) for interactive mapping and provides tools for filtering, visualizing, and downloading fault model data.

## Deployed Environments

| Environment | URL | Status |
|---|---|---|
| Production | [cfm.cascadiaquakes.org](https://cfm.cascadiaquakes.org/) | Live (ECS Express Mode) |
| Dev | [dev.cfm.cascadiaquakes.org](https://dev.cfm.cascadiaquakes.org/) | Live (App Runner) |

Documentation and user guide: [cascadiaquakes.github.io/cfm-book](https://cascadiaquakes.github.io/cfm-book/)

## Features

- **Interactive Visualization** — Explore and select fault traces in a 2D map view, then visualize selected faults in a 3D viewer powered by CesiumJS.
- **Dynamic Filtering** — Filter faults by latitude, longitude, and depth ranges. Customize fault coloring based on attributes like depth, dip, or rake.
- **Data Integration** — Download fault model data directly from the application. Overlay USGS earthquakes (ComCat, M ≥ 3), subducting plate surfaces, and US/Canada boundaries.

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

Political boundaries in `app/static/boundary_geojson/` come from Natural Earth 1:10m; see the README there for how they were built.

The 3D viewer reads its Cesium ion token from `/get-token`, which serves `CESIUM_KEYS`. Imagery and terrain fall back to Bing aerial and Cesium World Terrain if the preferred Ion assets aren't in the account.

## Usage

**2D Fault Viewer** — Navigate to the homepage, use sliders to filter by latitude/longitude/depth, and click fault traces for descriptions.

**3D Fault Viewer** — Select faults via checkboxes, click "View 3D" to load them. Toggle satellite imagery (and hide below ground), boundary lines, and earthquakes from the control panel. Click an earthquake for its ComCat details.

**Downloads** — Use the [downloads page](https://cfm.cascadiaquakes.org/downloads), or *Download (1 km)* in the 2D viewer for selected faults.

The full user guide is in the [CFM book](https://cascadiaquakes.github.io/cfm-book/user-guide/); `/guide` redirects there.

## Project Structure

```
CRESCENT-CFM-WEB/
├── .github/workflows/        # CI/CD pipelines
├── app/
│   ├── static/
│   │   ├── boundary_geojson/ # US/Canada boundaries (Natural Earth 10m)
│   │   ├── config/           # repository_config.js, project.json
│   │   ├── css/
│   │   ├── images/
│   │   ├── js/
│   │   └── json/             # CVM metadata (legacy, not shown in the 3D viewer)
│   ├── templates/            # Jinja2 HTML templates
│   ├── main.py               # FastAPI entry point
│   └── routes.py             # API endpoints and page routes
├── cfm-infra/                # AWS CDK infrastructure
├── Dockerfile
├── requirements.txt
└── README.md
```

## Deployment and CI/CD

This repo includes GitHub Actions workflows and AWS CDK infrastructure in `us-west-2`. Dev runs on App Runner and production on ECS Express Mode. Infrastructure code lives in `cfm-infra/`, and workflow definitions live in `.github/workflows/`.

**Workflows:**

- **CI** (`ci.yml`) — Lints, builds, and smoke-tests the container on every push and PR.
- **Deploy Dev** (`deploy-dev.yml`) — Builds the image, pushes to ECR, and updates the App Runner dev service on push to `dev`.
- **Deploy Production** (`deploy-prod.yml`) — Manual trigger. Builds the image and updates the ECS Express Mode service behind cfm.cascadiaquakes.org.
- **Deploy Infrastructure** (`deploy-infra.yml`) — Manual trigger for CDK stack updates.

**Pipeline flow:**

```
Push to dev → CI (lint + build + smoke test) → Deploy Dev (ECR push → App Runner update)
Manual dispatch → Deploy Production (ECR push → ECS Express Mode update)
```

**Custom domains:** both live in the `cfm.cascadiaquakes.org` Route 53 zone. `dev.cfm` is an App Runner custom domain (CNAME to the service URL, plus ACM validation records). It is set up with `aws apprunner associate-custom-domain`, not CDK, since CloudFormation has no resource for it.

Authentication uses GitHub Actions OIDC as no long-lived AWS credentials are stored in the repository. The Cesium ion token and service ARNs are managed as GitHub repository secrets.

For detailed infrastructure notes, see `cfm-infra/`.

## Help and Support

See the [CFM book](https://cascadiaquakes.github.io/cfm-book/) for documentation and project contacts, or [submit a question](https://cfm.cascadiaquakes.org/request).