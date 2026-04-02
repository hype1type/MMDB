var httpClient = http();
var currentEntry = entry();
var pics = currentEntry.field("相关图片");
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









// 设置封面的函数
function setCover(imageUrl) {
    if (imageUrl) {
        currentEntry.set("封面", imageUrl);
        currentEntry.set("卡片", imageUrl);
        message("设置封面成功");
        return true;
    }
    return false;
}

// 提取演员信息的函数
function extractActors(html) {
    // 匹配演员信息
    var actorRegex = /<div class="entity-card-body"><a class="stretched-link truncate font-semibold text-sm" href="\/actor\/\d+\/">([^<]+)<\/a><\/div>/g;
    var actors = [];
    var actorMatch;
    
    while ((actorMatch = actorRegex.exec(html)) !== null) {
        actors.push(actorMatch[1]);
    }
    
    return actors;
}

if (pics && pics.length > 0) {
    message("已有图片");
    var coverbig = currentEntry.field("封面");
    
    // 如果没有封面，使用第一张相关图片作为封面
    if (!coverbig || coverbig.length < 1) {
        setCover(pics[0]);
    }
} else {
    var picUrl = "https://avwikidb.com/work/" + currentEntry.field("番号");
    log(picUrl);
    
    try {
        var result = httpClient.get(picUrl);
        var html = result.body;
        
        // 匹配图片URL
        var imgRegex = /<img[^>]+src="(https:\/\/pics\.dmm\.co\.jp[^"]+)"[^>]*>/g;
        var imageUrls = [];
        var imgMatch;
        
        while ((imgMatch = imgRegex.exec(html)) !== null) {
            imageUrls.push(imgMatch[1]);
        }
        
        // 提取演员信息
        var actors = extractActors(html);
        if (actors && actors.length > 0) {
            log("找到演员: " + actors.join(", "));
            // 如果需要保存演员信息，取消下面的注释
            currentEntry.set("演员", actors.join(" "));
            // currentEntry.set("演员列表", actors);
        } else {
            log("未找到演员信息");
        }
        
        if (imageUrls && imageUrls.length > 0) {
            currentEntry.set("相关图片", imageUrls);
            // 自动设置封面（如果需要）
            var coverbig = currentEntry.field("封面");
            if (!coverbig || coverbig.length < 1) {
                setCover(imageUrls[0]);
            }
            message("成功获取 " + imageUrls.length + " 张图片");
        } else {
            message("未找到匹配的图片URL");
        }
        
    } catch (error) {
        log("请求失败: " + error);
        message("获取图片失败，请检查网络或番号");
    }
}