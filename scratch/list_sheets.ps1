$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open('g:\My Drive\Web App\UrbanTree\2026-03-20_SLCX 1.26.xlsx')
    foreach ($sheet in $wb.Sheets) {
        Write-Output "Sheet: $($sheet.Name)"
    }
    $wb.Close($false)
} finally {
    $excel.Quit()
}
