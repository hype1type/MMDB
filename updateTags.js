// --- MementoDB 单个条目自动创建关联脚本 ---
// 功能：对当前处理的单个条目，自动查找关联条目，不存在则创建
// 适用场景：在自动化流程中逐条处理，或在界面上对当前条目操作

// --- 脚本配置区：请根据你的实际情况修改这里的值 ---
var config = {
  // 目标关联库的精确名称：要链接到的库，如 "客户库"
  targetLibName: "标签",
  
  // 目标关联库中用于匹配的唯一字段：通常是 "名称" 字段
  targetMatchField: "标签名",
  
  // 当前条目中存储临时值的字段名（从CSV导入的文本值）
  sourceFieldName: "标签",
  
  // 当前条目中正式的“链接到条目”字段的精确名称
  linkFieldName: "标签1",
  
  // 是否忽略大小写：true=不区分大小写，false=严格区分
  ignoreCase: true,
  
  // 是否在处理后清空源字段：true=清空，false=保留
  clearSourceField: false,
  
  // 创建新条目时的默认字段值（可选）
  defaultFields: {
    // "状态": "正常",
    // "创建来源": "自动创建",
    // "备注": "由导入脚本自动创建"
  },
  
  // 当源字段有多个值时（如多个演员），使用的分隔符
  multiValueSeparator: ",", // 设置为空字符串''表示不分割，作为整体处理
  
  // 处理模式：single(单个)/multiple(多个)
  processMode: "multiple", // multiple模式会用分隔符拆分，为每个值创建/查找关联
  
  // 失败时的行为：throw(抛出错误)/skip(跳过)/log(仅记录)
  onError: "log"
};
// --- 脚本配置结束 ---

/**
 * 安全获取字段值的字符串表示
 * @param {any} fieldValue - 从 MementoDB 获取的原始字段值
 * @returns {string} 处理后的字符串
 */
