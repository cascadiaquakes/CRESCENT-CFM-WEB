import os
import boto3

from fastapi import HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse

from fastapi import APIRouter, Request, Form, Query
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from PIL import Image, ImageDraw
from io import BytesIO

from datetime import datetime, timezone
import json
import logging
import httpx
import re
import socket


router = APIRouter()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
JSON_DIR = os.path.join(BASE_DIR, 'static', 'json')
NETCDF_DIR = os.path.join(BASE_DIR, 'static', 'netcdf')

# Define the configuration directory and file path
CONFIG_DIR = os.path.join(BASE_DIR, 'static', 'config')
REPOSITORY_FILE = "project.json"

# Construct the full path to the project file
repository_file_path = os.path.join(CONFIG_DIR, REPOSITORY_FILE)

# Read the JSON file
with open(repository_file_path, "r") as jsonfile:
    config = json.load(jsonfile)

# logging.error(f"[INFO] repository config parameters {config}")
geojson_url = config["cfmTraceFile"]

# Templates
templates = Jinja2Templates(directory="templates")


def utc_now(): 
    """Return the current UTC time."""
    try:
        _utc = datetime.now(tz=timezone.utc)
        utc = {
            "date_time": _utc.strftime("%Y-%m-%dT%H:%M:%S"),
            "datetime": _utc,
            "epoch": _utc.timestamp(),
        }
        return utc
    except: 
        logging.error(f"[ERR] Failed to get the current UTC time")
        raise

def standard_units(unit):
    """Check an input unit and return the corresponding standard unit."""
    unit = unit.strip().lower()
    if unit in ["m", "meter"]:
        return "m"
    elif unit in ["degrees", "degrees_east", "degrees_north"]:
        return "degrees"
    elif unit in ["km", "kilometer"]:
        return "km"
    elif unit in ["g/cc", "g/cm3", "g.cm-3", "grams.centimeter-3"]:
        return "g/cc"
    elif unit in ["kg/m3", "kh.m-3"]:
        return "kg/m3"
    elif unit in ["km/s", "kilometer/second", "km.s-1", "kilometer/s", "km/s"]:
        return "km/s"
    elif unit in ["m/s", "meter/second", "m.s-1", "meter/s", "m/s"]:
        return "m/s"
    elif unit.strip().lower in ["", "none"]:
        return ""

def create_error_image(message: str) -> BytesIO:
    """Generate an image with an error message."""
    # Create an image with white background
    img = Image.new('RGB', (600, 100), color = (255, 255, 255))
    
    # Initialize the drawing context
    d = ImageDraw.Draw(img)
    
    # Optionally, add a font (this uses the default PIL font)
    # For custom fonts, use ImageFont.truetype()
    # font = ImageFont.truetype("arial.ttf", 15)
    
    # Add text to the image
    d.text((10,10), message, fill=(255,0,0))  # Change coordinates and color as needed
    
    # Save the image to a bytes buffer
    img_io = BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    image_data = img_io.read()  # Read the entire stream content, which is the image data

    return image_data

@router.get("/get-token")
async def get_cesium_key(request: Request):
    """This must be secured lated to avoid external"""

    # Only internal requests are accepted.
    if os.getenv("CESIUM_KEYS") is None:
        logging.warning(f"[INFO] get-token Failed")
        return {"token": "your_access_token"}
    else:
        CESIUM_KEYS = json.loads(os.getenv("CESIUM_KEYS"))
        access_token = CESIUM_KEYS["cesium_access_token"]
        return {"token": access_token}

# Route to serve favicon
@router.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("static/favicon.ico")
    
@router.post("/submitForm")
async def submit_form(
    name: str = Form(...),
    institution: str = Form(...),
    email: str = Form(...),
    message: str = Form(...),
):

    try:
        # Create SES client
        AWS_REGION = "us-east-2"
        SENDER_EMAIL = "manochehr.bahavar@earthscope.org"
        RECIPIENT_EMAIL = "manochehr.bahavar@earthscope.org"
        ses_client = boto3.client("ses", region_name=AWS_REGION)

        # Email content
        subject = "New Request from Form"
        body_text = f"Name: {name}\nEmail: {email}\nMessage: {message}"
        body_html = f"""<html>
        <head></head>
        <body>
        <h1>New Request</h1>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Message:</strong> {message}</p>
        </body>
        </html>
                    """

        response = ses_client.send_email(
            Destination={
                "ToAddresses": [
                    RECIPIENT_EMAIL,
                ],
            },
            Message={
                "Body": {
                    "Html": {
                        "Charset": "UTF-8",
                        "Data": body_html,
                    },
                    "Text": {
                        "Charset": "UTF-8",
                        "Data": body_text,
                    },
                },
                "Subject": {
                    "Charset": "UTF-8",
                    "Data": subject,
                },
            },
            Source=SENDER_EMAIL,
        )
    except Exception as e:
        # Log the exception if needed
        logging.error(f"[ERR] Error sending email: {e}")
    return HTMLResponse(content="<p>Form submitted successfully!</p>", status_code=200)


