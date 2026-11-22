@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-test.ps1" %*
pause
