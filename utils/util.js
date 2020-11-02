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

module.exports = {
  format: format,
  trim: trim
}
