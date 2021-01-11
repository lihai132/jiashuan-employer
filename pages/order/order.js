import Notify from '@vant/weapp/notify/notify';
const api = require('../../utils/request');
let isClickPay = true;

Page({
    data: {
        isLoading: true,
        height: '',
        orderList: [],
        page: 1,
        isRefresh: false,       // 下拉刷新状态
        isEnd: true,            // 是否已经加载完数据了
        orderTisShow: false,	// 满单提示框
        shareShow: false,       // 分享提示框
        shareLineShow: false,   // 分享指示
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.getSystemInfo({
          success: (result) => {
            this.setData({
                height: result.windowHeight
              })
            }
        })
        // 判断是否登录
        if (!wx.getStorageSync('phone')) {
            wx.navigateTo({
                url: '../authorize/authorize',
            })
        }
        let imgList = wx.getStorageSync('img')
        for (let i in imgList) {
            // 满单背景图
            if (imgList[i].tag == 'guide') {
                this.setData({ guideImg: imgList[i].images })
            }
            // 分享背景图
            if (imgList[i].tag == 'share') {
                this.setData({ shareImg: imgList[i].images })
            }
        }
    },
    restartHandle(e) {
        api.restartMatching({
            uid: wx.getStorageSync('uid'),
            service_id: e.currentTarget.dataset.s_id
        }).then(res => {
            if (res.code != 0) {
                Notify({ type: 'danger', message: res.data });
            } else {
                this.data.orderList[e.currentTarget.dataset.index].button_status = 8
                this.setData({
                    orderList:  this.data.orderList
                })
            }
        })
    },
    // 跳转页面 type: 0 - 订单详情, 1 - 重新下单, 2 - 挑选已服务过的家政师(转长期), 3 - 活动规则
    toPage: function(e) {
        let type = e.currentTarget.dataset.type;
        if (type == 0) {
            let order_id = e.currentTarget.dataset.order_id;
            wx.navigateTo({
                url: '../orderDetail/index?order_id=' + order_id
            })
        } else if (type == 1) {
            let goods_id = e.currentTarget.dataset.goods_id;
            wx.navigateTo({
                url: '../details/details?goods_id=' + goods_id
            })
        } else if (type == 2) {
            let order_id = this.data.order_id == undefined ? e.currentTarget.dataset.order_id : this.data.order_id;
            wx.navigateTo({
                url: '../nannyList/nannyList?order_id=' + order_id
            })
            this.setData({ orderTisShow: false })
        } else if (type == 3) {
            wx.navigateTo({
                url: '../rules/rules'
            })
            this.setData({ shareShow: false })
        } else {
            wx.switchTab({
                url: '../index/index'
            })
        }
    },
    // 调起微信支付
    toPay(e) {
        const that = this;
        if (isClickPay) {
            isClickPay = false;
            api.wxPay({
                order_id: e.currentTarget.dataset.id,
                uid: wx.getStorageSync('uid')
            }).then(res => {
                isClickPay = true;
                if (res.code == 0) {
                    wx.requestPayment({
                        timeStamp: res.data.timeStamp,
                        nonceStr: res.data.nonceStr,
                        package: res.data.package,
                        signType: res.data.signType,
                        paySign: res.data.paySign,
                        success (res) {
                            that.getOrderList()
                        },
                        fail (res) {
                            api.payFail({
                                uid: wx.getStorageSync('uid'),
                                order_id: e.currentTarget.dataset.id
                            }).then(res => {})
                        }
                    })
                } else {
                    if (res.msg) {
                        Notify({ type: 'danger', message: res.msg });
                    } else {
                        Notify({ type: 'danger', message: '请联系工作人员' });
                    }
                }
            })
        }
    },
    // 拨打电话 联系家政师 or 联系站长
    telHandle(e) {
        let phoneNumber = e.currentTarget.dataset.phone;
        wx.makePhoneCall({
            phoneNumber: phoneNumber, 
            fail: function() {}
        })
    },
    // 微信小程序原生 scroll-view 滚动到底部/右边时触发
    lower() {
        const that = this;
        const isEnd = that.data.isEnd;  // 判断是否已经加载完数据了

        if (isEnd) {
            const oldList = that.data.orderList;
            const page = ++that.data.page;
            api.getOrderList({
                uid: wx.getStorageSync('uid'),
                page: page
            }).then(res => {
                if (res.code == 0) {
                    // 通过接口不再返回 res.data 字段可以判断
                    if (res.data == undefined) {
                        that.setData({ isEnd: false })
                        return
                    }
                    let newList = res.data;
                    that.setData({
                        orderList: oldList.concat(newList)
                    })
                } else {
                    if (res.msg) {
                        Notify({ type: 'danger', message: res.msg });
                    } else {
                        Notify({ type: 'danger', message: '请联系工作人员' });
                    }
                }
            })
        }
    },
    onReady: function () {

    },
    onShow: function () {
        // 根据用户是否登录
        if (wx.getStorageSync('phone')) {
            this.getOrderList()
            

        } else {
            this.setData({ orderList: [], isLoading: false })
        }
    },
    // 获取订单列表信息
    getOrderList() {
        const that = this;
        api.getOrderList({
            uid: wx.getStorageSync('uid'),
            page: 1
        }).then(res => {
            if (res.code == 0) {
                let orderList = res.data;
                for (let i in orderList) {
                    if (orderList[i].is_guide_conversion == true) {
                        if (!wx.getStorageSync('orderTips')) {
                            wx.setStorageSync('orderTips', { order_id: orderList[i].order_id, end_count: orderList[i].end_count})
                            this.setData({ orderTisShow: true, order_id: orderList[i].order_id })
                        } else {
                            let orderTips = wx.getStorageSync('orderTips');
                            if (orderTips.order_id != orderList[i].order_id) {
                                this.setData({ orderTisShow: true, order_id: orderList[i].order_id })
                                wx.setStorageSync('orderTips', { order_id: orderList[i].order_id })
                            }
                            if (orderTips.order_id == orderList[i].order_id && orderTips.end_count != orderList[i].end_count) {
                                this.setData({ orderTisShow: true, order_id: orderList[i].order_id })
                                wx.setStorageSync('orderTips', { order_id: orderList[i].order_id ,end_count: orderList[i].end_count})
                            }
                        }
                        break;
                    }
                }
                that.setData({
                    orderList: res.data,
                    page: 1,
                    isEnd: true
                })
            } else {
                if (res.msg) {
                    Notify({ type: 'danger', message: res.msg });
                } else {
                    Notify({ type: 'danger', message: '请联系工作人员' });
                }
            }
            this.setData({ isLoading: false, isRefresh: false })
        }).catch(err => {})
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
    onRefresh(e) {
        this.setData({
            isRefresh: true
        })
        this.getOrderList();
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },
    shareOpen() {
        this.setData({ shareShow: true })
        wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
        })
    },
    openShareLine() {
        this.setData({shareLineShow: true})
    },
    closeTips(e) {
        let index = e.currentTarget.dataset.index;
        if (index == 1) {
            this.setData({ orderTisShow: false })
        } else if (index == 2) {
            this.setData({ shareShow: false })
        } else if (index == 3) {
            this.setData({ shareLineShow: false })
        }
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        let share_uid = wx.getStorageSync('uid');
        this.setData({ shareLineShow: false })
        return {
            title: '家舒安邀您领福利!',
            path: '/pages/active/active?share_uid=' + share_uid
        }
    },
	onShareTimeline() {
        let share_uid = wx.getStorageSync('uid');
        this.setData({ shareLineShow: false })
        return {
            title: '家舒安邀您领福利!',
            path: '/pages/active/active?share_uid=' + share_uid
        }
	}
})