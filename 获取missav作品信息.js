var httpClient = http();
let currentEntry = entry();

// 获取番号字段
let code = currentEntry.field('番号');
if (!code || code === "") {
    log("错误：番号字段为空");
    // 移除 return，直接让脚本结束
} else {
    var missavurl = "https://missav.live/" + code;
    log("请求URL: " + missavurl);

    // 发送请求获取页面
    var resultav = httpClient.get(missavurl);
    log("响应码: " + resultav.code);

    // 检查请求是否成功
    if (resultav.code !== 200) {
        log("错误：页面请求失败，状态码: " + resultav.code);
    } else if (!resultav.body || resultav.body === "") {
        log("错误：页面内容为空");
    } else {
        // 发送数据到本地服务器
        var postData = {
            html: resultav.body
        };

        try {
            var response = httpClient.post("http://192.168.31.125:5000/missav", JSON.stringify(postData));
            log("服务器响应: " + response.body);
            
            // 解析返回的JSON
            var result;
            try {
                result = JSON.parse(response.body);
            } catch (e) {
                log("JSON解析失败: " + e.message);
                log("原始响应: " + response.body);
            }
            
            // 检查是否成功
            if (result) {
                // 获取视频数据
                var data = result;
                if (data) {
                    
					currentEntry.set("中文名", data.zhtitle || "");
					currentEntry.set("片名", data.jptitle || "");
					currentEntry.set("描述", data.description || "");
					currentEntry.set("标签", data.genres || "");
					//currentEntry.set("演员", data.actors || "");
					//currentEntry.set("封面", data.image || "");
					currentEntry.set("发布时间", data.publish_date || "");
					currentEntry.set("发行商", data.maker || "");
					currentEntry.set("系列", data.series || "");
                    

                    message("信息提取完成");
                } else {
                    log("错误：返回数据为空");
                }
            } else if (result && !result.success) {
                log("提取失败: " + (result.message || "未知错误"));
            }
        } catch (error) {
            log("请求或处理过程中出错: " + error.message);
        }
    }
}
