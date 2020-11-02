var md5 = require("md5.js")
var env = 'production' // 环境 开发环境 - development；正式环境 - production；

var base_url = env == 'production' ? 'https://api.jshuan.cn' : 'https://api.yishenjr.cn'
//签名密钥
var key = '123456789acdefghigklmnopqrstuvwsyz!@#$%^&*()';
// 上传图片的接口
var uploadImgUrl = base_url + '/uploadfile/upload';
/**
 * 网络请求
 * url 请求地址 login/wxlogin
 * params 请求参数Arraybuffer
 * method 请求类型：get、post
 * success 请求类型：get、post
 * fail 请求类型：get、post
 */
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
		// wx.showLoading({
		// 	title: '加载中...',
		// })

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
			},
			complete() {
				// wx.hideLoading();
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
	getBill: (data) => { // 获取账单
		return request('order/getbill', 'post', data)
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
	getlastdetails: (data) => {
		return request('service/getlastdetails', 'post', data)
	},
	applyrefund: (data) => {
		return request('service/applyrefund', 'post', data)
	},
	getSubscribeMessageConfig: (data) => { // 获取小程序订阅消息配置
		return request('service/getsubscribemessageconfig', 'post', data)
	},
	restartMatching: (data) => { // 重新匹配家政师
		return request('service/restartmatching', 'post', data)
	},
	// 家政师
	getQrcodedetails: (data) => { // 扫码打开家政师详情页
		return request('nanny/getqrcodedetails', 'post', data)
	},
	getHousekeeper: (data) => { // 获取已试用过的家政师
		return request('nanny/getusedselectlist', 'post', data)
	},
	getBindQrcode: (data) => { // 获取推荐家政师小程序码
		return request('nanny/getbindqrcode', 'post', data)
	},
	getseleclList: (data) => {
		return request('nanny/getselectlist', 'post', data)
	},
	nannyGetdetails: (data) => {
		return request('nanny/getdetails', 'post', data)
	},
	postselect: (data) => {
		return request('nanny/postselect', 'post', data)
	},
	nannyStar: (data) => {
		return request('nanny/star', 'post', data)
	},
	nannyBind: (data) => { // 扫码绑定
		return request('nanny/bind', 'post', data)
	},
	// 反馈
	submitFeedback: (data) => { // 提交反馈
		return request('feedback/postfeedback', 'post', data)
	},
	// 加入
	joinContent: (data) => { // 获取加入我们页面内容
		return request('join/getinfo', 'get', data)
	},
	joinSubmit: (data) => { // 提交岗位申请
		return request('join/postapply', 'post', data)
	},
	// 商品
	getDetails: (data) => { // 商品详情
		return request('goods/getdetails', 'post', data)
	},
}