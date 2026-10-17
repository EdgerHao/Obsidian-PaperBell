-- replace-nbsp.lua
-- 将不换行空格 (U+00A0) 替换为普通空格 (U+0020)
-- 解决 pandoc-crossref 等工具在导出 docx 时插入 NBSP 的问题

function Str(el)
  -- \194\160 是 U+00A0 的 UTF-8 编码
  el.text = el.text:gsub("\194\160", " ")
  return el
end
