// 依赖shelljs和standard-version
const shell = require("shelljs");
const path = require("path");
const fs = require("fs");
const homeDir = require("os").homedir();
const desktopPath = path.resolve(homeDir, "Desktop");
const args = process.argv.slice(2);
const argObj = {};

// 获取命令行配置 格式为 key=value "="为键值分隔符 空格为分隔符; --key key为键 值为true
if (args.length > 0) {
  args.forEach(ele => {
    if (ele) {
      if (ele.includes("=")) {
        let arr = ele.split("=");
        let key = arr[0];
        let value = arr[1];
        argObj[key] = value;
      } else if (ele.includes("--")) {
        let key = ele.replace("--", "");
        argObj[key] = true;
      }
    }
  });
}

// 示例
setTimeout(() => {
  new Release({
    releaseName: "wxy发布",
    backupName: "wxy备份",
    mainBranch: "main",
    rootPath: path.resolve(__dirname, "../../")
  });
}, 0)

class Release {
  constructor(data) {
    try {
      this.option = Object.assign(data, argObj);
      let noCommit = this.exec("git status -s");
      if (noCommit.replace(/\s/g, "")) {
        console.log("存在未提交缓存区文件: 请提交后重试\n\r" + noCommit);
        return;
      }
      if (this.option.type == "build") {
        this.buildInit();
      } else {
        this.init();
      }
    } catch (error) {
      console.log(error);
    }
  }

  init() {
    try {
      /** 可配置参数
       * releaseName 发布名称(选填) 日期(MMDD)会和其组成完整名称
       * backupName 备份名称(选填) 日期(MMDD)会和其组成完整名称
       * legalTypeArr 合法的文件类型(选填) 默认js,css,html,cshtml
       * rootPath 根目录(选填) 默认release.js所在目录 release.js不在根目录需修改
       * mainBranch 发布分支(选填) 默认master
       * baseDir 文件基础路径(选填) 默认桌面
       * versionFlag 是否打版本号(选填)
       */
      console.log("开始执行: init函数");
      let {
        releaseName,
        backupName,
        legalTypeArr = ["js", "css", "html", "cshtml"],
        rootPath = __dirname,
        mainBranch = "master",
        baseDir = desktopPath,
        versionFlag = false
      } = this.option || {};
      console.log("传入配置: " + JSON.stringify(this.option));
      console.log(
        "实际配置: " +
        JSON.stringify({
          releaseName,
          legalTypeArr,
          backupName,
          rootPath,
          mainBranch,
          baseDir,
          versionFlag
        })
      );
      // 日期
      let date = this.format(new Date(), "MMDD");
      // 存放发布的文件夹
      let releaseDir = date + (releaseName || "");
      // 存放备份的文件夹
      let backupDir = date + (backupName || "");
      // 发布路径
      let releaseSrc = path.resolve(baseDir, releaseDir);
      // 备份路径
      let backupSrc = path.resolve(baseDir, backupDir);
      console.log("发布路径: " + releaseSrc);
      console.log("备份路径: " + backupSrc);

      this.option.releaseSrc = releaseSrc;
      this.option.backupSrc = backupSrc;
      this.option.legalTypeArr = legalTypeArr;
      this.option.mainBranch = mainBranch;
      this.option.rootPath = rootPath;

      if (!fs.existsSync(releaseSrc)) {
        fs.mkdirSync(releaseSrc);
      }
      if (!fs.existsSync(backupSrc)) {
        fs.mkdirSync(backupSrc);
      }
      let branch = this.exec("git symbolic-ref --short HEAD", {
        trimFlag: true
      });
      if (branch) {
        if (branch == this.option.mainBranch) {
          this.copyReleaseFiles();
          this.release();
          console.log("init函数执行结束: release完毕");
        } else {
          console.log(
            `只能在 ${this.option.mainBranch} 分支上执行 ${branch}无法执行 npm run release！`
          );
        }
      } else {
        console.log("获取 git 分支失败");
      }
    } catch (error) {
      console.log(error);
    }
  }

