@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================
echo   启动海苔的博客
echo ================================
echo.
echo [1/2] 启动服务（端口 3000）...
echo       页面是请求时读取文章文件的，后台保存后刷新就能看到
echo.
start "blog-server" cmd /k "node node_modules\next\dist\bin\next start -p 3000"

timeout /t 8 >nul

echo [2/2] 建立公网隧道（网址在下面的输出里）...
echo.
echo   看到 https://xxxx.lhr.life 那一行，就是别人可以访问的网址
echo   关掉这个窗口，网址就失效了
echo.
ssh -o StrictHostKeyChecking=no -R 80:localhost:3000 nokey@localhost.run

pause
