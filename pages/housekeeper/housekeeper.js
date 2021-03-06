const api = require('../../utils/request');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        personal: ''
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const nanny_id = decodeURIComponent(options.nanny_id);
        if (nanny_id) {
            this.getHousekeeper(nanny_id)
        }
        if (options.scene) {
            const query = decodeURIComponent(options.scene);
			let type = query.split("=")[0]
            let id = query.split("=")[1]
            
            if (type == 'nanny_id' && id) {
                this.getHousekeeper(id);
            }
        }
    },
    getHousekeeper(nanny_id) {
        api.getQrcodedetails({
            nanny_id: nanny_id
        }).then(res => {
            if (res.code == 0) {
                let personal = res.data;
                this.setData({personal})
            }
        })
    },
    toPage() {
        wx.switchTab({
          url: '../index/index',
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