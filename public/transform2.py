import pandas as pd
import json
import math
from google_maps.googlemaps import GoogleMaps

def get_local_csv_and_convert_to_json(output_json_path="products/events.json", csv_path="events.csv"):
    """
    Reads data from a local CSV file, filters valid rows, and converts to JSON format.
    Fallback for when downloading from Google Sheets is not possible.

    Args:
        output_json_path: Path to save the output JSON file
        csv_path: Path to the local CSV file to read from
    """
    try:
        print(f"Reading local CSV from {csv_path}...")
        df = pd.read_csv(csv_path)

        # Filter out rows with missing productId or wrong siteName
        valid_rows = []
        for _, row in df.iterrows():
            if pd.isna(row.get("productId")):
                continue
            if row.get("siteName") != 'tempo':
                continue
            print(row)
            valid_rows.append(row.to_dict())

        print(f"Filtered {len(valid_rows)} valid rows from {len(df)} total rows")

        # Initialize GoogleMaps for coordinate lookup
        gmaps = GoogleMaps()

        # Convert valid rows to the desired JSON format
        json_data = []
        for row in valid_rows:
            if not row['productId']:
                continue
            print(row)
            try:
                row = {k: (None if isinstance(v, float) and math.isnan(v) else v) for k, v in row.items()}
                city = row['city']
                country = row['country']
                title = "For Gay men" if row['productType'] == "onlineSpeedDatingGay" else ""

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
                    "productId": int(row["productId"]),
                    "gmtdatetime": row["gmtdatetime"],
                    "title": 'Online Speed Dating',
                    "country": country,
                    "city": city,
                    "latitude": latitude,
                    "longitude": longitude,
                    "timezone": row["timezone"],
                    "male_price": int(float(row["price_male"])),
                    "female_price": int(float(row["price_female"])),
                    "currency": row["currency"],
                    "duration_in_minutes": int(float(row["duration_in_minutes"])),
                    "soldOut": str(row["soldOut"]).lower() == "true",
                    "productType": row["productType"],
                    "zoomInvite": row["zoomInvite"],
                    "region_id": row["region_id"],
                }
                json_data.append(json_obj)
            except (ValueError, TypeError) as e:
                print(f"Error processing row: {row}")
                print(f"Error details: {e}")
                continue

        # Write the JSON data to a file (NaN → null)
        with open(output_json_path, 'w', encoding='utf-8') as json_file:
            json.dump(json_data, json_file, indent=4, default=lambda v: None if (isinstance(v, float) and math.isnan(v)) else v)

        print(f"Conversion completed! JSON file saved at {output_json_path}")
        return json_data

    except FileNotFoundError:
        print(f"Error: CSV file not found at '{csv_path}'")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None


# Example usage
if __name__ == "__main__":
    data = get_local_csv_and_convert_to_json(output_json_path="products/events.json", csv_path="events.csv")

    if data:
        print(f"Successfully converted {len(data)} events to JSON")
    else:
        print("Failed to process data")
