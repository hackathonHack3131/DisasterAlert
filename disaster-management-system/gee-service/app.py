"""
Optional Google Earth Engine tile service.
Run: pip install earthengine-api fastapi uvicorn
     export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
     uvicorn app:app --port 5050

Without GEE credentials, returns empty — Spring Boot uses OpenWeather climate model.
"""
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="GEE Climate Layer Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

GEE_READY = False
ee = None

try:
    import ee
    ee.Initialize()
    GEE_READY = True
except Exception as e:
    print("Earth Engine not initialized:", e)


@app.get("/health")
def health():
    return {"gee": GEE_READY}


@app.get("/api/layers")
def layers(lat: float = Query(19.076), lng: float = Query(72.8777)):
    if not GEE_READY:
        return {"tiles": {}, "gee": False}

    region = ee.Geometry.Point([lng, lat]).buffer(200000)
    tiles = {}

    try:
        chirps = (
            ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
            .filterDate("2024-01-01", "2024-12-31")
            .select("precipitation")
            .mean()
            .clip(region)
        )
        precip_map = chirps.getMapId({"min": 0, "max": 50, "palette": ["white", "#aadaff", "#0050FF", "#001133"]})
        tiles["rainfall"] = precip_map["tile_fetcher"].url_format
    except Exception as ex:
        print("CHIRPS layer failed:", ex)

    try:
        era5 = (
            ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY")
            .filterDate("2024-06-01", "2024-06-07")
            .select("dewpoint_temperature_hydrological")
            .mean()
            .clip(region)
        )
        humidity_map = era5.getMapId({"min": 250, "max": 295, "palette": ["#0d0d0d", "#39FF14", "#FF8C42"]})
        tiles["humidity"] = humidity_map["tile_fetcher"].url_format
    except Exception as ex:
        print("ERA5 layer failed:", ex)

    return {"tiles": tiles, "gee": True}
