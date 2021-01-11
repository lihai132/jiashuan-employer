var request = require("../../utils/request.js");
import Notify from '@vant/weapp/notify/notify';
import Dialog from '@vant/weapp/dialog/dialog';

Page({
	/**
	 * 页面的初始数据
	 */
	data: {
		detailsData: '',
		agreementShow: false,
		maskH: '',
		timer: null,
		isLoading: true,
		selectShow: false,
		price: '',
		price_text: '请选择 套餐次数',
		current: -1,
		selectList: [],
		// add
		barFixed: false,
		selectedIndex: 0,
		tabList: [{
			text: "服务内容",		// 选项卡的标题
			navTarget: "#item1"		// 选项卡导航目标元素的ID
		}, {
			text: "产品说明",
			navTarget: "#item2"
		}, {
			text: "预定须知",
			navTarget: "#item3"
		}]
	},
	onLoad: function (options) {
		let that = this;
		wx.getSystemInfo({
		  	success: (result) => {
			  	this.setData({ maskH: result.windowHeight })
		  	}
		})

		if (!wx.getStorageSync('message')) {
			// 获取订阅通知的id
			request.getSubscribeMessageConfig({}).then(res => {
				if (res.code == 0) {
					wx.setStorageSync('message', JSON.stringify(res.data))
				} else {
					if (res.msg) {
						Notify({ type: 'danger', message: res.msg });
					} else {
						Notify({ type: 'danger', message: '请联系工作人员' });
					}
				}
			})
		}
		// 短期转长期 获取家政师id
		if (options.nanny_id != undefined) {
			this.setData({ nanny_id: options.nanny_id, origin_order_id: options.origin_order_id })
		}

		if (wx.getStorageSync('uid')) {
			that.getDetailData(options.goods_id)
		} else {
			getApp().login(() => {
				that.getDetailData(options.goods_id)
			})
		}
	},
	getDetailData(goods_id) {
		let that = this;
		let timer = this.data.timer;
		clearInterval(timer)
		request.getDetails({
			goods_id: goods_id,
			uid: wx.getStorageSync('uid')
		}).then(res => {
			if (res.code == 0) {
				let detailsData = res.data;
				if (detailsData.countdown > 0) {
					detailsData.formatTime = this.getFormat(detailsData.countdown);
					timer = setInterval(() => {
						detailsData.countdown--
						detailsData.formatTime = this.getFormat(detailsData.countdown);
						this.setData({ detailsData })
						if (detailsData.countdown <= 0) {
							clearInterval(timer)
						}
					}, 1000)
				}
				this.setData({
					detailsData,
					price: res.data.min_price,
					goodsType: res.data.goods_type,
					is_buy: res.data.is_buy,
					is_guide_buy: res.data.is_guide_buy,
					isLoading: false
				})
				if (wx.getStorageSync('params')) {
					let params = wx.getStorageSync('params');
					if (goods_id != params.goods_id) {
						wx.removeStorageSync('params');
						let formData = wx.getStorageSync('formData');
						if (formData) {
							formData.service_date = '';
							delete formData.remark;
							delete formData.week_id;
							wx.setStorageSync('formData', formData);
						}
					}
				}
			} else {
				if (res.msg) {
					Notify({ type: 'danger', message: res.msg });
					wx.reLaunch({
					  	url: '../404/404'
					})
				} else {
					Notify({ type: 'danger', message: '请联系工作人员' });
				}
			}
		}).catch((e) => {})
	},
	// 倒计时
	getFormat(times) {
		let day = 0, hour = 0, minute = 0, second = 0;

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

		let str = day+':'+hour+':'+minute+':'+second;
		return str.split(':');
	},
	onPageScroll: function (e) {
		this._selectedTab(e.scrollTop)
	},
	// 锚点定义
	scrollToTarget(e) {
		let selectedIndex = e.currentTarget.dataset.index;
		this.setData({ selectedIndex })
		this._pageScroll(selectedIndex);
	},
	_pageScroll: async function(i) {
		const elment = await this._barInit(i);
		let scrollTop = elment["navTargetTop"][i];
		let duration = elment["duration"];
		let viewHeight = elment["viewHeight"];
		let viewScrollTop = elment["viewScrollTop"];
		if (Math.abs(scrollTop - viewScrollTop) > viewHeight) {
			if (scrollTop > viewScrollTop) {
				await wx.pageScrollTo({
					scrollTop: (scrollTop - viewHeight),
					duration:0
				});
			}else{
				await wx.pageScrollTo({
					scrollTop:( scrollTop + viewHeight),
					duration:0
				});
			}
		}
		await wx.pageScrollTo({
			scrollTop: (scrollTop + 1),
			duration: duration
		});
	},
	_barInit: async function(index) {
		let navTargetTop = [];
		let viewScrollTop = 0;
		let viewHeight = 0;
		for (let i = 0, len=this.data.tabList.length; i < len; i++) {
			navTargetTop[i] = await this._queryMultipleNodes(this.data.tabList[i]["navTarget"]).then(res => {
				let navTarget = res[0],
					viewPort = res[1];
				viewHeight = viewPort.height;
				viewScrollTop = viewPort.scrollTop;
				const scrollTop = parseInt(navTarget.top) + viewPort.scrollTop - 47;
				return scrollTop;
			});
		}
		return {
			navTargetTop: navTargetTop,
			duration: 0,
			viewHeight: viewHeight,
			viewScrollTop: viewScrollTop
		}
	},
	_queryMultipleNodes: function(e, notThis) {
		return new Promise((resolve, reject) => {
			let view = wx.createSelectorQuery();
			if (!!notThis) {
				view.in(this);
			}
			if (!!e) {
				view.select(e).boundingClientRect();
			}
			view.selectViewport().fields({size: true,scrollOffset: true});
			view.exec(function(res) {
				resolve(res);
			});
		});
	},
	_selectedTab: function(y) {
		this._barInit().then(res => {
			let itemIndex = 0;
			for (let i = 0, len = res["navTargetTop"].length; i < len; i++) {
				if (y >= res["navTargetTop"][i]) {
					itemIndex = i;
				}
			}
			this.setData({ selectedIndex: itemIndex })
		})
		this._showBarFixed();
	},
	_showBarFixed: function() {
		this._queryMultipleNodes('#tabStatic', true).then(res => {
			let tabNav = res[0];
			if (tabNav.top < 0) {
				this.setData({ barFixed: true })
			} else {
				this.setData({ barFixed: false })
			}
		})
	},
	onReady: function() {
		// this.setData({ isLoading: false })
	},
	onShow: function () {
		
	},
	submit() {
        if (!wx.getStorageSync('phone')) {
            wx.navigateTo({
                url: '../authorize/authorize'
			})
			return
        }
		if (this.data.is_buy) {
			if (this.data.is_guide_buy) {
				Dialog.confirm({
					title: '温馨提示',
					message: '该商品已存在订单列表，您可以前往订单列表支付',
					confirmButtonText: '前往支付',
					cancelButtonText: '我知道了'
				}).then(() => {
					wx.switchTab({
						url: '../order/order'
					})
				}).catch(() => {});
			} else {
				if (this.data.detailsData.goods_type == 1) {
					this.setData({ selectShow: true })
				} else {
					let agreementShow = !this.data.agreementShow;
					this.setData({ agreementShow })
				}
			}
		} else {
			Dialog.confirm({
				title: '温馨提示',
				message: '该服务仅限未购买过体验套餐的用户的购买，您可以前往首页选择其他服务。',
				confirmButtonText: '返回首页',
				cancelButtonText: '我知道了'
			}).then(() => {
				wx.navigateBack({
					delta: 1,
				})
			}).catch(() => {});
		}
	},
	popupCancel() {
		this.setData({ agreementShow: false })
	},
	toPageHandle() {
		wx.navigateTo({
			url: '../agreementUser/agreementUser'
		})
	},
	selectSubmit() {
		if (this.data.current == -1) {
			Notify({ type: 'danger', message: '请选择套餐' });
		} else {
			this.closeSelect()
			let agreementShow = !this.data.agreementShow;
			this.setData({ agreementShow })
		}
	},
	closeSelect() {
		this.setData({ selectShow: false })
	},
	selectHandle(e) {
		let index = e.currentTarget.dataset.index;
		let price = this.data.detailsData.service_number_list[index].price;
		let price_text = this.data.detailsData.service_number_list[index].title;
		let num = this.data.detailsData.service_number_list[index].num;
		this.setData({ price, current: index, price_text, num })
	},
	toCheckoutPage() {
		const that = this;
		let params = {
			uid: wx.getStorageSync("uid"),
			goods_id: this.data.detailsData.id,
			logo: this.data.detailsData.logo,
			title: this.data.detailsData.title,
			goods_type: this.data.detailsData.goods_type,
			price: this.data.price,
			bind_nanny_id: getApp().globalData.bind_nanny_id,
			scene: getApp().globalData.scene,
			share_uid: getApp().globalData.share_uid
		}
		// 试用转长期
		if (this.data.nanny_id) {
			params.nanny_id = this.data.nanny_id
			params.origin_order_id = this.data.origin_order_id
		}
		if (this.data.detailsData.goods_type == 1) {
			params.period_list = this.data.detailsData.period_list;
			params.time_price = this.data.detailsData.time_price;
			params.num = this.data.num;
			if (wx.getStorageSync('params')) {
				let detailsStorage = wx.getStorageSync('params');
				params.service_number = detailsStorage.service_number
				params.period_id = detailsStorage.period_id
				params.part_time_value = detailsStorage.part_time_value
				params.part_time_id = detailsStorage.part_time_id
				params.week_name = detailsStorage.week_name
			} else {
				params.service_number = ''
				params.part_time_id = ''
			}
		} else {
			params.service_number = this.data.detailsData.select_date_num
			params.part_time_id = this.data.detailsData.part_time_id
		}
		wx.setStorageSync('params', params);
		wx.navigateTo({
			url: '../checkout/chekcout',
			complete() {
				that.setData({ agreementShow: false })
			}
		})
	},
	onShareAppMessage() {
		return {
			title: this.data.detailsData.title,
			path: '/pages/details/details?goods_id=' + this.data.detailsData.id,
			imageUrl: this.data.detailsData.logo
		}
	},
	onShareTimeline() {
		return {
			title: '家舒安家政·酒店级品质',
			query: '../details/details?goods_id=' + this.data.detailsData.id
		}
	}
})