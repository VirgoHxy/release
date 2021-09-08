# release
自动化发布并生成发布包

release.js 需要放在与package.json同级的根目录

依赖shelljs(局部安装)和standard-version(全局)

```
npm run releaseB 

npm run release

npm run releaseBV

npm run releaseV

```
## npm run releaseB 
打包编译生成发布包 推送代码

## npm run release 
根据commit内容 获取产生变化文件 生成发布包 推送代码

## npm run releaseBV 
与上相同 多一个打版本号操作

## npm run releaseV 
与上相同 多一个打版本号操作