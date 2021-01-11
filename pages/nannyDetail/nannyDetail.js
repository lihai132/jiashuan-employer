import Notify from '@vant/weapp/notify/notify';
var api = require("../../utils/request.js");
Page({

    /**
     * 页面的初始数据
     */
    data: {
        nannyDetails: '',
		imgList: [],
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
	// 获取家政师详情
	starRequest: function (data) {
		const that = this;
		api.nannyGetdetails(data).then(res => {
			if (res.code == 0) {
				let nannyData = res.data;
				that.setData({
					nannyDetails: nannyData,
					imgList: nannyData.spread_image
				})
			} else {
				if (res.msg) {
                    Notify({ type: 'danger', message: res.msg });
                } else {
                    Notify({ type: 'danger', message: '请联系工作人员' });
                }
			}
		}).catch((e) => {})
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