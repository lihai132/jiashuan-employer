var request = require("./utils/request.js");
const socketUrl = request.env == 'production' ? 'wss://socket.jshuan.cn' : 'wss://socket.yishenjr.cn';

App({
	globalData: {
		userInfo: null,
		socketUrl: socketUrl,
		socketHeartTimer: null,
		socketClientTimer: null,
		callback: function () {},
	},
	onLaunch: function () {
		this.updateVersion();
	},
	// 检查更新
	updateVersion() {
		const updateManager = wx.getUpdateManager();

		updateManager.onCheckForUpdate(function (res) {
			// 请求完新版本信息的回调
			if (res.hasUpdate) {
				updateManager.onUpdateReady(function () {
					wx.showModal({
						title: '更新提示',
						content: '新版本已经准备好，是否重启应用？',
						success(res) {
							if (res.confirm) {
								// 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
								updateManager.applyUpdate()
							}
						}
					})
				})

				updateManager.onUpdateFailed(function () {
					// 新版本下载失败
					wx.showToast({
						title: '新版本下载更新失败，请删除后小程序后重试',
						icon: "none",
						duration: 2000
					})
				})
			}
		})
	},
	onShow: function () {
		this.checkLoginUserSocket();
	},
	// 检查用户登录状态，并决定是否开启socket
	checkLoginUserSocket() {
		// 登录状态下调用连接socket 且判断是否已经连接socket
		if (wx.getStorageSync('phone')) {
			this.connectSocketFunciton()
		} else {
			// 未登录状态下清除定时器关闭socket
			this.closeSocketFunction()
		}
	},
	// 小程序进入后台
	onHide: function () {
		// 关闭socket
		this.closeSocketFunction()
	},
	// 小程序连接 socket
	connectSocketFunciton() {
		const that = this;
		let socketUrl = this.globalData.socketUrl
		wx.connectSocket({
			url: socketUrl,
			success: (res => {
				// 初始化连接监听
				that.initEventHandler()
			}),
			fail: (err => {
				console.log(err)
				this.closeSocketFunction()
			})
		})
	},
	// 绑定监听
	initEventHandler() {
		const that = this;
		// socket连接开启
		wx.onSocketOpen((result) => {
			wx.sendSocketMessage({
				data: 'user_type=1&uid=' + wx.getStorageSync('uid'),
				success: function (res) {},
				fail: function (res) {}
			})
		})

		// 接收socket消息
		wx.onSocketMessage((res) => {
			//第一次消息如果为init就绑定uid
			var data = JSON.parse(res.data)
			// 全局socket接收消息的方法回调
			that.globalData.callback(JSON.parse(res.data))
		})
		
		// 开启心跳
		that.startHeart()
	},
	// 发送心跳
	startHeart() {
		this.globalData.socketHeartTimer = setInterval(() => {
			wx.sendSocketMessage({
				data: 'user_type=1&uid=' + wx.getStorageSync('uid'),
				success: function (res) {},
				fail: function (res) {}
			})
		}, 3000)
	},
	//此页面关闭socket和定时器的函数
	closeSocketFunction: function () {
		if (wx.getStorageSync('phone')) {
			// 关闭socket连接
			wx.closeSocket()
		}
	},
	login: function () {
		const that = this;
		return new Promise(function (resolve, reject) {
			// 登录
			wx.login({
				success(res) {
					request.login({
						code: res.code
					}).then(res => {
						if (res.code == 0) {
							resolve(res.data.token)
							wx.setStorageSync('token', res.data.token)
							wx.setStorageSync('uid', res.data.uid)
						} else {
							that.toast(res.msg)
						}
					})
				}
			})
		})
	},
	// 封装 wx.showToast
	toast(title, icon = 'none', duration, options) {
		wx.showToast({
			title: title || '',
			icon: icon,
			image: (options && options.image) || '',
			duration: duration || 1500,
			mask: (options && options.mask) || true,
		});
	}
})