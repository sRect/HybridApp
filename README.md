# Vue-cli+Vue+MintUI+Cordova HyBrid App Demo

## 修改vue项目
> 参考文章 https://www.jianshu.com/p/25d797b983cd
1. index.html中引入cordova.js
```html
<body>
    <div id="app"></div>
    <script type="text/javascript" src="cordova.js"></script>
    <!-- built files will be auto injected -->
</body>
```

2. 修改src中的main.js
```javascript
document.addEventListener('deviceready', function() {
  new Vue({
    el: '#app',
    router,
    store,
    template: '<App/>',
    components: { App }
  })
  window.navigator.splashscreen.hide()
}, false);
```

3. 修改config文件夹中的index.js
> 将build中的assetsSubDirectory和assetsPublicPath改为
```json
build: {
  assetsSubDirectory: "",
  assetsPublicPath: ""
}
```

4. 进行项目打包
```
npm run build
```

## Cordova中的操作
> 参考文章 https://segmentfault.com/a/1190000013159076
1. 安装cordova
```
npm install -g cordova
```
2. 检测是否安装成功
> 正确安装会显示安装的cordova版本号
```
cordova -v
```

3. 新建cordova项目
```
cordova create myApp1 org.apache.cordova.myApp myApp2
```
> myApp1：cordova目录名 \
> org.apache.cordova.myApp：包名 \
> myApp2项目名（在config.xml中查看）

4. 生成Android平台的cordova库
```
cordova platform add android
```

5. 打包前检查androidsdk是否正确安装
```
cordova requirements
```
> 显示如下截图，即已正确安装
![Image text](https://raw.githubusercontent.com/sRect/myApp/master/www/img/cordova%20requirements.png)

6. 进行打包
+ 6.1 生成debugger包
```
cordova build android
```
或者
```
cordova run android
```

+ 6.2 生成签名包
> 生成签名包前，需要提前把数字签名证书生成
```
keytool -genkey -v -keystore E:\mytest.keystore -alias mytest -keyalg RSA -validity 20000
```
>1. -keystore E:/mytest.keystore表示生成的证书及其存放路径，如果直接写文件名则默认生成在用户当前目录下；
>2. -alias mytest 表示证书的别名是mytest,不写这一项的话证书名字默认是mykey；
>3.  -keyalg RSA 表示采用的RSA算法；
>4. -validity 20000表示证书的有效期是20000天。
>5. 根据指令输入密钥库口令，是不可见的。依次输入下面的问题。最后到【否】那里时输入y，再输入密钥口令（可以与密钥库口令相同），如果相同，直接回车，记住这两个口令，后面签名会使用到。

+ 6.3 直接生成带签名的apk
```
cordova build android --release --keystore="mytest.keystore" --alias=mytest --storePassword=123456 --password=123456
```
>1. --keystore 后面是数字签名证书
>2.  -–alias 后面是别名 
>3. --storePassword  后面是密钥库口令 
>4. --password 后面是密钥口令
>5. <b>注意：命令中口令要替换成自己的，就是生成签名是需要记住的那两个口令</b>

## Cordova APP调试
1. 安装APK到手机
> <b>注意：必须是debug包，部分手机版本开启能开启全局调试的用release包也是可以调试的</b>

2. 手机上打开应用

3. 打开Chrome浏览器，地址栏输入：chrome://inspect回车，如果你的手机是4.4+的版本就会出现你打开的应用，点击inpect进入调试界面。截图如下：
> <b>注意：第一次打开需要“科学上网”，你懂的，不用每一次。</b>
![Image text](https://raw.githubusercontent.com/sRect/myApp/master/www/img/inspect%20screen.png)
