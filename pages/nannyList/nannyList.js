import Notify from '@vant/weapp/notify/notify';
const api = require('../../utils/request');

Page({
	data: {
		bgWidth: '',
		bgHeight: '',
        nannyList: [],
        actice: -1,
        nanny_id: ''
	},
	onLoad: function (options) {
		wx.getSystemInfo({
			success: (result) => {
			  	this.setData({
					bgWidth: result.windowWidth,
					bgHeight: result.windowHeight
				})
			}
        })
        
        this.setData({ order_id: options.order_id })
		
		wx.showLoading({
		  title: '加载中...',
		})
		api.getUsedSelectList({
			order_id: options.order_id,
			uid: wx.getStorageSync('uid')
		}).then(res => {
			wx.hideLoading()
			if (res.code == 0) {
				this.setData({
					nannyList: res.data
				})
			} else {
				if (res.msg) {
                    Notify({ type: 'danger', message: res.msg });
                } else {
                    Notify({ type: 'danger', message: '请联系工作人员' });
                }
			}
		})
    },
    // 选择家政师
    selectNanny(e) {
        if (e.currentTarget.dataset.status != 0) {
            this.setData({ nanny_id: e.currentTarget.dataset.nanny_id, actice: e.currentTarget.dataset.index })
        }
	},
	nannyDetail(e) {
		wx.navigateTo({
		  url: '../nannyDetail/nannyDetail?nanny_id=' + e.currentTarget.dataset.nanny_id
		})
	},
	nextHandle() {
		let nanny_id = this.data.nanny_id;
		let origin_order_id = this.data.order_id;

		if (nanny_id == '') {
			Notify({ type: 'danger', message: '请选择家政师' });
		} else {
			wx.navigateTo({
				url: '../list/list?origin_order_id=' + origin_order_id + '&nanny_id=' + nanny_id
			})
		}
        
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