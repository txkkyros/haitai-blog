@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================
echo   发布到线上（haitai-blog.netlify.app）
echo ================================
echo.
echo 把本地改动提交并推送到 GitHub，
echo Netlify 检测到更新后会自动重新部署（约 30 秒）。
echo.

git add -A
git commit -m "更新内容 %date% %time%"
git push origin main

echo.
echo 已推送。等半分钟刷新线上站点即可看到。
pause
