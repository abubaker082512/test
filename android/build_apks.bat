set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\abuba\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%
"C:\Users\abuba\.gradle\wrapper\dists\gradle-8.14.3-all\10utluxaxniiv4wxiphsi49nj\gradle-8.14.3\bin\gradle.bat" :app:bundleWinxproRelease :app:assembleWinxproRelease --no-daemon
copy /Y "app\build\outputs\bundle\winxproRelease\app-winxpro-release.aab" "..\android_builds\app-release.aab"
copy /Y "app\build\outputs\bundle\winxproRelease\app-winxpro-release.aab" "..\android_builds\WinXPro-com.winxpro-release.aab"
copy /Y "app\build\outputs\apk\winxpro\release\app-winxpro-release.apk" "..\android_builds\WinXPro-com.winxpro-release.apk"

