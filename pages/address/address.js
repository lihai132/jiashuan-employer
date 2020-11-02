var QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
var qqmapsdk;

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		locationCity: '定位中...'
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		// 实例化API核心类
        qqmapsdk = new QQMapWX({
            key: 'ZDBBZ-LY2CS-SP5OY-6DE5D-SCEOS-BCB4C'
		});
	},
	selectCity(e) {
		var pages = getCurrentPages();
		var prevPage = pages[pages.length - 2];
		prevPage.setData({
			addresschose: e.currentTarget.dataset.city
		})
		wx.navigateBack({
			delta: 1
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
		// 获取位置
		this.getUserLocation()
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
				if (res.result.ad_info.city) {
					that.setData({ locationCity: res.result.ad_info.city })
				} else {
					that.setData({ locationCity: '定位失败' })
				}
				
			}
		})
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