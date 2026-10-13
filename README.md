# Community Fault Model (CFM) Web Interface

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.15021860.svg)](https://doi.org/10.5281/zenodo.15021860)
[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](LICENSE)

The **Community Fault Model (CFM) Web Interface** is a FastAPI-based platform for visualizing and exploring 2D and 3D fault models of the Cascadia Subduction Zone. This project integrates [CesiumJS](https://cesium.com/platform/cesiumjs) for interactive mapping and provides tools for filtering, visualizing, and downloading fault model data.

**Live viewer:** https://cfm.cascadiaquakes.org

| Environment | URL | Hosting |
|---|---|---|
| Production | [cfm.cascadiaquakes.org](https://cfm.cascadiaquakes.org/) | ECS Express Mode |
| Dev | [dev.cfm.cascadiaquakes.org](https://dev.cfm.cascadiaquakes.org/) | App Runner |

---

## Documentation

The [CFM book](https://cascadiaquakes.github.io/cfm-book/) has the user guide, fault model inclusion criteria, data downloads, and related tools. The viewer's `/guide` page redirects to its [user guide](https://cascadiaquakes.github.io/cfm-book/user-guide/).

---

## Features

- **Interactive visualization**: explore and select fault traces in a 2D map view, then visualize selected faults in a 3D viewer powered by CesiumJS.
- **Selection tools**: lasso faults on the map or click a legend entry to select a whole group; View 3D carries the selection over.
- **Dynamic filtering**: filter faults by latitude, longitude, and depth ranges. Customize fault coloring based on attributes like depth, dip, or rake.
- **Data integration**: download fault model data directly from the application. Overlay USGS earthquakes (ComCat, M ≥ 3), subducting plate surfaces, and US/Canada boundaries.

### Usage

**2D Fault Viewer**: navigate to the homepage, use sliders to filter by latitude/longitude/depth, and click fault traces for descriptions.

**3D Fault Viewer**: select faults via checkboxes, click "View 3D" to load them. Toggle satellite imagery (and hide below ground), boundary lines, and earthquakes from the control panel. Click an earthquake for its ComCat details.

**Downloads**: use the [downloads page](https://cfm.cascadiaquakes.org/downloads), or *Download (1 km)* in the 2D viewer for selected faults.

---

## Data

- **Fault model**: traces and surfaces from [CRESCENT-CFM](https://github.com/cascadiaquakes/CRESCENT-CFM), configured in `app/static/config/`.
- **Earthquakes**: USGS ComCat, M ≥ 3.
- **Subducting plate surface**: Slab2 (Hayes et al., 2018).
- **Political boundaries**: Natural Earth 1:10m in `app/static/boundary_geojson/`; see the README there for how they were built.

---

## Running Locally

```bash
git clone https://github.com/cascadiaquakes/CRESCENT-CFM-WEB.git
cd CRESCENT-CFM-WEB

docker build -t cfm-viewer .

# Create .env with your Cesium ion token (avoids shell quoting issues)
echo 'CESIUM_KEYS={"cesium_access_token":"your_token_here"}' > .env
docker run --env-file .env -p 8080:80 cfm-viewer
```

Access at [http://localhost:8080](http://localhost:8080). Ensure `.env` is in `.gitignore`.

### Configuration

The application relies on configuration files in `app/static/config/`:

- **`repository_config.js`**: dataset URLs, color mappings, and visualization settings. Key arrays: `cfmTraceData` (fault traces), `cfmData` (fault surfaces), `auxData` (auxiliary datasets).
- **`project.json`**: address of the fault trace file displayed on the 2D map.

The 3D viewer reads its Cesium ion token from `/get-token`, which serves `CESIUM_KEYS`. Imagery and terrain fall back to Bing aerial and Cesium World Terrain if the preferred Ion assets aren't in the account.

---

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

---

## Deployment and CI/CD

This repo includes GitHub Actions workflows and AWS CDK infrastructure in `us-west-2`. Dev runs on App Runner and production on ECS Express Mode. Infrastructure code lives in `cfm-infra/`, and workflow definitions live in `.github/workflows/`.

**Workflows:**

- **CI** (`ci.yml`): lints, builds, and smoke-tests the container on every push and PR.
- **Deploy Dev** (`deploy-dev.yml`): builds the image, pushes to ECR, and updates the App Runner dev service on push to `dev`.
- **Deploy Production** (`deploy-prod.yml`): manual trigger. Builds the image and updates the ECS Express Mode service behind cfm.cascadiaquakes.org.
- **Deploy Infrastructure** (`deploy-infra.yml`): manual trigger for CDK stack updates.

**Pipeline flow:**

```
Push to dev → CI (lint + build + smoke test) → Deploy Dev (ECR push → App Runner update)
Manual dispatch → Deploy Production (ECR push → ECS Express Mode update)
```

**Custom domains:** both live in the `cfm.cascadiaquakes.org` Route 53 zone. `dev.cfm` is an App Runner custom domain (CNAME to the service URL, plus ACM validation records). It is set up with `aws apprunner associate-custom-domain`, not CDK, since CloudFormation has no resource for it.

Authentication uses GitHub Actions OIDC as no long-lived AWS credentials are stored in the repository. The Cesium ion token and service ARNs are managed as GitHub repository secrets.

For detailed infrastructure notes, see `cfm-infra/`.

---

## How to Cite

If you use the viewer, please cite:

> Bahavar, M., Styron, R., Streig, A., Thomas, A., Bachelot, L., & CRESCENT CFM working group. (2025). *The Cascadia Region Earthquake Science Center (CRESCENT) Community Fault Model viewer* (v1.0.1). Zenodo. https://doi.org/10.5281/zenodo.15021860

For the fault model itself, see [CRESCENT-CFM](https://github.com/cascadiaquakes/CRESCENT-CFM).

---

## License

This project is licensed under the BSD 3-Clause License. See [LICENSE](LICENSE).

---

## Contacts

- **Amanda M. Thomas**, University of California, Davis: [amthom@ucdavis.edu](mailto:amthom@ucdavis.edu)
- **Rebecca Fildes**, Western Washington University and University of California, Davis: [fildesr@wwu.edu](mailto:fildesr@wwu.edu)
- **William Marfo**, University of California, Davis: [wmarfo@ucdavis.edu](mailto:wmarfo@ucdavis.edu)
- **Loïc Bachelot**, University of Oregon: [lbachelo@uoregon.edu](mailto:lbachelo@uoregon.edu)

You can also [submit a question](https://cfm.cascadiaquakes.org/request) or [open an issue](https://github.com/cascadiaquakes/CRESCENT-CFM-WEB/issues).

---

## Acknowledgments

<table>
  <tr>
    <td align="center" valign="middle">
      <img src="https://raw.githubusercontent.com/cascadiaquakes/.github/main/assets/crescent-circle.png" alt="CRESCENT Logo" width="150" />
    </td>
    <td align="center" valign="middle">
      <img src="https://raw.githubusercontent.com/cascadiaquakes/.github/main/assets/nsf-logo.png" alt="NSF Logo" width="450" />
    </td>
  </tr>
</table>

This project is supported by the National Science Foundation through the Cascadia Region Earthquake Science Center (CRESCENT), Cooperative Agreement EAR-2225286.
