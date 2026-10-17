
```vba
Option Explicit

' =======================================================
' PaperBell MD→Word 格式工具箱 v0.1
' 用途: Pandoc 导出 Word 后的一键格式修复
' =======================================================

Sub PaperBell_MD2Word_VBA()
    Dim userChoice As String
    Dim msg As String

    ' 构建菜单界面
    msg = "【PaperBell MD→Word 格式工具箱 v0.1】请选择功能：" & vbCrLf & vbCrLf & _
          "1. 智能括号与引用修复" & vbCrLf & _
          "   (修复 (图x)、[1]、中文前后括号、数字后空格)" & vbCrLf & vbCrLf & _
          "2. 标点符号标准化" & vbCrLf & _
          "   (含：:空格->空格 | 全角逗号、句号、分号...)" & vbCrLf & vbCrLf & _
          "3. 深度空格清理" & vbCrLf & _
          "   (删除中英文之间空格 | 删除汉数间空格)" & vbCrLf & vbCrLf & _
          "4. 图片样式统一" & vbCrLf & _
          "   (将所有图片设置为'图片'样式)" & vbCrLf & vbCrLf & _
          "5. Zotero 引用变蓝" & vbCrLf & _
          "   (将所有 Zotero 引文域设置为蓝色)" & vbCrLf & vbCrLf & _
          "6. MD表格一键规整三线表" & vbCrLf & _
          "   (标准三线表、五号字、居中对齐、适配页边距)" & vbCrLf & vbCrLf & _
          "7. 精确空格与引号字体修复" & vbCrLf & _
          "   (关闭亚洲自动间距 | 清除NBSP/全角空格等特殊字符 | 引号字体统一宋体)" & vbCrLf & vbCrLf & _
          "0. 执行所有功能 (1 + 2 + 3 + 4 + 5 + 6 + 7)" & vbCrLf & vbCrLf & _
          "------------------------------------------------" & vbCrLf & _
          "请输入数字（支持组合，如 135 表示执行1、3和5）："

    ' 弹出输入框
    userChoice = InputBox(msg, "PaperBell 格式修复控制台 v0.1", "0")

    ' 如果用户点击取消或未输入
    If userChoice = "" Then Exit Sub

    Application.ScreenUpdating = False ' 关闭屏幕刷新

    ' === 模块 1：括号与引用 ===
    If InStr(userChoice, "1") > 0 Or InStr(userChoice, "0") > 0 Then
        Call Module_BracketsAndCitations
    End If

    ' === 模块 2：标点符号 ===
    If InStr(userChoice, "2") > 0 Or InStr(userChoice, "0") > 0 Then
        Call Module_Punctuation
    End If

    ' === 模块 3：空格清理 ===
    If InStr(userChoice, "3") > 0 Or InStr(userChoice, "0") > 0 Then
        Call Module_SpaceCleaning
    End If

    ' === 模块 4：图片样式 ===
    If InStr(userChoice, "4") > 0 Or InStr(userChoice, "0") > 0 Then
        Call Module_SetPictureStyle
    End If

    ' === 模块 5：Zotero 引用变蓝 ===
    If InStr(userChoice, "5") > 0 Or InStr(userChoice, "0") > 0 Then
        Call Module_ZoteroCitationBlue
    End If

    ' === 模块 6：三线表规整 ===
    If InStr(userChoice, "6") > 0 Or InStr(userChoice, "0") > 0 Then
        Call Module_ThreeLineTable
    End If

    ' === 模块 7：精确空格与引号字体 ===
    If InStr(userChoice, "7") > 0 Or InStr(userChoice, "0") > 0 Then
        Call Module_FixSpacingAndQuoteFont
    End If

    Application.ScreenUpdating = True
    MsgBox "所选任务执行完毕！", vbInformation, "完成"

End Sub

' =======================================================
' 子模块 1：括号与引用修复
' =======================================================
Sub Module_BracketsAndCitations()
    Dim myRange As Range
    Set myRange = ActiveDocument.Content
    With myRange.Find
        .ClearFormatting
        .Replacement.ClearFormatting
        .MatchWildcards = True

        ' 0.1 【调整】将 "( 图" 替换为 "(图"
        .Text = "\([ 	]{1,}图"
        .Replacement.Text = "(图"
        .Execute Replace:=wdReplaceAll

        ' 0.2 【优先】去除数字和 ) 之间的空格 (2023 ) -> (2023)
        .Text = "([0-9])[ 	]{1,}\)"
        .Replacement.Text = "\1)"
        .Execute Replace:=wdReplaceAll

        ' 0.3 【优先】去除数字和全角 ） 之间的空格
        .Text = "([0-9])[ 	]{1,}）"
        .Replacement.Text = "\1）"
        .Execute Replace:=wdReplaceAll

        ' 1. 中文后的半角左括号 ( -> （
        .Text = "([!^1-^127])\("
        .Replacement.Text = "\1（"
        .Execute Replace:=wdReplaceAll

        ' 2. ) -> ） | 汉字/数字后右括号转全角
        .Text = "\)([!^1-^127])"
        .Replacement.Text = "）\1"
        .Execute Replace:=wdReplaceAll

        ' 5. (图/表xx) -> (图/表xx）兜底修复
        .Text = "(图[0-9]@)\)"
        .Replacement.Text = "\1）"
        .Execute Replace:=wdReplaceAll
        .Text = "(表[0-9]@)\)"
        .Replacement.Text = "\1）"
        .Execute Replace:=wdReplaceAll

        ' 11. 清理引用文献方括号内的多余空格 [ 1 ] -> [1]
        .Text = "\[[ ]{1,}"
        .Replacement.Text = "["
        .Execute Replace:=wdReplaceAll
        .Text = "[ ]{1,}\]"
        .Replacement.Text = "]"
        .Execute Replace:=wdReplaceAll
    End With
End Sub

' =======================================================
' 子模块 2：标点符号标准化
' =======================================================
Sub Module_Punctuation()
    Dim myRange As Range
    Set myRange = ActiveDocument.Content
    With myRange.Find
        .ClearFormatting
        .Replacement.ClearFormatting
        .MatchWildcards = True

        ' 0. 【新增】将 ": " (冒号空格) 替换为 " " (空格)
        .Text = ": "
        .Replacement.Text = " "
        .Execute Replace:=wdReplaceAll

        ' 4. ; -> ； | 中文间分号
        .Text = "([!^1-^127]);([!^1-^127])"
        .Replacement.Text = "\1；\2"
        .Execute Replace:=wdReplaceAll

        ' 6. . -> 。 | 中文后句号
        .Text = "([!^1-^127])\."
        .Replacement.Text = "\1。"
        .Execute Replace:=wdReplaceAll

        ' 7. , -> ， | 中文间逗号
        .Text = "([!^1-^127]),([!^1-^127])"
        .Replacement.Text = "\1，\2"
        .Execute Replace:=wdReplaceAll

        ' 9. :?! -> ：？！ | 冒号问号感叹号
        .Text = "([!^1-^127]):"
        .Replacement.Text = "\1："
        .Execute Replace:=wdReplaceAll

        .Text = "([!^1-^127])\?"
        .Replacement.Text = "\1？"
        .Execute Replace:=wdReplaceAll

        .Text = "([!^1-^127])\!"
        .Replacement.Text = "\1！"
        .Execute Replace:=wdReplaceAll
    End With
End Sub

' =======================================================
' 子模块 3：深度空格清理 (含中英文去空)
' =======================================================
Sub Module_SpaceCleaning()
    Dim myRange As Range
    Set myRange = ActiveDocument.Content
    With myRange.Find
        .ClearFormatting
        .Replacement.ClearFormatting
        .MatchWildcards = True

        ' 3. 句号和中文之间的空格去掉
        .Text = "([。\.])[ ]{1,}([!^1-^127])"
        .Replacement.Text = "\1\2"
        .Execute Replace:=wdReplaceAll

        ' 10. 50 % -> 50%
        .Text = "([0-9])[ ]{1,}%"
        .Replacement.Text = "\1%"
        .Execute Replace:=wdReplaceAll

        ' 12. 去除汉字和数字之间的空格 (单向: 汉 空 数 -> 汉数)
        ' 保留 [数字] [空格] [汉字]
        .Text = "([!^1-^127])[ ]{1,}([0-9])"
        .Replacement.Text = "\1\2"
        .Execute Replace:=wdReplaceAll

        ' ----------------------------------------------------
        ' 13. 去除中英文之间的空格 (双向)
        ' ----------------------------------------------------

        ' Case A: [汉字] [空格] [英文] -> [汉字][英文]
        ' 例如：方案 A -> 方案A
        .Text = "([!^1-^127])[ ]{1,}([a-zA-Z])"
        .Replacement.Text = "\1\2"
        .Execute Replace:=wdReplaceAll

        ' Case B: [英文] [空格] [汉字] -> [英文][汉字]
        ' 例如：Word 文档 -> Word文档
        .Text = "([a-zA-Z])[ ]{1,}([!^1-^127])"
        .Replacement.Text = "\1\2"
        .Execute Replace:=wdReplaceAll

        ' 8. 删除中文及全角字符之间的空格 (最后执行，兜底)
        .Text = "([!^1-^127])[ ]{1,}([!^1-^127])"
        .Replacement.Text = "\1\2"
        .Execute Replace:=wdReplaceAll
    End With
End Sub

' =======================================================
' 子模块 4：图片样式统一
' =======================================================
Sub Module_SetPictureStyle()
    Dim inlinePic As InlineShape
    Dim floatPic As Shape
    Dim picStyleName As String

    ' 定义样式名称
    picStyleName = "图片"

    ' 安全检查
    On Error Resume Next
    Dim testStyle As Style
    Set testStyle = ActiveDocument.Styles(picStyleName)
    If Err.Number <> 0 Then
        MsgBox "文档中缺少「" & picStyleName & "」样式，图片处理已跳过。", vbExclamation
        Err.Clear
        Exit Sub
    End If

    For Each inlinePic In ActiveDocument.InlineShapes
        If inlinePic.Type = wdInlineShapePicture Then
            inlinePic.Range.Style = picStyleName
        End If
    Next inlinePic

    For Each floatPic In ActiveDocument.Shapes
        If floatPic.Type = msoPicture Then
            On Error Resume Next
            floatPic.TextFrame.TextRange.Style = picStyleName
            On Error GoTo 0
        End If
    Next floatPic

    On Error GoTo 0
End Sub

' =======================================================
' 子模块 5：Zotero 引用变蓝
' =======================================================
Sub Module_ZoteroCitationBlue()
    Dim fld As Field

    For Each fld In ActiveDocument.Fields
        If InStr(1, Trim$(fld.Code.Text), "ADDIN ZOTERO_ITEM CSL_CITATION", vbTextCompare) = 1 Then
            fld.Result.Font.Color = wdColorBlue
        End If
    Next fld
End Sub

' =======================================================
' 子模块 6：MD表格一键规整三线表
' =======================================================
Sub Module_ThreeLineTable()
    Dim tbl As Table
    Dim cel As Cell
    Dim row As Row
    Dim borders As Border

    ' 遍历文档所有表格
    For Each tbl In ActiveDocument.Tables
        ' 1. 自动调整表格：适配页面、自动列宽，不超页边距
        tbl.AutoFitBehavior wdAutoFitWindow
        tbl.PreferredWidthType = wdPreferredWidthPercent
        tbl.PreferredWidth = 100

        ' 2. 清除所有默认边框
        tbl.Borders(wdBorderTop).LineStyle = wdLineStyleNone
        tbl.Borders(wdBorderLeft).LineStyle = wdLineStyleNone
        tbl.Borders(wdBorderRight).LineStyle = wdLineStyleNone
        tbl.Borders(wdBorderBottom).LineStyle = wdLineStyleNone
        tbl.Borders(wdBorderHorizontal).LineStyle = wdLineStyleNone
        tbl.Borders(wdBorderVertical).LineStyle = wdLineStyleNone

        ' 3. 设置标准三线表：顶线、表头中线、底线
        ' 顶线 1.5磅
        With tbl.Borders(wdBorderTop)
            .LineStyle = wdLineStyleSingle
            .LineWidth = wdLineWidth150pt
        End With
        ' 表头下中线 0.75磅
        If tbl.Rows.Count >= 2 Then
            tbl.Rows(1).Borders(wdBorderBottom).LineStyle = wdLineStyleSingle
            tbl.Rows(1).Borders(wdBorderBottom).LineWidth = wdLineWidth075pt
        End If
        ' 底线 1.5磅
        With tbl.Borders(wdBorderBottom)
            .LineStyle = wdLineStyleSingle
            .LineWidth = wdLineWidth150pt
        End With

        ' 4. 全表格字体：五号字、宋体
        tbl.Range.Font.Name = "宋体"
        tbl.Range.Font.Size = 10.5 ' 五号字对应10.5磅

        ' 5. 所有单元格 水平居中 + 垂直居中
        For Each row In tbl.Rows
            For Each cel In row.Cells
                cel.Range.ParagraphFormat.Alignment = wdAlignParagraphCenter
                cel.VerticalAlignment = wdAlignVerticalCenter
                ' 单元格内边距微调，避免太挤
                cel.TopPadding = 3
                cel.BottomPadding = 3
                cel.LeftPadding = 5
                cel.RightPadding = 5
            Next cel
        Next row

        ' 6. 禁止表格跨列乱换行、自动规整文字换行
        tbl.Range.ParagraphFormat.WordWrap = True
    Next tbl
End Sub

' =======================================================
' 子模块 7：精确空格与引号字体修复
' =======================================================
Sub Module_FixSpacingAndQuoteFont()
    Dim rng As Range
    Set rng = ActiveDocument.Content

    Call DisableAsianAutoSpacing(rng)
    Call RemoveWeirdSpaces(rng)
    Call SetQuoteFontSongti(rng)
End Sub

' --- 模块7 辅助：关闭亚洲文字自动间距 ---
Sub DisableAsianAutoSpacing(ByVal rng As Range)
    Dim p As Paragraph
    For Each p In rng.Paragraphs
        On Error Resume Next
        p.Range.ParagraphFormat.AddSpaceBetweenFarEastAndAlpha = False
        p.Range.ParagraphFormat.AddSpaceBetweenFarEastAndDigit = False
        On Error GoTo 0
    Next p
End Sub

' --- 模块7 辅助：清除特殊空格字符 ---
Sub RemoveWeirdSpaces(ByVal rng As Range)
    Dim i As Long

    ' 常见假空格/特殊分隔符
    ReplaceLiteralInRange rng, ChrW(160), ""      ' NBSP
    ReplaceLiteralInRange rng, ChrW(12288), ""    ' 全角空格
    ReplaceLiteralInRange rng, ChrW(9675), ""     ' ○
    ReplaceLiteralInRange rng, ChrW(183), ""      ' ·
    ReplaceLiteralInRange rng, ChrW(8226), ""     ' •
    ReplaceLiteralInRange rng, vbTab, ""

    ' 图表式编号空格
    For i = 0 To 300
        ReplaceLiteralInRange rng, "图 " & CStr(i), "图" & CStr(i)
        ReplaceLiteralInRange rng, "表 " & CStr(i), "表" & CStr(i)
        ReplaceLiteralInRange rng, "式 " & CStr(i), "式" & CStr(i)
    Next i

    ' 常见写法
    ReplaceLiteralInRange rng, "见 图", "见图"
    ReplaceLiteralInRange rng, "见 表", "见表"
    ReplaceLiteralInRange rng, "见 式", "见式"
    ReplaceLiteralInRange rng, "(见 图", "(见图"
    ReplaceLiteralInRange rng, "（见 图", "（见图"

    ' 引用前后空隙
    ReplaceLiteralInRange rng, "[ ", "["
    ReplaceLiteralInRange rng, " ]", "]"
    ReplaceLiteralInRange rng, " [", "["
    ReplaceLiteralInRange rng, "] ", "]"

    ' 反复压缩普通空格
    For i = 1 To 5
        ReplaceLiteralInRange rng, "  ", " "
    Next i
End Sub

' --- 模块7 辅助：引号字体统一宋体 ---
Sub SetQuoteFontSongti(ByVal rng As Range)
    SetOneCharFont rng, ChrW(8220), "宋体"   ' "
    SetOneCharFont rng, ChrW(8221), "宋体"   ' "
    SetOneCharFont rng, ChrW(8216), "宋体"   ' '
    SetOneCharFont rng, ChrW(8217), "宋体"   ' '
End Sub

Sub SetOneCharFont(ByVal rng As Range, ByVal targetChar As String, ByVal fontName As String)
    With rng.Find
        .ClearFormatting
        .Replacement.ClearFormatting
        .Text = targetChar
        .Replacement.Text = targetChar
        .Replacement.Font.NameFarEast = fontName
        .Replacement.Font.Name = fontName
        .Forward = True
        .Wrap = wdFindStop
        .Format = True
        .MatchWildcards = False
        .Execute Replace:=wdReplaceAll
    End With
End Sub

Sub ReplaceLiteralInRange(ByVal rng As Range, ByVal findText As String, ByVal replaceText As String)
    With rng.Find
        .ClearFormatting
        .Replacement.ClearFormatting
        .Text = findText
        .Replacement.Text = replaceText
        .Forward = True
        .Wrap = wdFindStop
        .Format = False
        .MatchWildcards = False
        .Execute Replace:=wdReplaceAll
    End With
End Sub
```
