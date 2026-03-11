// --- MementoDB 导入自动创建关联条目脚本 ---
// 功能：在 CSV 导入后，自动查找关联条目，不存在则创建
// 适用场景：导入订单/记录时，自动创建不存在的客户/分类等关联数据

// --- 脚本配置区：请根据你的实际情况修改这里的值 ---
var config = {
  // 主数据所在的库：通常是当前库，使用 lib()
    mainLib: lib(),
  // 临时字段的精确名称：用于读取 CSV 导入的文本值
  tempFieldName: "演员",
  // 目标关联库的精确名称：要链接到的库，如 "客户库"
  targetLibName: "明星",
  // 目标关联库中用于匹配的唯一字段：通常是 "名称" 字段
  targetMatchField: "艺名",
  // 主数据中正式的“链接到条目”字段的精确名称
  linkFieldName: "明星1",
  
  // 是否忽略大小写：true=不区分大小写，false=严格区分
  ignoreCase: true,
  
  // 是否在处理后清空临时字段：true=清空，false=保留
  clearTempField: false
};
// --- 脚本配置结束 ---

/**
 * 安全获取字段值的字符串表示
 * @param {any} fieldValue - 从 MementoDB 获取的原始字段值
 * @returns {string} 处理后的字符串（去除首尾空格）
 */
function safeGetString(fieldValue) {
  // 处理 null 或 undefined
  if (fieldValue == null) {
    return '';
  }
  
  // 处理数组类型（MementoDB 某些字段可能返回数组）
  if (Array.isArray(fieldValue)) {
    // 如果是空数组，返回空字符串
    if (fieldValue.length === 0) {
      return '';
    }
    // 取数组第一个元素，并转为字符串
    fieldValue = fieldValue[0];
  }
  
  // 确保转为字符串
  var strValue;
  if (typeof fieldValue === 'string') {
    strValue = fieldValue;
  } else if (typeof fieldValue === 'number' || typeof fieldValue === 'boolean') {
    strValue = String(fieldValue);
  } else if (fieldValue.toString) {
    strValue = fieldValue.toString();
  } else {
    strValue = '';
  }
  
  // 去除首尾空格
  return strValue.trim();
}

/**
 * 比较两个字符串是否相等
 * @param {string} str1 
 * @param {string} str2 
 * @returns {boolean}
 */
function stringsEqual(str1, str2) {
  if (config.ignoreCase) {
    return str1.toLowerCase() === str2.toLowerCase();
  }
  return str1 === str2;
}

function main() {
  // 获取目标关联库
  var targetLib = libByName(config.targetLibName);
  if (!targetLib) {
    message("❌ 错误：找不到目标库 '" + config.targetLibName + "'。请检查库名和脚本权限。");
    return;
  }

  // 获取所有需要处理的条目（当前库的所有条目）
  // 提示：如果只想处理未关联的，可以添加筛选条件
  var entriesToProcess = config.mainLib.entries();
  var processedCount = 0;
  var createdCount = 0;
  var skippedCount = 0;
  var errorCount = 0;

  // 记录开始处理
  log("🔄 开始处理 " + entriesToProcess.length + " 个条目...");

  for (var i = 0; i < entriesToProcess.length; i++) {
    var currentEntry = entriesToProcess[i];
    
    try {
      // 读取临时字段的值（即 CSV 中的关联标识，如客户姓名）
      var rawIdentifier = currentEntry.field(config.tempFieldName);
      
      // 安全转换为字符串
      var linkIdentifier = safeGetString(rawIdentifier);
      
      // 检查临时字段是否为空
      if (linkIdentifier === '') {
        // 临时字段为空，跳过
        continue;
      }

      // 检查是否已经关联过了（避免重复处理）
      var existingLinks = currentEntry.field(config.linkFieldName);
      if (existingLinks && existingLinks.length > 0) {
        // 已经有关联条目，跳过
        skippedCount++;
        continue;
      }

      log("  处理: '" + linkIdentifier + "'");

      // 在目标关联库中查找是否存在该标识的条目
      // 使用 find 进行模糊搜索，然后精确匹配
      var foundEntries = targetLib.find(linkIdentifier);
      var targetEntry = null;

      // 精确匹配：遍历搜索结果，找到字段值完全相等的条目
      for (var j = 0; j < foundEntries.length; j++) {
        var currentFound = foundEntries[j];
        var fieldValue = currentFound.field(config.targetMatchField);
        
        // 安全获取字段值的字符串表示
        var fieldValueStr = safeGetString(fieldValue);
        
        // 如果字段值为空，跳过这个搜索结果
        if (fieldValueStr === '') {
          continue;
        }
        
        // 比较是否相等（根据配置决定是否忽略大小写）
        if (stringsEqual(fieldValueStr, linkIdentifier)) {
          targetEntry = currentFound;
          log("    ✓ 找到现有条目: " + fieldValueStr);
          break;
        }
      }

      // 如果没找到，则创建新条目
      if (!targetEntry) {
        log("    ✗ 未找到，创建新条目: " + linkIdentifier);
        
        var newEntryData = {};
        newEntryData[config.targetMatchField] = linkIdentifier; // 将标识作为新条目的名称
        
        // 在这里可以添加更多默认字段值，例如：
        // newEntryData["状态"] = "正常";
        // newEntryData["创建来源"] = "CSV导入";
        
        targetEntry = targetLib.create(newEntryData);
        
        if (targetEntry) {
          createdCount++;
          log("    ✓ 创建成功");
        } else {
          log("    ❌ 创建失败");
          errorCount++;
          continue;
        }
      }

      // 建立链接：将找到或新建的条目，链接到主条目的链接字段上
      if (targetEntry) {
        currentEntry.link(config.linkFieldName, targetEntry);
        processedCount++;
        log("    🔗 已关联");
      }
      
    } catch (e) {
      // 捕获并记录单个条目的错误，避免整个脚本中断
      log("❌ 处理条目时出错: " + e.message);
      log("   条目ID: " + (currentEntry.id ? currentEntry.id : "未知"));
      errorCount++;
    }
  }

  // 处理完成后清空临时字段（可选）
  if (config.clearTempField) {
    log("🧹 正在清空临时字段...");
    var clearCount = 0;
    for (var k = 0; k < entriesToProcess.length; k++) {
      var entry = entriesToProcess[k];
      var currentValue = entry.field(config.tempFieldName);
      if (currentValue && currentValue !== '') {
        entry.set(config.tempFieldName, "");
        clearCount++;
      }
    }
    log("   已清空 " + clearCount + " 个条目的临时字段");
  }

  // 输出最终统计信息
  var summary = "✅ 处理完成！\n" +
    "📊 统计信息：\n" +
    "   - 成功关联: " + processedCount + " 条\n" +
    "   - 新建条目: " + createdCount + " 个\n" +
    "   - 已跳过(已关联): " + skippedCount + " 条\n" +
    "   - 处理失败: " + errorCount + " 条";
  
  log(summary);
  message(summary);
}

// 执行主函数
try {
  main();
} catch (e) {
  log("❌ 脚本执行出错: " + e.message);
  log(e.stack);
  message("脚本执行失败: " + e.message);
}