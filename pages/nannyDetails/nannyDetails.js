// pages/nannyDetails/nannyDetails.js
var request = require("../../utils/request.js")
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		nannyDetails: '',
		foodList: [],
		menuList: [],
		list: [],
		nanny_id: ""
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		this.starRequest({
			nanny_id: options.nanny_id,
			uid: wx.getStorageSync("uid")
		})

	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () {

	},
	// 获取家政师详情
	starRequest: function (data) {
		const that = this;
		request.nannyGetdetails(data).then(res => {
			if (res.code == 0) {
				let nannyData = res.data;
				that.setData({
					nannyDetails: nannyData,
					foodList: nannyData.flavor_arr,
					menuList: nannyData.good_food_arr,
					list: nannyData.spread_image
				})
			} else {
				getApp().toast(res.msg);
			}
		}).catch((e) => {})
	},
	onShareAppMessage() {
		
	}
})