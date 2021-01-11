var request = require("../../utils/request.js");
let util = require('../../utils/util');
var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var qqmapsdk;
const app = getApp();
import Notify from '@vant/weapp/notify/notify';

Page({
	data: {
		city: '广州市',
		partList: [],
		isNetword: true,
		isLoading: true,
		scene: '', // 场景
		qrcode_id: '', // 场景id
		phoneShow: false,
		timerArr: [],
		timer: null,
		banner: '',
		swiperCurrent: 0,
		activeShow: false,
	},
	onLoad: function (options) {
		const that = this;
		let gdt_vid = options.gdt_vid
		let weixinadinfo = options.weixinadinfo
		let type = options.type
		if (weixinadinfo) {
			let weixinadinfoArr = weixinadinfo.split('.')
			let aid = weixinadinfoArr[0]
			wx.setStorageSync('aid', aid)
			wx.setStorageSync('weixinadinfo', weixinadinfo)
		}
		if (type) {
			wx.setStorageSync('type', type)
		}
		if (gdt_vid) {
			wx.setStorageSync('gdt_vid', gdt_vid)
			let advertisementData = {
				"click_id": gdt_vid,
				"token": wx.getStorageSync('token'),
				"action_type": "REGISTER",
				"type": type,
				"aid": wx.getStorageSync('aid'),
				"weixinadinfo": weixinadinfo

			}
			request.comesbackmini(advertisementData).then(res => {
				if (res.code == 0) {
					console.log(res)
				}
			})

		}

		// 实例化API核心类
		qqmapsdk = new QQMapWX({
			key: getApp().globalData.mapKey
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

		// 获取订阅通知的id
		request.getSubscribeMessageConfig({}).then(res => {
			if (res.code == 0) {
				wx.setStorageSync('message', JSON.stringify(res.data))
			} else {
				if (res.msg) {
					Notify({
						type: 'danger',
						message: res.msg
					});
				} else {
					Notify({
						type: 'danger',
						message: '请联系工作人员'
					});
				}
			}
		})

		// 扫码获取家政师id
		if (options.scene) {
			const query = decodeURIComponent(options.scene);
			let type = query.split("=")[0]
			let id = query.split("=")[1]
			console.log(query)
			// 绑定家政师
			if (type == 'bind_id' && id) {
				app.globalData.bind_nanny_id = id;
			}
			// 打开家政师详情页
			if (type == 'nanny_id' && id) {
				wx.navigateTo({
					url: '../housekeeper/housekeeper?nanny_id=' + id,
				})
			}
			that.setData({
				scene: type,
				qrcode_id: id
			})
			app.globalData.scene = type;
			request.qrcodeAdd({
				scene: type,
				qrcode_id: id
			}).then(res => {
				console.log(res)
			})
		}
	},
	// 轮播图下标圆点
	swiperChange(e) {
		let swiperCurrent = e.detail.current;
		this.setData({ swiperCurrent })
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
				if (that.data.scene != '') {
					request.qrcodeAddress({
						scene: that.data.scene,
						qrcode_id: that.data.qrcode_id,
						province: res.result.address_component.province,
						city: res.result.address_component.city,
						district: res.result.address_component.district,
						street: res.result.address_component.street,
						address: res.result.address
					}).then(res => {
						console.log(res)
					})
				}
				that.setData({
					city: res.result.ad_info.city
				})
				if (res.result.ad_info.city != '广州市') {
					Notify({
						type: 'warning',
						message: '您所在城市暂没开通服务'
					});
				}
			}
		})
	},
	// 跳转页面
	toPage(e) {
		const that = this;
		let type = e.currentTarget.dataset.type;
		if (type == 'address') {
			wx.navigateTo({
				url: '../address/address',
			})
		} else if (type == 'detail') {
			let goods_id = e.currentTarget.dataset.id;
			wx.navigateTo({
				url: '../details/details?goods_id=' + goods_id,
				complete() {
					for (let i in that.data.partList) {
						that.data.partList[i].list.forEach((item, index) => {
							if (goods_id == item.goods_id) {
								if (item.subtitle4) {
									wx.setStorageSync('subtitle4', item.subtitle4)
									return
								} else {
									wx.removeStorageSync('subtitle4')
								}
							}
						})
					}
				}
			})
		} else if (type == 'active') {
			wx.navigateTo({
				url: '../active/active',
			})
			this.setData({ activeShow: false })
		} else {
			let navigateToUrl =  e.currentTarget.dataset.pages;
			if (navigateToUrl != '') {
				wx.navigateTo({
					url: '../../' + navigateToUrl
			  	})
			}
		}
	},
	onShow: function () {
		// 获取上一页选择的城市
		let pages = getCurrentPages();
		let currPage = pages[pages.length - 1];
		if (currPage.data.addresschose) {
			this.setData({
				city: currPage.data.addresschos
			})
		}
		// 获取首页配置参数
		this.data.timerArr.forEach((item, index) => {
			clearInterval(item)
		})
		request.getIndex({}).then(res => {
			if (res.code == 0) {
				let partList = res.data.part;
				let banner = res.data.banner;

				// 活动弹出层
				// let isActive = wx.getStorageSync('activeTime') >= util.format(new Date(), 'yyyy-MM-dd') ? false : true;
				// if (isActive) {
				// 	if (!wx.getStorageSync('activeTime')) {
				// 		let imgArr = res.data.other_images;
				// 		for (let i in imgArr) {
				// 			if (imgArr[i].tag == 'active') {
				// 				this.setData({ activeImg: imgArr[i].images, activeShow: true })
				// 				wx.setStorageSync('activeTime', '2021-01-01')
				// 			}
				// 		}
				// 	}
				// }
				
				wx.setStorageSync('img', res.data.other_images);
				this.setData({ partList, isNetword: true, banner, isLoading: false })
				this.setCountDown();
			} else {
				if (res.msg) {
					Notify({
						type: 'danger',
						message: res.msg
					});
				} else {
					Notify({
						type: 'danger',
						message: '请联系工作人员'
					});
				}
			}
		})
		// 判断是否登录 获取家政师电话
		if (wx.getStorageSync('phone')) {
			this.getNannyPhone()
		}
	},
	// 倒计时
	setCountDown() {
		let {
			partList
		} = this.data;
		partList.map((item, index) => {
			item.list.map((item2, index2) => {
				if (item2.countdown > 0) {
					item2.formatTime = this.getFormat(item2.countdown);
					let out = setInterval(() => {
						item2.countdown--;
						item2.formatTime = this.getFormat(item2.countdown);
						this.setData({
							partList
						})
					}, 1000)
					var arr = this.data.timerArr
					arr.push(out)
					this.setData({
						timerArr: arr
					})
				}
			})
		})
		this.setData({
			partList
		})
	},
	getFormat(times) {
		let day = 0,
			hour = 0,
			minute = 0,
			second = 0;

		if (times > 0) {
			day = Math.floor(times / (60 * 60 * 24));
			hour = Math.floor((times / 60 / 60) % 24);
			minute = Math.floor((times / 60) % 60);
			second = Math.floor((times) % 60);
		}

		if (day < 10) day = '0' + day;
		if (hour < 10) hour = '0' + hour;
		if (minute < 10) minute = '0' + minute;
		if (second < 10) second = '0' + second;

		let str = day + ':' + hour + ':' + minute + ':' + second;
		return str.split(':');
	},
	closeTips() {
		this.setData({ activeShow: false })
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
					this.setData({
						phoneShow: false
					})
				}
			} else {
				this.setData({
					phoneShow: false
				})
			}
		})
	},
	// 拨打电话
	callMobile(e) {
		wx.makePhoneCall({
			phoneNumber: e.currentTarget.dataset.phone,
			fail: () => {
				
			}
		})

	},
	// 拨打电话或者打开电话列表
	callPhone() {
		const that = this;
		if (this.data.phoneList.length < 2) {
			let phone = that.data.phoneList[0].phone
			wx.makePhoneCall({
				phoneNumber: phone,
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
	onShareAppMessage() {

	},
	onShareTimeline() {
		return {
			title: '家舒安家政·酒店级品质'
		}
	}
})