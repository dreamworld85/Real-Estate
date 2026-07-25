import os
import sys
import subprocess
import shutil

# Ensure user site-packages is in sys.path
user_site = os.path.expanduser("~\\AppData\\Roaming\\Python\\Python313\\site-packages")
if user_site not in sys.path:
    sys.path.append(user_site)

try:
    from PIL import Image
except ImportError:
    print("Pillow not found, installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    # Ensure sys.path is updated with the path
    if user_site not in sys.path:
        sys.path.append(user_site)
    import site
    from importlib import reload
    reload(site)
    from PIL import Image

ANDROID_SDK_PATH = "C:\\Users\\prave\\AppData\\Local\\Android\\Sdk"
JAVA_HOME_PATH = "C:\\Program Files\\Android\\Android Studio\\jbr"
GRADLE_PATH = os.path.abspath("gradle-8.5\\bin\\gradle.bat")

def create_android_project(project_dir, app_name, app_url, package_name, icon_src):
    print(f"Creating Android project for {app_name}...")
    
    # Create directories
    java_dir = os.path.join(project_dir, "app", "src", "main", "java", *package_name.split("."))
    res_dir = os.path.join(project_dir, "app", "src", "main", "res")
    os.makedirs(java_dir, exist_ok=True)
    os.makedirs(res_dir, exist_ok=True)

    # 1. settings.gradle
    settings_template = """
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "{app_name_clean}"
include ':app'
"""
    with open(os.path.join(project_dir, "settings.gradle"), "w") as f:
        f.write(settings_template.replace("{app_name_clean}", app_name.replace(' ', '')))

    # 2. build.gradle (project)
    with open(os.path.join(project_dir, "build.gradle"), "w") as f:
        f.write("""
plugins {
    id 'com.android.application' version '8.2.2' apply false
}
""")

    # 3. local.properties
    with open(os.path.join(project_dir, "local.properties"), "w") as f:
        sdk_escaped = ANDROID_SDK_PATH.replace("\\", "\\\\").replace(":", "\\:")
        f.write(f"sdk.dir={sdk_escaped}\n")

    # 3.5 gradle.properties
    with open(os.path.join(project_dir, "gradle.properties"), "w") as f:
        f.write("android.useAndroidX=true\n")

    # 4. app/build.gradle
    app_gradle_template = """
plugins {
    id 'com.android.application'
}

android {
    namespace '{package_name}'
    compileSdk 34

    defaultConfig {
        applicationId '{package_name}'
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
}
"""
    with open(os.path.join(project_dir, "app", "build.gradle"), "w") as f:
        f.write(app_gradle_template.replace("{package_name}", package_name))

    # 5. Manifest
    manifest_template = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher"
        android:label="{app_name}"
        android:supportsRtl="true"
        android:theme="@style/Theme.App"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.App.NoActionBar"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""
    with open(os.path.join(project_dir, "app", "src", "main", "AndroidManifest.xml"), "w") as f:
        f.write(manifest_template.replace("{app_name}", app_name))

    # 6. Colors and Themes
    values_dir = os.path.join(res_dir, "values")
    os.makedirs(values_dir, exist_ok=True)
    with open(os.path.join(values_dir, "colors.xml"), "w") as f:
        f.write("""<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ink">#0F3D3E</color>
    <color name="cream">#FAF8F3</color>
</resources>
""")

    with open(os.path.join(values_dir, "themes.xml"), "w") as f:
        f.write("""<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.App" parent="Theme.Material3.DayNight.NoActionBar">
        <item name="colorPrimary">@color/ink</item>
    </style>
    <style name="Theme.App.NoActionBar" parent="Theme.Material3.DayNight.NoActionBar">
        <item name="colorPrimary">@color/ink</item>
    </style>
</resources>
""")

    # 7. MainActivity.java
    java_template = """package {package_name};

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView mWebView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        mWebView = new WebView(this);
        setContentView(mWebView);

        WebSettings webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setSupportZoom(false);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:") || url.contains("wa.me") || url.startsWith("intent:")) {
                    try {
                        android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
                        view.getContext().startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        e.printStackTrace();
                        return false;
                    }
                }
                view.loadUrl(url);
                return true;
            }
        });

        if (savedInstanceState == null) {
            mWebView.loadUrl("{app_url}");
        }
    }

    @Override
    public void onBackPressed() {
        if (mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
"""
    with open(os.path.join(java_dir, "MainActivity.java"), "w") as f:
        f.write(java_template.replace("{package_name}", package_name).replace("{app_url}", app_url))

    # 8. Launcher Icons
    sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192
    }
    
    img = Image.open(icon_src)
    for name, size in sizes.items():
        mipmap_path = os.path.join(res_dir, name)
        os.makedirs(mipmap_path, exist_ok=True)
        resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
        resized_img.save(os.path.join(mipmap_path, "ic_launcher.png"))
        
    print(f"Project for {app_name} generated successfully.")

def build_project(project_dir, output_apk_name):
    print(f"Building project in {project_dir}...")
    
    # Set JAVA_HOME
    env = os.environ.copy()
    env["JAVA_HOME"] = JAVA_HOME_PATH
    
    # Run Gradle
    try:
        res = subprocess.run(
            [GRADLE_PATH, "assembleDebug"],
            cwd=project_dir,
            env=env,
            capture_output=True,
            text=True
        )
        if res.returncode != 0:
            print("Gradle build failed!")
            print(res.stderr)
            print(res.stdout)
            return False
            
        print("Gradle build successful.")
        
        # Copy compiled APK to target location
        src_apk = os.path.join(project_dir, "app", "build", "outputs", "apk", "debug", "app-debug.apk")
        dest_apk = os.path.join(os.path.abspath("."), output_apk_name)
        shutil.copy(src_apk, dest_apk)
        print(f"Copied APK to {dest_apk}")
        return True
    except Exception as e:
        print(f"Exception during build: {e}")
        return False

def main():
    # User App
    create_android_project(
        project_dir="sparrows_user_proj",
        app_name="Sparrows",
        app_url="https://sales.greensparrows.com",
        package_name="com.greensparrows.sales",
        icon_src="sparrows.png"
    )
    
    # Admin App
    create_android_project(
        project_dir="sparrows_admin_proj",
        app_name="Sparrows Admin",
        app_url="https://sales.greensparrows.com/admin",
        package_name="com.greensparrows.admin",
        icon_src="sparrows-admin.png"
    )
    
    # Build User App
    user_success = build_project("sparrows_user_proj", "sparrows.apk")
    
    # Build Admin App
    admin_success = build_project("sparrows_admin_proj", "sparrows-admin.apk")
    
    # Cleanup project folders
    shutil.rmtree("sparrows_user_proj", ignore_errors=True)
    shutil.rmtree("sparrows_admin_proj", ignore_errors=True)
    
    if user_success and admin_success:
        print("ALL APKS COMPILED AND SAVED IN TARGET FOLDER!")
    else:
        print("One or more builds failed.")

if __name__ == "__main__":
    main()
