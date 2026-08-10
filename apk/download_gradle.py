import urllib.request
import os

files = {
    "gradlew.bat": "https://raw.githubusercontent.com/gradle/gradle/v8.5.0/gradlew.bat",
    "gradlew": "https://raw.githubusercontent.com/gradle/gradle/v8.5.0/gradlew",
    "gradle/wrapper/gradle-wrapper.properties": "https://raw.githubusercontent.com/gradle/gradle/v8.5.0/subprojects/wrapper-shared/src/main/resources/gradle-wrapper.properties",
    "gradle/wrapper/gradle-wrapper.jar": "https://raw.githubusercontent.com/gradle/gradle/v8.5.0/subprojects/wrapper/src/executable/resources/gradle-wrapper.jar"
}

# Note: The raw links above might be different. Let's write them directly.
# Let's use simpler links or official wrapper links:
files = {
    "gradlew.bat": "https://raw.githubusercontent.com/gradle/gradle/v8.5.0/gradlew.bat",
    "gradlew": "https://raw.githubusercontent.com/gradle/gradle/v8.5.0/gradlew",
    "gradle/wrapper/gradle-wrapper.properties": "https://raw.githubusercontent.com/gradle/gradle/v8.5.0/subprojects/wrapper-shared/src/main/resources/gradle-wrapper.properties",
    "gradle/wrapper/gradle-wrapper.jar": "https://github.com/gradle/gradle/raw/v8.5.0/subprojects/wrapper/src/executable/resources/gradle-wrapper.jar"
}

for rel_path, url in files.items():
    dir_path = os.path.dirname(rel_path)
    if dir_path and not os.path.exists(dir_path):
        os.makedirs(dir_path)
    print(f"Downloading {rel_path}...")
    try:
        urllib.request.urlretrieve(url, rel_path)
        print("Success.")
    except Exception as e:
        print(f"Failed to download {rel_path}: {e}")
