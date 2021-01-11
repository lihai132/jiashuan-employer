import Notify from '@vant/weapp/notify/notify';
const api = require('../../utils/request');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        abnormalList: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        api.getAbnormal({
            uid: wx.getStorageSync('uid'),
            order_id: options.order_id
        }).then(res => {
            if (res.code == 0) {
                if (res.data) {
                    this.setData({ abnormalList: res.data })
                }
            } else {
                if (res.msg) {
                    Notify({ type: 'danger', message: res.msg });
                } else {
                    Notify({ type: 'danger', message: '请联系工作人员' });
                }
            }
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

    },
    telHandle(e) {
        wx.makePhoneCall({
            phoneNumber: e.currentTarget.dataset.phone,
            fail: function () {}
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