from bs4 import BeautifulSoup

html_content = """
<div class="relative"><div class="bg-base border border-light rounded-lg overflow-hidden h-full"><div class="bg-base2 py-2 flex flex-col gap-2"><div class="px-2 flex items-center gap-2 text-xs"><div class="grow text-left whitespace-nowrap overflow-hidden"><div dir="rtl" class="overflow-hidden overflow-ellipsis"><span class="text-gray-400">adoa<!-- -->:</span><span class="font-bold text-gray-500">AD-2107</span></div></div><a rel="noopener noreferrer sponsored" href="https://click.duga.jp/ppv/adoa-2041/39588-1" target="_blank" class="text-center"><img class="rounded-sm" height="14px" width="14px" alt="duga" src="/img/duga.png"></a><div class="flex items-center gap-1"><a class="block font-bold" href="/works/date/2026-04-04">2026/04/04</a></div></div><div class="px-2 text-xs text-gray-500 flex"><div class="line-clamp-1"><a href="/makers/%E3%82%A2%E3%83%89%E3%82%A2">アドア</a></div><div class="line-clamp-1"><span class="text-gray-300 text-[9px] px-1">＞</span><a href="/labels/%E3%82%A2%E3%83%89%E3%82%A2">アドア</a></div><div class="line-clamp-1"><span class="text-gray-300 text-[9px] px-1">＞</span><a href="/series/%E3%81%8F%E3%81%99%E3%81%90%E3%82%8A%E5%80%8B%E6%92%AE%E3%81%AB%E6%9D%A5%E3%81%9F%E7%8F%BE%E5%BD%B9%E5%A5%B3%E5%AD%90%E5%A4%A7%E7%94%9F">くすぐり個撮に来た現役女子大生</a></div></div></div><div class="flex min-w-0 border-y border-light"><div class="flex items-center justify-center bg-base2 grow-0 shrink-0 w-28 h-40 basis-28"><a rel="noopener noreferrer sponsored" href="https://click.duga.jp/ppv/adoa-2041/39588-1" target="_blank" class=""><img class="text-xs" src="https://pic.duga.jp/unsecure/adoa/2041/noauth/160x120.jpg" alt="くすぐり個撮に来た現役女子大生 乳首くすぐり＆M男くすぐり まりな（5）" loading="lazy"></a></div><div class="grow flex flex-col border-l border-light"><div class="grow"><a class="text-md font-bold btn-ghost rounded-lg m-1 line-clamp-5" href="/works/adoa:AD-2107">くすぐり個撮に来た現役女子大生 乳首くすぐり＆M男くすぐり まりな（5）</a></div><div class="flex bg-base2 pl-2"></div></div></div><div class="bg-base-100 p-2 flex flex-wrap gap-2"></div></div></div>
"""

soup = BeautifulSoup(html_content, 'html.parser')

# 1. 提取作品ID (AST-139)
work_id_elem = soup.select_one('span.font-bold.text-gray-500')
work_id = work_id_elem.text.strip() if work_id_elem else None

# 2. 提取日期 (2026/04/04)
date_elem = soup.select_one('div.flex.items-center.gap-1 a.block.font-bold')
date = date_elem.text.strip() if date_elem else None

 # 2. 提取作品链接（标题上的链接）
title_link_elem = soup.select_one('a.text-md.font-bold[href^="/works/"]')
if title_link_elem:
    work_url = title_link_elem.get('href')
else:
    work_url = None


# 3. 提取制作商 (ルビー)
maker_elem = soup.select_one('div.line-clamp-1:first-child a[href^="/makers/"]')
maker = maker_elem.text.strip() if maker_elem else None

# 4. 提取标签 (Treasure（ルビー）)
label_elem = soup.select_one('div.line-clamp-1:nth-child(2) a[href^="/labels/"]')
label = label_elem.text.strip() if label_elem else None

# 5. 提取系列 (復刻コンプリートディスクシリーズ)
series_elem = soup.select_one('div.line-clamp-1:nth-child(3) a[href^="/series/"]')
series = series_elem.text.strip() if series_elem else None

# 6. 提取标题
title_elem = soup.select_one('a.text-md.font-bold[href^="/works/"]')
title = title_elem.text.strip() if title_elem else None

# 7. 提取封面图片URL
cover_elem = soup.select_one('div.flex.items-center.justify-center a img')
cover_url = cover_elem.get('src') if cover_elem else None

# 8. 提取所有演员
actors = []
actor_elems = soup.select('div.flex.flex-wrap.gap-2 a.chip.chip-sm')
for actor in actor_elems:
    name_span = actor.select_one('span:not(.avatar)')
    if name_span:
        actors.append(name_span.text.strip())
    else:
        # 如果没有单独span，尝试直接获取文本（忽略头像部分）
        actor_text = actor.get_text(strip=True)
        if actor_text:
            actors.append(actor_text)

# 打印结果
print(f"作品ID: {work_id}")
print(f"日期: {date}")
print(f"制作商: {maker}")
print(f"标签: {label}")
print(f"系列: {series}")
print(f"标题: {title}")
print(f"封面URL: {cover_url}")
print(f"演员: {', '.join(actors)}")
print(f"作品链接: {work_url}")
