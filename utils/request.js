var md5 = require("md5.js")
var env = 'development' // 测试环境 - development； 正式环境 - production；

var base_url = env == 'production' ? 'https://api.jshuan.cn/v2' : 'https://api.yishenjr.cn/v2'
//签名密钥
var key = '123456789acdefghigklmnopqrstuvwsyz!@#$%^&*()';
// 上传图片的接口
var uploadImgUrl = base_url + '/uploadfile/upload';

const request = (url, method, params) => {
	//拼接请求地址
	var url = base_url + '/' + url;
	//为请求参数附加上token
	params['token'] = wx.getStorageSync('token') || '';
	//获取加密字符串
	var string = objKeySort(params);
	//在string后加入KEY
	string = string + "&key=" + key;
	//md5加密得到签名
	string = md5.md5(string)
	//所有字符转为大写
	string = string.toLocaleUpperCase()
	//为请求参数附加上sign
	params['sign'] = string;

	return new Promise((resolve, reject) => {
		wx.request({
			url: url,
			method: method,
			data: params,
			header: {
				'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
			},
			success: function (res) {
				resolve(res.data)
			},
			fail(err) {
				reject(err)
			}
		})
	})
}

/**
 * 排序函数
 **/
function objKeySort(obj) {
	//对参数进行排序
	var newkey = Object.keys(obj).sort();
	//创建一个新的对象，用于存放排好序的键值对
	var newObj = {};
	//遍历newkey数组
	for (var i = 0; i < newkey.length; i++) {
		//向新创建的对象中按照排好的顺序依次增加键值对
		newObj[newkey[i]] = obj[newkey[i]];
	}
	//格式化参数格式化成url参数
	var buff = "";
	for (var j = 0; j < newkey.length; j++) {
		var k = newkey[j]
		var v = newObj[k]
		if (Array.isArray(v)) {
			v = v.toString();
		}
		if (v != "sign" && v != "") {
			buff = buff + k + "=" + v + "&";
		}
	}
	//去除首尾&字符
	buff = buff.replace(/^(\s|&)+|(\s|&)+$/g, '')
	return buff;
}

module.exports = {
	env: env,
	uploadImgUrl: uploadImgUrl,
	request: request,
	// 注册登录
	login: (data) => { // 获取用户openid
		return request('login/getopenid', 'post', data)
	},
	getPhone: (data) => { // 手机号码授权登录
		return request('login/getphone', 'post', data)
	},
	// 首页
	getIndex: (data) => { // 获取首页配置
		return request('index/getindex', 'get', data)
	},
	getNannyPhone: (data) => { // 获取当前正在提供服务的家政师电话
		return request('index/getnannyphone', 'post', data)
	},
	// 订单
	getOrderList: (data) => { // 获取订单列表
		return request('order/getlist', 'post', data)
	},
	getOrderDetail: (data) => { // 获取订单详情
		return request('order/getdetails', 'post', data)
	},
	postorder: (data) => { // 提交订单（返回支付参数）
		return request('order/postorder', 'post', data)
	},
	wxPay: (data) => { // 重新发起支付
		return request('order/wxpay', 'post', data)
	},
	payFail: (data) => { // 支付失败-下发订阅消息
		return request('order/payfail', 'post', data)
	},
	getAbnormal: (data) => { // 获取异常订单记录
		return request('order/abnormal', 'post', data)
	},
	checkDate: (data) => { // 检查预约必填参数
		return request('order/checkdate', 'post', data)
	},
	// 服务
	getServiceOption: (data) => { // 获取服务页基础选项（户型、面积、口味等）
		return request('service/getoption', 'get', data)
	},
	serviceSubmit: (data) => { // 提交预约服务
		return request('service/postorder', 'post', data)
	},
	serviceEdit: (data) => { // 编辑预约服务
		return request('service/saveservice', 'post', data)
	},
	getAgreement: (data) => { // 获取服务协议
		return request('service/getagreement', 'post', data)
	},
	getQuestion: (data) => { // 获取服务评价问题
		return request('service/getevaluate', 'post', data)
	},
	postQuestion: (data) => { // 提交服务评价问题
		return request('service/postevaluate', 'post', data)
	},
	applyrefund: (data) => {	// 发起退款
		return request('service/applyrefund', 'post', data)
	},
	getSubscribeMessageConfig: (data) => { // 获取小程序订阅消息配置
		return request('service/getsubscribemessageconfig', 'post', data)
	},
	applyChangeDate: (data) => { // 服务日期、时间更改申请
		return request('service/change', 'post', data)
	},
	// 家政师
	getQrcodedetails: (data) => { // 扫码打开家政师详情页
		return request('nanny/getqrcodedetails', 'post', data)
	},
	getUsedSelectList: (data) => { // 转长期-获取已试用过的家政师
		return request('nanny/getusedselectlist', 'post', data)
	},
	getHousekeeper: (data) => { // 获取扫码后家政师资料
		return request('nanny/getusedselectlist', 'post', data)
	},
	getBindQrcode: (data) => { // 获取推荐家政师小程序码
		return request('nanny/getbindqrcode', 'post', data)
	},
	nannyGetdetails: (data) => {	// 家政师详情
		return request('nanny/getdetails', 'post', data)
	},
	nannyStar: (data) => {	// 家政师点赞
		return request('nanny/star', 'post', data)
	},
	nannyBind: (data) => { // 扫码绑定
		return request('nanny/bind', 'post', data)
	},
	// 其它
	submitFeedback: (data) => { // 提交反馈
		return request('feedback/postfeedback', 'post', data)
	},
	joinContent: (data) => { // 获取加入我们页面内容
		return request('join/getinfo', 'get', data)
	},
	joinSubmit: (data) => { // 提交岗位申请
		return request('join/postapply', 'post', data)
	},
	getDetails: (data) => { // 商品详情
		return request('goods/getdetails', 'post', data)
	},
	qrcodeAdd: (data) => { // 扫码统计
		return request('qrcode/add', 'post', data)
	},
	qrcodeAddress: (data) => {	// 扫码后记录地址
		return request('qrcode/addaddress', 'post', data)
	},
	getCalendar: (data) => { // 人工排班
		return request('stock/getcalendar', 'post', data)
	},
	getNannyList: (data) => { // 获取更换家政师列表
		return request('stock/getnannylist', 'post', data)
	},
	comesbackmini: (data) => { // 回传广告数据
		return request('mpwx/comesbackmini', 'post', data)
	},
	getRules: () => { // 活动规则
		return request('activity/rules', 'get', {})
	}
}