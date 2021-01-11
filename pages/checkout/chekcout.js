const api = require("../../utils/request.js");
import Notify from '@vant/weapp/notify/notify';
import Dialog from '@vant/weapp/dialog/dialog';
let startPoint;

Page({
    data: {
        detailData: '',
        active: -1,
        period_id: '',
        current: -1,
        part_time: '',              // 服务时间段
        price: '',
        isPayBtn: true,             // 防止用户重复点击
        reserveData: '',            // 预约信息
        btnStatus: false,           // 按钮状态
        windowWidth: '',
        windowHeight: '',
        buttonTop: 0,
        buttonLeft: 0,
    },
    onLoad: function (options) {
        let that = this;
        //  高度自适应
        wx.getSystemInfo({
            success: function (res) {
                that.setData({
                    windowHeight:  res.windowHeight,
                    windowWidth:  res.windowWidth,
                    buttonTop:  res.windowHeight - 200,     // 悬浮按钮初始位置
                    buttonLeft:  res.windowWidth - 75       // 悬浮按钮初始位置
                });
            }
        });
    },
    // 提交订单
    payHandle() {
        const that = this;
        if (this.data.detailData.goods_type == 1) {
            if (this.data.active == -1) {
                Notify({ type: 'danger', message: '请选择套餐' });
                return
            } else if (this.data.current == -1) {
                Notify({ type: 'danger', message: '请选择服务时间段' });
                return
            }
        }
        if (that.data.reserveData == '') {
            Notify({ type: 'danger', message: '请填写服务详情' });
        } else {
            // 订阅通知权限
			let message = JSON.parse(wx.getStorageSync('message'));
			let pay = message.pay.split(',');
			wx.requestSubscribeMessage({
				tmplIds: pay,
				complete() {
					that.submitOrder(that.data.reserveData)
				} 
			})
        }
    },
    submitOrder(params) {
        const that = this;
        wx.showLoading({
            title: '请等待...',
        })
        if (this.data.isPayBtn) {
            this.setData({ isPayBtn: false })
            api.postorder(params).then(res => {
                wx.hideLoading();
                this.setData({ isPayBtn: true })
                if (res.code == 0) {
                    let order_id = res.data.order_id;
                    console.log(res.data)
                    wx.requestPayment({
                        timeStamp: res.data.timeStamp,
                        nonceStr: res.data.nonceStr,
                        package: res.data.package,
                        signType: res.data.signType,
                        paySign: res.data.paySign,
                        success(res) {
                            wx.reLaunch({
                                url: '../orderDetail/index?order_id=' + order_id + '&type=success'
                            })

                            let gdt_vid = wx.getStorageSync('gdt_vid')
                            let type = wx.getStorageSync('type')
                            let aid = wx.getStorageSync('aid')
                            let weixinadinfo = wx.getStorageSync('weixinadinfo')
                            
                            let obj={
                                value: that.data.price,
                                user: that.data.reserveData.name,
                                phone: that.data.reserveData.phone,
                                order_id:order_id
                            }
                            obj=JSON.stringify(obj)
                            if (gdt_vid) {
                                let advertisementData = {
                                    "click_id": gdt_vid,
                                    "token": wx.getStorageSync('token'),
                                    "action_type": "COMPLETE_ORDER",
                                    "type": type,
                                    "aid": aid,
                                    "weixinadinfo": weixinadinfo,
                                    "action_param": obj,
                                }
                                api.comesbackmini(advertisementData).then(res => {
                                    if (res.code == 0) {
                                        console.log(res)
                                    }
                                })
                            }
                        },
                        fail(res) {
                            api.payFail({
                                uid: wx.getStorageSync('uid'),
                                order_id: order_id
                            }).then(res => {})
                            wx.switchTab({
                                url: '../order/order',
                            })
                        },
                        complete(res) {
                            wx.removeStorageSync('params');
                            let formData = wx.getStorageSync('formData');
                            formData.service_date = '';
                            delete formData.remark;
                            delete formData.part_time;
                            delete formData.period_id;
                            delete formData.week_id;
                            wx.setStorageSync('formData', formData);
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
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },
    onShow: function () {
        let detailData = wx.getStorageSync('params');
        this.setData({ detailData })

        if (wx.getStorageSync('formData')) {
            let reserveData = wx.getStorageSync('formData');
            if (detailData.goods_type == 1) {
                let period_list = detailData.period_list;
                for (let i in period_list) {
                    if (detailData.period_id == period_list[i].id) {
                        let period_title = period_list[i].title;
                        this.setData({ active: i, period_id: period_list[i].id, period_title })
                    }
                }
                let time_price = detailData.time_price;
                for (let k in time_price) {
                    if (detailData.part_time_value == time_price[k].part_time) {
                        this.setData({ current: k, part_time: time_price[k].part_time })
                    }
                }
            }
            this.setData({ price: detailData.price })

            if (reserveData.service_date == '') {
                return
            }
            reserveData.uid = detailData.uid;
            reserveData.goods_id = detailData.goods_id;
            if (detailData.goods_type == 1) {
                reserveData.period_id = detailData.period_id;
                reserveData.part_time = detailData.part_time_value;
                reserveData.service_number = detailData.num;
                if (detailData.nanny_id) {
                    reserveData.nanny_id = detailData.nanny_id;
                    reserveData.origin_order_id = detailData.origin_order_id;
                }
            }
            reserveData.bind_nanny_id = detailData.bind_nanny_id;
            reserveData.scene = detailData.scene;
            reserveData.share_uid = detailData.share_uid;

            let serviceDateList = reserveData.service_date.split(',');
            let address = reserveData.address.split(',')[0];
            let addressName = reserveData.address.split(',')[1];

            this.setData({ reserveData, btnStatus: true, serviceDateList, address, addressName })
        } else {
            this.setData({ btnStatus: false, price: detailData.price })
        }
    },
    clickHandle(e) {
        // type: 1 - 频次，2 - 服务时间段
        let type = e.currentTarget.dataset.type;
        let index = e.currentTarget.dataset.index;
        
        if (this.data.btnStatus == true) {
            Dialog.confirm({
                message: '服务时间及周期需要重新选择，确定要调整吗？'
            }).then(() => {
                if (type == 1) {
                    let period_id = this.data.detailData.period_list[index].id;
                    let service_number = this.data.detailData.period_list[index].select_num;
                    let period_title = this.data.detailData.period_list[index].title;
                    this.setData({ active: index, period_id, period_title, ['detailData.service_number']: service_number, ['detailData.week_name']: '' })
                } else {
                    let part_time = this.data.detailData.time_price[index].part_time;
                    this.setData({ current: index, part_time })
                    if (this.data.reserveData != '') {
                        this.setData({ ['reserveData.part_time']: part_time, ['detailData.part_time_value']: part_time })
                    }
                }
                this.setData({ btnStatus: false, reserveData: '' })
                let formData = wx.getStorageSync('formData')
                delete formData.week_id;
                formData.service_date = '';
                wx.setStorageSync('formData', formData);
            })
        } else {
            if (type == 1) {
                let period_id = this.data.detailData.period_list[index].id;
                let service_number = this.data.detailData.period_list[index].select_num;
                let period_title = this.data.detailData.period_list[index].title;
                this.setData({ active: index, period_id, period_title, ['detailData.service_number']: service_number })
            } else {
                let part_time = this.data.detailData.time_price[index].part_time;
                let part_time_id = this.data.detailData.time_price[index].part_time_id;
                this.setData({ current: index, part_time, ['detailData.part_time_id']: part_time_id })
                if (this.data.reserveData != '') {
                    this.setData({ ['reserveData.part_time']: part_time, ['detailData.part_time_value']: part_time })
                }
            }
        }
    },
    toPage() {
        let goods_type = this.data.detailData.goods_type;
        if (goods_type == 1) {
            if (this.data.active == -1) {
                Notify({ type: 'danger', message: '请选择频次' });
                return
            } else if (this.data.current == -1) {
                Notify({ type: 'danger', message: '请选择服务时间段' });
                return
            } else {
                let detailData = this.data.detailData;
                detailData.period_id = this.data.period_id;
                detailData.part_time_value = this.data.part_time;
                detailData.price = this.data.price;
                detailData.period_title = this.data.period_title;
                if (this.data.reserveData == '') {
                    detailData.week_name = ''
                }
                wx.setStorageSync('params', detailData)
            }
        }
        wx.navigateTo({
            url: '../service/service'
        })
    },
    buttonStart: function (e) {
        startPoint = e.touches[0]
    },
    buttonMove: function (e) {
        let endPoint = e.touches[e.touches.length - 1];
        let translateX = endPoint.clientX - startPoint.clientX;
        let translateY = endPoint.clientY - startPoint.clientY;
        startPoint = endPoint;
        let buttonTop = this.data.buttonTop + translateY;
        let buttonLeft = this.data.buttonLeft + translateX;
        //判断是移动否超出屏幕 -- 80为按钮的宽度
        if (buttonLeft + 75 >= this.data.windowWidth){
            buttonLeft = this.data.windowWidth - 75;
        }
        if (buttonLeft <= 0){
            buttonLeft = 0;
        }
        if (buttonTop <= 0){
            buttonTop = 0
        }
        // 50是按钮的高度
        if (buttonTop + 50 >= this.data.windowHeight){
            buttonTop = this.data.windowHeight - 50;
        }
        this.setData({ buttonTop, buttonLeft })
    },
    buttonEnd(e) {},
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