  buildInit() {
    try {
      /** 可配置参数
       * buildDir 打包后文件所在的文件夹(必填)
       * releaseName 发布名称(选填) 日期(MMDD)会和其组成完整名称
       * rootPath 根目录(选填) 默认release.js所在目录 release.js不在根目录需修改
       * mainBranch 发布分支(选填) 默认master
       * baseDir 文件基础路径(选填) 默认桌面
       * versionFlag 是否打版本号(选填)
       */
      console.log("开始执行: buildInit函数");
      let {
        buildDir,
        releaseName,
        rootPath = __dirname,
        mainBranch = "master",
        baseDir = desktopPath,
        versionFlag = false
      } =
      this.option || {};
      if (!buildDir) {
        console.log("buildDir 参数不能为空");
        return;
      }
      console.log("传入配置: " + JSON.stringify(this.option));
      console.log(
        "实际配置: " +
        JSON.stringify({
          buildDir,
          releaseName,
          rootPath,
          mainBranch,
          baseDir,
          versionFlag
        })
      );
      // 日期
      let date = this.format(new Date(), "MMDD");
      // 存放发布的文件夹
      let releaseDir = date + (releaseName || "");
      // 发布路径
      let releaseSrc = path.resolve(baseDir, releaseDir);
      // build路径
      let buildSrc = path.resolve(rootPath, buildDir);

      this.option.releaseSrc = releaseSrc;
      this.option.buildSrc = buildSrc;
      this.option.mainBranch = mainBranch;
      this.option.rootPath = rootPath;

      console.log("发布路径: " + releaseSrc);
      console.log("build路径: " + buildSrc);
      if (!fs.existsSync(releaseSrc)) {
        fs.mkdirSync(releaseSrc);
      }
      let branch = this.exec("git symbolic-ref --short HEAD", {
        trimFlag: true
      });
      if (branch) {
        if (branch == this.option.mainBranch) {
          this.release();
          console.log("buildInit函数执行结束: release完毕");
        } else {
          console.log(
            `只能在 ${this.option.mainBranch} 分支上执行 ${branch}无法执行 npm run release！`
          );
        }
      } else {
        console.log("获取 git 分支失败");
      }
    } catch (error) {
      console.log(error);
    }
  }

  // 统一执行配置
  exec(command, opt) {
    let option = {
      // 不打印执行结果
      silent: true
    };
    Object.assign(option, opt);
    let returnData = shell.exec(command, option);
    if (returnData.code !== 0) {
      throw new Error(`${command}: ${returnData.stderr}`);
    }
    // 去除回车
    if (option.trimFlag) {
      returnData = returnData.replace(/\s/g, "");
    }
    return returnData;
  }

  // 复制文件
  copyFiles(diffArr, src) {
    let regexpStr = this.option.legalTypeArr.reduce((start, ele, index) => {
      return (index == 1 ? `.+\\.${start}$` : start) + `|.+\\.${ele}$`;
    });
    let regexp = new RegExp(regexpStr);
    for (let index = 0; index < diffArr.length; index++) {
      const element = diffArr[index];
      if (regexp.test(element)) {
        let pathSrc = path.resolve(this.option.rootPath, element);
        let targetSrc = path.resolve(src, element);
        this.copyByPathSync(pathSrc, targetSrc);
      }
    }
  }

  // 复制文件夹
  copyDir(sourcePath, copyPath) {
    this.copyByPathSync(sourcePath, copyPath);
  }

  // 复制修改文件 生成发布包
  copyReleaseFiles() {
    let diffArr = [];
    let diffStr = this.exec(`git diff ${this.option.mainBranch} origin/${this.option.mainBranch} --name-only`);
    if (diffStr.replace(/\s/g, "")) {
      diffStr = diffStr.replace(/\s$/, "");
      diffArr = diffStr.split("\n");
      if (diffArr.length > 0) {
        console.log("改动文件: " + diffArr.join("\n\r"));
        this.copyFiles(diffArr, this.option.releaseSrc);
        this.copyBackupFiles(diffArr);
      } else {
        console.log("获取修改文件列表失败");
      }
    } else {
      throw new Error("未获取到修改文件");
    }
  }

  // 复制备份文件 生成备份包
  copyBackupFiles(diffArr) {
    this.exec("git checkout -b copybackup");
    this.exec(`git reset --hard origin/${this.option.mainBranch}`);
    this.copyFiles(diffArr, this.option.backupSrc);
    this.exec(`git checkout ${this.option.mainBranch}`);
    this.exec("git branch -D copybackup");
  }

