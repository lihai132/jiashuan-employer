

Page({

    /**
     * 页面的初始数据
     */
    data: {
        swatchVal: 0,
        tab: 0,             // tab切换 0-未缴账单，1-已缴账单
        billList: [],       // 未缴账单
        paidList: [],       // 已缴账单
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        
    },
    // tab 切换
    tabClick(event) {
        this.setData({
            tab: event.detail.name
        })
    },
    payHandle(e) {
        wx.requestPayment({
            timeStamp: '',
            nonceStr: '',
            package: '',
            signType: 'MD5',
            paySign: '',
            success (res) { },
            fail (res) { }
        })
    },
    switchHandle(e) {
        let index = e.currentTarget.dataset.index;
        let val = e.currentTarget.dataset.val;
        this.setData({
            swatchVal: val
        })
    },
    toPage() {
        wx.navigateTo({
          url: '../billManage/billManage',
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