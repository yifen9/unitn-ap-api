@echo off
setlocal enabledelayedexpansion

set "BASE=%BASE%"
if "%BASE%"=="" set "BASE=https://api.ap.unitn.yifen9.li"

set "GITHUB_ID=%~1"
set "EMAIL=%~2"

if "%GITHUB_ID%"=="" set /p GITHUB_ID=GitHub ID: 
if "%EMAIL%"=="" set /p EMAIL=UniTN email (@studenti.unitn.it): 

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$base=$env:BASE;" ^
  "$gid='%GITHUB_ID%';$em='%EMAIL%';" ^
  "$body=@{ githubId=$gid; email=$em } | ConvertTo-Json -Compress;" ^
  "Write-Host 'Creating invitation...';" ^
  "$r = Invoke-WebRequest -Method POST -Uri ($base + '/v1/invitations') -ContentType 'application/json' -Body $body;" ^
  "$j = $r.Content | ConvertFrom-Json;" ^
  "if(-not $j.id){ throw 'Unexpected response: ' + $r.Content };" ^
  "Write-Host ('Invitation accepted (id: ' + $j.id + ')');" ^
  "Write-Host 'Sending verification email...';" ^
  "Invoke-WebRequest -Method POST -Uri ($base + '/v1/invitations/' + $j.id + '/resend') | Out-Null;" ^
  "Write-Host ('Done. Please check your UniTN inbox (' + $em + ') and click the verification link.');"
if errorlevel 1 (
  echo.
  echo Failed. Please screenshot this window and contact the maintainer.
  pause
  exit /b 1
)
echo.
echo Success. Check your inbox now.
pause