  // git 同步代码与打版本号
  release() {
    console.log("开始执行: release函数");
    if (this.option.type == "build") {
      console.log("开始执行: build命令");
      // 编译
      this.exec("npm run build");

      // copy发布包
      this.copyDir(this.option.buildSrc, this.option.releaseSrc);
    }

    // 生成 CHANGELOG.md，修改版本号，打上版本号的 tag
    if (this.option.versionFlag) {
      console.log("开始执行: standard命令");
      this.exec("npm run standard");
    }
    console.log("开始执行: push命令");
    // 推送
    this.exec("git push");
    // 推送所有 tag
    if (this.option.versionFlag) {
      console.log("开始执行: push --tags命令");
      this.exec("git push --tags");
    }
  }

  /**
   * 获取合规时间
   *
   * @param {Date | String | Number} value 时间字符串
   *
   * @returns {Date} 返回时间对象
   */
  getRegularTime(value) {
    let getType = function (o) {
      var s = Object.prototype.toString.call(o);
      return s.match(/\[object (.*?)\]/)[1].toLowerCase();
    };

    if (getType(value) == "string") {
      var ms = value.match(/\.([\d]{1,})[Z]*/) ?
        value.match(/\.([\d]{1,})[Z]*/)[1] :
        0;
      if (/T/g.test(value)) {
        // 去T
        value = value.replace(/T/g, " ");
      }
      if (/\./g.test(value)) {
        // 去毫秒 兼容ios ie firefox
        value = value.replace(/\.[\d]{1,}[Z]*/, "");
      }
      if (/-/g.test(value)) {
        // new Date兼容ios ie firefox
        value = value.replace(/-/g, "/");
      }
      var date = new Date(value);
      date.setMilliseconds(ms);
      return date;
    } else if (getType(value) == "number") {
      return new Date(value);
    } else if (getType(value) == "date") {
      return value;
    } else {
      return false;
    }
  }

  /**
   * 格式化时间(依赖getRegularTime方法)
   *
   * @param {Date | String | Number} value 时间值
   * @param {String} [formatStr = "YYYY-MM-DD hh:mm:ss"] 格式化规则
   *
   * @returns {String} 返回字符串时间
   */
  format(value, formatStr) {
    let myDate = this.getRegularTime(value);
    if (typeof myDate == "boolean") {
      return "请输入正确的日期";
    }
    if (isNaN(myDate.getTime())) {
      return "请输入正确的日期";
    }
    let str = formatStr || "YYYY-MM-DD hh:mm:ss",
      week = [
        "星期日",
        "星期一",
        "星期二",
        "星期三",
        "星期四",
        "星期五",
        "星期六"
      ],
      fullYear = myDate.getFullYear(),
      year = Number(String(fullYear).substring(2)),
      month = myDate.getMonth(),
      date = myDate.getDate(),
      day = myDate.getDay(),
      hour = myDate.getHours(),
      minute = myDate.getMinutes(),
      second = myDate.getSeconds(),
      mSecond = myDate.getMilliseconds();
    //四位年份
    str = str.replace(/yyyy|YYYY/, fullYear);
    //两位年份，小于10补零
    str = str.replace(/yy|YY/, year > 9 ? year : "0" + year);
    //月份，小于10补零
    str = str.replace(/MM/, month + 1 > 9 ? month + 1 : "0" + (month + 1));
    //月份，不补零
    str = str.replace(/\bM\b/, month + 1);
    //日期，小于10补零
    str = str.replace(/dd|DD/, date > 9 ? date : "0" + date);
    //日期，不补零
    str = str.replace(/d|D/, date);
    //小时，小于10补零
    str = str.replace(/hh|HH/, hour > 9 ? hour : "0" + hour);
    //小时，不补零
    str = str.replace(/h|H/, hour);
    //分钟，小于10补零
    str = str.replace(/mm/, minute > 9 ? minute : "0" + minute);
    //分钟，不补零
    str = str.replace(/\bm\b/, minute);
    //秒钟，小于10补零
    str = str.replace(/ss|SS/, second > 9 ? second : "0" + second);
    //秒钟，不补零
    str = str.replace(/\bs\b|\bS\b/, second);
    //星期几
    str = str.replace(/w|W/g, week[day]);
    //毫秒，小于9或99补零
    str = str.replace(
      /MS/,
      mSecond > 9 ? (mSecond > 99 ? mSecond : "0" + mSecond) : "00" + mSecond
    );
    //毫秒，不补零
    str = str.replace(/ms/, mSecond);
    return str;
  }

