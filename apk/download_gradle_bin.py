import urllib.request
import zipfile
import os

url = "https://services.gradle.org/distributions/gradle-8.5-bin.zip"
zip_path = "gradle-8.5-bin.zip"

print("Downloading Gradle 8.5 bin zip...")
try:
    urllib.request.urlretrieve(url, zip_path)
    print("Success. Extracting Gradle...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(".")
    print("Success. Cleaning up...")
    os.remove(zip_path)
    print("Gradle is ready.")
except Exception as e:
    print(f"Failed to setup Gradle: {e}")
