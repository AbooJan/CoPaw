
rm -r src/copaw/console

# 先构建前端控制台（Web 界面必需）
cd console && npm ci && npm run build
cd ..

# 将控制台构建产物复制到包目录
mkdir -p src/copaw/console
cp -R console/dist/. src/copaw/console/