"""Convert the CFM point layers (File Geodatabase) to GeoJSON for the 2D viewer.

Needs pyogrio and pandas; the app itself doesn't use them.

    python scripts/points_gdb_to_geojson.py CFM_PD_Draft2.gdb app/static/point_data
"""

import json
import re
import sys
from pathlib import Path

import pandas as pd
import pyogrio

# gdb layer -> output file
LAYERS = {
    "CFM_EarthquakeHistorySites": "earthquake_history_sites.geojson",
    "CFM_SlipRateSites": "slip_rate_sites.geojson",
}

# gdb field -> popup label. Unlisted fields keep their name, underscores as spaces.
LABELS = {
    "SiteName": "Site",
    "FaultName": "Fault",
    "CFM_EQ_OBJ_ID": "Site ID",
    "CFM_SR_OBJ_ID": "Site ID",
    "CFM_ID": "CFM ID",
    "WGS_ID": "WGS ID",
    "usgs_qffd_": "USGS QFFD #",
    "nshm23_id": "NSHM23 ID",
    "Number_of_Events": "Number of events",
    "MRE_Max_age_yrs_BP_": "Most recent event, max age (yr BP)",
    "MRE_Min_age_yrs_BP_": "Most recent event, min age (yr BP)",
    "MRE_Ave_age_yrs_BP_": "Most recent event, mean age (yr BP)",
    "EQ_Events": "Events",
    "CALIBRATED_AGE": "Calibrated age",
    "MODELED_AGE": "Modeled age",
    "PrefRate_mm_yr": "Preferred rate (mm/yr)",
    "Min_Rate_mm_yr": "Min rate (mm/yr)",
    "Max_Rate_mm_yr": "Max rate (mm/yr)",
    "DatingMethod": "Dating method",
    "SlipRateTimeCategory": "Time span",
    "Reference_Code": "Reference code",
    "Peer_Reviewed": "Peer reviewed",
    "Peer_Reviewed_Y_N_": "Peer reviewed",
}
SKIP = {"Longitude", "Latitude"}  # already in the geometry
EMPTY = {"", "N/A", "<Null>"}


def label(field):
    field = re.sub(r"_+", "_", field)  # the two layers differ in doubled underscores
    return LABELS.get(field, field.replace("_", " ").strip())


def rank(name):
    """Popup order: fault and site first, cross-reference IDs last."""
    if name in ("Fault", "Site"):
        return 0
    return 2 if name.endswith((" ID", " #")) else 1


def clean(value):
    """Blank placeholders become None; whole numbers lose the trailing .0."""
    if isinstance(value, str):
        value = value.strip()
        return None if value in EMPTY else value
    if pd.isna(value):
        return None
    value = float(value)
    return int(value) if value.is_integer() else value


def to_features(frame):
    fields = [c for c in frame.columns if c != "geometry" and c not in SKIP]
    fields.sort(key=lambda f: rank(label(f)))
    for _, row in frame.iterrows():
        props = {label(f): clean(row[f]) for f in fields}
        yield {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [round(row.geometry.x, 6), round(row.geometry.y, 6)],
            },
            "properties": {k: v for k, v in props.items() if v is not None},
        }


def main(gdb, out_dir):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    for layer, name in LAYERS.items():
        frame = pyogrio.read_dataframe(gdb, layer=layer).to_crs(4326)
        collection = {"type": "FeatureCollection", "features": list(to_features(frame))}
        (out_dir / name).write_text(
            json.dumps(collection, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
        )
        print(f"{name}: {len(collection['features'])} sites")


if __name__ == "__main__":
    main(*sys.argv[1:3])