@router.get("/", response_class=HTMLResponse)
async def read_root(request: Request, branch: str = "main"):
    # Dynamically set CONFIG_DIR based on the branch
    if branch == "main":
        CONFIG_DIR = os.path.join(BASE_DIR, 'static', 'config')
    else:
        CONFIG_DIR = os.path.join(BASE_DIR, 'static', 'config', branch)
    # Define the repository file
    REPOSITORY_FILE = "project.json"
    repository_file_path = os.path.join(CONFIG_DIR, REPOSITORY_FILE)

    # Check if the config file exists, raise error if not
    if not os.path.isfile(repository_file_path):
        raise HTTPException(status_code=404, detail=f"Configuration file not found in {repository_file_path}")
    # Read and load the JSON file
    with open(repository_file_path, "r") as jsonfile:
        config = json.load(jsonfile)

    # Get the token from environment variables (internal access)
    CESIUM_KEYS = json.loads(os.getenv("CESIUM_KEYS", '{}'))
    access_token = CESIUM_KEYS.get("cesium_access_token", "your_access_token")

    # Logging the configuration
    # logging.error(f"[INFO] repository config parameters {config}")
    # Extract relevant config values
    geojson_url = config.get("cfmTraceFile")
    return templates.TemplateResponse("index.html",  {"request": request, "branch": branch, "access_token": access_token})
    
@router.get("/downloads", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("downloads.html", {"request": request})

@router.get("/3d", response_class=HTMLResponse)
async def read_root(request: Request, branch: str = "main"):
        # Get the token from environment variables (internal access)
    CESIUM_KEYS = json.loads(os.getenv("CESIUM_KEYS", '{}'))
    access_token = CESIUM_KEYS.get("cesium_access_token", "your_access_token")

    # Pass the branch parameter to the template
    return templates.TemplateResponse("view3d.html", {"request": request, "branch": branch, "access_token": access_token})

@router.get("/request", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("form.html", {"request": request})

@router.get("/news", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("news.html", {"request": request})

@router.get("/guide", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("guide.html", {"request": request})

# Route to create html for model dropdown.
@router.get("/models_drop_down_coverage", response_class=HTMLResponse)
def models_drop_down_coverage():
    json_directory = JSON_DIR
    coords_list = list()
    model_list = list()
    title_list = list()
    for filename in sorted(os.listdir(json_directory)):
        if filename.endswith(".json"):
            logging.warning(f"[INFO] Reading {filename}")
        else:
            logging.warning(f"[WARN] Expected *.json file, skipping {filename}")   
            continue 
        # Opening the file and loading the data
        with open(os.path.join(json_directory, filename), "r") as file:
            try:
                json_data = json.load(file)
                logging.warning(f"[INFO] {json_data}")
                coords = list()
                coords.append(str(json_data["geospatial_lon_min"]))
                coords.append(str(json_data["geospatial_lon_max"]))
                coords.append(str(json_data["geospatial_lat_min"]))
                coords.append(str(json_data["geospatial_lat_max"]))
                
                # Cesium takes depth in meters
                if standard_units(json_data["geospatial_vertical_units"]) == "m":
                    depth_factor =1000
                elif standard_units(json_data["geospatial_vertical_units"]) == "km":
                    depth_factor = 1
                else:
                    depth_factor =1
                    logging.error(f"[ERR] Invalid depth unit of {json_data['geospatial_vertical_units']}")

                coords.append(str(float(json_data["geospatial_vertical_min"])/depth_factor))
                coords.append(str(float(json_data["geospatial_vertical_max"])/depth_factor))
                
                model_coords = f"({','.join(coords)})"
                if "title" in json_data:
                    title_list.append(json_data["title"])
                else:
                    title_list.append("-")
                model_name = json_data["model"]
                coords_list.append(model_coords)
                model_list.append(model_name)
            except Exception as ex:
                Logging.warning(f"[WARN] Bad model file {filename}\n{ex}, skipped")   
                continue 


    # Prepare the HTML for the dropdown
    dropdown_html = f'<option value="">None</option>'
    for i, filename in enumerate(model_list):
        selected = " selected" if i ==0 else ""
        dropdown_html += f'<option value="{coords_list[i]}"{selected}>{model_list[i]}</option>'
    return dropdown_html

@router.get("/geojson")
async def get_geojson():
    logging.warning(f"[INFO] IN get geojson")
    async with httpx.AsyncClient() as client:
        response = await client.get(geojson_url)
        if response.status_code == 200:
            return JSONResponse(content=response.json(), media_type="application/geo+json")
        else:
            raise HTTPException(status_code=404, detail="GeoJSON not found")
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(router, host="127.0.0.1", port=8080)

