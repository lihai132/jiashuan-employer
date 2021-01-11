// 时间格式化
const format = (date, fmt) => {
	var o = {
		"M+": date.getMonth() + 1, // 月份
		"d+": date.getDate(), // 日
		"H+": date.getHours(), // 时
		"m+": date.getMinutes(), // 分
		"s+": date.getSeconds(), // 秒
		"q+": Math.floor((date.getMonth() + 3) / 3), // 季度
		"S": date.getMilliseconds() // 毫秒
	};
	if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
		if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k])
			.substr(("" + o[k]).length)));
	return fmt;
}

// 去除字符串空格
const trim = (str, type) => {
  // type 1-所有空格  2-前后空格  3-前空格 4-后空格
  switch(Number(type)) {
      case 1:
          return str.replace(/\s+/g, "");
      case 2:
          return str.replace(/(^\s*)|(\s*$)/g, "");
      case 3:
          return str.replace(/(^\s*)/g, "");
      case 4:
          return str.replace(/(\s*$)/g, "");
      default:
          return str;
  }
}

function getMonthEndDay(year, month) {
	return 32 - new Date(year, month - 1, 32).getDate();
}

function compareMonth(date1, date2) {
	if (!(date1 instanceof Date)) {
		date1 = new Date(date1);
	}
	if (!(date2 instanceof Date)) {
		date2 = new Date(date2);
	}
	var year1 = date1.getFullYear();
	var year2 = date2.getFullYear();
	var month1 = date1.getMonth();
	var month2 = date2.getMonth();
	if (year1 === year2) {
		return month1 === month2 ? 0 : month1 > month2 ? 1 : -1;
	}
	return year1 > year2 ? 1 : -1;
}

function compareDay(day1, day2) {
	if (!(day1 instanceof Date)) {
		day1 = new Date(day1);
	}
	if (!(day2 instanceof Date)) {
		day2 = new Date(day2);
	}
	var compareMonthResult = compareMonth(day1, day2);
	if (compareMonthResult === 0) {
		var date1 = day1.getDate();
		var date2 = day2.getDate();
		return date1 === date2 ? 0 : date1 > date2 ? 1 : -1;
	}
	return compareMonthResult;
}

module.exports = {
  format: format,
  trim: trim,
  getMonthEndDay: getMonthEndDay,
  compareDay: compareDay
}
