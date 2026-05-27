with open('js/app.js', 'rb') as f:
    content = f.read().decode('utf-8', errors='replace')

old = '<span class="racer-name">${racer.name}</span>\n          <span class="racer-class class-${racer.class.toLowerCase()}">${racer.class}</span>'
new = '<span class="racer-name">${racer.name}</span>\n          <span class="racer-class class-${racer.class.toLowerCase()}">${racer.class}</span>\n          <span id="cs-badge-${racer.course}"></span>'

if old in content:
    content = content.replace(old, new)
    print("replaced!")
else:
    print("not found, searching...")
    idx = content.find('racer-name')
    print(repr(content[idx:idx+200]))

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
