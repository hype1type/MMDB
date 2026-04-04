var httpClient = http();
// 创建带有初始值的新任务
let taskLib = lib();

var avbase = "https://www.avbase.net/works/date";
log("请求URL: " + avbase);

// 发送请求获取页面
var content = httpClient.get(avbase);
log("响应码: " + content.code);

// 检查请求是否成功
if (content.code !== 200) {
    log("错误：页面请求失败，状态码: " + content.code);
} else if (!content.body || content.body === "") {
    log("错误：页面内容为空");
} else {
    // 发送数据到本地服务器
    var postData = {
        html: content.body
    };

    try {
        var response = httpClient.post("http://192.168.31.125:5000/javbase", JSON.stringify(postData));
        log("服务器响应: " + response.body);
        
        // 解析返回的JSON
        var result;
        try {
            result = JSON.parse(response.body);
        } catch (e) {
            log("JSON解析失败: " + e.message);
            //log("原始响应: " + response.body);
        }
        
        // 检查是否成功
        if (result) {
            // 获取视频数据
            for (let i = 0; i < result.length; i++) {
                let item = result[i];
                if (item) {
                    let newTask = taskLib.create({
                        "作品 id": item.work_id,
                        "番号": item.work_id,
                        "作品链接": item.work_url,
                        "片名": item.title,
                        "卡片": item.cover_url,
                        "演员": item.actors,
                        "发布时间": item.date,
                        "发行商": item.maker,
                        "系列": item.series,
                    });}
            }

            message("信息提取完成");
            } else {
                log("错误：返回数据为空");
            }
    } catch (error) {
        log("请求或处理过程中出错: " + error.message);
    }
}

