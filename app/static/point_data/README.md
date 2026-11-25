# Point layers (2D viewer, draft)

Earthquake history sites and slip rate sites from the CFM working group's draft point database (`CFM_PD_Draft2.gdb`). The fields are still changing, so the two overlays only show when the viewer is not running as production.

Rebuild both files from a new geodatabase with:

```bash
python scripts/points_gdb_to_geojson.py CFM_PD_Draft2.gdb app/static/point_data
```

The script keeps every field, renames them to the labels shown in the popup, puts fault and site first and the cross-reference IDs last, and drops empty values and placeholders (`N/A`, `<Null>`). The popup lists whatever fields a file has, so a new field needs no viewer change.
