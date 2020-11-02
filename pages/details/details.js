var request = require("../../utils/request.js");
import Notify from '@vant/weapp/notify/notify';

Page({
	/**
	 * 页面的初始数据
	 */
	data: {
		goodsType: 0, 				// 订单类型 0-试用订单，1-长期订单
		cycleList: [], 				// 长期订单数组选择
		cycleCurrent: -1, 			// 长期订单选中的坐标
		cycle_id: '', 				// 长期订单选中的id值
		cycle_name: '',				// 长期订单选中的名称
		payDisabled: true,			// 支付按钮状态，默认禁止状态
		goods_id: '',
		isData: true,
		toView: 'contentBox',
		nowstatus: 'contentBox',
		isFixed: false,
		price: '',
		detailsData: '',
		active: 0,
		show: false,
		selected: -1,
		selectTimer: '请选择 服务时间段',
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		let that = this;
		if (options.order_id || options.nanny_id) {
			this.setData({
				order_id: options.order_id,
				nanny_id: options.nanny_id
			})
		} else {
			this.setData({ goods_id: options.goods_id })
		}
		
		if (wx.getStorageSync('uid')) {
			that.getDetailData(options.goods_id, options.order_id)
		} else {
			getApp().login().then(() => {
				that.getDetailData(options.goods_id, options.order_id)
			})
		}
	},
	getDetailData(goods_id, order_id) {
		let that = this;
		request.getDetails({
			goods_id: goods_id,
			uid: wx.getStorageSync('uid'),
			order_id: order_id || ''
		}).then(res => {
			if (res.code == 0) {
				let maxValue = ''
				Math.max.apply(Math, res.data.time_price.map(function (o) {
					maxValue = o.price
				}))
				this.setData({
					detailsData: res.data,
					price: res.data.min_price + '~' + maxValue,
					goodsType: res.data.goods_type,
					cycleList: res.data.cycle_list || []
				})

				setTimeout(() => {
					// 计算 服务内容，图文详情，常见问题 高度
					let query = wx.createSelectorQuery();
					query.select('.app-content').boundingClientRect(res => {
						that.setData({
							menuTop: res.top
						})
					}).exec()
					query.select('#contentBox').boundingClientRect(res => {
						that.setData({
							contentBoxTop: res.top
						})
					}).exec()
					query.select('#infoBox').boundingClientRect(res => {
						that.setData({
							infoBoxTop: res.top
						})
					}).exec()
					query.select('#questionBox').boundingClientRect(res => {
						that.setData({
							questionBoxTop: res.top
						})
					}).exec()
				}, 200)
			} else {
				if (res.msg) {
					Notify({ type: 'danger', message: res.msg });
				} else {
					Notify({ type: 'danger', message: '请联系工作人员' });
				}
			}
		}).catch((e) => {})
	},
	// tab 状态栏切换：服务内容，图文详情，常见问题
	toViewClick(e) {
		this.setData({
			toView: e.currentTarget.dataset.hash
		})
		let scrollTop = '';
		let menuHeight = this.data.contentBoxTop - this.data.menuTop;
		switch (e.currentTarget.dataset.hash) {
			case 'contentBox':
				scrollTop = this.data.contentBoxTop - menuHeight;
				break
			case 'infoBox':
				scrollTop = this.data.infoBoxTop - menuHeight;
				break
			case 'questionBox':
				scrollTop = this.data.questionBoxTop - menuHeight;
				break
		}
		wx.pageScrollTo({
			scrollTop: scrollTop
		})
	},
	onPageScroll: function (e) {
		var that = this;

		// 判断是否滚动到一定的位置，固定tab栏在顶部
		if (e.scrollTop < this.data.menuTop) {
			this.setData({
				isFixed: false
			})
		} else {
			this.setData({
				isFixed: true
			})
		}

		// 当滚动到一定的位置 自动切换 tab选中状态
		let menuHeight = this.data.contentBoxTop - this.data.menuTop;
		if (e.scrollTop <= this.data.infoBoxTop) {
			that.setData({
				toView: 'contentBox'
			})
		}
		if (e.scrollTop > this.data.infoBoxTop - menuHeight - 10) {
			that.setData({
				toView: 'infoBox'
			})
		}
		if (e.scrollTop > this.data.questionBoxTop - menuHeight - 10) {
			that.setData({
				toView: 'questionBox'
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
	showPopup() {
		// v1.0.0 隐藏长期状态
		if (this.data.goodsType != 0) {
			getApp().toast('完善中，敬请期待')
			return
		}
		this.setData({
			show: true
		});
	},
	onClose() {
		this.setData({ show: false });
	},
	selectChange: function (e) {
		let id = e.currentTarget.dataset.id;
		let item = e.currentTarget.dataset.item;
		this.setData({
			selected: id,
			selectTimer: item.part_time,
			price: item.price
		})
		if (this.data.goodsType == 0) {
			this.setData({
				payDisabled: false
			})
		} else {
			if (this.data.selected != -1 && this.data.cycleCurrent != -1) {
				this.setData({
					payDisabled: false
				})
			}
		}
	},
	// 选择长期订单
	cycleChange(e) {
		let cycleCurrent = e.currentTarget.dataset.index;
		this.setData({
			cycleCurrent,
			cycle_id: this.data.cycleList[cycleCurrent].id,
			cycle_name: this.data.cycleList[cycleCurrent].title
		})
		if (this.data.selected != -1 && this.data.cycleCurrent != -1) {
			this.setData({
				payDisabled: false
			})
		}
	},
	purchase: function () {
		if (this.data.selected == -1) {
			getApp().toast('请选择服务时间段');
			return
		}
		if (this.data.goodsType == 1) {
			if (this.data.cycleCurrent == -1) {
				getApp().toast('服务周期');
				return
			}
		}
		if (wx.getStorageSync('phone')) {
			let params = {
				uid: wx.getStorageSync("uid"),
				goods_id: this.data.detailsData.id,
				logo: this.data.detailsData.logo,
				title: this.data.detailsData.title,
				goods_type: this.data.goodsType,
				price: this.data.price,
				part_time: this.data.selectTimer,
				cycle_id: this.data.cycle_id,
				cycle_name: this.data.cycle_name,
				order_id: this.data.order_id || '',
				nanny_id: this.data.nanny_id || ''
			}
			wx.setStorageSync('params', JSON.stringify(params));
			// 订阅通知权限
			let message = JSON.parse(wx.getStorageSync('message'));
			let pay = message.pay.split(',');
			wx.requestSubscribeMessage({
				tmplIds: pay,
				complete() {
					wx.navigateTo({
						url: '../checkout/chekcout'
					})
				} 
			})
		} else {
			wx.showToast({
				title: '请登录',
				duration: 2000,
				complete: () => {
					wx.navigateTo({
					  url: '../authorize/authorize',
					})
				}
			})
		}
	},
	onShareAppMessage() {
		return {
			title: this.data.detailsData.title,
			path: '/pages/details/details?goods_id=' + this.data.goods_id,
			imageUrl: this.data.detailsData.logo
		}
	}
})