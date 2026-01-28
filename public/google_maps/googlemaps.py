import googlemaps
import json
from pathlib import Path

# Simple cache system
CACHE_FILE = Path(__file__).parent / "googlemaps_cache.jsonl"
_cache = {}

def _load_cache():
    global _cache
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, 'r') as f:
                for line in f:
                    if line.strip():
                        entry = json.loads(line)
                        _cache[entry['input']] = entry['output']
        except:
            _cache = {}

def _save_cache():
    try:
        with open(CACHE_FILE, 'w') as f:
            for k, v in list(_cache.items())[-1000:]:  # Keep last 1000
                f.write(json.dumps({"input": k, "output": v}) + '\n')
    except:
        pass

# Load cache on import
_load_cache()

class GoogleMaps:
    def __init__(self):
        self.gmaps = googlemaps.Client(key="AIzaSyCBTROq6LuvF_IE1r46-T4AeTSV-0d7my8", timeout=10)

    def get_coords(self, address):
        address = address.replace(", GB", " Great Britain")  # Improve geocoding for UK addresses
        # Check cache first
        if address in _cache:
            return _cache[address]
        
        print(address)
        geocode_result = self.gmaps.geocode(address)
        assert geocode_result, "BAD ADDRESS"
        location = geocode_result[0]["geometry"]["location"]
        result = [location['lat'], location['lng']]
        
        # Cache the result (only if it's new)
        if address not in _cache:
            _cache[address] = result
            _save_cache()
        return result

    def get_address(self, lat, lon):
        # Create cache key
        cache_key = f"address_{lat},{lon}"
        if cache_key in _cache:
            return _cache[cache_key]
        
        reverse_geocode_result = self.gmaps.reverse_geocode((lat, lon))
        assert reverse_geocode_result, "Bad coords"
        result = reverse_geocode_result[0]['formatted_address']
        
        # Cache the result (only if it's new)
        if cache_key not in _cache:
            _cache[cache_key] = result
            _save_cache()
        return result

    def get_city_country(self, lat, lon):
        # Create cache key
        cache_key = f"city_country_{lat},{lon}"
        if cache_key in _cache:
            return _cache[cache_key]
        
        # Reverse geocode coordinates to get more detailed location data
        reverse_geocode_result = self.gmaps.reverse_geocode((lat, lon))
        assert reverse_geocode_result, "Bad coords"
        print(reverse_geocode_result)
        
        # Initialize city and country
        city, country = None, None
        
        # Priority list for city types
        city_types = ['locality', 'postal_town', 'administrative_area_level_3', 'administrative_area_level_2']
        
        # Iterate through address components to find city and country
        for component in reverse_geocode_result[0]['address_components']:
            if not city:
                for city_type in city_types:
                    if city_type in component['types']:
                        city = component['long_name']
                        break
            if 'country' in component['types']:
                country = component['long_name']
        
        # Ensure both city and country are found
        print(city, country)
        assert city and country, "City or country not found in address components"
        
        result = (city, country)
        # Cache the result (only if it's new)
        if cache_key not in _cache:
            _cache[cache_key] = result
            _save_cache()
        return result
    

    def get_location_address(self, lat, lon):
        """Get formatted address from latitude and longitude coordinates."""
        # Create cache key
        cache_key = f"location_address_{lat},{lon}"
        if cache_key in _cache:
            return _cache[cache_key]
        
        # Reverse geocode coordinates to get address
        reverse_geocode_result = self.gmaps.reverse_geocode((lat, lon))
        assert reverse_geocode_result, "Bad coordinates"
        
        result = reverse_geocode_result[0]['formatted_address']
        
        # Cache the result
        if cache_key not in _cache:
            _cache[cache_key] = result
            _save_cache()
        
        return result


import math
import random
def jitter_latlon_circle(lat, lon, max_km=1.0):
    """
    Jitter (lat, lon) by up to max_km in a random direction (uniform in circle).
    """
    # Draw radius ~ sqrt(U)*R to get uniform distribution over the disk
    r = max_km * math.sqrt(random.random())
    theta = 2 * math.pi * random.random()
    
    # Convert km to degrees
    dlat = (r * math.cos(theta)) / 111.32
    dlon = (r * math.sin(theta)) / (111.32 * math.cos(math.radians(lat)))
    
    return lat + dlat, lon + dlon



if __name__ == '__main__':
    googlemaps = GoogleMaps()
    
    # # Example to demonstrate caching
    # print("First call (should hit API):")
    # coords = googlemaps.get_coords('scotland uk')
    # print(f"Coordinates: {coords}")
    
    # print("\nSecond call with same input (should use cache):")
    # coords = googlemaps.get_coords('scotland uk')
    # print(f"Coordinates: {coords}")
    
    # # Try with get_address
    # print("\nFirst address lookup (should hit API):")
    # address = googlemaps.get_address(55.953251, -3.188267)  # Edinburgh coordinates
    # print(f"Address: {address}")
    
    print("\nSecond address lookup (should use cache):")
    jittered_lat, jittered_lon = jitter_latlon_circle(55.953251, -3.188267, max_km=0.01)
    print(f"Original coordinates: 55.953251, -3.188267")
    print(f"Jittered coordinates: {jittered_lat}, {jittered_lon}")
    address = googlemaps.get_address(jittered_lat, jittered_lon)
    print(f"Address: {address}")

