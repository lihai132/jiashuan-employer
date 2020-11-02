import Notify from '@vant/weapp/notify/notify';
const util = require('../../utils/util');
const api = require('../../utils/request');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        count: 0,
        fileList: [],
        remark: '',
        images: [],
    },
    // 计算 textarea 字符串
    textareaInput(e) {
        this.setData({
            count: e.detail.value.length,
            remark: e.detail.value
        })
    },
    // 上传图片
    afterRead(event) {
        const that = this;
        const { file } = event.detail;
        wx.uploadFile({
            url: api.uploadImgUrl,
            filePath: file.path,
            name: 'file',
            success (res){
                let imageData = JSON.parse(res.data);
                const { fileList = [] } = that.data;
                fileList.push({ ...file, url: imageData.data.url });
                that.data.images.push(imageData.data.url)
                that.setData({ fileList });
            }
        })
    },
    // 删除图片
    delPic(e) {
        let index = e.detail.index;
        let fileList = this.data.fileList;
        fileList.splice(index, 1)
        let images = this.data.images;
        images.splice(index, 1)
        this.setData({ fileList, images })
    },
    // 提交信息
    submit: function() {
        const that = this;
        if (util.trim(that.data.remark, 2) == '') {
            Notify({ type: 'danger', message: '请描述您遇到的问题与建议' });
        } else {
            api.submitFeedback({
                uid: wx.getStorageSync('uid'),
                remark: that.data.remark,
                images: that.data.images
            }).then(res => {
                if (res.code == 0) {
                    Toast({
                        type: 'success',
                        message: '提交成功',
                        onClose: () => {
                            wx.navigateBack({
                                delta: 1,
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
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

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