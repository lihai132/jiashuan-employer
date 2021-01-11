var request = require("../../utils/request.js");
import Notify from '@vant/weapp/notify/notify';

Page({
    data: {
		partList: [],
        timerArr:[],
        isLoading: true,
    },
    onLoad: function (options) {
        wx.getSystemInfo({
            success: (result) => {
                this.setData({ height: result.windowHeight })
            }
        })
        // 获取订单id，家政师id参数
        this.setData({ origin_order_id: options.origin_order_id, nanny_id: options.nanny_id })
        // 获取首页配置参数
		this.data.timerArr.forEach((item, index) => {
			clearInterval(item)
		})
		request.getIndex({}).then(res => {
			if (res.code == 0) {
				let partList = res.data.part;
				this.setData({ partList, isLoading: false })
				this.setCountDown();
			} else {
				if (res.msg) {
					Notify({ type: 'danger', message: res.msg });
				} else {
					Notify({ type: 'danger', message: '请联系工作人员' });
				}
			}
		})
    },
	// 倒计时
	setCountDown() {
		let { partList } = this.data;
		partList.map((item, index) => {
			item.list.map((item2, index2) => {
				if (item2.countdown > 0) {
					item2.formatTime = this.getFormat(item2.countdown);
					let out = setInterval(() => {
						item2.countdown--;
						item2.formatTime = this.getFormat(item2.countdown);
						this.setData({ partList })
					}, 1000)
					var arr = this.data.timerArr
					arr.push(out)
					this.setData({ timerArr:arr })
				}
			})
		})
		this.setData({ partList })
	},
	getFormat(times) {
		let day = 0, hour = 0, minute = 0, second = 0;

		if (times > 0) {
			day = Math.floor(times / (60 * 60 * 24));
			hour = Math.floor((times / 60 / 60) % 24);
			minute = Math.floor((times / 60) % 60);
			second = Math.floor((times) % 60);
		}
		
		if (day < 10) day = '0' + day;
		if (hour < 10) hour = '0' + hour;
		if (minute < 10) minute = '0' + minute;
		if (second < 10) second = '0' + second;

		let str = day+':'+hour+':'+minute+':'+second;
		return str.split(':');
	},
    toPage(e) {
        let goods_id = e.currentTarget.dataset.goods_id;
        wx.navigateTo({
          url: '../details/details?goods_id=' + goods_id + '&nanny_id=' + this.data.nanny_id + '&origin_order_id=' + this.data.origin_order_id
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