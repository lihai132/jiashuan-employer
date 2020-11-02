import Notify from '@vant/weapp/notify/notify';
const util = require('../../utils/util');
const api = require('../../utils/request');
const chooseLocation = requirePlugin('chooseLocation');

Page({
    data: {
        orderStatus: 0,     // 0 - 预约试用，1 - 预约长期
        cycle_time: '',     // 服务周期时间
        dateShow: false,    // 时间控件的显示或隐藏
        formData: {
            order_id: '',
            name: '',           // 姓名
            phone: '',          // 电话号码
            address: '',        // 服务地址
            house_number: '',   // 门牌号
            house: '',          // 户型
            family_size: '',    // 面积
            // flavor: [],         // 口味
            family_number: '',  // 人数
            longitude: '',      // 经度
            latitude: '',       // 纬度
            city: '',           // 城市
            // service_time: '',   // 服务日期
            // remark: '',         // 备注
        },
        houseList: [],
        roomSelected: -1,
        areaList: [],
        areaSelected: -1,
        menuList: [],
        isFlavor: false,            // 是否显示菜系/口味
        familyList: [],
        familySelected: -1,
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const that = this;
        let isFlavor = options.is_cook == 'true' ? true : false;
        that.setData({
            ["formData.order_id"]: options.id,
            orderStatus: Number(options.order_type),
            isEdit: options.restart_status,
            isFlavor
        });
        if (options.order_type == 0) {
            this.setData({
                ["formData.service_time"]: ''
            })
        }
        // 获取选项信息
        api.getServiceOption({}).then(res => {
            if (res.code == 0) {
                if (isFlavor) {
                    for (let i in res.data.flavor) {
                        res.data.flavor[i].isSelected = false;
                    }
                    that.setData({
                        menuList: that.sortHandle(res.data.flavor),
                        ['formData.flavor']: []
                    })
                }
                
                that.setData({
                    houseList: that.sortHandle(res.data.house),
                    areaList: that.sortHandle(res.data.size),
                    familyList: that.sortHandle(res.data.number)
                })
            } else {
                if (res.msg) {
                    Notify({ type: 'danger', message: res.msg });
                } else {
                    Notify({ type: 'danger', message: '请联系工作人员' });
                }
            }
        })
        // 获取最后一次提交预约信息
        api.getlastdetails({
            uid: wx.getStorageSync("uid"),
            order_id: options.id
        }).then(res => {
            if (res.data != undefined) {
                // 房屋户型
                this.data.houseList.map((item, index) => {
                    if (res.data.house == item.title) {
                        that.setData({
                            ["formData.house"]: res.data.house,
                            ["roomSelected"]: index,
                        })
                    }
                })
                // 家庭面积
                this.data.areaList.map((item, index) => {
                    if (res.data.family_size == item.title) {
                        that.setData({
                            ["formData.family_size"]: res.data.family_size,
                            ["areaSelected"]: index,
                        })
                    }
                })
                // 菜系
                if (res.data.flavor != null) {
                    let menuArr = []
                    if (res.data.flavor.indexOf(",") != -1) {
                        menuArr = res.data.flavor.split(",")
                    } else {
                        menuArr.push(res.data.flavor)
                    }
                    let arr = []
                    this.data.menuList.map((item, index) => {
                        menuArr.map((e, i) => {
                            if (e == item.title) {
                                item.isSelected = true;
                                this.setData({
                                    menuList: this.data.menuList
                                })
                                arr.push(e)
                            }
                        })
                    })
                    this.setData({
                        ['formData.flavor']: arr
                    })
                }
                // 家人数量
                this.data.familyList.map((item, index) => {
                    if (res.data.family_number == item.title) {
                        that.setData({
                            ["formData.family_number"]: res.data.family_number,
                            ["familySelected"]: index,
                        })
                    }
                })
                // 获取 city 字段
                if (res.data.address.indexOf('广州市') != -1) {
                    this.setData({ ["formData.city"]: '广州市', })
                }
                this.setData({
                    ["formData.name"]: res.data.name,
                    ["formData.phone"]: res.data.phone,
                    ["formData.address"]: res.data.address,
                    ["formData.house_number"]: res.data.house_number,
                    ["formData.remark"]: res.data.remark == 'null' ? '' : res.data.remark,
                    ["formData.longitude"]: res.data.longitude,
                    ["formData.latitude"]: res.data.latitude,
                })
                if (this.data.orderStatus == 0) {
                    this.setData({
                        ["formData.service_time"]: '',
                        ["formData.service_id"]: res.data.service_id
                    })
                }
            }
        }).catch((e) => {})
    },
    // 打开选择日期
    onDisplay() {
        this.setData({ dateShow: true });
    },
    // 关闭选择日期
    onClose() {
        this.setData({ dateShow: false });
    },
    // 选择服务时间并且格式化
    onConfirm(event) {
        let day = new Date(event.detail).getDay();
        let weeks = new Array("星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六");
        var week = weeks[day];
        if (week == '星期日') {
            Notify({ type: 'danger', message: '周日不能预约，请更改日期后重试' });
        } else {
            this.setData({
                ["formData.service_time"]: util.format(new Date(event.detail), 'yyyy-MM-dd'),
                dateShow: false,
            });
        }
    },
    // input 输入框 phone - 电话号码，
    bindPhoneInput(e) {
        this.setData({ ["formData.phone"]: e.detail.value });
    },
    // input 输入框 number - 门牌号，
    bindNumberInput(e) {
        this.setData({ ["formData.number"]: e.detail.value });
    },
    blurInput(e) {
        switch (e.currentTarget.dataset.type.toString()) {
            case 'name':
                let name = e.detail.value.slice(0, 10);
                if (util.trim(name, 2) == '') {
                    Notify({ type: 'danger', message: '请填写联系人' });
                } else {
                    name = name + (name.length > 9 ? '...' : '');
                    this.setData({
                        ["formData.name"]: name
                    });
                }
                break;
            case 'phone':
                let phoneNum = e.detail.value.replace(/\s+/g, '');
                let regPhone = /^1\d{10}$/;
                if (phoneNum == '') {
                    Notify({ type: 'danger', message: '请填写电话号码' });
                    this.setData({ ["formData.phone"]: '' });
                } else if (!regPhone.test(phoneNum)) {
                    Notify({ type: 'danger', message: '电话号码格式不正确' });
                } else {
                    this.setData({
                        ["formData.phone"]: phoneNum
                    });
                }
                break;
            case 'number':
                let number = e.detail.value.slice(0, 10);
                if (util.trim(number, 2) == '') {
                    Notify({ type: 'danger', message: '请填写门牌号' });
                } else {
                    number = number + (number.length > 9 ? '...' : '');
                    this.setData({
                        ["formData.house_number"]: number
                    });
                }
                break;
            case 'remark':
                let content = e.detail.value;
                this.setData({
                    ["formData.remark"]: util.trim(content, 2)
                });
        }
    },
    // 选择房屋户型
    changRoom(e) {
        const that = this;
        let index = e.currentTarget.dataset.index;
        that.setData({
            roomSelected: index
        });
        that.setData({
            ["formData.house"]: that.data.houseList[index].title
        });
    },
    // 选择家庭面积
    changArea(e) {
        const that = this;
        let index = e.currentTarget.dataset.index;
        that.setData({
            areaSelected: index
        });
        that.setData({
            ["formData.family_size"]: that.data.areaList[index].title
        });
    },
    // 选择菜系与口味(多选)
    changCuisine(e) {
        const that = this;
        let index = e.currentTarget.dataset.index;
        let item = this.data.menuList[index];
        item.isSelected = !item.isSelected;
        that.setData({
            menuList: that.data.menuList
        })

        let arr = [];
        for (let i in that.data.menuList) {
            let items = that.data.menuList[i];
            if (items.isSelected == true) {
                arr.push(items.title)
            }
        }
        that.setData({
            ["formData.flavor"]: arr
        });
    },
    // 选择家人数量
    changFamily(e) {
        const that = this;
        let index = e.currentTarget.dataset.index;
        that.setData({
            familySelected: index
        });
        that.setData({
            ["formData.family_number"]: that.data.familyList[index].title
        });
    },
    // 跳转页面
    bindClickAdress() {
        const key = 'ZDBBZ-LY2CS-SP5OY-6DE5D-SCEOS-BCB4C'; // 使用在腾讯位置服务申请的key
        const referer = '家舒安'; // 调用插件的app的名称
        wx.navigateTo({
            url: 'plugin://chooseLocation/index?key=' + key + '&referer=' + referer
        });
    },
    // 提交预约接口
    postService() {
        const that = this;
        that.setData({
            ["formData.uid"]: wx.getStorageSync('uid')
        });
        // isEdit==1 编辑提交，否则是添加预约
        if (this.data.isEdit == 1) {
            api.serviceEdit(that.data.formData).then(res => {
                if (res.code == 0) {
                    wx.redirectTo({
                        url: '../orderDetail/index?id=' + that.data.formData.order_id + '&order_type=' + that.data.orderStatus
                    })
                } else {
                    if (res.msg) {
                        Notify({ type: 'danger', message: res.msg });
                    } else {
                        Notify({ type: 'danger', message: '请联系工作人员' });
                    }
                }
            })
        } else {
            api.serviceSubmit(that.data.formData).then(res => {
                if (res.code == 0) {
                    wx.redirectTo({
                        url: '../orderDetail/index?id=' + that.data.formData.order_id + '&order_type=' + that.data.orderStatus
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
    // 提交
    submit() {
        const that = this;
        // 0 - 预约试用订单提交，1 - 长期预约订单提交
        if (this.formVerify()) {
            // 订阅通知权限
			let message = JSON.parse(wx.getStorageSync('message'));
			let service = message.service.split(',');
			wx.requestSubscribeMessage({
				tmplIds: service,
				complete() {
					if (that.data.orderStatus == 0) {
                        that.postService();
                    } else {
                        wx.showModal({
                            content: '提交后无法更改需求，确认提交？',
                            cancelColor: '#999999',
                            confirmText: '确认',
                            confirmColor: '#FF8666',
                            success(res) {
                                if (res.confirm) {
                                    wx.navigateBack({
                                        delta: 1
                                    })
                                }
                            }
                        })
                    }
				} 
			})
        }
    },
    formVerify() {
        let data = this.data.formData;
        let regPhone = /^1\d{10}$/;
        if (data.service_time == '') {
            Notify({ type: 'danger', message: '请选择服务日期' });
            return false;
        } else if (data.name == '') {
            Notify({ type: 'danger', message: '请填写联系人' });
            return false;
        } else if (data.phone == '') {
            Notify({ type: 'danger', message: '请填写电话号码' });
            return false;
        } else if (!regPhone.test(data.phone)) {
            Notify({ type: 'danger', message: '电话号码格式不正确' });
        } else if (data.address == '') {
            Notify({ type: 'danger', message: '请选择服务地址' });
            return false;
        } else if (data.house_number == '') {
            Notify({ type: 'danger', message: '请填写门牌号' });
            return false;
        } else if (data.house == '') {
            Notify({ type: 'danger', message: '请选择房屋户型' });
            return false;
        } else if (data.family_size == '') {
            Notify({ type: 'danger', message: '请选择家庭面积' });
            return false;
        } else if (data.family_number == '') {
            Notify({ type: 'danger', message: '请选择家人数量' });
            return false;
        } else {
            if (this.data.isFlavor) {
                if (data.flavor.length == 0) {
                    Notify({ type: 'danger', message: '请选择菜系' });
                    return false;
                }
            }
            return true
        }
    },
    // 按 id 排序
    sortHandle(arr) {
        arr.sort(function (a, b) {
            return a.id - b.id
        })
        return arr
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
        const location = chooseLocation.getLocation(); // 如果点击确认选点按钮，则返回选点结果对象，否则返回null
        if (location != null) {
            this.setData({
                ["formData.address"]: location.address,
                ["formData.longitude"]: location.longitude,
                ["formData.latitude"]: location.latitude,
                ["formData.city"]: location.city
            });
        }
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
        // 页面卸载时设置插件选点数据为null，防止再次进入页面，geLocation返回的是上次选点结果
        chooseLocation.setLocation(null);
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