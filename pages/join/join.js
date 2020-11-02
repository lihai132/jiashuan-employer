const util = require('../../utils/util');
const api = require('../../utils/request');
const WxParse = require('../../wxParse/wxParse.js');
import Notify from '@vant/weapp/notify/notify';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        company: '',    // 公司
        introduce: '',  // 公司简介
        position: '',   // 职位
        name: '',       // 用户姓名
        phone: '',      // 手机号
    },
    bindblur(e) {
        const that = this;
        let type = e.currentTarget.dataset.type;
        let value = e.detail.value;
        if (type == 'name') {
            if (util.trim(value, 2) == '') {
                Notify({ type: 'danger', message: '请填写您的姓名' });
                that.setData({ name: '' });
            } else {
                that.setData({ name: value });
            }
        } else {
            if (util.trim(value, 2) == '') {
                Notify({ type: 'danger', message: '请填写您的手机号' });
                that.setData({ phone: '' });
            } else if (!(/^1[3456789]\d{9}$/.test(value))) {
                Notify({ type: 'danger', message: '手机号格式不正确' });
            } else {
                that.setData({ phone: value });
            }
        }
    },
    // 提交表单 姓名 手机号
    submit() {
        if (this.data.name == '') {
            Notify({ type: 'danger', message: '请填写您的姓名' });
        } else if (this.data.phone == '') {
            Notify({ type: 'danger', message: '请填写您的手机号' });
        } else {
            api.joinSubmit({
                uid: wx.getStorageSync('uid'),
                name: this.data.name,
                phone: this.data.phone
            }).then(res => {
                if (res.code == 0) {
                    Notify({ type: 'success', message: '申请成功' });
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
        const that = this;
        api.joinContent({}).then(res => {
            if (res.code == 0) {
                that.setData({
                    company: res.data.corporate_name,
                    introduce: res.data.introduce,
                    position: res.data.position
                })
                WxParse.wxParse('job_content', 'html', res.data.job_content, that);
                WxParse.wxParse('job_require', 'html', res.data.job_require, that);
                WxParse.wxParse('welfare', 'html', res.data.welfare, that);
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