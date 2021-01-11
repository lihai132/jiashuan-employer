import Notify from '@vant/weapp/notify/notify';
import Dialog from '@vant/weapp/dialog/dialog';
const api = require('../../utils/request');
const util = require('../../utils/util');

Page({
    data: {
        isLoading: true,
        order_id: '',                   // 订单id
        pay_time: '',                   // 支付时间
        serviceList: [],                // 服务信息列表
        serviceInfo: '',                // 服务信息详情
        remarkShow: false,              // 是否显示备注
        current_progress: '',           // 订单进度
        isEvaluate: true,               // 是否填写服务问卷
        service_id: '',                 // 当前服务id
        refundStatus: 0,
        refundShow: false,
        refundStatusText: '退款',       // 退款状态：0=进行中，1=退款中，2=已退款, 3=已完成, 4=超时未支付
        refundBtn: false,               // 是否展示退款按钮
        refundList: ['临时不想要服务', '想重新填写信息', '服务不行', '其它'],
        refundIndex: -1,
        refundCause: '',
        refundNum: 0,
        questionShow: false,            // 调查问卷是否展示
        questionList: [],
        maskHidden: false,
        nannyChangeShow: false,         // 更换家政师
        changeNannyForm: [
            {label: '沟通交流', list: [{name: '较差', checked: false}, {name: '一般', checked: false}, {name: '不够好', checked: false}]},
            {label: '整理收纳', list: [{name: '较差', checked: false}, {name: '一般', checked: false}, {name: '不够好', checked: false}]},
            {label: '清洁卫生', list: [{name: '较差', checked: false}, {name: '一般', checked: false}, {name: '不够好', checked: false}]}
        ],
        cause: '',
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.getSystemInfo({
            success: (result) => {
                this.setData({ wHeight: result.windowHeight })
            }
        })
        // 支付成功直接跳转到订单详情页，点击左上角返回到订单列表
        if (options.type == 'success') {
            this.setData({toBack: '../order/order'})
        }
        //获取订单详情数据
        this.setData({ order_id: options.order_id })
    },
    onShow: function() {
        const that = this;
        that.getOrderDetail(that.data.order_id);
        // 实时更新数据
        // getApp().globalData.callback = function (res) {
        //     if (res.code == 0) {
        //         let msg = JSON.parse(res.msg);
        //         // 匹配家政师
        //         if (msg.opt == 'matching') {
        //             that.getOrderDetail(that.data.order_id);
        //             if (msg.data.errcode != 0) {
        //                 Notify({ type: 'danger', message: msg.data.tips });
        //             } else {
        //                 Dialog.alert({
        //                     message: '已为您匹配到家政师',
        //                     theme: 'round-button',
        //                 }).then(() => {
        //                     // on close
        //                 });
        //             }
        //         }
        //         // 服务开始 or 服务结束
        //         if (msg.opt == 'service_start') {
        //             that.getOrderDetail(that.data.order_id);
        //             Notify({ type: 'success', message: '您的订单服务开始' });
        //         }
        //         if (msg.opt == 'service_end') {
        //             that.getOrderDetail(that.data.order_id);
        //             Notify({ type: 'success', message: '您的订单服务结束' });
        //         }
        //         // 匹配超时
        //         if (msg.opt == 'overtime') {
        //             Dialog.alert({
        //                 message: '匹配超时',
        //                 theme: 'round-button',
        //             }).then(() => {
        //                 wx.switchTab({
        //                   url: '../order/order',
        //                 })
        //             });
        //         }
        //     }
        // }
    },
    onUnload() {
        const that = this;
        if (that.data.toBack) {
            wx.switchTab({
                url: that.data.toBack
            })
        }
    },
    getOrderDetail(id) {
        api.getOrderDetail({
            order_id: id,
            uid: wx.getStorageSync('uid')
        }).then(res => {
            if (res.code == 0) {
                let refundStatusText = ''
                let index = '';
                let serviceInfo = '';
                let service_id = ''

                switch(res.data.status) {
                    case 0: 
                        refundStatusText = '退款'
                        break;
                    case 1:
                        refundStatusText = '退款中'
                        break;
                    case 2:
                        refundStatusText = '已退款'
                        break;
                }
                // 判断退款按钮是否显示
                if (res.data.status == 3 || res.data.status == 4 || res.data.pay_status == 0) {
                    this.setData({ refundBtn: false })
                } else {
                    this.setData({ refundBtn: true })
                }
                
                let serviceList = res.data.list;
                if (res.data.order_type == 1) {
                    serviceInfo = serviceList
                    // 地址拆分
                    let address = serviceList.address.split(',');
                    serviceInfo.addressName = address[1];
                    serviceInfo.addressText = address[0];
                    serviceInfo.date = serviceInfo.service_date.replace('.', '-').replace('.', '-');
                    if (serviceInfo.nanny_info) {
                        serviceInfo.nanny_info.date = serviceInfo.service_date.replace('.', '-').replace('.', '-');
                        serviceInfo.nanny_info.time = serviceInfo.part_time.substr(0, 5);
                    }

                    let waitNum = res.data.count -  res.data.end_count;
                    this.setData({ count: res.data.count, end_count: res.data.end_count, waitNum })
                } else {
                    for (let i in serviceList) {
                        // 插入家政师信息
                        if (serviceList[i].nanny_info) {
                            serviceList[i].nanny_info.date = serviceList[i].service_date.replace('.', '-').replace('.', '-');
                            serviceList[i].nanny_info.time = serviceList[i].part_time.substr(0, 5);
                        }
                        serviceList[i].date = serviceList[i].service_date.replace('.', '-').replace('.', '-');
                        // 地址拆分
                        let address = serviceList[i].address.split(',');
                        serviceList[i].addressName = address[1];
                        serviceList[i].addressText = address[0];
                        // 订单状态
                        if (serviceList[i].status == 0) {
                            serviceList[i].status_text = '待上门'
                        } else if (serviceList[i].status == 1) {
                            serviceList[i].status_text = '服务中'
                        } else if (serviceList[i].status == 2) {
                            serviceList[i].status_text = '已完成'
                        }
                    }

                    // 服务调查
                    if (serviceList[0] && this.data.isEvaluate) {
                        if (serviceList[0].status == 2 && serviceList[0].is_evaluate == true) {
                            this.getQuestions(serviceList[0].service_id)
                            serviceInfo = serviceList[0];
                            service_id = serviceList[0].service_id;
                            serviceList[0].status_class = 'start';
                            index = 0;
                            this.setData({ isEvaluate: false })
                        }
                    } else if (serviceList[1] && this.data.isEvaluate) {
                        if (serviceList[1].status == 2 && serviceList[1].is_evaluate == true) {
                            this.getQuestions(serviceList[1].service_id)
                            serviceInfo = serviceList[1];
                            service_id = serviceList[1].service_id;
                            serviceList[1].status_class = 'start';
                            index = 1;
                            this.setData({ isEvaluate: false })
                        }
                    } else if (serviceList[2] && this.data.isEvaluate) {
                        if (serviceList[2].status == 2 && serviceList[2].is_evaluate == true) {
                            this.getQuestions(serviceList[2].service_id)
                            serviceInfo = serviceList[2];
                            service_id = serviceList[2].service_id;
                            serviceList[2].status_class = 'start';
                            index = 2;
                            this.setData({ isEvaluate: false })
                        }
                    }
                    if (this.data.isEvaluate) {
                        index = res.data.current_progress - 1;
                        serviceInfo = serviceList[index];
                        serviceList[index].status_class = 'start';
                        service_id = serviceList[index].service_id;
                    }
                    this.setData({ current_progress: index })
                }
                
                this.setData({ 
                    pay_time: res.data.pay_time,
                    serviceList,
                    serviceInfo,
                    refundStatus: res.data.status,
                    refundStatusText,
                    service_id,
                    order_type: res.data.order_type,
                    isLoading: false,
                    part_time_id: res.data.part_time_id,
                    goods_id: res.data.goods_id,
                    pay_status: res.data.pay_status
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
    // 订单进度点击事件
    statusHandle(e) {
        let index = e.currentTarget.dataset.index;
        this.setData({
            serviceInfo: this.data.serviceList[index],
            service_id: this.data.serviceList[index].service_id,
            current_progress: index
        })
    },
    // 我的预约 点击查看更多内容
    moreHandle() {
        let remarkShow = !this.data.remarkShow;
        this.setData({ remarkShow })
    },
    // 退款打开popup事件
    refundOpen() {
        // 订阅通知权限
        const that = this;
        let message = JSON.parse(wx.getStorageSync('message'));
        let refunds = message.refund.split(',');
        wx.requestSubscribeMessage({
            tmplIds: refunds,
            complete() {
                that.setData({ refundShow: true })
            } 
        })
    },
    // 退款关闭事件
    refundClose() {
        this.setData({ refundShow: false, refundIndex: -1 })
    },
    // 退款计算字数
    refundCauseInput(e) {
        let refundNum = (util.trim(e.detail, 2)).length
        this.setData({ refundNum })
    },
    // 退款原因选择
    refundSelect(e) {
        let refundIndex = e.currentTarget.dataset.index;
        this.setData({ refundIndex })
    },
    // 退款提交
    refundSubmit() {
        if (this.data.refundIndex == -1) {
            Notify({ type: 'danger', message: '请选择退款原因' });
            return
        }
        if (this.data.refundIndex == 3) {
            Notify({ type: 'danger', message: '请说明退款原因' });
            return
        }

        api.applyrefund({
            uid: wx.getStorageSync('uid'),
            order_id: this.data.order_id,
            cause: this.data.refundList[this.data.refundIndex] + ','+this.data.refundCause
        }).then(res => {
            if (res.code == 0) {
                this.setData({ refundStatusText: '退款中' })
                Notify({ type: 'success', message: '已为您申请退款，请等待' });
                this.refundClose();
            } else {
                if (res.msg) {
                    Notify({ type: 'danger', message: res.msg });
                } else {
                    Notify({ type: 'danger', message: '请联系工作人员' });
                }
            }
        })
    },
    // 更换家政师 - 问卷点击事件
    changePopup(e) {
        let changeNannyForm = this.data.changeNannyForm;
        let index = e.currentTarget.dataset.index;
        let idx = e.currentTarget.dataset.idx;
        for (let i in changeNannyForm) {
            if (index == i) {
                for (let k in changeNannyForm[i].list) {
                    if (idx == k) {
                        changeNannyForm[i].list[k].checked = true;
                    } else {
                        changeNannyForm[i].list[k].checked = false;
                    }
                }
            }
        }
        this.setData({ changeNannyForm })
    },
    // 更换家政师 - 文本内容
    causeInput(e) {
        this.setData({ cause: e.detail })
    },
    // 更换家政师 - 打开事件
    nannyOpen() {
        const that = this;
        if (this.data.serviceInfo.change_nanny_status == -1) {
            // 订阅通知权限
			let message = JSON.parse(wx.getStorageSync('message'));
			let change_nanny = message.change_nanny.split(',');
			wx.requestSubscribeMessage({
				tmplIds: change_nanny,
				complete() {
					that.setData({ nannyChangeShow: true })
				} 
			})
        } else {
            Notify({ type: 'danger', message: '此订单已达更换上限，如需继续更换请联系站长' });
        }
    },
    // 更换家政师 - 关闭事件
    nannyClose() {
        this.setData({ nannyChangeShow: false })
    },
    // 更换家政师 - 确认更换家政师
    changeNannySubmit() {
        let cause_select = [];
        let service_id = this.data.serviceInfo.service_id;
        let changeNannyForm = this.data.changeNannyForm;
        for (let i in changeNannyForm) {
            for (let k in changeNannyForm[i].list) {
                if (changeNannyForm[i].list[k].checked == true) {
                    cause_select.push(changeNannyForm[i].label + changeNannyForm[i].list[k].name)
                }
            }
        }
        if (cause_select.length != 3) {
            Notify({ type: 'danger', message: '请选择对应的评价' });
        } else if (this.data.cause == '') {
            Notify({ type: 'danger', message: '请填写更换原因' });
        } else {
            let params = {
                nanny_id: '',
                uid: wx.getStorageSync('uid'),
                service_id: service_id,
                change_type: 2,
                cause_select: cause_select.join(','),
                cause: this.data.cause
            }
            this.nannyClose()
            wx.navigateTo({
                url: '../nannySelect/nannySelect?params=' + JSON.stringify(params)
            })
        }
    },
    // 获取调查问卷问题
    getQuestions(service_id) {
        api.getQuestion({
            service_id: service_id
        }).then(res => {
            if (res.code == 0) {
                let questionList = res.data;
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
        let index = e.currentTarget.dataset.index;
        let select = e.currentTarget.dataset.select;
        let questionList = this.data.questionList;

        questionList[index].checked = select == 'true' ? 'true' : 'false';
        this.setData({questionList})
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
        this.setData({ questionShow: false })
    },
    // type abnormal-异常订单, picker-调整时间，跳转日历，2-跳转家政师详情
    toPage(e) {
        const that = this;
        let type = e.currentTarget.dataset.type;
        if (type == 'abnormal') {
            wx.navigateTo({
                url: '../abnormal/abnormal?order_id=' + this.data.order_id
            })
        } else if (type == 'picker') {
            // 订阅通知权限
			let message = JSON.parse(wx.getStorageSync('message'));
			let change_time = message.change_time.split(',');
			wx.requestSubscribeMessage({
				tmplIds: change_time,
				complete() {
					let service_date = that.data.serviceInfo.date + ' ' + that.data.serviceInfo.part_time;
                    let part_time_id = that.data.part_time_id;
                    let goods_id = that.data.goods_id;
                    let nanny_id = that.data.serviceInfo.nanny_info.nanny_id;
                    let service_id = that.data.serviceInfo.service_id;
                    that.getCalendar(part_time_id, goods_id, nanny_id, service_date, service_id);
				} 
			})
        } else {
            let nanny_id = e.currentTarget.dataset.nanny_id;
            wx.navigateTo({
                url: '../nannyDetail/nannyDetail?nanny_id=' + nanny_id
            })
        }
    },
    // 获取排班
    getCalendar(part_time_id, goods_id, nanny_id, service_date, service_id) {
        api.getCalendar({
            part_time_id: part_time_id,
            goods_id: goods_id,
            nanny_id: nanny_id
        }).then(res => {
            if (res.code == 0) {
                let serviceDate = res.data;
                for (let i in serviceDate) {
                    let part_time = serviceDate[i].part_time;
                    for (let k in part_time) {
                        part_time[k].checked = false;
                    }
                }
                wx.setStorageSync('serviceDate', serviceDate)
                wx.navigateTo({
                    url: '../calendar/calendar?type=edit&service_number=1&service_date=' + service_date + '&goods_type=0&service_id='+service_id
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
    // 家政师 or 站长 拨打电话
    telHandle(e) {
        wx.makePhoneCall({
            phoneNumber: e.currentTarget.dataset.phone,
            fail: function () {}
        })
    },
    // 给家政师点赞
    starNanny(e) {
        let nanny_id = e.currentTarget.dataset.nanny_id;
        let service_id = e.currentTarget.dataset.service_id;
        api.nannyStar({
            uid: wx.getStorageSync("uid"),
            nanny_id: nanny_id,
            service_id: service_id
        }).then(res => {
            if (res.code == 0) {
                let serviceList = this.data.serviceList;
                if (this.data.order_type == 0) {
                    for (let i in serviceList) {
                        if (serviceList[i].nanny_info.nanny_id == nanny_id) {
                            serviceList[i].nanny_info.is_star = true;
                        }
                    }
                } else {
                    serviceList.nanny_info.is_star = true;
                }
                this.setData({ ['serviceInfo.nanny_info.is_star']: true, serviceList })
            } else {
                if (res.msg) {
                    Notify({ type: 'danger', message: res.msg });
                } else {
                    Notify({ type: 'danger', message: '请联系工作人员' });
                }
            }
        })
    },
    // 推荐家政师 生成海报
    createPoster(e) {
        const that = this;
        that.setData({ maskHidden: false })
        wx.showToast({
            title: '请等待...',
            icon: 'loading'
        })
        // 获取家政师小程序码
        api.getBindQrcode({
            nanny_id: e.currentTarget.dataset.nanny_id
        }).then(res => {
            if (res.code == 0) {
                let imgList = wx.getStorageSync('img')
                for (let i in imgList) {
                    if (imgList[i].tag == 'recommend_qrcode') {
                        wx.getImageInfo({
                            src: imgList[i].images,
                            success: (res) => {
                                this.setData({ reqrcodeImg: res.path })
                            }
                        })
                    }
                }
                // 接口返回的小程序码 通过 wx.getImageInfo 转化为本地路径
                wx.getImageInfo({
                    src: res.data.qrcode,
                    success: (res) => {
                        this.setData({ qrcode: res.path })
                    }
                })
                setTimeout(() => {
                    wx.hideToast();
                    that.createNewImg()
                    that.setData({ maskHidden: true })
                }, 1000)
            } else {
                if (res.msg) {
                    Notify({ type: 'danger', message: res.msg });
                } else {
                    Notify({ type: 'danger', message: '请联系工作人员' });
                }
                wx.hideToast();
            }
        })
    },
    // 将 canvas 转换为图片保存到本地，然后将图片路径传给image图片的src
    createNewImg() {
        const that = this;
        const ctx = wx.createCanvasContext('canvas');
        ctx.setFillStyle("#FFD277")
        ctx.fillRect(0, 0, 375, 667)
        // 背景图
        let bgPicturePath = that.data.reqrcodeImg;
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
				that.setData({ maskHidden: false })
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
            title: '家舒安家政·酒店级品质',
            path: '/pages/index/index'
        }
	},
    // 只支持 android 分享朋友圈
    onShareTimeline() {
        return {
            title: '家舒安家政·酒店级品质',
            query: '/pages/index/index'
        }
    }
})