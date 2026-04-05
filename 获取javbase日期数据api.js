function toYMD(dateInput) {
    let date = new Date(dateInput);  // Date 对象、时间戳、字符串都适用
    if (isNaN(date.getTime())) {
        return null;  // 无效日期
    }
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getFormattedDate(dateInput) {
    let formatted = dateValue.toISOString().split('T')[0];
    if (formatted) {
        return formatted;
    }
    else {
        let now = new Date().getTime();
        return toYMD(now);
    }
}




let userInput = arg("页数");
if (!userInput) {
    userInput = 1;
}

let dateValue = arg("日期");
let formatted = getFormattedDate(dateValue);


var targetlib = lib();

// 检查番号是否已存在
function isCodeExists(code) {
    var existing = targetlib.findByKey(code);
    return existing !== null;
}

// 构建请求URL
var apiUrl = "https://www.avbase.net/_next/data/XY9j5wv3QmWOM01AJRDRG/works/date" + formatted +".json?q=&page=" + userInput;
log("请求URL: " + apiUrl);

var result = http().get(apiUrl);

if (result.code === 200) {
    try {
        var jsonData = JSON.parse(result.body);
        var works = jsonData.pageProps.works;
        
        if (!works || works.length === 0) {
            message("未找到任何作品数据");
        }
        
        var successCount = 0;
        var skipCount = 0;
        
        // 使用普通 for 循环
        for (var i = 0; i < works.length; i++) {
            var work = works[i];
            
            // 检查是否已存在
            if (isCodeExists(work.work_id)) {
                log("跳过重复: " + work.work_id);
                skipCount++;
                continue;
            }
            
            // 提取演员名
            var actors = work.actors ? work.actors.map(function(a) { return a.name; }).join(", ") : "";
            
            // 提取产品信息
            var product = work.products && work.products[0] ? work.products[0] : null;
            
            // 提取系列名称
            var series = "";
            if (product && product.series) {
                series = product.series.name || "";
            }
            
            // 提取发行商
            var maker = "";
            if (product && product.maker) {
                maker = product.maker.name || "";
            }
            
            // 提取主图片 URL
            var imageUrl = "";
            if (product) {
                imageUrl = product.image_url || product.thumbnail_url || "";
            }
            
            // 提取相关图片
            var sampleImages = [];
            if (product && product.sample_image_urls) {
                for (var j = 0; j < product.sample_image_urls.length; j++) {
                    var imgUrl = product.sample_image_urls[j].l;
                    if (imgUrl) {
                        sampleImages.push(imgUrl);
                    }
                }
            }
            var sampleImagesStr = sampleImages.join(", ");
            
            // 创建新条目
            targetlib.create({
                "片名": work.title,
                "作品 id": work.work_id,
                "番号": work.work_id,
                "发布时间": new Date(work.min_date).getTime(),
                "演员": actors,
                "系列": series,
                "发行商": maker,
                "卡片": imageUrl,
                "封面": imageUrl,
                "相关图片": sampleImagesStr
            });
            
            log("✓ 已创建: " + work.work_id + "，相关图片 " + sampleImages.length + " 张");
            successCount++;
        }
        
        message("完成！创建: " + successCount + " 条，跳过重复: " + skipCount + " 条");
        
    } catch (e) {
        log("解析错误: " + e.message);
        message("数据解析失败: " + e.message);
    }
} else {
    log("HTTP 请求失败，状态码: " + result.code);
    message("请求失败，状态码: " + result.code);
}