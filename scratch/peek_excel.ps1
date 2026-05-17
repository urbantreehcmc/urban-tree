$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $wb = $excel.Workbooks.Open('g:\My Drive\Web App\UrbanTree\2026-03-20_SLCX 1.26.xlsx')
    $sheet = $wb.Sheets.Item(1)
    for ($r=1; $r -le 10; $r++) {
        $row = ""
        for ($c=1; $c -le 25; $c++) {
            $val = $sheet.Cells.Item($r, $c).Text
            $row += """$val"","
        }
        Write-Output $row
    }
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
