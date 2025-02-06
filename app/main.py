# CHECKED OK
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import routes
from routes import router

app = FastAPI()

# Mounting static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include the router
app.include_router(router)

