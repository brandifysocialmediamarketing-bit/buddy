' BUDDY Desktop App Launcher (Instant, Silent & Auto-Starting)
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

Function IsServerRunning()
  On Error Resume Next
  Dim http
  Set http = CreateObject("MSXML2.ServerXMLHTTP")
  http.setTimeouts 400, 400, 400, 400
  http.open "GET", "http://localhost:3456", False
  http.send
  If Err.Number = 0 Then
    IsServerRunning = True
  Else
    IsServerRunning = False
  End If
  On Error GoTo 0
End Function

' Start node server hidden if not already responding
If Not IsServerRunning() Then
  WshShell.CurrentDirectory = "d:\BUDDY"
  WshShell.Run "cmd /c node server.js", 0, False
  ' Wait until server responds
  Dim i
  For i = 1 To 15
    WScript.Sleep 250
    If IsServerRunning() Then Exit For
  Next
End If

' Open in Chrome App Window Mode for desktop experience
Dim chromePath
chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
If Not fso.FileExists(chromePath) Then
  chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
End If

If fso.FileExists(chromePath) Then
  WshShell.Run """" & chromePath & """ --app=http://localhost:3456", 1, False
Else
  WshShell.Run "http://localhost:3456", 1, False
End If
