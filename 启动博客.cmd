@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================
echo   本地预览（不对外发布）
echo ================================
echo.
echo 用开发模式启动，改完文章/上传图片立刻能看到。
echo 线上站点请用 发布.cmd 推送。
echo.
start "blog-server" cmd /k "node node_modules\next\dist\bin\next dev -p 3000"

timeout /t 8 >nul
start "" http://127.0.0.1:3000

echo 服务已启动：http://127.0.0.1:3000
echo 关闭那个窗口即可停止。
pause
