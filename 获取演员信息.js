var httpClient = http();
var currentEntry = entry();


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
var picUrl = "https://avwikidb.com/work/" + currentEntry.field("番号");
log(picUrl);

try {
	var result = httpClient.get(picUrl);
	var html = result.body;

	// 提取演员信息
	var actors = extractActors(html);
	if (actors && actors.length > 0) {
		log("找到演员: " + actors.join(", "));
		// 如果需要保存演员信息，取消下面的注释
		currentEntry.set("演员", actors.join(" "));

	} else {
		log("未找到演员信息");
	}
	
} catch (error) {
	log("请求失败: " + error);
	message("获取图片失败，请检查网络或番号");
}