function fetchJavDb() {
    let userInput = arg("页数");
    
    var result = http().get(`https://javdb.com/censored?page=${userInput}&vft=0`);
    
    if (result.code !== 200) {
        log("请求失败: " + result.code);
        return;
    }
    
    const htmlString = result.body;
    
    // 匹配每个电影条目 - 根据实际HTML结构修正
    var moviePattern = /<div class="item">([\s\S]*?)<\/div>\s*<\/a>\s*<\/div>/g;
    var movies = [];
    var match;
    
    while ((match = moviePattern.exec(htmlString)) !== null) {
        var itemHtml = match[1];
        
        // 提取番号（在strong标签内）
        var codeMatch = itemHtml.match(/<strong>([^<]+)<\/strong>/);
        var code = codeMatch ? codeMatch[1] : '';
        
        // 提取完整标题（strong标签后面的文本）
        var titleMatch = itemHtml.match(/<strong>.*?<\/strong>(.*?)<\/div>/);
        var title = titleMatch ? titleMatch[1].trim() : '';
        
        // 提取封面图片URL
        var imgMatch = itemHtml.match(/<img[^>]+src="([^"]+)"/);
        var imgUrl = imgMatch ? imgMatch[1] : '';
        
        // 提取发行日期（meta类）
        var dateMatch = itemHtml.match(/<div class="meta">\s*([\d\-]+)\s*<\/div>/);
        var releaseDate = dateMatch ? dateMatch[1] : '';
        
        // 提取详情页链接
        var linkMatch = itemHtml.match(/<a href="([^"]+)"/);
        var detailUrl = linkMatch ? "https://javdb.com" + linkMatch[1] : '';
        
        // 提取评分（如果有需要）
        var scoreMatch = itemHtml.match(/<span class="value">([^<]+)/);
        var score = scoreMatch ? scoreMatch[1].trim() : '';
        
        // 提取演员信息（如果存在，可能需要从详情页获取）
        // 注意：当前页面可能不直接显示演员，需要进入详情页
        
        movies.push({
            code: code,
            title: title,
            imgUrl: imgUrl,
            releaseDate: releaseDate,
            detailUrl: detailUrl,
            score: score
        });
    }
    
    log("共提取到 " + movies.length + " 个影片");
    
    function isCodeExists(code) {
        var records = targetlib.find(code);
        return records && records.length > 0;
    }
    
    var targetlib = lib();
    
    // 创建记录
    for (var i = 0; i < movies.length; i++) {
        var movie = movies[i];
        
        if (!movie.code) {
            log("跳过无番号条目");
            continue;
        }
        
        if (isCodeExists(movie.code)) {
            log("跳过重复: " + movie.code);
            continue;
        }
        
        // 创建新记录
        targetlib.create({
            "番号": movie.code,
            "作品 id": movie.code,
            "封面": movie.imgUrl,
            "卡片": movie.imgUrl,
            "演员": movie.actor || "",
            "片名": movie.title || "",
            "发行日期": movie.releaseDate,
        });
        
        // log("✓ 创建成功: " + movie.code + " - " + movie.title);
    }
    
    log("处理完成，共创建 " + movies.filter(m => m.code && !isCodeExists(m.code)).length + " 条新记录");
}

fetchJavDb();
