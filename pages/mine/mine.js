const request = require("../../utils/request");

Page({
	data: {
		isLogin: false,
		phone: '',
		phoneList: [],
		phoneListshow: false
	},
	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {

	},
	// 退出
	signout: function () {
		wx.removeStorageSync('phone');
		this.setData({
			phone: '',
			isLogin: false
		})
	},
	// 扫码识别 允许从相机和相册扫码
	getScanCode: function () {
		if (this.data.isLogin) {
			wx.scanCode({
				onlyFromCamera: true, // 只允许从相机扫码
				success(res) {
					console.log(decodeURIComponent(res.path))
					let query = decodeURIComponent(res.path)
					let type = query.split("=")[1]
					let id = query.split("=")[2]
					
					if (type == 'bind_id' && id) {
						request.nannyBind({
							uid: wx.getStorageSync('uid'),
							bind_id: id
						}).then(res => {
							if (res.code != 0) {
								app.toast(res.msg)
							}
						})
					}
					if (type == 'nanny_id' && id) {
						wx.navigateTo({
							url: '../housekeeper/housekeeper?nanny_id=' + id,
						})
					}
				},
				fail(error) {}
			})
		} else {
			// 跳转登录授权
			wx.navigateTo({
				url: '../authorize/authorize',
			})
		}
	},
	// 跳转页面
	toPage(e) {
		let type = e.currentTarget.dataset.type;
		if (type == 'bill' || type == 'feedback') {
			if (this.data.isLogin) {
				wx.navigateTo({
					url: '../'+type+'/'+type,
				})
			} else {
				this.authorizePage()
			}
		} else if (type == 'join' || type == 'agreement') {
			wx.navigateTo({
				url: '../'+type+'/'+type,
			})
		} else if (type == 'authorize') {
			this.authorizePage()
		}
	},
	// 跳转登录授权
	authorizePage() {
		wx.navigateTo({
			url: '../authorize/authorize',
		})
	},
	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {
		if (wx.getStorageSync('phone')) {
			let phone = wx.getStorageSync('phone')
			this.setData({
				phone: phone.replace(/^(\d{3})\d{4}(\d+)/, "$1****$2"),
				isLogin: true
			})
			request.getNannyPhone({
				uid: wx.getStorageSync('uid')
			}).then(res => {
				if (res.code == 0) {
					if (res.data.station.length > 0) {
						this.setData({
							phoneList: res.data.station,
							phoneShow: true
						})
					} else {
						this.setData({ phoneShow: false })
					}
				} else {
					app.toast(res.msg);
					this.setData({
						phoneShow: false
					})
				}
			})
		} else {
			this.setData({
				phone: '',
				isLogin: false
			})
		}
	},
	// 关闭 popup 联系站长电话 
	onMobileClose() {
		this.setData({ phoneListshow: false })
	},
	// 拨打电话
	callMobile(e) {
		wx.makePhoneCall({
			phoneNumber: e.currentTarget.dataset.phone,
			fail: () => {}
		})
	},
	callMobile() {
		if (this.data.phoneList.length < 2) {
			wx.makePhoneCall({
				phoneNumber: this.data.phoneList[0].phone,
				fail: () => {}
			})
		} else {
			this.setData({
				phoneListshow: true
			})
		}
	},
	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: function () {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function () {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	}
})