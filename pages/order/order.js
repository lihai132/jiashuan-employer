import Dialog from '@vant/weapp/dialog/dialog';
import Notify from '@vant/weapp/notify/notify';
const api = require('../../utils/request');
let isClickPay = true;

Page({
    data: {
        height: '',
        orderList: [],
        page: 1,
        isRefresh: false,       // 下拉刷新状态
        isEnd: true,            // 是否已经加载完数据了
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
    // 跳转页面 type: 0 - 订单详情, 1 - 预约服务, 2 - 选择家政师, 3 - 再试一单，4 - 转包月服务，5 - 首页
    toPage: function(e) {
        let type = e.currentTarget.dataset.type;
        let id = e.currentTarget.dataset.id;
        if (type == 0) {
            let index = e.currentTarget.dataset.index;
            let service_id = this.data.orderList[index].service_id;     // 获取订单服务次数id
            let order_type = e.currentTarget.dataset.order_type;        // 订单类型
            let status = e.currentTarget.dataset.status;                // 订单状态
            
            if (status != 10) {
                wx.navigateTo({
                    url: '../orderDetail/index?id=' + id +"&service_id="+ service_id +'&order_type=' + order_type
                })
            }
        } else if (type == 1) {
            let order_type = e.currentTarget.dataset.order_type;    // 0 试用，1长期
            let restart_status = e.currentTarget.dataset.restart_status;          // 是否编辑 1编辑，0不可编辑
            let is_cook = e.currentTarget.dataset.is_cook;          // 是否做饭，做饭的订单展示菜系，反之不展示
            let navigateToUrl = '';
            if (restart_status == 1) {
                navigateToUrl = '../service/service?id=' + id + '&order_type=' + order_type + '&is_cook=' + is_cook + '&restart_status=' + restart_status
            } else {
                navigateToUrl = '../service/service?id=' + id + '&order_type=' + order_type + '&is_cook=' + is_cook
            }
            wx.navigateTo({
                url: navigateToUrl
            })
        } else if (type == 2) {
            let index = e.currentTarget.dataset.index;
            let id = this.data.orderList[index].service_id;
            wx.navigateTo({
                url: '../chooseNanny/chooseNanny?id=' + id
            })
        } else if (type == 3) {
            wx.navigateTo({
                url: '../details/details?goods_id=' + id
            })
        } else if (type == 4) {
            let sub_goods_id =  e.currentTarget.dataset.subid;
            wx.navigateTo({
                url: '../monthly/monthly?order_id='+ id + '&sub_goods_id=' + sub_goods_id
            })
        } else {
            wx.switchTab({
              url: '../index/index',
            })
        }
    },
    // 调起微信支付
    toPay(e) {
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
                            this.onShow()
                        },
                        fail (res) {}
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
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        const that = this;
        // 根据用户是否登录
        if (wx.getStorageSync('phone')) {
            that.getOrderList()
            // 实时更新数据
            getApp().globalData.callback = function (res) {
                if (res.code == 0) {
                    let msg = JSON.parse(res.msg);
                    // 匹配家政师
                    if (msg.opt == 'matching') {
                        that.getOrderList();
                        if (msg.data.errcode != 0) {
                            Notify({ type: 'danger', message: msg.data.tips });
                        } else {
                            Dialog.alert({
                                message: '已为您匹配到家政师',
                                theme: 'round-button',
                            }).then(() => {
                                // on close
                            });
                        }
                    }
                    // 匹配超时
                    if (msg.opt == 'overtime') {
                        that.getOrderList();
                        Dialog.alert({
                            message: '匹配超时',
                            theme: 'round-button',
                        }).then(() => {
                            // on close
                        });
                    }
                }
            }
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
            this.setData({
                isRefresh: false
            })
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

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})