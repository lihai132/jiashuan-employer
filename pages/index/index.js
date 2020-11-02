var request = require("../../utils/request.js");
var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var qqmapsdk;
const app = getApp();
import Notify from '@vant/weapp/notify/notify';

Page({
	data: {
		city: '广州市',
		indexObject: {},
		partList: [],
		phoneShow: false, // 是否显示拨打电话悬浮按钮
		phoneListshow: false, // 是否显示多个电话列表
		phoneList: [],
		isNetword: true // 检测网络状态
	},
	onLoad: function (options) {
		const that = this;

		// 实例化API核心类
        qqmapsdk = new QQMapWX({
            key: 'ZDBBZ-LY2CS-SP5OY-6DE5D-SCEOS-BCB4C'
		});
		
		// 获取位置
		this.getUserLocation()
		

		// 检测网络状态
		wx.getNetworkType({
			success(res) {
				if (res.networkType == 'unknown' || res.networkType == 'none') {
					that.setData({
						isNetword: false
					})
				}
			}
		})

		app.login().then(() => {
			request.getIndex({}).then(res => {
				if (res.code == 0) {
					let partList = res.data.part;
					this.setData({
						indexObject: res.data,
						partList,
						isNetword: true
					})
				} else {
					app.toast(res.msg)
				}
			})

			// 获取订阅通知的id
			request.getSubscribeMessageConfig({}).then(res => {
				if (res.code == 0) {
					wx.setStorageSync('message', JSON.stringify(res.data))
				} else {
					app.toast(res.msg)
				}
			})
			
			// 如果是通过家政师的海报扫码进入小程序 把对应的用户绑定在该家政师
			if (options.scene) {
				const query = decodeURIComponent(options.scene);
				let type = query.split("=")[0]
				let id = query.split("=")[1]

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
			}
		})
	},
	// 当前无网络的时候 重新请求接口
	refresh() {
		this.onLoad()
	},
	// 获取城市定位经纬度
	getUserLocation: function () {
		const that = this;
		wx.getSetting({
		  	success(res) {
				if (res.authSetting['scope.userLocation'] != undefined && res.authSetting['scope.userLocation'] != true) {
					wx.showModal({
						title: '请求授权当前位置',
						content: '需要获取您的地理位置，请确认授权',
						showCancel: true,
						success(res) {
							if (res.confirm) {
								wx.openSetting({
								  	success(dataAu) {
										if (dataAu.authSetting["scope.userLocation"] == true) {
											that.getLocation()
										}
									}
								})
							}
						}
					})
				} else {
					that.getLocation()
				}
			}
		})
	},
	// 微信获得经纬度
	getLocation() {
		const that = this;
		wx.getLocation({
		  	success(res) {
				var latitude = res.latitude;
				var longitude = res.longitude;
				that.getLocal(latitude, longitude)
			  }
		})
	},
	// 获取当前地理位置
	getLocal(latitude, longitude) {
		const that = this;
		qqmapsdk.reverseGeocoder({
			location: {
				latitude: latitude,
				longitude: longitude
			},
			success(res) {
				that.setData({ city: res.result.ad_info.city })
				if (res.result.ad_info.city != '广州市') {
					Notify({ type: 'warning', message: '您所在城市暂时没有开通服务' });
				}
			}
		})
	},
	// 拨打电话
	callMobile(e) {
		wx.makePhoneCall({
			phoneNumber: e.currentTarget.dataset.phone,
			fail: () => {}
		})
	},
	// 拨打电话或者打开电话列表
	callPhone() {
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
	onMobileClose() {
		this.setData({
			phoneListshow: false
		})
	},
	// 获取轮播图的高度
	onImageLoad(e) {
		this.setData({
			imgH: e.detail.height / 3
		})
	},
	// 跳转页面
	toPage(e) {
		let type = e.currentTarget.dataset.type;
		if (type == 'address') {
			wx.navigateTo({
				url: '../address/address',
			})
		} else if (type == 'detail') {
			let goods_id = e.currentTarget.dataset.id;
			wx.navigateTo({
				url: '../details/details?goods_id=' + goods_id,
			})
		}
	},
	// 获取家政师电话
	getNannyPhone() {
		request.getNannyPhone({
			uid: wx.getStorageSync('uid')
		}).then(res => {
			if (res.code == 0) {
				if (res.data.nanny.length > 0) {
					this.setData({
						phoneList: res.data.nanny,
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
	},
	onShow: function () {
		// app.globalData.callback = function (res) { //接收服务器发来的非心跳包数据
		// 	console.log(res)
		// }
		// 判断是否登录 获取家政师电话
		if (wx.getStorageSync('phone')) {
			this.getNannyPhone()
		}
		// 获取上一页选择的城市
		let pages = getCurrentPages();
		let currPage = pages[pages.length - 1];
		if (currPage.data.addresschose) {
			this.setData({
				city: currPage.data.addresschos
			})
		}
	},
	onShareAppMessage() {
		
	}
})