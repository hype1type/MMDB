var httpClient = http();
var currentEntry = entry();
var pics = currentEntry.field("相关图片");
// 获取番号字段
let code = currentEntry.field('番号');

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