const request = require("../../utils/request");

Page({

    /**
     * 页面的初始数据
     */
    data: {
        
    },
    // 登录授权，获取用户手机号码
    getPhoneNumber(e) {
        const that = this;
        request.getPhone({
            iv: e.detail.iv,
            encryptedData: e.detail.encryptedData,
            uid: wx.getStorageSync('uid')
        }).then(res => {
            if (res.code == 0) {
                wx.setStorageSync('phone', res.data.phone);
                wx.navigateBack({
                  delta: 1,
                })
            }
        })
    },
    toPage() {
        wx.navigateTo({
          url: '../agreementPrivacy/agreementPrivacy',
        })
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        getApp().login().then(() => {})
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