  /**
   * 同步写入文件夹或文件
   *
   * @param {String} paramPath 路径
   * @param {String} contentStr 写入内容
   */
  writeByPathSync(paramPath, contentStr) {
    try {
      let write = function (str, appendFlag) {
        if (str.match(/[^\\/]*$/)[0].indexOf(".") != -1) {
          !contentStr && console.log("写入内容为空");
          if (!appendFlag) {
            fs.writeFileSync(str, contentStr || "");
          } else {
            fs.appendFileSync(str, contentStr || "");
          }
        } else {
          if (!appendFlag) {
            fs.mkdirSync(str);
          } else {
            return "路径已存在";
          }
        }
      };
      if (!fs.existsSync(paramPath)) {
        paramPath = paramPath.replace(/\\\\|\\/g, "/");
        let pathArr = paramPath.split("/");
        let pathStr = pathArr[0];
        pathArr.splice(0, 1);
        while (pathArr.length > 0) {
          pathStr += "/" + pathArr[0];
          if (!fs.existsSync(pathStr)) {
            write(pathStr);
          }
          pathArr.splice(0, 1);
        }
      } else {
        write(paramPath, true);
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * 同步删除文件夹或文件
   *
   * @param {String} paramPath 路径
   */
  delByPathSync(paramPath) {
    try {
      if (fs.existsSync(paramPath)) {
        if (fs.statSync(paramPath).isDirectory()) {
          let files = fs.readdirSync(paramPath);
          files.forEach(file => {
            let curPath = paramPath + "/" + file;
            if (fs.statSync(curPath).isDirectory()) {
              this.delByPathSync(curPath); //递归删除文件夹
            } else {
              fs.unlinkSync(curPath); //删除文件
            }
          });
          fs.rmdirSync(paramPath);
        } else {
          fs.unlinkSync(paramPath); //删除文件
        }
      } else {
        return "路径不存在";
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * 同步读取文件夹或文件
   *
   * @param {String} paramPath 路径
   *
   * @returns {String | Array}
   */
  readByPathSync(paramPath) {
    try {
      if (fs.existsSync(paramPath)) {
        if (!fs.statSync(paramPath).isDirectory()) {
          return fs.readFileSync(paramPath, "utf8");
        }
        return fs.readdirSync(paramPath);
      } else {
        return "路径不存在";
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * 同步拷贝文件夹或文件
   *
   * @param {String} sourcePath 源路径
   * @param {String} copyPath 复制路径
   */
  copyByPathSync(sourcePath, copyPath) {
    try {
      let copy = function (sourcePath, copyPath) {
        copyPath = copyPath.replace(/\\\\|\\/g, "/");
        let copyFn = function (str, lastFlag) {
          if (str.match(/[^\\/]*$/)[0].indexOf(".") != -1) {
            fs.copyFileSync(sourcePath, copyPath);
          } else {
            let fileName = sourcePath.match(/[^\\/]*$/)[0];
            fs.mkdirSync(str);
            if (lastFlag) {
              fs.copyFileSync(sourcePath, str + "/" + fileName);
            }
          }
        };
        let pathArr = copyPath.split("/");
        let pathStr = pathArr[0];
        pathArr.splice(0, 1);
        while (pathArr.length > 0) {
          pathStr += "/" + pathArr[0];
          if (!fs.existsSync(pathStr)) {
            copyFn(pathStr, pathArr.length == 1);
          }
          pathArr.splice(0, 1);
        }
      };
      if (fs.existsSync(sourcePath)) {
        if (!fs.statSync(sourcePath).isDirectory()) {
          copy(sourcePath, copyPath);
        } else {
          let files = fs.readdirSync(sourcePath);
          files.forEach(file => {
            let sPath = sourcePath + "/" + file;
            let cPath = copyPath + "/" + file;
            if (fs.statSync(sPath).isDirectory()) {
              this.copyByPathSync(sPath, cPath); //递归复制文件夹
            } else {
              copy(sPath, cPath);
            }
          });
        }
      } else {
        return "路径不存在";
      }
    } catch (error) {
      console.log(error);
    }
  }
}