-- bib-style.lua
-- 将 citeproc 生成的参考文献条目映射到 Word 的 "Bibliography" 样式
-- 用法: pandoc input.md -o output.docx --lua-filter=bib-style.lua --citeproc
function Div(el)
  if el.classes:includes("csl-entry") then
    el.attributes["custom-style"] = "Bibliography"
    return el
  end
end
