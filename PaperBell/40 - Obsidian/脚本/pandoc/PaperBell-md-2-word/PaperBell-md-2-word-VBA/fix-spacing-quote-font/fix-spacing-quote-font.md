
```vba
Option Explicit

Sub Fix_Spacing_And_Quote_Font()
    Dim rng As Range
    Set rng = GetWorkRange()

    Application.ScreenUpdating = False

    Call DisableAsianAutoSpacing(rng)
    Call RemoveWeirdSpaces(rng)
    Call SetQuoteFontSongti(rng)

    Application.ScreenUpdating = True
    MsgBox "空隙和引号字体已处理完成。", vbInformation
End Sub

Function GetWorkRange() As Range
    If Selection.Range.Start <> Selection.Range.End Then
        Set GetWorkRange = Selection.Range.Duplicate
    Else
        Set GetWorkRange = ActiveDocument.Content
    End If
End Function

Sub DisableAsianAutoSpacing(ByVal rng As Range)
    Dim p As Paragraph
    For Each p In rng.Paragraphs
        On Error Resume Next
        p.Range.ParagraphFormat.AddSpaceBetweenFarEastAndAlpha = False
        p.Range.ParagraphFormat.AddSpaceBetweenFarEastAndDigit = False
        On Error GoTo 0
    Next p
End Sub

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

Sub SetQuoteFontSongti(ByVal rng As Range)
    SetOneCharFont rng, "“", "宋体"
    SetOneCharFont rng, "”", "宋体"
    SetOneCharFont rng, "‘", "宋体"
    SetOneCharFont rng, "’", "宋体"
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
