import Notify from '@vant/weapp/notify/notify';
import Dialog from '@vant/weapp/dialog/dialog';
const api = require('../../utils/request')

Page({
    data: {
        orderType: 0,           // 0 试用订单详情，1 长期订单详情
        serviceData: '',        // 长期订单的 - 服务详情信息
        status: 0,              // 状态 默认0 - 不显示，1 - 预约，2 - 匹配中，3 - 挑选家政师，4 - 提交
        reserve: true,          // 是否显示我的预约信息
        reserveMsg: false,      // 我的预约 是否查看更多内容
        reserveData: {},        // 我的预约信息
        singular: [],           // 处理完的数据列表
        nannyData: {},          // 家政师资料
        part_time: '',          // 支付时间
        service_time: "",       // 家政师上门服务时间
        pay_time: "",           // 订单支付时间
        listLength: "",         // 请求返回数组的长度
        maskHidden: false,      // 是否显示海报阴影
		qrcode: '',				// 海报中生成的小程序码
		imagePath: '',			// 生成海报路径
        service_id: "",
        nanny_id: "",
        order_id: "",
        housekeeperShow: false,
        butShow1: false,        // 我要预约
        butShow2: false,        // 匹配中
        butShow3: false,        // 挑选家政师
        butShow4: false,        // 继续预约
        butShow6: false,        // 重选日期
        refundStatus: -1,       // 退款状态：-1=未付款，0=进行中，1=退款中，2=已退款, 3=已完成, 4=超时未支付
        questionShow: false,    // 调查问卷是否展示
        questionList: []
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        //获取订单详情数据
        this.setData({
            service_id: options.service_id,
            order_id: options.id,
            orderType: options.order_type
        })
        this.getOrderDetail(options.id);
    },
    getOrderDetail(id) {
        const that = this;
        api.getOrderDetail({
            order_id: id,
            uid: wx.getStorageSync('uid')
        }).then(res => {
            if (res.code == 0) {
                // 1、判断订单是否支付 支付状态：0 - 未支付，1 - 已支付
                if (res.data.pay_status == 0) {
                    let listPush = [
                        { text: "待进行", index: 1 },
                        { text: "待进行", index: 2 },
                        { text: "待进行", index: 3 }
                    ]
                    this.setData({
                        reserve: false,
                        singular: listPush,
                        orderType: res.data.order_type
                    })
                } else {
                    this.setData({
                        pay_time: res.data.pay_time,
                        refundStatus: res.data.status,
                        listLength: res.data.progress.length,
                        orderType: res.data.order_type,
                        is_cook: res.data.is_cook
                    })
                    
                    let progressList = res.data.progress;
                    // 判断服务次数
                    if (progressList.length == 0) {
                        let listPush = [
                            { text: "待进行", index: 1, orderState: '' },
                            { text: "待进行", index: 2, orderState: '' },
                            { text: "待进行", index: 3, orderState: '' }
                        ]
                        if (this.data.refundStatus == 0) {
                            that.setData({ reserve: false, butShow1: true, singular: listPush })
                        } else {
                            that.setData({ reserve: false, butShow1: false, singular: listPush })
                        }
                    } else {
                        // 试用第一单
                        if (progressList.length == 1) {
                            // 循环添加数据
                            progressList.map((item, index) => {
                                // 判断服务单号状态
                                if (item.status == 0) {
                                    item.orderState = "start"
                                    item.index = index + 1
                                    item.text = '进行中'
                                } else if (item.status == 1) {
                                    item.orderState = "start"
                                    item.index = index + 1
                                    item.text = '服务中'
                                } else {
                                    item.orderState = "start finished"
                                    item.index = index + 1
                                    item.text = '已完成'
                                }
                            })
							
                            let listPush = [
                                { text: "待进行", index: 2 },
                                { text: "待进行", index: 3 }
                            ]
                            listPush.forEach((item) => {
                                progressList.push(item)
                            })
                            
                            that.getItemData(progressList[0])
                            that.setData({ singular: progressList })
                        } else if (progressList.length == 2) {      // 试用第二单
                            // 循环添加数据
                            progressList.map((item, index) => {
                                // 判断服务单号状态
                                if (index == 0) {
                                    item.orderState = "start finished end"
                                    item.index = index + 1
                                    item.text = '已完成'
                                    item.click = "complete"
                                } else {
                                    if (item.status == 0) {
                                        item.orderState = "start"
                                        item.index = index + 1
                                        item.click = "complete"
                                        item.text = '进行中'
                                    } else if (item.status == 1) {
                                        item.orderState = "start"
                                        item.index = index + 1
                                        item.click = "complete"
                                        item.text = '服务中'
                                    } else {
                                        item.orderState = "start finished"
                                        item.index = index + 1
                                        item.text = '已完成'
                                        item.click = "complete"
                                    }
                                }
                            })
							
                            let listPush = [{ text: "待进行", index: 3 }]
                            listPush.forEach((item) => {
                                progressList.push(item)
                            })

                            that.getItemData(progressList[1])
                            that.setData({ singular: progressList })
                        } else if (progressList.length == 3) {      // 试用第三单
                            // 循环添加数据
                            progressList.map((item, index) => {
                                // 判断服务单号状态
                                if (index == 2) {
                                    if (item.status == 0) {
                                        item.orderState = "start"
                                        item.index = index + 1
                                        item.text = '进行中'
                                        item.click = "complete"
                                    } else if (item.status == 1) {
                                        item.orderState = "start"
                                        item.index = index + 1
                                        item.text = '服务中'
                                        item.click = "complete"
                                    } else {
                                        item.orderState = "start finished"
                                        item.index = index + 1
                                        item.text = '已完成'
                                        item.click = "complete"
                                    }
                                } else {
                                    item.orderState = "start finished end"
                                    item.index = index + 1
                                    item.text = '已完成'
                                    item.click = "complete"
                                }
                            })
							
                            this.getItemData(progressList[2])
                            this.setData({ singular: progressList })
                        }
                    }
                }
            } else {
                if (res.msg) {
                    Notify({ type: 'danger', message: res.msg });
                } else {
                    Notify({ type: 'danger', message: '请联系工作人员' });
                }
            }
        })
    },
    // 获取订单服务信息
    getItemData(item) {
        // 提取用户预约信息
        let reserveData = item;
        this.setData({ reserveData, service_id: item.service_id });

        // 判断按钮状态
        let status = item.status;        // 服务单号状态 0-待上门, 1-服务中, 2-已完成
        let nanny_id = item.nanny_id;    // 是否选择家政师
        let nanny_select_count = item.nanny_select_count;    // 匹配后随即抽取两名家政师，至少一名家政师

        if (this.data.refundStatus == 0) {
            // 匹配中按钮状态
            if (status == 0 && nanny_id == 0 && nanny_select_count == 0 && item.restart_status == 0) {
                this.setData({ butShow1: false, butShow2: true, butShow3: false, butShow4: false, butShow6: false })
            }
            // 重选日期按钮状态
            if (status == 0 && nanny_id == 0 && nanny_select_count == 0 && item.restart_status == 1) {
                this.setData({ butShow1: false, butShow2: false, butShow3: false,  butShow4: false, butShow6: true })
            }
            // 挑选家政师按钮状态
            if (status == 0 && nanny_id == 0 && nanny_select_count > 0 && item.restart_status == 0) {
                this.setData({ butShow1: false, butShow2: false, butShow3: true, butShow4: false, butShow6: false })
            }
            // 继续预约按钮状态
            if (status == 2) {
                this.setData({ butShow1: false, butShow2: false, butShow3: false, butShow4: true, butShow6: false })

                // 服务完成后弹出调查问卷
                if (item.is_evaluate) {
                    this.getQuestions(item.service_id);
                }
            }
        } else {
            this.setData({ butShow1: false, butShow2: false, butShow3: false, butShow4: false,  butShow6: false })
        }
        

        // 获取家政师信息
        if (nanny_id != 0) {
            // 获取家政师小程序码
            this.getBindQrcode(nanny_id)

            // 提取服务日期 家政师上门时间
            let serviceArr = item.service_time.split("-")
            let service_time = serviceArr[1] + "/" + serviceArr[2] + ' ' + item.reserve_start_time;
            if (item.nanny_info.is_star) {
                item.nanny_info.src = "../../images/order/likes.png"
                item.nanny_info.click = "spotTrue"
            } else {
                item.nanny_info.src = "../../images/order/unlikes.png"
                item.nanny_info.click = "spot"
            }
            this.setData({
                housekeeperShow: true,
                nannyData: item.nanny_info,     // 获取家政师信息
                service_time
            })
        }
    },
    // 我的预约 点击查看更多内容
    moreHandle() {
        let reserveMsg = !this.data.reserveMsg;
        this.setData({
            reserveMsg: reserveMsg
        })
    },
    // 跳转页面 type: 1 - 预约服务，3 - 选择家政师
    toPage: function (e) {
        let type = e.currentTarget.dataset.type;
        if (type == 1) {
            let id = this.data.order_id;
            let order_type = this.data.orderType;
            let restart_status = this.data.reserveData.restart_status;
            let is_cook = this.data.is_cook;
            wx.redirectTo({
                url: '../service/service?id=' + id + '&order_type=' + order_type + '&restart_status='+ restart_status + '&is_cook=' + is_cook
            })
        } else if (type == 3) {
            wx.navigateTo({
                url: '../chooseNanny/chooseNanny?id=' + this.data.service_id + "&order_id=" + this.data.order_id
            })
        }
    },
    // 家政师 or 站长 拨打电话
    telHandle(e) {
        wx.makePhoneCall({
            phoneNumber: e.currentTarget.dataset.phone,
            fail: function () {}
        })
    },
    onShow: function() {
        const that = this;
        // 实时更新数据
        getApp().globalData.callback = function (res) {
            if (res.code == 0) {
                let msg = JSON.parse(res.msg);
                // 匹配家政师
                if (msg.opt == 'matching') {
                    that.getOrderDetail(that.data.order_id);
                    if (msg.data.errcode != 0) {
                        Notify({ type: 'danger', message: msg.data.tips });
                    } else {
                        Dialog.alert({
                            message: '已为您匹配到家政师',
                            theme: 'round-button',
                        }).then(() => {
                            // on close
                        });
                    }
                }
                // 服务开始 or 服务结束
                if (msg.opt == 'service_start') {
                    that.getOrderDetail(that.data.order_id);
                    Notify({ type: 'success', message: '您的订单服务开始' });
                }
                if (msg.opt == 'service_end') {
                    that.getOrderDetail(that.data.order_id);
                    Notify({ type: 'success', message: '您的订单服务结束' });
                }
                // 匹配超时
                if (msg.opt == 'overtime') {
                    Dialog.alert({
                        message: '匹配超时',
                        theme: 'round-button',
                    }).then(() => {
                        wx.switchTab({
                          url: '../order/order',
                        })
                    });
                }
            }
        }
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },
    // 获取家政师小程序码
    getBindQrcode(nanny_id) {
        api.getBindQrcode({
            nanny_id: nanny_id
        }).then(res => {
            if (res.code == 0) {
                // 接口返回的小程序码 通过 wx.getImageInfo 转化为本地路径
                wx.getImageInfo({
                    src: res.data.qrcode,
                    success: (res) => {
                        this.setData({
                            qrcode: res.path
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
    },
    complete: function (event) {
        let index = event.currentTarget.dataset.index
        let status = event.currentTarget.dataset.item.status
        let nanny_id = event.currentTarget.dataset.item.nanny_id
        let nanny_select_count = event.currentTarget.dataset.item.nanny_select_count
		let listLength = this.data.listLength
		// 提取服务日期
		let serviceArr = this.data.singular[index].service_time.split("-")
		let service_time = serviceArr[1] + "/" + serviceArr[2] + ' ' + this.data.singular[index].reserve_start_time;
		
        this.setData({ nanny_id, service_id: event.currentTarget.dataset.item.service_id, service_time })

        // 获取家政师信息
        if (event.currentTarget.dataset.item.nanny_info != undefined) {
            let nannyData = event.currentTarget.dataset.item.nanny_info;
            if (nannyData.is_star) {
                nannyData.src = "../../images/order/likes.png"
                nannyData.click = "spotTrue"
            } else {
                nannyData.src = "../../images/order/unlikes.png"
                nannyData.click = "spot"
            }
            // 获取家政师小程序码
            this.getBindQrcode(nanny_id)
            
            this.setData({
                housekeeperShow: true,
                nannyData
            })
        } else {
            if (nanny_id == 0) {
                this.setData({
                    housekeeperShow: false,
                    nannyData: ''
                })
            }
        }
        
        // 点击效果样式
        if (status > 1) {
            this.setData({
                ['singular[' + index + '].orderState']: "start finished",
                reserveData: event.currentTarget.dataset.item
            })
        } else {
            this.setData({
                ['singular[' + index + '].orderState']: "start",
                reserveData: event.currentTarget.dataset.item
            })
        }

        this.data.singular.map((item, i) => {
            if (i != index) {
                if (item.id != undefined) {
                    if (item.status > 1) {
                        this.setData({
                            ['singular[' + i + '].orderState']: "start finished end"
                        })
                    } else {
                        this.setData({
                            ['singular[' + i + '].orderState']: "start end"
                        })
                    }
                }
            }
        })
		
        // 已完成的服务
        if (index + 1 < listLength) {
            this.setData({ housekeeperShow: true, butShow1: false, butShow2: false, butShow3: false, butShow4: false, butShow6: false })
        }
        // 当前服务
        if (index + 1 == listLength) {
            // 进行中的订单
            if (this.data.refundStatus == 0) {
                // 匹配中按钮状态
                if (status == 0 && nanny_id == 0 && nanny_select_count == 0 && this.data.reserveData.restart_status == 0) {
                    this.setData({ butShow1: false, butShow2: true, butShow3: false, butShow4: false, butShow6: false})
                }
                // 重选日期按钮状态
                if (status == 0 && nanny_id == 0 && nanny_select_count == 0 && this.data.reserveData.restart_status == 1) {
                    this.setData({ butShow1: false, butShow2: false, butShow3: false,  butShow4: false, butShow6: true })
                }
                // 挑选家政师按钮状态
                if (status == 0 && nanny_id == 0 && nanny_select_count > 0 && this.data.reserveData.restart_status == 0) {
                    this.setData({ butShow1: false, butShow2: false, butShow3: true, butShow4: false, butShow6: false })
                }
                // 继续预约按钮状态
                if (status == 2) {
                    this.setData({ butShow1: false, butShow2: false, butShow3: false, butShow4: true, butShow6: false })
                }
            } else {
                this.setData({ butShow1: false, butShow2: false, butShow3: false, butShow4: false, butShow6: false })
            }
            
            // 如果有家政师资料，则发送网络请求获取家政师资料展示在页面中
            if (nanny_id > 0) {
                this.setData({ housekeeperShow: true, butShow1: false, butShow2: false, butShow3: false, butShow4: false, butShow6: false })
            }
        }
    },
    // 给家政师点赞
    spot: function () {
        const that = this;
        api.nannyStar({
            uid: wx.getStorageSync("uid"),
            nanny_id: this.data.nannyData.nanny_id,
            service_id: this.data.reserveData.service_id
        }).then(res => {
            if (res.code == 0) {
                this.setData({
                    ["nannyData.is_star"]: true,
                    ["nannyData.src"]: '../../images/order/likes.png'
                })
            } else {
                if (res.msg) {
                    Notify({ type: 'danger', message: res.msg });
                } else {
                    Notify({ type: 'danger', message: '请联系工作人员' });
                }
            }
        }).catch((e) => {})
    },
    // 已点赞过该家政师
    spotTrue: function () {
        Notify({ type: 'danger', message: '你已点赞过该家政师' });
    },
    //退款
    refund: function () {
        const that = this;
        // 订阅通知权限
        let message = JSON.parse(wx.getStorageSync('message'));
        let refund = message.refund.split(',');
        wx.requestSubscribeMessage({
            tmplIds: refund,
            complete() {
                Dialog.confirm({
                    title: '温馨提示',
                    message: '退款需3~10日人工审核，确认退款？',
                    confirmButtonText: '取消',
                    cancelButtonText: '确认'
                }).then(() => {
                      // 实际是取消事件
                }).catch(() => {
                    // 实际是确认事件
                    api.applyrefund({
                        uid: wx.getStorageSync("uid"),
                        order_id: that.data.order_id
                    }).then(res => {
                        if (res.code == 0) {
                            that.setData({ refundStatus: 1, butShow1: false, butShow2: false, butShow3: false, butShow4: false, butShow6: false })
                            Notify({ type: 'success', message: '已为您申请退款，请等待' });
                        } else {
                            if (res.msg) {
                                Notify({ type: 'danger', message: res.msg });
                            } else {
                                Notify({ type: 'danger', message: '请联系工作人员' });
                            }
                        }
                    }).catch((e) => {})
                });
            } 
        })
    },
    // 获取调查问卷问题
    getQuestions(service_id) {
        api.getQuestion({
            service_id: service_id
        }).then(res => {
            if (res.code == 0) {
                let questionList = res.data;
                let arr = [];
                for (let i in questionList) {
                    questionList[i].checked = '';
                }
                this.setData({
                    questionList: questionList,
                    questionShow: true
                })
            }
        })
    },
    // 调查问卷点击事件
    questionSelect(e) {
        const that = this;
        let index = e.currentTarget.dataset.index;
        let select = e.currentTarget.dataset.select;
        let questionList = that.data.questionList;
        questionList[index].checked = select == 'true' ? 'true' : 'false';
        that.setData({questionList})
    },
    // 提交调查问卷
    submitQuestion() {
        const that = this;
        for (let i in this.data.questionList) {
            if (this.data.questionList[i].checked == '') {
                Notify({ type: 'danger', message: '请完善问卷内容' });
                return
            }
        }
        api.postQuestion({
            service_id: that.data.service_id,
            uid: wx.getStorageSync('uid'),
            u_problem: JSON.stringify(that.data.questionList)
        }).then(res => {
            if (res.code != 0) {
                if (res.msg) {
                    Notify({ type: 'danger', message: res.msg });
                } else {
                    Notify({ type: 'danger', message: '请联系工作人员' });
                }
            }
            this.setData({
                questionShow: false
            })
        })
    },
    // 关闭调查问卷弹窗
    onClose() {
        this.setData({
            questionShow: false
        })
    },
    // 推荐家政师 生成海报
    createPoster() {
        const that = this;
        that.setData({
            maskHidden: false
        })
        wx.showToast({
          title: '请等待...',
          icon: 'loading'
        })
		setTimeout(() => {
			wx.hideToast();
			that.createNewImg()
			that.setData({
				maskHidden: true
			})
		}, 1000)
    },
    // 将 canvas 转换为图片保存到本地，然后将图片路径传给image图片的src
    createNewImg() {
        const that = this;
        const ctx = wx.createCanvasContext('canvas');
        ctx.setFillStyle("#FFD277")
        ctx.fillRect(0, 0, 375, 667)
        // 背景图
        let bgPicturePath = '../../images/order/poster.png';
        ctx.drawImage(bgPicturePath, 0, 0, 375, 667);
        // 绘制二维码
        ctx.save();
        ctx.setFillStyle("#fff");
        ctx.setStrokeStyle('#fff');
        ctx.setLineJoin('round');  //交点设置成圆角
        ctx.setLineWidth(8);
        ctx.strokeRect(144, 520, 82, 82);
        // ctx.fillRect(148, 524, 74, 74);
        ctx.drawImage(that.data.qrcode, 148, 524, 74, 74);
        ctx.stroke();
        ctx.closePath();
        // 绘制文字 - 长按识别二维码
        ctx.setFontSize(14);
        ctx.setFillStyle('#fff');
        ctx.setTextAlign('center');
        ctx.fillText("长按识别二维码", 185, 630);
        ctx.stroke();
        // 绘制文字 - 开启美好家政之旅
        ctx.setFontSize(14);
        ctx.setFillStyle('#fff');
        ctx.setTextAlign('center');
        ctx.fillText("开启美好家政之旅", 185, 650);
        ctx.stroke();
        ctx.draw();
        // 将生成好的图片保存到本地，需要延迟一会，绘制期间耗时
        setTimeout(() => {
            wx.canvasToTempFilePath({
                canvasId: 'canvas',
                success: (res) => {
                    let tempFilePath = res.tempFilePath;
                    that.setData({
                        imagePath: tempFilePath
                    })
                }
            })
        }, 200)
    },
    // 保存海报到相册
    savePoster() {
        const that = this;
        wx.saveImageToPhotosAlbum({
            filePath: that.data.imagePath,
            success: (res) => {
                Notify({ type: 'success', message: '已保存海报到相册' });
				that.setData({
				    maskHidden: false
				})
            },
            fail: (err) => {
                if (err.errMsg) {
                    wx.showModal({
                        title: '提示',
                        content: '您好!请先授权，再保存此海报',
                        showCancel: false,
                        success(res) {
                            if (res.confirm) {
                                wx.openSetting({
                                    success(settingdata) {
                                        // 用户打开了保存图片授权开关
                                        if (settingdata.authSetting['scope.writePhotosAlbum']) {
                                            wx.saveImageToPhotosAlbum({
                                                filePath: that.data.imagePath,
                                                success() {
                                                    Notify({ type: 'success', message: '已保存海报到相册' });
                                                    that.setData({ maskHidden: false })
                                                },
                                                fail() {
                                                    Notify({ type: 'danger', message: '保存失败' });
                                                }
                                            })
                                        } else {
                                            Notify({ type: 'danger', message: '授权失败，请稍后重新获取' });
                                        }
                                    }
                                })
                            }
                        }
                    })
                }
            }
        })
    },
    // 关闭海报
    closePoster() {
        this.setData({ maskHidden: false })
    },
	onShareAppMessage() {
		return {
            title: '家舒安',
            path: '/pages/index/index'
        }
	},
    // 只支持 android 分享朋友圈
    onShareTimeline() {
        return {
            title: '家舒安',
            query: '/pages/index/index'
        }
    }
})