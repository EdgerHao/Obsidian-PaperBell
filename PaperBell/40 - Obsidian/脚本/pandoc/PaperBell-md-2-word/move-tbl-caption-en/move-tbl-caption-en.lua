-- move-tbl-caption-en.lua
-- 将 "Table Caption EN" 的 div 移到对应表格上方
-- 使得 Word 输出顺序为：中文表题 → 英文表题 → 表格
--
-- 原理：
--   pandoc-crossref 处理后，表格的 caption.long 已包含带编号的中文标题。
--   本过滤器：
--   1. 将表格原生中文标题提取为独立的 custom-style="Table Caption" div
--   2. 清空表格原生标题
--   3. 按正确顺序插入：中文标题 div → 英文标题 div → 无标题表格
--
-- 用法：
--   pandoc input.md -o output.docx \
--     --filter pandoc-crossref \
--     --lua-filter move-tbl-caption-en.lua \
--     ...
--
-- 注意：必须在 pandoc-crossref 之后执行（--lua-filter 放在 --filter 之后即可）

function Pandoc(doc)
  local new_blocks = {}
  local blocks = doc.blocks
  local i = 1

  while i <= #blocks do
    local block = blocks[i]

    if block.t == 'Table' then
      -- 向后查找 "Table Caption EN" div（跳过空段落）
      local en_idx = nil
      local j = i + 1
      while j <= #blocks and j <= i + 4 do
        local nb = blocks[j]
        if nb.t == 'Div'
           and nb.attributes
           and nb.attributes['custom-style'] == 'Table Caption EN' then
          en_idx = j
          break
        elseif (nb.t == 'Para' and #nb.content == 0) or nb.t == 'Null' then
          -- 跳过空段落
          j = j + 1
        else
          break
        end
      end

      if en_idx then
        -- 1. 提取表格原生中文标题，包装为独立 div
        if block.caption and block.caption.long and #block.caption.long > 0 then
          local caption_div = pandoc.Div(
            block.caption.long,
            pandoc.Attr("", {}, {["custom-style"] = "Table Caption"})
          )
          table.insert(new_blocks, caption_div)
        end

        -- 2. 清空表格原生标题（避免重复显示）
        block.caption = pandoc.Caption({})

        -- 3. 插入英文标题 div
        table.insert(new_blocks, blocks[en_idx])

        -- 4. 插入无标题的表格
        table.insert(new_blocks, block)

        -- 跳过已处理的块（表格 + 空段落 + EN div）
        i = en_idx + 1
      else
        -- 没有 EN 标题的表格，保持原样
        table.insert(new_blocks, block)
        i = i + 1
      end
    else
      table.insert(new_blocks, block)
      i = i + 1
    end
  end

  return pandoc.Pandoc(new_blocks, doc.meta)
end
