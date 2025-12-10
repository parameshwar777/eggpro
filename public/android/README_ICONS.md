# Android App Icon Setup

To add your egg logo as the app icon, you need to create icons in multiple sizes and place them in the Android project.

## Steps to add custom app icon:

1. After running `npx cap add android`, open Android Studio with `npx cap open android`

2. In Android Studio, right-click on `app/src/main/res` folder

3. Select **New → Image Asset**

4. In the "Asset Studio" dialog:
   - **Icon Type**: Choose "Launcher Icons (Adaptive and Legacy)"
   - **Name**: Keep as `ic_launcher`
   - **Foreground Layer**: Click "Path" and select your egg logo image
   - **Background Layer**: Set to a solid color (orange: #F97316 recommended)
   - Adjust scaling as needed

5. Click **Next** then **Finish**

6. The icons will be automatically generated in all required sizes:
   - mipmap-mdpi (48x48)
   - mipmap-hdpi (72x72)
   - mipmap-xhdpi (96x96)
   - mipmap-xxhdpi (144x144)
   - mipmap-xxxhdpi (192x192)

## Alternative: Manual Icon Creation

If you prefer to create icons manually:

1. Create your icon in these sizes:
   - 48x48 px → `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
   - 72x72 px → `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
   - 96x96 px → `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
   - 144x144 px → `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
   - 192x192 px → `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`

2. Also create round versions with the same sizes named `ic_launcher_round.png`

## Using Online Tools

You can also use online tools like:
- https://icon.kitchen/ (recommended)
- https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html

Upload your egg logo and download the generated icon pack, then copy to the appropriate folders.
