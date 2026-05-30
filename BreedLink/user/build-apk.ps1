# Change to the project directory
Set-Location "c:\Users\user\Documents\DDT ZHAFIR NOTES\FINAL YEAR PROJECT\BREEDLINK 26.10\BREEDLINK\BreedLink"

# Set environment variable
$env:EAS_NO_VCS = "1"

# Start the EAS build process
$process = Start-Process -FilePath "eas" -ArgumentList "build", "-p", "android", "--profile", "preview" -NoNewWindow -PassThru -RedirectStandardInput "input.txt" -RedirectStandardOutput "output.txt" -RedirectStandardError "error.txt"

# Create input file with 'y' response for the keystore prompt
"y" > "input.txt"

# Wait for the process to complete
$process.WaitForExit()

# Display output
Get-Content "output.txt"
Get-Content "error.txt"

# Clean up temporary files
Remove-Item "input.txt" -ErrorAction SilentlyContinue
Remove-Item "output.txt" -ErrorAction SilentlyContinue
Remove-Item "error.txt" -ErrorAction SilentlyContinue

Write-Host "Build process completed with exit code: $($process.ExitCode)"