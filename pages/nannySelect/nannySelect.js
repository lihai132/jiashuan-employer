import Notify from '@vant/weapp/notify/notify';
const api = require("../../utils/request.js");

Page({
    data: {
        wHeight: 0,
        nannyList: [],
        nannyIndex: -1,
        btnStatus: false,
    },
    onLoad: function (options) {
        const that = this;
        wx.getSystemInfo({
            success: (result) => {
                let wHeight = result.windowHeight - 57;
                that.setData({ wHeight })
            }
        })
        let params = JSON.parse(options.params);
        api.getNannyList({service_id: params.service_id}).then(res => {
            if (res.code == 0) {
                this.setData({ nannyList: res.data, params })
            } else {
                if (res.msg) {
                    Notify({ type: 'danger', message: res.msg });
                } else {
                    Notify({ type: 'danger', message: '请联系工作人员' });
                }
            }
        })
    },
    radioChecked(e) {
        let index = e.currentTarget.dataset.index;
        let nanny_id = e.currentTarget.dataset.nanny_id;
        this.setData({nannyIndex: index, ['params.nanny_id']: nanny_id, btnStatus: true })
    },
    submit() {
        if (this.data.params.nanny_id == '') {
            Notify({ type: 'danger', message: '请选择家政师' });
            return
        }
        wx.showLoading({ title: '请等待...' })
        if (this.data.btnStatus) {
            this.setData({ btnStatus: false })
            api.applyChangeDate(this.data.params).then(res => {
                if (res.code == 0) {
                    wx.navigateBack({
                        delta: 1,
                    })
                } else {
                    if (res.msg) {
                        Notify({ type: 'danger', message: res.msg });
                    } else {
                        Notify({ type: 'danger', message: '请联系工作人员' });
                    }
                }
                this.setData({ btnStatus: true });
                wx.hideLoading();
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