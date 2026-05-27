import re
with open('js/app.js', 'rb') as f:
    content = f.read().decode('utf-8', errors='replace')

old = [line for line in content.split('\n') if 'statusLabel' in line and 'return' in line]
if old:
    content = content.replace(old[0], "  return { upcoming: '前売', exhibition: '展示中', racing: 'レース中', finished: '終了' }[s] || s;")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
