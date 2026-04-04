// ==UserScript==
// @name         提取电影卡片信息为CSV（含番号）
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  从网页中提取.movie-card的信息，包含番号、标题、日期、演员、图片地址，导出为CSV
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 添加一个按钮到页面上
    function addButton() {
        const button = document.createElement('button');
        button.textContent = '导出电影信息为CSV';
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '9999';
        button.style.padding = '8px 16px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';
        button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        button.addEventListener('click', extractAndSave);
        document.body.appendChild(button);
    }

    // 从标题中提取番号（例如：DFDM-073 或 DFDM-073｜xxx）
    function extractCode(title) {
        if (!title) return '';
        // 匹配常见番号格式：字母+数字+连字符+数字，例如 DFDM-073
        const match = title.match(/([A-Z]{2,6}-\d+)/);
        return match ? match[1] : '';
    }

    // 提取信息并保存为CSV
    function extractAndSave() {
        const movieCards = document.querySelectorAll('article.movie-card');
        if (movieCards.length === 0) {
            alert('未找到电影卡片（.movie-card）');
            return;
        }

        const data = [];
        // CSV表头：番号,标题,日期,演员,图片地址
        data.push(['作品 id','番号', '片名', '发布时间', '演员', '封面', '卡片']);

        movieCards.forEach(card => {
            // 提取标题
            const titleElem = card.querySelector('.movie-card-title');
            const title = titleElem ? titleElem.textContent.trim() : '';

            // 提取番号
            const code = extractCode(title);

            // 提取日期
            const dateElem = card.querySelector('.movie-card-date');
            let date = dateElem ? dateElem.textContent.trim() : '';
            date = date.replaceAll('-', '/');

            // 提取演员
            const castElem = card.querySelector('.movie-card-cast');
            let cast = castElem ? castElem.textContent.trim() : '';
            cast = cast.replaceAll('、', ' ');

            // 提取图片地址
            const imgElem = card.querySelector('.movie-card-cover');
            const imgSrc = imgElem ? imgElem.getAttribute('src') : '';

            data.push([code,code, title, date, cast, imgSrc,imgSrc]);
        });

        // 转换为CSV内容
        let csvContent = '';
        data.forEach(row => {
            const processedRow = row.map(cell => {
                if (cell === undefined || cell === null) cell = '';
                cell = String(cell);
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                    cell = cell.replace(/"/g, '""');
                    cell = `"${cell}"`;
                }
                return cell;
            });
            csvContent += processedRow.join(',') + '\n';
        });

        // 下载CSV文件
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        let exportTime = new Date().toISOString().split('T')[0];
        link.setAttribute('download', 'movie_data_' + exportTime + '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log(`已导出 ${movieCards.length} 条电影信息`);
    }

    // 等待页面加载完成后添加按钮
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addButton);
    } else {
        addButton();
    }
})();