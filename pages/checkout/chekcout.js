const api = require("../../utils/request.js");
import Notify from '@vant/weapp/notify/notify';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        detailData: '',
        switchVal: 1,          // 是否开启每月代付 0-关闭，1-开启（默认）
        isPayBtn: true,        // 防止用户重复点击
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        
    },
    // 是否开启每月代付
    switchHandle(e) {
        let switchVal = e.currentTarget.dataset.val;
        this.setData({ switchVal })
    },
    // 提交订单
    payHandle() {
        if (this.data.isPayBtn) {
            this.setData({ isPayBtn: false })
            let params = {
                uid: this.data.detailData.uid,
                goods_id: this.data.detailData.goods_id,
                part_time: this.data.detailData.part_time,
                order_id: this.data.detailData.order_id,
                nanny_id: this.data.detailData.nanny_id
            }
            if (this.data.detailData.goods_type == 1) {
                params.cycle_id = this.data.detailData.cycle_id
            }
            api.postorder(params).then(res => {
                this.setData({ isPayBtn: true })
                if (res.code == 0) {
                    let order_id = res.data.order_id;
                    wx.requestPayment({
                        timeStamp: res.data.timeStamp,
                        nonceStr: res.data.nonceStr,
                        package: res.data.package,
                        signType: res.data.signType,
                        paySign: res.data.paySign,
                        success (res) {
                            wx.switchTab({
                              url: '../order/order',
                            })
                        },
                        fail (res) {
                            api.payFail({
                                uid: wx.getStorageSync('uid'),
                                order_id: order_id
                            }).then(res => {})
                            wx.switchTab({
                                url: '../order/order',
                            })
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
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        let detailData = JSON.parse(wx.getStorageSync('params'))
        if (detailData.goods_type == 1) {
            detailData.total = parseFloat(detailData.price * 2).toFixed(2)
        } else {
            detailData.total = detailData.price;
        }
        this.setData({ detailData })
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
        wx.removeStorageSync('params')
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