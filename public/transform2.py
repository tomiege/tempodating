import pandas as pd
import requests
import json
from time import sleep
from random import uniform
import math

from google_maps.googlemaps import GoogleMaps

def get_sheet_data_and_convert_to_json(output_json_path="events.json", max_retries=3, sheet_id="1DKRL7HTK2DNcyMTo6ItvXDvZIem4Vls6hIvnqHfNY8E"):
    """
    Fetches data from Google Sheet, filters valid rows, and converts to JSON format.
    
    Args:
        output_json_path: Path to save the output JSON file
        max_retries: Maximum number of retry attempts for fetching the sheet
        sheet_id: Google Sheet ID to fetch data from
    """
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/csv,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    
    for attempt in range(max_retries):
        try:
            # Use requests to get the CSV data
            print(f"Attempt {attempt+1}/{max_retries} to fetch Google Sheet data...")
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()  # Raise an exception for HTTP errors
            
            # Read the CSV data from the response content
            df = pd.read_csv(pd.io.common.StringIO(response.text))

            # Define the required fields based on your JSON structure
            required_fields = [
                "eventId", "gmtdatetime", "title", "country", "city", "timezone", 
                "price_male", "price_female", "days_before_event", "currency", 
                "duration_in_minutes", "soldOut", "eventType", "zoomInvite"
            ]
            
            # Filter out rows with missing eventId or any required fields
            valid_rows = []
            for _, row in df.iterrows():
                # Check if eventId is valid (not NaN)
                if pd.isna(row.get("eventId")):
                    continue
                if row.get("siteName") !='tempo':
                    continue
                print(row)
                # Check if all required fields exist
                # if all(field in row and not pd.isna(row[field]) for field in required_fields):
                valid_rows.append(row.to_dict())
            
            print(f"Filtered {len(valid_rows)} valid rows from {len(df)} total rows")
            
            # Initialize GoogleMaps for coordinate lookup
            gmaps = GoogleMaps()
            
            # Convert valid rows to the desired JSON format
            json_data = []
            for row in valid_rows:
                if not row['eventId']:
                    continue
                print(row)
                try:
                    city = row['city']
                    country = row['country']
                    title = "For Gay men" if row['eventType'] =="onlineSpeedDatingGay" else ""
                    
                    # Get latitude and longitude for the city, country
                    address = f"{city}, {country}"
                    try:
                        coords = gmaps.get_coords(address)
                        latitude = coords[0]
                        longitude = coords[1]
                    except Exception as e:
                        print(f"Warning: Could not get coordinates for {address}: {e}")
                        latitude = None
                        longitude = None
                    
                    json_obj = {
                        "eventId": int(row["eventId"]),
                        "gmtdatetime": row["gmtdatetime"],
                        "title": f'Online Speed Dating',
                        "country": country,
                        "city": city,
                        "latitude": latitude,
                        "longitude": longitude,
                        "timezone": row["timezone"],
                        "prices": [
                            {
                                "price": int(float(row["price_male"])),
                                "gender": "Male",
                                "daysBeforeEvent": int(float(row["days_before_event"]))
                            },
                            {
                                "price": int(float(row["price_female"])),
                                "gender": "Female",
                                "daysBeforeEvent": int(float(row["days_before_event"]))
                            }
                        ],
                        "currency": row["currency"],
                        "duration_in_minutes": int(float(row["duration_in_minutes"])),
                        "soldOut": str(row["soldOut"]).lower() == "true",
                        "eventType": row["eventType"],
                        "zoomInvite": row["zoomInvite"],
                        "region_id": row["region_id"],

                    }
                    json_data.append(json_obj)
                except (ValueError, TypeError) as e:
                    print(f"Error processing row: {row}")
                    print(f"Error details: {e}")
                    continue
            
            # Write the JSON data to a file
            with open(output_json_path, 'w', encoding='utf-8') as json_file:
                json.dump(json_data, json_file, indent=4)
            
            print(f"Conversion completed! JSON file saved at {output_json_path}")
            return json_data
            
        except requests.exceptions.RequestException as e:
            wait_time = uniform(1, 3) * (attempt + 1)  # Exponential backoff with jitter
            print(f"Attempt {attempt+1}/{max_retries} failed: {e}")
            print(f"Waiting {wait_time:.2f} seconds before retry...")
            
            if attempt < max_retries - 1:
                sleep(wait_time)
            else:
                print("Max retries reached. Could not fetch data.")
                return None
        
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None

# Example usage
if __name__ == "__main__":
    data = get_sheet_data_and_convert_to_json(output_json_path="events.json")
    
    if data:
        print(f"Successfully converted {len(data)} events to JSON")
    else:
        print("Failed to process data")
