$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $file = Get-ChildItem 'g:\My Drive\Web App\UrbanTree' -Filter "Khối lượng CVCX*" | Select-Object -First 1
    if ($file) {
        $wb = $excel.Workbooks.Open($file.FullName)
        foreach ($sheet in $wb.Sheets) {
            Write-Output "Sheet: $($sheet.Name)"
        }
        $wb.Close($false)
    } else {
        Write-Output "File not found"
    }
} finally {
    $excel.Quit()
}
