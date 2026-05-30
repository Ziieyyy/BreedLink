@echo off
echo Building BreedLink APK...
echo.

cd /d "c:\Users\user\Documents\DDT ZHAFIR NOTES\FINAL YEAR PROJECT\BreedlinkApk\UnifiedBreedLink\user"
set EAS_NO_VCS=1

echo Initiating EAS build for Android...
echo y| eas build -p android --profile preview

if %errorlevel% == 0 (
    echo.
    echo Build completed successfully!
    echo Check the Expo dashboard for your APK download link.
) else (
    echo.
    echo Build failed with error code %errorlevel%.
    echo Please check the error message above.
)

echo.
echo The build will take 10-30 minutes to complete in the cloud.
echo When finished, you'll receive a download link for your APK.
echo.
pause