var request = require("../../utils/request.js");

Page({
    data: {
        isLoading: true,
        shareShow: false
    },
    onLoad: function (options) {
        let that = this;
		wx.getSystemInfo({
		  	success: (result) => {
                that.setData({ maskH: result.windowHeight })
		  	}
        })

        let imgList = wx.getStorageSync('img')
        if (imgList) {
            for (let i in imgList) {
                // 背景图
                if (imgList[i].tag == 'poster') {
                    this.setData({ posterImg: imgList[i].images })
                }
            }
        } else {
            request.getIndex({}).then(res => {
                if (res.code == 0) {
                    let imgList = res.data.other_images;
                    for (let i in imgList) {
                        if (imgList[i].tag == 'poster') {
                            this.setData({ posterImg: imgList[i].images })
                        }
                    }
                }
            })
        }
    },
    toPage() {
        wx.switchTab({
            url: '../index/index'
        })
    },
    closeShare() {
        this.setData({ shareShow: false })
    },
    openShare() {
        wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
        })
        this.setData({ shareShow: true })
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        this.setData({isLoading: false})
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
        let share_uid = wx.getStorageSync('uid');
        this.setData({ shareShow: false })
        return {
            title: '家舒安邀您领福利!',
            path: '/pages/active/active?share_uid=' + share_uid
        }
    },
    onShareTimeline: function() {
        let share_uid = wx.getStorageSync('uid');
        this.setData({ shareShow: false })
        return {
            title: '家舒安邀您领福利!',
            path: '/pages/active/active?share_uid=' + share_uid
        }
    }
})