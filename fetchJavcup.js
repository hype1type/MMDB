function fetchJavCup(){
    let userInput = arg("页数");
//log(userInput)
var result = http().get("https://javcup.com/movies/jav/page/${userInput}");
//log("响应码: " + result.code);
//log("响应体: " + result.body);
// 假设这是从fetch或其他途径获取的HTML字符串
const htmlString = result.body;

// 提取所有电影条目
var moviePattern = /<li class="grid-item[^>]*>([\s\S]*?)<\/li>/g;
var movies = [];
var match;

while ((match = moviePattern.exec(htmlString)) !== null) {
    var itemHtml = match[1];
    
    // 提取番号
    var codeMatch = itemHtml.match(/品番: <\/span><span>([^<]+)<\/span>/);
    var code = codeMatch ? codeMatch[1] : '';
    
    // 提取发售日
    var dateMatch = itemHtml.match(/発売日: <\/span><span>([^<]+)<\/span>/);

    var releaseDate = dateMatch ? dateMatch[1] : '';
    releaseDate = releaseDate.replace('-', '/')

    
    // 提取出演者
    var actorMatch = itemHtml.match(/出演者: <\/span><span><a[^>]*>([^<]+)<\/a>/);
    var actor = actorMatch ? actorMatch[1] : '';
    
    // 提取标题（从title属性）
    var titleMatch = itemHtml.match(/title="([^"]+)"/);
    var title = titleMatch ? titleMatch[1] : '';
    
    // 提取图片URL
    var imgMatch = itemHtml.match(/data-src="([^"]+)"/);
    var imgUrl = imgMatch ? imgMatch[1] : '';
    
    // 提取时长
    var durationMatch = itemHtml.match(/<span class="duration">([^<]+)<\/span>/);
    var duration = durationMatch ? durationMatch[1] : '';
    
    // 提取详情页链接
    var linkMatch = itemHtml.match(/href="([^"]+)"/);
    var detailUrl = linkMatch ? linkMatch[1] : '';
    
    movies.push({
        code: code,
        releaseDate: releaseDate,
        actor: actor,
        title: title,
        imgUrl: imgUrl,
        duration: duration,
        detailUrl: detailUrl
    });
}
function isCodeExists(code) {
    var records = targetlib.find(code);  // 按字段查找
    return records && records.length > 0;
}
var targetlib= lib();

// 使用示例
for (var i = 0; i < movies.length; i++) {
    var code = movies[i].code;
    
    if (!code) continue;
    
    if (isCodeExists(code)) {
        log("跳过重复: " + code);
        continue;
    }
    
    // 不存在，创建新记录
    targetlib.create({
        "番号": code,
        "作品 id": code,
        "封面": movies[i].imgUrl,
        "卡片": movies[i].imgUrl,
        "演员": movies[i].actor,
        "片名": movies[i].title
    });
    
    log("✓ 创建成功: " + code);
}


}
    
fetchJavCup()