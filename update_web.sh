
rm -r src/qwenpaw/console

# 先构建前端控制台（Web 界面必需）
cd console && npm ci && npm run build
cd ..

# 将控制台构建产物复制到包目录
mkdir -p src/qwenpaw/console
cp -R console/dist/. src/qwenpaw/console/