function safeGetString(fieldValue) {
  // 处理 null 或 undefined
  if (fieldValue == null) {
    return '';
  }
  
  // 处理数组类型
  if (Array.isArray(fieldValue)) {
    if (fieldValue.length === 0) {
      return '';
    }
    // 如果是数组，将所有非空值用分隔符连接
    var validValues = fieldValue.filter(function(v) { 
      return v != null && v !== ''; 
    });
    return validValues.join(config.multiValueSeparator + " ");
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
  
  // 移除可能的 [ 和 ] 字符
  strValue = strValue.replace(/\[|\]/g, '');
  
  return strValue.trim();
}

/**
 * 比较两个字符串是否相等
 */
function stringsEqual(str1, str2) {
  if (config.ignoreCase) {
    return str1.toLowerCase() === str2.toLowerCase();
  }
  return str1 === str2;
}

/**
 * 解析源字段值，根据配置拆分成多个标识
 * @param {string} sourceValue - 源字段的值
 * @returns {Array} 标识数组
 */
function parseIdentifiers(sourceValue) {
  if (!sourceValue || sourceValue === '') {
    return [];
  }
  
  // 根据处理模式决定如何解析
  if (config.processMode === "single" || !config.multiValueSeparator) {
    // 单个模式或没有分隔符，直接返回整个值
    var trimmed = sourceValue.trim();
    return trimmed ? [trimmed] : [];
  } else {
    // 多个模式，用分隔符拆分
    var identifiers = sourceValue.split(config.multiValueSeparator);
    
    // 清理每个标识的首尾空格
    var cleaned = [];
    for (var i = 0; i < identifiers.length; i++) {
      var trimmed = identifiers[i].trim();
      if (trimmed !== '') {
        cleaned.push(trimmed);
      }
    }
    return cleaned;
  }
}

/**
 * 在目标库中查找匹配的条目
 * @param {Object} targetLib - 目标库对象
 * @param {string} identifier - 要查找的标识
 * @returns {Object|null} 找到的条目或null
 */
function findMatchingEntry(targetLib, identifier) {
  // 使用 find 进行模糊搜索
  var foundEntries = targetLib.find(identifier);
  
  // 如果没有找到任何条目，返回 null
  if (!foundEntries || foundEntries.length === 0) {
    return null;
  }
  
  // 精确匹配：遍历搜索结果，找到字段值完全相等的条目
  for (var j = 0; j < foundEntries.length; j++) {
    var currentFound = foundEntries[j];
    var fieldValue = currentFound.field(config.targetMatchField);
    var fieldValueStr = safeGetString(fieldValue);
    
    if (fieldValueStr === '') {
      continue;
    }
    
    if (stringsEqual(fieldValueStr, identifier)) {
      return currentFound;
    }
  }
  
  return null;
}

/**
 * 创建新条目
 * @param {Object} targetLib - 目标库对象
 * @param {string} identifier - 条目标识
 * @returns {Object|null} 创建的条目或null
 */
function createNewEntry(targetLib, identifier) {
  var newEntryData = {};
  
  // 设置匹配字段的值
  newEntryData[config.targetMatchField] = identifier;
  newEntryData["照片"] = "http://192.168.31.125:5000/get_smb_image/profile/" + identifier + ".jpg";
  
  // 添加默认字段值
  // if (config.defaultFields) {
  //   for (var fieldName in config.defaultFields) {
  //     if (config.defaultFields.hasOwnProperty(fieldName)) {
  //       var fieldValue = config.defaultFields[fieldName];
  //       // 处理特殊值 {{now}} 表示当前时间
  //       if (fieldValue === "{{now}}") {
  //         fieldValue = new Date().toISOString().split('T')[0];
  //       }
  //       newEntryData[fieldName] = fieldValue;
  //     }
  //   }
  // }
  
  return targetLib.create(newEntryData);
}

/**
 * 处理单个条目的主函数
 * @param {Object} entry - 要处理的 MementoDB 条目对象
 * @returns {Object} 处理结果
 */
function processEntry(entry) {
  var result = {
    success: true,
    sourceValue: '',
    identifiers: [],
    processed: [],
    created: [],
    linked: [],
    skipped: [],
    errors: []
  };
  
  try {
    // 1. 验证条目
    if (!entry) {
      log("❌ 条目对象为空");
      result.success = false;
      result.message = "条目对象为空";
      return result;
    }
    
    // 2. 获取目标库
    var targetLib = libByName(config.targetLibName);
    if (!targetLib) {
      log("❌ 错误：找不到目标库 '" + config.targetLibName + "'。请检查库名和脚本权限。");
      result.success = false;
      result.message = "找不到目标库";
      return result;
    }
    
    // 3. 读取源字段的值
    var rawSourceValue = entry.field(config.sourceFieldName);
    result.sourceValue = safeGetString(rawSourceValue);
    
    if (result.sourceValue === '') {
      log("⏭️ 跳过: 源字段 '" + config.sourceFieldName + "' 为空");
      result.message = "源字段为空，无需处理";
      return result;
    }
    

    
    // 5. 解析标识符
    result.identifiers = parseIdentifiers(result.sourceValue);
    log("🔍 解析到 " + result.identifiers.length + " 个标识符: " + result.identifiers.join(", "));
        // 4. 检查是否已经关联
    var existingLinks = entry.field(config.linkFieldName);
    if (existingLinks && existingLinks.length >= result.identifiers.length) {
      // 获取已关联条目的名称，用于日志
      var linkedNames = [];
      for (var l = 0; l < existingLinks.length; l++) {
        var linkedEntry = existingLinks[l];
        var nameValue = linkedEntry.field(config.targetMatchField);
        linkedNames.push(safeGetString(nameValue) || "ID:" + linkedEntry.id);
      }
      
      log("⏭️ 条目已关联: " + linkedNames.join(", "));
      result.message = "条目已关联，如需重新关联请先清空关联字段";
      result.skipped = linkedNames;
      return result;
    }
    // 6. 为每个标识符查找或创建关联条目
    var linkedEntries = [];
    
    for (var i = 0; i < result.identifiers.length; i++) {
      var identifier = result.identifiers[i];
      
      try {
        // 查找现有条目
        var targetEntry = findMatchingEntry(targetLib, identifier);
        
        if (targetEntry) {
          result.processed.push(identifier);
          result.linked.push(identifier);
          log("  ✓ 找到现有条目: " + identifier);
        } else {
          // 创建新条目
          log("  ✗ 未找到，创建新条目: " + identifier);
          targetEntry = createNewEntry(targetLib, identifier);
          
          if (targetEntry) {
            result.created.push(identifier);
            result.processed.push(identifier);
            result.linked.push(identifier);
            log("  ✓ 创建成功: " + identifier);
          } else {
            log("创建条目失败: " + identifier);
          }
        }
        
        if (targetEntry) {
          linkedEntries.push(targetEntry);
        }
      } catch (e) {
        var errorMsg = "处理标识符 '" + identifier + "' 时出错: " + e.message;
        result.errors.push(errorMsg);
        
        if (config.onError === "throw") {
          throw e;
        } else {
          log("  ❌ " + errorMsg);
        }
      }
    }
    
    // 7. 建立关联
    if (linkedEntries.length > 0) {
      if (config.linkFieldName) {
        // 如果关联字段支持多值，直接设置数组
        entry.set(config.linkFieldName, linkedEntries);
        log("🔗 已关联 " + linkedEntries.length + " 个条目");
      } else {
        result.errors.push("关联字段名未配置");
      }
    }
    
    // 8. 可选：清空源字段
    if (config.clearSourceField && linkedEntries.length > 0) {
      entry.set(config.sourceFieldName, "");
      log("🧹 已清空源字段");
    }
    
    
    // 10. 设置结果消息
    result.message = generateResultMessage(result);
    
  } catch (e) {
    result.success = false;
    result.errors.push(e.message);
    log("❌ 处理条目时出错: " + e.message);
    log(e.stack);
  }
  
  return result;
}

/**
 * 生成结果消息
 */
function generateResultMessage(result) {
  if (!result.success) {
    return "处理失败: " + result.errors.join("; ");
  }
  
  var parts = [];
  if (result.created.length > 0) {
    parts.push("新建: " + result.created.length + "个");
  }
  if (result.linked.length > 0) {
    parts.push("关联: " + result.linked.length + "个");
  }
  if (result.skipped.length > 0) {
    parts.push("跳过: " + result.skipped.length + "个");
  }
  
  if (parts.length === 0) {
    return "无需处理";
  }
  
  return "处理完成: " + parts.join(", ");
}



// --- 单条目执行示例 ---

/**
 * 方式1：处理当前选中的条目（在界面脚本中使用）
 */
function UpdateTagDatabase() {
  var currentEntry = entry();
  if (!currentEntry) {
    log("❌ 请先选中一个条目");
    return;
  }
  
  log("开始处理当前条目: " + (currentEntry.id || "未知"));
  var result = processEntry(currentEntry);
  
  // 显示结果
  var summary = "源字段值: " + (result.sourceValue || "(空)") + "\n" +
    "处理状态: " + (result.success ? "✅ 成功" : "❌ 失败") + "\n" +
    "处理结果: " + result.message + "\n";
  
  if (result.created.length > 0) {
    summary += "新建条目: " + result.created.join(", ") + "\n";
  }
  if (result.linked.length > 0) {
    summary += "关联条目: " + result.linked.join(", ") + "\n";
  }
  if (result.errors.length > 0) {
    summary += "错误信息:\n  - " + result.errors.join("\n  - ");
  }
  
  //log(summary);
 // message(summary);
}

UpdateTagDatabase()
