import Notify from '@vant/weapp/notify/notify';
import Dialog from '@vant/weapp/dialog/dialog';
const util = require('../../utils/util');
const api = require('../../utils/request');
const chooseLocation = requirePlugin('chooseLocation');

Page({
    data: {
        detailData: '',
        formData: {
            goods_id: '',
            name: '',           // 姓名
            phone: '',          // 电话号码
            address: '',        // 服务地址
            house_number: '',   // 门牌号
            house: '',          // 户型
            family_size: '',    // 面积
            longitude: '',      // 经度
            latitude: '',       // 纬度
            city: '',           // 城市
            service_date: '',   // 服务日期
        },
        weeks: [
            { week_id: 1, week_name: '周一', checked: false },
            { week_id: 2, week_name: '周二', checked: false },
            { week_id: 3, week_name: '周三', checked: false },
            { week_id: 4, week_name: '周四', checked: false },
            { week_id: 5, week_name: '周五', checked: false },
            { week_id: 6, week_name: '周六', checked: false },
            { week_id: 7, week_name: '周日', checked: false }
        ],
        week_name: '',
        weekList: [],
        weekShow: false,
        weekNum: 1,
        houseList: [],
        roomSelected: -1,
        areaList: [],
        areaSelected: -1
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const that = this;

        if (wx.getStorageSync('subtitle4')) {
            this.setData({ subtitle4: wx.getStorageSync('subtitle4') })
        }
        
        // 获取选项信息
        wx.showLoading({
          title: '加载中...',
        })
        api.getServiceOption({}).then(res => {
            wx.hideLoading()
            if (res.code == 0) {
                that.setData({
                    houseList: that.sortHandle(res.data.house),
                    areaList: that.sortHandle(res.data.size)
                })

                // 带参数 预约
                if (wx.getStorageSync('formData')) {
                    let formData = wx.getStorageSync('formData')
                    let arr = formData.address.split(',')
                    let address = arr[0]
                    let addressName = arr[1]
                    let serviceDateList = formData.service_date.split(',')
                    this.setData({ formData, address, addressName, serviceDateList })
                    
                    if (this.data.detailData.goods_type == 1) {
                        if (formData.week_id) {
                            let weeks = this.data.weeks;
                            let week_id_arr = formData.week_id.split(',')
                            let week_name_arr = []
                            let weekList = []
                            for (let i in weeks) {
                                for (let k in week_id_arr) {
                                    if (week_id_arr[k] == weeks[i].week_id) {
                                        week_name_arr.push(weeks[i].week_name)
                                        weeks[i].checked = true
                                        weekList.push(weeks[i])
                                    }
                                }
                            }
                            this.setData({ week_name: week_name_arr.join(', '), weeks, weekList, ['detailData.week_name']: week_name_arr.join(', ') })
                            this.getCalendar(this.data.detailData.part_time_id, this.data.detailData.goods_type, this.data.formData.week_id)
                        }
                    }
                    
                    // 房屋户型
                    that.sortHandle(res.data.house).map((item, index) => {
                        if (formData.house == item.title) {
                            that.setData({
                                ["roomSelected"]: index,
                            })
                        }
                    })
                    // 家庭面积
                    that.sortHandle(res.data.size).map((item, index) => {
                        if (formData.family_size == item.title) {
                            that.setData({
                                ["areaSelected"]: index,
                            })
                        }
                    })
                } else {
                    if (this.data.detailData.goods_type == 1) {
                        this.setData({ ['detailData.week_name']: '' })
                    }
                    this.setData({ ['formData.phone']: wx.getStorageSync('phone') })
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
    // 打开选择日期
    onDisplay() {
        let navigateToUrl = '';
        if (this.data.detailData.goods_type == 1) {
            if (this.data.week_name == '') {
                Notify({ type: 'danger', message: '请选择服务周期' });
                return
            }
            navigateToUrl = '../calendar/calendar?service_number=1&service_date=' + this.data.formData.service_date + '&goods_type=' + this.data.detailData.goods_type
        } else {
            navigateToUrl = '../calendar/calendar?service_number=' + this.data.detailData.service_number + '&service_date=' + this.data.formData.service_date + '&goods_type=' + this.data.detailData.goods_type
        }
        wx.navigateTo({
            url: navigateToUrl
        })
    },
    // input 输入框 name - 联系人，
    bindNameInput(e) {
        this.setData({ ["formData.name"]: e.detail.value });
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
                let name = e.detail.value;
                if (util.trim(name, 2) == '') {
                    Notify({ type: 'danger', message: '请填写联系人' });
                } else {
                    this.setData({ ["formData.name"]: name });
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
                    this.setData({ ["formData.house_number"]: number });
                }
                break;
            case 'remark':
                let content = e.detail.value;
                this.setData({ ["formData.remark"]: util.trim(content, 2) });
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
    // 跳转地图插件
    bindClickAdress() {
        const key = getApp().globalData.mapKey; // 使用在腾讯位置服务申请的key
        const referer = '家舒安'; // 调用插件的app的名称
        wx.navigateTo({
            url: 'plugin://chooseLocation/index?key=' + key + '&referer=' + referer
        });
    },
    // 提交
    submit() {
        const that = this;
        if (this.formVerify()) {
            api.checkDate(that.data.formData).then(res => {
                if (res.code == 0) {
                    wx.setStorageSync('formData', that.data.formData)
                    wx.navigateBack({
                        delta: 1
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
    formVerify() {
        let data = this.data.formData;
        let regPhone = /^1\d{10}$/;
        if (this.data.detailData.goods_type == 1) {
            if (this.data.week_name == '') {
                Notify({ type: 'danger', message: '请选择服务周期' });
                return false;
            }
            if (data.service_date == '') {
                Notify({ type: 'danger', message: '请选择服务日期' });
                return false;
            }
        } else {
            if (data.service_date == '') {
                Notify({ type: 'danger', message: '请选择服务日期&时间段' });
                return false;
            }
        }
        if (data.name == '') {
            Notify({ type: 'danger', message: '请填写联系人' });
            return false;
        } else if (data.phone == '') {
            Notify({ type: 'danger', message: '请填写电话号码' });
            return false;
        } else if (!regPhone.test(data.phone)) {
            Notify({ type: 'danger', message: '电话号码格式不正确' });
            return false;
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
        } else {
            return true
        }
    },
    // 按 id 排序
    sortHandle(arr, type) {
        arr.sort(function (a, b) {
            if (type == 1) {
                return a > b ? 1 : -1
            } else if (type == 2) {
                return a.week_id - b.week_id;
            } else {
                return a.id - b.id;
            }
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
        let detailData = wx.getStorageSync('params');
        if (detailData.goods_type == 1) {
            this.setData({ weekNum: detailData.service_number })
        } else {
            this.getCalendar(detailData.part_time_id, detailData.goods_id, '', '')
        }
        this.setData({detailData, ['formData.goods_id']: detailData.goods_id })

        const location = chooseLocation.getLocation(); // 如果点击确认选点按钮，则返回选点结果对象，否则返回null
        if (location != null) {
            let addr = location.address
            addr = addr.substr(addr.indexOf('省')+1, addr.length)
            let address = addr + ',' + location.name
            this.setData({
                ["formData.address"]: address,
                ["formData.longitude"]: location.longitude,
                ["formData.latitude"]: location.latitude,
                ["formData.city"]: location.city,
                addressName: location.name,
                address: addr
            });
        }

        // 选择日历返回数据
        const pages = getCurrentPages()
        const currPage = pages[pages.length - 1]
        if (currPage.data.serviceDate) {
            let dateArr = currPage.data.serviceDate.split(',')
            this.setData({ ['formData.service_date']: currPage.data.serviceDate, serviceDateList: dateArr })
        }
    },
    // 服务周期 - 打开
    onWeekPopup() {
        if (this.data.weekShow) {
            let week_name_arr = this.data.detailData.week_name.split(', ');
            let weeks = this.data.weeks;
            let weekList = [];

            for (let i in week_name_arr) {
                for (let k in weeks) {
                    if (week_name_arr[i] == weeks[k].week_name) {
                        weekList.push(weeks[k])
                        weeks[k].checked = true
                    }
                }
            }
            this.setData({ week_name: this.data.detailData.week_name, weeks, weekList, weekArr: weekList })
        }
        this.setData({ weekShow: !this.data.weekShow })
    },
    // 服务周期 - 选择
    weekHandle(e) {
        let index = e.currentTarget.dataset.index;
        let weekArr = this.data.weekArr == undefined ? [] : this.data.weekArr;
        let weeks = this.data.weeks;
        let weekNum = this.data.weekNum;
        let weekList = this.data.weekList;
        let week_name_arr = [];
        let week_name = '';

        if (weekNum <= 1) {
            for (let i in weeks) {
                if (index == i) {
                    week_name = weeks[i].week_name;
                    weekList[0] = weeks[i];
                    weeks[i].checked = true;
                } else {
                    weeks[i].checked = false;
                }
            }
            this.setData({ weeks, weekList, week_name, weekArr: weekList })
        } else {
            if (weekList.length >= weekNum) {
                let delWeekName = weekList[weekNum-1].week_name;
                for (let j in weekArr) {
                    if (weekArr[j].week_name == delWeekName) {
                        weekArr.splice(j, 1)
                    }
                }
                weekList.pop();
                for (let i in weekList) {
                    for (let k in weeks) {
                        if (weekList[i].week_name != weeks[k].week_name) {
                            weeks[k].checked = false;
                        }
                    }
                }
            }
            weeks.map((item, idx) => {
                if (idx == index) {
                    item.checked = true;
                    weekList.unshift(item)
                    weekArr.unshift(item)
                }
            })
            weekArr = this.sortHandle(weekArr, 2);
            for (let i in weekArr) {
                week_name_arr.push(weekArr[i].week_name);
            }
            week_name = week_name_arr.join(', ');
            this.setData({ weeks, weekList, weekArr, week_name })
        }
    },
    // 服务周期 - 确认
    weekSubmit() {
        let weekArr = this.data.weekArr;
        if (weekArr.length == this.data.weekNum) {
            let week_id_arr = []
            for (let i in weekArr) {
                week_id_arr.push(weekArr[i].week_id)
            }
            
            this.setData({ 
                weekShow: false, 
                ['formData.week_id']: week_id_arr.join(','),
                ['detailData.week_name']: this.data.week_name
            })
            wx.setStorageSync('params', this.data.detailData)
            if (this.data.detailData.nanny_id) {
                this.getCalendar(this.data.detailData.part_time_id, this.data.detailData.goods_id, this.data.formData.week_id, this.data.detailData.nanny_id)
            } else {
                this.getCalendar(this.data.detailData.part_time_id, this.data.detailData.goods_id, this.data.formData.week_id, '')
            }
        }
    },
    // 获取排班
    getCalendar(part_time_id, goods_id, week_id, nanny_id) {
        api.getCalendar({
            part_time_id: part_time_id,
            goods_id: goods_id,
            week_id: week_id,
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

                if (this.data.detailData.goods_type == 1) {
                    // 判断是否有库存
                    let dateLen = 0;    // 所有日期数量
                    let date07Num = 0;  // 日期状态为0和7的数量
                    for (let i in serviceDate) {
                        dateLen++
                        if (serviceDate[i].is_full == 7 || serviceDate[i].is_full == 0) {
                            date07Num++
                        }
                    }
                    if (dateLen == date07Num) {
                        Dialog.alert({
                            title: '温馨提示',
                            message: '该周期已满，请选择其它周期',
                            confirmButtonText: '我知道了'
                        }).then(() => {
                            // on close
                            this.setData({weekShow: true})
                        });
                    }
                }
            }
        })
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