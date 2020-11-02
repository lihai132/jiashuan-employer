import Toast from '@vant/weapp/toast/toast';
const api = require('../../utils/request');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    radio: '',
    list: []
  },
  onChange(event) {
    this.setData({
      radio: event.detail,
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      sub_goods_id: options.sub_goods_id,
      order_id: options.order_id
    })
    api.getHousekeeper({
      order_id: options.order_id,
      uid: wx.getStorageSync('uid')
    }).then(res => {
      if (res.code == 0) {
        this.setData({
          list: res.data
        })
      } else {
        Toast('系统错误')
      }
    })
  },
  nextHandle() {
    if (this.data.radio == '') {
      Toast('请选择家政师');
    } else {
      let nanny_id = this.data.list[this.data.radio].nanny_id;
      let sub_goods_id = this.data.sub_goods_id;
      let order_id = this.data.order_id;
      wx.navigateTo({
        url: '../details/details?goods_id='+sub_goods_id + '&order_id=' + order_id + '&nanny_id=' + nanny_id,
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