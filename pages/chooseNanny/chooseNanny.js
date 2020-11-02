var request = require("../../utils/request.js")
import Notify from '@vant/weapp/notify/notify';

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		radio: 0,
		list: [],
		service_id: "",
		order_id: ""
	},
	onChange(event) {
		this.setData({
			radio: event.detail,
		});
	},
	gotoAetails: function (even) {
		let nanny_id = even.currentTarget.dataset.nanny_id;
		wx.navigateTo({
			url: "/pages/nannyDetails/nannyDetails?nanny_id=" + nanny_id
		})
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		let id = options.id;
		this.setData({
			service_id: id,
			order_id: options.order_id
		})
		let data = {
			"service_id": id,
		}
		request.getseleclList(data).then(res => {
			if (res.code == 0) {
				res.data.map((item, index) => {
					if (index == 0) {
						item.show = true
					}
					if (index == 1) {
						item.show = false
					}
				})
				this.setData({
					list: res.data
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
	choice: function () {
		let nanny_id = this.data.list[this.data.radio].nanny_id;

		request.postselect({
			nanny_id: nanny_id,
			service_id: this.data.service_id
		}).then(res => {
			if (res.code == 0) {
				wx.navigateBack({
					delta: 1,
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
	onShareAppMessage() {

	}
})