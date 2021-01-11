import Notify from '@vant/weapp/notify/notify';
import Dialog from '@vant/weapp/dialog/dialog';
const util = require('../../utils/util');
const api = require("../../utils/request.js");

Page({
    data: {
        isLoading: true,
        weekdays: ['日', '一', '二', '三', '四', '五', '六'],
		// minDate: Date.now(),
		// maxDate: '',
		months: [],
        footerHeight: 500,
        dateArr: [],
        selectDateArr: [],      // 提交数据 2020-11-11 08:00~12:00
        showDate: [],           // 页面上展示数据 2020-11-11 上午
        popupshow: false,
        popupTitle: '',
        popupList: [],
        selectDateVal: '',
        maxNum: 1,              // 最多选择多少个日期
        isSubmit: false,        // 选择日期后的按钮状态
        isShowTip: true,
    },
    onLoad: function (options) {
        const that = this;
        let footerHeight = ''
        wx.getSystemInfo({
            success: (result) => {
                footerHeight = result.windowHeight - 166
                that.setData({ footerHeight, height: result.windowHeight })
            }
        })
        if (wx.getStorageSync('params').week_name) {
            let week_name = wx.getStorageSync('params').week_name;
            if (week_name.indexOf(',') > -1) {
                week_name = week_name.replace(', ', '或')
            }
            this.setData({ week_name })
        }
        
        // 获取排班最大或最小一个日期作为最大或最小选择日期
        let calendarStorage = wx.getStorageSync('serviceDate');
        let calendarArr = Object.values(calendarStorage)
        let calendarLen = calendarArr.length - 1;
        let datestrMin = calendarArr[0].datestr.split('-');
        let datestrMax = calendarArr[calendarLen].datestr.split('-');
        let minDate = new Date(datestrMin[0], datestrMin[1] - 1, datestrMin[2]).getTime();
        let maxDate = new Date(datestrMax[0], datestrMax[1] - 1, datestrMax[2]).getTime();

        if (options.goods_type == 1) {
            // 自定义标题
            wx.setNavigationBarTitle({ title: '服务日期' })
            that.setData({ hour: wx.getStorageSync('params').part_time_value.substr(0, 2) })
        } else {
            wx.setNavigationBarTitle({ title: '日期&时间段' })
        }
        this.setData({ goods_type: options.goods_type, maxDate, minDate, calendarLen })
        that.getMonth(minDate, maxDate);
        
        if (options.service_number != '' || options.service_number != undefined) {
            this.setData({ maxNum: options.service_number })
        }
        if (options.service_date != '') {
            let selectDateArr = options.service_date.split(',');
            this.defaultDateFormat(selectDateArr, options.service_number, options.goods_type)
        }
        // 调整日期时间
        if (options.type == 'edit') {
            const len = options.service_date.length;
            let params = {
                service_id: options.service_id,
                uid: wx.getStorageSync('uid'),
                change_type: 1,
                service_time: options.service_date.substr(0, 10),
                part_time: options.service_date.substr(11, len)
            }
            this.setData({ editParams: params })
        }
    },
    // 已选择数据格式化
    defaultDateFormat(selectDateArr, maxNum, goods_type) {
        let showDate = [];
        let defaultDate = [];
        for (let i in selectDateArr) {
            let item = selectDateArr[i].substr(0, 10);
            let timeText = '';
            let hour = goods_type == 0 ? selectDateArr[i].substr(11, 2) : this.data.hour;
            defaultDate.push(selectDateArr[i])

            // 判断是早上，下午还是晚上
            if (hour < 12) {
                timeText = '上午';
            } else if (hour < 19) {
                timeText = '下午';
            } else {
                timeText = '晚上';
            }
            let showObj = util.format(new Date(item), 'MM月dd日') + ' ' + timeText;
            showDate.push(showObj)
        }
        
        defaultDate = this.unique(defaultDate)
        let months = this.data.months;
        for (let i in defaultDate) {
            for (let j in months) {
                for (let k in months[j].days) {
                    if (defaultDate[i].substr(0, 10) == util.format(new Date(months[j].days[k].date), 'yyyy-MM-dd')) {
                        this.data.months[j].days[k].type = 'selected';
                        if (goods_type == 0) {
                            if (this.data.months[j].days[k].bottomInfo == '') {
                                this.data.months[j].days[k].bottomInfo = defaultDate[i].substr(11, 2) < 12 ? '上' : '下';
                            } else {
                                if (this.data.months[j].days[k].bottomInfo != '约满') {
                                    this.data.months[j].days[k].bottomInfo = '上/下';
                                }
                            }
                        } else {
                            this.data.months[j].days[k].bottomInfo = this.data.hour < 12 ? '上' : '下';
                        }
                    }
                }
            }
        }
        if (maxNum == selectDateArr.length) {
            this.setData({ isSubmit: true })
        } else {
            this.setData({ isSubmit: false })
        }
        this.setData({ selectDateArr, showDate, months })
    },
    // 统计并加载月数
	getMonth(minDate, maxDate) {
		let months = [];
        let cursor = new Date(minDate);
        let currMonth = 1;
		do {
            let week = (new Date(util.format(cursor, 'yyyy-MM-dd'))).getDay()
            if(currMonth != 1){
                week = (new Date(util.format(cursor, 'yyyy-MM-01'))).getDay()
            }
			months.push({
                timestamp: cursor.getTime(),
                week: week,
				month_title: this.formatMonthTitle(cursor.getTime()),
				days: this.setDays(currMonth++, cursor.getTime(), maxDate)
			});
			cursor.setMonth(cursor.getMonth() + 1);
        } while (this.compareMonth(cursor, new Date(maxDate)) !== 1);
        if(this.data.isShowTip && this.data.goods_type == 1){
            Dialog.alert({
                title: '温馨提示',
                message: '该周期已满，请选择其它周期',
                confirmButtonText: '我知道了'
            }).then(() => {
                // on close
            });
        }
        this.setData({ months })
    },
    // 判断年份
	compareMonth(date1, date2) {
		date1 = new Date(date1);
		date2 = new Date(date2);

		var year1 = date1.getFullYear();
		var year2 = date2.getFullYear();
		var month1 = date1.getMonth();
		var month2 = date2.getMonth();

		if (year1 === year2) {
			return month1 === month2 ? 0 : month1 > month2 ? 1 : -1;
		}
		return year1 > year2 ? 1 : -1;
    },
    // 格式化月份标题
	formatMonthTitle(date) {
		date = new Date(date);
		let month = date.getMonth() + 1 < 10 ? '0'+ (date.getMonth() + 1) : date.getMonth() + 1;
		return date.getFullYear() + '年' + month + '月';
    },
    // 每月天数
	setDays(currMonth, dates, maxDate) {
		let days = [];
        let startDate = new Date(dates);
        let maxdate = new Date(maxDate)
		let year = startDate.getFullYear();
        let month = startDate.getMonth();
        let startday = startDate.getDate();
        let day = 1;
        if(startday > day && currMonth == 1){
            day = startday
        }
        let totalDay = util.getMonthEndDay(startDate.getFullYear(), startDate.getMonth() + 1);
        if(maxdate.getMonth() == month){
            totalDay = maxdate.getDate()
        }

		for (day; day <= totalDay; day++) {
			var date = new Date(year, month, day);
			var config = {
                date: date,
				type: '',
				text: day,
				bottomInfo: '',
            };
			config = this.getDayType(config);
			days.push(config);
        }
		return days
	},
    getDayType: function (day) {

        let serviceDate = wx.getStorageSync('serviceDate');
        let currdate = util.format(new Date(day.date), 'yyyy-MM-dd')
        if(serviceDate[currdate] == undefined || serviceDate[currdate] == "" || serviceDate[currdate] == null){
            day.type = "disabled"
        } else {
            if (serviceDate[currdate].is_full == 0) {
                day.bottomInfo = '约满';
                day.type = "disabled"
            } else if (serviceDate[currdate].is_full == 7) {
                day.type = "disabled"
            } else {
                this.setData({isShowTip: false})
            }
        }
		return day;
    },
    // 日历点击事件
	onClick(e) {
		let monthIdx = e.currentTarget.dataset.monthidx;
        let dayIndex = e.currentTarget.dataset.index;
        let selectDateArr = this.data.selectDateArr;

        // 判断是否选择已满，并且再点击其他日期无效
        if (selectDateArr.length == this.data.maxNum) {
            let clickDate = util.format(new Date(this.data.months[monthIdx].days[dayIndex].date), 'yyyy-MM-dd');
            let exit = true;
            for (let i in selectDateArr) {
                if (this.data.goods_type == 0) {
                    // 短期
                    if (clickDate == selectDateArr[i].substr(0, 10)) {
                        this.formatDays(monthIdx, dayIndex);
                        exit = false;
                    }
                } else {
                    if (this.data.months[monthIdx].days[dayIndex].type != 'disabled') {
                        this.data.months[monthIdx].days[dayIndex].type = '';
                        this.data.months[monthIdx].days[dayIndex].bottomInfo = '';
                        let selectDateArr = this.data.selectDateArr;
                        let showDate = this.data.showDate;
                        for (let i in selectDateArr) {
                            if (clickDate == selectDateArr[i]) {
                                selectDateArr.splice(i, 1)
                                showDate.splice(i, 1);
                                exit = false;
                            }
                        }
                        this.setData({ months: this.data.months, selectDateArr, showDate })
                    }
                }
            }
            if (exit) {
                Notify({ type: 'danger', message: '先取消下方已选择的时间段' });
            }
        } else {
            this.formatDays(monthIdx, dayIndex);
        }
    },
    formatDays(monthIdx, dayIndex) {
        if (this.data.months[monthIdx].days[dayIndex].type != 'disabled') {
            let date = this.data.months[monthIdx].days[dayIndex].date;

            if (this.data.goods_type == 0) {
                // 短期
                let popupTitle = util.format(new Date(date), 'MM月dd日')
                let selectDateVal = util.format(new Date(date), 'yyyy-MM-dd')
                let selectDateArr = this.data.selectDateArr;

                // 时间段
                let serviceDate = wx.getStorageSync('serviceDate');
                let popupList = [];
                for (let i in serviceDate) {
                    if (serviceDate[i].datestr == selectDateVal) {
                        for (let k in serviceDate[i].part_time) {
                            popupList.push(serviceDate[i].part_time[k])
                        }
                    }
                }
                let dateArr = [];
                for (let k in selectDateArr) {
                    if (selectDateArr[k].substr(0, 10) == selectDateVal) {
                        let indexLen = selectDateArr[k].length
                        for (let j in popupList) {
                            if (selectDateArr[k].substr(11, indexLen) == popupList[j].time) {
                                popupList[j].checked = true;
                                dateArr.push(selectDateVal + ' ' + popupList[j].time)
                            }
                        }
                    }
                }
                this.setData({ popupshow: true, popupTitle, selectDateVal, popupList, dateArr })
            } else {
                let selectDateArr = this.data.selectDateArr;
                let showDate = this.data.showDate;
                for (let i in selectDateArr) {
                    if (util.format(new Date(date), 'yyyy-MM-dd') == selectDateArr[i]) {
                        selectDateArr.splice(i, 1)
                        showDate.splice(i, 1)
                        this.data.months[monthIdx].days[dayIndex].type = '';
                        this.setData({ months: this.data.months, selectDateArr, showDate })
                        return
                    }
                }
                let timeText = '';
                // 判断是早上，下午还是晚上
                if (this.data.hour < 12) {
                    timeText = '上午';
                } else if (this.data.hour < 19) {
                    timeText = '下午';
                } else {
                    timeText = '晚上';
                }
                this.data.months[monthIdx].days[dayIndex].type = 'selected';
                this.data.months[monthIdx].days[dayIndex].bottomInfo = this.data.hour < 12 ? '上' : '下';
                selectDateArr.push(util.format(new Date(date), 'yyyy-MM-dd'));
                showDate.push(util.format(new Date(date), 'MM月dd日') + ' ' + timeText)
                selectDateArr = this.sortHandle(selectDateArr)
                if (selectDateArr.length == this.data.maxNum) {
                    this.setData({ isSubmit: true })
                }
                this.setData({ months: this.data.months, selectDateArr, showDate })
            }
		}
    },
    // 弹出层 点击选择时间段
    onPopupSelect(e) {
        let index = e.currentTarget.dataset.index;
        let popupList = this.data.popupList;
        if (popupList[index].is_full == 0) return

        let dateArr = this.data.dateArr;
        let date = this.data.selectDateVal + ' ' + popupList[index].time;
        let isClick = true;

        if (this.data.maxNum == 1) {
            for (let i in popupList) {
                if (index == i) {
                    popupList[i].checked = true;
                    dateArr[0] = date
                } else {
                    popupList[i].checked = false;
                }
            }
        } else {
            for (let i in dateArr) {
                if (dateArr[i] == date) {
                    dateArr.splice(i, 1);
                    isClick = false;
                }
            }
            
            let dateLen = dateArr.length;
            let selectLen = this.data.selectDateArr.length;
            if(dateLen > 0 && selectLen > 0){
                dateLen = 0;
                for (let i in dateArr) {
                    for (let j in this.data.selectDateArr) {
                        if(dateArr[i] != this.data.selectDateArr[j]){
                            dateLen++;
                        }
                    }
                }
            }
            if (dateLen + selectLen >= this.data.maxNum && isClick) {
                Notify({ type: 'danger', message: '只能选择'+ this.data.maxNum +'个服务日期' });
                return
            }
            if (isClick) {
                dateArr.push(date)
            }
            popupList[index].checked = !popupList[index].checked;
        }
        this.setData({ popupList, dateArr })
    },
    // 弹出层 确定按钮事件
    onPopupConfirm() {
        let dateArr = JSON.stringify(this.data.dateArr);
        dateArr = JSON.parse(dateArr);
        let selectDateArr = this.data.selectDateArr;
        let newSelectDateArr = [];
        if(selectDateArr.length > 0){
            for (var j = 0; j < selectDateArr.length; j++) {
                if(selectDateArr[j].substr(0, 10) != this.data.selectDateVal){
                    newSelectDateArr.push(selectDateArr[j]);
                }
            }
        }
        selectDateArr = newSelectDateArr;
        for (let i in dateArr) {
            selectDateArr.push(dateArr[i]);
        }

        selectDateArr = this.sortHandle(selectDateArr);
        let months = this.data.months;
        let showDate = [];
        for (let j in selectDateArr) {
            let date = selectDateArr[j].substr(0, 10);
            let timeText = '';
            let hour = selectDateArr[j].substr(11, 2);
            if (this.data.editParams) {
                let len = selectDateArr[j].length;
                this.setData({ ['editParams.service_time']: date, ['editParams.part_time']: selectDateArr[j].substr(11, len) })
            }

            // 判断是早上，下午还是晚上
            if (hour < 12) {
                timeText = '上午';
            } else if (hour < 19) {
                timeText = '下午';
            } else {
                timeText = '晚上';
            }
            let showObj = util.format(new Date(date), 'MM月dd日') + ' ' + timeText;
            showDate.push(showObj)
        }

        // 根据时间段是否选择改变日历样式
        let isTrueNum = 0;
        let h = '';
        let popupList = this.data.popupList;
        for (let i in popupList) {
            if (popupList[i].checked == true) {
                isTrueNum++
                if (isTrueNum == 1) {
                    h = popupList[i].time.substr(0, 2);
                }
            }
        }
        for (let i in months) {
            for (let k in months[i].days) {
                let item = months[i].days[k];
                if (this.data.selectDateVal == util.format(new Date(item.date), 'yyyy-MM-dd')) {
                    if (isTrueNum == 0) {
                        item.type = '';
                        item.bottomInfo = '';
                    } else {
                        item.type = 'selected';
                        if (isTrueNum == 2) {
                            item.bottomInfo = '上/下';
                        } else {
                            if (h < 12) {
                                item.bottomInfo = '上'
                            } else {
                                item.bottomInfo = '下'
                            }
                        }
                    }
                }
            }
        }

        // 根据最大选择天数改变提交按钮状态
        if (selectDateArr.length == this.data.maxNum) {
            this.setData({ isSubmit: true })
        } else {
            this.setData({ isSubmit: false })
        }

        this.setData({ showDate, popupList: [], months, popupshow: false, selectDateArr, dateArr: [] })
    },
    onClosePopup() {
        this.setData({ popupshow: false, dateArr: [] })
    },
    // 删除已选择的服务日期与时间
    delHandle(e) {
        let item = e.currentTarget.dataset.item;
        let months = this.data.months;
        let showDate = this.data.showDate;
        let selectDateArr = this.data.selectDateArr;

        let popupTitle = item.substr(0, 6);
        let delDate = '';       // 删除那天日期 2020-11-11

        for (let i in selectDateArr) {
            if (showDate[i] == item) {
                delDate = selectDateArr[i];
                showDate.splice(i, 1)
                selectDateArr.splice(i, 1)
            }
        }
        
        let isDate = true;
        for (let k in showDate) {
            if (popupTitle == showDate[k].substr(0, 6)) {
                isDate = false;
            }
        }
        for (let i in months) {
            for (let k in months[i].days) {
                if (delDate.substr(0, 10) == util.format(new Date(months[i].days[k].date), 'yyyy-MM-dd')) {
                    if (isDate) {
                        if (months[i].days[k].bottomInfo != '约满') {
                            months[i].days[k].type = '';
                            months[i].days[k].bottomInfo = '';
                        } else {
                            months[i].days[k].type = 'disabled';
                        }
                    } else {
                        if (delDate.substr(11, 2) < 12) {
                            months[i].days[k].bottomInfo = '下';
                        } else if (delDate.substr(11, 2) < 19) {
                            months[i].days[k].bottomInfo = '上';
                        }
                    }
                }
            }
        }
        
        if (this.data.maxNum == selectDateArr.length) {
            this.setData({ isSubmit: true })
        } else {
            this.setData({ isSubmit: false })
        }
        
        this.setData({ showDate, selectDateArr, months })
    },
    submit() {
        if (this.data.selectDateArr.length < this.data.maxNum) {
            Notify({ type: 'danger', message: '请选择 '+ this.data.maxNum +' 个服务日期' });
            return
        }
        if (this.data.editParams) {
            wx.showLoading({ title: '请等待...', })
            if (this.data.isSubmit) {
                this.setData({ isSubmit: false })
                api.applyChangeDate(this.data.editParams).then(res => {
                    if (res.code == 0) {
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
                    wx.hideLoading()
                    this.setData({ isSubmit: true })
                })
            }
        } else {
            const pages = getCurrentPages()
            const prevPage = pages[pages.length-2]
            let serviceDate = this.data.selectDateArr.join(',')
            prevPage.setData({
                serviceDate: serviceDate
            })

            wx.navigateBack({
                delta: 1,
            })
        }
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        this.setData({ isLoading: false })
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        
    },
    unique(arr) {
        return Array.from(new Set(arr)); // 利用Array.from将Set结构转换成数组
    },
    // 日期排序
    sortHandle(arr) {
        arr.sort(function (a, b) {
            return a > b ? 1 : -1
        })
        return arr
    },
})