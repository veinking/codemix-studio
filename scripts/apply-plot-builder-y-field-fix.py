from pathlib import Path

path = Path('src/components/PlotBuilder.tsx')
text = path.read_text()
old = """                  {chartType !== 'histogram' && chartType !== 'box' && (
                    <div>
                      <Label>Y-Axis Column {chartType === 'bar' ? '*' : ''}</Label>"""
new = """                  {requiresYColumn(chartType) && (
                    <div>
                      <Label>Y-Axis Column *</Label>"""
count = text.count(old)
if count != 1:
    raise SystemExit(f'Y field patch: expected one match, found {count}')
path.write_text(text.replace(old, new, 1))
print('patched Plot Builder Y field visibility')
