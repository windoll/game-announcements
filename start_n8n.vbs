Dim WshShell, fso, f, line, url, tmpPath, repoPath, pos1, pos2
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
url = ""
repoPath = "C:\Users\charlie98783\Desktop\game-announcements"

WshShell.Run "taskkill /f /im node.exe", 0, True
WshShell.Run "taskkill /f /im cloudflared.exe", 0, True

WshShell.Run "cmd.exe /c npx.cmd n8n start > %temp%\n8n_log.txt 2>&1", 0, False
WScript.Sleep 8000

WshShell.Run "cmd.exe /c npx.cmd cloudflared tunnel --url http://localhost:5678 --protocol http2 > %temp%\cf_log.txt 2>&1", 0, False
WScript.Sleep 10000

tmpPath = WshShell.ExpandEnvironmentStrings("%TEMP%")
If fso.FileExists(tmpPath & "\cf_log.txt") Then
  Set f = fso.OpenTextFile(tmpPath & "\cf_log.txt", 1)
  Do While Not f.AtEndOfStream
    line = f.ReadLine
    pos1 = InStr(line, "https://")
    If pos1 > 0 And InStr(line, "trycloudflare.com") > 0 Then
      pos2 = InStr(pos1, line, " ")
      If pos2 = 0 Then pos2 = Len(line) + 1
      url = Trim(Mid(line, pos1, pos2 - pos1))
    End If
  Loop
  f.Close
End If

If url <> "" Then
  Dim urlFile
  Set urlFile = fso.CreateTextFile(repoPath & "\n8n_url.txt", True)
  urlFile.Write url & "/webhook/send-announcement"
  urlFile.Close
  WshShell.Run "cmd.exe /c cd /d " & repoPath & " && git add n8n_url.txt && git commit -m ""update n8n url"" && git push", 0, True
  InputBox "URL pushed to GitHub:", "n8n started", url & "/webhook/send-announcement"
Else
  MsgBox "n8n started but no tunnel URL found. Check %temp%\cf_log.txt", 48, "n8n"
End If
